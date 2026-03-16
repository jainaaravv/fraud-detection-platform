"""
ML Training Pipeline for Fraud Detection
==========================================
Trains XGBoost classifier + Isolation Forest anomaly detector
on synthetic credit card fraud data and saves model artifacts.
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest
import joblib

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")


def generate_synthetic_dataset(n_samples: int = 20000, fraud_rate: float = 0.02):
    """
    Generate synthetic credit-card-fraud-style data (30 PCA-like features).
    Returns DataFrame with columns V1..V28, Amount, Time, Class.
    """
    np.random.seed(42)
    n_fraud = int(n_samples * fraud_rate)
    n_normal = n_samples - n_fraud

    # Normal transactions
    normal = np.random.randn(n_normal, 28) * 1.0
    normal_amount = np.abs(np.random.lognormal(3.0, 1.5, n_normal))
    normal_time = np.sort(np.random.uniform(0, 172800, n_normal))

    # Fraudulent transactions – shifted distribution
    fraud = np.random.randn(n_fraud, 28) * 1.5 + np.random.choice([-2, 2], size=(n_fraud, 28))
    fraud_amount = np.abs(np.random.lognormal(5.0, 2.0, n_fraud))
    fraud_time = np.random.uniform(0, 172800, n_fraud)

    features = np.vstack([normal, fraud])
    amounts = np.concatenate([normal_amount, fraud_amount])
    times = np.concatenate([normal_time, fraud_time])
    labels = np.concatenate([np.zeros(n_normal), np.ones(n_fraud)])

    cols = [f"V{i}" for i in range(1, 29)]
    df = pd.DataFrame(features, columns=cols)
    df["Amount"] = amounts
    df["Time"] = times
    df["Class"] = labels.astype(int)

    # ── Add Behavioral Features ──
    # Normal behavior probabilities
    df["failed_logins_24h"] = np.where(df["Class"] == 0, np.random.poisson(0.1, n_samples), np.random.poisson(2.5, n_samples))
    df["geo_mismatch"] = np.where(df["Class"] == 0, np.random.choice([0, 1], n_samples, p=[0.95, 0.05]), np.random.choice([0, 1], n_samples, p=[0.3, 0.7]))
    df["odd_hours"] = np.where(df["Class"] == 0, np.random.choice([0, 1], n_samples, p=[0.9, 0.1]), np.random.choice([0, 1], n_samples, p=[0.4, 0.6]))
    df["weekend_login"] = np.where(df["Class"] == 0, np.random.choice([0, 1], n_samples, p=[0.75, 0.25]), np.random.choice([0, 1], n_samples, p=[0.5, 0.5]))
    df["is_high_risk_merchant"] = np.where(df["Class"] == 0, np.random.choice([0, 1], n_samples, p=[0.9, 0.1]), np.random.choice([0, 1], n_samples, p=[0.2, 0.8]))

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def train_pipeline():
    """Full training pipeline."""
    print("=" * 60)
    print("  Fraud Detection ML Training Pipeline")
    print("=" * 60)

    # ── 1. Generate / Load data ───────────────────────────────────────────────
    print("\n[1/5] Generating synthetic credit card fraud dataset …")
    df = generate_synthetic_dataset(n_samples=20000, fraud_rate=0.02)
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(os.path.join(DATA_DIR, "fraud_dataset.csv"), index=False)
    print(f"      Dataset shape: {df.shape}")
    print(f"      Fraud rate:    {df['Class'].mean():.2%}")

    feature_cols = [c for c in df.columns if c != "Class"]
    X = df[feature_cols].values
    y = df["Class"].values

    # ── 2. Preprocessing ─────────────────────────────────────────────────────
    print("\n[2/5] Standardizing features …")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"      Train: {X_train.shape[0]}  |  Test: {X_test.shape[0]}")

    # ── 3. XGBoost Classifier ────────────────────────────────────────────────
    print("\n[3/5] Training XGBoost classifier …")
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=(y_train == 0).sum() / max((y_train == 1).sum(), 1),
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
    xgb.fit(X_train, y_train)

    y_pred = xgb.predict(X_test)
    y_prob = xgb.predict_proba(X_test)[:, 1]
    print("\n      XGBoost Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Fraud"]))
    print(f"      ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    # ── 4. Isolation Forest ──────────────────────────────────────────────────
    print("\n[4/5] Training Isolation Forest anomaly detector …")
    iso = IsolationForest(
        n_estimators=150,
        contamination=0.02,
        random_state=42,
    )
    iso.fit(X_train)

    iso_scores = iso.decision_function(X_test)
    # Normalize to [0, 1] – lower decision_function → more anomalous
    iso_norm = 1 - (iso_scores - iso_scores.min()) / (iso_scores.max() - iso_scores.min())
    print(f"      Anomaly score range: [{iso_norm.min():.3f}, {iso_norm.max():.3f}]")

    # ── 5. Save models ───────────────────────────────────────────────────────
    print("\n[5/5] Saving model artifacts …")
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(xgb, os.path.join(MODEL_DIR, "xgb_model.pkl"))
    joblib.dump(iso, os.path.join(MODEL_DIR, "isolation_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    print(f"      Models saved to {MODEL_DIR}/")

    # Combined score example
    combined = 0.7 * y_prob + 0.3 * iso_norm
    print(f"\n      Combined fraud score range: [{combined.min():.3f}, {combined.max():.3f}]")
    print("\n" + "=" * 60)
    print("  Training complete ✓")
    print("=" * 60)


if __name__ == "__main__":
    train_pipeline()

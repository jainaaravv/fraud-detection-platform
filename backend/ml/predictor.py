"""
ML Prediction Service — Singleton model loader with caching.
"""

import os
import numpy as np
import joblib
from typing import Tuple


class FraudPredictor:
    """Loads trained models once, provides fast prediction."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load_models(self):
        """Load model artifacts from disk (call once at startup)."""
        if self._loaded:
            return
        model_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models"
        )
        self.xgb_model = joblib.load(os.path.join(model_dir, "xgb_model.pkl"))
        self.iso_model = joblib.load(os.path.join(model_dir, "isolation_model.pkl"))
        self.scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
        self._loaded = True

    def predict(self, features: np.ndarray) -> Tuple[float, str]:
        """
        Predict fraud probability from raw feature vector.

        Parameters
        ----------
        features : np.ndarray, shape (30,)
            Raw feature values [V1..V28, Amount, Time].

        Returns
        -------
        (fraud_probability, risk_level)
        """
        if not self._loaded:
            self.load_models()

        X = self.scaler.transform(features.reshape(1, -1))

        # XGBoost probability
        xgb_prob = float(self.xgb_model.predict_proba(X)[0, 1])

        # Isolation Forest anomaly score (normalised to 0–1)
        iso_raw = float(self.iso_model.decision_function(X)[0])
        # Map: more negative → higher anomaly score
        iso_score = max(0.0, min(1.0, 0.5 - iso_raw))

        # Weighted combination
        fraud_probability = round(0.7 * xgb_prob + 0.3 * iso_score, 4)

        # Risk level
        if fraud_probability > 0.8:
            risk_level = "high"
        elif fraud_probability > 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"

        return fraud_probability, risk_level

    def predict_from_transaction(
        self,
        transaction_amount: float,
        merchant_id: str,
        user_id: str,
        location: str,
        device_id: str,
        failed_logins_24h: int = 0,
        geo_mismatch: bool = False,
        odd_hours: bool = False,
        weekend_login: bool = False,
        is_high_risk_merchant: bool = False,
    ) -> Tuple[float, str]:
        """
        Build a feature vector from transaction metadata and predict.
        Uses deterministic hashing to fill PCA-like features.
        """
        np.random.seed(
            hash((merchant_id, user_id, location, device_id)) % (2**31)
        )
        # Generate pseudo-PCA features from hashed metadata
        v_features = np.random.randn(28)
        # Inject transaction amount signal
        v_features[0] += np.log1p(transaction_amount) / 5
        # Location risk signal
        high_risk_locations = {"lagos", "moscow", "unknown", "vpn", "tor"}
        if location.lower() in high_risk_locations:
            v_features[1] -= 2.5
            v_features[3] -= 1.5

        # Format matches `train.py` columns: V1..V28, Amount, Time, failed_logins_24h, geo_mismatch, odd_hours, weekend_login, is_high_risk_merchant
        features_list = list(v_features)
        features_list.extend([
            float(transaction_amount),
            0.0,  # Time
            float(failed_logins_24h),
            1.0 if geo_mismatch else 0.0,
            1.0 if odd_hours else 0.0,
            1.0 if weekend_login else 0.0,
            1.0 if is_high_risk_merchant else 0.0
        ])
        
        features = np.array(features_list)
        return self.predict(features)


# Module-level singleton
predictor = FraudPredictor()

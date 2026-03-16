# Fraud Detection Platform

A production-style, full-stack fraud detection system with ML-based risk scoring, real-time APIs, and a live monitoring dashboard.

## Architecture

```
fraud-detection-platform/
├── backend/                  # FastAPI + SQLAlchemy backend
│   ├── main.py               # API application (FastAPI)
│   ├── ml/
│   │   ├── train.py           # XGBoost + Isolation Forest training pipeline
│   │   └── predictor.py       # Singleton prediction service
│   ├── database/
│   │   ├── config.py          # Async SQLAlchemy engine
│   │   ├── models.py          # ORM models (Transaction)
│   │   └── schemas.py         # Pydantic request/response schemas
│   ├── services/
│   │   └── fraud_service.py   # Business logic + analytics queries
│   ├── models/                # Trained ML model artifacts (.pkl)
│   └── requirements.txt
├── frontend/                 # React + TailwindCSS + Recharts
│   └── src/
│       ├── pages/             # Dashboard, Transactions, Alerts, Analytics
│       ├── components/        # Sidebar, StatsCard, RiskBadge, TransactionTable
│       └── api.js             # API client
├── scripts/
│   └── simulate_transactions.py  # Live transaction stream simulator
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
└── data/                     # Generated training data
```

## Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Frontend       | React, TailwindCSS, Recharts, Lucide React         |
| Backend        | FastAPI, Uvicorn, Pydantic                          |
| Database       | SQLite (dev) / PostgreSQL (prod, Supabase-ready)    |
| ORM            | SQLAlchemy (async)                                  |
| ML             | XGBoost, Isolation Forest, Scikit-learn, Joblib     |
| Deployment     | Docker, Docker Compose, Nginx                       |

## Quick Start

### 1. Train ML Models

```bash
cd fraud-detection-platform
pip install -r backend/requirements.txt
python -m backend.ml.train
```

This generates `models/xgb_model.pkl`, `models/isolation_model.pkl`, and `models/scaler.pkl`.

### 2. Run Backend

```bash
uvicorn backend.main:app --reload --port 8000
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`.

### 4. Simulate Transactions

```bash
python scripts/simulate_transactions.py
```

Generates ~1 transaction/second with ~5% suspicious patterns.

### 5. Docker (Full Stack)

```bash
cd docker
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## API Endpoints

| Method | Path                        | Description                   |
| ------ | --------------------------- | ----------------------------- |
| POST   | `/predict`                  | Score a transaction            |
| POST   | `/transactions`             | Create + auto-score            |
| GET    | `/transactions`             | List latest transactions       |
| GET    | `/alerts`                   | High-risk alerts (>80%)        |
| GET    | `/analytics`                | Aggregated metrics             |
| GET    | `/analytics/over-time`      | Hourly breakdown               |
| GET    | `/analytics/risk-distribution` | By risk level               |
| GET    | `/analytics/locations`      | By location                    |
| GET    | `/analytics/devices`        | By device                      |
| GET    | `/analytics/users`          | By user                        |
| GET    | `/health`                   | Health check                   |

## ML Pipeline

- **XGBoost Classifier**: Binary fraud classification with class-weight balancing
- **Isolation Forest**: Unsupervised anomaly detection
- **Combined Score**: `fraud_probability = 0.7 × xgb_prob + 0.3 × isolation_score`
- **Risk Levels**: Low (<40%), Medium (40–80%), High (>80%)

## Environment Variables

Copy `.env.example` to `.env`:

```
DATABASE_URL=sqlite+aiosqlite:///./fraud_detection.db
# For PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```

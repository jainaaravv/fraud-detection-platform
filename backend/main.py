"""
FastAPI application — Fraud Detection Platform API.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.config import get_session, init_db
from backend.database.schemas import (
    PredictRequest,
    PredictResponse,
    TransactionCreate,
    TransactionResponse,
    AnalyticsResponse,
    AlertResponse,
)
from backend.ml.predictor import predictor
from backend.services import fraud_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB + preload ML models."""
    await init_db()
    predictor.load_models()
    print("✓ Database initialized  |  ✓ ML models loaded")
    yield


app = FastAPI(
    title="Fraud Detection Platform API",
    description="Real-time ML-based transaction fraud scoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ────────────────────────────────────────────────────────────────


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """Score a transaction for fraud probability."""
    prob, level = predictor.predict_from_transaction(
        transaction_amount=req.transaction_amount,
        merchant_id=req.merchant_id,
        user_id=req.user_id,
        location=req.location,
        device_id=req.device_id,
    )
    return PredictResponse(fraud_probability=prob, risk_level=level)


@app.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    data: TransactionCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create and score a new transaction."""
    txn = await fraud_service.create_transaction(session, data.model_dump())
    return txn


@app.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """List latest transactions."""
    return await fraud_service.get_transactions(session, limit, offset)


@app.get("/alerts", response_model=list[AlertResponse])
async def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
):
    """List high-risk fraud alerts (probability > 0.8)."""
    return await fraud_service.get_alerts(session, limit)


@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(session: AsyncSession = Depends(get_session)):
    """Return aggregated analytics."""
    return await fraud_service.get_analytics(session)


@app.get("/analytics/over-time")
async def analytics_over_time(session: AsyncSession = Depends(get_session)):
    """Hourly transaction breakdown for charts."""
    return await fraud_service.get_transactions_over_time(session)


@app.get("/analytics/risk-distribution")
async def risk_distribution(session: AsyncSession = Depends(get_session)):
    """Transaction count by risk level."""
    return await fraud_service.get_risk_distribution(session)


@app.get("/analytics/locations")
async def location_stats(session: AsyncSession = Depends(get_session)):
    """Fraud stats grouped by location."""
    return await fraud_service.get_location_stats(session)


@app.get("/analytics/devices")
async def device_risk(session: AsyncSession = Depends(get_session)):
    """Fraud stats grouped by device."""
    return await fraud_service.get_device_risk(session)


@app.get("/analytics/users")
async def user_risk(session: AsyncSession = Depends(get_session)):
    """Fraud stats grouped by user."""
    return await fraud_service.get_user_risk(session)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "fraud-detection-api"}

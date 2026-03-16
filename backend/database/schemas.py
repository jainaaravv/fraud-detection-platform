"""
Pydantic schemas for request / response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Request schemas ──────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    transaction_amount: float = Field(..., gt=0, description="Transaction amount in USD")
    merchant_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    device_id: str = Field(..., min_length=1)
    
    # Behavioral features
    failed_logins_24h: int = Field(0, ge=0)
    geo_mismatch: bool = Field(False)
    odd_hours: bool = Field(False)
    weekend_login: bool = Field(False)
    is_high_risk_merchant: bool = Field(False)


class TransactionCreate(BaseModel):
    user_id: str = Field(..., min_length=1)
    merchant_id: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    location: str = Field(..., min_length=1)
    device_id: str = Field(..., min_length=1)
    
    # Behavioral features
    failed_logins_24h: int = Field(0, ge=0)
    geo_mismatch: bool = Field(False)
    odd_hours: bool = Field(False)
    weekend_login: bool = Field(False)
    is_high_risk_merchant: bool = Field(False)


# ─── Response schemas ─────────────────────────────────────────────────────────

class PredictResponse(BaseModel):
    fraud_probability: float
    risk_level: str


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    merchant_id: str
    amount: float
    location: str
    device_id: str
    timestamp: datetime
    
    failed_logins_24h: int
    geo_mismatch: bool
    odd_hours: bool
    weekend_login: bool
    is_high_risk_merchant: bool
    
    fraud_probability: float
    risk_level: str

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_transactions: int
    fraud_transactions: int
    fraud_rate: float
    high_risk_alerts: int
    avg_fraud_probability: float
    transactions_today: int


class AlertResponse(BaseModel):
    id: str
    user_id: str
    merchant_id: str
    amount: float
    location: str
    device_id: str
    timestamp: datetime
    
    failed_logins_24h: int
    geo_mismatch: bool
    odd_hours: bool
    weekend_login: bool
    is_high_risk_merchant: bool
    
    fraud_probability: float
    risk_level: str

    class Config:
        from_attributes = True

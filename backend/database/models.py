"""
SQLAlchemy ORM models — Supabase / PostgreSQL compatible schema.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Index, Integer, Boolean
from backend.database.config import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    merchant_id = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    device_id = Column(String, nullable=False)
    timestamp = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    
    # Behavioral features
    failed_logins_24h = Column(Integer, nullable=False, default=0)
    geo_mismatch = Column(Boolean, nullable=False, default=False)
    odd_hours = Column(Boolean, nullable=False, default=False)
    weekend_login = Column(Boolean, nullable=False, default=False)
    is_high_risk_merchant = Column(Boolean, nullable=False, default=False)
    
    # ML Scoring
    fraud_probability = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String, nullable=False, default="low")

    __table_args__ = (
        Index("ix_transactions_timestamp", "timestamp"),
        Index("ix_transactions_fraud_probability", "fraud_probability"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "merchant_id": self.merchant_id,
            "amount": self.amount,
            "location": self.location,
            "device_id": self.device_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "failed_logins_24h": self.failed_logins_24h,
            "geo_mismatch": self.geo_mismatch,
            "odd_hours": self.odd_hours,
            "weekend_login": self.weekend_login,
            "is_high_risk_merchant": self.is_high_risk_merchant,
            "fraud_probability": self.fraud_probability,
            "risk_level": self.risk_level,
        }

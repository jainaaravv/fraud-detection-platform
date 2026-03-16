"""
Fraud detection business logic service layer.
"""

from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.models import Transaction
from backend.ml.predictor import predictor


async def create_transaction(session: AsyncSession, data: dict) -> Transaction:
    """Create a new transaction, score it with ML models, and persist."""
    # Extract behavioral features (defaulting to safe values if missing)
    failed_logins = data.get("failed_logins_24h", 0)
    geo_mismatch = data.get("geo_mismatch", False)
    odd_hours = data.get("odd_hours", False)
    weekend_login = data.get("weekend_login", False)
    high_risk_merchant = data.get("is_high_risk_merchant", False)

    # 1. Get ML fraud prediction
    ml_fraud_prob, ml_risk_level = predictor.predict_from_transaction(
        transaction_amount=data["amount"],
        merchant_id=data["merchant_id"],
        user_id=data["user_id"],
        location=data["location"],
        device_id=data["device_id"],
        failed_logins_24h=failed_logins,
        geo_mismatch=geo_mismatch,
        odd_hours=odd_hours,
        weekend_login=weekend_login,
        is_high_risk_merchant=high_risk_merchant,
    )
    
    # 2. Apply Rule-Based Hybrid Scoring (inspired by fraud-pipeline-patrol)
    # Start with ML probability
    final_prob = ml_fraud_prob
    
    # Rule 1: Extreme behavioral mismatch
    if geo_mismatch and failed_logins >= 3:
        final_prob = max(final_prob, 0.95)
        
    # Rule 2: Night login + High risk merchant
    if odd_hours and high_risk_merchant:
        final_prob = max(final_prob, 0.85)
        
    # Rule 3: High failed logins
    if failed_logins >= 5:
        final_prob = max(final_prob, 0.90)

    # 3. Determine final risk level
    if final_prob > 0.8:
        final_risk_level = "high"
    elif final_prob > 0.4:
        final_risk_level = "medium"
    else:
        final_risk_level = "low"

    txn = Transaction(
        user_id=data["user_id"],
        merchant_id=data["merchant_id"],
        amount=data["amount"],
        location=data["location"],
        device_id=data["device_id"],
        failed_logins_24h=failed_logins,
        geo_mismatch=geo_mismatch,
        odd_hours=odd_hours,
        weekend_login=weekend_login,
        is_high_risk_merchant=high_risk_merchant,
        fraud_probability=final_prob,
        risk_level=final_risk_level,
    )
    session.add(txn)
    await session.commit()
    await session.refresh(txn)
    return txn


async def get_transactions(
    session: AsyncSession, limit: int = 50, offset: int = 0
) -> list[Transaction]:
    """Return transactions ordered by newest first."""
    result = await session.execute(
        select(Transaction)
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_alerts(session: AsyncSession, limit: int = 50) -> list[Transaction]:
    """Return high-risk transactions (fraud_probability > 0.8)."""
    result = await session.execute(
        select(Transaction)
        .where(Transaction.fraud_probability > 0.8)
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_analytics(session: AsyncSession) -> dict:
    """Return aggregated fraud analytics."""
    total = await session.execute(select(func.count(Transaction.id)))
    total_count = total.scalar() or 0

    fraud = await session.execute(
        select(func.count(Transaction.id)).where(Transaction.fraud_probability > 0.5)
    )
    fraud_count = fraud.scalar() or 0

    high_risk = await session.execute(
        select(func.count(Transaction.id)).where(Transaction.fraud_probability > 0.8)
    )
    high_risk_count = high_risk.scalar() or 0

    avg_prob = await session.execute(
        select(func.avg(Transaction.fraud_probability))
    )
    avg_prob_val = avg_prob.scalar() or 0.0

    # Today's transactions
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today = await session.execute(
        select(func.count(Transaction.id)).where(Transaction.timestamp >= today_start)
    )
    today_count = today.scalar() or 0

    return {
        "total_transactions": total_count,
        "fraud_transactions": fraud_count,
        "fraud_rate": round(fraud_count / max(total_count, 1), 4),
        "high_risk_alerts": high_risk_count,
        "avg_fraud_probability": round(float(avg_prob_val), 4),
        "transactions_today": today_count,
    }


async def get_transactions_over_time(session: AsyncSession) -> list[dict]:
    """Return hourly transaction counts for charting."""
    now = datetime.now(timezone.utc)
    hours_back = 24
    result = []

    for i in range(hours_back, -1, -1):
        start = now - timedelta(hours=i)
        end = now - timedelta(hours=i - 1) if i > 0 else now

        total = await session.execute(
            select(func.count(Transaction.id)).where(
                and_(Transaction.timestamp >= start, Transaction.timestamp < end)
            )
        )
        fraud = await session.execute(
            select(func.count(Transaction.id)).where(
                and_(
                    Transaction.timestamp >= start,
                    Transaction.timestamp < end,
                    Transaction.fraud_probability > 0.5,
                )
            )
        )
        result.append({
            "hour": start.strftime("%H:%M"),
            "total": total.scalar() or 0,
            "fraud": fraud.scalar() or 0,
        })
    return result


async def get_risk_distribution(session: AsyncSession) -> list[dict]:
    """Return count of transactions by risk level."""
    levels = ["low", "medium", "high"]
    result = []
    for level in levels:
        count = await session.execute(
            select(func.count(Transaction.id)).where(Transaction.risk_level == level)
        )
        result.append({"risk_level": level, "count": count.scalar() or 0})
    return result


async def get_location_stats(session: AsyncSession) -> list[dict]:
    """Return fraud stats by location."""
    result = await session.execute(
        select(
            Transaction.location,
            func.count(Transaction.id).label("total"),
            func.avg(Transaction.fraud_probability).label("avg_risk"),
            func.count(Transaction.id).filter(Transaction.fraud_probability > 0.5).label("fraud_count"),
        )
        .group_by(Transaction.location)
        .order_by(func.avg(Transaction.fraud_probability).desc())
        .limit(20)
    )
    rows = result.all()
    return [
        {
            "location": r[0],
            "total": r[1],
            "avg_risk": round(float(r[2] or 0), 4),
            "fraud_count": r[3],
        }
        for r in rows
    ]


async def get_device_risk(session: AsyncSession) -> list[dict]:
    """Return fraud stats by device."""
    result = await session.execute(
        select(
            Transaction.device_id,
            func.count(Transaction.id).label("total"),
            func.avg(Transaction.fraud_probability).label("avg_risk"),
        )
        .group_by(Transaction.device_id)
        .order_by(func.avg(Transaction.fraud_probability).desc())
        .limit(20)
    )
    rows = result.all()
    return [
        {"device_id": r[0], "total": r[1], "avg_risk": round(float(r[2] or 0), 4)}
        for r in rows
    ]


async def get_user_risk(session: AsyncSession) -> list[dict]:
    """Return fraud stats by user."""
    result = await session.execute(
        select(
            Transaction.user_id,
            func.count(Transaction.id).label("total"),
            func.avg(Transaction.fraud_probability).label("avg_risk"),
            func.sum(Transaction.amount).label("total_amount"),
        )
        .group_by(Transaction.user_id)
        .order_by(func.avg(Transaction.fraud_probability).desc())
        .limit(20)
    )
    rows = result.all()
    return [
        {
            "user_id": r[0],
            "total": r[1],
            "avg_risk": round(float(r[2] or 0), 4),
            "total_amount": round(float(r[3] or 0), 2),
        }
        for r in rows
    ]

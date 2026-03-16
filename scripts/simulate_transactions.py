"""
Simulated Transaction Stream
==============================
Generates fake transactions every second and posts them to the API.
"""

import time
import random
import httpx
import sys

API_URL = "http://localhost:8000"

USERS = [f"USR-{i:04d}" for i in range(1, 51)]
MERCHANTS = [f"MER-{i:04d}" for i in range(1, 31)]
DEVICES = [f"DEV-{i:04d}" for i in range(1, 21)]
LOCATIONS = [
    "New York", "London", "Tokyo", "Singapore", "Mumbai",
    "San Francisco", "Berlin", "Paris", "Sydney", "Toronto",
    "Lagos", "Moscow", "Dubai", "Hong Kong", "Seoul",
    "VPN", "Unknown", "Tor",  # Suspicious locations
]


def generate_transaction() -> dict:
    """Generate a random transaction, ~5% suspicious."""
    suspicious = random.random() < 0.05

    if suspicious:
        amount = round(random.uniform(5000, 50000), 2)
        location = random.choice(["Lagos", "Moscow", "VPN", "Unknown", "Tor"])
    else:
        amount = round(random.lognormvariate(3.5, 1.2), 2)
        location = random.choice(LOCATIONS[:15])

    # Inject behavioral features based on risk logic
    failed_logins = random.randint(3, 8) if suspicious else random.randint(0, 2)
    geo_mismatch = True if suspicious and random.random() < 0.6 else False
    odd_hours = True if suspicious and random.random() < 0.7 else (True if random.random() < 0.1 else False)
    weekend_login = True if random.random() < 0.25 else False
    is_high_risk_merchant = True if suspicious else (True if random.random() < 0.05 else False)

    return {
        "user_id": random.choice(USERS),
        "merchant_id": random.choice(MERCHANTS),
        "amount": amount,
        "location": location,
        "device_id": random.choice(DEVICES),
        "failed_logins_24h": failed_logins,
        "geo_mismatch": geo_mismatch,
        "odd_hours": odd_hours,
        "weekend_login": weekend_login,
        "is_high_risk_merchant": is_high_risk_merchant,
    }


def main():
    print("=" * 50)
    print("  Transaction Stream Simulator")
    print("=" * 50)
    print(f"  Target API: {API_URL}")
    print(f"  Press Ctrl+C to stop\n")

    count = 0
    fraud_count = 0

    with httpx.Client(timeout=10) as client:
        while True:
            txn = generate_transaction()
            try:
                resp = client.post(f"{API_URL}/transactions", json=txn)
                data = resp.json()
                count += 1

                risk = data.get("risk_level", "?")
                prob = data.get("fraud_probability", 0)

                icon = "🟢" if risk == "low" else "🟡" if risk == "medium" else "🔴"
                if risk == "high":
                    fraud_count += 1

                print(
                    f"  {icon} #{count:>5}  "
                    f"${txn['amount']:<10.2f}  "
                    f"{txn['location']:<15}  "
                    f"Risk: {prob:.3f} ({risk})"
                    f"{'  ⚠️  ALERT!' if risk == 'high' else ''}"
                )
            except Exception as e:
                print(f"  ❌ Error: {e}")

            time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Simulator stopped. ✓")
        sys.exit(0)

import random
from datetime import datetime, timedelta
from app.db.connection import get_db
def generate_otp():
    return str(random.randint(100000, 999999))

async def create_otp(email, db = get_db()):
    otp = generate_otp()

    await db.otp_store.delete_many({"email": email})

    await db.otp_store.insert_one({
        "email": email,
        "otp": otp,
        "verified": False,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    })

    return otp


async def verify_otp(email, otp, db = get_db()):
    record = await db.otp_store.find_one({"email": email})

    if not record:
        return False

    if record["expires_at"] < datetime.utcnow():
        return False

    if record["otp"] != otp:
        return False

    await db.otp_store.update_one(
        {"email": email},
        {"$set": {"verified": True}}
    )

    return True
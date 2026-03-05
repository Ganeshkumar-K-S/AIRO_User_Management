import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.utils.hash import hash_password
from datetime import datetime

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.airo
    
    # Check if user exists
    user = await db.users.find_one({"email": "test@example.com"})
    if not user:
        user_doc = {
            "full_name": "Test User",
            "email": "test@example.com",
            "password_hash": hash_password("password123"),
            "education": [],
            "skills": [],
            "projects": [],
            "experience": [],
            "certifications": [],
            "links": {},
            "achievements": [],
            "profile_score": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await db.users.insert_one(user_doc)
        print("Test user created: email 'test@example.com', password 'password123'")
    else:
        print("Test user already exists: email 'test@example.com'")

if __name__ == "__main__":
    asyncio.run(main())

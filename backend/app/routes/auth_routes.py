from fastapi import APIRouter, Depends, HTTPException
from app.db.connection import get_db
from app.models.auth_models import LoginRequest, SendOTP, SignupRequest
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated
from app.services.otp_service import create_otp, verify_otp, send_otp_email
from datetime import datetime
from app.utils.hash import hash_password, verify_password
from app.utils.jwt_handler import create_token

auth_router = APIRouter(prefix = '/auth')

@auth_router.post('/login')
async def login(
    data : LoginRequest, 
    db : Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    user = await db.users.find_one({"email" : data.email})

    if not user:
        raise HTTPException(401, "email doesn't exists")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "invalid password")
    token = create_token({"email" : user["email"]})
    return {
        "access_token" : token,
        "message" : "Login successfull"
    }

from fastapi import HTTPException

@auth_router.post("/send-otp")
async def send_otp(data: SendOTP):

    try:
        otp = await create_otp(data.email)

        if not otp:
            raise HTTPException(400, "OTP generation failed")

        await send_otp_email(data.email, otp)

        return {"message": "OTP sent successfully"}

    except Exception as e:
        raise HTTPException(500, f"Failed to send OTP: {str(e)}")

@auth_router.post("/signup")
async def signup(
    data: SignupRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "User already exists")

    valid = await verify_otp(data.email, data.otp)
    if not valid:
        raise HTTPException(400, "Invalid or expired OTP")

    user_doc = {
        "full_name": data.full_name,
        "email": data.email,
        "password_hash": hash_password(data.password),

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
    await db.otp_store.delete_many({"email": data.email})

    return {"message": "Account created successfully"}
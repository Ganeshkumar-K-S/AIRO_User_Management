from fastapi import APIRouter, Depends, HTTPException
from app.db.connection import get_db
from app.models.auth_models import LoginRequest
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated

auth_router = APIRouter(prefix = '/auth')

@auth_router.post('/login')
async def login(
    data : LoginRequest, 
    db : Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    user = await db.users.find_one({"email" : data.email})

    if not user:
        raise HTTPException(401, "Invalid credentials")
    
    if user["password_hash"] != data.password:
        raise HTTPException(401, "Invalid credentials")
    
    return {"message" : "Login successfull"}

# @auth_router.post("/register")

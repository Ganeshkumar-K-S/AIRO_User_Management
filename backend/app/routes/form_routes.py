from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from app.models.form_models import EducationModel, ProfileUpdate
from typing import Annotated, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.connection import get_db

form_router = APIRouter(prefix = "/form")

@form_router.get("/education/{email}")
async def get_education(
    email: str,
    db : Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    user_data = await db.users.find_one({
        "email" : email
    })

    if not user_data:
        return JSONResponse(
            status_code = 404, content = {
                "message" : "user not found"
            }
        )

    return {
        "email" : email,
        "education" : user_data.get("education", [])
    }

@form_router.post("/education")
async def update_education(
    data: List[EducationModel],
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        user_email = request.state.user["email"]

        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(404, "User not found")

        education_docs = [item.model_dump(exclude_none=True) for item in data]

        await db.users.update_one(
            {"email": user_email},
            {"$push": {"education": {"$each": education_docs}}}
        )

        return {"message": "Education details updated successfully"}

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(500, f"Internal Server Error: {str(e)}")
    
@form_router.patch("/update-profile")
async def update_profile(
    data: ProfileUpdate,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):

    try:
        email = request.state.user["email"]

        update_data = data.model_dump(exclude_none=True)

        if not update_data:
            raise HTTPException(400, "No data provided")

        await db.users.update_one(
            {"email": email},
            {"$set": update_data}
        )

        return {"message": "Profile updated successfully"}

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(500, f"Server error: {str(e)}")
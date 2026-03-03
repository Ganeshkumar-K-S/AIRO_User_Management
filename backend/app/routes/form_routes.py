from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from app.models.form_models import EducationModel, ProfileUpdate, LeetcodeCodeRequest, LeetcodeLinkRequest, LinkedinAddRequest, SummaryUpdate
from app.models.dev_models import GithubLinkRequest, GithubCodeRequest
from typing import Annotated, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.connection import get_db
from app.services.external_fetch.github_fetch import fetch_github
from app.services.external_fetch.leetcode_fetch import fetch_leetcode
import random
import string
from datetime import datetime
import httpx

form_router = APIRouter(prefix = "/form")

import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

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
    
@form_router.get("/get-profile/{email}")
async def get_profile(
    email: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        user_data = await db.users.find_one({"email": email})

        if not user_data:
            raise HTTPException(status_code=404, detail="user not found")

        user_data.pop("_id", None)

        # BUG FIX: GitHub data is stored in db.dev (separate collection),
        # not in db.users. Merge it in here so the frontend gets everything
        # from a single endpoint call.
        dev_data = await db.dev.find_one({"email": email})
        if dev_data:
            dev_data.pop("_id", None)
            dev_data.pop("email", None)
            dev_data.pop("created_at", None)
            dev_data.pop("updated_at", None)
            user_data.update(dev_data)  # merges github key into response

        return user_data

    except HTTPException as e:
        raise e

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}"}
        )


# Development
@form_router.post("/github/getcode")
async def get_git_code(
    data: GithubCodeRequest,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    email = request.state.user["email"]

    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    await db.github_verification.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "github_id": data.github_id,
                "code": code,
                "created_at": datetime.now()
            }
        },
        upsert=True
    )

    return {"verification_code": code}

@form_router.post("/github/link")
async def link_github(
    data: GithubLinkRequest,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        record = await db.github_verification.find_one({
            "email": email,
            "github_id": data.github_id,
            "code": data.code
        })

        if not record:
            raise HTTPException(400, "Invalid verification code")

        github_data = await fetch_github(data.github_id)

        github_data = await fetch_github(data.github_id)
        print("GITHUB RESPONSE:", github_data)

        if not github_data or "error" in github_data:
            raise HTTPException(404, "GitHub user not found")

        # BUG FIX: GitHub API returns `"bio": null` for users with no bio set.
        # dict.get("bio", "") only uses the fallback when the KEY is missing,
        # not when it's present but null. So bio could still be None here,
        # causing `data.code not in bio` to raise TypeError.
        bio = github_data.get("bio") or ""

        if data.code not in bio:
            raise HTTPException(401, "Code not found in GitHub bio")

        await db.dev.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "github": github_data,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        await db.github_verification.delete_many({"email": email})

        return {"message": "GitHub linked successfully"}

    except HTTPException as e:
        # BUG FIX: str(HTTPException) gives the full object repr, not the detail
        # message. Use e.detail to get the actual error string.
        return JSONResponse(
            status_code=e.status_code,
            content={"message": e.detail}
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}"}
        )

@form_router.patch("/github/update")
async def update_github(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        record = await db.dev.find_one({"email": email})

        if not record or "github" not in record:
            raise HTTPException(404, "GitHub account not linked")

        github_id = record["github"]["username"]

        github_data = await fetch_github(github_id)

        if not github_data or "error" in github_data:
            raise HTTPException(404, "GitHub user not found")

        await db.dev.update_one(
            {"email": email},
            {
                "$set": {
                    "github": github_data,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return {"message": "GitHub data updated successfully"}

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"message": e.detail}  # BUG FIX: was str(e), now e.detail
        )

    except Exception:
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"}
        )
    
@form_router.post("/leetcode/getcode")
async def get_leetcode_code(
    data: LeetcodeCodeRequest,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    email = request.state.user["email"]

    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    await db.leetcode_verification.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "leetcode_id": data.leetcode_id,
                "code": code,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return {"verification_code": code}

@form_router.post("/leetcode/link")
async def link_leetcode(
    data: LeetcodeLinkRequest,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        record = await db.leetcode_verification.find_one({
            "email": email,
            "leetcode_id": data.leetcode_id,
            "code": data.code
        })

        if not record:
            raise HTTPException(400, "Invalid verification code")

        leetcode_data = await fetch_leetcode(data.leetcode_id)

        if not leetcode_data or "error" in leetcode_data:
            raise HTTPException(404, "LeetCode user not found")

        bio = leetcode_data.get("about") or ""

        if data.code not in bio:
            raise HTTPException(401, "Code not found in LeetCode bio")

        await db.dev.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "leetcode": leetcode_data,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        await db.leetcode_verification.delete_many({"email": email})

        return {"message": "LeetCode linked successfully"}

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"message": e.detail}
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}"}
        )
    
@form_router.patch("/leetcode/update")
async def update_leetcode(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        record = await db.dev.find_one({"email": email})

        if not record or "leetcode" not in record:
            raise HTTPException(404, "LeetCode account not linked")

        leetcode_id = record["leetcode"]["username"]

        leetcode_data = await fetch_leetcode(leetcode_id)

        if not leetcode_data or "error" in leetcode_data:
            raise HTTPException(404, "LeetCode user not found")

        await db.dev.update_one(
            {"email": email},
            {
                "$set": {
                    "leetcode": leetcode_data,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return {"message": "LeetCode data updated successfully"}

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"message": e.detail}
        )

    except Exception:
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"}
        )
    
@form_router.post("/linkedin/add")
async def add_linkedin(
    data: LinkedinAddRequest,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        await db.dev.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "linkedin": data.linkedin_url,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        return {"message": "LinkedIn link added successfully"}

    except Exception:
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"}
        )
    
@form_router.get("/generate")
async def generate_profile(
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        user = await db.users.find_one({"email": email})
        dev = await db.dev.find_one({"email": email})

        if not user:
            raise HTTPException(404, "User not found")

        def safe(val, default):
            return val if val else default

        profile = {
            "id": str(user.get("_id", "")),
            "name": safe(user.get("full_name"), ""),
            "phone": safe(user.get("phone"), ""),
            "email": safe(user.get("email"), ""),

            "github": safe(dev.get("github", {}).get("username") if dev else "", ""),
            "linkedin": safe(user.get("links", {}).get("linkedin"), ""),

            "professional_summary": "",

            "education": safe(user.get("education"), []),

            "skills": [s.get("name") for s in user.get("skills", [])] if user.get("skills") else [],

            "skills_categorized": {},

            "experience": safe(user.get("experience"), []),

            "projects": safe(user.get("projects"), []),

            "certifications": safe(user.get("certifications"), []),

            "achievements": safe(user.get("achievements"), [])
        }

        return profile

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"message": e.detail}
        )

    except Exception:
        return JSONResponse(
            status_code=500,
            content={"message": "Internal Server Error"}
        )

@form_router.get("/github/contributions/{username}")
async def get_contributions(username: str):
    from app.core.config import settings

    query = """
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
    """

    LEVEL_MAP = {
        "NONE":           0,
        "FIRST_QUARTILE": 1,
        "SECOND_QUARTILE": 2,
        "THIRD_QUARTILE": 3,
        "FOURTH_QUARTILE": 4,
    }

    headers = {
        "Authorization": f"bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(
                "https://api.github.com/graphql",
                json={"query": query, "variables": {"login": username}},
                headers=headers,
            )

        if res.status_code != 200:
            raise HTTPException(502, "GitHub API error")

        data = res.json()

        if "errors" in data:
            raise HTTPException(404, "GitHub user not found")

        calendar = (
            data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
        )

        weeks = []
        for week in calendar["weeks"]:
            days = []
            for day in week["contributionDays"]:
                days.append({
                    "date":  day["date"],
                    "count": day["contributionCount"],
                    "level": LEVEL_MAP.get(day["contributionLevel"], 0),
                })
            weeks.append({"days": days})

        return {
            "total_contributions": calendar["totalContributions"],
            "weeks": weeks,
        }

    except HTTPException:
        raise

    except httpx.TimeoutException:
        raise HTTPException(504, "GitHub request timed out")

    except Exception as e:
        raise HTTPException(500, f"Internal error: {str(e)}")
    

@form_router.patch("/update-summary")
async def update_summary(
    data: SummaryUpdate,
    request: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    try:
        email = request.state.user["email"]

        if not data.professional_summary.strip():
            raise HTTPException(400, "Summary cannot be empty")

        result = await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "professional_summary": data.professional_summary,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(404, "User not found")

        return {"message": "Professional summary updated successfully"}

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"message": e.detail}
        )

    except Exception:
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"}
        )
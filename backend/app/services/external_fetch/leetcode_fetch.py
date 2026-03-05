import httpx
import asyncio
from datetime import datetime

async def fetch_leetcode(username: str):

    url = "https://leetcode.com/graphql"

    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
          realName
          aboutMe
          userAvatar
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """

    variables = {"username": username}

    payload = {
        "query": query,
        "variables": variables
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code != 200:
            return {"error": "Failed to fetch LeetCode profile"}

        data = response.json()

        user = data.get("data", {}).get("matchedUser")

        if not user:
            return {"error": "User not found"}

        stats = user["submitStats"]["acSubmissionNum"]

        difficulty_map = {i["difficulty"]: i["count"] for i in stats}

        return {
            "username": user["username"],
            "real_name": user["profile"].get("realName"),
            "ranking": user["profile"].get("ranking"),
            "reputation": user["profile"].get("reputation"),
            "about": user["profile"].get("aboutMe"),
            "avatar": user["profile"].get("userAvatar"),
            "total_solved": difficulty_map.get("All", 0),
            "easy_solved": difficulty_map.get("Easy", 0),
            "medium_solved": difficulty_map.get("Medium", 0),
            "hard_solved": difficulty_map.get("Hard", 0),
            "updated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        return {"error": str(e)}
    

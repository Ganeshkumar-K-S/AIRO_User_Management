import httpx
import asyncio
from bs4 import BeautifulSoup
from datetime import datetime

async def fetch_kaggle(username: str):

    url = f"https://www.kaggle.com/{username}"

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        async with httpx.AsyncClient(timeout=5, headers=headers) as client:
            response = await client.get(url)

        if response.status_code != 200:
            return {"error": "Kaggle user not found"}

        soup = BeautifulSoup(response.text, "html.parser")

        title = soup.find("title")
        description = soup.find("meta", attrs={"name": "description"})
        og_username = soup.find("meta", attrs={"property": "og:username"})
        og_image = soup.find("meta", attrs={"name": "twitter:image"})

        return {
            "username": og_username["content"] if og_username else username,
            "display_name": title.text.replace("| Kaggle", "").strip() if title else "",
            "bio": description["content"] if description else "",
            "profile_image": og_image["content"] if og_image else "",
            "profile_url": url,
            "scraped_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        return {"error": str(e)}
    
result = asyncio.run(fetch_kaggle("ganeshkumarks"))
print(result)
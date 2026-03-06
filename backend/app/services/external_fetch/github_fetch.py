import httpx
import asyncio

async def fetch_github(username: str):
    try:
        async with httpx.AsyncClient(timeout=5) as client:

            user_req = client.get(f"https://api.github.com/users/{username}")
            repos_req = client.get(f"https://api.github.com/users/{username}/repos")

            user_res, repos_res = await asyncio.gather(user_req, repos_req)

        if user_res.status_code != 200:
            return {"error": "GitHub user not found"}

        if repos_res.status_code != 200:
            return {"error": "Failed to fetch repositories"}

        user = user_res.json()
        repos = repos_res.json()

        stars = sum(
            repo.get("stargazers_count", 0)
            for repo in repos
            if not repo.get("fork")
        )

        repo_details = []

        for repo in repos:
            if repo.get("fork"):
                continue

            desc = repo.get("description") or ""

            if " " in desc:
                desc = desc.split(" ", 1)[1]

            repo_details.append({
                "name": repo.get("name"),
                "url": repo.get("html_url"),
                "description": desc,
                "stars": repo.get("stargazers_count", 0),
                "language" : repo.get("language", None)
            })

        from collections import Counter

        languages = []
        for i in repo_details:
            if i["language"]:
                languages.append(i.get("language"))

        freq = Counter(languages)
        top_languages = [
                            i[0] 
                            for i in sorted(
                                list(freq.items()), 
                                key = lambda x : x[1],
                                reverse = True
                            )
                        ]

        print(freq.items())
        freq.pop(None, None)
        return {
            "username": user.get("login"),
            "bio" : user.get("bio") or "",
            "followers": user.get("followers"),
            "following": user.get("following"),
            "public_repos": user.get("public_repos"),
            "stars": stars,
            "repo_details": repo_details,
            "profile_image": user.get("avatar_url"),
            "top_languages" : top_languages
        }

    except httpx.TimeoutException:
        return {"error": "GitHub request timeout"}

    except httpx.RequestError:
        return {"error": "Network error"}
    


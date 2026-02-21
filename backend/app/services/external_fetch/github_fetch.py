import requests, json

def fetch_github(username):
    user = requests.get(f"https://api.github.com/users/{username}").json()
    repos = requests.get(f"https://api.github.com/users/{username}/repos").json()
    stars = sum(i["stargazers_count"] for i in repos)

    return {
        "followers" : user["followers"],
        "repos" : user["public_repos"], 
        "stars" : stars, 
        "repo_details" : [
            {
                "name": i["name"],
                "url" : i["url"],
                "description" : i["description"].split(" ", 1)[1] if i["description"] else ""
            }

            for i in repos if i["fork"] == False
        ]
    }

print(json.dumps(fetch_github("ganeshkumar-k-s"),indent=4))
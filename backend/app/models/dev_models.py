from pydantic import BaseModel 


class GithubLinkRequest(BaseModel):
    github_id : str 
    code : str

class GithubCodeRequest(BaseModel):
    github_id : str 

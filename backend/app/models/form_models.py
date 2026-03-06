from pydantic import BaseModel 
from typing import List, Optional
from datetime import datetime

class EducationModel(BaseModel):
    degree: str 
    branch: str
    institution : str 
    cgpa: float | None 
    start_year: int | None 
    end_year: int | None 

class Skill(BaseModel):
    name: str
    category: Optional[str] = None
    level: Optional[int] = None

class Project(BaseModel):
    title: str
    description: str
    tech_stack: Optional[List[str]] = None
    github_link: Optional[str] = None
    live_link: Optional[str] = None

class Achievement(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[datetime] = None

class Experience(BaseModel):
    role: Optional[str]
    company: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    description: Optional[str]

class Certification(BaseModel):
    title: Optional[str]
    issuer: Optional[str]
    issue_date: Optional[datetime]
    link: Optional[str]

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None 
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[Skill]] = None
    projects: Optional[List[Project]] = None
    achievements: Optional[List[Achievement]] = None
    experience: Optional[List[Experience]] = None
    certifications: Optional[List[Certification]] = None
    education: Optional[List[EducationModel]] = None
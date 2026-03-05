from jose import jwt, JWTError 
from datetime import datetime, timedelta 
from backend.app.core.config import settings

SECRET_KEY = settings.JWT_SECRET_KEY 
ALGORITHM = settings.JWT_ALGO 
EXPIRATION_MINUTES = 60 

def create_token(data : dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes = EXPIRATION_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm = ALGORITHM)

def verify_token(token):
    token = token.replace("Bearer ", "")
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
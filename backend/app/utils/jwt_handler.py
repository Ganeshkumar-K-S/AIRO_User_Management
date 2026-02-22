from jose import jwt, JWTError 
from datetime import datetime, timedelta 
from app.core.config import settings

SECRET_KEY = settings.JWT_SECRET_KEY 
ALGORITHM = settings.JWT_ALGO 
EXPIRATION_MINUTES = 60 

def create_token(data : dict):
    payload = data.copy()
    payload["exp"] = datetime.now() + timedelta(minutes = EXPIRATION_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm = ALGORITHM)

def verify_token(token):
    try:
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
        return payload 
    except JWTError:
        raise Exception("Invalid or expired token")
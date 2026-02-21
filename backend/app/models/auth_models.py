from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email : EmailStr
    password : str 

class SendOTP(BaseModel):
    email : EmailStr 

class VerifyOTP(BaseModel):
    email : EmailStr 
    otp: str 

class RegisterUser(BaseModel):
    email : EmailStr 
    password : str
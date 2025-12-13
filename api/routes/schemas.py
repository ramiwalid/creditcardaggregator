from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from .database.users import Base

class UserCreate(BaseModel):
    email: str
    password: str
    username: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str

class UserInDb(UserCreate):
    hashed_password:str

class ResetPassword(BaseModel):
    email: str

class ResetPasswordSuccess(BaseModel):
    message: str

from warnings import deprecated
from fastapi import APIRouter, FastAPI, status, HTTPException
from fastapi.routing import APIRoute
from pydantic import BaseModel
from starlette.types import HTTPExceptionHandler 
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

class UserCreate(BaseModel):
    email: str
    password: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str 

router = APIRouter()

SECRET_KEY = "3913911jf93mdqqs0s129s193df03101d10mfmx"
memory_db = {}

def hash_password(password: str) -> str:
    # Placeholder hashing function
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash(password)

    return hashed_password

def check_user_exists(email: str) -> bool:
    return email in memory_db

def add_user_db(email: str, password: str, username: str):
    if (email not in memory_db):
        memory_db[email] = {
                "email": email,
                "password": password,
                "username": username
                }

@router.get('/signup', response_model=UserCreate)
def sign_up_user(user: UserCreate):
    existing_user = check_user_exists(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    print(user.email)
    user_password = hash_password(user.password)
    add_user_db(user.email, user_password, user.username)

@router.post('/signup', response_model=Token)
async def send_token(user: UserCreate):
    access_token_expires = timedelta(minutes=30)
    access_token = jwt.encode(
            {"sub": user.email, "exp": datetime.utcnow() + access_token_expires},
            SECRET_KEY,
            algorithm="HS256"
            )
    
    return {"access_token": access_token, "token_type": "bearer"}

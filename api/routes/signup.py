from warnings import deprecated
from fastapi import APIRouter, FastAPI, status, HTTPException
from fastapi.routing import APIRoute
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from starlette.types import HTTPExceptionHandler 
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

class UserCreate(BaseModel):
    email: str
    password: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str 

SECRET_KEY = "e429884f6fdb7221c78261b4a7e9d1e214cc45ec5ffb142b6f12b9bf7f5b766c" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 

memory_db = {
        "ramiwalid5@gmail.com": {
            "password": "",
            "username": "ramiwalid5",
            "disabled": False
            }
        }

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def check_user_exists(email: str) -> bool:
    return email in memory_db

def add_user_db(email: str, password: str, username: str):
    if (email not in memory_db):
        memory_db[email] = {
                "email": email,
                "password": password,
                "username": username
                }


@router.post('/signup', response_model=Token)
def send_token(user: UserCreate):
    existing_user = check_user_exists(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    add_user_db(user.email, user.password, user.username)
    print(memory_db)
    
    access_token_expires = timedelta(minutes=30)
    access_token = jwt.encode(
            {"sub": user.email, "exp": datetime.utcnow() + access_token_expires},
            SECRET_KEY,
            algorithm="HS256"
            )
    
    return {"access_token": access_token, "token_type": "bearer"}

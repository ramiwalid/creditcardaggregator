from enum import verify
from warnings import deprecated
from fastapi import APIRouter, FastAPI, status, HTTPException
from fastapi.routing import APIRoute
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
from routes import schemas, security
from routes.database import users

router = APIRouter()

db = {}

@router.post('/signup', response_model=schemas.Token)
def send_token(user: schemas.UserCreate):
    existing_user = users.check_user_exists(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user_password = security.hash_password(user.password)
    users.add_user_db(db, user.email, user_password, user.username)
    
    print(user_password)
    print(db)
    access_token = security.generate_access_token(db)
    
    return {"access_token": access_token, "token_type": "bearer"}

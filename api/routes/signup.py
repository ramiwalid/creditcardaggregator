from enum import verify
from warnings import deprecated
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, status, HTTPException, Depends
from fastapi.routing import APIRoute
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from routes import schemas, security
from .database.users import add_user_db, get_db, get_user_db
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

@router.post('/signup', response_model=schemas.Token)
def send_token(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_db(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")

    if not security.check_password(password=user.password):
        raise HTTPException(status_code=400, detail="Password is not valid")

    user_password = security.hash_password(user.password)
    new_user = add_user_db(
            db=db,
            email=user.email,
            password=user_password,
            username=user.username
            )

    token_data = {"sub": str(new_user.id)}
    access_token = security.generate_access_token(token_data)
    
    return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "user_id": str(new_user.id)
            }

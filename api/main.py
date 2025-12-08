from warnings import deprecated
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic.types import SecretType 
from login import handle_login
from fastapi.middleware.cors import CORSMiddleware
from routes import signup

app = FastAPI()

app.include_router(signup.router, prefix="/auth")

origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
]

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)

@app.get('/home')
def home():
    return {"hello": "we are in the home page"}

@app.get('/signup')
def sign_up_users():
    return signup

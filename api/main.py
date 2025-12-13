from sys import prefix
from fastapi import Depends, FastAPI, HTTPException, status
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import signup, login, forgotpassword, resetpassword
from dotenv import load_dotenv
from routes.database.users import engine, Base
from routes.database import models
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()

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

app.include_router(signup.router, prefix="/auth")
app.include_router(login.router, prefix="/auth")
app.include_router(forgotpassword.router, prefix="/auth")
app.include_router(resetpassword.router, prefix="/auth")

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from routes import signup

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


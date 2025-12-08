from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from pydantic import BaseModel
from login import handle_login

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

router = APIRouter()

def hash_password(password: str) -> str:
    # Placeholder hashing function
    return f"hashed_{password}"

@router.post('/signup', response_model=Token)
async def sign_up_user(user: UserCreate):
    # Check if user exists in database
    # Hash the user.password
    # Save the new user to database
    # Create and return a JWT upon successful user creation

    hashed_pass = hash_password(user.password)

    access_token = "some_generated_jwt"
    return {"access_token": access_token}

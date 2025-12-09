from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserInDb(UserCreate):
    hashed_password:str

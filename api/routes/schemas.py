from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from .database.users import Base

class UserCreate(BaseModel):
    email: str
    password: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserInDb(UserCreate):
    hashed_password:str

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    username = Column(String, index=True, nullable=False)

    def __repr__(self):
        return f"<User(email='{self.email}')>"

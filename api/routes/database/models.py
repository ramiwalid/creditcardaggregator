from enum import unique
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)

    hashed_password = Column(String, nullable=False)

    username = Column(String, index=True, nullable=False)

    def __repr__(self):
        return f"<User(email='{self.email}')>"

class ResetPassword(Base):
    __tablename__ = "users_pending_reset"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)

    token = Column(String, index=True, nullable=False)

    def __repr__(self):
        return f"<User(email='{self.email}')>"

from fastapi import HTTPException, Path, status
import sqlalchemy
from sqlalchemy.engine import create
from sqlalchemy.orm import Session
from routes.security import hash_password, verify_password
from routes import schemas, security
from . import models
from sqlalchemy import create_engine, schema
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os 
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

current_file_dir = Path(__file__).resolve().parent
project_root = current_file_dir.parent.parent.parent
db_file_path = project_root / "sql_app.db"

SQLALCHEMY_DATABASE_URL=f"sqlite:///{db_file_path}"

engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_db(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def add_user_db(db: Session, email: str, password: str, username: str):
    db_user = models.User(
            email=email,
            hashed_password=password,
            username=username
            )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_user(db: Session, email: str, password: str) -> models.User:
    user = get_user_db(db, email=email)

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    if not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Password is incorrect")

    return user

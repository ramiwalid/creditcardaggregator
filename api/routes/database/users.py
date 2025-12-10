import sqlalchemy
from sqlalchemy.engine import create
from sqlalchemy.orm import Session
from routes import schemas
from sqlalchemy import create_engine, schema
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os 
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL=os.environ.get("DATABASE_URL", "sqlite:///./sql_app.db")

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
    return db.query(schemas.User).filter(schemas.User.email == email).first()

def add_user_db(db: Session, email: str, password: str, username: str):
    db_user = schemas.User(
            email=email,
            hashed_password=password,
            username=username
            )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


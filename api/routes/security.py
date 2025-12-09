from warnings import deprecated
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError
from datetime import datetime, timedelta
from api.routes.database import users

SECRET_KEY = "e429884f6fdb7221c78261b4a7e9d1e214cc45ec5ffb142b6f12b9bf7f5b766c" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth_2_scheme = OAuth2PasswordBearer(tokenUrl='token')

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(db: dict, email: str, password: str):
    user = users.get_user_db(db, email)
    if not users.check_user_exists(db, email):
        return False
    if user is not None and not verify_password(password, user.hashed_password):
        return False


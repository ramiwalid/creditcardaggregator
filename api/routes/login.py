from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from routes import schemas, security
from routes.database.users import get_db, verify_user

router = APIRouter()

@router.post('/login', response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)): 
    db_user = verify_user(db, user.email, security.hash_password(user.password))

    token_data = {"sub": str(db_user.id)}
    access_token = security.generate_access_token(token_data)

    return {
            "access_token": access_token,
            "token_type": "bearer"
            }

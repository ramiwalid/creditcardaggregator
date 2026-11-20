from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from routes import schemas
from routes.database.users import get_db, get_user_db

router = APIRouter()

#@router.post('/resetpassword', response_model=schemas.SetNewPassword)
#def setPassword(token: str, db: Session = Depends(get_db)):

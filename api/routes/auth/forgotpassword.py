from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from routes.security import generate_password_token, sendEmail
from routes.database.users import get_db, get_user_db
from routes import schemas

router = APIRouter()

@router.post('/forgotpassword', response_model=schemas.ResetPasswordSuccess)
def verifyEmail(user: schemas.ResetPassword, db: Session = Depends(get_db)):
    db_user = get_user_db(db, user.email) 

    if not db_user:
        raise HTTPException(status_code=400, detail="User does not exist")

    password_token = generate_password_token(str(db_user.id))
    reset_url = f"http://localhost:3000/auth/resetpassword/{password_token}"

    sendEmail(user.email, reset_url)

    return {
            "message": "Password reset link sent!",
            }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from routes import schemas, security
from routes.database import models
from routes.database.users import authenticate_user, get_db

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.identifier, credentials.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
        )

    return {
        "access_token": security.generate_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    body: schemas.UserUpdate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    for field in ("first_name", "last_name"):
        value = getattr(body, field)
        if value is None:
            continue
        cleaned = security.clean_name(value)
        if cleaned is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"field": field, "message": "Use letters, spaces, hyphens or apostrophes (max 50)."},
            )
        setattr(current_user, field, cleaned)
    db.commit()
    db.refresh(current_user)
    return current_user

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from routes import schemas, security
from routes.database.users import (
    add_user_db,
    get_db,
    get_user_by_email,
    get_user_by_username,
)

router = APIRouter()


def _field_error(field: str, message: str) -> HTTPException:
    # `field` lets the frontend highlight the right input.
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"field": field, "message": message},
    )


@router.post("/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    email = user.email.strip().lower()
    username = user.username.strip()
    first_name = security.clean_name(user.first_name)
    last_name = security.clean_name(user.last_name)

    if first_name is None:
        raise _field_error("first_name", "Enter your first name (letters, spaces, hyphens or apostrophes).")
    if last_name is None:
        raise _field_error("last_name", "Enter your last name (letters, spaces, hyphens or apostrophes).")

    if not security.check_email(email):
        raise _field_error("email", "Enter a valid email address.")
    if get_user_by_email(db, email):
        raise _field_error("email", "An account with this email already exists.")
    if not security.check_username(username):
        raise _field_error("username", "Invalid username. It must meet the requirements below.")
    if get_user_by_username(db, username):
        raise _field_error("username", "That username is taken.")
    if not security.check_password(user.password):
        raise _field_error("password", "Invalid password. It must meet the requirements below.")

    new_user = add_user_db(
        db=db,
        email=email,
        password=security.hash_password(user.password),
        username=username,
        first_name=first_name,
        last_name=last_name,
    )

    return {
        "access_token": security.generate_access_token(new_user.id),
        "token_type": "bearer",
        "user": new_user,
    }

from sqlalchemy import func
from sqlalchemy.orm import Session

from routes import security
from . import models

# Re-exported so existing imports (`from routes.database.users import get_db`)
# keep working.
from .session import Base, SessionLocal, engine, get_db  # noqa: F401


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.get(models.User, user_id)


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return (
        db.query(models.User)
        .filter(func.lower(models.User.email) == email.strip().lower())
        .first()
    )


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return (
        db.query(models.User)
        .filter(func.lower(models.User.username) == username.strip().lower())
        .first()
    )


def get_user_db(db: Session, identifier: str) -> models.User | None:
    """Look a user up by email, falling back to username."""
    return get_user_by_email(db, identifier) or get_user_by_username(db, identifier)


def add_user_db(
    db: Session,
    email: str,
    password: str,
    username: str,
    first_name: str | None = None,
    last_name: str | None = None,
) -> models.User:
    """`password` must already be hashed."""
    db_user = models.User(
        email=email,
        hashed_password=password,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_password(db: Session, user: models.User, new_hashed_password: str) -> None:
    user.hashed_password = new_hashed_password
    db.commit()


def authenticate_user(db: Session, identifier: str, password: str) -> models.User | None:
    """Return the user if the credentials are valid, otherwise None.

    Deliberately does not say *which* part was wrong, so the login form can't
    be used to discover which emails/usernames have accounts.
    """
    user = get_user_db(db, identifier)
    if user is None:
        security.dummy_verify()  # keep response time similar for unknown users
        return None
    if not security.verify_password(password, user.hashed_password):
        return None

    # Transparently upgrade the hash if the Argon2 parameters have changed.
    if security.needs_rehash(user.hashed_password):
        update_password(db, user, security.hash_password(password))
    return user

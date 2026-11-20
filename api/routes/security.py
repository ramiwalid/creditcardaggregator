"""Password hashing, validation and JWT helpers.

Passwords are hashed with Argon2id (via argon2-cffi), the current OWASP
recommendation for password storage. Hashes produced by the previous passlib
setup use the same standard `$argon2id$...` format, so existing accounts keep
working without a migration.
"""
import hashlib
import logging
import os
import re
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

# Same dependency the routes use, so FastAPI shares one session per request
# (the current user can then be modified and committed by the route).
from routes.database.session import get_db

load_dotenv()

logger = logging.getLogger("quanta.security")

SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
RESET_TOKEN_EXPIRE_MINUTES = 15

if not SECRET_KEY:
    # Previously a missing key made generate_access_token return the literal
    # string "token", which would have let anyone forge a session. Fail loudly.
    raise RuntimeError(
        "SECRET_KEY is not set. Add it to .env, e.g. "
        "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')"
    )

ACCESS_TOKEN_TYPE = "access"
RESET_TOKEN_TYPE = "password_reset"

_hasher = PasswordHasher()  # argon2id with library-recommended parameters
_DUMMY_HASH = _hasher.hash("quanta-dummy-password")

oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


# --------------------------------------------------------------------------
# Input validation
# --------------------------------------------------------------------------

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Alphanumeric plus single hyphens; can't start/end with a hyphen. (The old
# regex rejected all hyphens even though the signup form said they were OK.)
USERNAME_RE = re.compile(r"^[A-Za-z0-9](?:-?[A-Za-z0-9])*$")
PASSWORD_RE = re.compile(r"^(?=.*[A-Z])(?=.*[0-9])[\s\S]{8,}$")
MAX_PASSWORD_LENGTH = 256


def check_email(email: str) -> bool:
    return len(email) <= 254 and bool(EMAIL_RE.match(email))


def check_password(password: str) -> bool:
    """At least 15 chars, OR at least 8 chars with an uppercase letter and a digit."""
    if len(password) > MAX_PASSWORD_LENGTH:
        return False
    if len(password) >= 15:
        return True
    return bool(PASSWORD_RE.match(password))


def clean_name(name: str) -> str | None:
    """Normalise a first/last name. Returns None if it's invalid.

    Allows letters from any alphabet plus spaces, hyphens, apostrophes and
    periods (e.g. "Mary-Jane", "O'Brien", "J.R."), up to 50 characters.
    """
    name = " ".join(name.split())
    if not 1 <= len(name) <= 50:
        return None
    if not any(c.isalpha() for c in name):
        return None
    if not all(c.isalpha() or c in " -'.’" for c in name):
        return None
    return name


def check_username(username: str) -> bool:
    return 3 <= len(username) <= 39 and bool(USERNAME_RE.match(username))


# --------------------------------------------------------------------------
# Password hashing
# --------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed_password: str) -> bool:
    try:
        return _hasher.check_needs_rehash(hashed_password)
    except InvalidHashError:
        return False


def dummy_verify() -> None:
    """Spend the same time as a real verification (prevents timing-based
    account enumeration on login)."""
    verify_password("not-the-password", _DUMMY_HASH)


# --------------------------------------------------------------------------
# JWTs
# --------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(claims: dict) -> str:
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)


def generate_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    expire = _now() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return _encode(
        {"sub": str(user_id), "type": ACCESS_TOKEN_TYPE, "iat": _now(), "exp": expire}
    )


def password_fingerprint(hashed_password: str) -> str:
    """Short digest of the current password hash. Embedding it in a reset
    token makes the token single-use: once the password changes, the
    fingerprint no longer matches and the link stops working."""
    return hashlib.sha256(hashed_password.encode()).hexdigest()[:16]


def generate_password_token(user_id: int, hashed_password: str) -> str:
    now = _now()
    return _encode(
        {
            "sub": str(user_id),
            "type": RESET_TOKEN_TYPE,
            "pwd": password_fingerprint(hashed_password),
            "iat": now,
            "exp": now + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        }
    )


def decode_token(token: str, expected_type: str) -> dict | None:
    """Return the claims if the token is valid and of the expected type."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != expected_type or not payload.get("sub"):
        return None
    return payload


# --------------------------------------------------------------------------
# FastAPI dependency
# --------------------------------------------------------------------------

def get_current_user(
    token: str | None = Depends(oauth_2_scheme),
    db: Session = Depends(get_db),
):
    from routes.database.users import get_user_by_id

    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credential_exception

    payload = decode_token(token, ACCESS_TOKEN_TYPE)
    if payload is None:
        raise credential_exception

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise credential_exception

    user = get_user_by_id(db, user_id)
    if user is None:
        raise credential_exception
    return user


# --------------------------------------------------------------------------
# Email
# --------------------------------------------------------------------------

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER")
# `PASSWORD` was the original variable name; still honoured for compatibility.
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD") or os.environ.get("PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


# Where landing-page contact form messages are delivered.
CONTACT_INBOX = os.environ.get("CONTACT_INBOX")


def _header_safe(value: str) -> str:
    """Strip CR/LF so user input can't inject extra email headers."""
    return " ".join(value.split())


def send_email(to_email: str, subject: str, body: str, reply_to: str | None = None) -> bool:
    """Send a plain-text email via SMTP. Returns False (and logs) instead of
    raising, so a delivery problem never breaks the request that triggered it."""
    if not (SMTP_USER and SMTP_PASSWORD):
        logger.warning("SMTP not configured; not sending %r to %s", subject, to_email)
        print(f"[quanta] SMTP not configured. Would send to {to_email}: {subject}\n{body}", flush=True)
        return False

    msg = EmailMessage()
    msg["Subject"] = _header_safe(subject)
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    if reply_to:
        msg["Reply-To"] = _header_safe(reply_to)
    msg.set_content(body)

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send %r to %s", subject, to_email)
        return False


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    if not (SMTP_USER and SMTP_PASSWORD):
        # Dev fallback: no SMTP configured, so print the link to the API log.
        logger.warning("SMTP not configured. Password reset link for %s: %s", to_email, reset_url)
        print(f"[quanta] Password reset link for {to_email}: {reset_url}", flush=True)
        return

    send_email(
        to_email,
        "Reset your Quanta password",
        "Someone (hopefully you) asked to reset your Quanta password.\n\n"
        f"Reset it here: {reset_url}\n\n"
        f"This link expires in {RESET_TOKEN_EXPIRE_MINUTES} minutes and can only be used once. "
        "If you didn't request this, you can ignore this email.",
    )


def send_contact_email(name: str, email: str, message: str) -> None:
    if not CONTACT_INBOX:
        logger.warning("CONTACT_INBOX not set; contact message from %s only saved to the database", email)
        return
    send_email(
        CONTACT_INBOX,
        f"Quanta contact form: {name}",
        f"New message from the Quanta contact form.\n\n"
        f"Name:  {name}\n"
        f"Email: {email}\n\n"
        f"{message}\n\n"
        "Reply to this email to respond directly.",
        reply_to=email,
    )

"""Symmetric encryption for secrets stored in the database (Plaid access tokens)."""
import os

from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv()

_key = os.environ.get("TOKEN_ENCRYPTION_KEY")
_fernet = Fernet(_key.encode()) if _key else None


def is_configured() -> bool:
    return _fernet is not None


def encrypt(value: str) -> str:
    if _fernet is None:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY is not set")
    return _fernet.encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    if _fernet is None:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY is not set")
    try:
        return _fernet.decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise RuntimeError("Stored token could not be decrypted (was TOKEN_ENCRYPTION_KEY changed?)") from exc

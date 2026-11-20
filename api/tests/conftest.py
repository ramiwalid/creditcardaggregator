import os
import sys
from pathlib import Path

import pytest

# Configure the environment *before* the app modules are imported. Real env
# vars win over .env (load_dotenv doesn't override), so this isolates tests
# from the dev database and from real SMTP credentials.
_TEST_DB = Path(__file__).parent / "test.db"
os.environ["QUANTA_DATABASE_URL"] = f"sqlite:///{_TEST_DB}"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["ALGORITHM"] = "HS256"
for var in ("SMTP_USER", "SMTP_PASSWORD", "PASSWORD", "CONTACT_INBOX", "PLAID_CLIENT_ID", "PLAID_SECRET"):
    os.environ[var] = ""
# Fixed test-only key (never the real one from .env).
os.environ["TOKEN_ENCRYPTION_KEY"] = "3m1uAFxfBDB8hLR4W7yE0fBZpZQsnmHcXqxmXQ_aJFg="

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from routes import security  # noqa: E402
from routes.database.session import Base, engine  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(scope="session", autouse=True)
def _cleanup_db_file():
    yield
    engine.dispose()
    _TEST_DB.unlink(missing_ok=True)


@pytest.fixture
def client():
    with TestClient(main.app) as c:
        yield c


@pytest.fixture
def sent_emails(monkeypatch):
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(
        security, "send_password_reset_email", lambda to, url: sent.append((to, url))
    )
    return sent


def signup(
    client,
    email="alice@example.com",
    username="alice",
    password="Password123",
    first_name="Alice",
    last_name="Liddell",
):
    return client.post(
        "/auth/signup",
        json={
            "email": email,
            "username": username,
            "password": password,
            "first_name": first_name,
            "last_name": last_name,
        },
    )


def auth_headers(client, **kwargs) -> dict:
    res = signup(client, **kwargs)
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

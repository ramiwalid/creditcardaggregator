from conftest import auth_headers, signup


def test_signup_returns_token_and_user(client):
    res = signup(client, email="  Alice@Example.com ")
    assert res.status_code == 201
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "alice@example.com"  # normalised
    assert body["user"]["username"] == "alice"


def test_password_is_stored_as_argon2id(client):
    from routes.database import models
    from routes.database.session import SessionLocal

    signup(client)
    with SessionLocal() as db:
        user = db.query(models.User).one()
    assert user.hashed_password.startswith("$argon2id$")
    assert "Password123" not in user.hashed_password


def test_signup_rejects_duplicate_email_case_insensitive(client):
    signup(client)
    res = signup(client, email="ALICE@example.com", username="alice2")
    assert res.status_code == 400
    assert res.json()["detail"]["field"] == "email"


def test_signup_rejects_duplicate_username_case_insensitive(client):
    signup(client)
    res = signup(client, email="other@example.com", username="ALICE")
    assert res.status_code == 400
    assert res.json()["detail"]["field"] == "username"


def test_signup_validation(client):
    assert signup(client, email="not-an-email").json()["detail"]["field"] == "email"
    assert signup(client, username="ab").json()["detail"]["field"] == "username"
    assert signup(client, username="-bad").json()["detail"]["field"] == "username"
    assert signup(client, username="bad--name").json()["detail"]["field"] == "username"
    assert signup(client, password="short1A").json()["detail"]["field"] == "password"
    assert signup(client, password="alllowercase1").json()["detail"]["field"] == "password"


def test_username_allows_single_hyphens(client):
    assert signup(client, username="rami-walid").status_code == 201


def test_long_password_without_complexity_is_allowed(client):
    assert signup(client, password="correct horse battery").status_code == 201


def test_login_with_email_or_username(client):
    signup(client)
    for identifier in ("alice@example.com", "ALICE@EXAMPLE.COM", "alice", "Alice"):
        res = client.post("/auth/login", json={"identifier": identifier, "password": "Password123"})
        assert res.status_code == 200, identifier
        assert res.json()["user"]["username"] == "alice"


def test_login_failures_are_indistinguishable(client):
    signup(client)
    wrong_pw = client.post("/auth/login", json={"identifier": "alice", "password": "nope"})
    no_user = client.post("/auth/login", json={"identifier": "bob", "password": "nope"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json() == no_user.json()


def test_me_requires_valid_token(client):
    headers = auth_headers(client)
    assert client.get("/auth/me", headers=headers).json()["username"] == "alice"
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_reset_token_cannot_be_used_as_access_token(client, sent_emails):
    signup(client)
    client.post("/auth/forgotpassword", json={"email": "alice@example.com"})
    token = sent_emails[0][1].rsplit("/", 1)[1]
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_forgot_password_does_not_reveal_accounts(client, sent_emails):
    signup(client)
    known = client.post("/auth/forgotpassword", json={"email": "alice@example.com"})
    unknown = client.post("/auth/forgotpassword", json={"email": "nobody@example.com"})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    assert [to for to, _ in sent_emails] == ["alice@example.com"]


def test_full_password_reset_flow_and_single_use(client, sent_emails):
    signup(client)
    client.post("/auth/forgotpassword", json={"email": "alice@example.com"})
    url = sent_emails[0][1]
    assert url.startswith("http://localhost:3000/auth/resetpassword/")
    token = url.rsplit("/", 1)[1]

    weak = client.post("/auth/resetpassword", json={"token": token, "password": "weak"})
    assert weak.status_code == 400 and weak.json()["detail"]["field"] == "password"

    ok = client.post("/auth/resetpassword", json={"token": token, "password": "NewPassword456"})
    assert ok.status_code == 200

    old = client.post("/auth/login", json={"identifier": "alice", "password": "Password123"})
    new = client.post("/auth/login", json={"identifier": "alice", "password": "NewPassword456"})
    assert old.status_code == 401
    assert new.status_code == 200

    reused = client.post("/auth/resetpassword", json={"token": token, "password": "Another789X"})
    assert reused.status_code == 400
    assert reused.json()["detail"]["field"] == "token"


def test_reset_rejects_garbage_token(client):
    res = client.post("/auth/resetpassword", json={"token": "abc", "password": "NewPassword456"})
    assert res.status_code == 400


def test_existing_passlib_hashes_still_verify():
    # Hash produced by the old passlib CryptContext(schemes=['argon2']) setup.
    from argon2 import PasswordHasher

    from routes import security

    legacy = PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8).hash("Legacy123")
    assert security.verify_password("Legacy123", legacy)
    assert not security.verify_password("wrong", legacy)

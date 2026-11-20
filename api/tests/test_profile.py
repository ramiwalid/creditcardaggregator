from sqlalchemy import create_engine, inspect, text

from conftest import auth_headers, signup


def test_signup_stores_and_returns_names(client):
    res = signup(client, first_name="  Mary-Jane ", last_name="O'Brien")
    assert res.status_code == 201
    user = res.json()["user"]
    assert user["first_name"] == "Mary-Jane"
    assert user["last_name"] == "O'Brien"


def test_signup_accepts_non_latin_names(client):
    res = signup(client, first_name="Zoë", last_name="Ångström")
    assert res.status_code == 201
    assert res.json()["user"]["first_name"] == "Zoë"


def test_signup_requires_valid_names(client):
    assert signup(client, first_name="   ").json()["detail"]["field"] == "first_name"
    assert signup(client, first_name="R2D2").json()["detail"]["field"] == "first_name"
    assert signup(client, last_name="").json()["detail"]["field"] == "last_name"
    assert signup(client, last_name="x" * 51).json()["detail"]["field"] == "last_name"


def test_signup_without_name_fields_is_rejected(client):
    res = client.post(
        "/auth/signup",
        json={"email": "a@example.com", "username": "abc", "password": "Password123"},
    )
    assert res.status_code == 422


def test_me_returns_names(client):
    headers = auth_headers(client)
    me = client.get("/auth/me", headers=headers).json()
    assert (me["first_name"], me["last_name"]) == ("Alice", "Liddell")


def test_update_me(client):
    headers = auth_headers(client)
    res = client.patch("/auth/me", json={"first_name": "Ally"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["first_name"] == "Ally"
    assert res.json()["last_name"] == "Liddell"  # untouched

    bad = client.patch("/auth/me", json={"last_name": "<script>"}, headers=headers)
    assert bad.status_code == 400 and bad.json()["detail"]["field"] == "last_name"
    assert client.patch("/auth/me", json={"first_name": "X"}).status_code == 401


def test_migration_adds_name_columns_to_old_users_table(tmp_path):
    from routes.database.migrations import run_migrations

    engine = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR NOT NULL, "
            "hashed_password VARCHAR NOT NULL, username VARCHAR NOT NULL)"
        ))
        conn.execute(text("INSERT INTO users VALUES (1, 'old@example.com', 'x', 'olduser')"))

    run_migrations(engine)
    run_migrations(engine)  # idempotent

    cols = {c["name"] for c in inspect(engine).get_columns("users")}
    assert {"first_name", "last_name"} <= cols
    with engine.connect() as conn:
        row = conn.execute(text("SELECT username, first_name FROM users")).one()
    assert row == ("olduser", None)

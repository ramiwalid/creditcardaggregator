def test_contact_message_is_stored(client):
    res = client.post(
        "/contact",
        json={"name": " Ada ", "email": "Ada@Example.com", "message": "Love the dashboard, any plans for Plaid?"},
    )
    assert res.status_code == 201

    from routes.database import models
    from routes.database.session import SessionLocal

    with SessionLocal() as db:
        msg = db.query(models.ContactMessage).one()
    assert msg.name == "Ada"
    assert msg.email == "ada@example.com"


def test_contact_validation(client):
    ok = {"name": "Ada", "email": "ada@example.com", "message": "Hello there, this is long enough."}
    assert client.post("/contact", json={**ok, "email": "nope"}).status_code == 422
    assert client.post("/contact", json={**ok, "name": "   "}).status_code == 422
    assert client.post("/contact", json={**ok, "message": "short"}).status_code == 422


def test_contact_message_is_emailed_to_contact_inbox(client, monkeypatch):
    from routes import security

    sent = []
    monkeypatch.setattr(security, "CONTACT_INBOX", "inbox@example.com")
    monkeypatch.setattr(
        security, "send_email", lambda to, subject, body, reply_to=None: sent.append((to, subject, body, reply_to))
    )
    res = client.post(
        "/contact",
        json={"name": "Ada\r\nBcc: evil@x.com", "email": "ada@example.com", "message": "Hello there, testing delivery."},
    )
    assert res.status_code == 201
    assert len(sent) == 1
    to, subject, body, reply_to = sent[0]
    assert to == "inbox@example.com"
    assert reply_to == "ada@example.com"
    assert "Hello there, testing delivery." in body


def test_email_headers_cannot_be_injected():
    from routes.security import _header_safe

    assert "\n" not in _header_safe("Quanta contact form: Ada\r\nBcc: evil@x.com")


def test_contact_without_inbox_still_saves(client, monkeypatch):
    from routes import security

    sent = []
    monkeypatch.setattr(security, "CONTACT_INBOX", None)
    monkeypatch.setattr(security, "send_email", lambda *a, **k: sent.append(a))
    res = client.post("/contact", json={"name": "Ada", "email": "ada@example.com", "message": "Hello there, still saved."})
    assert res.status_code == 201
    assert sent == []

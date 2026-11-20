from datetime import date, datetime, timedelta, timezone

import pytest

from conftest import auth_headers
from routes import plaid_service, plaid_sync
from routes.database import models
from routes.database.session import SessionLocal

TOKEN = "access-sandbox-secret-123"


def account(**overrides):
    base = {
        "account_id": "acc-1",
        "name": "Plaid Credit Card",
        "official_name": "Plaid Diamond Visa Signature",
        "mask": "3333",
        "current": 410.0,
        "limit": 2000.0,
        "last_statement_balance": 1708.77,
        "minimum_payment": 20.0,
        "next_payment_due_date": date(2026, 12, 28),
        "last_statement_issue_date": date(2026, 11, 3),
        "purchase_apr": 12.5,
    }
    return {**base, **overrides}


def txn(tid, amount, **overrides):
    base = {
        "transaction_id": tid, "account_id": "acc-1", "amount": amount,
        "date": date(2026, 11, 10), "name": "UBER *TRIP", "merchant_name": "Uber",
        "pending": False, "category": None,
    }
    return {**base, **overrides}


class FakePlaid:
    def __init__(self):
        self.accounts = [account()]
        self.ready = True
        self.pages = []  # queued transaction changes, one per sync
        self.error = None
        self.removed_tokens = []
        self.institution = ("ins_1", "First Platypus Bank")

    def changes(self, token, cursor):
        assert token == TOKEN
        if self.error:
            raise self.error
        if not self.ready:
            return {"added": [], "modified": [], "removed": [], "next_cursor": ""}
        page = self.pages.pop(0) if self.pages else {}
        return {
            "added": page.get("added", []), "modified": page.get("modified", []),
            "removed": page.get("removed", []), "next_cursor": f"{cursor or ''}c",
        }

    def credit_accounts(self, token):
        assert token == TOKEN
        if self.error:
            raise self.error
        return self.accounts


@pytest.fixture
def fake(monkeypatch):
    f = FakePlaid()
    monkeypatch.setattr(plaid_service, "is_configured", lambda: True)
    monkeypatch.setattr(plaid_service, "create_link_token", lambda uid, access_token=None: f"link-{uid}-{bool(access_token)}")
    monkeypatch.setattr(plaid_service, "exchange_public_token", lambda pt: (TOKEN, f"item-{pt}"))
    monkeypatch.setattr(plaid_service, "get_institution", lambda token: f.institution)
    monkeypatch.setattr(plaid_service, "get_credit_accounts", f.credit_accounts)
    monkeypatch.setattr(plaid_service, "sync_transactions", f.changes)
    monkeypatch.setattr(plaid_service, "remove_item", lambda token: f.removed_tokens.append(token))
    return f


def link(client, headers, public_token="public-1"):
    return client.post("/plaid/exchange", json={"public_token": public_token}, headers=headers)


def cards(client, headers):
    return client.get("/cards", headers=headers).json()


def test_disabled_without_keys(client):
    h = auth_headers(client)
    assert client.get("/plaid/config", headers=h).json()["enabled"] is False
    assert client.post("/plaid/link-token", headers=h).status_code == 503
    assert client.post("/plaid/link-token").status_code == 401


def test_link_imports_credit_cards(client, fake):
    h = auth_headers(client)
    assert client.post("/plaid/link-token", headers=h).json()["link_token"].startswith("link-")

    res = link(client, h)
    assert res.status_code == 201
    item = res.json()
    assert item["institution_name"] == "First Platypus Bank"
    assert item["status"] == "ok"
    assert TOKEN not in res.text  # access token never leaves the server

    [card] = cards(client, h)
    assert card["id"] in item["card_ids"]
    assert card["source"] == "plaid"
    assert card["name"] == "Plaid Diamond Visa Signature"
    assert card["issuer"] == "First Platypus Bank"
    assert card["network"] == "visa"
    assert card["last_four"] == "3333"
    assert card["credit_limit_cents"] == 200000
    assert card["current_balance_cents"] == 41000
    assert card["statement_balance_cents"] == 170877
    assert card["minimum_payment_cents"] == 2000
    assert card["apr"] == 12.5
    assert card["payment_due_day"] == 28
    assert card["statement_close_day"] == 3
    assert card["synced_at"] is not None

    with SessionLocal() as db:
        stored = db.query(models.PlaidItem).one()
        assert TOKEN not in stored.access_token_encrypted


def test_transactions_import_after_plaid_is_ready(client, fake):
    h = auth_headers(client)
    fake.ready = False
    item = link(client, h).json()
    assert item["transactions_pending"] is True
    card_id = item["card_ids"][0]
    assert client.get(f"/cards/{card_id}/transactions", headers=h).json() == []

    fake.ready = True
    fake.pages = [{"added": [
        txn("t1", 12.34),
        txn("t2", -500.0, name="AUTOMATIC PAYMENT - THANK", merchant_name=None),
        txn("t3", 80.0, category="LOAN_PAYMENTS_CREDIT_CARD_PAYMENT", name="Payment", merchant_name=None),
        txn("t4", 9.99, pending=True),
        txn("t5", 42.0, account_id="someone-elses-checking"),
        txn("t6", 2078.5, name="AUTOMATIC PAYMENT - THANK", merchant_name="Autopay"),
        txn("t7", 15.0, name="Payment Plaza Parking", merchant_name="Payment Plaza"),
    ]}]
    item = client.post(f"/plaid/items/{item['id']}/sync", headers=h).json()
    assert item["transactions_pending"] is False

    txs = {t["description"]: t for t in client.get(f"/cards/{card_id}/transactions", headers=h).json()}
    assert set(txs) == {"Uber", "AUTOMATIC PAYMENT - THANK", "Payment", "Autopay", "Payment Plaza"}
    assert txs["Autopay"]["kind"] == "payment"  # positive amount, recognised by name
    assert txs["Payment Plaza"]["kind"] == "charge"  # merchant name alone isn't a payment
    assert (txs["Uber"]["kind"], txs["Uber"]["amount_cents"]) == ("charge", 1234)
    assert (txs["AUTOMATIC PAYMENT - THANK"]["kind"], txs["AUTOMATIC PAYMENT - THANK"]["amount_cents"]) == ("payment", 50000)
    assert txs["Payment"]["kind"] == "payment"
    assert all(t["synced"] for t in txs.values())
    # Imported activity never changes the bank-reported balance.
    assert cards(client, h)[0]["current_balance_cents"] == 41000


def test_modified_and_removed_transactions(client, fake):
    h = auth_headers(client)
    fake.pages = [
        {"added": [txn("t1", 10.0), txn("t2", 20.0)]},
        {"modified": [txn("t1", 15.0, merchant_name="Lyft")], "removed": ["t2"]},
    ]
    item = link(client, h).json()
    client.post(f"/plaid/items/{item['id']}/sync", headers=h)
    [tx] = client.get(f"/cards/{item['card_ids'][0]}/transactions", headers=h).json()
    assert (tx["description"], tx["amount_cents"]) == ("Lyft", 1500)


def test_resync_updates_balances_but_keeps_user_edits(client, fake):
    h = auth_headers(client)
    item = link(client, h).json()
    card_id = item["card_ids"][0]
    res = client.patch(f"/cards/{card_id}", json={"name": "Travel card", "color": "rose", "annual_fee_cents": 9500}, headers=h)
    assert res.status_code == 200

    fake.accounts = [account(current=999.99, limit=5000.0)]
    client.post(f"/plaid/items/{item['id']}/sync", headers=h)
    card = client.get(f"/cards/{card_id}", headers=h).json()
    assert (card["current_balance_cents"], card["credit_limit_cents"]) == (99999, 500000)
    assert (card["name"], card["color"], card["annual_fee_cents"]) == ("Travel card", "rose", 9500)


def test_bank_owned_data_is_read_only(client, fake):
    h = auth_headers(client)
    card_id = link(client, h).json()["card_ids"][0]
    card = client.get(f"/cards/{card_id}", headers=h).json()

    res = client.patch(f"/cards/{card_id}", json={"current_balance_cents": 1}, headers=h)
    assert res.status_code == 409 and res.json()["detail"]["field"] == "current_balance_cents"
    # Sending unchanged values (as the edit form does) is fine.
    assert client.patch(f"/cards/{card_id}", json={"current_balance_cents": card["current_balance_cents"], "name": "X"}, headers=h).status_code == 200

    assert client.delete(f"/cards/{card_id}", headers=h).status_code == 409
    assert client.post(f"/cards/{card_id}/transactions", json={"kind": "payment", "amount_cents": 100}, headers=h).status_code == 409


def test_login_required_is_reported_and_keeps_cards(client, fake):
    h = auth_headers(client)
    item = link(client, h).json()
    fake.error = plaid_service.PlaidError("ITEM_LOGIN_REQUIRED", "login required")
    item = client.post(f"/plaid/items/{item['id']}/sync", headers=h).json()
    assert item["status"] == "login_required"
    assert item["error_message"]
    assert len(cards(client, h)) == 1
    assert cards(client, h)[0]["sync_status"] == "login_required"
    assert client.post(f"/plaid/items/{item['id']}/link-token", headers=h).json()["link_token"].endswith("True")

    fake.error = None  # user reconnected through Link update mode
    assert client.post(f"/plaid/items/{item['id']}/sync", headers=h).json()["status"] == "ok"


def test_disconnect_removes_item_and_cards(client, fake):
    h = auth_headers(client)
    fake.pages = [{"added": [txn("t1", 10.0)]}]
    item = link(client, h).json()
    client.post("/cards", json={"name": "Manual", "issuer": "Chase"}, headers=h)

    assert client.delete(f"/plaid/items/{item['id']}", headers=h).status_code == 204
    assert fake.removed_tokens == [TOKEN]
    assert [c["name"] for c in cards(client, h)] == ["Manual"]
    assert client.get("/plaid/items", headers=h).json() == []
    with SessionLocal() as db:
        assert db.query(models.CardTransaction).count() == 0


def test_duplicate_bank_is_rejected(client, fake):
    h = auth_headers(client)
    link(client, h)
    res = link(client, h, "public-2")
    assert res.status_code == 409
    assert fake.removed_tokens == [TOKEN]  # the extra connection is revoked
    assert len(client.get("/plaid/items", headers=h).json()) == 1


def test_connections_are_private(client, fake):
    alice = auth_headers(client)
    item = link(client, alice).json()
    bob = auth_headers(client, email="bob@example.com", username="bob")
    assert client.get("/plaid/items", headers=bob).json() == []
    assert client.post(f"/plaid/items/{item['id']}/sync", headers=bob).status_code == 404
    assert client.post(f"/plaid/items/{item['id']}/link-token", headers=bob).status_code == 404
    assert client.delete(f"/plaid/items/{item['id']}", headers=bob).status_code == 404
    assert client.get(f"/cards/{item['card_ids'][0]}", headers=bob).status_code == 404


def test_auto_sync_is_throttled(client, fake, monkeypatch):
    h = auth_headers(client)
    item = link(client, h).json()
    calls = []
    real = plaid_sync.sync_item
    monkeypatch.setattr(plaid_sync, "sync_item", lambda db, it: calls.append(it.id) or real(db, it))

    client.post("/plaid/sync", headers=h)
    assert calls == []  # just synced

    with SessionLocal() as db:
        stored = db.get(models.PlaidItem, item["id"])
        stored.last_synced_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        db.commit()
    client.post("/plaid/sync", headers=h)
    assert calls == [item["id"]]

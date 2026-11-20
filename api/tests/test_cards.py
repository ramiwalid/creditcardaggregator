from datetime import date

from conftest import auth_headers
from routes.schemas import next_occurrence

CARD = {
    "name": "Sapphire Preferred",
    "issuer": "Chase",
    "network": "visa",
    "last_four": "1029",
    "credit_limit_cents": 2_000_000,
    "current_balance_cents": 460_000,
    "statement_balance_cents": 300_000,
    "minimum_payment_cents": 4_000,
    "apr": 24.99,
    "annual_fee_cents": 9_500,
    "payment_due_day": 15,
    "statement_close_day": 20,
}


def test_cards_require_auth(client):
    assert client.get("/cards").status_code == 401
    assert client.post("/cards", json=CARD).status_code == 401


def test_create_and_list_card_with_derived_fields(client):
    h = auth_headers(client)
    res = client.post("/cards", json=CARD, headers=h)
    assert res.status_code == 201, res.text
    card = res.json()
    assert card["utilization"] == 0.23
    assert card["available_credit_cents"] == 1_540_000
    assert card["next_due_date"] is not None
    assert 0 <= card["days_until_due"] <= 31

    cards = client.get("/cards", headers=h).json()
    assert [c["id"] for c in cards] == [card["id"]]


def test_card_validation(client):
    h = auth_headers(client)
    assert client.post("/cards", json={**CARD, "last_four": "12"}, headers=h).status_code == 422
    assert client.post("/cards", json={**CARD, "payment_due_day": 32}, headers=h).status_code == 422
    assert client.post("/cards", json={**CARD, "name": "   "}, headers=h).status_code == 422
    assert client.post("/cards", json={**CARD, "credit_limit_cents": -1}, headers=h).status_code == 422
    assert client.post("/cards", json={**CARD, "network": "diners"}, headers=h).status_code == 422


def test_users_cannot_see_or_modify_each_others_cards(client):
    alice = auth_headers(client)
    bob = auth_headers(client, email="bob@example.com", username="bob")
    card_id = client.post("/cards", json=CARD, headers=alice).json()["id"]

    assert client.get("/cards", headers=bob).json() == []
    assert client.get(f"/cards/{card_id}", headers=bob).status_code == 404
    assert client.patch(f"/cards/{card_id}", json={"name": "x"}, headers=bob).status_code == 404
    assert client.delete(f"/cards/{card_id}", headers=bob).status_code == 404
    assert client.post(
        f"/cards/{card_id}/transactions", json={"kind": "charge", "amount_cents": 1}, headers=bob
    ).status_code == 404
    assert client.get(f"/cards/{card_id}", headers=alice).status_code == 200


def test_update_card_partial(client):
    h = auth_headers(client)
    card_id = client.post("/cards", json=CARD, headers=h).json()["id"]
    res = client.patch(f"/cards/{card_id}", json={"current_balance_cents": 0, "last_four": ""}, headers=h)
    assert res.status_code == 200
    body = res.json()
    assert body["current_balance_cents"] == 0
    assert body["last_four"] is None
    assert body["name"] == CARD["name"]
    assert client.patch(f"/cards/{card_id}", json={"name": None}, headers=h).status_code == 422


def test_delete_card_cascades_transactions(client):
    h = auth_headers(client)
    card_id = client.post("/cards", json=CARD, headers=h).json()["id"]
    client.post(f"/cards/{card_id}/transactions", json={"kind": "charge", "amount_cents": 500}, headers=h)
    assert client.delete(f"/cards/{card_id}", headers=h).status_code == 204
    assert client.get(f"/cards/{card_id}", headers=h).status_code == 404

    from routes.database import models
    from routes.database.session import SessionLocal

    with SessionLocal() as db:
        assert db.query(models.CardTransaction).count() == 0


def test_transactions_adjust_balance_and_reverse_on_delete(client):
    h = auth_headers(client)
    card_id = client.post("/cards", json=CARD, headers=h).json()["id"]

    pay = client.post(
        f"/cards/{card_id}/transactions",
        json={"kind": "payment", "amount_cents": 60_000, "description": "Autopay"},
        headers=h,
    )
    assert pay.status_code == 201
    client.post(
        f"/cards/{card_id}/transactions",
        json={"kind": "charge", "amount_cents": 12_345, "occurred_on": "2026-01-02"},
        headers=h,
    )
    card = client.get(f"/cards/{card_id}", headers=h).json()
    assert card["current_balance_cents"] == 460_000 - 60_000 + 12_345

    txs = client.get(f"/cards/{card_id}/transactions", headers=h).json()
    assert len(txs) == 2
    assert txs[0]["occurred_on"] >= txs[1]["occurred_on"]  # newest first

    assert client.delete(f"/cards/{card_id}/transactions/{pay.json()['id']}", headers=h).status_code == 204
    card = client.get(f"/cards/{card_id}", headers=h).json()
    assert card["current_balance_cents"] == 460_000 + 12_345

    bad = client.post(f"/cards/{card_id}/transactions", json={"kind": "payment", "amount_cents": 0}, headers=h)
    assert bad.status_code == 422


def test_summary(client):
    h = auth_headers(client)
    empty = client.get("/cards/summary", headers=h).json()
    assert empty["card_count"] == 0 and empty["overall_utilization"] is None

    client.post("/cards", json=CARD, headers=h)
    client.post(
        "/cards",
        json={"name": "Gold", "issuer": "American Express", "network": "amex",
              "current_balance_cents": 100_000, "annual_fee_cents": 32_500, "payment_due_day": 3},
        headers=h,
    )
    client.post(
        "/cards",
        json={"name": "Freedom", "issuer": "Chase", "credit_limit_cents": 1_000_000,
              "current_balance_cents": 40_000},
        headers=h,
    )
    s = client.get("/cards/summary", headers=h).json()
    assert s["card_count"] == 3
    assert s["total_balance_cents"] == 600_000
    assert s["total_limit_cents"] == 3_000_000
    # The Amex charge card has no limit, so it's excluded from utilization.
    assert s["overall_utilization"] == round(500_000 / 3_000_000, 4)
    assert s["total_annual_fees_cents"] == 42_000
    assert s["total_minimum_due_cents"] == 4_000
    assert len(s["upcoming_payments"]) == 2  # Freedom has no due day
    dues = [p["due_date"] for p in s["upcoming_payments"]]
    assert dues == sorted(dues)


def test_next_occurrence_clamps_and_rolls_over():
    assert next_occurrence(15, date(2026, 3, 10)) == date(2026, 3, 15)
    assert next_occurrence(15, date(2026, 3, 15)) == date(2026, 3, 15)
    assert next_occurrence(15, date(2026, 3, 16)) == date(2026, 4, 15)
    assert next_occurrence(31, date(2026, 2, 10)) == date(2026, 2, 28)
    assert next_occurrence(31, date(2026, 4, 30)) == date(2026, 4, 30)
    assert next_occurrence(5, date(2026, 12, 20)) == date(2027, 1, 5)

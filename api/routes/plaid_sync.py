"""Copies data from Plaid into Quanta's cards and transactions tables.

For linked cards the bank is the source of truth: balances, limits, due
dates and activity are overwritten on every sync. Fields the user can't get
from a bank (nickname, colour, annual fee, rewards) are left alone after the
card is first imported.
"""
import logging
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from routes import crypto, plaid_service
from routes.database import models

logger = logging.getLogger("quanta.plaid")

# Opening the dashboard syncs at most this often per connection.
AUTO_SYNC_INTERVAL = timedelta(minutes=5)

_COLORS = ["violet", "ocean", "sunset", "emerald", "graphite", "rose"]
_NETWORK_HINTS = [
    ("american express", "amex"),
    ("amex", "amex"),
    ("mastercard", "mastercard"),
    ("discover", "discover"),
    ("visa", "visa"),
]
_CARD_PAYMENT_CATEGORIES = {"LOAN_PAYMENTS_CREDIT_CARD_PAYMENT"}
# Some issuers (and Plaid's sandbox) report card payments as positive
# amounts without a category, so also recognise the usual descriptions.
_PAYMENT_NAME_RE = re.compile(
    r"^(automatic payment|autopay|payment)\b.*\b(thank|received)|^(online |mobile )?payment[ -]+thank",
    re.IGNORECASE,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _cents(amount) -> int | None:
    return None if amount is None else int(round(float(amount) * 100))


def _aware(dt: datetime | None) -> datetime | None:
    # SQLite hands timestamps back without tzinfo; they're stored as UTC.
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _guess_network(*names: str | None) -> str:
    text = " ".join(n for n in names if n).lower()
    return next((net for hint, net in _NETWORK_HINTS if hint in text), "other")


def _card_name(account: dict) -> str:
    name = (account.get("official_name") or account.get("name") or "Credit card").strip()
    return name[:60]


def _apply_bank_fields(card: models.Card, account: dict) -> None:
    mask = account.get("mask") or ""
    card.last_four = mask[-4:] if len(mask) >= 4 and mask[-4:].isdigit() else None
    card.credit_limit_cents = max(_cents(account.get("limit")) or 0, 0)
    card.current_balance_cents = _cents(account.get("current")) or 0
    card.statement_balance_cents = _cents(account.get("last_statement_balance"))
    card.minimum_payment_cents = _cents(account.get("minimum_payment"))
    card.apr = account.get("purchase_apr")
    due = account.get("next_payment_due_date")
    card.payment_due_day = due.day if due else None
    statement = account.get("last_statement_issue_date")
    card.statement_close_day = statement.day if statement else None


def _upsert_cards(db: Session, item: models.PlaidItem, accounts: list[dict]) -> None:
    existing = {c.plaid_account_id: c for c in item.cards}
    color_offset = db.query(models.Card).filter(models.Card.user_id == item.user_id).count()
    for account in accounts:
        card = existing.get(account["account_id"])
        if card is None:
            card = models.Card(
                user_id=item.user_id,
                source="plaid",
                plaid_item=item,
                plaid_account_id=account["account_id"],
                name=_card_name(account),
                issuer=(item.institution_name or "Linked bank")[:60],
                network=_guess_network(account.get("official_name"), account.get("name"), item.institution_name),
                color=_COLORS[color_offset % len(_COLORS)],
                annual_fee_cents=0,
            )
            color_offset += 1
            db.add(card)
        _apply_bank_fields(card, account)
    db.flush()


def _transaction_fields(t: dict) -> dict:
    amount = _cents(t["amount"])
    # Plaid: positive = money leaving the account (a purchase on a card).
    is_payment = (
        amount < 0
        or t.get("category") in _CARD_PAYMENT_CATEGORIES
        or bool(_PAYMENT_NAME_RE.search(t.get("name") or ""))
    )
    description = (t.get("merchant_name") or t.get("name") or "").strip()[:120] or None
    return {
        "kind": "payment" if is_payment else "charge",
        "amount_cents": abs(amount),
        "description": description,
        "occurred_on": t["date"],
    }


def _apply_transactions(db: Session, item: models.PlaidItem, changes: dict) -> None:
    cards_by_account = {c.plaid_account_id: c for c in item.cards}

    removed = set(changes["removed"])
    for t in changes["added"] + changes["modified"]:
        if t["pending"]:
            # Pending entries get a new id once they post; skip until then.
            removed.add(t["transaction_id"])
    if removed:
        db.query(models.CardTransaction).filter(
            models.CardTransaction.plaid_transaction_id.in_(removed),
            models.CardTransaction.card_id.in_([c.id for c in item.cards] or [0]),
        ).delete(synchronize_session=False)

    for t in changes["added"] + changes["modified"]:
        card = cards_by_account.get(t["account_id"])
        if card is None or t["pending"]:
            continue
        fields = _transaction_fields(t)
        if fields["amount_cents"] == 0:
            continue
        tx = (
            db.query(models.CardTransaction)
            .filter(models.CardTransaction.plaid_transaction_id == t["transaction_id"])
            .first()
        )
        if tx is None:
            tx = models.CardTransaction(plaid_transaction_id=t["transaction_id"], card_id=card.id)
            db.add(tx)
        elif tx.card_id != card.id:
            continue  # belongs to another card/user; never cross wires
        for key, value in fields.items():
            setattr(tx, key, value)


def sync_item(db: Session, item: models.PlaidItem) -> models.PlaidItem:
    """Pull accounts and transactions for one connection. Plaid errors are
    recorded on the item (and shown in the UI) rather than raised."""
    try:
        access_token = crypto.decrypt(item.access_token_encrypted)
        accounts = plaid_service.get_credit_accounts(access_token)
        _upsert_cards(db, item, accounts)
        changes = plaid_service.sync_transactions(access_token, item.transactions_cursor)
        _apply_transactions(db, item, changes)
        # Empty cursor = Plaid's first import isn't ready; keep polling.
        item.transactions_cursor = changes["next_cursor"] or item.transactions_cursor
        item.status = "ok"
        item.error_message = None
    except plaid_service.PlaidError as exc:
        db.rollback()
        item.status = "login_required" if exc.code in plaid_service.LOGIN_REQUIRED_CODES else "error"
        item.error_message = (
            exc.display_message
            or ("Sign in to your bank again to keep this connection syncing."
                if item.status == "login_required"
                else "Your bank didn't respond. Try syncing again in a few minutes.")
        )
    except RuntimeError as exc:  # e.g. TOKEN_ENCRYPTION_KEY changed
        db.rollback()
        logger.error("Can't sync item %s: %s", item.id, exc)
        item.status = "error"
        item.error_message = "This connection can't be read anymore. Disconnect and link it again."
    item.last_synced_at = _now()
    db.commit()
    db.refresh(item)
    return item


def needs_sync(item: models.PlaidItem) -> bool:
    if not item.transactions_cursor:
        return True  # still waiting on the first transaction import
    last = _aware(item.last_synced_at)
    return last is None or _now() - last >= AUTO_SYNC_INTERVAL

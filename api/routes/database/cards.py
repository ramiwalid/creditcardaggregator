from sqlalchemy.orm import Session

from routes import schemas
from . import models


def list_cards(db: Session, user_id: int) -> list[models.Card]:
    return (
        db.query(models.Card)
        .filter(models.Card.user_id == user_id)
        .order_by(models.Card.created_at, models.Card.id)
        .all()
    )


def get_card(db: Session, user_id: int, card_id: int) -> models.Card | None:
    """Fetch a card only if it belongs to `user_id`."""
    return (
        db.query(models.Card)
        .filter(models.Card.id == card_id, models.Card.user_id == user_id)
        .first()
    )


def create_card(db: Session, user_id: int, data: schemas.CardCreate) -> models.Card:
    card = models.Card(user_id=user_id, **data.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def update_card(db: Session, card: models.Card, data: schemas.CardUpdate) -> models.Card:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


def delete_card(db: Session, card: models.Card) -> None:
    db.delete(card)
    db.commit()


def _balance_delta(kind: str, amount_cents: int) -> int:
    return amount_cents if kind == "charge" else -amount_cents


def add_transaction(
    db: Session, card: models.Card, data: schemas.TransactionCreate
) -> models.CardTransaction:
    tx = models.CardTransaction(card_id=card.id, **data.model_dump(exclude_none=True))
    card.current_balance_cents += _balance_delta(data.kind, data.amount_cents)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def get_transaction(
    db: Session, card: models.Card, tx_id: int
) -> models.CardTransaction | None:
    return (
        db.query(models.CardTransaction)
        .filter(models.CardTransaction.id == tx_id, models.CardTransaction.card_id == card.id)
        .first()
    )


def delete_transaction(db: Session, card: models.Card, tx: models.CardTransaction) -> None:
    card.current_balance_cents -= _balance_delta(tx.kind, tx.amount_cents)
    db.delete(tx)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from routes import schemas
from routes.database import cards as card_db
from routes.database import models
from routes.database.session import get_db
from routes.security import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])


def _get_owned_card(card_id: int, user: models.User, db: Session) -> models.Card:
    card = card_db.get_card(db, user.id, card_id)
    if card is None:
        # 404 rather than 403 so other users' card IDs aren't confirmed to exist.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return card


@router.get("/summary", response_model=schemas.CardSummary)
def summary(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    cards = [schemas.CardOut.model_validate(c) for c in card_db.list_cards(db, user.id)]

    total_balance = sum(max(c.current_balance_cents, 0) for c in cards)
    total_limit = sum(c.credit_limit_cents for c in cards)
    upcoming = sorted(
        (
            schemas.UpcomingPayment(
                card_id=c.id,
                card_name=c.name,
                issuer=c.issuer,
                last_four=c.last_four,
                due_date=c.next_due_date,
                days_until_due=c.days_until_due,
                minimum_payment_cents=c.minimum_payment_cents,
                statement_balance_cents=c.statement_balance_cents,
            )
            for c in cards
            if c.next_due_date is not None
        ),
        key=lambda p: (p.due_date, p.card_name),
    )

    return schemas.CardSummary(
        card_count=len(cards),
        total_balance_cents=total_balance,
        total_limit_cents=total_limit,
        total_available_cents=sum(c.available_credit_cents for c in cards),
        # Utilization only counts cards that have a limit (charge cards don't).
        overall_utilization=(
            round(
                sum(max(c.current_balance_cents, 0) for c in cards if c.credit_limit_cents > 0)
                / total_limit,
                4,
            )
            if total_limit > 0
            else None
        ),
        total_minimum_due_cents=sum(c.minimum_payment_cents or 0 for c in cards),
        total_statement_balance_cents=sum(max(c.statement_balance_cents or 0, 0) for c in cards),
        total_annual_fees_cents=sum(c.annual_fee_cents for c in cards),
        upcoming_payments=upcoming,
    )


@router.get("", response_model=list[schemas.CardOut])
def list_cards(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return card_db.list_cards(db, user.id)


@router.post("", response_model=schemas.CardOut, status_code=status.HTTP_201_CREATED)
def create_card(
    body: schemas.CardCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return card_db.create_card(db, user.id, body)


@router.get("/{card_id}", response_model=schemas.CardOut)
def get_card(
    card_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_card(card_id, user, db)


@router.patch("/{card_id}", response_model=schemas.CardOut)
def update_card(
    card_id: int,
    body: schemas.CardUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_owned_card(card_id, user, db)
    return card_db.update_card(db, card, body)


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card_db.delete_card(db, _get_owned_card(card_id, user, db))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{card_id}/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(
    card_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_card(card_id, user, db).transactions


@router.post(
    "/{card_id}/transactions",
    response_model=schemas.TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
def add_transaction(
    card_id: int,
    body: schemas.TransactionCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_owned_card(card_id, user, db)
    return card_db.add_transaction(db, card, body)


@router.delete("/{card_id}/transactions/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    card_id: int,
    tx_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_owned_card(card_id, user, db)
    tx = card_db.get_transaction(db, card, tx_id)
    if tx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    card_db.delete_transaction(db, card, tx)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

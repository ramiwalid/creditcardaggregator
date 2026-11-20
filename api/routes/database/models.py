from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from .session import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    username = Column(String, index=True, nullable=False)
    # Nullable because accounts created before names were collected don't have them.
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    cards = relationship(
        "Card", back_populates="owner", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(email='{self.email}')>"


class Card(Base):
    """A credit card the user is tracking.

    Money is stored as integer cents to avoid floating point rounding. Only
    the last four digits of a card number are ever stored -- never the full
    PAN, CVV or expiry.
    """

    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    name = Column(String, nullable=False)  # e.g. "Sapphire Preferred"
    issuer = Column(String, nullable=False)  # e.g. "Chase"
    network = Column(String, nullable=False, default="visa")
    last_four = Column(String(4), nullable=True)
    color = Column(String, nullable=False, default="violet")

    credit_limit_cents = Column(Integer, nullable=False, default=0)
    current_balance_cents = Column(Integer, nullable=False, default=0)
    statement_balance_cents = Column(Integer, nullable=True)
    minimum_payment_cents = Column(Integer, nullable=True)

    apr = Column(Float, nullable=True)  # percent, e.g. 24.99
    annual_fee_cents = Column(Integer, nullable=False, default=0)
    statement_close_day = Column(Integer, nullable=True)  # 1-31
    payment_due_day = Column(Integer, nullable=True)  # 1-31
    rewards = Column(String, nullable=True)  # free text, e.g. "3x dining"

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    owner = relationship("User", back_populates="cards")
    transactions = relationship(
        "CardTransaction",
        back_populates="card",
        cascade="all, delete-orphan",
        order_by="desc(CardTransaction.occurred_on), desc(CardTransaction.id)",
    )

    __table_args__ = (
        CheckConstraint("credit_limit_cents >= 0", name="ck_card_limit_nonneg"),
        CheckConstraint("annual_fee_cents >= 0", name="ck_card_fee_nonneg"),
    )


class CardTransaction(Base):
    """A manually logged payment or charge. Logging one adjusts the card's
    current balance; deleting it reverses the adjustment."""

    __tablename__ = "card_transactions"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(
        Integer, ForeignKey("cards.id", ondelete="CASCADE"), index=True, nullable=False
    )
    kind = Column(String, nullable=False)  # "payment" | "charge"
    amount_cents = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    occurred_on = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    card = relationship("Card", back_populates="transactions")

    __table_args__ = (
        CheckConstraint("amount_cents > 0", name="ck_tx_amount_positive"),
        CheckConstraint("kind IN ('payment', 'charge')", name="ck_tx_kind"),
    )


class ContactMessage(Base):
    """Messages sent from the landing page contact form."""

    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

import calendar
from datetime import date, datetime, timezone
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, computed_field, field_validator


def _as_utc(value: datetime) -> datetime:
    # SQLite drops tzinfo; timestamps are stored in UTC. Without this the
    # browser would read them as local time.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


UTCDateTime = Annotated[datetime, AfterValidator(_as_utc)]

# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    username: str


class UserLogin(BaseModel):
    identifier: str = Field(description="Email address or username")
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    first_name: str | None = None
    last_name: str | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class MessageResponse(BaseModel):
    message: str


# --------------------------------------------------------------------------
# Cards
# --------------------------------------------------------------------------

Network = Literal["visa", "mastercard", "amex", "discover", "other"]
CardColor = Literal["violet", "ocean", "sunset", "emerald", "graphite", "rose"]
# Money fields are capped at $100M to catch typos.


def next_occurrence(day: int, today: date) -> date:
    """Next date (today or later) falling on `day` of the month. Days past
    the end of a short month clamp to its last day (e.g. 31 -> Feb 28)."""
    year, month = today.year, today.month
    for _ in range(2):
        last = calendar.monthrange(year, month)[1]
        candidate = date(year, month, min(day, last))
        if candidate >= today:
            return candidate
        month += 1
        if month == 13:
            year, month = year + 1, 1
    raise AssertionError("unreachable")


class _CardFields(BaseModel):
    @field_validator("last_four", check_fields=False)
    @classmethod
    def _four_digits(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if len(v) != 4 or not v.isdigit():
            raise ValueError("must be exactly 4 digits")
        return v

    @field_validator("name", "issuer", check_fields=False)
    @classmethod
    def _not_blank(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v

    @field_validator("rewards", check_fields=False)
    @classmethod
    def _blank_to_none(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip() or None


class CardCreate(_CardFields):
    name: str = Field(max_length=60)
    issuer: str = Field(max_length=60)
    network: Network = "visa"
    last_four: str | None = None
    color: CardColor = "violet"

    credit_limit_cents: int = Field(default=0, ge=0, le=100_000_000_00)
    current_balance_cents: int = Field(default=0, ge=-100_000_000_00, le=100_000_000_00)
    statement_balance_cents: int | None = Field(default=None, ge=-100_000_000_00, le=100_000_000_00)
    minimum_payment_cents: int | None = Field(default=None, ge=0, le=100_000_000_00)

    apr: float | None = Field(default=None, ge=0, le=100)
    annual_fee_cents: int = Field(default=0, ge=0, le=100_000_00)
    statement_close_day: int | None = Field(default=None, ge=1, le=31)
    payment_due_day: int | None = Field(default=None, ge=1, le=31)
    rewards: str | None = Field(default=None, max_length=200)


class CardUpdate(_CardFields):
    """All fields optional; only the ones sent are changed."""

    name: str | None = Field(default=None, max_length=60)
    issuer: str | None = Field(default=None, max_length=60)
    network: Network | None = None
    last_four: str | None = None
    color: CardColor | None = None

    credit_limit_cents: int | None = Field(default=None, ge=0, le=100_000_000_00)
    current_balance_cents: int | None = Field(default=None, ge=-100_000_000_00, le=100_000_000_00)
    statement_balance_cents: int | None = Field(default=None, ge=-100_000_000_00, le=100_000_000_00)
    minimum_payment_cents: int | None = Field(default=None, ge=0, le=100_000_000_00)

    apr: float | None = Field(default=None, ge=0, le=100)
    annual_fee_cents: int | None = Field(default=None, ge=0, le=100_000_00)
    statement_close_day: int | None = Field(default=None, ge=1, le=31)
    payment_due_day: int | None = Field(default=None, ge=1, le=31)
    rewards: str | None = Field(default=None, max_length=200)

    @field_validator(
        "name", "issuer", "network", "color", "credit_limit_cents",
        "current_balance_cents", "annual_fee_cents",
    )
    @classmethod
    def _required_not_null(cls, v):
        # These columns are NOT NULL; omit the field instead of sending null.
        if v is None:
            raise ValueError("cannot be null")
        return v


class CardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    issuer: str
    network: str
    last_four: str | None
    color: str
    credit_limit_cents: int
    current_balance_cents: int
    statement_balance_cents: int | None
    minimum_payment_cents: int | None
    apr: float | None
    annual_fee_cents: int
    statement_close_day: int | None
    payment_due_day: int | None
    rewards: str | None
    # "manual" or "plaid". For linked cards, bank-owned fields are read-only.
    source: str = "manual"
    plaid_item_id: int | None = None
    synced_at: UTCDateTime | None = None
    sync_status: str | None = None

    @computed_field
    @property
    def available_credit_cents(self) -> int:
        return max(self.credit_limit_cents - max(self.current_balance_cents, 0), 0)

    @computed_field
    @property
    def utilization(self) -> float | None:
        """Balance / limit as a fraction (0.23 == 23%). None when no limit."""
        if self.credit_limit_cents <= 0:
            return None
        return round(max(self.current_balance_cents, 0) / self.credit_limit_cents, 4)

    @computed_field
    @property
    def next_due_date(self) -> date | None:
        if self.payment_due_day is None:
            return None
        return next_occurrence(self.payment_due_day, date.today())

    @computed_field
    @property
    def days_until_due(self) -> int | None:
        due = self.next_due_date
        return None if due is None else (due - date.today()).days

    @computed_field
    @property
    def next_statement_date(self) -> date | None:
        if self.statement_close_day is None:
            return None
        return next_occurrence(self.statement_close_day, date.today())


class UpcomingPayment(BaseModel):
    card_id: int
    card_name: str
    issuer: str
    last_four: str | None
    due_date: date
    days_until_due: int
    minimum_payment_cents: int | None
    statement_balance_cents: int | None


class CardSummary(BaseModel):
    card_count: int
    total_balance_cents: int
    total_limit_cents: int
    total_available_cents: int
    overall_utilization: float | None
    total_minimum_due_cents: int
    total_statement_balance_cents: int
    total_annual_fees_cents: int
    upcoming_payments: list[UpcomingPayment]


# --------------------------------------------------------------------------
# Transactions
# --------------------------------------------------------------------------


class TransactionCreate(BaseModel):
    kind: Literal["payment", "charge"]
    amount_cents: int = Field(gt=0, le=100_000_000_00)
    description: str | None = Field(default=None, max_length=120)
    occurred_on: date | None = None

    @field_validator("description")
    @classmethod
    def _blank_to_none(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip() or None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    card_id: int
    kind: str
    amount_cents: int
    description: str | None
    occurred_on: date
    synced: bool = False


# --------------------------------------------------------------------------
# Plaid
# --------------------------------------------------------------------------


class PlaidConfig(BaseModel):
    enabled: bool
    environment: str


class LinkToken(BaseModel):
    link_token: str


class PublicTokenExchange(BaseModel):
    public_token: str = Field(min_length=1, max_length=200)


class PlaidItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_name: str | None
    status: str
    error_message: str | None
    last_synced_at: UTCDateTime | None
    created_at: UTCDateTime
    card_ids: list[int]
    transactions_pending: bool


# --------------------------------------------------------------------------
# Contact
# --------------------------------------------------------------------------


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(max_length=254)
    message: str = Field(min_length=10, max_length=4000)

    @field_validator("name", "message")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        from routes.security import check_email

        v = v.strip().lower()
        if not check_email(v):
            raise ValueError("enter a valid email address")
        return v

"""Thin wrapper around the Plaid SDK.

Everything here returns plain, normalised Python data (dicts, dates, floats)
so the rest of the app never touches Plaid SDK models, and tests can swap
this module's functions for fakes without any network access.
"""
import json
import logging
import os
from datetime import date
from functools import lru_cache

import plaid
from dotenv import load_dotenv
from plaid.api import plaid_api
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.credit_account_subtype import CreditAccountSubtype
from plaid.model.credit_account_subtypes import CreditAccountSubtypes
from plaid.model.credit_filter import CreditFilter
from plaid.model.institutions_get_by_id_request import InstitutionsGetByIdRequest
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.item_remove_request import ItemRemoveRequest
from plaid.model.liabilities_get_request import LiabilitiesGetRequest
from plaid.model.link_token_account_filters import LinkTokenAccountFilters
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from routes import crypto

load_dotenv()

logger = logging.getLogger("quanta.plaid")

PLAID_CLIENT_ID = os.environ.get("PLAID_CLIENT_ID")
PLAID_SECRET = os.environ.get("PLAID_SECRET")
PLAID_ENV = os.environ.get("PLAID_ENV", "sandbox").lower()

_HOSTS = {"sandbox": plaid.Environment.Sandbox, "production": plaid.Environment.Production}

# Error codes that mean the user has to sign in to their bank again.
LOGIN_REQUIRED_CODES = {"ITEM_LOGIN_REQUIRED", "PENDING_EXPIRATION", "ACCESS_NOT_GRANTED"}
# Liabilities isn't available for every institution; fall back to balances.
_LIABILITIES_UNAVAILABLE = {"PRODUCTS_NOT_SUPPORTED", "NO_LIABILITY_ACCOUNTS", "PRODUCT_NOT_READY"}


class PlaidError(Exception):
    def __init__(self, code: str, message: str, display_message: str | None = None):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message
        self.display_message = display_message


def is_configured() -> bool:
    return bool(PLAID_CLIENT_ID and PLAID_SECRET and PLAID_ENV in _HOSTS and crypto.is_configured())


@lru_cache(maxsize=1)
def _client() -> plaid_api.PlaidApi:
    if not is_configured():
        raise PlaidError("NOT_CONFIGURED", "Plaid keys or TOKEN_ENCRYPTION_KEY missing")
    config = plaid.Configuration(
        host=_HOSTS[PLAID_ENV],
        api_key={"clientId": PLAID_CLIENT_ID, "secret": PLAID_SECRET},
    )
    return plaid_api.PlaidApi(plaid.ApiClient(config))


def _call(method: str, request):
    try:
        return getattr(_client(), method)(request).to_dict()
    except plaid.ApiException as exc:
        try:
            body = json.loads(exc.body or "{}")
        except ValueError:
            body = {}
        error = PlaidError(
            body.get("error_code") or "API_ERROR",
            body.get("error_message") or str(exc),
            body.get("display_message"),
        )
        logger.warning("Plaid %s failed: %s (request_id=%s)", method, error, body.get("request_id"))
        raise error from exc


# --------------------------------------------------------------------------
# Link
# --------------------------------------------------------------------------

def create_link_token(user_id: int, access_token: str | None = None) -> str:
    """Link token for a new connection, or (with `access_token`) for update
    mode, which lets the user re-authenticate an existing connection."""
    kwargs = dict(
        user=LinkTokenCreateRequestUser(client_user_id=str(user_id)),
        client_name="Quanta",
        country_codes=[CountryCode("US")],
        language="en",
    )
    if access_token:
        kwargs["access_token"] = access_token
    else:
        kwargs["products"] = [Products("liabilities")]
        kwargs["additional_consented_products"] = [Products("transactions")]
        # Only offer credit cards in Link: Quanta never sees checking/savings.
        kwargs["account_filters"] = LinkTokenAccountFilters(
            credit=CreditFilter(
                account_subtypes=CreditAccountSubtypes([CreditAccountSubtype("credit card")])
            )
        )
    return _call("link_token_create", LinkTokenCreateRequest(**kwargs))["link_token"]


def exchange_public_token(public_token: str) -> tuple[str, str]:
    """Returns (access_token, item_id)."""
    res = _call("item_public_token_exchange", ItemPublicTokenExchangeRequest(public_token=public_token))
    return res["access_token"], res["item_id"]


def get_institution(access_token: str) -> tuple[str | None, str | None]:
    """Returns (institution_id, institution_name)."""
    item = _call("item_get", ItemGetRequest(access_token=access_token))["item"]
    institution_id = item.get("institution_id")
    if not institution_id:
        return None, None
    try:
        inst = _call(
            "institutions_get_by_id",
            InstitutionsGetByIdRequest(institution_id=institution_id, country_codes=[CountryCode("US")]),
        )["institution"]
        return institution_id, inst.get("name")
    except PlaidError:
        return institution_id, None


def remove_item(access_token: str) -> None:
    _call("item_remove", ItemRemoveRequest(access_token=access_token))


# --------------------------------------------------------------------------
# Data
# --------------------------------------------------------------------------

def _as_date(value) -> date | None:
    if value is None or isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def get_credit_accounts(access_token: str) -> list[dict]:
    """Credit card accounts with balances and (when available) statement
    details from the Liabilities product."""
    try:
        res = _call("liabilities_get", LiabilitiesGetRequest(access_token=access_token))
        liabilities = {c["account_id"]: c for c in (res.get("liabilities") or {}).get("credit") or []}
    except PlaidError as exc:
        if exc.code not in _LIABILITIES_UNAVAILABLE:
            raise
        res = _call("accounts_get", AccountsGetRequest(access_token=access_token))
        liabilities = {}

    accounts = []
    for a in res["accounts"]:
        if str(a.get("type")) != "credit":
            continue
        balances = a.get("balances") or {}
        credit = liabilities.get(a["account_id"]) or {}
        purchase_apr = next(
            (x["apr_percentage"] for x in credit.get("aprs") or [] if str(x.get("apr_type")) == "purchase_apr"),
            None,
        )
        accounts.append({
            "account_id": a["account_id"],
            "name": a.get("name"),
            "official_name": a.get("official_name"),
            "mask": a.get("mask"),
            "current": balances.get("current"),
            "limit": balances.get("limit"),
            "last_statement_balance": credit.get("last_statement_balance"),
            "minimum_payment": credit.get("minimum_payment_amount"),
            "next_payment_due_date": _as_date(credit.get("next_payment_due_date")),
            "last_statement_issue_date": _as_date(credit.get("last_statement_issue_date")),
            "purchase_apr": purchase_apr,
        })
    return accounts


def _normalise_transaction(t: dict) -> dict:
    pfc = t.get("personal_finance_category") or {}
    return {
        "transaction_id": t["transaction_id"],
        "account_id": t["account_id"],
        "amount": t["amount"],
        "date": _as_date(t["date"]),
        "name": t.get("name"),
        "merchant_name": t.get("merchant_name"),
        "pending": bool(t.get("pending")),
        "category": pfc.get("detailed"),
    }


def sync_transactions(access_token: str, cursor: str | None) -> dict:
    """Pull every change since `cursor`.

    Returns {"added", "modified", "removed" (ids), "next_cursor"}. An empty
    next_cursor means Plaid hasn't finished the first import yet.
    """
    start = cursor or ""
    for _attempt in range(3):
        added, modified, removed = [], [], []
        current = start
        try:
            while True:
                res = _call(
                    "transactions_sync",
                    TransactionsSyncRequest(access_token=access_token, cursor=current, count=500),
                )
                added += res["added"]
                modified += res["modified"]
                removed += [r["transaction_id"] for r in res["removed"]]
                current = res["next_cursor"]
                if not res["has_more"]:
                    break
        except PlaidError as exc:
            # Data changed mid-pagination: Plaid says to restart from the
            # original cursor.
            if exc.code == "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION":
                continue
            raise
        return {
            "added": [_normalise_transaction(t) for t in added],
            "modified": [_normalise_transaction(t) for t in modified],
            "removed": removed,
            "next_cursor": current,
        }
    raise PlaidError("TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION", "Transactions kept changing; try again")

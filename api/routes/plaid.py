"""Bank linking through Plaid.

Flow: the browser asks for a link token, opens Plaid Link, and sends the
resulting public token to /plaid/exchange. The long-lived access token is
encrypted and stored server-side only; the browser never sees it.
"""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from routes import crypto, plaid_service, plaid_sync, schemas
from routes.database import models
from routes.database.session import get_db
from routes.security import get_current_user

router = APIRouter(prefix="/plaid", tags=["plaid"])


def _require_configured() -> None:
    if not plaid_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bank linking isn't set up on this server.",
        )


def _plaid_failure(exc: plaid_service.PlaidError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=exc.display_message or "Couldn't reach Plaid. Please try again.",
    )


def _owned_item(item_id: int, user: models.User, db: Session) -> models.PlaidItem:
    item = (
        db.query(models.PlaidItem)
        .filter(models.PlaidItem.id == item_id, models.PlaidItem.user_id == user.id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    return item


def _user_items(user: models.User, db: Session) -> list[models.PlaidItem]:
    return (
        db.query(models.PlaidItem)
        .filter(models.PlaidItem.user_id == user.id)
        .order_by(models.PlaidItem.created_at, models.PlaidItem.id)
        .all()
    )


@router.get("/config", response_model=schemas.PlaidConfig)
def config(_user: models.User = Depends(get_current_user)):
    return {"enabled": plaid_service.is_configured(), "environment": plaid_service.PLAID_ENV}


@router.post("/link-token", response_model=schemas.LinkToken)
def link_token(user: models.User = Depends(get_current_user)):
    _require_configured()
    try:
        return {"link_token": plaid_service.create_link_token(user.id)}
    except plaid_service.PlaidError as exc:
        raise _plaid_failure(exc)


@router.post("/exchange", response_model=schemas.PlaidItemOut, status_code=status.HTTP_201_CREATED)
def exchange(
    body: schemas.PublicTokenExchange,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_configured()
    try:
        access_token, item_id = plaid_service.exchange_public_token(body.public_token)
        institution_id, institution_name = plaid_service.get_institution(access_token)
    except plaid_service.PlaidError as exc:
        raise _plaid_failure(exc)

    duplicate = (
        db.query(models.PlaidItem)
        .filter(models.PlaidItem.user_id == user.id, models.PlaidItem.institution_id == institution_id)
        .first()
        if institution_id
        else None
    )
    if duplicate is not None:
        # Don't keep (or pay for) a second connection to the same bank.
        try:
            plaid_service.remove_item(access_token)
        except plaid_service.PlaidError:
            pass
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{institution_name or 'That bank'} is already connected. Use Sync to refresh it.",
        )

    item = models.PlaidItem(
        user_id=user.id,
        item_id=item_id,
        access_token_encrypted=crypto.encrypt(access_token),
        institution_id=institution_id,
        institution_name=institution_name,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return plaid_sync.sync_item(db, item)


@router.get("/items", response_model=list[schemas.PlaidItemOut])
def list_items(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_items(user, db)


@router.post("/sync", response_model=list[schemas.PlaidItemOut])
def sync_all(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Called when the dashboard opens; only syncs connections that are due."""
    items = _user_items(user, db)
    if plaid_service.is_configured():
        for item in items:
            if plaid_sync.needs_sync(item):
                plaid_sync.sync_item(db, item)
    return items


@router.post("/items/{item_id}/sync", response_model=schemas.PlaidItemOut)
def sync_one(item_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_configured()
    return plaid_sync.sync_item(db, _owned_item(item_id, user, db))


@router.post("/items/{item_id}/link-token", response_model=schemas.LinkToken)
def reconnect_token(item_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Link token for update mode, used when a bank asks the user to sign in again."""
    _require_configured()
    item = _owned_item(item_id, user, db)
    try:
        return {"link_token": plaid_service.create_link_token(user.id, crypto.decrypt(item.access_token_encrypted))}
    except plaid_service.PlaidError as exc:
        raise _plaid_failure(exc)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect(item_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _owned_item(item_id, user, db)
    try:
        plaid_service.remove_item(crypto.decrypt(item.access_token_encrypted))
    except (plaid_service.PlaidError, RuntimeError):
        # Still remove it locally; a dead token on Plaid's side does no harm.
        pass
    db.delete(item)  # cascades to its cards and their transactions
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

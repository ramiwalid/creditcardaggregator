from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from routes import schemas, security
from routes.database.users import get_db, get_user_by_id, update_password

router = APIRouter()

INVALID_LINK = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail={"field": "token", "message": "This reset link is invalid or has expired. Request a new one."},
)


@router.post("/resetpassword", response_model=schemas.MessageResponse)
def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = security.decode_token(body.token, security.RESET_TOKEN_TYPE)
    if payload is None:
        raise INVALID_LINK

    try:
        user = get_user_by_id(db, int(payload["sub"]))
    except (TypeError, ValueError):
        raise INVALID_LINK

    # The token embeds a fingerprint of the password hash at the time it was
    # issued; if the password has changed since, the link was already used.
    if user is None or payload.get("pwd") != security.password_fingerprint(user.hashed_password):
        raise INVALID_LINK

    if not security.check_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"field": "password", "message": "Password doesn't meet the requirements."},
        )

    update_password(db, user, security.hash_password(body.password))
    return {"message": "Your password has been updated. You can now log in."}

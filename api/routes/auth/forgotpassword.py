from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from routes import schemas, security
from routes.database.users import get_db, get_user_by_email

router = APIRouter()

GENERIC_RESPONSE = {
    "message": "If an account exists for that email, a password reset link is on its way."
}


@router.post("/forgotpassword", response_model=schemas.MessageResponse)
def forgot_password(
    body: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Always return the same response so this endpoint can't be used to check
    # whether an email is registered.
    user = get_user_by_email(db, body.email)
    if user is None:
        return GENERIC_RESPONSE

    token = security.generate_password_token(user.id, user.hashed_password)
    reset_url = f"{security.FRONTEND_URL}/auth/resetpassword/{token}"

    # Send after the response so SMTP latency doesn't leak account existence.
    background_tasks.add_task(security.send_password_reset_email, user.email, reset_url)
    return GENERIC_RESPONSE

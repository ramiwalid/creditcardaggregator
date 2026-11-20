import logging

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from routes import schemas, security
from routes.database import models
from routes.database.session import get_db

router = APIRouter(tags=["contact"])
logger = logging.getLogger("quanta.contact")


@router.post("/contact", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def contact(
    body: schemas.ContactCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Saved first so nothing is lost if email delivery fails, then emailed to
    # CONTACT_INBOX after the response is sent.
    db.add(models.ContactMessage(**body.model_dump()))
    db.commit()
    background_tasks.add_task(security.send_contact_email, body.name, body.email, body.message)
    logger.info("New contact message from %s", body.email)
    return {"message": "Thanks for reaching out! We'll get back to you soon."}

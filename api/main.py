import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routes import cards, contact, plaid  # noqa: E402
from routes.auth import forgotpassword, login, resetpassword, signup  # noqa: E402
from routes.database import models  # noqa: E402,F401  (registers tables on Base)
from routes.database.migrations import run_migrations  # noqa: E402
from routes.database.session import Base, engine  # noqa: E402


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Creates any missing tables (cards, card_transactions) without touching
    # existing ones. For schema *changes* to existing tables, add Alembic.
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    yield


app = FastAPI(title="Quanta API", lifespan=lifespan)

origins = {"http://localhost:3000", "http://127.0.0.1:3000"}
if os.environ.get("FRONTEND_URL"):
    origins.add(os.environ["FRONTEND_URL"].rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(signup.router, prefix="/auth", tags=["auth"])
app.include_router(login.router, prefix="/auth", tags=["auth"])
app.include_router(forgotpassword.router, prefix="/auth", tags=["auth"])
app.include_router(resetpassword.router, prefix="/auth", tags=["auth"])
app.include_router(cards.router)
app.include_router(contact.router)
app.include_router(plaid.router)

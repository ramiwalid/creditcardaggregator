"""Database engine, session factory and declarative Base.

Every model must inherit from the single ``Base`` defined here. Previously
``models.py`` and ``users.py`` each declared their own Base, so
``Base.metadata.create_all`` in main.py silently created no tables for the
models (which is why ``users_pending_reset`` never existed).
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

_project_root = Path(__file__).resolve().parents[3]
_default_url = f"sqlite:///{_project_root / 'sql_app.db'}"

# QUANTA_DATABASE_URL lets tests (or a future Postgres deploy) point elsewhere.
# The DATABASE_URL in .env is relative ("./sql_app.db"), which would resolve
# differently depending on the working directory, so it is not used here.
SQLALCHEMY_DATABASE_URL = os.environ.get("QUANTA_DATABASE_URL", _default_url)

_connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=_connect_args)


if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite ignores foreign keys (and therefore ON DELETE CASCADE) unless
    # this pragma is enabled on every connection.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection, _record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

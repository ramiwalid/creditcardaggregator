"""Tiny additive migrations for the existing SQLite database.

`Base.metadata.create_all` creates missing *tables* but never adds columns to
tables that already exist, so new nullable columns are added here. If the
schema starts changing in more complex ways, switch to Alembic.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("quanta.migrations")

# table -> {column: SQL type}
ADDED_COLUMNS = {
    "users": {"first_name": "VARCHAR", "last_name": "VARCHAR"},
}


def run_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in ADDED_COLUMNS.items():
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, sql_type in columns.items():
                if name not in existing:
                    conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{name}" {sql_type}'))
                    logger.info("Added column %s.%s", table, name)

"""Tiny additive migrations for the existing SQLite database.

`Base.metadata.create_all` creates missing *tables* but never adds columns to
tables that already exist, so new nullable columns are added here. If the
schema starts changing in more complex ways, switch to Alembic.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("quanta.migrations")

# table -> {column: SQL column definition}
ADDED_COLUMNS = {
    "users": {"first_name": "VARCHAR", "last_name": "VARCHAR"},
    "cards": {
        "source": "VARCHAR NOT NULL DEFAULT 'manual'",
        "plaid_item_id": "INTEGER REFERENCES plaid_items(id) ON DELETE CASCADE",
        "plaid_account_id": "VARCHAR",
    },
    "card_transactions": {"plaid_transaction_id": "VARCHAR"},
}

# Indexes that create_all would only make for brand-new tables.
INDEXES = [
    'CREATE INDEX IF NOT EXISTS "ix_cards_plaid_item_id" ON "cards" ("plaid_item_id")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "ux_cards_plaid_account" ON "cards" ("plaid_account_id")',
    'CREATE UNIQUE INDEX IF NOT EXISTS "ux_tx_plaid_id" ON "card_transactions" ("plaid_transaction_id")',
]


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
        for statement in INDEXES:
            table = statement.split(" ON ")[1].split()[0].strip('"')
            if inspector.has_table(table):
                conn.execute(text(statement))

# Quanta

All your credit cards in one clean view. Track balances, utilization, statement and minimum payments, and upcoming due dates across every card you own.

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4 (`src/`)
- **Backend:** FastAPI + SQLAlchemy + SQLite (`api/`)
- **Auth:** Argon2id password hashing, JWT bearer tokens, email-based password reset

## Getting started

Requires **Node ≥ 20.9** (`nvm use` picks up `.nvmrc`) and **Python 3.13**.

```bash
# 1. Configure secrets
cp .env.example .env          # then set SECRET_KEY (see comment in the file)

# 2. Backend
python3.13 -m venv api/.venv
api/.venv/bin/pip install -r api/requirements.txt
npm run api                   # http://localhost:8000 (docs at /docs)

# 3. Frontend (in another terminal)
npm install
npm run dev                   # http://localhost:3000
```

Tables (and new columns, via `api/routes/database/migrations.py`) are created automatically on API startup. Without SMTP settings, password reset links are printed to the API console instead of being emailed.

## Tests

```bash
npm run test:api              # backend: auth, password reset, cards, ownership checks
npx tsc --noEmit && npm run lint
```

## API overview

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/signup` | Create an account → token + user |
| POST | `/auth/login` | Log in with email **or** username → token + user |
| GET / PATCH | `/auth/me` | Current user / update first & last name |
| POST | `/auth/forgotpassword` | Email a single-use reset link (15 min) |
| POST | `/auth/resetpassword` | Set a new password with a reset token |
| POST | `/contact` | Landing-page contact form (saved + emailed to `CONTACT_INBOX`) |
| GET / POST | `/cards` | List / add cards |
| GET | `/cards/summary` | Totals, overall utilization, upcoming payments |
| GET / PATCH / DELETE | `/cards/{id}` | Read / update / delete one card |
| GET / POST | `/cards/{id}/transactions` | Payment & charge log (adjusts balance) |
| DELETE | `/cards/{id}/transactions/{tx_id}` | Remove an entry (reverses the adjustment) |

All `/cards` routes require `Authorization: Bearer <token>` and only ever return the caller's own cards. Money is exchanged as integer **cents**.

## Security notes

- Passwords are hashed with **Argon2id** (`argon2-cffi`); hashes are never returned by the API.
- Login and forgot-password responses don't reveal whether an account exists.
- Reset tokens are typed JWTs bound to the current password hash, so each link works once.
- Quanta never stores full card numbers, CVVs, or expiry dates; only an optional last four digits.

## Roadmap

- Link accounts automatically (e.g. Plaid) instead of manual entry
- Move the token to an httpOnly cookie, add rate limiting on auth routes
- Alembic migrations, Postgres for deployment
- Spending trends and payoff planning

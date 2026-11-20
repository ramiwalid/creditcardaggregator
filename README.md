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
| GET | `/plaid/config` | Whether bank linking is enabled |
| POST | `/plaid/link-token` | Start Plaid Link |
| POST | `/plaid/exchange` | Finish Link: store the connection, import cards |
| GET / POST | `/plaid/items`, `/plaid/sync` | List connections / sync those due (every 5 min) |
| POST | `/plaid/items/{id}/sync` | Sync one connection now |
| POST | `/plaid/items/{id}/link-token` | Reconnect (Link update mode) |
| DELETE | `/plaid/items/{id}` | Disconnect: revoke with Plaid, delete its cards |
| GET / POST | `/cards` | List / add cards |
| GET | `/cards/summary` | Totals, overall utilization, upcoming payments |
| GET / PATCH / DELETE | `/cards/{id}` | Read / update / delete one card |
| GET / POST | `/cards/{id}/transactions` | Payment & charge log (adjusts balance) |
| DELETE | `/cards/{id}/transactions/{tx_id}` | Remove an entry (reverses the adjustment) |

All `/cards` routes require `Authorization: Bearer <token>` and only ever return the caller's own cards. Money is exchanged as integer **cents**.

## Bank linking (Plaid)

Set `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox` and `TOKEN_ENCRYPTION_KEY` in `.env` (see `.env.example`). In the dashboard, click **Connect bank**, pick any institution, and sign in with Plaid's test credentials `user_good` / `pass_good`.

- Only credit card accounts are offered in Link. Cards import with balance, limit, statement balance, minimum payment, purchase APR, and due/statement days (Liabilities), plus 90 days of posted activity (Transactions).
- For linked cards the bank is the source of truth: those fields are read-only and overwritten on each sync. Name, theme, annual fee, and rewards stay editable.
- Connections sync when the dashboard opens (at most every 5 minutes) or on **Sync now**. No webhooks yet.
- Production access (real banks) requires Plaid approval; many large issuers also need an OAuth redirect URI over HTTPS.

## Security notes

- Passwords are hashed with **Argon2id** (`argon2-cffi`); hashes are never returned by the API.
- Login and forgot-password responses don't reveal whether an account exists.
- Reset tokens are typed JWTs bound to the current password hash, so each link works once.
- Quanta never stores full card numbers, CVVs, or expiry dates; only an optional last four digits.
- Plaid access tokens are encrypted with Fernet (`TOKEN_ENCRYPTION_KEY`) and never sent to the browser. Losing that key means users must re-link their banks.

## Roadmap

- Plaid webhooks for real-time updates; production access
- Move the token to an httpOnly cookie, add rate limiting on auth routes
- Alembic migrations, Postgres for deployment
- Spending trends and payoff planning

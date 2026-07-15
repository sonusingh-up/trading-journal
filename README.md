# Trade Journal

A clean, modern trading journal for prop-firm and personal accounts — log trades,
track profit targets and daily drawdown limits, size positions, and see where your
money actually comes from. Light fintech aesthetic (soft blue gradients, Plus
Jakarta Sans, rounded cards), runs entirely on your machine with a local SQLite
database.

## Features

- **Dashboard** — total balance hero, win rate / profit factor / avg W:L tiles,
  personal profit-target progress, per-account cards with MTD change, a
  filterable recent-trades list (All / Wins / Losses), an equity curve, and an
  interactive daily P&L calendar heatmap.
- **Trade logging** — modal with account/side/pair/prices, optional chart
  screenshot attachment, and a built-in **position size calculator**
  (balance × risk% ÷ stop-loss pips) that prefills from the selected account.
- **Risk guardrails** — each account has a strict daily drawdown limit; a
  high-visibility banner warns at 70% of the day's loss budget and flags a
  breach at 100%.
- **Cash Flow** — log business income (affiliate revenue, retainers, prop-firm
  payouts, anything) and compare streams month-by-month in a grouped bar chart.
- **Multi-user** — email/password accounts (bcrypt + DB-backed sessions), fully
  isolated data per user, rate-limited auth endpoints, owner-only access to
  uploaded screenshots.
- **Polish** — skeleton loading states, zero-states, framer-motion page and
  card transitions.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Recharts · framer-motion · Prisma 7 + SQLite (better-sqlite3 driver)

## Getting started

```bash
git clone https://github.com/sonusingh-up/trading-journal.git
cd trading-journal
npm install
cp .env.example .env      # Windows: copy .env.example .env
npx prisma migrate dev    # creates dev.db and applies migrations
npx prisma db seed        # optional: demo user + sample data
npm run dev
```

Open http://localhost:3000 and sign in — or create your own account from the
login page.

**Demo login (from the seed):** `demo@tradejournal.local` / `demo1234`
Don't run the seed against a database you care about: it wipes existing rows.

## API

All data routes require a session cookie (sign in first) and only ever return
the signed-in user's rows.

| Route | Methods | Notes |
|---|---|---|
| `/api/auth/register` | POST | email, password (min 8), optional username |
| `/api/auth/login` · `/api/auth/logout` | POST | rate-limited per IP |
| `/api/accounts` | GET, POST | trading accounts with targets + drawdown limits |
| `/api/trades` | GET, POST | `?account=` filter; POST returns a `daily_drawdown` status and updates the account balance for closed trades |
| `/api/income` | GET, POST | `?source=` filter |
| `/api/uploads` | POST | multipart image ≤ 5 MB → private file URL |
| `/api/files/[name]` | GET | serves uploads, owner-only |

## Deployment notes

- SQLite lives in a local file (`dev.db`) and screenshots in `uploads/` — deploy
  to something with a **persistent disk** (a VPS, Railway, Fly.io, Render, a
  home server). Serverless platforms without durable storage won't work as-is.
- `npm run build && npm start` for production. Migrations don't run
  automatically — run `npx prisma migrate deploy` on release (simplest: make
  your start command `npx prisma migrate deploy && npm start`).

### Render

1. Web Service from this repo. Build command: `npm install && npm run build`
   (the `postinstall` script generates the Prisma client).
2. Start command: `npx prisma migrate deploy && npm start` — creates/updates
   the database tables on every boot.
3. Attach a **persistent disk** (e.g. mounted at `/var/data`) and set the env
   vars `DATABASE_URL=file:/var/data/dev.db` and `UPLOADS_DIR=/var/data/uploads`.
   Without a disk (free tier), the filesystem resets on every deploy and
   restart — **all users, trades and screenshots are lost each time**.

### Other notes

- The rate limiter is in-memory (single instance). Behind a proxy, make sure
  `x-forwarded-for` is set so limits apply per client, not per proxy.
- Money is stored as floats — fine for journaling, but switch to integer cents
  before using balances for anything accounting-grade.

## License

[MIT](LICENSE)

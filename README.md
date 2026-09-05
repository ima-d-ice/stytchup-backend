# StytchUp Backend

Express + Socket.io API for **StytchUp**, a vertical fashion marketplace connecting customers with independent designers for made-to-order and custom pieces.

Pair frontend: [`stytchup`](../stytchup) (React + Vite). The two repos run together via `compose.yaml` in this repo.

## Features

- **Role-based access control** — `CUSTOMER`, `DESIGNER`, `ADMIN` roles; `requireRole()` middleware guards designer-only routes (`POST /designs/add`, `POST /orders/ship`) and all `/admin/*` ops routes (user/role management, order cancel/refund, design activate/deactivate).
- **State-driven order lifecycle** — `PENDING → AWAITING_REQUIREMENTS → IN_PROGRESS → SHIPPED → COMPLETED` (plus `CANCELLED`/`REFUNDED`), enforced by a single shared transition map (`src/lib/orderTransitions.js`).
- **Realtime negotiation engine** — Socket.io rooms per conversation (`join_chat`) and per order (`join_order`), with participant verification. Events: `new_message`, `offer_created`, `offer_accepted`, `order_updated` (emitted on every lifecycle mutation).
- **Razorpay payments** — server-derived paise amounts (client amounts are never trusted), HMAC-SHA256 signature verification (`src/lib/paymentVerify.js`).
- **OpenAPI/Swagger docs** — Swagger UI at `GET /docs`, raw spec at `GET /openapi.json` (32 paths).
- **Auth** — bcrypt passwords, backend JWTs (7d, `Authorization: Bearer`, consumed by the React `AuthContext`).

## Prerequisites

- Node.js 20+ (type-stripping not needed — plain CommonJS)
- PostgreSQL 16 (or use Docker Compose below)
- A `.env` file (see `.env.example`)

## Quickstart

### Option A — Docker Compose (recommended)

Needs the frontend checkout as a sibling directory (`../stytchup`).

```bash
cp .env.example .env   # then fill in secrets
docker compose up --build
```

Services: API + sockets on `http://localhost:4000`, frontend on `http://localhost:3000`, Postgres on `5432`. The backend entrypoint syncs the Prisma schema (`prisma db push`) on boot.

### Option B — Local

```bash
npm install
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, NEXTAUTH_SECRET
npx prisma generate
npx prisma db push
npm run dev            # node --watch src/index.js
```

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | Signs backend JWTs |
| `NEXTAUTH_SECRET` | yes | Must match the frontend value (JWE compat) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for payments | Razorpay order creation + verification |
| `PORT` | no (default `4000`) | API port |
| `NODE_ENV` | no | `production` enables secure cookies |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Watch-mode dev server |
| `npm start` | Production server (`src/index.js`) |
| `npm test` | `node:test` suites (31 tests, zero deps) |
| `npm run build` | `prisma generate` (no compile step — plain JS) |

## API reference

Interactive docs: `http://localhost:4000/docs`. Raw spec: `/openapi.json`. Health: `GET /health`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register (always `CUSTOMER`) |
| POST | `/auth/login` | — | Login, returns JWT + httpOnly cookie |
| POST | `/auth/google-sync` | — | Find-or-create Google user for NextAuth |
| POST | `/auth/change-role` | user | Self-service `designer` ↔ `customer` |
| GET | `/designs`, `GET /designs/:id` | — | Public catalog |
| POST | `/designs/add` | designer | Publish a design (price in paise) |
| GET | `/designers`, `GET /designers/:id` | — | Designer list + portfolio |
| GET | `/profile/settings` | user | Own profile (no password) |
| PUT | `/profile/update` | user | Upsert profile |
| POST | `/profile/address` | user | Add address |
| POST | `/payments/create-order` | user | Razorpay order (`CATALOG`/`CHAT_OFFER`) |
| POST | `/payments/verify` | user | Verify signature → `AWAITING_REQUIREMENTS` |
| POST | `/inbox/create` | user | Get-or-create 1:1 conversation |
| POST | `/inbox/message` | user | Text or custom offer (paise) |
| GET | `/inbox/list` | user | Conversations + last message |
| GET | `/inbox/:id/messages` | participant | History |
| POST | `/orders/submit-measurements` | buyer | → `IN_PROGRESS` |
| POST | `/orders/ship` | designer | → `SHIPPED` (tracking required) |
| POST | `/orders/complete` | buyer | → `COMPLETED` |
| GET | `/orders/my-orders` | buyer | Purchase history |
| GET | `/orders/designer-orders` | designer | Fulfillment queue |
| GET | `/admin/users|orders|designs` | admin | Ops listings |
| POST | `/admin/users/:id/role` | admin | Grant `CUSTOMER`/`DESIGNER`/`ADMIN` |
| POST | `/admin/orders/:id/cancel` | admin | State-checked cancel |
| POST | `/admin/orders/:id/refund` | admin | Mark refunded |
| PATCH | `/admin/designs/:id/active` | admin | Show/hide design |

Money is integer **paise** everywhere (`₹1 = 100`); see `src/lib/pricing.js`.

### Socket events

Connect with `io(url, { auth: { token: 'Bearer <jwt>' } })`.

| Direction | Event | Payload |
|---|---|---|
| client → server | `join_chat` | `conversationId` (participant-verified) |
| client → server | `join_order` | `orderId` (buyer/designer/admin-verified) |
| server → room | `new_message` | message |
| server → room | `offer_created` | offer message |
| server → room | `offer_accepted` | `{ messageId, orderId }` |
| server → `order:<id>` | `order_updated` | `{ orderId, status, ... }` |

## Project structure

```
prisma/              # schema.prisma (8 models, RBAC roles, order lifecycle enums)
src/
  index.js           # express app + socket bootstrap + /docs mount
  routes/            # auth, designs, designers, profile, payments, inbox, orders, admin
  controllers/       # request handlers (thin, ownership + transition checks)
  middleware/        # isAuthenticated (JWT/JWE), requireRole
  lib/               # socket, razorpay (lazy), pricing, paymentVerify,
                     # orderTransitions, swagger
  utils/             # signToken, NextAuth key derivation
tests/               # node:test suites (lifecycle, RBAC, HMAC, routes, API smoke)
compose.yaml         # postgres + backend + frontend stack
Dockerfile           # multi-stage, non-root, HEALTHCHECK
.github/workflows/  # ci.yml — test → OpenAPI check → docker builds
```

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`: `npm ci` → `prisma generate` → `npm test` → OpenAPI sanity check → backend + frontend `docker build` → `compose config` validation (frontend repo checked out as sibling).

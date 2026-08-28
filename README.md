# UP TOWN

Campus food ordering — order online, pay by M-Pesa or cash, chit goes straight to
the kitchen on WhatsApp with your location pinned.

Visual identity: an "order ticket." The cart and checkout render as a literal
torn order chit — dashed tear lines, a barcode footer, a rotated stamp — because
that's what this product fundamentally is: a receipt that becomes a real order.

## Stack

- **Backend:** Node.js + Express, JWT auth, bcrypt, AES-256-GCM field encryption,
  Safaricom Daraja (M-Pesa STK Push), WhatsApp `wa.me` order links, Helmet +
  rate limiting. Data is stored in flat JSON files under `backend/data/` — no
  external database needed to run this, and it's a two-line swap to Postgres/Mongo
  later (see `backend/config/db.js`).
- **Frontend:** React 18 + Vite + React Router, no CSS framework — a hand-built
  design system (`frontend/src/styles/`) themed for the brand.

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Generate real secrets:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # → JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # → ID_ENCRYPTION_KEY
# paste those into .env

npm install
npm run dev
```

Runs on `http://localhost:5000`. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api/*` to the backend automatically
(see `vite.config.js`).

Open `http://localhost:5173`, register an account, add a few dishes, and place
an order — cash orders work immediately with no external setup.

## Admin dashboard

An admin account is **auto-created on first boot** from the `ADMIN_*` values in
`backend/.env`:

```
ADMIN_FULL_NAME=UP TOWN Admin
ADMIN_EMAIL=admin@uptown.local
ADMIN_PHONE=0700000000
ADMIN_PASSWORD=ChangeMe123
```

Log in at `/login` with `ADMIN_PHONE` / `ADMIN_PASSWORD` — you'll see an
**Admin** link appear in the nav bar, taking you to `/admin`. Change the
password value in `.env` before your first real boot (it's only used once, to
seed the account — after that, changing it in `.env` won't retroactively
update the existing admin user, since the app doesn't re-seed once an admin
already exists).

From `/admin` you can:
- **Drag and drop a photo** onto any dish's thumbnail (or click it to browse)
  to set its picture — accepts JPEG/PNG/WEBP/GIF, capped at 5MB, stored in
  `backend/uploads/menu/`.
- **Edit prices inline** — type a new number and click away (or press Enter)
  to save.
- **Hide/show dishes** without deleting them.
- **Add brand-new dishes** to the menu.

Only the seeded admin account (or any user you manually flip `isAdmin: true`
for in `backend/data/users.json`) can reach these endpoints — every admin
route checks `req.user.isAdmin` server-side, so this isn't just a hidden
frontend link.

## Calling the kitchen

The nav bar shows a **Call** button (a `tel:` link) whenever `ADMIN_CALL_NUMBER`
is set in `backend/.env`. Tapping it on a phone opens the dialer pre-filled
with that number — no app install or account needed on the customer's side.
Set it to a different number than `ADMIN_PHONE` if you want a separate front-
of-house line from the admin login.

## Wiring up real M-Pesa (Daraja)

By default the app runs with placeholder Daraja credentials, so M-Pesa checkout
fails gracefully with a clear message ("M-Pesa is not fully configured yet…")
instead of crashing.

To enable real STK Push against Safaricom's sandbox:

1. Create a free account at https://developer.safaricom.co.ke and register an app
   to get a **Consumer Key** and **Consumer Secret**.
2. Put those into `backend/.env` as `DARAJA_CONSUMER_KEY` / `DARAJA_CONSUMER_SECRET`.
3. `DARAJA_SHORTCODE` (174379) and `DARAJA_PASSKEY` in `.env.example` are
   Safaricom's public sandbox test values — safe to use as-is for sandbox testing.
4. Daraja needs a **public HTTPS URL** to call back with the payment result. In
   local dev, run `ngrok http 5000` and set `DARAJA_CALLBACK_URL` to
   `https://<your-ngrok-subdomain>.ngrok-free.app/api/orders/mpesa/callback`.
5. Restart the backend. Place an M-Pesa order — Safaricom's sandbox will trigger
   a simulated "enter PIN" prompt you can complete via their test tools.

For production, switch `DARAJA_ENV=production` and use your live shortcode/keys
from Safaricom (this requires a paybill/till and Safaricom's go-live process).

## Wiring up WhatsApp

The core flow needs no setup: every order generates a `wa.me` deep link
pre-filled with the order summary and a live Google Maps link to the customer's
captured location. Clicking it opens WhatsApp with the message ready to send —
works on day one.

Optional: to send **automated** confirmation messages from the business number
instead of a customer-initiated `wa.me` link, set up Meta's WhatsApp Cloud API
and add `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_CLOUD_PHONE_NUMBER_ID` to `.env`
(`backend/services/whatsappService.js` already has a stub — `sendCloudApiMessage`
— ready to call).

## Security notes

- Passwords hashed with bcrypt (cost 12).
- National ID numbers encrypted at rest with AES-256-GCM (`ID_ENCRYPTION_KEY`)
  and only ever returned to the client masked (`****1144`).
- JWT sessions, rate-limited login (10 attempts / 15 min) and order placement.
- Helmet security headers, CORS locked to `FRONTEND_ORIGIN`, 100kb body cap.
- Order prices are always computed server-side from the menu — the client can
  never submit its own price.
- In production (`NODE_ENV=production`), the server refuses to boot if
  `JWT_SECRET` or `ID_ENCRYPTION_KEY` are still placeholder values.

## Project structure

```
backend/
  config/db.js            flat-file JSON store (swap for a real DB later)
  controllers/             auth + orders + menu logic
  middleware/              auth guard, requireAdmin, validators, rate limits, upload (multer), error handler
  routes/                  /api/auth, /api/menu, /api/orders, /api/config
  services/                darajaService.js, whatsappService.js
  utils/                   crypto.js (AES-256-GCM), jwt.js, adminSeed.js
  data/menu.json           seed menu — edit freely
  uploads/menu/            uploaded dish photos land here, served at /uploads/menu/*
  server.js

frontend/
  src/api/client.js        fetch wrapper, attaches JWT, multipart upload helper
  src/context/             AuthContext, CartContext
  src/pages/                Menu, Cart, Checkout, Login, Register, Profile, Orders, Admin
  src/components/NavBar.jsx
  src/styles/               tokens.css (design system), ticket.css (signature chit), ui.css
```

## Deploying to Render

See **[`DEPLOY_RENDER.md`](./DEPLOY_RENDER.md)** for the full, step-by-step
guide — creating the backend Web Service with a persistent disk (without
one, Render wipes your orders/users/photos on every deploy), the frontend
Static Site, environment variables, and how to verify data actually
survives a restart before you call it launched.

## Editing the menu

Edit `backend/data/menu.json` directly — each item needs `id`, `name`,
`category`, `price`, `description`, `available`. Restart the backend (or wait
for the next request) to see changes.

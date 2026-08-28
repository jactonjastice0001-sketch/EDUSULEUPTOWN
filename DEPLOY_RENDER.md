# Deploying UP TOWN to Render

Two services: the Express backend (a **Web Service**) and the React frontend
(a **Static Site**). This guide gets both live and talking to each other
correctly — including the one thing that's easy to miss: **without a
persistent disk, Render wipes your backend's local files on every deploy and
every restart**, which means every order, user account, and uploaded dish
photo disappears. We fix that below.

## Fast path: one-click Blueprint deploy

This repo includes `render.yaml` at the root, which defines both services
(backend + frontend) with the persistent disk and correct paths already
configured. In the Render dashboard: **New → Blueprint** → connect this
repo → Render reads `render.yaml` and proposes both services at once.

You'll still need to fill in the secret env vars it leaves blank (marked
`sync: false` in the file — things like `JWT_SECRET`, `ADMIN_PASSWORD`,
`DARAJA_*`) before the first deploy succeeds, and you'll still need to do
step 4 below (cross-referencing the two URLs) after the first deploy. But
this skips manually clicking through service creation twice.

If you'd rather do it by hand and understand every setting, follow the
manual steps below instead — they configure the exact same thing.

## 1. Push the code to GitHub

Render deploys from a Git repo. If you haven't already:

```bash
cd UPTOWN
git init
git add .
git commit -m "UP TOWN"
```

Create a new repo on GitHub and push to it.

## 2. Create the backend Web Service

In the Render dashboard: **New → Web Service** → connect your repo.

| Setting | Value |
|---|---|
| Name | `uptown-backend` (or anything — you'll use the URL it generates) |
| Root Directory | `backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | **Starter** ($7/mo) — the **Free** tier cannot attach a persistent disk, and without one your data gets wiped constantly |

### Add a persistent disk

Still on the same service, scroll to **Disks → Add Disk**:

| Setting | Value |
|---|---|
| Name | `uptown-data` |
| Mount Path | `/data` |
| Size | 1 GB is plenty to start (~$0.25/mo) |

### Environment variables

Add these under **Environment** (copy from `backend/.env.example`, but with
real values):

```
NODE_ENV=production
DATA_DIR=/data/db
UPLOADS_ROOT=/data/uploads
FRONTEND_ORIGIN=https://uptown-frontend.onrender.com
JWT_SECRET=<generate — see below>
ID_ENCRYPTION_KEY=<generate — see below>
ADMIN_FULL_NAME=UP TOWN Admin
ADMIN_EMAIL=you@example.com
ADMIN_PHONE=07XXXXXXXX
ADMIN_PASSWORD=<a real password — this seeds your live admin account>
ADMIN_CALL_NUMBER=07XXXXXXXX
DARAJA_ENV=sandbox
DARAJA_CONSUMER_KEY=your_sandbox_or_production_key
DARAJA_CONSUMER_SECRET=your_sandbox_or_production_secret
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
DARAJA_CALLBACK_URL=https://uptown-backend.onrender.com/api/orders/mpesa/callback
WHATSAPP_VENDOR_NUMBER=2547XXXXXXXX
```

**Important:** `DATA_DIR` and `UPLOADS_ROOT` must point *inside* your mount
path (`/data/db` and `/data/uploads`, not `/data` itself, so the
two don't collide) — this is what makes your data survive redeploys.

Generate real secrets locally before pasting them in:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ID_ENCRYPTION_KEY
```

You won't know the exact `uptown-frontend.onrender.com` / `uptown-backend.onrender.com`
URLs until you've created both services once — Render shows you the URL
immediately after creation, before the first deploy finishes. Create both
services first with placeholder values for `FRONTEND_ORIGIN` /
`DARAJA_CALLBACK_URL`, note the real URLs Render assigns, then come back and
correct these two env vars (Render redeploys automatically when you save
env var changes).

Click **Create Web Service**. First deploy takes a few minutes.

Once it's live, check `https://uptown-backend.onrender.com/api/health` in a
browser — you should see `{"status":"ok","service":"uptown-backend"}`.

## 3. Create the frontend Static Site

**New → Static Site** → same repo.

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

### Environment variable (build-time)

```
VITE_API_BASE_URL=https://uptown-backend.onrender.com
```

This is baked into the JS bundle at build time — it's how the deployed
frontend knows where the backend lives, since (unlike local dev) there's no
Vite proxy in production.

### Rewrite rules

Static sites on Render can't run a proxy the way `vite.config.js` does
locally, but they don't need to — the frontend already calls the backend's
full URL directly via `VITE_API_BASE_URL`, and CORS is already configured on
the backend to allow it. No rewrite rules are required.

Click **Create Static Site**.

## 4. Fix the cross-references

Now that both URLs are known:

1. Go back to the **backend** service → Environment → set
   `FRONTEND_ORIGIN` to the real static site URL (e.g.
   `https://uptown-frontend.onrender.com`) and `DARAJA_CALLBACK_URL` to
   `https://uptown-backend.onrender.com/api/orders/mpesa/callback`. Save —
   Render redeploys automatically.
2. Go to the **frontend** service → Environment → confirm
   `VITE_API_BASE_URL` matches the backend's real URL. If you changed it,
   trigger a manual redeploy (env var changes on static sites require a
   rebuild to take effect, since the value is compiled into the JS).

## 5. Verify it end-to-end

1. Open the frontend URL. The menu should load (13 seeded dishes).
2. Register an account, add items to cart, place a cash order — confirm the
   WhatsApp link opens with the order pre-filled.
3. Log in as the admin (`ADMIN_PHONE` / `ADMIN_PASSWORD`), go to `/admin`,
   upload a photo to a dish, edit a price — confirm both show up back on the
   menu page.
4. **Restart the backend service** from the Render dashboard (Manual Deploy
   → or just wait for it to spin down on Starter's sleep policy, if
   applicable) and check that your test order, account, and uploaded photo
   are all still there. This is the check that actually proves the disk is
   working — if data disappears here, double check `DATA_DIR` /
   `UPLOADS_ROOT` point inside your mounted disk path.

## 6. Going from sandbox to real M-Pesa payments

Sandbox Daraja credentials never touch real money. To accept real payments:

1. Complete Safaricom's **go-live** process for your paybill/till at
   https://developer.safaricom.co.ke — this is a manual business
   verification step only you can do.
2. Once approved, update `DARAJA_ENV=production` and swap in your live
   `DARAJA_CONSUMER_KEY` / `DARAJA_CONSUMER_SECRET` / `DARAJA_SHORTCODE` /
   `DARAJA_PASSKEY` in the backend's Render environment variables.
3. Re-verify `DARAJA_CALLBACK_URL` is your real backend's HTTPS URL — Daraja
   will not call back to `localhost` or an unverified URL.

## Costs, roughly

- Backend Starter web service: **$7/mo**
- 1GB persistent disk: **~$0.25/mo**
- Frontend static site: **free**
- Total: **~$7.25/mo** before any bandwidth overage (100GB/mo included on
  Render's free bandwidth allowance, which is generous for a campus-scale app)

## A note on scaling past this setup

The flat-JSON-file storage (`backend/data/*.json`) is fine for a soft launch
and moderate traffic, but it isn't built for concurrent writes at real scale
— two orders landing in the same instant could theoretically race. If UP TOWN
takes off, the natural next step is swapping `backend/config/db.js` for a real
database (Render's managed Postgres is a one-click add from the same
dashboard) — the rest of the app (controllers, routes) doesn't need to change,
since `readTable`/`writeTable` are the only two functions that touch storage.

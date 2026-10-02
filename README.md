# softhash social — Growth Portfolio

A single-page, animated portfolio showcasing softhash's Meta presence —
5 Facebook Pages, 5 Instagram accounts, and Meta Ads performance — with
animated stat counters, scroll-triggered reveals, and engagement bars.
Built with Vite + vanilla JS + GSAP on the frontend, Vercel serverless
functions + Vercel's native Redis storage on the backend, no framework
overhead.

## How editing works

There's a password-protected admin page at **`/admin`** (a small dot in
the public page's bottom-right corner also links there). Log in, edit
any field, click **Save changes** — the public site reflects it
immediately, no redeploy needed. You can add or remove accounts on any
of the three platforms (Facebook, Instagram, Meta Ads) freely.

The data also lives in a plain Redis key (`softhash:accounts`) once
connected, so you can inspect or hand-edit it from Vercel's own data
browser if you ever need to (Project → Storage → your database →
Data Browser), in addition to the `/admin` UI.

## One-time setup after cloning / before first deploy

### 1. Create the data store

In the Vercel dashboard: **Project → Storage → Create Database → Redis**.
When configuring it, set **High Availability** to **None** to unlock the
**Free** plan (the paid tiers default to single-zone HA) — this app only
stores a few KB of JSON, so Free is plenty. On the "Connect a Project"
step, set the Custom Prefix to **`REDIS`** so it creates an environment
variable named **`REDIS_URL`** (a standard `redis://` connection string)
— that's the name `lib/store.js` reads.

### 2. Set the admin secrets

In **Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | the shared password you'll use to log into `/admin` |
| `SESSION_SECRET` | any long random string (used to sign the login session) |

Without a data store connected, the app still works for local
development — it falls back to a local JSON file (see below) — but in
production you need the Redis store, or admin edits won't persist
across requests.

### 3. Deploy

Push to GitHub, import the repo into Vercel (Framework preset: **Vite**),
deploy. Then add your domain: **Project → Settings → Domains** →
`social.softhashsolutions.com` (or whichever subdomain you chose), and
add the CNAME record Vercel shows you in your DNS provider.

## Local development

```bash
cp .env.example .env   # fill in ADMIN_PASSWORD and SESSION_SECRET
npm install
npm run dev
```

This runs two things together: the Vite dev server (the site) and a
small local API shim (`scripts/local-api-server.mjs`) that emulates
Vercel's serverless functions so the admin page and the stats API work
without needing the Vercel CLI or a live deploy. Without Redis env vars
set, it stores data in `.data/accounts.local.json` (gitignored) instead
— good enough for testing, not used in production.

Locally, open the admin page at `/admin.html` directly — the clean
`/admin` URL (no `.html`) only works once deployed on Vercel, via
`cleanUrls` in `vercel.json`.

## Build

```bash
npm run build
npm run preview
```

## Project structure

- `index.html` / `src/main.js` — the public page, fetches `/api/accounts`
- `admin.html` / `src/admin.js` — the admin dashboard
- `api/accounts.js` — `GET` (public) / `PUT` (admin-only) for account data
- `api/admin-login.js`, `api/admin-logout.js`, `api/admin-session.js` — auth
- `lib/store.js` — reads/writes the Redis store (or local file fallback)
- `lib/auth.js` — password check + signed session cookie
- `lib/defaultData.js` — one-time seed data, used only if the store is empty

## Live Meta stats later

Everything funnels through `/api/accounts`, so swapping manual entry
for a live Meta Graph API sync later only means changing what writes to
that store (e.g. a scheduled job instead of the admin form) — the
public page and its animations don't need to change.

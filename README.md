# softhash social — Growth Portfolio

A single-page, animated portfolio showcasing softhash's Meta presence —
5 Facebook Pages and 5 Instagram accounts — with animated stat counters,
scroll-triggered reveals, and engagement bars. Built with Vite + vanilla
JS + GSAP, no framework overhead.

## Update the real stats

All account data lives in one file:

```
src/data/accounts.js
```

Replace each placeholder entry with the real name, handle, profile URL,
and numbers (followers, posts, likes, engagement rate %, reach) for every
account. The page re-renders from this file automatically — no other
code needs to change.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Vercel: **Add New Project** → import `softhash-social-portfolio`.
   Framework preset: **Vite**. No environment variables required.
3. After the first deploy, go to **Project → Settings → Domains** and add
   `social.softhashsolutions.com` (or whichever subdomain you chose).
4. In your DNS provider for `softhashsolutions.com`, add the CNAME record
   Vercel shows you (usually `social` → `cname.vercel-dns.com`).
5. Done — Vercel auto-deploys on every push to `main`.

## Live stats later

The data file is structured so a future live Meta Graph API integration
only needs to replace the static import in `src/main.js` with a fetch —
the rendering and animation code doesn't need to change.

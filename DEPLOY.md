# Deploy Expense Orbit as a standalone phone app

Goal: install the app on your phone so it works **anywhere, anytime**, with no dependency on your laptop or your Wi-Fi. Free, under 15 minutes one-time.

## What you'll end up with

- Backend live at `https://expense-orbit-api.onrender.com` (free Render web service).
- Frontend live at `https://expense-orbit.vercel.app` (free Vercel site).
- Real app icon on your phone's home screen. Launches standalone (no browser UI), uses the cloud backend, works on 4G, 5G, any Wi-Fi, offline-capable for the shell.
- Every `git push` = auto-deploy. No manual redeploy ever.

## Prerequisites

- A GitHub account (free).
- The project pushed to a GitHub repo (see step 0 if it isn't yet).
- Your MongoDB Atlas URI (you already have one in `.env`).
- Your Gmail app password (already in `.env`).

## Step 0 — Push the repo to GitHub (skip if already done)

```bash
cd "D:\Projects\Expense Tracker"
git init
git add .
git commit -m "Initial commit"
```

On github.com → New repo → name it `expense-orbit`, private or public, **don't** initialize with README. Then:

```bash
git remote add origin https://github.com/<your-username>/expense-orbit.git
git branch -M main
git push -u origin main
```

Make sure `.env` is in `.gitignore` so your secrets don't go public. Check:

```bash
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
git rm --cached .env 2>/dev/null ; git add .gitignore && git commit -m "ignore env" && git push
```

## Step 1 — Deploy the backend to Render (5 min)

1. Sign up at [render.com](https://render.com) (free, GitHub login).
2. **New → Web Service → Connect GitHub → pick your `expense-orbit` repo**.
3. Render will auto-detect `render.yaml` and fill most fields. Just confirm:
   - **Name**: `expense-orbit-api`
   - **Runtime**: Node
   - **Plan**: Free
   - **Root Directory**: (blank — project root)
4. **Environment** tab → add these values (Render created the keys from `render.yaml`):
   - `MONGO_URI` → paste your Atlas URI
   - `EMAIL_USER` → your Gmail address
   - `EMAIL_PASS` → your Gmail app password
   - `APP_URL` → leave blank for now; come back in Step 2
   - `JWT_SECRET` → Render generates this automatically, don't touch
5. Click **Create Web Service**. First build takes 2–3 minutes.
6. When it shows "Live", copy the URL from the top — looks like `https://expense-orbit-api.onrender.com`. **Save this.**
7. On MongoDB Atlas → **Network Access → Add IP Access List Entry → 0.0.0.0/0** (allow Render). If you want tighter security later, add Render's egress IPs only.

Test it: open `https://expense-orbit-api.onrender.com/api/auth/me` in a browser. You should see `{"message":"..."}` or similar — not a 404. That means it's live.

> **Free-tier note**: Render free services sleep after 15 min of inactivity. First request after sleep takes ~30s to wake. Fine for personal use.

## Step 2 — Deploy the frontend to Vercel (3 min)

1. Sign up at [vercel.com](https://vercel.com) (free, GitHub login).
2. **Add New → Project → Import your `expense-orbit` repo**.
3. **Root Directory** → click Edit → set to `client`. Vercel auto-detects Vite.
4. **Environment Variables** → add one:
   - **Name**: `VITE_API_ROOT`
   - **Value**: `https://expense-orbit-api.onrender.com/api` (your Render URL + `/api`)
5. Click **Deploy**. Takes ~60 seconds.
6. When it's done, copy the Vercel URL — something like `https://expense-orbit.vercel.app`.
7. Go back to **Render → Environment** and set `APP_URL` to your Vercel URL. Redeploy the service (Render does this automatically).

## Step 3 — Install the app on your phone

1. On your phone, open the **Vercel URL** in **Chrome (Android)** or **Safari (iOS)**.
2. **Android Chrome**:
   - Chrome menu (⋮) → **Install app** → **Install**.
   - The app appears in your app drawer with the Expense Orbit icon. Launch it — it opens standalone, no browser UI. This is a real WebAPK; Android treats it exactly like a Play Store app (listed in Settings → Apps, its own entry in the task switcher, own storage).
3. **iOS Safari**:
   - Share → **Add to Home Screen** → Add.
   - Launches full-screen from the home screen.

Done. Close your laptop. Turn off your Wi-Fi. The app still works — it talks to Render, Render talks to Atlas, your phone is fully independent.

## Step 4 — Updating the app

You don't redeploy manually. Ever.

```bash
git add -A
git commit -m "whatever changed"
git push
```

- Vercel auto-builds the frontend from `main` and rolls it out to `https://expense-orbit.vercel.app` in ~60s.
- Render auto-builds the backend from `main` and restarts in ~90s.
- Your installed app picks up the frontend update the next time you open it (service worker keeps the shell cached, so usually instant after one refresh).

That's your redeploy loop. No cable, no rebuild, no reinstall.

## Optional — Keep Render awake (avoid 30s cold starts)

The free tier sleeps after 15 min idle. If that bothers you:

- **Uptime Robot** (free) — ping your `/api/auth/me` endpoint every 5 min. Keeps the service warm for free.
- **Cron-job.org** (free) — same idea.

Add a monitor once and forget it.

## If something breaks

- **Phone can't log in / calls fail** → check Vercel's `VITE_API_ROOT` matches your Render URL exactly (including `/api` suffix, no trailing slash). Redeploy Vercel after changing env vars.
- **Render build fails** → it's usually MongoDB — Atlas IP access list must include `0.0.0.0/0` (or Render's egress IPs).
- **Emails don't arrive** → Gmail app password must be from an account with 2FA enabled; EMAIL_USER must match.
- **Install button not showing in Chrome** → wait 5 seconds, scroll, try Chrome menu manually. Vercel serves over HTTPS so the prompt should always be available.

## Cost

- Render free tier: 750 hours/month, plenty for one service.
- Vercel hobby: unlimited static + generous edge traffic.
- MongoDB Atlas M0: 512 MB free forever.
- Total: **₹0 / month**.

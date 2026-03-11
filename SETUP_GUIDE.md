# AutoApply — Setup Guide

Everything you need to get the project running.

---

## 🔑 External Services Required

### 1. Gmail Account + App Password — ✅ REQUIRED (for sending emails)

Emails are sent via Gmail SMTP using Nodemailer. You need a Gmail account with 2-Step Verification enabled and an App Password.

#### How to create a Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select **Mail** as the app, **Windows Computer** as the device
5. Click **Generate** — copy the 16-character password
6. Paste it as `EMAIL_APP_PASSWORD` in your `.env` file

| What | Details |
|------|---------|
| **Authentication** | Gmail App Password (NOT your normal password) |
| **Sender address** | Your Gmail address (e.g. `abhisraj099@gmail.com`) |
| **Replies** | Go straight to your Gmail inbox |
| **Free daily limit** | ~500 emails/day (we use 80 for safety) |

> ⚠️ **Important**: Never use your actual Gmail password. Always use an App Password.

---

### 2. Redis — ⚠️ REQUIRED for campaign scheduling

Redis powers BullMQ which handles scheduled campaign execution and email queuing.

**What happens without Redis?**
The app still starts! Dashboard, templates, email lists, resume uploads all work. But you **cannot schedule or send campaigns**.

#### How to install Redis

| Option | Command / Link |
|--------|----------------|
| **Docker (easiest)** | `docker run -d --name redis -p 6379:6379 redis` |
| **WSL (Windows)** | `sudo apt install redis-server && sudo service redis-server start` |
| **Cloud (free)** | [Upstash](https://upstash.com) — free tier, serverless Redis |
| **Windows native** | [Memurai](https://www.memurai.com/) — Redis-compatible for Windows |

---

### 3. Node.js 18+ — ✅ REQUIRED

Download from https://nodejs.org. No other system dependencies needed.

---

## ❌ What You DON'T Need

| Not needed | Why |
|------------|-----|
| PostgreSQL / MySQL | SQLite runs in-process, zero setup |
| Visual Studio / C++ build tools | sql.js is pure JavaScript (no native compilation) |
| SendGrid / Resend / Twilio | Gmail SMTP handles everything |
| Domain verification | Emails come directly from your Gmail |
| Any paid plan | Everything works on free tiers |

---

## ⚙️ Step-by-Step Setup

### Step 1: Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in another terminal)
cd frontend
npm install
```

### Step 2: Configure Backend

Edit `backend/.env` — set your Gmail credentials:

```env
# REQUIRED — your Gmail address
EMAIL_USER=your_gmail@gmail.com

# REQUIRED — Gmail App Password (NOT your normal password)
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop

# OPTIONAL — sender display name
EMAIL_FROM_NAME=Your Name
```

### Step 3: Start Redis

```bash
# Docker (recommended)
docker run -d --name redis -p 6379:6379 redis
```

### Step 4: Run the app

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- 🚀 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5000
- ❤️ **Health check**: http://localhost:5000/api/health

---

## 📋 All Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_USER` | ✅ Yes | — | Your Gmail address |
| `EMAIL_APP_PASSWORD` | ✅ Yes | — | Gmail App Password (16 chars) |
| `EMAIL_FROM_NAME` | No | `Abhishek Raj` | Sender display name |
| `PORT` | No | `5000` | Backend server port |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL (for CORS) |
| `REDIS_HOST` | No | `127.0.0.1` | Redis server host |
| `REDIS_PORT` | No | `6379` | Redis server port |
| `REDIS_PASSWORD` | No | — | Redis password (if any) |
| `MAX_EMAILS_PER_HOUR` | No | `50` | Rate limit per hour |
| `MAX_EMAILS_PER_DAY` | No | `80` | Rate limit per day |
| `MIN_DELAY_SECONDS` | No | `30` | Min random delay between sends |
| `MAX_DELAY_SECONDS` | No | `60` | Max random delay between sends |
| `MAX_RESUME_SIZE_MB` | No | `5` | Max resume upload size |
| `DUPLICATE_CHECK_DAYS` | No | `7` | Skip if same email sent within N days |
| `MAX_RETRIES` | No | `3` | Max retry attempts for failed emails |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:5000` | Backend API URL |

---

## 🚀 Deployment

| Service | Recommended Platform | Free Tier |
|---------|---------------------|-----------|
| Frontend | [Vercel](https://vercel.com) | ✅ Free |
| Backend | [Render](https://render.com) or [Railway](https://railway.app) | ✅ Free |
| Redis | [Upstash](https://upstash.com) | ✅ Free (10,000 commands/day) |
| Email | Gmail SMTP (your own account) | ✅ Free (500/day) |

> 💡 **Total cost to run this project: $0** — everything fits within free tiers for personal use.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED 127.0.0.1:6379` | Redis isn't running. Start it with Docker or WSL (see above). The app still works for CRUD, just no campaign sending. |
| Emails not being delivered | Check `EMAIL_USER` and `EMAIL_APP_PASSWORD` in `.env`. Make sure 2-Step Verification is enabled and you're using an App Password (not your regular password). |
| `Invalid login` or `534` error | Your App Password is incorrect or expired. Generate a new one at https://myaccount.google.com/apppasswords |
| Gmail blocking sign-in | Enable 2-Step Verification first, then create an App Password. "Less secure apps" is no longer supported. |
| Frontend can't reach backend | Make sure backend is running on port 5000 and `NEXT_PUBLIC_API_URL=http://localhost:5000` in `frontend/.env.local`. |
| Port 5000 already in use | Change `PORT=5001` in `backend/.env` and update `NEXT_PUBLIC_API_URL` in frontend accordingly. |

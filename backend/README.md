# AutoApply Backend

Express.js API server with Gmail SMTP, BullMQ queue, and SQLite database.

## Environment Variables

Create a `.env` file in this folder. Only **4 variables** are required — everything else has defaults.

### ✅ Required

```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=https://your-frontend.vercel.app
REDIS_URL=rediss://default:xxx@your-host.upstash.io:6379
```

| Variable | What it is |
|----------|-----------|
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_APP_PASSWORD` | Gmail App Password (16 chars) — get it at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| `FRONTEND_URL` | Your Vercel frontend URL (for CORS) |
| `REDIS_URL` | Redis connection URL — get free from [upstash.com](https://upstash.com) |

### ⚙️ Optional (good defaults, no need to change)

| Variable | Default | What it is |
|----------|---------|-----------|
| `EMAIL_FROM_NAME` | `Abhishek Raj` | Sender name in emails |
| `NODE_ENV` | `development` | Set to `production` on Render |
| `PORT` | `5000` | Server port |
| `MAX_EMAILS_PER_DAY` | `80` | Daily email limit |
| `MAX_EMAILS_PER_HOUR` | `50` | Hourly email limit |
| `MIN_DELAY_SECONDS` | `30` | Min delay between emails |
| `MAX_DELAY_SECONDS` | `60` | Max delay between emails |

## Run Locally

```bash
npm install
node src/index.js
```

## Deploy on Render

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |

Add the 4 required env vars above + set `NODE_ENV=production`.

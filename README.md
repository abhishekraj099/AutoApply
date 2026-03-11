# AutoApply Mail Scheduler

A production-quality web application that helps job seekers automatically schedule and send job application emails to recruiters.

## Architecture

```
User → Next.js Frontend → Express.js Backend API → BullMQ Queue → Email Worker → Gmail SMTP
                                  ↕
                            SQLite Database
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TailwindCSS, ShadCN UI |
| Backend | Node.js, Express.js |
| Database | SQLite (via sql.js) — zero config, file-based |
| Queue | BullMQ + Redis |
| Email | Gmail SMTP (Nodemailer) |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Create a `.env` file inside the `backend/` folder. Copy from `.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **Gmail SMTP** | | | |
| `EMAIL_USER` | ✅ **Yes** | — | Your Gmail address (e.g. `you@gmail.com`) |
| `EMAIL_APP_PASSWORD` | ✅ **Yes** | — | Gmail App Password (16-char, from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)) |
| `EMAIL_FROM_NAME` | No | `Abhishek Raj` | Sender display name shown in emails |
| **Server** | | | |
| `PORT` | No | `5000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment (`development` / `production`) |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL (used for CORS) |
| **Redis** | | | |
| `REDIS_HOST` | No | `127.0.0.1` | Redis server host |
| `REDIS_PORT` | No | `6379` | Redis server port |
| `REDIS_PASSWORD` | No | — | Redis password (if any) |
| **Email Rate Limits** | | | |
| `MAX_EMAILS_PER_HOUR` | No | `50` | Max emails sent per hour |
| `MAX_EMAILS_PER_DAY` | No | `80` | Max emails sent per day (Gmail-safe) |
| `MIN_DELAY_SECONDS` | No | `30` | Minimum random delay between sends |
| `MAX_DELAY_SECONDS` | No | `60` | Maximum random delay between sends |
| **File Upload** | | | |
| `MAX_RESUME_SIZE_MB` | No | `5` | Max resume PDF upload size (MB) |
| `UPLOAD_DIR` | No | `./uploads` | Directory for uploaded resumes |
| **Other** | | | |
| `DUPLICATE_CHECK_DAYS` | No | `7` | Skip sending if same email was sent within N days |
| `MAX_RETRIES` | No | `3` | Max retry attempts for failed emails |
| `RETRY_DELAY_1` | No | `300000` | 1st retry delay (ms) — default 5 min |
| `RETRY_DELAY_2` | No | `900000` | 2nd retry delay (ms) — default 15 min |
| `RETRY_DELAY_3` | No | `1800000` | 3rd retry delay (ms) — default 30 min |

#### Example `backend/.env`

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

EMAIL_USER=yourname@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Your Name

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

MAX_EMAILS_PER_HOUR=50
MAX_EMAILS_PER_DAY=80
MIN_DELAY_SECONDS=30
MAX_DELAY_SECONDS=60

MAX_RESUME_SIZE_MB=5
UPLOAD_DIR=./uploads
DUPLICATE_CHECK_DAYS=7

MAX_RETRIES=3
RETRY_DELAY_1=300000
RETRY_DELAY_2=900000
RETRY_DELAY_3=1800000
```

---

### Frontend (`frontend/.env.local`)

Create a `.env.local` file inside the `frontend/` folder:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:5000` | Backend API URL |

#### Example `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> For deployment, change this to your live backend URL (e.g. `https://autoapply-backend.onrender.com`)

---

## 🚀 Quick Start

```bash
# 1. Install
cd backend && npm install
cd ../frontend && npm install

# 2. Set your Gmail credentials in backend/.env
#    EMAIL_USER=your_gmail@gmail.com
#    EMAIL_APP_PASSWORD=your_gmail_app_password

# 3. Start Redis
#    Windows: download from https://github.com/tporadowski/redis/releases (v5.0+)
#    Mac/Linux: docker run -d --name redis -p 6379:6379 redis

# 4. Run
cd backend && npm start       # → http://localhost:5000
cd frontend && npm run dev    # → http://localhost:3000
```

> 📖 **Full setup guide, Gmail App Password instructions & troubleshooting** → see [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## Features

- **Dashboard** — Overview with stats cards, recent campaigns, email history
- **Campaign Modes** — Bulk email to lists, or custom per-company emails
- **Email Templates** — Reusable templates with `{{name}}` and `{{company}}` placeholders
- **Email Lists** — Create lists, add contacts manually or via CSV import
- **Resume Management** — Upload PDFs, set a default resume for auto-attachment
- **Scheduling** — Pick a date/time; BullMQ handles delayed execution
- **Rate Limiting** — Max 50/hour, 80/day, with 30–60s random delays between sends
- **Anti-Spam** — Duplicate prevention (7-day window), smart send window warnings
- **Retry System** — 3 retries with exponential backoff (5m → 15m → 30m)
- **Email Preview** — Preview campaigns before sending
- **Test Email** — Send a test to yourself before launching
- **Progress Tracking** — Real-time progress bar per campaign
- **Full History** — Paginated email history with status and error tracking
- **Logging** — Campaign event logs for auditing

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET/POST | `/api/templates` | List / Create templates |
| GET/PUT/DELETE | `/api/templates/:id` | Get / Update / Delete template |
| GET/POST | `/api/email-lists` | List / Create email lists |
| GET/PUT/DELETE | `/api/email-lists/:id` | Get / Update / Delete list |
| POST | `/api/email-lists/:id/contacts` | Add contact to list |
| POST | `/api/email-lists/:id/import` | Import CSV contacts |
| DELETE | `/api/email-lists/:id/contacts/:contactId` | Remove contact |
| GET/POST | `/api/resumes` | List / Upload resume |
| DELETE | `/api/resumes/:id` | Delete resume |
| PUT | `/api/resumes/:id/default` | Set default resume |
| GET/POST | `/api/campaigns` | List / Create campaign |
| GET/PUT/DELETE | `/api/campaigns/:id` | Get / Update / Delete campaign |
| POST | `/api/campaigns/:id/schedule` | Schedule campaign |
| POST | `/api/campaigns/:id/cancel` | Cancel campaign |
| GET | `/api/campaigns/:id/preview` | Preview campaign emails |
| POST | `/api/campaigns/:id/test` | Send test email |
| GET | `/api/campaigns/:id/logs` | Campaign event logs |
| GET | `/api/campaigns/history/all` | Full email history (paginated) |

---

## Folder Structure

```
AutoApply/
├── backend/
│   ├── src/
│   │   ├── config/          # App config, logger
│   │   ├── controllers/     # Route handlers
│   │   ├── database/        # SQLite init, models
│   │   ├── queue/           # BullMQ queues & workers
│   │   ├── routes/          # Express routes
│   │   └── services/        # Email service (Gmail SMTP)
│   ├── database/            # SQLite DB file (auto-created)
│   ├── uploads/             # Resume storage (auto-created)
│   ├── logs/                # Application logs (auto-created)
│   ├── .env.example         # ← Copy to .env and fill in values
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   └── dashboard/       # All dashboard pages
│   ├── components/ui/       # ShadCN-style UI components
│   ├── lib/                 # API client, utilities
│   └── package.json
│
├── README.md
└── SETUP_GUIDE.md
```

---

## Deployment

| Service | Platform | Free Tier |
|---------|----------|-----------|
| Frontend | [Vercel](https://vercel.com) | ✅ Free |
| Backend | [Render](https://render.com) | ✅ Free (750 hrs/mo) |
| Redis | [Upstash](https://upstash.com) | ✅ Free (10K commands/day) |
| Email | Gmail SMTP | ✅ Free (500/day) |

---

## License

MIT

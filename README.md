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

## Quick Start

```bash
# 1. Install
cd backend && npm install
cd ../frontend && npm install

# 2. Set your Gmail credentials in backend/.env
#    EMAIL_USER=your_gmail@gmail.com
#    EMAIL_APP_PASSWORD=your_gmail_app_password

# 3. Start Redis (needed for campaign scheduling)
docker run -d --name redis -p 6379:6379 redis

# 4. Run
cd backend && npm run dev     # → http://localhost:5000
cd frontend && npm run dev    # → http://localhost:3000
```

> 📖 **Full setup instructions, requirements, env variables, deployment & troubleshooting** → see [SETUP_GUIDE.md](SETUP_GUIDE.md)

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

## Folder Structure

```
backend/
  src/
    config/          # App config, logger
    controllers/     # Route handlers
    database/        # SQLite init, models
    queue/           # BullMQ queues & workers
    routes/          # Express routes
    services/        # Email service (Gmail SMTP)
  database/          # SQLite DB file (auto-created)
  uploads/           # Resume storage (auto-created)
  logs/              # Application logs (auto-created)

frontend/
  app/
    dashboard/       # Dashboard pages
      campaigns/     # Campaign list, create, detail
      templates/     # Email template management
      email-lists/   # Email list management
      resumes/       # Resume management
      history/       # Email history
  components/
    ui/              # ShadCN-style UI components
  lib/               # API client, utilities
```

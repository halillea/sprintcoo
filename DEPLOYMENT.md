# SprintCOO - Self-Hosted Deployment Guide

SprintCOO is a Digital Chief Operating Officer SaaS application. This guide covers deploying it on any platform without Replit dependencies.

## Quick Start

```bash
# 1. Clone the project
git clone <your-repo-url>
cd sprintcoo

# 2. Install dependencies
npm install

# 3. Configure environment (see below)
cp .env.example .env
# Edit .env with your values

# 4. Setup database
npm run db:push

# 5. Start the app
npm run dev
```

The app runs at `http://localhost:5000`

---

## Environment Variables

Create a `.env` file with these variables:

### Required

```bash
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/sprintcoo

# Session security (generate a random 32+ character string)
SESSION_SECRET=your-super-secret-session-key-here

# Claude AI for task triage
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Gemini AI for task execution
GEMINI_API_KEY=your-gemini-api-key
```

### Optional (Google Drive Integration)

```bash
# Google OAuth (for Drive import feature)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

---

## Getting API Keys

### 1. Anthropic (Claude AI)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account or sign in
3. Navigate to API Keys
4. Create new key
5. Copy to `ANTHROPIC_API_KEY`

### 2. Google AI (Gemini)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API key"
3. Create new key or use existing
4. Copy to `GEMINI_API_KEY`

### 3. Google Drive OAuth (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Google Drive API:
   - APIs & Services → Library → Search "Google Drive API" → Enable
4. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Client Secret to your `.env`

---

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb sprintcoo

# Set DATABASE_URL
DATABASE_URL=postgresql://localhost:5432/sprintcoo
```

### Cloud PostgreSQL (Recommended for Production)

**Neon (Free tier available)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string to `DATABASE_URL`

**Supabase**
1. Sign up at [supabase.com](https://supabase.com)
2. Create project → Settings → Database → Connection string
3. Copy to `DATABASE_URL`

**Railway**
1. Sign up at [railway.app](https://railway.app)
2. New Project → Add PostgreSQL
3. Copy connection string

---

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Railway / Render / Fly.io

1. Connect your Git repository
2. Set environment variables in the dashboard
3. Build command: `npm install && npm run build`
4. Start command: `npm start`

### VPS (DigitalOcean, AWS EC2, etc.)

```bash
# On your server
git clone <repo>
cd sprintcoo
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "sprintcoo" -- start
pm2 save
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React/Vite    │────▶│   Express API   │────▶│   PostgreSQL    │
│   Frontend      │     │   Backend       │     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │ Claude  │ │ Gemini  │ │ Google  │
              │ (Triage)│ │(Execute)│ │ Drive   │
              └─────────┘ └─────────┘ └─────────┘
```

### Core Features

| Feature | Technology | Required |
|---------|------------|----------|
| Authentication | Email/password + bcrypt + sessions | Yes |
| Database | PostgreSQL + Drizzle ORM | Yes |
| Task Triage | Claude AI (Anthropic) | Yes |
| Task Execution | Gemini AI (Google) | Yes |
| File Import | Google Drive API | Optional |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| users | User accounts with hashed passwords |
| sessions | Active login sessions |
| projects | Task groupings/projects |
| tasks | Individual tasks with AI triage categories |
| agents | AI agents (prompt, script, automation) |
| files | Uploaded and synced files |
| social_posts | Generated social media content |
| notifications | In-app notifications |
| activity_logs | Activity audit trail |
| team_members | Multi-user team support |

---

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- Check PostgreSQL is running
- Ensure network access (cloud DBs may need IP whitelist)

### "ANTHROPIC_API_KEY not set"
- Add the key to your `.env` file
- Restart the server after changing `.env`

### "Google Drive not connected"
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Connect your Google account in Settings page
- Verify redirect URI matches OAuth configuration

### Login not working
- Clear browser cookies
- Check `SESSION_SECRET` is set
- Verify database has sessions table: `npm run db:push`

---

## Development

```bash
# Start in development mode (with hot reload)
npm run dev

# Push schema changes to database
npm run db:push

# Type checking
npm run typecheck
```

---

## Security Checklist

- [ ] Set strong `SESSION_SECRET` (32+ random characters)
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production` in production
- [ ] Keep API keys secret (never commit to Git)
- [ ] Enable PostgreSQL SSL in production
- [ ] Set up database backups

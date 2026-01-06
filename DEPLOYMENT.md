# SprintCOO Deployment Guide

SprintCOO is a Digital Chief Operating Officer SaaS application that triages tasks, executes automations, and delegates work to AI agents.

## Prerequisites

### Required Services

| Service | Purpose | How to Get |
|---------|---------|------------|
| PostgreSQL Database | Store users, tasks, projects, agents, files, sessions | Included with Replit or use local/cloud PostgreSQL |
| Anthropic API Key | Claude Pro for task triage and parsing | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | Task execution and content generation | Configured via Replit AI Integrations |
| Google Drive OAuth | File sync and task import | Configured via Replit Connectors |

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-random-secret-string-min-32-chars
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Auto-configured by Replit AI Integrations (do not set manually on Replit)
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_GEMINI_BASE_URL=...

# Auto-configured by Replit (do not set manually on Replit)
REPL_ID=...
ISSUER_URL=...
```

---

## Deployment Option 1: Replit (Recommended)

### Step 1: Set Up Secrets
1. Open the "Secrets" tab in your Replit project
2. Add `ANTHROPIC_API_KEY` with your Claude API key
3. `SESSION_SECRET` is auto-generated

### Step 2: Configure Integrations
1. **Gemini AI**: Already configured via Replit AI Integrations
2. **Google Drive**: Connect via the Connections panel (already done if you set it up)

### Step 3: Push Database Schema
```bash
npm run db:push
```

### Step 4: Publish
1. Click the "Publish" button in Replit
2. Your app will be live at `https://your-app.replit.app`
3. SSL/HTTPS is automatically configured

---

## Deployment Option 2: Local Development (Node.js)

### Requirements
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up PostgreSQL
Create a new database:
```sql
CREATE DATABASE sprintcoo;
```

### Step 3: Configure Environment
Create a `.env` file in the project root:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/sprintcoo
SESSION_SECRET=generate-a-random-32-character-string-here
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-key
```

### Step 4: Push Database Schema
```bash
npm run db:push
```

### Step 5: Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Local Limitations
- **Google Drive Integration**: Requires setting up your own Google Cloud OAuth credentials
- **Replit Auth**: Uses Replit's OIDC provider - for local dev, you may need alternative auth

---

## Deployment Option 3: Cloud Providers

### General Steps for Heroku, Railway, Render, etc.

1. **Database**: Use the provider's managed PostgreSQL or connect to an external one
2. **Environment Variables**: Set all required variables in the provider's dashboard
3. **Build Command**: `npm run build` (if applicable)
4. **Start Command**: `npm start` or `npm run dev`
5. **Port**: The app binds to port 5000 by default

### Provider-Specific Notes

**Railway**
```bash
# railway.json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "npm run dev" }
}
```

**Render**
- Build Command: `npm install`
- Start Command: `npm run dev`
- Add PostgreSQL as a service

---

## Database Schema

The app uses Drizzle ORM with the following tables:

| Table | Purpose |
|-------|---------|
| users | User accounts (synced from Replit Auth) |
| sessions | Active user sessions |
| projects | Task groupings/projects |
| tasks | Individual tasks with triage categories |
| agents | AI agents (prompt, script, automation types) |
| files | Uploaded and synced files |
| social_posts | Generated social media content |
| notifications | In-app notifications |
| activity_logs | Activity audit trail |
| team_members | Multi-user team support |

To reset the database:
```bash
npm run db:push
```

---

## API Keys Setup

### Anthropic (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key
5. Copy and add as `ANTHROPIC_API_KEY`

### Google Gemini (on Replit)
- Automatically configured via Replit AI Integrations
- No manual setup required

### Google Drive (on Replit)
- Configured via Replit Connectors
- Grants access to read/write files in your Drive

---

## Troubleshooting

### "Invalid authentication request"
- Clear browser cookies and try again
- Ensure you're accessing via HTTPS
- Check that `SESSION_SECRET` is set

### Database connection errors
- Verify `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check network/firewall settings

### Google Drive not connecting
- Re-authorize via Replit Connectors
- Check OAuth scopes in Google Cloud Console (if self-hosted)

### AI features not working
- Verify `ANTHROPIC_API_KEY` is correct
- Check API quota/billing on Anthropic dashboard
- For Gemini issues, check Replit AI Integrations status

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Express API   │────▶│   PostgreSQL    │
│   (React/Vite)  │     │   (Node.js)     │     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   AI Services       │
                    │ • Claude (Triage)   │
                    │ • Gemini (Execute)  │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   External APIs     │
                    │ • Google Drive      │
                    │ • Google Sheets     │
                    └─────────────────────┘
```

---

## Support

For issues with:
- **Replit Platform**: Contact Replit support
- **Anthropic API**: Check [docs.anthropic.com](https://docs.anthropic.com)
- **Google APIs**: Check [developers.google.com](https://developers.google.com)

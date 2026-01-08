# SprintCOO - Digital Chief Operating Officer

## Overview

SprintCOO is a self-hostable SaaS application that acts as a "Digital Chief Operating Officer" for CEOs and strategic thinkers. It triages incoming tasks from chaotic sources (like text files in Google Drive), categorizes them into actionable buckets, executes automations where possible, delegates work to AI agents, and surfaces items requiring human judgment to a clean dashboard.

The core workflow:
1. **Import**: Pull task files from Google Drive (folder named "4COO") or manual upload
2. **Triage**: Use Claude AI to categorize tasks into: auto-execute, delegate to agent, or requires human decision
3. **Execute**: Run automations via Gemini AI for content generation, web scraping, script generation
4. **Track**: Store progress in PostgreSQL, sync outputs back to Google Drive/Sheets
5. **Alert**: Notify user of completed work, errors, and items needing attention

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode)
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Authentication**: Email/password with bcrypt + PostgreSQL sessions
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Key Tables**: users, sessions, projects, tasks, agents, files, notifications, activity_logs, team_members

### AI Integration Strategy
- **Claude (Anthropic)**: Used for intelligent task triage and parsing - requires `ANTHROPIC_API_KEY`
- **Gemini (Google)**: Used for task execution, content generation - requires `GEMINI_API_KEY`
- **Batch Processing**: Rate-limit-aware batch utilities in `server/replit_integrations/batch/`

### External Service Integrations
- **Google Drive**: File sync and task import via standard Google OAuth (user provides credentials)

### Code Organization
```
client/src/           # React frontend
  components/ui/      # shadcn/ui components
  pages/              # Route components (login, register, dashboard, tasks, etc.)
  hooks/              # Custom React hooks (use-auth, use-toast)
  lib/                # Utilities (queryClient, auth-utils)

server/               # Express backend
  replit_integrations/  # Auth, chat, batch, image modules
  routes.ts           # API route definitions
  storage.ts          # Database operations
  google-drive.ts     # Drive API wrapper (standard OAuth)

shared/               # Shared between client/server
  schema.ts           # Drizzle database schema
  routes.ts           # API contract types with Zod
  models/             # Auth and chat models
```

### Key Design Decisions

**Shared Schema Approach**: Database schema and types are defined once in `shared/schema.ts` and imported by both frontend and backend, ensuring type consistency across the stack.

**Storage Abstraction**: All database operations go through `server/storage.ts` interface, making it easy to mock for testing or swap implementations.

**Self-Hostable Design**: No platform dependencies. Uses standard email/password auth, direct API calls to AI providers, and standard Google OAuth for Drive integration.

## External Dependencies

### Required Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| PostgreSQL | Primary data store | `DATABASE_URL` environment variable |
| Anthropic Claude | Task triage AI | `ANTHROPIC_API_KEY` secret |
| Google Gemini | Content generation | `GEMINI_API_KEY` secret |

### Optional Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| Google Drive | File sync | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (32+ random characters)
- `ANTHROPIC_API_KEY` - Claude API key for task triage
- `GEMINI_API_KEY` - Gemini API key for content generation
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional, for Drive)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional, for Drive)
- `GOOGLE_REDIRECT_URI` - OAuth callback URL (default: http://localhost:5000/api/auth/google/callback)

### Database Setup
Run `npm run db:push` to push schema to PostgreSQL after provisioning.

## Deployment

See `DEPLOYMENT.md` for comprehensive self-hosting instructions covering:
- Local development setup
- Docker deployment
- VPS deployment (Railway, Render, Fly.io)
- Environment variable configuration
- Database setup (local and cloud PostgreSQL)

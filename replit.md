# SprintCOO - Digital Chief Operating Officer

## Overview

SprintCOO is a SaaS application that acts as a "Digital Chief Operating Officer" for CEOs and strategic thinkers. It triages incoming tasks from chaotic sources (like text files in Google Drive), categorizes them into actionable buckets, executes automations where possible, delegates work to AI agents, and surfaces items requiring human judgment to a clean dashboard.

The core workflow:
1. **Import**: Pull task files from Google Drive (folder named "4COO")
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
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Key Tables**: projects, tasks, agents, files, notifications, activity_logs, team_members, sessions, users

### AI Integration Strategy
- **Claude (Anthropic)**: Used for intelligent task triage and parsing - requires `ANTHROPIC_API_KEY`
- **Gemini (Google)**: Used for task execution, content generation, and image generation - accessed via Replit AI Integrations (auto-configured)
- **Batch Processing**: Rate-limit-aware batch utilities in `server/replit_integrations/batch/`

### External Service Integrations
- **Google Drive**: File sync and task import via Replit Connectors OAuth
- **Replit Auth**: User authentication without requiring separate OAuth setup

### Code Organization
```
client/src/           # React frontend
  components/ui/      # shadcn/ui components
  pages/              # Route components
  hooks/              # Custom React hooks
  lib/                # Utilities (queryClient, auth-utils)

server/               # Express backend
  replit_integrations/  # Auth, chat, batch, image modules
  routes.ts           # API route definitions
  storage.ts          # Database operations
  google-drive.ts     # Drive API wrapper

shared/               # Shared between client/server
  schema.ts           # Drizzle database schema
  routes.ts           # API contract types with Zod
  models/             # Auth and chat models
```

### Key Design Decisions

**Shared Schema Approach**: Database schema and types are defined once in `shared/schema.ts` and imported by both frontend and backend, ensuring type consistency across the stack.

**Storage Abstraction**: All database operations go through `server/storage.ts` interface, making it easy to mock for testing or swap implementations.

**Replit Integration Modules**: Authentication, chat, batch processing, and image generation are organized under `server/replit_integrations/` as self-contained modules with their own routes and storage.

## External Dependencies

### Required Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| PostgreSQL | Primary data store | `DATABASE_URL` environment variable |
| Anthropic Claude | Task triage AI | `ANTHROPIC_API_KEY` secret |
| Google Gemini | Content generation | Auto-configured via Replit AI Integrations |
| Google Drive | File sync | Replit Connectors OAuth |

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned on Replit)
- `SESSION_SECRET` - Session encryption key (auto-generated on Replit)
- `ANTHROPIC_API_KEY` - Claude API key for task triage
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Auto-set by Replit
- `AI_INTEGRATIONS_GEMINI_BASE_URL` - Auto-set by Replit
- `REPL_ID`, `ISSUER_URL` - Auto-set by Replit for auth

### Database Setup
Run `npm run db:push` to push schema to PostgreSQL after provisioning.
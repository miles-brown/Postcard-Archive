# CLAUDE.md — Postcard Archive

## Project Overview

Historical Postcard Archive — a full-stack web application that scrapes eBay for handwritten postcards related to WWI, WWII, and the Holocaust, transcribes handwriting using AI vision (Gemini), and displays them in a searchable public gallery.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui (New York style) |
| Routing (client) | Wouter (patched — see `patches/wouter@3.7.1.patch`) |
| State / data fetching | tRPC v11 + TanStack React Query |
| Backend | Express 4, tRPC, Node.js |
| Database | MySQL via Drizzle ORM |
| Storage | AWS S3 (via Forge API proxy) |
| AI/LLM | Gemini 2.5 Flash (via Forge API) |
| Scraping | Firecrawl MCP |
| Auth | Manus OAuth + JWT sessions (JOSE) |
| Package manager | pnpm (10.4.1+) |
| Bundler | Vite 7 (dev + client build), esbuild (server build) |
| Testing | Vitest (server-side only) |
| Formatting | Prettier |

## Repository Structure

```
├── client/                     # React frontend
│   ├── public/                 # Static assets
│   └── src/
│       ├── _core/hooks/        # Core hooks (useAuth)
│       ├── components/
│       │   ├── ui/             # shadcn/ui components (60+)
│       │   ├── AIChatBox.tsx
│       │   ├── DashboardLayout.tsx
│       │   ├── ErrorBoundary.tsx
│       │   ├── Map.tsx
│       │   └── ManusDialog.tsx
│       ├── contexts/           # ThemeContext
│       ├── hooks/              # useMobile, useComposition, usePersistFn
│       ├── lib/
│       │   ├── trpc.ts         # tRPC client setup
│       │   └── utils.ts        # cn() helper
│       ├── pages/              # Route pages
│       │   ├── Home.tsx        # Landing page
│       │   ├── Gallery.tsx     # Public postcard gallery
│       │   ├── PostcardDetail.tsx
│       │   ├── Admin.tsx       # Admin dashboard
│       │   └── NotFound.tsx
│       ├── App.tsx             # Router + providers
│       ├── main.tsx            # Entry point (tRPC + QueryClient setup)
│       └── index.css           # Tailwind + CSS variables
│
├── server/                     # Express + tRPC backend
│   ├── _core/
│   │   ├── index.ts            # Server entry point
│   │   ├── context.ts          # tRPC context (user, req, res)
│   │   ├── trpc.ts             # Procedure definitions (public/protected/admin)
│   │   ├── cookies.ts          # Session cookie config
│   │   ├── env.ts              # ENV object (typed env vars)
│   │   ├── sdk.ts              # Manus OAuth SDK
│   │   ├── oauth.ts            # OAuth callback routes
│   │   ├── systemRouter.ts     # Health check + notifications
│   │   ├── llm.ts              # Gemini LLM integration
│   │   ├── vite.ts             # Vite dev middleware / static serving
│   │   └── types/              # Type declarations
│   ├── routers.ts              # Main tRPC appRouter (all procedures)
│   ├── db.ts                   # Database query functions
│   ├── storage.ts              # S3 upload/download helpers
│   ├── scraperService.ts       # eBay scraping logic
│   ├── transcriptionService.ts # LLM-powered OCR transcription
│   ├── scheduledTasks.ts       # Exported scheduled job functions
│   ├── auth.logout.test.ts     # Auth tests
│   └── postcards.test.ts       # Postcard CRUD + tRPC tests
│
├── shared/                     # Code shared between client & server
│   ├── _core/errors.ts         # HttpError, BadRequestError, etc.
│   ├── types.ts                # Re-exports all Drizzle types
│   └── const.ts                # COOKIE_NAME, error messages, timeouts
│
├── drizzle/                    # Database schema & migrations
│   ├── schema.ts               # Table definitions (5 tables)
│   ├── relations.ts            # Entity relations
│   ├── 0000_*.sql, 0001_*.sql  # SQL migrations
│   └── meta/                   # Drizzle Kit metadata
│
├── patches/                    # pnpm patches
│   └── wouter@3.7.1.patch
│
├── run-scraper.mjs             # Manual: scrape + transcribe
├── run-transcription.mjs       # Manual: transcription only
├── check-progress.mjs          # Manual: DB stats by war period
├── todo.md                     # Project task tracker
├── components.json             # shadcn/ui config
├── drizzle.config.ts           # Drizzle Kit config (MySQL)
├── vite.config.ts              # Vite config (React, Tailwind, aliases)
├── vitest.config.ts            # Vitest config (server tests only)
├── tsconfig.json               # TypeScript config (strict, ESNext)
└── package.json                # Scripts, dependencies, pnpm config
```

## Commands

```bash
pnpm dev          # Start dev server (tsx watch, hot reload)
pnpm build        # Build client (Vite) + server (esbuild) → dist/
pnpm start        # Run production server from dist/
pnpm check        # TypeScript type-check (tsc --noEmit)
pnpm format       # Prettier format all files
pnpm test         # Run Vitest tests (server/**/*.test.ts)
pnpm db:push      # Generate + apply Drizzle migrations
```

## Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:

| Alias | Resolves to |
|-------|------------|
| `@/*` | `./client/src/*` |
| `@shared/*` | `./shared/*` |
| `@assets/*` | `./attached_assets/*` |

## Database Schema (5 tables)

All tables defined in `drizzle/schema.ts` using Drizzle ORM for MySQL.

- **users** — OAuth users with roles (`user` | `admin`)
- **postcards** — Scraped eBay listings with war period (`WWI` | `WWII` | `Holocaust`) and transcription status (`pending` | `processing` | `completed` | `failed`)
- **postcardImages** — S3-stored images linked to postcards, with `isPrimary` flag
- **transcriptions** — OCR text results with confidence and language
- **scrapingLogs** — Scraping job status and stats

Types are exported from `shared/types.ts` (re-exports `drizzle/schema.ts` inferred types).

## tRPC API Structure

Defined in `server/routers.ts`. Three procedure levels:

- **publicProcedure** — No auth required
- **protectedProcedure** — Requires authenticated user (JWT cookie)
- **adminProcedure** — Requires `role === 'admin'`

```
appRouter
├── system.health
├── system.notifyOwner          (admin)
├── auth.me                     (public)
├── auth.logout                 (public)
├── postcards.list              (public, filters: warPeriod, searchQuery)
├── postcards.getById           (public, enforces isPublic)
├── postcards.searchByTranscription (public)
├── admin.scraper.run           (admin, optional warPeriod filter)
├── admin.scraper.logs          (admin)
├── admin.transcription.processAll  (admin)
├── admin.transcription.processOne  (admin)
├── admin.postcards.listAll     (admin, includes hidden)
├── admin.postcards.update      (admin)
└── admin.postcards.delete      (admin)
```

The tRPC client is set up in `client/src/main.tsx` with `httpBatchLink` and `superjson` transformer. API endpoint: `/api/trpc`.

## Client Routes

Defined in `client/src/App.tsx` using Wouter:

| Path | Page | Auth |
|------|------|------|
| `/` | Home | Public |
| `/gallery` | Gallery | Public |
| `/postcard/:id` | PostcardDetail | Public |
| `/admin` | Admin | Admin role |
| `/404` | NotFound | Public |

## Authentication Flow

1. User clicks login → redirects to Manus OAuth portal
2. OAuth callback at `/api/oauth/callback` exchanges code for token
3. Server creates JWT session, sets `app_session_id` HttpOnly cookie
4. Client calls `auth.me` to check session; `useAuth()` hook manages state
5. On 401, client auto-redirects to login

## Environment Variables

Accessed via `server/_core/env.ts` (the `ENV` object):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `VITE_APP_ID` | Application ID (client-accessible) |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL (client-accessible) |
| `OAUTH_SERVER_URL` | OAuth server endpoint |
| `JWT_SECRET` | Session cookie signing |
| `OWNER_OPEN_ID` | Admin user's OAuth ID |
| `BUILT_IN_FORGE_API_KEY` | Forge API key (LLM + S3) |
| `BUILT_IN_FORGE_API_URL` | Forge API endpoint |
| `PORT` | Server port (default 3000) |

## Code Conventions

### TypeScript
- Strict mode enabled
- Module: ESNext with bundler resolution
- Use Zod for all tRPC input validation
- Export types from `drizzle/schema.ts` via `$inferSelect` / `$inferInsert`
- Import shared types from `@shared/types`

### Formatting (Prettier)
- Semicolons: yes
- Single quotes: no (double quotes)
- Print width: 80
- Tab width: 2 (spaces)
- Trailing commas: es5
- Arrow parens: avoid when possible
- Bracket spacing: yes

### Frontend
- shadcn/ui with New York style, neutral base color, CSS variables
- Use `cn()` from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)
- Lucide React for icons
- Sonner for toast notifications
- Framer Motion for animations
- Design aesthetic: Scandinavian minimalist — pale cool gray background, bold black sans-serif, generous negative space, soft pastel blue/blush pink geometric accents

### Backend
- All database access goes through `server/db.ts` functions (never raw queries in routers)
- tRPC procedures are organized in nested routers within `server/routers.ts`
- Services (`scraperService.ts`, `transcriptionService.ts`) handle business logic
- LLM calls go through the generic `server/_core/llm.ts` invoker

### Testing
- Tests live alongside source files in `server/` with `.test.ts` suffix
- Vitest with node environment
- Tests cover auth, CRUD operations, and tRPC procedure behavior
- Run with `pnpm test`

## Key Architectural Patterns

### Data Flow
```
React UI → tRPC Client → HTTP POST /api/trpc → Express → tRPC Router
→ Procedure (validation + auth) → Service / DB function → MySQL / S3 / LLM
```

### Scraping Pipeline
```
Admin trigger or schedule → scraperService (Firecrawl MCP)
→ eBay search → Parse listings → Download images → S3 upload
→ Create postcard + image records → Log results
```

### Transcription Pipeline
```
Admin trigger or schedule → transcriptionService
→ Get pending postcards → Fetch S3 images → Gemini vision API
→ Extract text + detect language + confidence score → Store transcription
→ Update postcard status
```

### Scheduled Tasks
Exported from `server/scheduledTasks.ts`:
- `runScheduledScrapeAndTranscribe()` — both pipelines sequentially
- `runScheduledScrape()` — scraping only
- `runScheduledTranscription()` — transcription only

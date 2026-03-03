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

## Database Layer API (`server/db.ts`)

All database access is funneled through these functions. Never write raw queries in routers.

**Connection**: Lazy-initialized via `getDb()`. Returns cached Drizzle MySQL2 client or `null` if unavailable. Functions throw `"Database not available"` when the connection is down.

### User functions
- `upsertUser(user: InsertUser)` — insert or update by `openId`; auto-assigns `role: 'admin'` when `openId === ENV.ownerOpenId`
- `getUserByOpenId(openId: string)` — returns `User | undefined`

### Postcard functions
- `createPostcard(postcard: InsertPostcard)` — returns `insertId`
- `getPostcardByEbayId(ebayId: string)` — duplicate check before scraping
- `getAllPostcards(filters?: { warPeriod?, searchQuery?, isPublic? })` — supports AND filtering; `searchQuery` is OR across title + description with LIKE; ordered by `dateFound` desc
- `getPostcardById(id: number)` — returns `Postcard | undefined`
- `updatePostcard(id, updates: Partial<InsertPostcard>)` — partial update
- `deletePostcard(id: number)`

### Image functions
- `createPostcardImage(image: InsertPostcardImage)` — returns `insertId`
- `getPostcardImages(postcardId: number)` — all images for a postcard
- `getPrimaryImage(postcardId: number)` — image where `isPrimary = true`

### Transcription functions
- `createTranscription(transcription: InsertTranscription)` — returns `insertId`
- `getPostcardTranscriptions(postcardId: number)` — all transcriptions for a postcard
- `searchPostcardsByTranscription(searchQuery: string)` — joins postcards ↔ transcriptions, filters `isPublic = true`, deduplicates by postcardId

### Scraping log functions
- `createScrapingLog(log: InsertScrapingLog)` — returns `insertId`
- `updateScrapingLog(id, updates: Partial<InsertScrapingLog>)`
- `getRecentScrapingLogs(limit = 50)` — ordered by `startedAt` desc
- `getPostcardsNeedingTranscription()` — returns up to 10 postcards with `transcriptionStatus = "pending"`, ordered by `dateFound`

## Scraper Details (`server/scraperService.ts`)

### eBay Search Queries

| War Period | Queries |
|-----------|---------|
| WWI | "WWI handwritten postcard", "World War 1 handwritten postcard", "WW1 soldier postcard handwritten", "WWI field postcard handwritten", "Great War soldier letter postcard", "1914-1918 handwritten postcard" |
| WWII | "WWII handwritten postcard", "World War 2 handwritten postcard", "WW2 soldier postcard handwritten", "WWII military postcard handwritten", "1939-1945 soldier postcard", "World War II field post handwritten" |
| Holocaust | "Holocaust postcard handwritten", "concentration camp postcard", "ghetto postcard handwritten", "Jewish persecution postcard", "Holocaust survivor postcard" |

### Processing Limits
- **15 listings** max per search query
- **5 images** max per postcard (first is `isPrimary`)
- **10 postcards** per transcription batch
- **3-second delay** between eBay requests (rate limiting)
- **1-second delay** between LLM transcription calls
- **10 MB** max buffer for MCP output and image downloads

### Duplicate Prevention
- `Set<string>` tracks eBay IDs within a single scrape run
- `getPostcardByEbayId()` checks database before creating a new record
- Image URLs deduplicated via `Set<string>` before download

### Image Handling
- URLs converted to high quality: e.g., `s-l140` → `s-l1600`
- S3 key format: `postcards/{postcardId}/{nanoid()}.{extension}`
- Content type derived from response headers

## Transcription Details (`server/transcriptionService.ts`)

### LLM Prompts
- **System**: "You are an expert at reading and transcribing historical handwritten text from postcards. Transcribe the handwritten text exactly as it appears, preserving line breaks and formatting. If text is unclear or illegible, indicate with [illegible]. Include any dates, signatures, or addresses you can identify. Respond with ONLY the transcribed text, no additional commentary."
- **User**: "Please transcribe all handwritten text visible in this postcard image. Include any dates, addresses, messages, and signatures."

### Confidence Scoring
Counts `[illegible]` markers in the response text. Formula: `((totalWords - illegibleCount) / totalWords) * 100`, returned as a string like `"85%"`.

### Language Detection
Simple regex heuristics on transcribed text:
- German (`de`): `/[äöüß]/i`
- French (`fr`): `/[àâçéèêëîïôùûü]/i`
- Default: English (`en`)

## LLM Integration (`server/_core/llm.ts`)

### `invokeLLM(params: InvokeParams): Promise<InvokeResult>`

- **Model**: `gemini-2.5-flash` (hardcoded)
- **Endpoint**: `{BUILT_IN_FORGE_API_URL}/v1/chat/completions`
- **Max tokens**: 32768
- **Thinking budget**: 128 tokens
- **Auth**: `Authorization: Bearer {BUILT_IN_FORGE_API_KEY}`

Supports text, image_url (with detail level), and file_url content types. Tool calls, tool choice, and structured output (json_schema response format) are supported. Message content is automatically normalized between string and object formats for API compatibility.

## Storage Integration (`server/storage.ts`)

### `storagePut(relKey, data, contentType)`
Uploads to S3 via Forge API. Sends as multipart FormData. Returns `{ key, url }`.

### `storageGet(relKey)`
Gets a presigned download URL from Forge API. Returns `{ key, url }`.

Both functions use `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`. Keys are normalized (leading slashes stripped).

## Error Handling Patterns

### By Layer
| Layer | Pattern |
|-------|---------|
| tRPC procedures | Throw `TRPCError` with codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST` |
| Services (scraper, transcription) | Try-catch with `console.error`; continue on individual item failures; update status fields in DB |
| Database layer | Throw `"Database not available"` when connection is down; return empty arrays for read operations on unavailable DB |
| External APIs (LLM, S3) | Throw on HTTP errors with status + body text |
| Client | Error boundaries, Sonner toasts, auto-redirect to login on 401 |

### Shared Error Classes (`shared/_core/errors.ts`)
- `HttpError(statusCode, message)` — base class
- `BadRequestError(msg)` → 400
- `UnauthorizedError(msg)` → 401
- `ForbiddenError(msg)` → 403
- `NotFoundError(msg)` → 404

### Shared Error Constants (`shared/const.ts`)
- `UNAUTHED_ERR_MSG` = `"Please login (10001)"`
- `NOT_ADMIN_ERR_MSG` = `"You do not have required permission (10002)"`

## tRPC Middleware Chain

Defined in `server/_core/trpc.ts` with `superjson` transformer:

1. **`publicProcedure`** — no middleware, `ctx.user` may be `null`
2. **`protectedProcedure`** — middleware throws `UNAUTHORIZED` if `ctx.user` is null
3. **`adminProcedure`** — middleware throws `FORBIDDEN` if `ctx.user` is null or `role !== 'admin'`

Context (`server/_core/context.ts`) silently catches auth errors so public procedures always work.

## Cookie Configuration (`server/_core/cookies.ts`)

Session cookie options:
- `httpOnly: true` — not accessible to JavaScript
- `path: "/"` — sent for all paths
- `sameSite: "none"` — allows cross-site requests
- `secure` — dynamically set based on request protocol (checks `x-forwarded-proto` header)

## Frontend Patterns

### Component Design
- **Card + CardContent**: Standard wrapper pattern for consistent padding
- **Badge variants**: `secondary` (WWI), `default` (WWII), `destructive` (Holocaust), `outline` (status)
- **Icons**: Lucide React, typically `w-4 h-4` or `w-5 h-5` with `text-muted-foreground`
- **Responsive grids**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Empty states**: Icon + heading + description + action button
- **Loading**: `<Loader2 className="animate-spin" />` centered in container

### State Management
- **Queries**: `trpc.procedure.useQuery()` with reactive dependencies
- **Mutations**: `trpc.procedure.useMutation({ onSuccess, onError })` with toast feedback and cache refetch
- **Auth state**: `useAuth()` hook, persists user info to localStorage key `"manus-runtime-user-info"`
- **No pagination**: Gallery loads all matching postcards; filtering is server-side via tRPC input params

### CSS Theme System (`client/src/index.css`)
Uses OKLch color space. Key design tokens:
- **Background**: pale cool blue-gray (`oklch(0.97 0.005 240)`)
- **Primary**: black (`oklch(0.15 0 0)`) — for text and buttons
- **Secondary**: soft blue (`oklch(0.85 0.03 220)`) — for accents
- **Accent**: soft pink/salmon (`oklch(0.88 0.05 10)`) — for geometric accents
- **Destructive**: red (`oklch(0.55 0.22 25)`) — for errors and Holocaust badge
- **Cards**: pure white (`oklch(1 0 0)`)

Dark mode theme is defined but not currently active (ThemeProvider defaults to `"light"`).

### Key Client Components
- **AIChatBox**: Reusable chat UI with markdown rendering (Streamdown), auto-scroll, suggested prompts, user/assistant message bubbles
- **Map**: Google Maps integration via Forge proxy, supports markers/places/geocoding/geometry
- **DashboardLayout**: Resizable sidebar (200–480px, persisted to localStorage), mobile-responsive with SidebarTrigger header

## Notable Implementation Details

- **No CI/CD**: No GitHub Actions, Dockerfile, or `.env.example` in the repository
- **pnpm overrides**: `tailwindcss>nanoid` pinned to `3.3.7`
- **Wouter patch**: Custom patch applied via `pnpm.patchedDependencies`
- **Body parser**: 50 MB limit for file uploads (`server/_core/index.ts`)
- **Port fallback**: Server tries ports 3000–3019 sequentially if preferred port is busy
- **tRPC batching**: Client uses `httpBatchLink` — multiple concurrent queries are batched into a single HTTP request
- **SuperJSON**: Used as tRPC transformer to serialize Dates, Maps, Sets, BigInt across the wire
- **OAuth login URL**: Built dynamically at runtime in `client/src/const.ts` via `getLoginUrl()`, base64-encodes the redirect URI as state param

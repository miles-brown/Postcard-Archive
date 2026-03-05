# Development Guide

Setup instructions, workflows, and conventions for contributing to the Postcard Archive.

## Prerequisites

- **Node.js** (ESM-compatible, v18+)
- **pnpm** 10.4.1+ (pinned with SHA512 in `package.json`)
- **MySQL** database instance
- **Environment variables** configured (see below)

## Environment Setup

All env vars default to `""` if missing (no startup errors), but functionality will be broken without them.

| Variable | Required For | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Database | MySQL connection string |
| `JWT_SECRET` | Auth | Secret for signing JWT session tokens |
| `OAUTH_SERVER_URL` | Auth | Manus OAuth server endpoint |
| `VITE_APP_ID` | Auth | Application ID (exposed to client) |
| `VITE_OAUTH_PORTAL_URL` | Auth | OAuth login portal URL (exposed to client) |
| `OWNER_OPEN_ID` | Admin role | OAuth ID of the admin user |
| `BUILT_IN_FORGE_API_KEY` | LLM + Storage | Bearer token for Forge API |
| `BUILT_IN_FORGE_API_URL` | LLM + Storage | Forge API base URL |
| `PORT` | Server | Preferred port (default: 3000) |

**Note**: `VITE_`-prefixed variables are accessible in client-side code.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | Build client (Vite → `dist/public`) + server (esbuild → `dist/index.js`) |
| `pnpm start` | Run production server from `dist/` |
| `pnpm check` | TypeScript type-check (`tsc --noEmit`) |
| `pnpm format` | Format all files with Prettier |
| `pnpm test` | Run Vitest tests (server-side only) |
| `pnpm db:push` | Generate + apply Drizzle migrations |

### Development Server

```bash
pnpm dev
```

- Runs `NODE_ENV=development tsx watch server/_core/index.ts`
- Vite dev middleware serves the React client with HMR
- Server tries ports 3000-3019 sequentially if preferred port is busy
- Body parser set to 50 MB limit for file uploads
- tRPC API at `/api/trpc`, OAuth callback at `/api/oauth/callback`

### Production Build

```bash
pnpm build && pnpm start
```

- Vite builds client to `dist/public/` (SPA with `index.html`)
- esbuild bundles server to `dist/index.js` (ESM, external node_modules)
- Production server serves static files from `dist/public/`

## Testing

```bash
pnpm test
```

- **Framework**: Vitest with `node` environment
- **Test location**: `server/**/*.test.ts` and `server/**/*.spec.ts`
- **Test files**:
  - `server/auth.logout.test.ts` — cookie clearing, cookie options validation
  - `server/postcards.test.ts` — CRUD operations, tRPC procedures, filtering, access control

### Writing Tests

```typescript
// server/example.test.ts
import { describe, it, expect } from "vitest";

describe("feature", () => {
  it("should work", () => {
    expect(true).toBe(true);
  });
});
```

Tests run in Node environment with the same path aliases (`@/*`, `@shared/*`, `@assets/*`) as the main app.

## Code Style

### Prettier Configuration

Run `pnpm format` before committing. Key settings:

| Setting | Value |
|---------|-------|
| Semicolons | Required |
| Quotes | Double quotes (`"`) |
| Print width | 80 characters |
| Indentation | 2 spaces |
| Trailing commas | ES5 |
| Arrow parens | Avoid when possible |
| End of line | LF |
| Bracket spacing | Yes |

### TypeScript

- Strict mode enabled
- Module: ESNext with bundler resolution
- Use Zod for all tRPC input validation
- Types from database: `$inferSelect` / `$inferInsert` (not manual interfaces)
- Import shared types: `import { User } from "@shared/types"`

## Architecture Rules

### Backend

1. **All DB queries in `server/db.ts`** — never write raw Drizzle queries in routers
2. **Business logic in services** — `scraperService.ts`, `transcriptionService.ts`
3. **tRPC procedures in `server/routers.ts`** — validation + auth + delegation
4. **LLM calls through `server/_core/llm.ts`** — never call Forge API directly
5. **Storage through `server/storage.ts`** — never call S3 API directly

### Frontend

1. **shadcn/ui for all UI primitives** — use `components/ui/` components, don't create custom primitives
2. **`cn()` for class merging** — never manually concatenate Tailwind classes
3. **Sonner for toasts** — `toast()` / `toast.error()` for user feedback
4. **tRPC for all API calls** — never use `fetch` directly for backend communication
5. **Lucide React for icons** — consistent sizing with `w-4 h-4` or `w-5 h-5`

## Adding a New tRPC Procedure

1. Add the query function to `server/db.ts` (if DB access needed)
2. Add the procedure to the appropriate router in `server/routers.ts`
3. Use the correct procedure level (`publicProcedure`, `protectedProcedure`, `adminProcedure`)
4. Add Zod input validation
5. Call from client via `trpc.router.procedure.useQuery()` or `useMutation()`

```typescript
// server/routers.ts
myNewProcedure: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return await db.getMyThing(input.id);
  }),

// client usage
const { data } = trpc.myRouter.myNewProcedure.useQuery({ id: 123 });
```

## Adding a shadcn/ui Component

The project uses shadcn/ui with New York style, neutral base color, CSS variables, and no prefix. Components are stored in `client/src/components/ui/`.

## Database Migrations

When modifying `drizzle/schema.ts`:

1. Edit the schema in `drizzle/schema.ts`
2. Run `pnpm db:push` to generate and apply migration
3. Migration SQL files are created in `drizzle/` directory
4. Metadata updated in `drizzle/meta/`

## Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:

| Alias | Resolves To | Usage |
|-------|------------|-------|
| `@/*` | `./client/src/*` | Client imports |
| `@shared/*` | `./shared/*` | Shared code (client + server) |
| `@assets/*` | `./attached_assets/*` | Static asset imports |

## Known Quirks

- **Wouter patch**: A custom patch (`patches/wouter@3.7.1.patch`) adds route tracking via `window.__WOUTER_ROUTES__`. Applied automatically by pnpm.
- **pnpm override**: `tailwindcss>nanoid` pinned to `3.3.7` to avoid compatibility issues.
- **No CI/CD**: No GitHub Actions, Dockerfile, or `.env.example` exists.
- **No pagination**: Gallery loads all matching postcards; filtering is server-side.
- **No foreign keys**: Entity relations are implicit (column naming); no cascade deletes.
- **No explicit connection pool**: Database uses a single Drizzle connection (lazy-initialized singleton).

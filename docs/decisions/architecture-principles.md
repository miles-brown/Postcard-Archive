# Architectural Design Principles

*Status: Active*

This document outlines the high-level tenets of the project's engineering culture. All pull requests and feature expansions must adhere to these foundational principles.

## 1. End-to-End Type Safety

We rely exclusively on TypeScript.

- **No `any` types**: Explicitly define interfaces or use localized `unknown` combined with type-guards.
- **tRPC over REST**: We utilize tRPC to natively share parameter schemas and return types between the client and the Express backend.
- **Drizzle Inferred Types**: Database types must not be duplicated manually. Use Drizzle's `$inferSelect` and `$inferInsert` from the schema file, exporting them globally from `@shared/types.ts`.

## 2. Server-Authoritative Logic

The client-side React code is dumb and purely representational.

- **No direct business logic in the client**: The client must not contain complex filtering, deduplication, or search logic for massive datasets. These must be performed on the backend to avoid payload bloat.
- **Validation**: All inputs must be strictly validated server-side using `zod` before any database queries execute.

## 3. Minimal Client Dependencies

To preserve extreme performance and minimal bundle sizes:

- Avoid giant NPM dependencies for minor tasks (e.g., use native `Intl.DateTimeFormat` instead of `moment.js` if feasible, though `date-fns` is our currently approved utility).
- Avoid monolithic state managers like Redux or Zustand. The project relies strictly on TanStack React Query (`useQuery`, `useMutation`) for caching and remote state, and React context for UI configuration (like Themes).

## 4. Uninterrupted Fallbacks Layering

The infrastructure relies on somewhat volatile LLM and scraping workflows.

- **Fault Tolerance**: If the LLM transcription fails on a single item in a loop of 10, the loop *must* catch the error, flag the db status of that single item as `failed`, and process the remaining 9 items without exploding the worker queue.
- **Safe Degradation**: If the database connection drops entirely, the API should return empty arrays and graceful HTTP 500/503 errors, and the client UI should degrade gracefully using Error Boundaries rather than crashing to a white screen.

## 5. Security & Principle of Least Privilege

- Only explicit `adminProcedure` tRPC endpoints can alter dataset visibility, trigger scrapers, or modify transcriptions.
- API endpoints strictly check the requester's `openId` against the JWT cookie before allowing any transactional operations.

# Database Guide

MySQL database managed via Drizzle ORM. Schema defined in `drizzle/schema.ts`, all queries in `server/db.ts`.

## Setup & Migrations

```bash
# Generate and apply migrations
pnpm db:push    # runs: drizzle-kit generate && drizzle-kit migrate
```

**Config** (`drizzle.config.ts`):
- Dialect: `mysql`
- Schema: `./drizzle/schema.ts`
- Migrations output: `./drizzle/`
- Connection: `DATABASE_URL` env var

## Connection Management

```typescript
// server/db.ts
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}
```

- Lazy initialization on first use
- Global singleton (cached across requests)
- Returns `null` if `DATABASE_URL` is not set
- No explicit connection pool configuration
- Write operations throw `"Database not available"` when `_db` is null
- Read operations return empty arrays or `undefined` when unavailable

## Schema

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `int` | PK, auto-increment |
| `openId` | `varchar(64)` | NOT NULL, UNIQUE |
| `name` | `text` | nullable |
| `email` | `varchar(320)` | nullable |
| `loginMethod` | `varchar(64)` | nullable |
| `role` | `enum("user", "admin")` | NOT NULL, default `"user"` |
| `createdAt` | `timestamp` | NOT NULL, default NOW |
| `updatedAt` | `timestamp` | NOT NULL, default NOW, auto-update |
| `lastSignedIn` | `timestamp` | NOT NULL, default NOW |

**Notes**: `role` is auto-set to `"admin"` during upsert when `openId === ENV.ownerOpenId`.

### `postcards`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `int` | PK, auto-increment |
| `ebayUrl` | `text` | NOT NULL |
| `ebayId` | `varchar(255)` | nullable |
| `title` | `text` | NOT NULL |
| `price` | `varchar(50)` | nullable |
| `seller` | `varchar(255)` | nullable |
| `description` | `text` | nullable |
| `warPeriod` | `enum("WWI", "WWII", "Holocaust")` | NOT NULL |
| `dateFound` | `timestamp` | NOT NULL, default NOW |
| `transcriptionStatus` | `enum("pending", "processing", "completed", "failed")` | NOT NULL, default `"pending"` |
| `isPublic` | `boolean` | NOT NULL, default `true` |
| `createdAt` | `timestamp` | NOT NULL, default NOW |
| `updatedAt` | `timestamp` | NOT NULL, default NOW, auto-update |

**Indexes**: `ebayId`, `warPeriod`, `transcriptionStatus`

### `postcardImages`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `int` | PK, auto-increment |
| `postcardId` | `int` | NOT NULL |
| `s3Key` | `text` | NOT NULL |
| `s3Url` | `text` | NOT NULL |
| `originalUrl` | `text` | nullable |
| `isPrimary` | `boolean` | NOT NULL, default `false` |
| `width` | `int` | nullable |
| `height` | `int` | nullable |
| `createdAt` | `timestamp` | NOT NULL, default NOW |

**Indexes**: `postcardId`

**Notes**: `width` and `height` are defined but not populated by the scraper. `originalUrl` stores the eBay source URL before S3 upload.

### `transcriptions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `int` | PK, auto-increment |
| `postcardId` | `int` | NOT NULL |
| `imageId` | `int` | nullable |
| `transcribedText` | `text` | NOT NULL |
| `confidence` | `varchar(50)` | nullable |
| `language` | `varchar(10)` | nullable |
| `createdAt` | `timestamp` | NOT NULL, default NOW |
| `updatedAt` | `timestamp` | NOT NULL, default NOW, auto-update |

**Indexes**: `postcardId`

**Notes**: `confidence` stored as string (e.g. `"85%"`). `language` is a 2-letter code (`"en"`, `"de"`, `"fr"`). Each image gets its own transcription record.

### `scrapingLogs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `int` | PK, auto-increment |
| `status` | `enum("started", "completed", "failed")` | NOT NULL |
| `searchQuery` | `text` | nullable |
| `itemsFound` | `int` | default `0` |
| `itemsAdded` | `int` | default `0` |
| `errorMessage` | `text` | nullable |
| `startedAt` | `timestamp` | NOT NULL, default NOW |
| `completedAt` | `timestamp` | nullable |

**Indexes**: `status`, `startedAt`

## Entity Relationships

```
users (standalone)

postcards ──< postcardImages    (1:N via postcardId)
postcards ──< transcriptions    (1:N via postcardId)
postcardImages ──< transcriptions  (1:N via imageId, nullable)

scrapingLogs (standalone, linked conceptually to search queries)
```

**Note**: `drizzle/relations.ts` is empty. Relations are implicit via column naming. No foreign key constraints are enforced at the database level.

## Query Functions (`server/db.ts`)

### Users

| Function | Returns | On DB Unavailable |
|----------|---------|-------------------|
| `upsertUser(user)` | `void` | Warns and returns |
| `getUserByOpenId(openId)` | `User \| undefined` | Returns `undefined` |

### Postcards

| Function | Returns | On DB Unavailable |
|----------|---------|-------------------|
| `createPostcard(postcard)` | `insertId: number` | Throws |
| `getPostcardByEbayId(ebayId)` | `Postcard \| undefined` | Returns `undefined` |
| `getAllPostcards(filters?)` | `Postcard[]` | Returns `[]` |
| `getPostcardById(id)` | `Postcard \| undefined` | Returns `undefined` |
| `updatePostcard(id, updates)` | `void` | Throws |
| `deletePostcard(id)` | `void` | Throws |

**`getAllPostcards` filter logic**:
- `isPublic`: exact boolean match
- `warPeriod`: exact enum match
- `searchQuery`: `title LIKE %q%` OR `description LIKE %q%`
- Multiple filters are ANDed
- Always ordered by `dateFound DESC`

### Images

| Function | Returns | On DB Unavailable |
|----------|---------|-------------------|
| `createPostcardImage(image)` | `insertId: number` | Throws |
| `getPostcardImages(postcardId)` | `PostcardImage[]` | Returns `[]` |
| `getPrimaryImage(postcardId)` | `PostcardImage \| undefined` | Returns `undefined` |

### Transcriptions

| Function | Returns | On DB Unavailable |
|----------|---------|-------------------|
| `createTranscription(transcription)` | `insertId: number` | Throws |
| `getPostcardTranscriptions(postcardId)` | `Transcription[]` | Returns `[]` |
| `searchPostcardsByTranscription(query)` | `Postcard[]` | Returns `[]` |

**`searchPostcardsByTranscription`**: Inner joins postcards with transcriptions, filters `isPublic = true` AND `transcribedText LIKE %query%`, deduplicates by postcard ID.

### Scraping Logs

| Function | Returns | On DB Unavailable |
|----------|---------|-------------------|
| `createScrapingLog(log)` | `insertId: number` | Throws |
| `updateScrapingLog(id, updates)` | `void` | Throws |
| `getRecentScrapingLogs(limit=50)` | `ScrapingLog[]` | Returns `[]` |
| `getPostcardsNeedingTranscription()` | `Postcard[]` (max 10) | Returns `[]` |

## Types

All types exported from `shared/types.ts` (re-exports from `drizzle/schema.ts`):

```typescript
// Select types (for reading)
type User = typeof users.$inferSelect;
type Postcard = typeof postcards.$inferSelect;
type PostcardImage = typeof postcardImages.$inferSelect;
type Transcription = typeof transcriptions.$inferSelect;
type ScrapingLog = typeof scrapingLogs.$inferSelect;

// Insert types (for writing)
type InsertUser = typeof users.$inferInsert;
type InsertPostcard = typeof postcards.$inferInsert;
type InsertPostcardImage = typeof postcardImages.$inferInsert;
type InsertTranscription = typeof transcriptions.$inferInsert;
type InsertScrapingLog = typeof scrapingLogs.$inferInsert;
```

Import via: `import { User, InsertPostcard } from "@shared/types";`

## Important Conventions

1. **Never write raw queries in routers** — always use `server/db.ts` functions
2. **Write operations throw** when DB is unavailable; read operations return empty/undefined
3. **No cascade deletes** — deleting a postcard does not automatically remove its images or transcriptions
4. **`upsertUser` uses MySQL `ON DUPLICATE KEY UPDATE`** on the `openId` unique index
5. **Transcription search is case-insensitive** via MySQL's default collation with LIKE

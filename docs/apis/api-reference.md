# API Reference

Complete reference for the tRPC API exposed at `/api/trpc`.

## Procedure Levels

| Level | Middleware | Access |
|-------|-----------|--------|
| `publicProcedure` | None | Anyone, `ctx.user` may be `null` |
| `protectedProcedure` | Throws `UNAUTHORIZED` if no user | Authenticated users |
| `adminProcedure` | Throws `FORBIDDEN` if not admin | Users with `role === "admin"` |

---

## `auth.me` (public, query)

Returns the current authenticated user or `null`.

**Input**: none
**Output**: `User | null`

---

## `auth.logout` (public, mutation)

Clears the session cookie.

**Input**: none
**Output**: `{ success: true }`

**Side effects**: Clears `app_session_id` cookie with `maxAge: -1`.

---

## `postcards.list` (public, query)

Lists public postcards with optional filters. Each postcard includes its primary image.

**Input** (optional):
```typescript
{
  warPeriod?: "WWI" | "WWII" | "Holocaust";
  searchQuery?: string;  // LIKE match on title OR description
}
```

**Output**: `Array<Postcard & { primaryImage: PostcardImage | undefined }>`

**Behavior**:
- Always filters `isPublic = true`
- `searchQuery` uses OR across title and description with `%query%`
- `warPeriod` is an exact match
- Multiple filters are ANDed
- Ordered by `dateFound` descending

---

## `postcards.getById` (public, query)

Returns a single postcard with all its images and transcriptions.

**Input**:
```typescript
{ id: number }
```

**Output**: `Postcard & { images: PostcardImage[]; transcriptions: Transcription[] }`

**Errors**:
- `NOT_FOUND` — postcard does not exist
- `FORBIDDEN` — postcard exists but `isPublic = false`

---

## `postcards.searchByTranscription` (public, query)

Searches for postcards whose transcription text contains the query.

**Input**:
```typescript
{ query: string }  // min length: 1
```

**Output**: `Array<Postcard & { primaryImage: PostcardImage | undefined }>`

**Behavior**:
- Inner joins `postcards` with `transcriptions`
- Filters `isPublic = true` AND `transcribedText LIKE %query%`
- Deduplicates by postcard ID (a postcard may have multiple matching transcriptions)
- Ordered by `dateFound` descending

---

## `admin.scraper.run` (admin, mutation)

Triggers the eBay scraping pipeline.

**Input** (optional):
```typescript
{ warPeriod?: "WWI" | "WWII" | "Holocaust" }
```

**Output**:
```typescript
{ itemsFound: number; itemsAdded: number }
```

**Behavior**:
- If `warPeriod` is given, scrapes only that period's queries
- If omitted, scrapes all three periods sequentially
- Creates a `scrapingLog` record per search query
- Rate-limited: 3-second delay between individual listing scrapes

---

## `admin.scraper.logs` (admin, query)

Returns recent scraping log entries.

**Input** (optional):
```typescript
{ limit?: number }  // default: 50
```

**Output**: `ScrapingLog[]` — ordered by `startedAt` descending

---

## `admin.transcription.processAll` (admin, mutation)

Processes all pending transcriptions in batch.

**Input**: none
**Output**:
```typescript
{ processed: number; succeeded: number; failed: number }
```

**Behavior**:
- Fetches up to 10 postcards with `transcriptionStatus = "pending"`
- For each: marks as `"processing"`, transcribes all images, marks as `"completed"` or `"failed"`
- Rate-limited: 1-second delay between LLM API calls

---

## `admin.transcription.processOne` (admin, mutation)

Transcribes a single postcard by ID.

**Input**:
```typescript
{ postcardId: number }
```

**Output**: `{ success: boolean }`

---

## `admin.postcards.listAll` (admin, query)

Lists all postcards including hidden ones (no `isPublic` filter).

**Input** (optional):
```typescript
{
  warPeriod?: "WWI" | "WWII" | "Holocaust";
  searchQuery?: string;
}
```

**Output**: `Array<Postcard & { primaryImage: PostcardImage | undefined }>`

---

## `admin.postcards.update` (admin, mutation)

Partially updates a postcard's metadata.

**Input**:
```typescript
{
  id: number;
  isPublic?: boolean;
  title?: string;
  description?: string;
  warPeriod?: "WWI" | "WWII" | "Holocaust";
}
```

**Output**: `{ success: true }`

---

## `admin.postcards.delete` (admin, mutation)

Deletes a postcard by ID.

**Input**:
```typescript
{ id: number }
```

**Output**: `{ success: true }`

**Note**: Does not cascade-delete images or transcriptions at the application level; relies on database constraints or manual cleanup.

---

## `system.health` (public, query)

Health check endpoint.

**Output**: `{ status: "ok" }`

---

## `system.notifyOwner` (admin, mutation)

Sends a notification to the application owner.

**Input**:
```typescript
{ title: string; content: string }
```

**Constraints**: Title max 1200 chars, content max 20000 chars.

---

## OAuth Callback (non-tRPC)

`GET /api/oauth/callback?code=<code>&state=<state>`

This is a standard Express route (not tRPC). It:
1. Exchanges `code` for an access token via the Manus OAuth server
2. Fetches user info with the access token
3. Upserts the user in the database
4. Creates a JWT session token (HS256, 1 year TTL)
5. Sets `app_session_id` HttpOnly cookie
6. Redirects to `/` with 302

**Errors**: Returns 400 if `code` or `state` are missing; 500 on OAuth failure.

---

## Client-Side Error Handling

The tRPC client (`client/src/main.tsx`) subscribes to both query and mutation caches. When any error matches `UNAUTHED_ERR_MSG` ("Please login (10001)"), the client automatically redirects to the OAuth login URL. All errors are also logged to `console.error` with `[API Query Error]` or `[API Mutation Error]` prefixes.

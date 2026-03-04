# Scraping & Transcription Pipelines

Detailed documentation of the data collection and AI transcription workflows.

## Scraping Pipeline

### Overview

```
Admin trigger (or scheduled task)
  │
  ▼
For each war period (WWI, WWII, Holocaust):
  For each search query (5-6 per period):
    │
    ├── Create scrapingLog (status: "started")
    ├── Firecrawl MCP → eBay search results page
    ├── Parse markdown for eBay item URLs
    ├── Limit to 15 listings per query
    │
    └── For each listing:
          ├── Check duplicate (in-memory Set + DB lookup)
          ├── Firecrawl MCP → individual listing page
          ├── Extract: title, price, seller, description, image URLs
          ├── Create postcard record (transcriptionStatus: "pending")
          ├── Download first 5 images → upload to S3
          ├── Create postcardImage records (first = isPrimary)
          └── Wait 3 seconds (rate limit)
    │
    └── Update scrapingLog (status: "completed" or "failed")
```

### Entry Points

| Function | Location | Description |
|----------|----------|-------------|
| `scrapeEbayPostcards(warPeriod?)` | `server/scraperService.ts` | Main scraper, called by tRPC or scheduled tasks |
| `admin.scraper.run` | `server/routers.ts` | tRPC mutation (admin only) |
| `runScheduledScrape()` | `server/scheduledTasks.ts` | Scheduled job wrapper |
| `run-scraper.mjs` | root | Manual CLI script |

### MCP Integration

The scraper uses Firecrawl MCP via `manus-mcp-cli`:

```bash
manus-mcp-cli tool call firecrawl_scrape --server firecrawl --input '<json>'
```

- Runs synchronously via `child_process.execSync()`
- 10 MB max buffer for output
- JSON output is located by scanning for the first line starting with `{`
- Supports `markdown` and `html` output formats

### eBay URL Construction

```
https://www.ebay.com/sch/i.html?_nkw={encoded_query}&_sop=10
```

- `_nkw`: URL-encoded search query
- `_sop=10`: Sort by newly listed

### Listing Detail Extraction

From individual listing pages (scraped as markdown + HTML):

| Field | Extraction Method |
|-------|-------------------|
| Title | First `# heading` in markdown or `<h1>` in HTML |
| Price | First `$X,XXX.XX` pattern match |
| Seller | HTML pattern: `seller[^>]*>([^<]+)` |
| Description | First 2000 chars of markdown |
| Images | `https://i.ebayimg.com/images/...` URLs from HTML |

### Image Processing

1. Raw URLs extracted from HTML via regex
2. Converted to max resolution: `s-l140` / `s-l500` → `s-l1600`
3. Deduplicated via `Set<string>`
4. Limited to first 5 images per postcard
5. Downloaded via `fetch()`, content type from response headers (fallback: `image/jpeg`)
6. Uploaded to S3 with key: `postcards/{postcardId}/{nanoid()}.{extension}`
7. First image marked `isPrimary: true`

### Duplicate Prevention

Three layers:
1. **In-memory Set**: Tracks eBay IDs seen within the current scrape run
2. **Database check**: `getPostcardByEbayId()` before creating a record
3. **Image dedup**: `Set<string>` on image URLs before download

### Error Recovery

- Individual listing failures are caught and logged; the batch continues
- Each search query gets its own `scrapingLog` record with status tracking
- Failed queries record `errorMessage` in the log
- The entire pipeline never throws to the caller — always returns `{ itemsFound, itemsAdded }`

---

## Transcription Pipeline

### Overview

```
Admin trigger (or scheduled task)
  │
  ▼
Get up to 10 postcards with transcriptionStatus = "pending"
  │
  For each postcard:
    ├── Update status → "processing"
    ├── Get all images from postcardImages table
    │
    └── For each image:
          ├── Send image URL to Gemini 2.5 Flash (vision, detail: "high")
          ├── Receive transcribed text
          ├── Calculate confidence score
          ├── Detect language (regex heuristics)
          ├── Create transcription record
          └── Wait 1 second (rate limit)
    │
    ├── If any image succeeded → status = "completed"
    └── If all images failed → status = "failed"
```

### Entry Points

| Function | Location | Description |
|----------|----------|-------------|
| `processTranscriptions()` | `server/transcriptionService.ts` | Batch processor (up to 10) |
| `transcribePostcardById(id)` | `server/transcriptionService.ts` | Single postcard |
| `admin.transcription.processAll` | `server/routers.ts` | tRPC mutation |
| `admin.transcription.processOne` | `server/routers.ts` | tRPC mutation |
| `runScheduledTranscription()` | `server/scheduledTasks.ts` | Scheduled job wrapper |
| `run-transcription.mjs` | root | Manual CLI script |

### LLM Configuration

- **Model**: Gemini 2.5 Flash (via Forge API)
- **Image detail**: `high` (for handwriting clarity)
- **Max tokens**: 32768
- **System prompt**: Expert historical handwriting transcription with `[illegible]` markers
- **User prompt**: Requests all handwritten text including dates, addresses, signatures

### Confidence Scoring

```
confidence = ((totalWords - illegibleMarkerCount) / totalWords) * 100
```

- Counts occurrences of `[illegible]` in the transcribed text (case-insensitive)
- Stored as a string like `"85%"`
- 0% if text is empty

### Language Detection

Simple regex heuristics (not ML-based):

| Language | Code | Detection Pattern |
|----------|------|-------------------|
| German | `de` | `/[äöüß]/i` |
| French | `fr` | `/[àâçéèêëîïôùûü]/i` |
| English | `en` | Default fallback |

Runs on transcribed output text, tested in order (German checked first).

### State Machine

```
pending ──(start)──▶ processing ──(success)──▶ completed
                         │
                         └──(all fail)──▶ failed
```

- A postcard is marked `completed` if **any** image transcription succeeds
- A postcard is marked `failed` only if **all** image transcriptions fail
- No images found → immediate `failed`

### Return Value (`processTranscriptions`)

```typescript
{ processed: number; succeeded: number; failed: number }
```

---

## Scheduled Tasks (`server/scheduledTasks.ts`)

Three exported functions for external scheduling:

| Function | Pipeline |
|----------|----------|
| `runScheduledScrapeAndTranscribe()` | Scrape, then transcribe sequentially |
| `runScheduledScrape()` | Scraping only |
| `runScheduledTranscription()` | Transcription only |

### Manual Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `run-scraper.mjs` | `node run-scraper.mjs` | Scrape + transcribe (only transcribes if items were added) |
| `run-transcription.mjs` | `node run-transcription.mjs` | Transcribe pending postcards only |
| `check-progress.mjs` | `node check-progress.mjs` | Print stats by war period and transcription status |

### Rate Limits Summary

| Operation | Delay | Rationale |
|-----------|-------|-----------|
| eBay listing scrape | 3 seconds | Avoid eBay rate limiting |
| LLM transcription call | 1 second | Avoid Forge API throttling |

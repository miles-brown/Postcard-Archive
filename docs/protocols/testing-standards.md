# Testing Standards

*Status: Active*

This document dictates the rules regarding testing, Vitest assertions, mocking databases, testing the OCR pipeline without incurring API costs, and future E2E requirements.

## Vitest (Backend Testing)

The project uses `vitest` for localized server-side function validation.

- **Location**: Test files must live right alongside their source files, suffixed with `.test.ts` (e.g. `server/postcards.test.ts`).
- **Execution**: Run tests using `pnpm test`.

### Mocking External APIs

**CRITICAL RULE**: Do not charge the project owner money during standard CI testing.

1. **Gemini Vision (Forge API)**: The `invokeLLM` function must be entirely mocked during testing so tokens are never drawn. Mock responses should simulate successful transcribed strings with varying `[illegible]` tags to test confidence score calculations.
2. **AWS S3 / Storage**: S3 `storagePut` calls must be stubbed to return immediate mock `{ key, url }` pairs instead of performing network uploads.

### Database Testing

1. Mock the DB outputs where possible to avoid the overhead of a dedicated test database container.
2. If e2e schema validation is required, use a completely isolated local SQLite mock or dedicated test MySQL bench rather than the Neon Railway connection string.

## UI / E2E Testing (Phase 2 Roadmap)

Though not currently implemented, future Playwright or Cypress workflows must adhere to:

- **No live scraping**: The eBay Firecrawl MCP must be stubbed. We cannot risk getting flagged by eBay simply because a Playwright script runs 10 times a day on GitHub Actions.
- **Visual Assertions**: Because this is an archive, visual regression tests on the main gallery grid displaying the WWI/WWII tag layout are required.

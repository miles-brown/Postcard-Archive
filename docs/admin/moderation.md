# Content Moderation & Curation

*Status: Active*

This document outlines the protocols for manually reviewing LLM transcriptions, correcting OCR errors, and deleting inappropriate or irrelevant postcards from the archive.

## Postcard Verification

eBay is a public marketplace where categorization is inherently flawed. Sellers frequently miscategorize non-historical artifacts as military mail.

As an Admin, use the **Dashboard -> Listing Management** table to randomly audit incoming cron job additions.
If a postcard is imported but does not meet historical criteria:

1. Click the edit module on the listing.
2. Flag `isPublic` to `false` first to immediately remove it from the home page grid.
3. If confirmed completely irrelevant (e.g., a modern birthday card), trigger the `admin.postcards.delete` tRPC endpoint to purge it—and its S3 image references—from storage.

## Transcription Review Protocol (Phase 2 Workflow)

AI-driven handwriting models (Gemini Flash) are not flawless, especially regarding looping WWII cursive or degraded ink.

1. **Dashboard Triage**: Transcriptions returning a confidence score under `60%` should be flagged automatically for review inside the Dashboard interface.
2. **Side-by-side Review**: The interface will present the high-resolution `isPrimary: true` image next to the raw LLM text.
3. **Illegible Markers**: Locate `[illegible]` tags. If the reviewer can decipher the word through context clues, manually replace the tag with the plaintext word.
4. **Approval**: Upon pressing "Approve Edit", the system must overwrite the transcription text in the DB and reset the confidence score metric to `100% (Manual Override)`.

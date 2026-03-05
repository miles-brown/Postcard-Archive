# External Integrations Reference

*Status: Active*

This document aggregates operational knowledge regarding third-party services that the Postcard Archive relies on for scraping, AI, and storage.

## Firecrawl (via MCP)

We rely on Firecrawl to bypass eBay's robust anti-bot protections.

- **Provider**: Internal `manus-mcp-cli` running on the host OS natively.
- **Timeout**: Because Firecrawl requests require massive DOM evaluation, they can take up to 20 seconds to return per URL. The backend must not aggressively timeout these connections.
- **Format**: Firecrawl returns both `HTML` (ideal for scraping image nodes) and `Markdown` (ideal for isolating raw text, prices, and titles). Both should be requested in the parameters.

## Gemini 2.5 Flash Vision (via Forge API)

The engine driving the handwriting transcription.

- **Endpoint**: `https://{BUILT_IN_FORGE_API_URL}/v1/chat/completions`
- **Max Tokens**: 32768
- **Image Detail Loading**: When passing an S3 `image_url` to the array, the system **must** attach `detail: "high"`. Failing to do this causes Gemini to ingest the image at a low resolution, rendering nearly all cursive unreadable and resulting in `[illegible]` spam.

## AWS S3 (via Forge API Proxy)

Used entirely for bulk bucket storage of the high-res eBay imagery.

- **Provider**: Proxied through `storageGet` and `storagePut` helpers in `server/storage.ts`.
- **Naming Scheme**: All images uploaded must follow the structure `postcards/{postcardId}/{nanoid()}.{extension}` to absolutely guarantee collision avoidance regardless of how common the eBay image name originally was.

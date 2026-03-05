# Crawling & Scraping Methodology

This document details the crawling mechanics, frequency limits, and logic used to scrape historical postcards from eBay via Firecrawl.

## Search Entry Points (Seeds)

The archive uses **Firecrawl** (integrated via an MCP Client script) to programmatically scrape eBay listings.

- The system executes search queries (refer to `keywords.md`) directly against `ebay.com/sch/i.html`.
- The URLs are appended with `_sop=10` to sort strictly by "Newly Listed". This continuously captures fresh inventory without rescraping old items.

## Crawl Limits & Politeness

To respect eBay's infrastructure and avoid aggressive rate-limiting or IP bans, the scraper limits itself heavily:

### Max URL Fetch

Only the first **15 listings** per search query are explored. This strikes a balance between finding new material and keeping the batch job execution time reasonable.

### Politeness Delay

A hardcoded **3000ms** (3-second) timeout is enforced between individual listing requests. This prevents spikes in traffic that could trigger bot mitigation systems.

### Deduplication Ahead of Crawling

The database is instantly checked for an `ebayId` *before* the scraper navigates to the listing page. If the ID exists in the system, the scraper immediately skips that iteration to prevent wasted HTTP requests and redundant processing.

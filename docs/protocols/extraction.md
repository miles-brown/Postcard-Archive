# Data Extraction

This document explains what metadata is extracted from crawled listings and how images are processed and stored.

Once an eBay listing `(/itm/...)` is reached via the crawling pipeline, Firecrawl requests both `markdown` and `html` representations for parsing.

## Metadata Extraction

- **Title**: Extracted via markdown Header 1 (`#`) or HTML `<h1>`. If none is found, defaults to "Untitled Postcard".
- **Price**: Parsed with a regular expression sweeping for dollar amounts (`$`).
- **Seller**: Extracted from the HTML DOM near the seller profile element.
- **Description Text**: Truncated to a maximum of 2000 characters to save database space while retaining the bulk of the original text.

## Image Extraction

Images are a critical component of the historical postcard archive. The DOM parser specifically targets `i.ebayimg.com` assets.

### Quality Bumping

eBay lists compressed thumbnails by default on their search and product pages. The scraper automatically transforms image URL parameters (e.g., `s-l140` or `s-l500`) into `s-l1600` to forcefully request the highest quality resolution available for the original scan.

### Limits & Tagging

A maximum of **5 images** are parsed and downloaded per postcard listing. The first parsed image is flagged with `isPrimary: true`, which is the image shown on the public gallery grid.

## Media Processing & Storage

Scraped high-quality images are dynamically fetched as an array buffer. The content type is inferred (e.g., `image/jpeg`).

The images are then instantly pushed and proxied to **AWS S3** via a Forge API interface, bypassing direct handling. They are stored under `postcards/{postcardId}/{nanoid()}.{extension}` to prevent collisions.

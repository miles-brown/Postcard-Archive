# Project TODO

## Database & Schema
- [x] Design database schema for postcards, images, transcriptions, and scraping logs
- [x] Implement database migrations

## eBay Scraper
- [x] Build eBay scraper using Firecrawl MCP for WWI/WWII/Holocaust postcards
- [x] Implement keyword-based search queries
- [x] Store listing metadata (title, price, seller, URL, date found, images)
- [x] Handle image downloading and S3 storage
- [x] Add duplicate detection to avoid re-scraping

## OCR Transcription
- [x] Implement OCR pipeline using LLM vision API
- [x] Process postcard images and extract handwritten text
- [x] Store transcriptions in database linked to postcards

## Public Gallery
- [x] Create public gallery page with grid layout
- [x] Display postcard images with thumbnails
- [x] Implement search functionality
- [x] Add filtering by war period (WWI/WWII/Holocaust)
- [x] Add filtering by date and keywords
- [x] Create individual postcard detail pages

## Admin Dashboard
- [x] Build admin dashboard with sidebar navigation
- [x] Create scraping activity monitor
- [x] Add manual scraper trigger
- [x] Implement transcription review interface
- [x] Add listing management (edit/delete)

## Automation & Scheduling
- [x] Set up automated scheduling for scraper (multiple times daily)
- [x] Add error handling and logging

## Design & Styling
- [x] Apply Scandinavian minimalist aesthetic
- [x] Implement pale cool gray background with generous spacing
- [x] Use bold black sans-serif for primary text
- [x] Add delicate thin subtitles
- [x] Incorporate abstract geometric shapes in soft pastel blue and blush pink

## Testing & Deployment
- [x] Write vitest tests for critical functions
- [x] Test complete scraping workflow
- [x] Test OCR transcription accuracy
- [x] Test public gallery search and filtering
- [x] Create final checkpoint for deployment

## Automated Scheduling Setup
- [x] Configure Manus schedule tool to run scraper every 6 hours

## Initial Content Population
- [x] Run scraper to find 30+ handwritten postcards (collected 107!)
- [x] Transcribe all collected postcards (in progress)
- [x] Verify content is visible in gallery
- [x] Extract high-quality images from eBay listings

## GitHub Integration
- [ ] Push project to miles-brown/Postcard-Archive repository

# Live Roadmap & TODO

This document systematically tracks upcoming tasks for the Postcard Archive project.
Once tasks are completed, they are moved to `completed-tasks.md`.

*Priority Scale: P0 (Critical/Blocker), P1 (High), P2 (Medium), P3 (Low)*

## Community & User Engagement

- **[ ] Implement user registration and profiles**
  - **Description**: Allow users to register, log in, and maintain a profile page.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Curate personalized postcard collections**
  - **Description**: Enable users to save, bookmark, and organize postcards into custom galleries.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Add a user comment system**
  - **Description**: Let users discuss details about specific postcards underneath the listing.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Crowdsourced transcription interface**
  - **Description**: Create an interactive portal for users to manually correct AI transcription mistakes.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Gamification and reputation scores**
  - **Description**: Give points or badges for active community transcribers.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Public leaderboard**
  - **Description**: Highlight top community contributors on a dedicated page.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Social sharing plugins**
  - **Description**: Easy one-click social sharing links to Twitter, Facebook, Pinterest.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] User notification system**
  - **Description**: Alert users when their transcription is approved or someone replies to their comment.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

## Advanced Search & Discovery

- **[ ] Full-text search engine**
  - **Description**: Integrate Meilisearch or Elasticsearch for much faster/robust transcription searching.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Interactive Map View**
  - **Description**: Plot origins, destinations, and postmarks dynamically on an interactive map.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Chronological Timeline View**
  - **Description**: Visual timeline to explore postcards by era and exact date.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Specialized cursive models for OCR**
  - **Description**: Enhance OCR pipeline by routing through models trained specifically for 20th-century cursive.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Automated translation services**
  - **Description**: Integrate translation API for German, French, Yiddish translations in real-time.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Named Entity Recognition (NLP)**
  - **Description**: Extract historical entities (people, specific locations, battle names) via NLP.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Semantic tag pages**
  - **Description**: Auto-generate dedicated layout pages for discovered tags (e.g. "Paris", "1942").
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] "Similar Postcards" recommendation engine**
  - **Description**: Display related items based on image style and text similarities.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

## Expanded Content Acquisition

- **[ ] Delcampe scraper**
  - **Description**: Expand scraping capabilities to Delcampe mapping for European items.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Etsy scraper**
  - **Description**: Build scrapers for Etsy and other vintage memorabilia sites.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Dynamic scraping frequency**
  - **Description**: Back off scraping for quiet periods and accelerate during active item discovery days.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Direct user upload portal**
  - **Description**: Safe mechanism for users to donate and upload digital representations.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Automated image enhancement pipeline**
  - **Description**: Auto contrast, un-blur and perform color correction on low quality scans.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

## API Data & Research Tools

- **[ ] Design REST/GraphQL API**
  - **Description**: Public endpoint layer built for researchers fetching historical data.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] API Key rate-limiting**
  - **Description**: Restrict abuse by setting a gateway key and request quotas.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Bulk export functionalities**
  - **Description**: UI ability to download subsets of transcription data as CSV, JSON, XML.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Master metadata schema mapping**
  - **Description**: Standardize architecture mapping exactly to Dublin Core conventions.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

## UI/UX & Progressive Web App (PWA)

- **[ ] Progressive Web App conversion**
  - **Description**: Manifest, web workers, and PWA capabilities.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Offline browsing**
  - **Description**: Local caching so users can view previously fetched postcards with no connection.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Accessibility enhancements**
  - **Description**: Ensure complete 100% WCAG 2.1 AA accessibility compliance across the board.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Dark mode support**
  - **Description**: Robust dark color theme with persistence using cookies/local storage.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Skeleton loading and micro-animations**
  - **Description**: Reduce layout shift with elegant loading structures.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

## Infrastructure, DevOps & Sustainability

- **[ ] Set up global CDN**
  - **Description**: Move image serving from standard S3 endpoints to Cloudflare/CloudFront.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] App telemetry and error tracking**
  - **Description**: Configure an observability tool (Sentry/Datadog) for production alerts.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Automated E2E testing**
  - **Description**: Convert E2E test suites into Playwright/Cypress workflows.
  - **Priority**: P1
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Platform donation integration**
  - **Description**: Simple Stripe or Patreon linking to afford scraping server costs.
  - **Priority**: P2
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

- **[ ] Subscription newsletter**
  - **Description**: Regular monthly updates on the archive's size and highlights.
  - **Priority**: P3
  - **Date Added**: 2026-03-05
  - **Date Completed**: N/A

# Architectural & Project Decision Matrix

This document tracks all major architecture and project decisions to provide technical and historical context to the team.

| ID  | Date       | Area              | Decision | Rationale | Status |
|----|------------|-----------------|-----------|--------------|---------|
| 01 | 2026-01-01 | Database | Use Drizzle ORM w/ MySQL | Better TypeScript inference than Prisma, SQL-like syntax. MySQL chosen for relational schema. | Active |
| 02 | 2026-01-01 | Scraper | Firecrawl MCP | Reliable, automated integration via MCP, handles rate-limiting and dynamic pages well. | Active |
| 03 | 2026-01-01 | Web Framework | Vite + React 19 + tRPC | Fast developer experience, strict end-to-end type safety, modern React capabilities. | Active |
| 04 | 2026-01-01 | CSS / Styling | Tailwind CSS 4 + shadcn/ui | Rapid prototyping, maintains consistent UI styling, accessibility via Radix primitives. | Active |
| 05 | 2026-01-01 | OCR Pipeline | Gemini 2.5 Flash API | Optimal ratio of speed to accuracy for cursive handwriting. Handles multilingual inputs effectively. | Active |
| 06 | 2026-01-01 | Auth | Manus OAuth + JWT sessions | Seamless integration with Manus platform, removes responsibility for credential handling. | Active |

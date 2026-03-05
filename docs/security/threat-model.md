# Threat Model

*Status: Active*

This document models the potential attack vectors against the application and their designed mitigations.

## 1. Malicious Image Ingestion & XSS

- **Vector**: A compromised eBay listing hosts a malware file disguised as an image (`malware.jpg`), leading to a stored payload when executed on the client-side.
- **Mitigation**: The scraper forces image fetches through array buffers, reading exactly the `content-type` header to prevent SVG script execution. All files are hosted on an isolated S3 bucket proxy with stripped execution rights, preventing execution context from reaching our domain.

## 2. Denial of Service via Scraping Triggers

- **Vector**: A malicious actor spams the `admin.scraper.run` endpoint, overloading the server's Node worker queue and generating thousands of dollars in Firecrawl/Gemini API fees.
- **Mitigation**: The system utilizes rigid tRPC middleware (`adminProcedure`) which prevents execution from anyone without a verified OAuth JWT cookie attached to a database user with `role: "admin"`.

## 3. Parameter Fuzzing & SQL Injections

- **Vector**: Attempting to alter search queries or pagination constraints with SQL injection payloads to extract user database rows.
- **Mitigation**: The server *strictly* implements `zod` input validation on all tRPC routes. If `postcards.list` expects an enum of `WWI | WWII | Holocaust`, injecting `' OR 1=1;--` immediately throws a `BAD_REQUEST` error at the boundary layer before the system even touches Drizzle ORM. Furthermore, Drizzle natively parameterizes all standard SQL inputs.

## 4. Stolen OAuth Credentials

- **Vector**: A user gets their device stolen while a valid JWT cookie is alive.
- **Mitigation**: The application relies exclusively on the Manus OAuth provider and requires no custom credential storage. Because the JWT token hash (`JWT_SECRET`) is stored locally on the server `.env`, administrators can forcibly roll it out, instantly destroying every active token and logging everyone across the platform out safely.

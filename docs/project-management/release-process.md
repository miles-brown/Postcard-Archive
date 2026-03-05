# Release & Deployment Process

*Status: Active*

This document serves as a checklist detailing the CI/CD pipeline, environment variable synchronization, and the deployment steps for staging and production environments.

## Pre-Release Checklist

Before merging `main` into a production branch or triggering a redeploy, ensure:

- [ ] You have run `pnpm build` locally and it resolved without TypeScript errors.
- [ ] You have verified that any changes to `drizzle/schema.ts` have already been pushed via `pnpm db:push` to the live production database.
- [ ] If new `.env` variables were added locally, they have been manually injected into the hosting provider's "Environment Variables" dashboard.

## Deployment Pipeline

Currently, the project leverages Vercel/Railway for hosting.

1. **Frontend (Vercel)**: Pushing to the `main` branch automatically triggers a Vercel build of the `client/` directory. Vercel utilizes `vite build` based on our configuration file.
2. **Backend (Railway/Render)**: The server relies on an Express instance and runs the `server/index.ts` file. Ensure the start script reads `npm run start` which compiles `esbuild` before initializing node.

## Post-Deployment Verification

1. **Check the Admin Dashboard**: Log in and ensure data is being retrieved successfully (confirming `DATABASE_URL` is healthy).
2. **Trigger a Scrape**: Kick off a small manual scrape of WWI postcards. Ensure Firecrawl works (confirming the proxy connection).
3. **Verify OCR**: Check the cron queue to ensure new cards have flipped from `pending` to `completed` (confirming Forge integration).

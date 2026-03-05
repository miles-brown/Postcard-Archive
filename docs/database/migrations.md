# Database Migrations

*Status: Active*

This guide explains the Drizzle ORM migration generation process, schema modifications, and safe rollback procedures.

## The `drizzle/` Directory

All schema definitions live within `drizzle/schema.ts`. When making modifications (adding tables, renaming columns, changing data types):

1. Only edit `drizzle/schema.ts`.
2. Do not manually author SQL scripts in the `drizzle/` root.

## Executing Migrations

The project is built to abstract away complex CLI Drizzle commands into a single NPM script.

To generate a new migration based on your `schema.ts` changes, and simultaneously push it to your connected `DATABASE_URL` MySQL database, run:

```bash
pnpm db:push
```

Under the hood, this executes `drizzle-kit generate && drizzle-kit migrate`. This will create a `drizzle/000X_*.sql` file matching the generated timestamp.

## Schema Rollbacks

If a migration breaks the production environment:

1. Do not delete the `.sql` migration file while connected.
2. Alter `drizzle/schema.ts` back to its previous state.
3. Rerun `pnpm db:push`.
This ensures Drizzle drops or reverts the tables systematically according to its internal metadata tracker (`drizzle/meta/`).

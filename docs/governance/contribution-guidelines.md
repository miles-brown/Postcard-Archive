# Contribution Guidelines

*Status: Active*

This guide directs open-source contributors on how to set up their local environment, create branches, and submit PRs adhering to the Postcard Archive's standards.

## Local Setup

1. Fork the repository on GitHub.
2. Clone your fork locally using `git clone`.
3. Ensure you are on Node (LTS) and use `pnpm` exclusively. Run `pnpm install` in the root.
4. Duplicate `.env.example` to `.env` and fill in local mock database credentials or spin up a local SQLite instance if you do not have Neon access.
5. Run `pnpm dev` to start the frontend and backend simultaneously.

## Branch Naming Conventions

Prefix your branches to cleanly identify their purpose:

- `feat/add-new-dashboard`
- `fix/ocr-regex-bug`
- `docs/update-readme`
- `chore/upgrade-packages`

## Pull Request Standards

- **Scope**: Keep PRs focused. Do not mix database migrations with frontend aesthetic tweaks in the same PR.
- **Linting**: Run `npx eslint .` and ensure the pipeline is clear before submitting. The codebase enforces strict TypeScript typing. Do not bypass `tsc` errors with `@ts-ignore` unless absolutely unavoidable (and leave a comment explaining why).
- **Format**: Run `pnpm format` to trigger Prettier across the entire codebase to match the repo's indentation rules.
- **Description**: Provide a clear summary of what your code does, why it is needed, and link to any relevant issues or tasks in `todo.md`.

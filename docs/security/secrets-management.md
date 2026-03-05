# Secrets Management

*Status: Active*

This document outlines how the `.env` keys, OAuth credentials, and Forge API keys are provisioned, rotated, and securely stored without leaking into version control.

## The Environment File (`.env`)

The project relies on localized environment variables during development, loaded strictly via `process.env`.
**CRITICAL RULE:** The `.env` file is in `.gitignore` and must **never** be committed to version control.

### Required Keys & Provisioning

| Key | Purpose | Provisioning Method | Note |
|-----|---------|---------------------|------|
| `DATABASE_URL` | MySQL connection string. | Generated via Neon/Railway console. | Must include password. |
| `VITE_APP_ID` | Application identifier. | Provided by Manus OAuth. | Exposed to client build. |
| `VITE_OAUTH_PORTAL_URL` | Login portal URI. | Provided by Manus OAuth. | Exposed to client build. |
| `OAUTH_SERVER_URL` | OAuth backend API endpoint. | Provided by Manus OAuth. | Sever-only. |
| `JWT_SECRET` | Used to cryptographically sign session cookies using JOSE HMAC. | Generate a random 64-character hex string (e.g., `openssl rand -hex 32`). | Sever-only. |
| `OWNER_OPEN_ID` | Grants `admin` rights on first login. | After logging in, check database for your generated ID and set it here. | Sever-only. |
| `BUILT_IN_FORGE_API_KEY` | Auths against LLM and S3 proxy. | Forge dashboard. | Sever-only. |

## Secrets Rotation Protocols

If a developer suspects that an environment file has leaked (e.g. accidentally copy-pasted into a public forum):

1. **Immediate Revocation**:
   - Roll the `BUILT_IN_FORGE_API_KEY` immediately from the dashboard to prevent massive unauthorized LLM charges or malicious S3 uploads.
2. **Database Password Reset**:
   - Invalidate the old `DATABASE_URL` password in your hosting provider immediately.
3. **Cookie Invalidation**:
   - Change the `JWT_SECRET` string to a new random hash and restart the server. This will immediately invalidate *every active user session*, requiring them to re-authenticate, thereby kicking out any stolen session tokens.
4. **Audit Logs**:
   - Check LLM token usage logs and S3 bucket sizes over the 24 hours surrounding the breach to ensure no data dumping occurred.

## Deployment Secrets

When deploying to production (e.g., Vercel, Railway, Render), do not attempt to use `.env` files. You must manually inject these keys into the provider's dedicated "Environment Variables" / "Secrets" UI dashboard.

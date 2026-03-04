# Authentication & Sessions

Complete documentation of the OAuth authentication flow, JWT session management, and authorization middleware.

## Architecture Overview

```
Browser                    Server                    Manus OAuth
  │                          │                          │
  │──── Click Login ────────▶│                          │
  │  (redirect to OAuth)     │                          │
  │◀─────────────────────────│                          │
  │                          │                          │
  │──── OAuth Portal ───────────────────────────────────▶│
  │◀─── Redirect with code ─────────────────────────────│
  │                          │                          │
  │──── GET /api/oauth/callback?code=X&state=Y ────────▶│
  │                          │── exchangeCodeForToken ──▶│
  │                          │◀── accessToken ──────────│
  │                          │── getUserInfo ───────────▶│
  │                          │◀── openId, name, email ──│
  │                          │                          │
  │                          │── upsertUser (DB)        │
  │                          │── createSessionToken     │
  │                          │── setCookie              │
  │                          │                          │
  │◀─── 302 redirect to / ──│                          │
  │                          │                          │
  │──── auth.me (tRPC) ─────▶│                          │
  │     (cookie sent)        │── verifySession (JWT)    │
  │                          │── getUserByOpenId (DB)   │
  │◀─── User data ──────────│                          │
```

## Login URL Construction

Built dynamically in `client/src/const.ts`:

```typescript
getLoginUrl() → `${VITE_OAUTH_PORTAL_URL}/login?app_id=${VITE_APP_ID}&state=${base64(redirectUri)}`
```

- `redirectUri` defaults to `window.location.origin + "/api/oauth/callback"`
- Encoded as base64 in the `state` parameter
- Decoded server-side to validate the OAuth callback

## OAuth Callback (`server/_core/oauth.ts`)

`GET /api/oauth/callback?code=<code>&state=<state>`

1. Validates `code` and `state` query parameters (400 if missing)
2. Calls `sdk.exchangeCodeForToken(code, state)` → Manus OAuth server
3. Calls `sdk.getUserInfo(accessToken)` → fetches user profile
4. Upserts user in database (auto-assigns admin role if `openId === OWNER_OPEN_ID`)
5. Creates JWT session token (HS256, 1-year expiry)
6. Sets `app_session_id` HttpOnly cookie
7. Redirects to `/` with 302

## Session Token (JWT)

### Creation (`sdk.createSessionToken`)

```typescript
new SignJWT({ openId, appId, name })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(expirationSeconds)
  .sign(secretKey)
```

- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: Derived from `JWT_SECRET` env var via `TextEncoder`
- **Expiry**: 1 year (`ONE_YEAR_MS = 31536000000ms`)
- **Payload**: `{ openId, appId, name }`
- **Library**: JOSE (`jose` package)

### Verification (`sdk.verifySession`)

1. Extracts `app_session_id` from cookie header using `cookie.parse()`
2. Verifies JWT signature and expiration with `jwtVerify()`
3. Validates payload has non-empty `openId`, `appId`, and `name`
4. Returns payload or `null` on failure (never throws)

## Cookie Configuration (`server/_core/cookies.ts`)

```typescript
{
  httpOnly: true,        // Not accessible to JavaScript
  path: "/",             // Sent for all paths
  sameSite: "none",      // Allows cross-site requests
  secure: <dynamic>,     // true if x-forwarded-proto === "https"
  maxAge: ONE_YEAR_MS    // 365 days
}
```

Cookie name: `app_session_id` (from `shared/const.ts`)

## Request Authentication (`sdk.authenticateRequest`)

Called by `createContext()` on every tRPC request:

1. Parse cookies from `req.headers.cookie`
2. Verify JWT from `app_session_id` cookie
3. Look up user by `openId` in database
4. If user not in DB, auto-sync from OAuth server via `getUserInfoWithJwt()`
5. Update `lastSignedIn` timestamp
6. Return `User` object (or throw `ForbiddenError`)

## tRPC Context & Middleware

### Context Creation (`server/_core/context.ts`)

```typescript
async function createContext(opts): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;  // Silent failure for public procedures
  }
  return { req: opts.req, res: opts.res, user };
}
```

Auth errors are silently caught so public procedures always work.

### Procedure Middleware Chain (`server/_core/trpc.ts`)

| Procedure | Middleware | On Failure |
|-----------|-----------|------------|
| `publicProcedure` | None | `ctx.user` is `null` |
| `protectedProcedure` | Checks `ctx.user !== null` | Throws `UNAUTHORIZED` with "Please login (10001)" |
| `adminProcedure` | Extends `protectedProcedure`, checks `role === "admin"` | Throws `FORBIDDEN` with "Admin access required" |

## Client-Side Auth (`client/src/_core/hooks/useAuth.ts`)

### `useAuth(options?)` Hook

**Options**:
- `redirectOnUnauthenticated?: boolean` — if true, redirects to login when not authenticated

**Returns**:
- `user` — current `User` object or `null`
- `isLoading` — whether the auth check is in progress
- `isAuthenticated` — boolean shorthand
- `logout()` — clears session and invalidates cache
- `refetch()` — manually re-check auth state

**Behavior**:
- Calls `auth.me` tRPC query on mount with `retry: false`, `refetchOnWindowFocus: false`
- Persists user info to `localStorage["manus-runtime-user-info"]`
- On logout: calls `auth.logout` mutation, clears localStorage, invalidates query cache
- On `UNAUTHORIZED` during logout, silently returns (already logged out)

### Global Error Handling (`client/src/main.tsx`)

Both `QueryCache` and `MutationCache` subscribe to errors:
- If error message matches `UNAUTHED_ERR_MSG`, auto-redirect to login via `window.location.href`
- All errors logged to console with `[API Query Error]` / `[API Mutation Error]` prefix

## Admin Role Assignment

The owner's admin role is assigned automatically:

```typescript
// In db.ts upsertUser()
if (user.openId === ENV.ownerOpenId) {
  values.role = 'admin';
}
```

`OWNER_OPEN_ID` env var determines which user gets admin access. There is no UI for role management.

## Login Method Detection

Derived from the OAuth `platforms` array in `sdk.ts`:

| Platform Constant | Derived Method |
|-------------------|----------------|
| `REGISTERED_PLATFORM_EMAIL` | `"email"` |
| `REGISTERED_PLATFORM_GOOGLE` | `"google"` |
| `REGISTERED_PLATFORM_APPLE` | `"apple"` |
| `REGISTERED_PLATFORM_MICROSOFT` / `_AZURE` | `"microsoft"` |
| `REGISTERED_PLATFORM_GITHUB` | `"github"` |
| Other | First platform lowercased |

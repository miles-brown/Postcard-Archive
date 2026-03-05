# Frontend Architecture

React 19 application with TypeScript, Tailwind CSS 4, shadcn/ui, and tRPC for server communication.

## Application Structure

```
client/src/
├── main.tsx              # Entry point: tRPC client, QueryClient, error handlers
├── App.tsx               # Router (Wouter) + providers (Theme, Tooltip, Toaster)
├── index.css             # Tailwind CSS, OKLch design tokens, custom utilities
├── const.ts              # getLoginUrl() helper
├── _core/hooks/
│   └── useAuth.ts        # Auth state management hook
├── components/
│   ├── ui/               # 60+ shadcn/ui primitives
│   ├── AIChatBox.tsx     # AI chat interface (Streamdown markdown)
│   ├── DashboardLayout.tsx   # Resizable sidebar layout
│   ├── DashboardLayoutSkeleton.tsx
│   ├── ErrorBoundary.tsx # React error boundary
│   ├── Map.tsx           # Google Maps integration
│   └── ManusDialog.tsx   # Branded dialog
├── contexts/
│   └── ThemeContext.tsx   # Light/dark theme provider
├── hooks/
│   ├── useMobile.tsx     # Responsive breakpoint detection
│   ├── useComposition.ts # Input composition helpers
│   └── usePersistFn.ts   # Persistent function reference
├── lib/
│   ├── trpc.ts           # tRPC React hooks (createTRPCReact)
│   └── utils.ts          # cn() class merging utility
└── pages/
    ├── Home.tsx           # Landing page
    ├── Gallery.tsx        # Public postcard gallery
    ├── PostcardDetail.tsx # Single postcard view
    ├── Admin.tsx          # Admin dashboard
    ├── ComponentShowcase.tsx
    └── NotFound.tsx       # 404 page
```

## Provider Hierarchy

```
<trpc.Provider>
  <QueryClientProvider>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />    ← Wouter Switch
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </QueryClientProvider>
</trpc.Provider>
```

## Routing (Wouter)

Uses a patched version of Wouter (`patches/wouter@3.7.1.patch`). The patch adds `window.__WOUTER_ROUTES__` to track all defined route paths for introspection.

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | `Home` | No |
| `/gallery` | `Gallery` | No |
| `/postcard/:id` | `PostcardDetail` | No |
| `/admin` | `Admin` | Admin role |
| `/404` | `NotFound` | No |
| `*` (fallback) | `NotFound` | No |

## tRPC Client Setup

Configured in `main.tsx`:

```typescript
httpBatchLink({
  url: "/api/trpc",
  transformer: superjson,
  fetch(input, init) {
    return globalThis.fetch(input, { ...init, credentials: "include" });
  },
})
```

- **Batch link**: Multiple concurrent queries batched into a single HTTP request
- **Credentials**: `include` — sends cookies with cross-origin requests
- **Transformer**: SuperJSON for Date/Map/Set serialization

## Design System

### Aesthetic

Scandinavian minimalist: pale cool gray background, bold black sans-serif typography, generous negative space, soft pastel blue and blush pink geometric accents.

### OKLch Color Tokens (`index.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.97 0.005 240)` | Page background (pale blue-gray) |
| `--foreground` | `oklch(0.15 0 0)` | Primary text (near-black) |
| `--primary` | `oklch(0.15 0 0)` | Buttons, headings |
| `--secondary` | `oklch(0.85 0.03 220)` | Soft blue accents |
| `--accent` | `oklch(0.88 0.05 10)` | Pink/salmon geometric accents |
| `--muted` | `oklch(0.92 0.005 240)` | Disabled/secondary elements |
| `--destructive` | `oklch(0.55 0.22 25)` | Errors, Holocaust badge |
| `--card` | `oklch(1 0 0)` | Card backgrounds (pure white) |

Dark mode is defined in `.dark` but not active (ThemeProvider defaults to `"light"`).

### Container Utility

Custom override of Tailwind's container:

| Breakpoint | Padding | Max Width |
|------------|---------|-----------|
| Mobile | `1rem` (16px) | fluid |
| `≥640px` | `1.5rem` (24px) | fluid |
| `≥1024px` | `2rem` (32px) | `1280px` |

### Component Patterns

**shadcn/ui with New York style** — 60+ Radix UI-based components in `components/ui/`.

Common patterns used across pages:

| Pattern | Implementation |
|---------|---------------|
| Card wrapper | `<Card><CardContent>` for consistent padding |
| War period badges | `secondary` (WWI), `default` (WWII), `destructive` (Holocaust) |
| Status badges | `outline` variant |
| Icons | Lucide React, `w-4 h-4` or `w-5 h-5`, `text-muted-foreground` |
| Responsive grids | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| Empty states | Icon + heading + description + action button |
| Loading spinner | `<Loader2 className="animate-spin" />` centered |
| Class merging | `cn()` from `@/lib/utils` (clsx + tailwind-merge) |
| Toast notifications | Sonner (`<Toaster />` + `toast()`) |
| Animations | Framer Motion |

## Page Details

### Home (`/`)

Marketing landing page with:
- Hero section with geometric shapes (blue + pink divs with `rounded-full`)
- Large bold headline (6-8xl)
- "How It Works" feature cards with icons in circular colored backgrounds
- CTA section with call-to-action button
- 3-column footer with copyright

### Gallery (`/gallery`)

Public postcard listing with filtering:
- Text search input (LIKE on title + description, OR logic)
- War period dropdown filter (mutually exclusive)
- Active filters shown as removable badges
- Responsive card grid (1/2/3 columns)
- Cards show: 4:3 aspect-ratio image, title (2-line clamp), description excerpt (3-line clamp), war period badge, date, transcription status badge
- No pagination — loads all matching postcards

### PostcardDetail (`/postcard/:id`)

Full postcard view:
- All images displayed (stacked vertically, full width)
- Metadata card: price, seller, date found, eBay link (opens in new tab)
- Transcription display per image:
  - Language badge (uppercase: "EN", "DE", "FR")
  - Confidence percentage badge
  - Transcribed text in monospace serif with `whitespace-pre-wrap`
- Status indicators: pending (gray), processing (spinner), completed (transcription cards)

### Admin (`/admin`)

Dashboard for admin users:
- **Stats row**: Total postcards, transcribed count, pending count (computed via `useMemo`)
- **Scraper controls**: Run button (optional war period filter), process transcriptions button (disabled when pending = 0)
- **Scraping logs**: Last 20 entries with status icons (green check / red X / yellow clock)
- **Postcard management**: Filter by war period, toggle `isPublic`, delete with confirmation, link to detail page

## State Management

| Layer | Tool | Pattern |
|-------|------|---------|
| Server state | tRPC + React Query | `trpc.procedure.useQuery()` / `useMutation()` |
| Auth state | `useAuth()` hook | Query-based + localStorage cache |
| Theme | ThemeContext | React context, defaults to light |
| UI state | localStorage | Sidebar width, user info |

### Query Patterns

```typescript
// Query with reactive dependencies
const { data, isLoading } = trpc.postcards.list.useQuery({ warPeriod });

// Mutation with feedback
const mutation = trpc.admin.postcards.update.useMutation({
  onSuccess: () => {
    toast("Updated successfully");
    utils.admin.postcards.listAll.refetch();
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

## Key Custom Components

### AIChatBox

Reusable AI chat interface:
- Filters `system` messages from display
- User messages right-aligned (secondary bg), assistant messages left-aligned (muted bg, markdown)
- Markdown rendering via Streamdown library
- Auto-scroll with `requestAnimationFrame`
- Textarea input (1-9 rows auto-sizing), Enter to send, Shift+Enter for newline
- Suggested prompts displayed as clickable buttons

### DashboardLayout

Resizable sidebar layout for admin:
- Sidebar width: 200-480px, persisted to localStorage
- Mobile: collapses with SidebarTrigger header button
- Uses `react-resizable-panels`

### Map

Google Maps wrapper via Forge proxy:
- Supports markers, places, geocoding, and geometry APIs

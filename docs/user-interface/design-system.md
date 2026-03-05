# Design System & Theming

*Status: Active*

This document catalogs the application's Scandinavian minimalist aesthetic, expanding upon OKLch color space palettes, variable mappings, typography rules, and shadcn/ui component overrides.

## Aesthetic Philosophy: Scandinavian Minimalism

Our design focuses on content (the historical postcards) rather than decorative UI elements. We use:

- Generous negative space
- Minimal borders
- Elegant, highly legible typography
- Subdued, cool-toned backgrounds with soft pastel accents

## Color Palette (OKLch)

We exclusively use the OKLch color space to ensure uniform lightness and chroma across different hues.

| Token | OKLch Value | Description |
|-------|-------------|-------------|
| **Background** | `oklch(0.97 0.005 240)` | Pale cool blue-gray. Serves as the page canvas. |
| **Card / Surface** | `oklch(1 0 0)` | Pure white. Used to lift content off the background. |
| **Primary (Text)** | `oklch(0.15 0 0)` | Deep black. High contrast for readability without true `#000`. |
| **Secondary (Accent)** | `oklch(0.85 0.03 220)` | Soft blue. Used for geometric accents and secondary buttons. |
| **Accent / Hover** | `oklch(0.88 0.05 10)` | Soft pink/salmon. Used for subtle hover states and highlights. |
| **Destructive** | `oklch(0.55 0.22 25)` | Vivid red. Reserved for destructive actions and the Holocaust war period badge. |

## Typography

- **Headers**: Bold black sans-serif. Use `font-bold` for `h1` and `h2`.
- **Primary Text**: Dark gray to black. Standard `text-base` size.
- **Subtitles**: Delicate thin subtitles. Use `font-light` or `text-muted-foreground` for subtext under headings or cards.

## Component Conventions (`shadcn/ui`)

- **Cards**: Use standard `<Card>` components. The background must be pure white to contrast with the page background. Give them subtle shadows.
- **Badges**:
  - `secondary`: Used for **WWI** tags.
  - `default`: Used for **WWII** tags.
  - `destructive`: Exclusively used for **Holocaust** tags to emphasize gravity.
  - `outline`: Used for transcription statuses (e.g. `pending`, `completed`).
- **Icons**: Use `lucide-react`. Standard sizes are `w-4 h-4` or `w-5 h-5` with `text-muted-foreground` unless actively highlighted.
- **Loading States**: Centered `<Loader2 className="animate-spin" />` from Lucide.
- **Empty States**: Must consist of a muted icon, a heading, a brief descriptive paragraph, and an optional call-to-action button.

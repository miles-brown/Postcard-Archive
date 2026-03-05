# Accessibility (a11y) Standards

*Status: Active*

This document enforces the UI/UX requirements for ensuring WCAG 2.1 AA compliance across the Postcard Archive. Because this is a historical database, preserving access for visually impaired and motor-impaired users is a moral imperative.

## Focus States

Every single interactive element (buttons, postcard links, tabs, dropdowns) must have a clearly defined `:focus-visible` outline. shadcn/ui handles this fundamentally via the `ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` utility classes. Do not remove them.

## ARIA Attributes

- **Postcard Images**: The `.isPrimary` grid images must contain an `alt="Historical postcard titled: {title}"` tag natively. They should never have an empty `alt=""` tag, as this makes the image invisible to screen readers.
- **Sidebars & Navigation**: Use `<nav role="navigation">` and `<aside role="complementary">` to landmark the page layout effectively.

## Contrast Ratios

The text against the `oklch(0.97 0.005 240)` pale-gray background must strictly meet the **4.5:1** ratio set out by WCAG AA.
The primary black text color `oklch(0.15 0 0)` easily passes this benchmark. If using gray subtitles (`text-muted-foreground`), ensure the contrast does not dip below 4.5:1. You can test this in Chrome DevTools.

## Keyboard Navigation

The entire site must be traversable perfectly via the `Tab` and `Shift+Tab` keys. Furthermore:

1. Dialogs and modals (e.g. standard viewing modals, or the login screen) must trap focus within the modal until explicitly dismissed via `Esc` or a close button.
2. The manual scraper trigger buttons must be keyboard accessible and trigger on both `Enter` and `Space`.

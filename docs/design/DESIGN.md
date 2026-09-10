# Note App Frontend Design System

## Purpose

This document is the frontend visual contract for Note App. It complements the product behavior defined in `docs/03-design/08-ui-ux.md` and the Stitch reference prompt in `docs/03-design/ui-prompts/01-core-ui-prompt.md` and design ui `D:\OPENCODE_PROJECT\Note_App\frontend\public\stitch\code`.

The global implementation stylesheet is `frontend/src/app/app.css`, imported by `frontend/src/main.jsx`. Shared visual values belong in its `:root` token block and should be consumed through CSS custom properties.

## Visual Direction

- Deep-dark, calm, precise, and writing-focused.
- Use layered graphite surfaces, subtle 1px borders, and restrained shadows.
- Keep the editor visually dominant and navigation quiet.
- Avoid gradients, glassmorphism, decorative imagery, excessive cards, and loud effects.
- Use flat, zero-radius geometry for primary layout surfaces. Reserve elevation for temporary UI such as dialogs and menus.

## Design Tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#080B10` | Application background |
| `--color-sidebar` | `#0C1118` | Sidebar and authentication aside |
| `--color-surface` | `#111821` | Inputs, panels, and primary controls |
| `--color-surface-elevated` | `#17212B` | Active tabs, menus, dialogs, and elevated editor surfaces |
| `--color-border` | `#24303C` | Borders and structural separators |
| `--color-text` | `#F3F7FA` | Primary text |
| `--color-text-muted` | `#91A0AD` | Secondary text and metadata |
| `--color-primary` | `#34D399` | Primary actions and success |
| `--color-primary-hover` | `#6EE7B7` | Primary action hover |
| `--color-interaction` | `#22D3EE` | Links, focus, selection, and secondary interaction |
| `--color-focus` | `#67E8F9` | Keyboard focus treatment |
| `--color-danger` | `#FB7185` | Errors and destructive actions |
| `--color-warning` | `#FBBF24` | Warning states |

State meaning must never rely on color alone. Pair color with text, icons, labels, or structural changes.

### Typography

- Primary UI font: `Inter`, with a system sans-serif fallback.
- Compact labels and metadata may use `JetBrains Mono`, with a monospace fallback.
- Page headings: 24-32px, tight line-height, semibold or bold.
- Note titles: 28-40px.
- Editor body: 16-18px with generous line-height.
- UI labels: 12-14px.
- Metadata: 11-13px with clear contrast.

### Geometry and Layout

- Border radius: `0` by default. Do not introduce rounded cards without a specific interaction need.
- Border: 1px solid `--color-border`.
- Workspace padding: 20-32px on desktop.
- Desktop proportions: sidebar 220-248px, collection panel 300-360px, editor fills remaining space.
- Minimum practical touch target: 44px on mobile.

## Responsive Behavior

| Viewport | Behavior |
| --- | --- |
| Desktop, 1440px+ | Three areas: sidebar, collection panel, editor. |
| Laptop, 1024-1439px | Preserve the three areas with tighter spacing and flexible panel widths. |
| Tablet, 768-1023px | Collapse sidebar into a drawer; collection and editor may become separate views. |
| Mobile, 320-767px | Show collection or editor, not both side by side. Use a menu/drawer and compact toolbar overflow. |

All layouts use the same tokens and behavior. Mobile must preserve navigation context, selected-note context, save status, and access to New Note without horizontal scrolling.

## Shared Components

Components should provide default, hover, focus, active, disabled, loading, success, error, and destructive states where applicable.

- Brand mark and navigation
- Primary, secondary, text, and destructive buttons
- Labeled inputs, validation messages, and password visibility control
- Tabs, search fields, tags, badges, and metadata
- Sidebar, collection list, note row, and editor toolbar
- Save-status indicator with explicit text: Unsaved Changes, Saving, Saved, or Save Failed
- Toasts, dialogs, drawers, loading skeletons, empty states, and error states

## Accessibility

- Use semantic HTML and accessible names for all controls.
- Maintain visible keyboard focus using `--color-focus` or an equivalent high-contrast treatment.
- Keep focus predictable when opening dialogs, menus, and drawers.
- Associate validation errors with their inputs.
- Announce save status and important operation feedback to assistive technology.
- Maintain WCAG 2.2 AA contrast and do not communicate state through color alone.
- Keep keyboard interactions usable on desktop and touch targets usable on mobile.

## Content and Product Boundaries

The frontend supports authentication, mandatory email verification, password reset, Google and Facebook sign-in, private notes, rich-text editing, autosave, notebooks, tags, favorites, archive, trash and restore, permanent deletion, and search. Do not add profile pages, general settings, Telegram sign-in or sign-up, sharing, collaboration, attachments, AI, or analytics dashboards to the MVP.

## Implementation Rules

- Add new shared colors, spacing values, or state values to the global token block before using them.
- Prefer existing tokens over one-off hex values.
- Keep layout surfaces flat and use elevation only for transient UI.
- Preserve visible unsaved state after save failures.
- Never silently discard unsaved editor content during navigation.

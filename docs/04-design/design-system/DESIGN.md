# Note App Frontend Design System

## Purpose

This document is the frontend visual contract for Note App. It complements product behavior in `docs/02-requirements/acceptance-criteria.md` and the Stitch reference assets in `frontend/public/stitch/`.

The implementation stylesheet is `frontend/src/styles/globals.css`. Shared visual values belong in its `:root` token block and should be consumed through CSS custom properties.

## Visual Direction

- Deep-dark, calm, precise, and writing-focused.
- Use layered graphite surfaces, subtle 1px borders, and restrained shadows.
- Keep the editor visually dominant and navigation quiet.
- Avoid gradients, glassmorphism, decorative imagery, excessive cards, and loud effects.
- Use flat, zero-radius geometry for primary surfaces. Reserve elevation for dialogs and menus.

## Design Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#080B10` | Application background |
| `--color-sidebar` | `#0C1118` | Sidebar and authentication panel |
| `--color-surface` | `#111821` | Inputs, panels, and primary controls |
| `--color-surface-elevated` | `#17212B` | Active areas, menus, dialogs, and editor surfaces |
| `--color-border` | `#24303C` | Borders and structural separators |
| `--color-text` | `#F3F7FA` | Primary text |
| `--color-text-muted` | `#91A0AD` | Secondary text and metadata |
| `--color-primary` | `#34D399` | Primary actions and success |
| `--color-primary-hover` | `#6EE7B7` | Primary action hover |
| `--color-interaction` | `#22D3EE` | Links and secondary interaction |
| `--color-focus` | `#67E8F9` | Keyboard focus |
| `--color-danger` | `#FB7185` | Errors and destructive actions |
| `--color-warning` | `#FBBF24` | Warning states |

Spacing uses the existing `--space-1` through `--space-6` tokens. Controls use the existing `--radius-control`; layout surfaces remain square by default.

State must never be communicated through color alone. Pair color with text, icons, labels, or structural changes.

## Typography

- Primary UI font: `Inter`, with a system sans-serif fallback.
- Compact labels and metadata may use `JetBrains Mono`, with a monospace fallback.
- Page headings: 24-32px, tight line-height, semibold or bold.
- Note titles: 28-40px.
- Editor body: 16-18px with generous line-height.
- UI labels: 12-14px.
- Metadata: 11-13px with clear contrast.

## Geometry and Layout

- Use 1px `--color-border` separators.
- Use 20-32px workspace padding on desktop.
- Desktop proportions: sidebar 220-248px, collection panel 300-360px, editor fills the remaining space.
- Minimum practical touch target: 44px on mobile.
- Do not introduce rounded cards without a specific interaction need.

## Responsive Behavior

| Viewport | Behavior |
| --- | --- |
| Desktop, 1440px+ | Three areas: sidebar, collection panel, and editor. |
| Laptop, 1024-1439px | Preserve three areas with tighter spacing and flexible widths. |
| Tablet, 768-1023px | Collapse the sidebar into a drawer; collection and editor may become separate views. |
| Mobile, 320-767px | Show collection or editor, not both side by side. Use drawers and compact toolbar controls. |

Mobile must preserve navigation context, selected-note context, save status, and access to New Note without horizontal scrolling.

## Shared Components and States

Shared components include brand and navigation, buttons, labeled inputs, validation messages, tabs, search fields, tags, badges, metadata, sidebar, collection list, note rows, editor toolbar, save-status indicator, toasts, dialogs, drawers, loading states, empty states, and error states.

Interactive components should define default, hover, focus, active, disabled, loading, success, error, and destructive states where applicable.

The save-status indicator uses explicit text: `Unsaved Changes`, `Saving`, `Saved`, or `Save Failed`.

## Editor Organization Context

The editor uses a compact, flat context bar above the title for notebook selection, assigned tags, tag assignment, creation controls, save status, and note actions. It must wrap on mobile and never require horizontal scrolling.

Keep rename and delete notebook actions behind `Manage`. Reveal creation forms only after activation. Use interaction colors for focus and selection, primary colors for successful creation and save states, and danger colors for destructive actions.

## Accessibility

- Use semantic HTML and accessible names for all controls.
- Maintain visible keyboard focus with `--color-focus` or an equivalent high-contrast treatment.
- Keep focus predictable when opening dialogs, menus, and drawers.
- Associate validation errors with their inputs.
- Announce save status and important feedback to assistive technology.
- Maintain WCAG 2.2 AA contrast and never communicate state through color alone.
- Keep keyboard interactions usable on desktop and touch targets usable on mobile.
- Respect `prefers-reduced-motion`.

## Product Boundaries

The frontend supports authentication, private notes, rich-text editing, autosave, notebooks, tags, favorites, archive, trash and restore, permanent deletion, search, and responsive workspace behavior. Do not add profile pages, general settings, Telegram authentication, sharing, collaboration, attachments, AI features, or analytics dashboards to the MVP.

## Implementation Rules

- Add new shared colors, spacing values, or state values to the global token block before using them.
- Prefer existing tokens over one-off values.
- Keep layout surfaces flat and use elevation only for transient UI.
- Preserve visible unsaved state after save failures.
- Never silently discard unsaved editor content during navigation.

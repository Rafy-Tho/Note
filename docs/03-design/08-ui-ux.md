# UI/UX Design

## Purpose

This document defines the MVP screens, navigation, editor behavior, responsive layout, accessibility, and feedback states.

## UX Principles

- Make creating a note fast.
- Keep the editor focused and uncluttered.
- Make save status visible.
- Make destructive actions clear and reversible when possible.
- Keep navigation consistent across screen sizes.

## Application Areas

| Area | Purpose |
| --- | --- |
| Authentication | Register and sign in. |
| Notes | View and edit the user's Active notes. |
| Notebooks | Create and manage note groups. |
| Tags | Create, assign, and browse by tags. |
| Favorites | View important notes. |
| Archive | View and restore Archived notes. |
| Trash | View, restore, or permanently delete Trashed notes. |
| Search | Find Active and Archived notes. |

Profile and general settings are not part of the MVP navigation.

## Main Layout

### Desktop

```text
Sidebar | Notes list | Note editor
```

The sidebar provides navigation. The notes list provides collection context. The editor receives the main writing focus.

### Mobile

```text
Header / menu
        v
Collection or editor view
```

The sidebar becomes a menu or drawer. The editor and essential actions remain usable without horizontal scrolling.

## Required Screens

- Registration
- Sign in
- Dashboard
- Notes list
- Note editor
- Notebook management
- Tag management
- Favorites
- Archive
- Trash
- Search results

## Note Editor

The editor must provide:

- Editable title and content.
- Headings, bold, italic, lists, links, and code formatting.
- Visible save status: Unsaved Changes, Saving, Saved, or Save Failed.
- Actions for notebook, tags, favorite, archive, and Trash.
- Clear behavior when the note is read-only, missing, or unauthorized.

Autosave behavior is defined in `07-autosave.md`.

### Editor Organization Context

Notebook and tag controls live in a compact context bar at the top of the note editor, before the title and writing canvas. The context bar shall:

- Show a labeled notebook dropdown with a `No notebook` option.
- Show assigned tags as removable chips.
- Provide a dropdown for assigning an existing tag.
- Provide separate `Create new notebook` and `Create new tag` actions that reveal short inline forms.
- Assign a newly created notebook or tag to the current note after successful creation.
- Keep notebook rename and delete actions behind an explicit Manage control instead of listing all management actions in the writing surface.
- Preserve clear error feedback and disable organization controls while the note is saving or a related mutation is pending.

On mobile, the context bar wraps into multiple rows and keeps every control usable without horizontal scrolling. Selects, buttons, chip removal controls, and form actions retain practical 44px touch targets. The save status and primary note actions remain visible below the organization context.

## Feedback States

Every major view must support:

- Loading state
- Empty state
- Success feedback
- Validation error
- Operation failure
- Unauthorized or missing-resource state

Destructive actions must use clear labels and confirmation for permanent deletion.

## Navigation Rules

- Protected areas require authentication.
- Navigation must not lose unsaved editor state without warning or save handling.
- The current area and selected note should be visually identifiable.
- Browser back and forward navigation should return to a usable state.
- Search results must open the selected note in the editor.

## Accessibility

- Use semantic HTML and labeled controls.
- Support keyboard navigation for core actions.
- Keep focus predictable in menus, dialogs, and editor controls.
- Provide visible focus indicators.
- Do not communicate errors or save status by color alone.
- Use accessible labels for save status, errors, dialogs, and loading states.

## Responsive Requirements

The UI must be designed and verified for these viewport groups:

- Desktop: 1440 px and wider
- Laptop: 1024-1439 px
- Tablet: 768-1023 px
- Mobile: 320-767 px

Every required screen must have a responsive desktop and mobile composition. The core workflow must work on desktop, tablet, and mobile browsers:

```text
Sign in -> Create note -> Edit -> Save -> Navigate -> Recover
```

The interface must avoid unusable controls, clipped editor content, and unnecessary horizontal scrolling.

Mobile behavior must define sidebar collapse, notes-list/editor navigation, toolbar overflow, touch targets, dialogs, loading states, empty states, errors, and save failures.

## Requirement Mapping

| UI/UX decision | Requirements |
| --- | --- |
| Dashboard and navigation | FR-37-FR-39, US-31-US-33 |
| Editor and save feedback | FR-08, FR-32-FR-35, NFR-17, NFR-38 |
| Editor organization context | FR-20-FR-27, AC-08-AC-15 |
| Collection and empty states | FR-30, FR-38, NFR-38 |
| Responsive interface | NFR-40, NFR-46 |
| Accessibility | NFR-41-NFR-44 |
| Destructive-action safety | FR-12, NFR-21 |

## Design Generator Prompt

The prompt for generating the visual UI is in `ui-prompts/01-core-ui-prompt.md`. This UI/UX document remains the source of truth for product behavior and scope.

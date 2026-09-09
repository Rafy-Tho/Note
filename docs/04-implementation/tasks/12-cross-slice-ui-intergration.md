# Task 12 - Cross-Slice UI Integration

## Status

In Progress

## Objective

Integrate and harden the UI delivered by the vertical feature slices into a production-ready responsive user journey. This task does not defer feature frontend work until the end.

## Depends On

- `06-core-notes.md`
- `07-rich-text-autosave.md`
- `08-trash-recovery.md`
- `10-search.md`
- `11-organization-favorites-archive.md`

## Shared UI Integration

- [x] Complete dashboard and navigation.
- [x] Add responsive desktop, tablet, and mobile layouts.
- [x] Add keyboard navigation and focus management.
- [x] Add accessible save and error feedback.
- [ ] Verify consistent loading, empty, success, and error states across slices.

## Integration and Tests

- [ ] Verify the complete user journey across all delivered slices.
- [x] Add component and end-to-end coverage for supported screen sizes.
- [ ] Run keyboard and accessibility checks for important actions.

## Tests and Evidence

- Core workflow works on supported screen sizes.
- Keyboard navigation works for important actions.
- UI does not silently discard unsaved changes.

## Implementation Evidence

- Responsive three-area workspace shell, mobile navigation drawer, collection/editor switching, visible focus treatment, reduced-motion support, retryable initial loading failure, and shared unsaved-change navigation guard implemented.
- Playwright desktop, tablet, and mobile projects configured; mobile keyboard navigation journey added.
- Browser verification is blocked because the local Playwright Chromium executable is unavailable.

## Completion Gate

The core workflow is usable and accessible on supported browsers.

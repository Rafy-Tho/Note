# UI Design Generator Prompt

Use the following prompt with the UI design generator.

```text
You are a senior product designer creating a complete modern web application UI for a private note-taking product called "Note App".

Create the entire product as one cohesive design system, not as unrelated screens.

PRODUCT PURPOSE
Create a focused workspace where users can securely write, organize, search, archive, and recover personal notes.

MVP FEATURES
Include only these features:

- Account registration
- Sign in and sign out
- Private notes
- Blank note creation
- Rich-text editing
- Autosave and save-status feedback
- Notebooks
- Tags
- Favorites
- Archive
- Trash and restore
- Permanent deletion
- Search by title, content, and tags
- Responsive desktop, tablet, and mobile browser layouts

Do not include profile pages, general settings, password reset, email verification, AI, sharing, collaboration, team workspaces, attachments, version history, offline synchronization, or native mobile applications.

VISUAL DIRECTION
Use a deep-dark, modern SaaS visual style.

The design should feel focused, precise, premium, technical, calm, and suitable for long writing sessions.

Avoid generic SaaS dashboards, excessive cards, loud gradients, neon overload, glassmorphism, oversized hero sections, excessive rounded containers, and decorative elements that distract from writing.

Use a dark-first interface with layered surfaces, subtle 1px borders, restrained shadows, and small amounts of accent glow only for important focus or status states. Do not use pure black backgrounds or low-contrast black-on-dark text.

DESIGN QUALITY AND COMPOSITION
Create a confident product interface with a strong visual hierarchy:

- One clear primary action per screen.
- One dominant content area instead of a grid of equal cards.
- Spacious editor, compact navigation, and disciplined information density.
- Use alignment, spacing, and surface contrast to create hierarchy.
- Use accent color sparingly for selected items, primary actions, focus, and status.
- Keep the interface visually interesting through composition and typography, not decoration.
- Make the product look intentionally designed, not like a collection of default components.

The final result should feel closer to a refined Linear, Raycast, or Superhuman-style product workspace than a generic dashboard. Do not copy those products; use only their level of polish, clarity, and restraint as inspiration.

COLOR SYSTEM
Use a deep graphite foundation:

- App background: #080B10
- Sidebar background: #0C1118
- Main surface: #111821
- Elevated surface: #17212B
- Borders: #24303C
- Primary text: #F3F7FA
- Secondary text: #91A0AD
- Primary accent: emerald #34D399
- Interaction accent: cyan #22D3EE
- Destructive color: #FB7185
- Warning color: #FBBF24
- Focus color: #67E8F9

Use emerald for primary actions and success states. Use cyan for links, focus states, selected controls, and secondary interaction highlights. Use color for hierarchy and state, but never rely on color alone to communicate meaning.

SURFACE AND DEPTH
Use clear surface levels:

- App background for the outer workspace
- Sidebar surface for navigation
- Main surface for collections
- Elevated surface for editor panels, menus, and dialogs
- Thin borders for separation
- Minimal shadows for elevation

The editor should use a slightly brighter surface than the surrounding workspace so writing remains the visual focus.

Use the following approximate layout proportions on desktop:

- Sidebar: 220-248 px
- Collection panel: 300-360 px
- Editor: remaining flexible space
- Main workspace padding: 20-32 px
- Panel gaps: 1 px border separation or 16-24 px spacing

Do not place every section inside a floating rounded card. Use flat layered surfaces for the main workspace and reserve elevation for menus, dialogs, and temporary actions.

TYPOGRAPHY
Use a modern readable sans-serif such as Geist, Inter, or an equivalent. Do not use an editorial serif for the primary interface.

Prioritize long-form readability, clear hierarchy, comfortable editor text size, strong contrast, and consistent line height. Use weight, size, spacing, and surface contrast instead of decorative typography.

Use a restrained type scale:

- Page title: 24-32 px
- Note title: 28-40 px
- Editor body: 16-18 px with generous line height
- UI labels: 12-14 px
- Metadata: 11-13 px with clear contrast

DESIGN SYSTEM
Define reusable tokens for:

- Colors
- Typography
- Spacing
- Border radius
- Borders
- Shadows
- Focus states
- Buttons
- Inputs
- Tags and badges
- Dialogs
- Toasts
- Loading skeletons

RESPONSIVE DESIGN REQUIREMENT
Build the UI for desktop and mobile as first-class experiences. Do not create a desktop design and simply shrink it for mobile.

Produce and show separate responsive layouts for:

- Desktop: 1440 px and wider
- Laptop: 1024-1439 px
- Tablet: 768-1023 px
- Mobile: 320-767 px

Every required screen must have a desktop and mobile version. Tablet behavior must be defined when it differs from desktop or mobile.

Desktop and mobile must use the same design tokens, visual language, component states, and product behavior.

DESKTOP LAYOUT
Use a three-area workspace on wide screens:

1. Left sidebar for brand, New Note, Notes, Favorites, Archive, Trash, Notebooks, Tags, Search, and Sign Out.
2. Middle collection panel for page title, filters, sorting, note count, and note list.
3. Right editor panel for title, toolbar, content, organization controls, note actions, and save status.

The editor must receive the strongest visual focus.

The sidebar should be quiet and functional, not visually dominant. Use grouped navigation, subtle active indicators, compact icons with labels, and one visually prominent New Note action.

The collection panel should feel like a focused inbox. Use clear selected-note treatment, concise metadata, readable previews, and strong empty states instead of dense visual noise.

The editor should feel like a calm dark canvas: generous top spacing, readable title hierarchy, compact toolbar, clear content width, and minimal competing controls.

TABLET LAYOUT
On tablet:

- Collapse the sidebar into a drawer.
- Allow the collection panel to collapse or become a separate view.
- Keep the editor readable without horizontal scrolling.
- Keep primary note actions visible and secondary actions in an overflow menu.

MOBILE LAYOUT
On mobile:

- Replace the sidebar with a menu or drawer.
- Show either collection view or editor view at a time.
- Keep New Note easy to reach.
- Keep save status visible.
- Make editor controls usable without horizontal scrolling.
- Use a compact toolbar with overflow behavior.
- Preserve navigation context.
- Keep touch targets at least 44 px where practical.
- Keep the selected note, save status, and primary action visible.
- Never place the note list and editor side by side if either becomes difficult to use.

REQUIRED SCREENS
Design all of these screens:

- Registration
- Sign in
- Dashboard
- Notes collection
- Note editor
- Notebook management
- Tag management
- Favorites
- Archive
- Trash
- Search results
- Permanent deletion confirmation dialog
- Restore feedback
- Loading states
- Empty states
- Error states
- Save failure state
- Unauthorized or missing-resource state

AUTHENTICATION SCREENS
Registration and sign-in must include labeled email and password inputs, password visibility control, validation feedback, loading state, disabled submit state, and navigation between registration and sign-in.

Use a centered form on mobile. On desktop, use a balanced split composition with the form on one side and a restrained product statement or abstract workspace preview on the other. Do not use a marketing hero, stock illustration, or oversized gradient.

Do not add password reset or social login.

DASHBOARD
The dashboard should help users continue writing immediately. Include Recent Notes, New Note, Favorites preview, notebook summary, Search access, Archive access, and Trash access.

Do not make the dashboard feel like an analytics dashboard.

Make Recent Notes the primary content. Use a strong New Note action and a compact secondary summary area. Avoid charts, metric cards, fake productivity statistics, and excessive empty panels.

NOTE LIST
Each note item should show title or "Untitled note", content preview, updated time, favorite indicator, notebook or tag context, and relevant state.

Use realistic sample content. Do not use repeated lorem ipsum.

Use a clear selected state with a subtle emerald edge or cyan focus treatment. Keep list rows visually calm and scannable. Do not turn every note into a large card.

NOTE EDITOR
Support:

- Empty title
- Empty content
- Headings
- Bold
- Italic
- Ordered and unordered lists
- Links
- Code formatting
- Comfortable reading width
- Clear cursor and focus behavior
- Keyboard-friendly toolbar
- Visible Unsaved Changes, Saving, Saved, and Save Failed states
- Notebook, tag, favorite, archive, and Trash actions

A failed save must never look like a successful save.

The title and editor content must visually dominate the toolbar. Keep secondary actions available but quiet. Use a small persistent save-status area rather than a large notification that interrupts writing.

ORGANIZATION
Notebook UI must support create, rename, delete, move note, remove notebook assignment, and an empty state.

Tag UI must support create, assign, remove, browse by tag, duplicate-tag validation, and accessible tag chips.

FAVORITES AND ARCHIVE
Favorites must support favorite, unfavorite, Favorites collection, and empty state.

Archive must support archive, Archived collection, unarchive, and clear distinction from Trash.

TRASH AND RECOVERY
Trash must include Trashed note list, Restore, Permanent Delete, confirmation dialog, empty state, and a clear explanation that permanent deletion cannot be undone.

When restoring a note, communicate that it returns to its previous notebook and state when available.

SEARCH
Search must include a global search entry point, input, clear action, results, result count, matching context, empty-result state, invalid-query state, loading state, and error state.

Normal search includes Active and Archived notes. Trashed notes must not appear in normal search results.

COMPONENT STATES
Create reusable variants for buttons, inputs, search fields, editor controls, note items, notebook rows, tag chips, status badges, toasts, dialogs, drawers, tabs, skeletons, empty states, and error states.

Define Default, Hover, Focus, Active, Disabled, Loading, Success, Error, and Destructive states where applicable.

INTERACTION RULES

- Creating a note opens the editor.
- Selecting a note updates the editor.
- Saving updates the save indicator.
- Failed saves preserve visible unsaved state.
- Archive removes a note from the Active collection.
- Trash removes a note from normal collections.
- Restore returns a note to its previous location when possible.
- Permanent Delete requires confirmation.
- Search results open the selected note.
- Navigation must not silently discard unsaved content.

ACCESSIBILITY
Target WCAG 2.2 AA quality.

Include semantic controls, keyboard navigation, visible focus indicators, correct dialog focus handling, accessible labels, accessible status announcements, sufficient contrast, input-associated errors, and save feedback that does not depend on color alone.

RESPONSIVE WORKFLOW
Verify the complete workflow at every supported viewport:

```text
Sign in -> Create note -> Edit note -> Autosave -> Organize -> Search -> Archive or Trash -> Restore
```

Responsive behavior must explicitly cover:

- Sidebar collapse and mobile navigation
- Notes list and editor transition
- Rich-text toolbar overflow
- Search input and result layout
- Notebook, tag, favorite, archive, and Trash actions
- Confirmation dialogs and bottom-sheet behavior
- Loading, empty, error, and save-failure states
- Keyboard interaction on desktop
- Touch interaction on mobile
- Long titles, long note content, and narrow screens

Avoid unusable controls, clipped editor content, unreadable text, hidden primary actions, and unnecessary horizontal scrolling.

DESIGN OUTPUT
Produce complete screen designs for desktop, laptop, tablet, and mobile; reusable responsive components; design tokens; interaction states; empty/loading/error/success states; deletion confirmation; autosave feedback; accessibility annotations; realistic sample data; and clear navigation flows.

For each screen, show the desktop and mobile composition side by side or as clearly labeled separate frames. Include breakpoint behavior notes for components that change layout.

QUALITY BAR
Do not produce isolated mockups. Every screen must use the same design system, follow the same spacing and typography rules, support the defined workflow, include realistic states, respect MVP scope, avoid invented features, and prioritize writing and content over decoration.

Before finalizing, review the design against these questions:

- Is the next primary action obvious?
- Is the editor the visual focus when writing?
- Can users understand the current note state immediately?
- Are the sidebar and collection panel quieter than the editor?
- Are dark surfaces separated clearly without excessive borders?
- Are empty, loading, failure, and destructive states designed with the same quality as the happy path?
- Does the interface still look polished without gradients or decorative imagery?
- Does every screen have a deliberate mobile layout instead of a shrunken desktop layout?
- Can the complete writing and recovery workflow be completed comfortably by touch on mobile?
```

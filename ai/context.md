# Agent Context

Note App is a JavaScript React/Vite frontend, Node.js/Express REST API, and MySQL modular monolith. The current implementation includes authentication expansion, notes, rich text autosave, trash and restore, tags, search, organization, responsive workspace integration, and sidebar counts.

The current implementation phase is Step 13I, Sidebar Note Counts. Authentication, authorization, browser verification, testing hardening, and deployment work still have tracked pending items. See `docs/06-implementation/progress.md`.

The approved architecture and security boundaries are defined in `docs/04-design/architecture.md` and `docs/04-design/security.md`.

`SPEC.md` is the concise product and architecture contract. `AGENTS.md` contains repository-level operating instructions. Detailed decisions belong in the relevant document under `docs/`.

Implementation slices live in `docs/06-implementation/vertical-slices/` and are intentionally extensible. User-profile functionality is outside the MVP unless an explicit scope decision changes `SPEC.md` and the requirements.

# Note App Specification

## Product

Note App is a secure personal note-taking web application. Users can create, edit, organize, search, archive, trash, and restore private notes.

## MVP Scope

- Registration, email verification, sign-in, sign-out, password reset, and Google/Facebook sign-in.
- Private rich-text notes with autosave and revision protection.
- Notebooks, tags, favorites, archive, trash, restore, and permanent deletion.
- Search across owned active and archived notes by title, content, and tags.
- Responsive browser access with accessible loading, empty, success, and failure states.
- A public privacy policy linked from account registration and authentication screens.

Profile management, sharing, collaboration, attachments, offline synchronization, AI features, native mobile applications, Telegram authentication, account deletion, and data export are outside the MVP.

## Architecture

The application is a JavaScript modular monolith:

```text
React/Vite frontend -> Node.js/Express REST API -> PostgreSQL
```

The frontend is not a security boundary. Every protected server read and write must authenticate the user and enforce ownership.

## Implementation Model

Implementation is organized into vertical slices under `docs/06-implementation/vertical-slices/`. The initial slices cover project foundation, authentication, notes, notebooks, tags, search, and cross-slice integration. This list is intentionally extensible: each newly approved feature may add a new slice document or extend the closest existing slice.

User-profile functionality is not an MVP slice and must not be added without an explicit scope decision.

## Security Contract

- Use Argon2id password hashing and server-managed opaque sessions.
- Use secure HTTP-only cookies, CSRF protection, and authentication rate limits.
- Validate and authorize all input on the server.
- Sanitize rich text and use parameterized database access.
- Never expose passwords, tokens, secrets, private note content, SQL, or stack traces.

## Documentation Map

- Product intent: `docs/01-planning/`
- Requirements: `docs/02-requirements/`
- Behavior analysis: `docs/03-analysis/`
- Technical design: `docs/04-design/`
- Engineering standards: `docs/05-development/`
- Implementation slices and status: `docs/06-implementation/`
- Verification: `docs/07-testing/`
- Operations: `docs/08-deployment/`

The detailed document in each directory is authoritative for its subject. This specification defines the product boundary and must be updated when the MVP scope or architecture changes.

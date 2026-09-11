# Requirements

## Authentication and Authorization

- Visitors can register and sign in with valid credentials.
- Each application account has one `users` record and may have multiple `auth_accounts` records, including local, Google, and Facebook methods.
- Local registration stores the Argon2id hash on the local auth account, never on the user record.
- Authenticated users can sign out and invalidate their session.
- Private resources require authentication and verified email where required.
- Every protected read and write is scoped to the authenticated user's ownership.
- Google and Facebook callbacks are server-validated; provider accounts cannot be merged by email alone.
- A verified social account with no matching user creates one user and one social auth account. An existing matching email requires explicit authenticated account linking and must never create a duplicate user.
- Unverified social email claims cannot create or locate an account automatically; explicit linking binds only the authenticated user's confirmed provider identity.
- Verification and password-reset tokens are single-use, expiring, rate-limited, and never exposed.

## Privacy and Public Access

- Visitors can open `/privacy-policy` without an account or session.
- Registration provides a visible link to the privacy policy before account creation.
- The privacy policy accurately describes account data, workspace data, necessary cookies, service providers, operational logs, security controls, retention limitations, and the absence of self-service account deletion and export in the MVP.
- The privacy policy does not claim end-to-end or client-side encryption while note content is stored server-side.

## Notes and Organization

- Users can create blank or populated notes and edit supported rich text.
- Notes have title, content, timestamps, owner, and Active, Archived, or Trashed state.
- Autosave groups edits, reports its state, retains failed edits, and prevents stale writes.
- Users can create notebooks, move notes, create and assign tags, favorite notes, archive notes, trash notes, restore notes, and permanently delete trashed notes.

## Search and UI

- Search covers owned Active and Archived notes by title, content, and tags.
- Trashed notes are excluded from normal search.
- The application provides dashboard navigation, collection views, responsive layouts, keyboard behavior, and clear loading, empty, success, and failure states.

## Validation and Safety

- External input is validated before processing.
- Unauthorized or unavailable resources return safe not-found behavior.
- Failed operations never claim success or leave unintended partial state.

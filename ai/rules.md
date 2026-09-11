# Agent Rules

- Follow `AGENTS.md`, `SPEC.md`, and the applicable documents under `docs/`; resolve conflicts in favor of the more specific document.
- Read the relevant requirements, acceptance criteria, design, and implementation-slice documents before making product or architecture changes.
- Keep frontend, API, application, and data-access responsibilities separate.
- Enforce authenticated ownership on every protected server operation.
- Use versioned migrations and transactions for related database changes.
- Never log or return passwords, tokens, secrets, private note content, SQL, stack traces, or another user's resource information.
- Add tests for authorization, rich-text safety, autosave conflicts, and data-loss behavior.
- Keep work within MVP scope and update the applicable implementation slice and progress evidence when work starts or finishes.
- Add new approved features as vertical-slice documents or extend the closest existing slice; do not assume the current slice list is final.
- Do not add user-profile functionality or other out-of-scope capabilities without an explicit scope decision.

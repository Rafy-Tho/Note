# Risks

## Risk Rating

Probability and impact are rated Low, Medium, or High. High-impact security, privacy, reliability, and data-loss risks require attention even when probability is low.

## Risk Register

| ID | Risk | Probability / impact | Mitigation | Contingency |
| --- | --- | --- | --- | --- |
| R-01 | Scope expands beyond the MVP. | High / High | Enforce the scope-change policy and P0/P1 priorities. | Pause lower-priority work and re-baseline the MVP. |
| R-02 | Rich-text editing becomes too complex or insecure. | High / High | Use a mature editor, limit formatting, sanitize content, and test paste/rendering. | Replace the editor or reduce formatting support. |
| R-03 | Autosave loses recent user changes. | Medium / High | Track save state, prevent stale writes, handle failures, and test network interruptions. | Preserve the current session state and clearly show unsaved work. |
| R-04 | A user accesses another user's resources. | Medium / High | Enforce server-side ownership checks on every protected operation. | Block affected functionality and fix the authorization defect before release. |
| R-05 | Rich-text content enables XSS. | Medium / High | Validate and sanitize content before storage or rendering; test malicious input. | Disable or restrict unsafe rendering until fixed. |
| R-06 | Search becomes slow as data grows. | Medium / Medium | Use suitable indexes, filtered queries, realistic performance tests, and pagination. | Optimize the measured bottleneck or evaluate dedicated search later. |
| R-07 | Autosave creates excessive requests. | Medium / Medium | Debounce changes, skip identical content, and monitor save frequency. | Increase the save interval or revise persistence behavior. |
| R-08 | Users permanently delete information accidentally. | Medium / High | Use Trash before permanent deletion and require clear confirmation. | Restore from Trash when possible; document limitations clearly. |
| R-09 | Database failure causes downtime or data loss. | Low-Medium / High | Use reliable storage, backups, tested recovery, and safe migrations. | Execute the documented recovery procedure. |
| R-10 | Authentication or session handling is insecure or unreliable. | Medium / High | Use established authentication practices and test registration, sign-in, sign-out, and expiry behavior. | Disable affected flows until corrected. |
| R-11 | The application is difficult to use on mobile or during failures. | Medium / Medium | Test core journeys on supported screen sizes and provide clear loading, error, and empty states. | Fix core usability issues before adding features. |
| R-12 | Requirements remain ambiguous and cause rework. | Medium / High | Resolve business rules before implementation and maintain traceability. | Pause affected work and clarify the requirement. |
| R-13 | Dependencies introduce vulnerabilities or breaking changes. | Medium / Medium | Evaluate, pin, update, and test important dependencies. | Roll back or replace the affected dependency. |
| R-14 | Future extensibility adds unnecessary architecture. | Medium / Medium | Design reasonable boundaries without building future features early. | Remove abstractions that do not provide current value. |
| R-15 | OAuth callback validation or redirect configuration permits account takeover. | Medium / High | Use provider subjects, one-time callback state, strict redirect URIs, server-side code exchange, and provider-claim validation. | Disable the affected provider until the integration is corrected. |
| R-16 | Verification messages are delayed, abused, or not delivered. | Medium / High | Use Resend, rate limit requests, use expiring single-use tokens, and provide safe retry feedback. | Keep the account restricted and investigate delivery without weakening verification. |
| R-17 | Automatic provider/email matching merges unrelated accounts. | Low / High | Require authenticated provider linking and never merge solely by email address. | Block linking and manually review affected accounts. |
| R-18 | Password reset tokens or sessions are mishandled and enable account takeover. | Medium / High | Hash single-use tokens, expire and rate limit them, return generic request responses, and revoke all sessions after reset. | Disable reset flow and require verified support recovery until corrected. |

## Risk Management Process

Risks should be reviewed at each SDLC phase:

```text
Identify
  ↓
Assess
  ↓
Mitigate
  ↓
Implement controls
  ↓
Test
  ↓
Monitor and review
```

The risk register should be updated when requirements, architecture, dependencies, deployment conditions, or observed failures change.

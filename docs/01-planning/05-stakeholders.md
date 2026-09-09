# Stakeholders

## Stakeholder Summary

| Stakeholder | Main interest | Responsibilities or concerns | Influence |
| --- | --- | --- | --- |
| End users | Simple and reliable note-taking | Usability, privacy, search, autosave, recovery, responsiveness | High |
| Product owner | Product value and scope | Vision, priorities, MVP decisions, scope changes | High |
| Development team | Correct and maintainable implementation | Architecture, code, security, APIs, database, documentation | High |
| QA and testing | Verifiable product quality | Functional, security, recovery, regression, and usability testing | High |
| Operations | Reliable production service | Deployment, secrets, monitoring, backups, recovery, availability | Medium-High |
| Service providers | Reliable external services | Availability, cost, limits, compatibility, and data protection | Medium |
| Privacy and accessibility interests | Responsible product use | Data handling, retention, accessibility, and inclusive behavior | Medium |

## Primary Needs

Stakeholder needs are prioritized in this order:

1. Protect user data and privacy.
2. Provide reliable note creation and editing.
3. Keep common workflows simple.
4. Make the system testable and maintainable.
5. Preserve reasonable room for future features without over-engineering.

## Responsibility Model

This may be a solo project, but responsibilities remain conceptually separate:

| Area | Responsible role |
| --- | --- |
| Product direction and scope | Product owner |
| Requirements | Product owner and development team |
| Architecture and implementation | Development team |
| Security and privacy controls | Development team and operations |
| Testing and release verification | QA and testing |
| Deployment and monitoring | Operations |
| Maintenance and incident response | Development team and operations |

One person may perform multiple roles.

## Decision Principles

When stakeholder needs conflict:

1. Protect user data first.
2. Protect the core writing workflow.
3. Prefer the simplest solution that satisfies the requirements.
4. Use measurable requirements where possible.
5. Defer non-essential functionality instead of expanding the MVP.

## Stakeholder Success

The project meets stakeholder expectations when:

- Users can securely create, find, organize, and recover notes.
- Important changes are reliably persisted.
- Common failures are understandable and recoverable.
- The MVP remains within its approved scope.
- The system can be tested, deployed, monitored, and maintained.

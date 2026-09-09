# Constraints

Constraints define the conditions within which the application must be planned and built.

## Constraint Summary

| Constraint | Effect | Planning response |
| --- | --- | --- |
| Limited time | Advanced features could delay the MVP. | Prioritize P0 work and defer lower priorities. |
| Limited resources | One person may perform several roles. | Prefer simple architecture, automation, and clear documentation. |
| MVP scope | Collaboration, AI, sharing, native apps, and offline-first behavior are excluded. | Enforce scope boundaries and review changes. |
| Web application | The product runs in modern browsers. | Test supported browsers and responsive layouts. |
| Technology direction | Initial direction is React, Node.js, Express.js, PostgreSQL, REST, and JavaScript. | Revisit choices only when requirements justify it. |
| Technical complexity | Complex infrastructure increases maintenance cost. | Avoid microservices, multiple databases, and premature optimization. |
| Security | Notes are private user data. | Treat authentication, authorization, validation, and safe rich-text handling as MVP requirements. |
| Data ownership | Users must only access their own resources. | Enforce ownership on the server for every protected operation. |
| Data persistence | Notes and organization data must survive normal sessions and failures. | Use reliable persistent storage, backups, and recovery procedures. |
| Rich text | Rich text adds serialization, rendering, and XSS concerns. | Limit formatting and sanitize content safely. |
| Autosave | Frequent or out-of-order saves can cause load or data loss. | Define controlled saving, ordering, failure handling, and feedback. |
| Performance | Slow lists, search, or editing reduce trust and usability. | Measure important workflows and use pagination, indexes, and efficient requests where needed. |
| Dependencies | Libraries and services can introduce security, license, or maintenance risk. | Evaluate dependencies before adoption and test updates. |
| Cost | Infrastructure resources may be limited. | Prefer simple, low-cost services without compromising security or recovery. |
| Future extensibility | Designing for every future feature can overcomplicate the MVP. | Build clear boundaries without implementing future features early. |

## Initial Technology Direction

```text
React frontend
      ↓
REST API
      ↓
Node.js / Express.js backend
      ↓
PostgreSQL database
```

These are planning assumptions, not final design decisions. The Design phase will confirm them against the approved requirements.

## Constraint Principles

- Protect the MVP before adding optional features.
- Do not remove essential security controls to save time.
- Prefer explicit trade-offs over hidden complexity.
- Measure real problems before optimizing.
- Reassess constraints when usage, infrastructure, or scope changes.

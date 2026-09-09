# Non-Functional Requirements

Non-functional requirements define the quality, security, reliability, usability, and operational expectations of the MVP.

## Measurement Rules

- A requirement marked P0 is required for MVP release.
- Performance measurements use the test environment and dataset defined in the Test Strategy.
- Unless stated otherwise, response-time targets are measured at the API boundary and exclude client network latency.
- The Design, Testing, Deployment, and Maintenance documents provide the implementation and verification details.

## Performance and Capacity

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-01 | P0 | Core interactions shall provide immediate visible feedback and shall not block normal editing. |
| NFR-02 | P0 | Normal authenticated API operations shall meet a p95 response time of 500 ms or less under the defined MVP test load. |
| NFR-03 | P0 | Normal searches shall meet a p95 response time of 500 ms or less under the defined MVP note dataset. |
| NFR-04 | P0 | Opening an individual note shall meet a p95 API response time of 500 ms or less under the defined MVP test load. |
| NFR-05 | P0 | The client shall not request unchanged data or persist unchanged note content. |
| NFR-06 | P0 | Autosave shall group rapid edits and shall not generate one request per keystroke. |
| NFR-07 | P1 | Large note collections shall use server-side filtering, pagination, or an equivalent approach instead of loading all notes unnecessarily. |

## Security

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-08 | P0 | Passwords shall be stored using a secure one-way password-hashing method and shall never be logged or returned to clients. |
| NFR-09 | P0 | The server shall enforce authentication and authorization for every protected operation. |
| NFR-10 | P0 | Notes, notebooks, tags, favorites, and other private resources shall be isolated by owning user. |
| NFR-11 | P0 | Request bodies, query parameters, route parameters, and user content shall be validated before processing or persistence. |
| NFR-12 | P0 | Rich-text content shall be sanitized or safely rendered so user-controlled markup cannot execute as application code. |
| NFR-13 | P0 | The application shall address applicable injection, XSS, broken-access-control, session, CSRF, and unsafe-content risks. |
| NFR-14 | P0 | Secrets and environment-specific credentials shall not be hard-coded in source code. |
| NFR-15 | P0 | Production traffic shall use HTTPS. |
| NFR-16 | P0 | Production error responses shall not expose secrets, stack traces, SQL, internal paths, or sensitive infrastructure details. |

## Reliability and Data Integrity

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-17 | P0 | The application shall distinguish Unsaved Changes, Saving, Saved, and Save Failed states. |
| NFR-18 | P0 | A failed operation shall be detected, reported, and prevented from leaving an unintended partial state. |
| NFR-19 | P0 | User, note, notebook, tag, and association relationships shall remain consistent after successful operations. |
| NFR-20 | P0 | A temporary network failure shall not unnecessarily destroy the current editor state during the session. |
| NFR-21 | P0 | Normal deletion shall use Trash, and permanent deletion shall require intentional confirmation. |
| NFR-22 | P1 | The deployment shall define an availability target before production release. |
| NFR-23 | P1 | Failure of a non-critical dependency shall produce an error or degraded feature rather than crash the entire application. |

## Maintainability and Extensibility

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-24 | P1 | The backend shall use a structure that can handle reasonable growth without requiring a complete rewrite. |
| NFR-25 | P1 | Database access shall use appropriate constraints, indexes, and filtering for expected MVP data. |
| NFR-26 | P1 | Core note management shall remain separated from future sharing, collaboration, and AI features. |
| NFR-27 | P0 | Frontend, API, application logic, and persistence responsibilities shall remain clearly separated. |
| NFR-28 | P0 | UI, client state, API communication, business logic, validation, authorization, and persistence concerns shall not be unnecessarily mixed. |
| NFR-29 | P0 | The project shall use consistent naming, formatting, file organization, API, error-handling, and database conventions. |
| NFR-30 | P1 | Shared functionality shall be reusable when reuse improves maintainability without creating unnecessary abstractions. |
| NFR-31 | P0 | Backend errors shall use a consistent structure that the client can handle predictably. |
| NFR-32 | P1 | Important behavior, decisions, and operational procedures shall be documented and updated when they change. |

## Testability

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-33 | P0 | Important functional behavior shall have automated unit, integration, API, component, or end-to-end coverage as appropriate. |
| NFR-34 | P0 | Authentication, authorization, ownership isolation, and protected routes shall have automated security tests. |
| NFR-35 | P0 | Autosave shall be tested for rapid edits, failures, network interruptions, server errors, and overlapping saves. |
| NFR-36 | P1 | Tests shall be repeatable and shall isolate unpredictable external dependencies where practical. |

## Usability, Accessibility, and Compatibility

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-37 | P0 | The core workflow from opening the application to writing and saving a note shall require no unnecessary steps. |
| NFR-38 | P0 | Important operations shall provide visible and understandable loading, success, failure, and empty states. |
| NFR-39 | P1 | Equivalent actions shall use consistent labels, controls, confirmation patterns, and feedback. |
| NFR-40 | P0 | The application shall remain usable on desktop, laptop, tablet, and mobile browser screen sizes. |
| NFR-41 | P1 | Core navigation, forms, dialogs, and note-management actions shall be usable with a keyboard. |
| NFR-42 | P1 | Interactive controls shall use semantic elements and meaningful accessible labels. |
| NFR-43 | P1 | Focus shall remain predictable when opening dialogs, changing views, and using editor controls. |
| NFR-44 | P1 | Important states and errors shall not be communicated through color or visual styling alone. |
| NFR-45 | P0 | The application shall support the modern browser versions selected in the Test Strategy. |
| NFR-46 | P0 | Responsive layouts shall not make the core note workflow unusable at supported screen sizes. |

## Observability and Data Operations

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-47 | P1 | The backend shall produce structured logs for important authentication, API, database, autosave, and unexpected-error events. |
| NFR-48 | P1 | Production failures shall be detectable through logs, monitoring, or an equivalent alerting mechanism. |
| NFR-49 | P0 | Logs shall not unnecessarily contain passwords, tokens, secrets, API keys, or private note content. |
| NFR-50 | P0 | User notes and related data shall be stored in persistent storage. |
| NFR-51 | P1 | Production data shall have documented backup frequency, retention, and protection before release. |
| NFR-52 | P1 | A documented backup recovery procedure shall exist and shall be tested before production release. |

## Dependencies and Deployment

| ID | Priority | Requirement |
| --- | --- | --- |
| NFR-53 | P1 | Important dependencies shall be evaluated for security, maintenance, compatibility, documentation, adoption, and license. |
| NFR-54 | P1 | Dependency updates shall be tested before production use. |
| NFR-55 | P0 | Development and production environments shall be separated so development cannot unintentionally use production data or services. |
| NFR-56 | P0 | Environment-specific configuration shall be supplied through configuration or secret-management mechanisms outside application source code. |

## Highest-Priority Quality Bar

The MVP must protect user data, preserve editor state during normal failures, prevent false save success, remain responsive, and support repeatable security and autosave tests.

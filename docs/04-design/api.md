# API Design

The API is versioned under `/api/v1` and uses consistent JSON success and error shapes. Routes authenticate first, validate input second, enforce ownership third, apply business rules, then read or write through repositories.

API errors must be safe, actionable, and free of secrets, SQL, stack traces, private content, and cross-user resource information. Missing and unauthorized resources use safe not-found behavior.

Notes, authentication, organization, tags, search, and workspace endpoints must preserve the requirements and acceptance behavior. API changes require updates to this document and affected implementation evidence.

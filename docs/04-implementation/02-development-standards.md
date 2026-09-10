# Development Standards

## Purpose

This document defines the minimum standards for implementing and reviewing MVP code.

## Code Structure

- Keep frontend, API, application, and data-access responsibilities separate.
- Organize code by feature where this improves ownership and navigation.
- Implement user-facing work as vertical feature slices: backend behavior, API contract, frontend behavior, integration states, and tests belong to the same slice.
- Keep business rules in the application or backend layer.
- Keep database queries out of UI components.
- Reuse shared validation and error-handling behavior.
- Use the hybrid backend structure: application infrastructure is layered under `app`, `config`, `common`, and `db`, while product behavior is organized under feature modules.
- Keep route registration in the app composition layer and keep feature routes focused on middleware/controller wiring.
- Keep controllers dependent on services, services dependent on repositories or shared infrastructure, and repositories dependent on database helpers.
- Do not import a feature repository directly from another feature; expose cross-feature behavior through an application service or explicit shared contract.
- Avoid circular dependencies between feature modules; dependency wiring belongs in the app composition root.
- Use the frontend hybrid structure: `app` owns composition and infrastructure, `features` own product behavior, and shared directories contain only genuinely reusable code.
- Keep frontend pages thin; route-level pages compose layouts and feature components without owning API calls or business rules.
- Keep feature-specific API operations in the owning feature's `services` directory. Shared request infrastructure belongs in `lib`.
- Shared frontend components, hooks, utilities, and constants must not import feature internals.
- Do not add a global state store without a demonstrated requirement that React context and React Query cannot satisfy.

## Coding Rules

- Use consistent naming and formatting.
- Validate all external input on the server.
- Do not trust client-provided ownership or user identifiers.
- Do not log passwords, tokens, secrets, or private note content.
- Keep functions and modules focused.
- Avoid abstractions that do not solve a current requirement.

## Database and API Rules

- All schema changes use versioned migrations.
- Destructive migrations require review and a recovery plan.
- API responses follow the format in `03-api.md`.
- Protected queries include the authenticated user's ownership condition.
- Related changes use appropriate transactions.
- API changes update the API Design document and affected acceptance criteria.

## Testing Rules

Each feature should include the tests needed for its risk and behavior:

- Unit tests for business rules.
- API or integration tests for persistence and authorization.
- Component tests for important UI behavior.
- End-to-end tests for core user journeys.
- Security tests for ownership and protected routes.
- Autosave tests for failures, retries, and stale revisions.

## Work and Review Rules

- Keep work limited to one feature or fix where practical.
- Do not mark a feature complete when only its backend or frontend is complete.
- Build the backend behavior before the frontend integration within each slice, then verify the complete user workflow.
- Link implementation work to requirement or acceptance IDs.
- Review security and data-loss impact before merging.
- Run formatting, linting, and relevant tests before review.
- Do not merge code with failing required checks.

## Definition of Done

A feature is complete when:

- Its requirements and acceptance criteria are satisfied.
- Input validation and server-side authorization are implemented.
- Success, loading, empty, and failure states are handled.
- Relevant automated tests pass.
- Responsive and keyboard behavior is checked where applicable.
- No known critical security, data-loss, or regression issue remains.
- Related documentation and traceability are updated.

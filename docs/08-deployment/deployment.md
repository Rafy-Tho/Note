# Deployment

## Required Preparation

- Configure production environment variables and secret management.
- Enable HTTPS and secure cookie settings.
- Set `CORS_ORIGIN` to the exact frontend origin or comma-separated origin allowlist; never use `*` with credentialed cookies.
- Set `TRUST_PROXY` to `false` or the known numeric proxy hop count when applicable. Do not use unrestricted `true` proxy trust in production.
- Set `BACKEND_INSTANCE_COUNT` accurately. A production deployment with more than one instance must use `RATE_LIMIT_STORE=shared` and inject separate shared `api` and `auth` rate-limit store adapters; process-local memory storage is rejected.
- Run versioned database migrations safely.
- Configure structured, redacted logging and monitoring.
- Configure backups, retention, and tested recovery.
- Document deployment, rollback, and migration recovery procedures.
- Record the release result and unresolved risks.

## Completion Gate

The MVP can be deployed, monitored, rolled back, and recovered using the documented procedures.

Deployment begins only after testing hardening and critical security/data-loss issues are complete.

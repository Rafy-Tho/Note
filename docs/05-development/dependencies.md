# Dependencies

Runtime dependencies include Express, PostgreSQL client libraries, Argon2, Helmet, CORS, HPP, compression, CSRF protection, rate limiting, provider validation, and the mail adapter. The backend uses focused custom validation and a structured logger rather than a generic sanitizer or a second logging framework. Frontend dependencies include React, React Router, Vite, React Query, and Tiptap. Development dependencies include Vitest, Supertest, Playwright, ESLint, Prettier, and node-pg-migrate.

Secrets and environment values are supplied through environment configuration and are never committed. Dependency and license decisions must be reviewed before adding new packages.

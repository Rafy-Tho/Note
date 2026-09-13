# Dependencies

Runtime dependencies include Express, the MySQL `mysql2` client, Argon2, Helmet, CORS, HPP, compression, CSRF protection, rate limiting, provider validation, and the `nodemailer` SMTP mail adapter used to deliver authentication email through Hostinger. The backend uses focused custom validation and a structured logger rather than a generic sanitizer or a second logging framework. Frontend dependencies include React, React Router, Vite, React Query, and Tiptap. Development dependencies include Vitest, Supertest, Playwright, ESLint, and Prettier. Versioned migrations run through the backend's own `src/db/migrate.js` runner built on `mysql2`.

Secrets and environment values are supplied through environment configuration and are never committed. Dependency and license decisions must be reviewed before adding new packages.

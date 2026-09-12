# Note App

Note App is a secure personal note-taking application built with React, Express, and MySQL.

## Repository

`frontend/` and `backend/` are independent npm projects. Each has its own `package.json`, `package-lock.json`, `node_modules/`, and environment files; there is no root package or workspace.

- `frontend/` React/Vite application, including Playwright browser journeys in `frontend/e2e/`
- `backend/` Express API and MySQL migrations
- `docs/` product, technical, implementation, testing, and deployment documentation
- `SPEC.md` concise product and technical contract
- `AGENTS.md` repository instructions for development agents
- `ai/` agent context, rules, and workflow

## Development

Install and run each app from its own directory:

```text
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

```text
cd frontend
npm install
cp .env.example .env
npm run dev
```

Start with `SPEC.md`, then use the documentation map in `docs/` for detail.

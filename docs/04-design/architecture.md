# Architecture

Use a modular monolith:

```text
React/Vite frontend -> Node.js/Express REST API -> PostgreSQL
```

Frontend pages compose features. Feature services own feature API operations. Backend route registration belongs to the application composition layer. Controllers depend on services, services depend on repositories or shared infrastructure, and repositories depend on database helpers.

The frontend is not a security boundary. Business rules, authentication, authorization, validation, transactions, and ownership checks belong on the server.

Frontend visual tokens, responsive behavior, component states, and accessibility rules are defined in `design-system/DESIGN.md`. Keep implementation values synchronized with `frontend/src/styles/globals.css`.

The frontend uses `app`, `features`, `pages`, and shared `components`, `hooks`, `lib`, `utils`, `constants`, and `styles`. The backend uses `app`, `config`, `common`, `db`, and feature modules under `modules`.

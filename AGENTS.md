# Repository Guidelines

## Project Structure & Module Organization
This repository contains a local PostgreSQL client built with Vue 3, TypeScript, Element Plus, Monaco Editor, Express, and `pg`.

- `src/` contains the frontend. Use `components/` for reusable Vue components, `views/` for routed pages, `composables/` for shared state, and `types/` for interfaces.
- `server/` contains the Express API. Route handlers live in `server/routes/`; database setup and pool management live in `db.ts` and `poolManager.ts`.
- `supabase/` stores local Supabase configuration and snippets.
- `articles/` contains documentation and images. Do not mix product source code into this folder.

## Build, Test, and Development Commands
Run commands from the repository root.

- `npm install` installs frontend, server, and tooling dependencies from `package-lock.json`.
- `npm run dev` starts both Vite and the Express API using `concurrently`.
- `npm run dev:client` starts only the Vite frontend at `http://localhost:5173`.
- `npm run dev:server` starts only the API server with `tsx watch`.
- `npm exec vue-tsc -- --noEmit` runs a TypeScript type check.
- `npm exec vite -- build` creates a production frontend build.

The app expects a local PostgreSQL service for connection storage.

## Coding Style & Naming Conventions
Use TypeScript for new frontend and server code. Follow the existing Vue SFC style with 2-space indentation. Name Vue components in `PascalCase`; name composables with `useX.ts`; use `camelCase` for variables, functions, and route helpers. Keep route files focused by resource, for example `connections.ts` and `query.ts`.

No ESLint or Prettier config is present, so match surrounding formatting and avoid broad style-only rewrites.

## Testing Guidelines
No automated test runner is configured. For new tests, add project-local tooling and use names such as `*.test.ts` or `*.spec.ts`. Prefer colocating tests near the code they cover, and document any new `npm test` script in `package.json`.

Before submitting changes, run `npm exec vue-tsc -- --noEmit` and manually verify the affected flow with `npm run dev`.

## Commit & Pull Request Guidelines
This checkout does not include Git history, so use concise imperative commit messages such as `feat(client): add saved query tabs` or `fix(server): validate connection payloads`.

Pull requests should describe the user-visible change, list validation commands, note database or configuration changes, and include screenshots for UI work.

## Security & Configuration Tips
Do not commit database passwords, local connection secrets, or generated dependency folders such as `node_modules/`. Keep local environment details out of source files unless they are safe defaults or sanitized examples.

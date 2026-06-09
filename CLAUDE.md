# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start both frontend (Vite) and backend (Express)
npm run dev

# Start frontend only (port 5173, proxied /api → localhost:3001)
npm run dev:client

# Start backend only (Express on port 3001 with tsx watch)
npm run dev:server

# Type check frontend (Vue + TypeScript)
npm exec vue-tsc -- --noEmit

# Type check project TypeScript
npx tsc --noEmit --pretty false

# Build production frontend bundle
npm exec vite -- build
```

## Architecture

### Overview
A local PostgreSQL management tool with a Vue 3 frontend and Express backend. Connection configurations are persisted in a local JSON file (`data/connections.json`), managed entirely by the backend. The frontend does not store any connection credentials.

### Backend (Express + node-postgres)

- **server/index.ts** - Express entry point. Sets up CORS, JSON parsing, serves static files from `dist/`, and mounts `/api` routes on port 3001.
- **server/dataStore.ts** - Reads/writes connection configurations to `data/connections.json`. Provides `listConnections`, `getConnection`, `addConnection`, `updateConnection`, `deleteConnection`.
- **server/poolManager.ts** - Manages `pg.Pool` instances with a `Map<string, pg.Pool>` cache keyed by `${connectionId}:${database}:${sha256(config)}`. Provides `getPool()`, `getDatabases()`, `testConnection()`, `removePool()`.
- **server/routes/connections.ts** - Full CRUD endpoints (`GET/POST/PUT/DELETE /connections`) backed by `dataStore`. Also provides `/connections/test` and `/connections/:id/test`.
- **server/routes/query.ts** - Query endpoints: `/api/databases`, `/api/schemas`, `/api/tables`, `/api/columns`, `/api/query`. All look up the connection config from `dataStore` by `connectionId`. The `/query` endpoint enforces read-only SQL via `isReadOnlyQuery()`.

### Frontend (Vue 3 + Vue Router + Element Plus)

- **src/router.ts** - Hash history router with nested routes:
  - `/` → Home (ConnectionManager)
  - `/connection/:connectionId` → ServerLayout → Query
  - `/connection/:connectionId/database/:database` → ServerLayout → DatabaseLayout → Query
  - `/connection/:connectionId/database/:database/schema/:schema` → ServerLayout → DatabaseLayout → Query
  - `/connection/:connectionId/database/:database/schema/:schema/table/:table` → ServerLayout → DatabaseLayout → TableView
  - `/connection/:connectionId/database/:database/table/:table` → redirects to `schema/public/table/:table`
- **src/composables/useConnections.ts** - Module-level singleton. Holds `connections` and `activeConnection` refs. All CRUD operations call the backend API (`/api/connections/*`). No localStorage usage.
- **src/composables/useDatabase.ts** - Module-level singleton. Holds `databases`, `schemas`, `tables`, `loading` refs. `activeDatabase` and `activeSchema` are computed from `route.params`. Provides `fetchDatabases`, `fetchSchemas`, `fetchTables`, `fetchColumns`, `fetchData` (paginated table data with optional WHERE conditions).
- **src/composables/useQuery.ts** - SQL execution state (`loading`, `result`, `error`) with `execute(sql)` that POSTs to `/api/query`.
- **src/views/ServerLayout.vue** - Watches `route.params.connectionId` and `route.params.database` to trigger `ensureConnection` → `fetchDatabases` → `fetchSchemas`. Watches `connectionId` + `database` + `schema` to trigger `fetchTables`.
- **src/components/layout/AppLayout.vue** - Main layout with resizable sidebar + tabbed main area. The first tab "SQL 编辑器" is fixed; additional tabs are opened dynamically when a table is selected. Tabs are keyed by `${connectionId}/${database}/${schema}/${table}`. Tab state is ephemeral (not persisted).
- **src/components/browser/TableData.vue** - Displays paginated table data with server-side sorting and per-column search (exact or fuzzy ILIKE). Resets page/sort/search when `schemaName` or `tableName` props change.

### Key Patterns

- **Module-level singletons**: `connections`, `tables`, `databases`, `schemas`, `loading` refs are defined outside `use*()` functions so all component instances share the same reactive state.
- **Backend owns connection data**: Connection configurations are stored in `data/connections.json` on the server. The frontend calls API endpoints for all CRUD operations.
- **Read-only enforcement**: `server/routes/query.ts` uses `isReadOnlyQuery()` to strip comments/string literals, scan for forbidden DML/DDL keywords, and whitelist only `SELECT`, `WITH`, `EXPLAIN`, `SHOW`, `DESCRIBE`, `TABLE`.
- **Route-driven data loading**: `ServerLayout` uses `watch` with `immediate: true` on `route.params` to load databases/schemas/tables. This means navigating the URL directly loads the correct state.
- **Dark theme**: Hardcoded in `App.vue` — `document.documentElement.classList.add('dark')` on mount, with custom CSS overrides for Element Plus components.

### API → Data Flow

1. User creates/edits a connection → frontend POST/PUT to `/api/connections` → backend writes to `data/connections.json`
2. Frontend navigates to `/connection/:id/database/:db`
3. `ServerLayout` watcher triggers → `fetchDatabases` / `fetchSchemas` / `fetchTables`
4. Backend receives `connectionId`, looks up credentials from `dataStore`, gets or creates a `pg.Pool`
5. Table data queries are built dynamically in `useDatabase.fetchData` with `quoteIdentifier` for SQL injection safety

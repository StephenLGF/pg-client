# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (both frontend and backend)
npm run dev

# Start frontend only
npm run dev:client

# Start backend only
npm run dev:server
```

## Architecture

### Overview
This is a local PostgreSQL management tool built with Vue 3 + Express. The frontend connects to an Express backend that manages database connections and executes queries.

### Backend (Express + node-postgres)
- **server/index.ts** - Entry point, initializes config database and starts Express server on port 3001
- **server/db.ts** - Config database connection pool (connects to Supabase local Postgres on port 54322) and `db_connections` table initialization
- **server/poolManager.ts** - Dynamic connection pool management with `Map<string, pg.Pool>` cache keyed by `${connectionId}:${database}`
- **server/routes/connections.ts** - CRUD endpoints for database connections (`/api/connections/*`)
- **server/routes/query.ts** - Query endpoints (`/api/databases`, `/api/tables`, `/api/columns`, `/api/query`)

### Frontend (Vue 3 + Vue Router + Element Plus)
- **src/router.ts** - Vue Router with hash history, nested routes:
  - `/` → Home (ConnectionManager)
  - `/server/:server` → ServerLayout → Query
  - `/server/:server/database/:database` → ServerLayout → DatabaseLayout → Query
  - `/server/:server/database/:database/table/:table` → ServerLayout → DatabaseLayout → TableView
- **src/composables/useConnections.ts** - Module-level singleton for connection state management
- **src/composables/useDatabase.ts** - Module-level singleton for database/table state management
- **src/views/ServerLayout.vue** - Handles connection establishment and database/table loading via `watch`
- **src/views/DatabaseLayout.vue** - Empty wrapper for nested routing
- **src/components/browser/TableData.vue** - Displays table data with foreign key linking
- **src/components/browser/SchemaTree.vue** - Two-column database/table browser with search

### Key Patterns
- **Module-level singletons**: `connections`, `tables`, `databases` refs are defined outside `use*()` functions to ensure all components share the same state
- **Route-based state**: `activeDatabase` and `activeTable` are computed from `route.params` in `useDatabase()`
- **Watch-based loading**: `ServerLayout` uses `watch` with `immediate: true` to load data when route changes

### Config Database
- Stored in Supabase local Postgres (127.0.0.1:54322)
- Table: `db_connections` - stores connection configurations
- Default connection "Supabase 本地" is auto-created on startup

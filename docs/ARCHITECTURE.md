# Study OS Architecture

This document describes the current runtime architecture and the migration boundary.

```text
Browser
  └── React + TypeScript (Vite :5000)
        ├── Board / nested task rows
        ├── Calendar view
        ├── Near-due queue
        ├── Browser Notification API
        └── fetch('/api/...') ── Vite proxy ──┐
                                             │
                             TypeScript API (:5001)
                                             │
                                      SQLite database
                                  data/study_os.db
```

## Design language

- Neutral dark background and compact cards keep the board dense.
- Purple marks structure and categories.
- Teal marks completion and progress.
- Amber marks active work and high priority.
- Red marks due or attention states.

## Data flow

1. `App` loads `/api/state` when the page opens.
2. User actions call the typed helpers in `src/api.ts`.
3. The TypeScript API validates the request and writes SQLite.
4. `App` reloads the state so the UI always reflects persisted data.
5. Dragging is limited to the six-dot grab handle and only reorders compatible siblings.

## Runtime Ports

| Service | Development | Test stack | Responsibility |
| --- | ---: | ---: | --- |
| Vite | 5000 | 5100 | React UI and `/api` proxy |
| TypeScript API | 5001 | 5101 | HTTP routes and SQLite persistence |

`npm run dev` starts the development ports. Test commands start their own stack on the test ports and never reuse a running server.

## Ownership Map

- `src/App.tsx`: UI state, views, forms, notifications, and user interactions.
- `src/api.ts`: typed frontend calls and task-tree helpers.
- `src/types.ts`: frontend data contracts.
- `server/index.ts`: API routes, SQLite schema, ordering, completion, reports, and import/export.
- `vite.config.ts`: frontend server and `/api` proxy configuration.
- `testing/support/start-stack.ts`: isolated test server and temporary database setup.
- `app.py`: legacy Flask implementation retained as a historical/reference implementation; it is not part of the active runtime.

## Request Flow

```text
App.tsx
  -> src/api.ts
  -> Vite /api proxy
  -> server/index.ts
  -> SQLite
```

When debugging a feature, start at the visible symptom, then follow this flow from right to left or left to right. Do not edit both `server/index.ts` and `app.py` unless intentionally changing the rollback implementation too.

## Data Safety

The active API opens `data/study_os.db` in place. Before changing schema or migration code:

1. Use the app's **Export** action, or copy `data/study_os.db`.
2. Run tests with `npm run test:integration`; they use a temporary database automatically.
3. Inspect the backup before replacing any real data.

The test launcher sets `STUDY_OS_DB_PATH` and `STUDY_OS_EXPORT_PATH` to temporary paths. Never point those variables at `data/study_os.db` while testing destructive behavior.

## Future logo swap

The notification icon is deliberately isolated at `public/notification-logo.svg`. Replacing that file does not require changing React or TypeScript API code.
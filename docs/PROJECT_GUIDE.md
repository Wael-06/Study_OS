# Study OS project guide

This is the practical guide for maintaining the project.

## What Runs What?

- **React + TypeScript** lives in `src/`. This is the user interface.
- **Vite** is the frontend development server. It runs on port `5000`.
- **TypeScript API** in `server/index.ts` is the active local data service. It runs on port `5001`.
- Vite forwards every `/api/...` request to the TypeScript API, so React can use relative URLs.
- **SQLite** stores the plan in `data/study_os.db`.

The old Flask implementation remains in `app.py` as a rollback/reference path. It is not started by the normal `npm run dev` command.

## Commands

```bash
npm run dev     # Start Vite and the TypeScript API together
npm run build   # Type-check the frontend/API and create a production frontend build
npm run test:all # Run unit, integration, and browser tests
npm run test:load # Run the API benchmark on an isolated database
```

For all test commands and prerequisites, see [testing/README.md](../testing/README.md).

## Manual Bug-Fixing Workflow

1. Reproduce the bug with `npm run dev`.
2. Identify the layer from the symptom:
	- UI display or interaction: `src/App.tsx` or `src/styles.css`.
	- Request shape or failed fetch: `src/api.ts`.
	- Stored value, route, ordering, or import/export: `server/index.ts`.
	- Proxy or port failure: `vite.config.ts`.
3. Add or adjust one focused test in the matching `testing/` folder before changing behavior.
4. Run the smallest check first:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

5. Run `npm run test:all` and `npm run build` before considering the fix complete.

Tests start an isolated API/database for integration and E2E. They are the safest place to investigate destructive operations.

## Database and Data Recovery

- Development database: `data/study_os.db`.
- Development export: `data/study-os-export.json`.
- Test database: temporary file created by `testing/support/start-stack.ts`.

Before schema or import changes, export or copy the development database. To recover, start the app, open **JSON format** if needed, and use **Import** with a known-good export. Do not use the test database as a recovery source.

## TypeScript basics in this project

- `src/types.ts` defines the shape of categories, tasks, reminders, and form data.
- `src/api.ts` is the frontend's typed endpoint client; the route implementations live in `server/index.ts`.
- `src/App.tsx` contains the screen and small feature components.
- `src/styles.css` contains the design system and responsive layout.

When adding a field:

1. Add it to the TypeScript API/database if it must persist.
2. Add its TypeScript type in `src/types.ts`.
3. Add the API call in `src/api.ts`.
4. Add the form and display in `src/App.tsx`.
5. Add a focused integration test for the persisted behavior.
6. Run `npm run test:all` and `npm run build`.

## Local notifications

Click **Alerts** in the top bar once to grant browser notification permission. The browser checks overdue tasks locally every minute. The icon is currently `public/notification-logo.svg`; replace that file when the final logo is ready.
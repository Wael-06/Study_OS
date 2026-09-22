# Study OS Debugging Runbook

This is the shortest path from a bug report to a verified fix.

## 1. Start Safely

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5000`.

The normal app uses:

- Vite UI: `5000`
- TypeScript API: `5001`
- Development database: `data/study_os.db`

Before changing database code, export the plan from the app or copy `data/study_os.db`. Never use the development database for destructive test experiments.

## 2. Find the Owner

| Symptom | First file to inspect | What to check |
| --- | --- | --- |
| Button, modal, view, or display is wrong | `src/App.tsx` | React state and event handler |
| Request has the wrong path or payload | `src/api.ts` | Typed client method |
| Data is missing or has the wrong value | `server/index.ts` | Route and SQL statement |
| Tasks appear in the wrong order | `server/index.ts` and `src/api.ts` | `position`, `parent_id`, and sibling filtering |
| Import/export is wrong | `server/index.ts` | JSON shape and all three collections |
| Page cannot call the API | `vite.config.ts` | `/api` proxy target and ports |
| Reminder behavior is wrong | `src/App.tsx` | Browser notification and local storage logic |

`app.py` is the legacy Flask reference implementation. Do not fix only `app.py`; the running application uses `server/index.ts`.

## 3. Trace One Request

For a task operation, follow this order:

```text
src/App.tsx
  -> src/api.ts
  -> Vite /api proxy
  -> server/index.ts
  -> SQLite
  -> /api/state
  -> src/App.tsx reload
```

Use the browser Network tab to confirm the request method, URL, status, and JSON payload. The TypeScript API terminal output confirms whether the route was reached.

## 4. Add the Smallest Regression Test

Use the matching layer:

```bash
npm run test:unit         # pure TypeScript helpers
npm run test:integration  # API, SQLite, persistence, import/export
npm run test:e2e          # visible browser workflow
npm run test:load         # performance measurement, not correctness
```

Integration and E2E tests start a separate stack on `5100` and `5101` with a temporary SQLite file. The launcher refuses occupied ports and cannot modify `data/study_os.db`.

Prefer one test that reproduces the bug and protects the contract. Do not add tests that repeat the same assertion at every layer.

## 5. Verify the Fix

Run the focused test first, then the full gate:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:all
npm run build
```

For API performance after backend changes:

```bash
npm run test:load
LOAD_REQUESTS=1000 LOAD_WORKERS=25 npm run test:load
```

Load numbers are machine-dependent. Look for errors, non-200 responses, unexpected latency growth, and obvious throughput regressions rather than treating one number as a universal target.

## Common Failures

### Port already in use

This is intentional for test commands. Stop the process using `5100` or `5101`, then rerun. Do not change the test command to reuse it: that can run tests against the wrong database.

### The page loads but data does not

1. Check that the API is listening on `5001`.
2. Request `http://127.0.0.1:5001/api/state` directly.
3. Check the Vite proxy target in `vite.config.ts`.
4. Check the browser Network tab for `/api/state`.

### A test changes real data

Stop immediately. Verify that the command is using the isolated launcher and that `STUDY_OS_DB_PATH` points to a temporary file. Restore the development database from the backup before continuing.

### Import fails after a schema change

Use a known-good export, compare the `categories`, `tasks`, and `reminders` arrays with the current state response, and update the TypeScript import/export code together. Preserve old fields unless a deliberate migration is documented.

### E2E cannot launch Chromium

Install the browser once:

```bash
npx playwright install chromium
```

Then rerun `npm run test:e2e`.

## Migration Rules

- Preserve route names and response shapes unless a change is explicitly planned.
- Keep SQLite IDs, `parent_id`, `position`, completion fields, and timestamps compatible.
- Make schema changes additive where possible.
- Back up before changing import, export, or delete behavior.
- Keep the TypeScript API as the source of active behavior; use `app.py` only for comparison or rollback.
- Update this runbook when a new failure mode becomes common.

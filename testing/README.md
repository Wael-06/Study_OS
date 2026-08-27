# TypeScript test commands

Install the test tooling once:

```bash
npm install
npx playwright install chromium
```

Run each layer:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:load
```

Integration, E2E, and load commands start a dedicated test stack on ports `5100` and `5101`. The launcher refuses to use occupied ports and gives Flask a temporary SQLite database, so these commands cannot touch development data or silently attach to an existing server.

The integration suite covers state shape, task CRUD, updates and completion, nested subtasks, persistence, and JSON export/import. The E2E suite covers the primary create-and-complete browser workflow. The load benchmark measures concurrent reads and reports throughput, mean latency, and p95 latency.

Tune the benchmark with `LOAD_REQUESTS=1000 LOAD_WORKERS=25 npm run test:load`.

Run the unit, integration, and E2E suites together with `npm run test:all`.

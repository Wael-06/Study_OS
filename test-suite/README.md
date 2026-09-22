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
npm run test:all
```

Integration, E2E, and load commands start a dedicated test stack on ports `5100` and `5101`. The launcher refuses to use occupied ports and gives the TypeScript API a temporary SQLite database, so these commands cannot touch development data or silently attach to an existing server.

The integration suite covers state shape, task/category CRUD, invalid IDs and payloads, task field updates, completion, nested subtasks, persistence, sibling/category ordering, reminders, and JSON export/import including malformed and empty data. The unit suite covers task-tree and notification selection logic. The E2E suite covers the primary create-and-complete browser workflow. The load benchmark measures concurrent reads and reports throughput, mean latency, and p95 latency.

Tune the benchmark with `LOAD_REQUESTS=1000 LOAD_WORKERS=25 npm run test:load`.

`npm run test:all` runs unit, integration, E2E, and load tests independently. It records every result in `testing/results/latest.json` and appends the run to `testing/results/history.jsonl`. The command exits with failure if any layer fails, even when another layer passes.

The recorded result includes status, exit code, duration, test counts, captured output, and load metrics when available. Keep `latest.json` and `history.jsonl` when comparing migration performance over time; do not treat one machine's latency as a universal threshold.

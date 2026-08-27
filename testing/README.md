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

`test:integration` and `test:e2e` start the Python API and Vite through the existing `dev` command. The load benchmark targets the API directly; start the app first when running it, then tune it with `LOAD_REQUESTS=1000 LOAD_WORKERS=25 npm run test:load`.

Run the unit, integration, and E2E suites together with `npm run test:all`.

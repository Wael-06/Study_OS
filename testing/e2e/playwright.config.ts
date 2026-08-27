import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:5000", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://127.0.0.1:5000", reuseExistingServer: true, timeout: 120_000 },
});

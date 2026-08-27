import { defineConfig } from "@playwright/test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:5100", trace: "retain-on-failure" },
  webServer: { command: `tsx ${resolve(root, "testing/support/start-stack.ts")}`, url: "http://127.0.0.1:5100", reuseExistingServer: false, timeout: 120_000 },
});

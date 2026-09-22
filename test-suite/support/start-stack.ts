import { createConnection } from "node:net";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const apiPort = 5101;
const webPort = 5100;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const testDirectory = mkdtempSync(join(tmpdir(), "study-os-test-"));
const dbPath = join(testDirectory, "study_os.db");
const exportPath = join(testDirectory, "study-os-export.json");

const portInUse = (port: number) => new Promise<boolean>((resolve) => {
  const server = createConnection({ host: "127.0.0.1", port });
  server.once("connect", () => { server.destroy(); resolve(true); });
  server.once("error", () => resolve(false));
});

if (await portInUse(apiPort) || await portInUse(webPort)) {
  console.error(`Test stack refused to start: port ${apiPort} or ${webPort} is already in use.`);
  process.exit(1);
}

const environment = { ...process.env, STUDY_OS_DB_PATH: dbPath, STUDY_OS_EXPORT_PATH: exportPath, STUDY_OS_API_PORT: String(apiPort), STUDY_OS_API_URL: apiUrl };
const processes = [
  spawn("npx", ["tsx", join(root, "server/index.ts")], { cwd: root, env: environment, stdio: "inherit", shell: false }),
  spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(webPort)], { cwd: root, env: environment, stdio: "inherit", shell: false }),
];
let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  processes.forEach((child) => child.kill("SIGTERM"));
  setTimeout(() => process.exit(code), 100);
};
processes.forEach((child) => child.once("exit", (code) => { if (!stopping) stop(code || 1); }));
process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());
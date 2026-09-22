import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";

const root = process.cwd();
const resultsDirectory = join(root, "testing", "results");
const historyPath = join(resultsDirectory, "history.jsonl");
const latestPath = join(resultsDirectory, "latest.json");
const commands = ["test:unit", "test:integration", "test:e2e", "test:load"];
const runId = new Date().toISOString();

type TestResult = {
  runId: string;
  recordedAt: string;
  command: string;
  status: "passed" | "failed";
  exitCode: number;
  durationMs: number;
  output: string;
  tests?: number;
  passed?: number;
  failed?: number;
  throughput?: number;
  meanMs?: number;
  p95Ms?: number;
};

const runCommand = (command: string) => new Promise<TestResult>((resolve) => {
  const started = performance.now();
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(executable, ["run", command], { cwd: root, env: process.env, shell: false });
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); process.stdout.write(chunk); });
  child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); process.stderr.write(chunk); });
  child.on("error", (error) => { output += `\n${error.message}`; });
  child.on("close", (exitCode) => {
    const testSummary = output.match(/Tests\s+(\d+) passed(?:\s*\|\s*(\d+) failed)?/);
    const browserSummary = output.match(/\n\s+(\d+) passed \(/);
    const loadSummary = output.match(/throughput=([\d.]+) req\/s mean=([\d.]+)ms p95=([\d.]+)ms/);
    resolve({
      runId, recordedAt: new Date().toISOString(), command,
      status: exitCode === 0 ? "passed" : "failed", exitCode: exitCode ?? 1,
      durationMs: Math.round(performance.now() - started), output: output.slice(-4000),
      tests: testSummary ? Number(testSummary[1]) : browserSummary ? Number(browserSummary[1]) : undefined,
      passed: testSummary ? Number(testSummary[1]) : browserSummary ? Number(browserSummary[1]) : undefined,
      failed: testSummary?.[2] ? Number(testSummary[2]) : undefined,
      throughput: loadSummary ? Number(loadSummary[1]) : undefined,
      meanMs: loadSummary ? Number(loadSummary[2]) : undefined,
      p95Ms: loadSummary ? Number(loadSummary[3]) : undefined,
    });
  });
});

mkdirSync(resultsDirectory, { recursive: true });
const results: TestResult[] = [];
for (const command of commands) results.push(await runCommand(command));
appendFileSync(historyPath, results.map((result) => JSON.stringify(result)).join("\n") + "\n");
writeFileSync(latestPath, JSON.stringify({ recordedAt: new Date().toISOString(), results }, null, 2) + "\n");
const failed = results.filter((result) => result.status === "failed");
console.log(`\nRecorded ${results.length} test results in testing/results/latest.json`);
if (failed.length) {
  console.error(`Failed commands: ${failed.map((result) => result.command).join(", ")}`);
  process.exitCode = 1;
}

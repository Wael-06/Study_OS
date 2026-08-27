import { performance } from "node:perf_hooks";

const url = process.env.STUDY_OS_URL || "http://127.0.0.1:5101/api/state";
const total = Number(process.env.LOAD_REQUESTS || 100);
const workers = Number(process.env.LOAD_WORKERS || 10);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: LOAD_REQUESTS=1000 LOAD_WORKERS=25 npm run test:load");
  console.log("Optional: STUDY_OS_URL=http://127.0.0.1:5101/api/state");
  process.exit(0);
}

const fetchOne = async () => {
  const started = performance.now();
  const response = await fetch(url);
  await response.arrayBuffer();
  return { duration: performance.now() - started, status: response.status };
};

const started = performance.now();
const results: { duration: number; status: number }[] = [];
let next = 0;
const worker = async () => {
  while (next < total) {
    next += 1;
    results.push(await fetchOne());
  }
};
await Promise.all(Array.from({ length: Math.min(workers, total) }, worker));
const durations = results.map((result) => result.duration).sort((a, b) => a - b);
const percentile = (ratio: number) => durations[Math.min(durations.length - 1, Math.floor(durations.length * ratio))];
const statuses = [...new Set(results.map((result) => result.status))].sort();
console.log(`requests=${total} workers=${workers} statuses=${statuses.join(",")}`);
console.log(`throughput=${(total / ((performance.now() - started) / 1000)).toFixed(2)} req/s mean=${(durations.reduce((sum, value) => sum + value, 0) / total).toFixed(2)}ms p95=${percentile(0.95).toFixed(2)}ms`);

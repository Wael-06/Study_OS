import { afterAll, describe, expect, it } from "vitest";

const baseUrl = process.env.STUDY_OS_URL || "http://127.0.0.1:5000";
const request = (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, { headers: { "Content-Type": "application/json" }, ...init });

describe("Study OS API", () => {
  let taskId = "";
  let categoryId = "";

  it("reads the initial application state", async () => {
    const response = await request("/api/state");
    expect(response.ok).toBe(true);
    const state = await response.json();
    expect(state.categories.length).toBeGreaterThan(0);
    categoryId = state.categories[0].id;
  });

  it("creates, completes, and deletes a task", async () => {
    const created = await request("/api/tasks", { method: "POST", body: JSON.stringify({ category_id: categoryId, title: `TS integration ${Date.now()}` }) });
    expect(created.status).toBe(201);
    taskId = (await created.json()).id;

    const completed = await request(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ completed: 1 }) });
    expect(completed.ok).toBe(true);
    expect((await (await request("/api/report")).json()).done).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (taskId) await request(`/api/tasks/${taskId}`, { method: "DELETE" });
  });
});

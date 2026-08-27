import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.STUDY_OS_URL || "http://127.0.0.1:5100";
const request = (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, { headers: { "Content-Type": "application/json" }, ...init });

describe("Study OS API", () => {
  let categoryId = "";
  let parentId = "";
  let childId = "";

  beforeAll(async () => {
    const response = await request("/api/state");
    expect(response.ok).toBe(true);
    const state = await response.json();
    expect(state).toEqual(expect.objectContaining({ categories: expect.any(Array), tasks: expect.any(Array), reminders: expect.any(Array) }));
    expect(state.tasks).toEqual([]);
    expect(state.reminders).toEqual([]);
    expect(state.categories.length).toBeGreaterThan(0);
    categoryId = state.categories[0].id;
  });

  it("creates and persists a parent task with a subtask", async () => {
    const created = await request("/api/tasks", { method: "POST", body: JSON.stringify({ category_id: categoryId, title: "TS migration parent", notes: "persisted" }) });
    expect(created.status).toBe(201);
    parentId = (await created.json()).id;
    const child = await request("/api/tasks", { method: "POST", body: JSON.stringify({ category_id: categoryId, parent_id: parentId, title: "TS migration subtask" }) });
    expect(child.status).toBe(201);
    childId = (await child.json()).id;
    const state = await (await request("/api/state")).json();
    expect(state.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: parentId, title: "TS migration parent", notes: "persisted", parent_id: null }),
      expect.objectContaining({ id: childId, title: "TS migration subtask", parent_id: parentId }),
    ]));
  });

  it("updates and completes the parent task", async () => {
    const updated = await request(`/api/tasks/${parentId}`, { method: "PATCH", body: JSON.stringify({ title: "Updated migration parent", priority: "high", completed: 1 }) });
    expect(updated.ok).toBe(true);
    const state = await (await request("/api/state")).json();
    expect(state.tasks).toEqual(expect.arrayContaining([expect.objectContaining({ id: parentId, title: "Updated migration parent", priority: "high", completed: 1 })]));
  });

  it("round-trips JSON export and import", async () => {
    const exported = await request("/api/export");
    expect(exported.ok).toBe(true);
    const payload = await exported.json();
    expect(payload).toEqual(expect.objectContaining({ categories: expect.any(Array), tasks: expect.any(Array), reminders: expect.any(Array) }));

    const imported = await request("/api/import", { method: "POST", body: JSON.stringify(payload) });
    expect(imported.ok).toBe(true);
    const state = await (await request("/api/state")).json();
    expect(state.tasks).toEqual(expect.arrayContaining([expect.objectContaining({ id: parentId, title: "Updated migration parent" }), expect.objectContaining({ id: childId, parent_id: parentId })]));
  });

  it("deletes the parent and cascades to its subtask", async () => {
    const deleted = await request(`/api/tasks/${parentId}`, { method: "DELETE" });
    expect(deleted.ok).toBe(true);
    const state = await (await request("/api/state")).json();
    expect(state.tasks).toEqual([]);
  });

  afterAll(async () => {
    if (parentId) {
      await request(`/api/tasks/${parentId}`, { method: "DELETE" });
    }
  });
});

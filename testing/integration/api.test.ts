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

describe("Study OS API edge cases and ordering", () => {
  let categoryId = "";
  let categoryToDelete = "";
  let taskIds: string[] = [];

  const createTask = async (payload: Record<string, unknown>) => {
    const response = await request("/api/tasks", { method: "POST", body: JSON.stringify({ category_id: categoryId, ...payload }) });
    expect(response.status).toBe(201);
    const id = (await response.json()).id as string;
    taskIds.push(id);
    return id;
  };

  beforeAll(async () => {
    categoryId = (await (await request("/api/state")).json()).categories[0].id;
  });

  it("rejects invalid IDs, invalid categories, missing fields, and malformed JSON", async () => {
    expect((await request("/api/tasks/missing", { method: "PATCH", body: JSON.stringify({ title: "x" }) })).status).toBe(404);
    expect((await request("/api/tasks/missing", { method: "DELETE" })).status).toBe(200);
    expect((await request("/api/tasks", { method: "POST", body: JSON.stringify({ category_id: "missing", title: "x" }) })).status).toBe(400);
    expect((await request("/api/tasks", { method: "POST", body: JSON.stringify({ category_id: categoryId }) })).status).toBe(400);
    expect((await request("/api/tasks", { method: "POST", body: "{broken" })).status).toBe(400);
  });

  it("supports category CRUD and category ordering", async () => {
    const created = await request("/api/categories", { method: "POST", body: JSON.stringify({ name: "Temporary TS category", color: "teal" }) });
    expect(created.status).toBe(201);
    categoryToDelete = (await created.json()).id;
    expect((await request(`/api/categories/${categoryToDelete}`, { method: "PATCH", body: JSON.stringify({ name: "Updated TS category", color: "purple" }) })).ok).toBe(true);
    const stateBefore = await (await request("/api/state")).json();
    expect(stateBefore.categories.find((item: { id: string }) => item.id === categoryToDelete).name).toBe("Updated TS category");
    const order = stateBefore.categories.map((item: { id: string }) => item.id).reverse();
    expect((await request("/api/reorder", { method: "POST", body: JSON.stringify({ type: "category", order }) })).ok).toBe(true);
    expect((await (await request("/api/state")).json()).categories.map((item: { id: string }) => item.id)).toEqual(order);
  });

  it("updates task fields independently and preserves deep nesting", async () => {
    const parentId = await createTask({ title: "Position parent" });
    const childId = await createTask({ title: "Position child", parent_id: parentId });
    const grandchildId = await createTask({ title: "Position grandchild", parent_id: childId });
    const fields = [
      { notes: "new notes" }, { url: "https://example.com" }, { due_at: "2026-09-01T10:00" },
    ];
    for (const field of fields) {
      expect((await request(`/api/tasks/${parentId}`, { method: "PATCH", body: JSON.stringify(field) })).ok).toBe(true);
    }
    const state = await (await request("/api/state")).json();
    expect(state.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: parentId, notes: "new notes", url: "https://example.com", due_at: "2026-09-01T10:00" }),
      expect.objectContaining({ id: childId, parent_id: parentId }),
      expect.objectContaining({ id: grandchildId, parent_id: childId }),
    ]));
  });

  it("assigns sibling positions and reorders tasks", async () => {
    const first = await createTask({ title: "First sibling" });
    const second = await createTask({ title: "Second sibling" });
    const third = await createTask({ title: "Third sibling" });
    expect((await request("/api/reorder", { method: "POST", body: JSON.stringify({ type: "task", order: [third, first, second] }) })).ok).toBe(true);
    const tasks = (await (await request("/api/state")).json()).tasks.filter((task: { id: string }) => [first, second, third].includes(task.id));
    expect(tasks.map((task: { id: string }) => task.id)).toEqual([third, first, second]);
    expect(tasks.map((task: { position: number }) => task.position)).toEqual([0, 1, 2]);
  });

  it("creates, updates, and deletes reminders", async () => {
    const taskId = await createTask({ title: "Reminder task" });
    const created = await request(`/api/reminders/${taskId}`, { method: "PUT", body: JSON.stringify({ mode: "weekly", remind_at: "2026-09-01T10:00", weekdays: [1, 3] }) });
    expect(created.ok).toBe(true);
    expect((await (await request("/api/state")).json()).reminders).toEqual([expect.objectContaining({ task_id: taskId, mode: "weekly", weekdays: "[1,3]" })]);
    expect((await request(`/api/reminders/${taskId}`, { method: "PUT", body: JSON.stringify({ mode: "daily", remind_at: "2026-09-02T09:00" }) })).ok).toBe(true);
    expect((await request(`/api/reminders/${taskId}`, { method: "DELETE" })).ok).toBe(true);
    expect((await (await request("/api/state")).json()).reminders).toEqual([]);
  });

  it("accepts empty import and rejects malformed import data", async () => {
    expect((await request("/api/import", { method: "POST", body: "not-json" })).status).toBe(400);
    expect((await request("/api/import", { method: "POST", body: JSON.stringify({ categories: [{}], tasks: [], reminders: [] }) })).status).toBe(400);
    expect((await request("/api/import", { method: "POST", body: JSON.stringify({ categories: [], tasks: [], reminders: [] }) })).ok).toBe(true);
    const state = await (await request("/api/state")).json();
    expect(state.categories).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.reminders).toEqual([]);
  });

  afterAll(async () => {
    for (const id of taskIds) await request(`/api/tasks/${id}`, { method: "DELETE" });
    if (categoryToDelete) await request(`/api/categories/${categoryToDelete}`, { method: "DELETE" });
  });
});

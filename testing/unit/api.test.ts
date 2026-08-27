import { describe, expect, it } from "vitest";
import { categoryFor, childrenOf, rootsFor } from "../../src/api";
import type { Category, Task } from "../../src/types";
import { overdueTaskIds } from "../../src/notifications";

const makeTask = (id: string, parent_id: string | null, position: number, category_id = "math"): Task => ({
  id, category_id, parent_id, title: id, kind: "task", url: "", notes: "", priority: "medium",
  due_at: null, completed: 0, completed_at: null, created_at: "", updated_at: "", position,
});

describe("task tree helpers", () => {
  it("returns siblings in position order", () => {
    expect(childrenOf([makeTask("b", null, 2), makeTask("a", null, 1), makeTask("child", "a", 0)], null).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("returns only category roots", () => {
    const tasks = [makeTask("root", null, 0), makeTask("other", null, 0, "science"), makeTask("child", "root", 0)];
    expect(rootsFor(tasks, "math").map((item) => item.id)).toEqual(["root"]);
  });

  it("finds a category by id", () => {
    const categories = [{ id: "math", name: "Math", color: "purple", position: 0 }] as Category[];
    expect(categoryFor(categories, "math")?.name).toBe("Math");
    expect(categoryFor(categories, "missing")).toBeUndefined();
  });

  it("selects only new overdue tasks for notification", () => {
    const now = new Date("2026-08-27T12:00:00Z");
    const overdue = { ...makeTask("overdue", null, 0), due_at: "2026-08-27T11:00:00Z" };
    const future = { ...makeTask("future", null, 1), due_at: "2026-08-27T13:00:00Z" };
    const done = { ...overdue, id: "done", completed: 1 };
    expect(overdueTaskIds([overdue, future, done], ["already-seen"], now)).toEqual(["overdue"]);
    expect(overdueTaskIds([overdue], ["overdue"], now)).toEqual([]);
  });
});

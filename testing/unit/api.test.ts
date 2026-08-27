import { describe, expect, it } from "vitest";
import { categoryFor, childrenOf, rootsFor } from "../../src/api";
import type { Category, Task } from "../../src/types";

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
});

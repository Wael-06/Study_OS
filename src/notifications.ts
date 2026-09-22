import type { Task } from "./types";

export function overdueTaskIds(tasks: Task[], seenIds: string[], now = new Date()) {
  const seen = new Set(seenIds);
  return tasks.filter((task) => !task.completed && !!task.due_at && new Date(task.due_at) < now && !seen.has(task.id)).map((task) => task.id);
}

import type { AppState, Category, Reminder, Task, TaskDraft } from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : (response as T);
}

export const api = {
  state: () => request<AppState>("/api/state"),
  createTask: (payload: TaskDraft) => request<{ id: string }>("/api/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: Partial<TaskDraft> & { completed?: number }) =>
    request<{ ok: boolean }>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (id: string) => request<{ ok: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
  createCategory: (name: string, color: string) =>
    request<{ id: string }>("/api/categories", { method: "POST", body: JSON.stringify({ name, color }) }),
  reorder: (type: "category" | "task", order: string[]) =>
    request<{ ok: boolean }>("/api/reorder", { method: "POST", body: JSON.stringify({ type, order }) }),
  putReminder: (taskId: string, payload: Partial<Reminder> & { weekdays?: number[] }) =>
    request(`/api/reminders/${taskId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteReminder: (taskId: string) => request(`/api/reminders/${taskId}`, { method: "DELETE" }),
};

export function childrenOf(tasks: Task[], parentId: string | null) {
  return tasks.filter((task) => task.parent_id === parentId).sort((a, b) => a.position - b.position);
}

export function rootsFor(tasks: Task[], categoryId: string) {
  return childrenOf(tasks.filter((task) => task.category_id === categoryId), null);
}

export function categoryFor(categories: Category[], id: string) {
  return categories.find((category) => category.id === id);
}
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const dbPath = process.env.STUDY_OS_DB_PATH || join(root, "data", "study_os.db");
const exportPath = process.env.STUDY_OS_EXPORT_PATH || join(root, "data", "study-os-export.json");
const port = Number(process.env.STUDY_OS_API_PORT || 5001);
mkdirSync(dirname(dbPath), { recursive: true });
const database = new DatabaseSync(dbPath);
const nowIso = () => new Date().toISOString().slice(0, 19);
const defaults = [
  ["systems", "Systems CS", "purple"], ["math_algo", "Math & Algorithms", "purple"],
  ["ml", "Machine Learning", "teal"], ["backend", "Backend", "teal"], ["cp", "Competitive Programming", "purple"],
];

database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, category_id TEXT NOT NULL, parent_id TEXT, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'task', url TEXT DEFAULT '', notes TEXT DEFAULT '', priority TEXT NOT NULL DEFAULT 'medium', due_at TEXT, completed INTEGER NOT NULL DEFAULT 0, completed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, overdue_notified_at TEXT, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE, FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, task_id TEXT NOT NULL UNIQUE, enabled INTEGER NOT NULL DEFAULT 1, mode TEXT NOT NULL DEFAULT 'once', remind_at TEXT, interval_minutes INTEGER, weekdays TEXT, last_sent_at TEXT, FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, action TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE SET NULL);
`);
const taskColumns = database.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
if (!taskColumns.some((column) => column.name === "position")) database.exec("ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
if (!taskColumns.some((column) => column.name === "overdue_notified_at")) database.exec("ALTER TABLE tasks ADD COLUMN overdue_notified_at TEXT");
if ((database.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number }).count === 0) {
  const insert = database.prepare("INSERT INTO categories(id,name,color,position) VALUES (?,?,?,?)");
  defaults.forEach(([id, name, color], position) => insert.run(id, name, color, position));
}

const send = (response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  response.writeHead(status, { "Content-Type": "application/json", ...headers });
  response.end(payload);
};
const body = async (request: IncomingMessage) => {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
};
const state = () => ({
  categories: database.prepare("SELECT * FROM categories ORDER BY position").all(),
  tasks: database.prepare("SELECT * FROM tasks ORDER BY category_id, COALESCE(parent_id, ''), position, created_at").all(),
  reminders: database.prepare("SELECT * FROM reminders").all(),
});
const activity = (taskId: string, action: string) => database.prepare("INSERT INTO activity(task_id, action, created_at) VALUES (?,?,?)").run(taskId, action, nowIso());

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const method = request.method || "GET";
    if (method === "GET" && url.pathname === "/api/state") return send(response, 200, state());
    if (method === "POST" && url.pathname === "/api/categories") {
      const payload = await body(request); if (!payload.name || !String(payload.name).trim()) return send(response, 400, { error: "name is required" });
      const id = randomUUID().replaceAll("-", "");
      const position = (database.prepare("SELECT COALESCE(MAX(position), -1)+1 AS position FROM categories").get() as { position: number }).position;
      database.prepare("INSERT INTO categories(id,name,color,position) VALUES (?,?,?,?)").run(id, String(payload.name).trim(), payload.color || "purple", position);
      return send(response, 201, { id });
    }
    if (parts[0] === "api" && parts[1] === "categories" && parts[2] && method === "PATCH") {
      const payload = await body(request); if (!payload.name || !String(payload.name).trim()) return send(response, 400, { error: "name is required" });
      database.prepare("UPDATE categories SET name=?, color=? WHERE id=?").run(String(payload.name).trim(), payload.color || "purple", parts[2]);
      return send(response, 200, { ok: true });
    }
    if (parts[0] === "api" && parts[1] === "categories" && parts[2] && method === "DELETE") {
      database.prepare("DELETE FROM categories WHERE id=?").run(parts[2]); return send(response, 200, { ok: true });
    }
    if (method === "POST" && url.pathname === "/api/tasks") {
      const payload = await body(request); if (!payload.category_id || !payload.title || !String(payload.title).trim()) return send(response, 400, { error: "category_id and title are required" });
      const id = randomUUID().replaceAll("-", ""); const created = nowIso(); const parentId = payload.parent_id || null;
      const position = (database.prepare("SELECT COUNT(*) AS count FROM tasks WHERE category_id=? AND parent_id IS ?").get(payload.category_id, parentId) as { count: number }).count;
      database.prepare("INSERT INTO tasks(id,category_id,parent_id,title,kind,url,notes,priority,due_at,created_at,updated_at,position) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(id, payload.category_id, parentId, String(payload.title).trim(), payload.kind || "task", payload.url || "", payload.notes || "", payload.priority || "medium", payload.due_at || null, created, created, position);
      activity(id, "created"); return send(response, 201, { id });
    }
    if (parts[0] === "api" && parts[1] === "tasks" && parts[2] && method === "PATCH") {
      const id = parts[2]; const payload = await body(request); const current = database.prepare("SELECT * FROM tasks WHERE id=?").get(id) as Record<string, any> | undefined;
      if (!current) return send(response, 404, { error: "not found" });
      const fields = ["category_id", "parent_id", "title", "kind", "url", "notes", "priority", "due_at", "completed"];
      const values = fields.map((field) => payload[field] !== undefined ? payload[field] : current[field]);
      let completedAt = current.completed_at;
      if (payload.completed && !current.completed) { completedAt = nowIso(); activity(id, "completed"); }
      if (!payload.completed && current.completed && payload.completed !== undefined) { completedAt = null; activity(id, "reopened"); }
      const overdueNotifiedAt = payload.due_at !== undefined && payload.due_at !== current.due_at ? null : (values[8] ? null : current.overdue_notified_at);
      database.prepare("UPDATE tasks SET category_id=?,parent_id=?,title=?,kind=?,url=?,notes=?,priority=?,due_at=?,completed=?,completed_at=?,updated_at=?,overdue_notified_at=? WHERE id=?").run(...values, completedAt, nowIso(), overdueNotifiedAt, id);
      return send(response, 200, { ok: true });
    }
    if (parts[0] === "api" && parts[1] === "tasks" && parts[2] && method === "DELETE") {
      database.prepare("DELETE FROM tasks WHERE id=?").run(parts[2]); return send(response, 200, { ok: true });
    }
    if (method === "POST" && url.pathname === "/api/reorder") {
      const payload = await body(request); if (!["category", "task"].includes(payload.type) || !Array.isArray(payload.order)) return send(response, 400, { error: "invalid reorder payload" });
      const table = payload.type === "category" ? "categories" : "tasks"; const idColumn = payload.type === "category" ? "id" : "id";
      const update = database.prepare(`UPDATE ${table} SET position=? WHERE ${idColumn}=?`); payload.order.forEach((id: string, position: number) => update.run(position, id)); return send(response, 200, { ok: true });
    }
    if (parts[0] === "api" && parts[1] === "reminders" && parts[2] && method === "PUT") {
      const payload = await body(request); const taskId = parts[2]; const existing = database.prepare("SELECT id FROM reminders WHERE task_id=?").get(taskId) as { id: string } | undefined; const id = existing?.id || randomUUID().replaceAll("-", "");
      const remindAt = payload.remind_at ?? null; const intervalMinutes = payload.interval_minutes ?? null;
      if (existing) database.prepare("UPDATE reminders SET enabled=?,mode=?,remind_at=?,interval_minutes=?,weekdays=?,last_sent_at=? WHERE id=?").run(Number(payload.enabled ?? 1), payload.mode || "once", remindAt, intervalMinutes, JSON.stringify(payload.weekdays || []), null, id);
      else database.prepare("INSERT INTO reminders(id,task_id,enabled,mode,remind_at,interval_minutes,weekdays) VALUES (?,?,?,?,?,?,?)").run(id, taskId, Number(payload.enabled ?? 1), payload.mode || "once", remindAt, intervalMinutes, JSON.stringify(payload.weekdays || []));
      return send(response, 200, { id });
    }
    if (parts[0] === "api" && parts[1] === "reminders" && parts[2] && method === "DELETE") { database.prepare("DELETE FROM reminders WHERE task_id=?").run(parts[2]); return send(response, 200, { ok: true }); }
    if (method === "GET" && url.pathname === "/api/export") {
      const payload = { ...state(), exported_at: nowIso() }; writeFileSync(exportPath, JSON.stringify(payload, null, 2));
      return send(response, 200, JSON.stringify(payload), { "Content-Disposition": "attachment; filename=study-os-export.json" });
    }
    if (method === "POST" && url.pathname === "/api/import") {
      const payload = await body(request);
      if (!Array.isArray(payload.categories) || !Array.isArray(payload.tasks) || !Array.isArray(payload.reminders)) return send(response, 400, { error: "categories, tasks, and reminders arrays are required" });
      if (payload.categories.some((item: any) => !item.id || !item.name) || payload.tasks.some((item: any) => !item.id || !item.category_id || !item.title) || payload.reminders.some((item: any) => !item.id || !item.task_id)) return send(response, 400, { error: "import contains incomplete records" });
      database.exec("DELETE FROM reminders; DELETE FROM tasks; DELETE FROM categories;");
      const categoryInsert = database.prepare("INSERT INTO categories(id,name,color,position) VALUES (?,?,?,?)"); payload.categories.forEach((item: any, position: number) => categoryInsert.run(item.id, item.name, item.color || "purple", item.position ?? position));
      const taskInsert = database.prepare("INSERT INTO tasks(id,category_id,parent_id,title,kind,url,notes,priority,due_at,completed,completed_at,created_at,updated_at,position,overdue_notified_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"); payload.tasks.forEach((item: any) => taskInsert.run(item.id, item.category_id, item.parent_id, item.title, item.kind || "task", item.url || "", item.notes || "", item.priority || "medium", item.due_at, Number(item.completed || 0), item.completed_at, item.created_at || nowIso(), item.updated_at || nowIso(), Number(item.position || 0), item.overdue_notified_at));
      const reminderInsert = database.prepare("INSERT INTO reminders(id,task_id,enabled,mode,remind_at,interval_minutes,weekdays,last_sent_at) VALUES (?,?,?,?,?,?,?,?)"); payload.reminders.forEach((item: any) => reminderInsert.run(item.id, item.task_id, item.enabled ?? 1, item.mode || "once", item.remind_at, item.interval_minutes, item.weekdays || "[]", item.last_sent_at));
      return send(response, 200, { ok: true });
    }
    if (method === "GET" && url.pathname === "/api/report") {
      const total = (database.prepare("SELECT COUNT(*) AS count FROM tasks").get() as { count: number }).count;
      const done = (database.prepare("SELECT COUNT(*) AS count FROM tasks WHERE completed=1").get() as { count: number }).count;
      const categories = database.prepare("SELECT c.id,c.name,COUNT(t.id) total,COALESCE(SUM(t.completed),0) done FROM categories c LEFT JOIN tasks t ON t.category_id=c.id GROUP BY c.id,c.name ORDER BY c.position").all();
      const overdue = (database.prepare("SELECT COUNT(*) AS count FROM tasks WHERE completed=0 AND due_at IS NOT NULL AND due_at < ?").get(nowIso()) as { count: number }).count;
      const last7 = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(); date.setDate(date.getDate() - (6 - index)); const day = date.toISOString().slice(0, 10);
        const completed = (database.prepare("SELECT COUNT(*) AS count FROM activity WHERE action='completed' AND substr(created_at,1,10)=?").get(day) as { count: number }).count;
        return { date: day, completed };
      });
      return send(response, 200, { total, done, overdue, completion_rate: total ? Math.round(done / total * 1000) / 10 : 0, categories, last7 });
    }
    return send(response, 404, { error: "not found" });
  } catch (error) { send(response, 400, { error: error instanceof Error ? error.message : "bad request" }); }
});

server.listen(port, "127.0.0.1", () => console.log(`Study OS TypeScript API listening on http://127.0.0.1:${port}`));
const shutdown = () => { database.close(); server.close(() => process.exit(0)); };
process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);

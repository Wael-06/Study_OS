import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, BellRing, CalendarDays, Check, ChevronLeft, ChevronRight, CirclePlus,
  Code2, Copy, Download, ExternalLink, FileUp, LayoutGrid, Pencil, Plus, RefreshCw,
  Search, SlidersHorizontal, Timer, Trash2, X, Play, Pause, RotateCcw
} from "lucide-react";
import { api, childrenOf, rootsFor } from "./api";
import { overdueTaskIds } from "./notifications";
import type { AppState, Category, CategoryColor, Priority, Task, TaskDraft, TaskKind } from "./types";

const emptyState: AppState = { categories: [], tasks: [], reminders: [] };
const kindLabels: Record<TaskKind, string> = { task: "Task", video: "Video", blog: "Blog", research: "Research", problem: "Problem", project: "Project" };
const priorityLabels: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };

function formatDue(value: string | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function isoDate(value: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function isOverdue(task: Task) { return !task.completed && !!task.due_at && new Date(task.due_at) < new Date(); }
function isSoon(task: Task) {
  if (!task.due_at || task.completed) return false;
  const diff = new Date(task.due_at).getTime() - Date.now();
  return diff > 0 && diff < 7 * 86400000;
}

export default function App() {
  const [state, setState] = useState<AppState>(emptyState);
  const [activeView, setActiveView] = useState<"board" | "calendar" | "cp">("board");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ task?: Task; categoryId?: string; parentId?: string | null } | null>(null);
  const [categoryEditor, setCategoryEditor] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [drag, setDrag] = useState<{ type: "task" | "category"; id: string } | null>(null);
  const [month, setMonth] = useState(() => new Date());

  const load = useCallback(async () => setState(await api.state()), []);
  useEffect(() => { load().catch(() => setNotice("Could not load your local study data.")); }, [load]);

  const showLocalNotifications = useCallback(() => {
    if (!("Notification" in window)) return;
    const seen = JSON.parse(localStorage.getItem("study-os-notified") || "[]") as string[];
    overdueTaskIds(state.tasks, seen).forEach((taskId) => {
      const task = state.tasks.find((item) => item.id === taskId)!;
      new Notification("Study OS — attention", { body: `${task.title} is overdue.`, icon: "/notification-logo.svg" });
      seen.push(taskId);
    });
    localStorage.setItem("study-os-notified", JSON.stringify(seen.slice(-100)));
  }, [state.tasks]);
  useEffect(() => {
    const timer = window.setInterval(showLocalNotifications, 60000);
    return () => window.clearInterval(timer);
  }, [showLocalNotifications]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return setNotice("This browser does not support local notifications.");
    const permission = await Notification.requestPermission();
    setNotice(permission === "granted" ? "Local reminders are enabled." : "Notifications remain off.");
    if (permission === "granted") showLocalNotifications();
  };

  const visibleTasks = useMemo(() => state.tasks.filter((task) =>
    !query || `${task.title} ${task.notes} ${task.kind}`.toLowerCase().includes(query.toLowerCase())
  ), [state.tasks, query]);
  const completed = state.tasks.filter((task) => task.completed).length;
  const overdue = state.tasks.filter(isOverdue).length;
  const soon = state.tasks.filter(isSoon).sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  const toggleTask = async (task: Task) => { await api.updateTask(task.id, { completed: task.completed ? 0 : 1 }); await load(); };
  const saveTask = async (draft: TaskDraft, id?: string, reminder?: { enabled: boolean; mode: string; remind_at: string | null }) => {
    let taskId = id;
    if (id) await api.updateTask(id, draft); else taskId = (await api.createTask(draft)).id;
    if (taskId && reminder?.enabled && reminder.remind_at) await api.putReminder(taskId, { enabled: 1, mode: reminder.mode, remind_at: reminder.remind_at });
    else if (taskId) await api.deleteReminder(taskId).catch(() => undefined);
    setEditor(null); await load();
  };
  const reorder = async (type: "task" | "category", id: string, targetId: string) => {
    if (type === "category") {
      const order = state.categories.map((item) => item.id);
      const from = order.indexOf(id), to = order.indexOf(targetId);
      if (from < 0 || to < 0) return;
      order.splice(from, 1); order.splice(to, 0, id); await api.reorder(type, order);
    } else {
      const moved = state.tasks.find((item) => item.id === id), target = state.tasks.find((item) => item.id === targetId);
      if (!moved || !target || moved.category_id !== target.category_id || moved.parent_id !== target.parent_id) return;
      const order = childrenOf(state.tasks.filter((item) => item.category_id === moved.category_id), moved.parent_id).map((item) => item.id);
      const from = order.indexOf(id), to = order.indexOf(targetId);
      if (from < 0 || to < 0) return;
      order.splice(from, 1); order.splice(to, 0, id); await api.reorder(type, order);
    }
    await load();
  };
  const exportData = () => { window.location.href = "/api/export"; };
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    file.text().then((text) => fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: text }))
      .then(load).then(() => setNotice("Plan imported successfully.")).catch(() => setNotice("Import failed."));
    event.target.value = "";
  };

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><img src="/notification-logo.svg" alt="" /></div><div><div className="eyebrow">LOCAL STUDY PLANNER</div><h1>Study OS</h1></div></div>
      <div className="top-actions">
        <div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your plan" /></div>
        <button className="button muted" onClick={() => setReportOpen(true)}><SlidersHorizontal size={15} /> Report</button>
        <button className="button muted" onClick={requestNotifications}><BellRing size={15} /> Alerts</button>
        <button className="button primary" onClick={() => setEditor({})}><Plus size={16} /> Add task</button>
      </div>
    </header>
    <main className="workspace">
      <section className="intro-row">
        <div><div className="eyebrow">STUDY WORKSPACE</div><h2>Build the plan.<br /><span>Then do the work.</span></h2><p>One focused board for learning, building, and keeping the next action visible.</p></div>
        <div className="stats">
          <div className="stat"><strong>{completed}<small>/{state.tasks.length}</small></strong><span>completed</span></div>
          <div className="stat"><strong>{state.tasks.length ? Math.round(completed / state.tasks.length * 100) : 0}%</strong><span>progress</span></div>
          <div className="stat attention"><strong>{overdue}</strong><span>overdue</span></div>
        </div>
      </section>
      {notice && <div className="notice"><Bell size={15} />{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
      <section className="content-grid">
        <div className="main-column">
          <div className="view-toolbar"><div className="view-tabs"><button className={activeView === "board" ? "active" : ""} onClick={() => setActiveView("board")}><LayoutGrid size={15} /> Board</button><button className={activeView === "calendar" ? "active" : ""} onClick={() => setActiveView("calendar")}><CalendarDays size={15} /> Calendar</button><button className={activeView === "cp" ? "active" : ""} onClick={() => setActiveView("cp")}><Code2 size={15} /> CP lab</button></div><button className="button muted" onClick={() => setCategoryEditor(true)}><CirclePlus size={15} /> Category</button></div>
          {activeView === "board" ? <div className="category-board">{state.categories.map((category) => <CategoryCard key={category.id} category={category} tasks={visibleTasks} allTasks={state.tasks} onAdd={() => setEditor({ categoryId: category.id })} onEdit={(task) => setEditor({ task })} onAddSubtask={(task) => setEditor({ categoryId: task.category_id, parentId: task.id })} onToggle={toggleTask} onDrag={setDrag} onDrop={reorder} drag={drag} />)}</div> : activeView === "calendar" ? <CalendarView month={month} setMonth={setMonth} tasks={state.tasks} onEdit={(task) => setEditor({ task })} /> : <CpLab tasks={state.tasks} onAddTask={(title, notes) => saveTask({ title, notes, category_id: state.categories.find((category) => category.id === "cp")?.id || state.categories.find((category) => category.name.toLowerCase().includes("competitive"))?.id || state.categories[0]?.id || "", parent_id: null, kind: "problem", priority: "medium", due_at: null, url: "", }, undefined)} />}
        </div>
        <aside className="queue">
          <div className="queue-head"><div><div className="eyebrow">NEXT UP</div><h3>Near due queue</h3></div><RefreshCw size={15} /></div>
          <p className="queue-help">The next seven days, ordered by attention.</p>
          {soon.length ? soon.map((task) => <button className="queue-item" key={task.id} onClick={() => setEditor({ task })}><span className={`queue-dot ${isOverdue(task) ? "red" : task.priority === "high" ? "amber" : "teal"}`} /><span><b>{task.title}</b><small>{formatDue(task.due_at)}</small></span><ChevronRight size={15} /></button>) : <div className="queue-empty">No near-due items. Add dates to keep your next move visible.</div>}
          <div className="legend"><span><i className="purple" /> structure</span><span><i className="teal" /> progress</span><span><i className="amber" /> active</span><span><i className="red" /> attention</span></div>
        </aside>
      </section>
      <footer><span>Local SQLite · Linux-first</span><div><button onClick={() => setJsonOpen(true)}>JSON format</button><button onClick={exportData}><Download size={14} /> Export</button><label><FileUp size={14} /> Import<input type="file" accept="application/json" onChange={importData} /></label></div></footer>
    </main>
    {editor && <TaskEditor task={editor.task} categoryId={editor.categoryId} parentId={editor.parentId} categories={state.categories} onClose={() => setEditor(null)} onSave={saveTask} onDelete={async (id) => { if (confirm("Delete this task and its subtasks?")) { await api.deleteTask(id); setEditor(null); await load(); } }} />}
    {categoryEditor && <CategoryEditor onClose={() => setCategoryEditor(false)} onSave={async (name, color) => { await api.createCategory(name, color); setCategoryEditor(false); await load(); }} />}
    {reportOpen && <ReportModal tasks={state.tasks} categories={state.categories} onClose={() => setReportOpen(false)} />}
    {jsonOpen && <JsonFormatModal onClose={() => setJsonOpen(false)} />}
  </div>;
}

type SolveLog = { id: string; problem: string; topic: string; tags: string[]; duration: number; createdAt: string };
function CpLab({ tasks, onAddTask }: { tasks: Task[]; onAddTask: (title: string, notes: string) => void }) {
  const [handle, setHandle] = useState(() => localStorage.getItem("study-os-codeforces-handle") || "");
  const [handleInput, setHandleInput] = useState(handle);
  const [solved, setSolved] = useState<{ name: string; contestId?: number; index: string; rating?: number }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [logs, setLogs] = useState<SolveLog[]>(() => JSON.parse(localStorage.getItem("study-os-cp-logs") || "[]"));
  const [problem, setProblem] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const cpTasks = tasks.filter((task) => task.kind === "problem" || task.category_id === "cp");
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, [running]);
  const sync = async () => {
    if (!handleInput.trim()) return setSyncMessage("Enter your Codeforces handle first.");
    setSyncing(true); setSyncMessage("");
    try {
      const response = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handleInput.trim())}&from=1&count=1000`);
      const data = await response.json();
      if (data.status !== "OK") throw new Error("Codeforces could not find that handle.");
      const unique = new Map<string, { name: string; contestId?: number; index: string; rating?: number }>();
      data.result.filter((item: { verdict: string }) => item.verdict === "OK").forEach((item: { problem: { name: string; contestId?: number; index: string; rating?: number } }) => {
        const key = `${item.problem.contestId || "gym"}-${item.problem.index}`;
        unique.set(key, item.problem);
      });
      setSolved([...unique.values()]); setHandle(handleInput.trim()); localStorage.setItem("study-os-codeforces-handle", handleInput.trim()); setSyncMessage(`Synced ${unique.size} solved problems.`);
    } catch (error) { setSyncMessage(error instanceof Error ? error.message : "Codeforces sync failed."); } finally { setSyncing(false); }
  };
  const saveLog = () => {
    if (!problem.trim()) return;
    const next = [{ id: crypto.randomUUID(), problem: problem.trim(), topic: topic.trim() || "Uncategorized", tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), duration: seconds, createdAt: new Date().toISOString() }, ...logs];
    setLogs(next); localStorage.setItem("study-os-cp-logs", JSON.stringify(next)); onAddTask(problem.trim(), `CP solve · topic: ${topic || "Uncategorized"} · tags: ${tags || "none"} · time: ${formatTimer(seconds)}`); setProblem(""); setTopic(""); setTags(""); setSeconds(0); setRunning(false);
  };
  const copyAiBrief = async () => { const brief = `Competitive programming solve log for ${handle || "my Codeforces account"}:\n${logs.map((log) => `- ${log.problem} | topic: ${log.topic} | tags: ${log.tags.join(", ") || "none"} | time: ${formatTimer(log.duration)}`).join("\n")}`; await navigator.clipboard?.writeText(brief); setSyncMessage("AI-ready solve brief copied to clipboard."); };
  return <div className="cp-lab"><div className="cp-intro"><div><div className="eyebrow">COMPETITIVE PROGRAMMING</div><h2>CP solve lab</h2><p>Sync public Codeforces results, time a solve, and keep topic tags with the task.</p></div><div className="cp-actions"><button className="button muted" onClick={copyAiBrief}><Copy size={14} /> Copy AI brief</button><a className="button primary" href="https://codeforces.com" target="_blank" rel="noreferrer"><ExternalLink size={14} /> Codeforces</a></div></div>
    <div className="cp-grid"><section className="cp-panel"><div className="panel-title"><div><div className="eyebrow">PUBLIC SYNC</div><h3>Codeforces progress</h3></div><span className="cp-count">{solved.length}<small> solved</small></span></div><div className="handle-row"><input value={handleInput} onChange={(e) => setHandleInput(e.target.value)} placeholder="Codeforces handle" /><button className="button muted" onClick={sync} disabled={syncing}>{syncing ? "Syncing..." : "Sync solved"}</button></div>{syncMessage && <div className="cp-message">{syncMessage}</div>}<div className="solved-list">{solved.slice(0, 8).map((item) => <a key={`${item.contestId}-${item.index}`} href={`https://codeforces.com/problemset/problem/${item.contestId}/${item.index}`} target="_blank" rel="noreferrer"><span>{item.index}</span>{item.name}<small>{item.rating || "—"}</small></a>)}</div></section>
      <section className="cp-panel stopwatch"><div className="panel-title"><div><div className="eyebrow">IN-APP STOPWATCH</div><h3>Time the solve</h3></div><Timer size={18} /></div><div className="timer">{formatTimer(seconds)}</div><div className="timer-actions"><button className="button primary" onClick={() => setRunning(!running)}>{running ? <Pause size={15} /> : <Play size={15} />}{running ? "Pause" : "Start"}</button><button className="button muted" onClick={() => { setRunning(false); setSeconds(0); }}><RotateCcw size={15} /> Reset</button></div><small className="helper">Your time is saved with the solve log when you click Save solve.</small></section></div>
    <section className="cp-panel logger"><div className="panel-title"><div><div className="eyebrow">LOCAL SOLVE LOGGER</div><h3>Save the topic and tags</h3></div><span className="saved-label">{logs.length} saved locally</span></div><div className="logger-fields"><input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Problem name or link" /><input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic e.g. graphs, DP" /><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags separated by commas" /><button className="button primary" onClick={saveLog}><Plus size={15} /> Save solve</button></div>{logs.length > 0 && <div className="log-list">{logs.slice(0, 10).map((log) => <div className="log-line" key={log.id}><b>{log.problem}</b><span>{log.topic}</span><span>{log.tags.join(" · ") || "no tags"}</span><small>{formatTimer(log.duration)}</small></div>)}</div>}</section>
  </div>;
}
function formatTimer(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function JsonFormatModal({ onClose }: { onClose: () => void }) {
  const example = `{
  "categories": [
    { "id": "cp", "name": "Competitive Programming", "color": "purple", "position": 0 }
  ],
  "tasks": [
    {
      "id": "problem-1",
      "category_id": "cp",
      "parent_id": null,
      "title": "Two Sum",
      "kind": "problem",
      "url": "https://codeforces.com/...",
      "notes": "Use a hash map.",
      "priority": "medium",
      "due_at": null,
      "completed": 0,
      "position": 0
    }
  ],
  "reminders": []
}`;
  return <div className="overlay"><div className="modal-card json-modal"><div className="drawer-head"><div><div className="eyebrow">BACKUP FORMAT</div><h2>Readable JSON</h2></div><button className="close" onClick={onClose}><X /></button></div><p className="json-help">Import accepts the same structure as Export. Categories and tasks are required arrays; tasks can use <code>parent_id</code> for subtasks. Existing local data is replaced by an import.</p><pre>{example}</pre><button className="button muted" onClick={() => navigator.clipboard?.writeText(example)}><Copy size={14} /> Copy example</button></div></div>;
}

function Grabber({ onDragStart }: { onDragStart: () => void }) {
  return <button className="grabber" draggable onDragStart={onDragStart} title="Drag to reorder"><span /><span /><span /><span /><span /><span /></button>;
}
function CategoryCard({ category, tasks, allTasks, onAdd, onEdit, onAddSubtask, onToggle, onDrag, onDrop, drag }: { category: Category; tasks: Task[]; allTasks: Task[]; onAdd: () => void; onEdit: (task: Task) => void; onAddSubtask: (task: Task) => void; onToggle: (task: Task) => void; onDrag: (drag: { type: "task" | "category"; id: string } | null) => void; onDrop: (type: "task" | "category", id: string, targetId: string) => void; drag: { type: "task" | "category"; id: string } | null }) {
  const categoryTasks = allTasks.filter((task) => task.category_id === category.id), done = categoryTasks.filter((task) => task.completed).length;
  return <article className={`category-card ${category.color}`} onDragOver={(e) => drag?.type === "category" && e.preventDefault()} onDrop={() => drag?.type === "category" && onDrop("category", drag.id, category.id)}>
    <div className="category-head"><div className="category-title"><Grabber onDragStart={() => onDrag({ type: "category", id: category.id })} /><span className="color-dot" /><div><h3>{category.name}</h3><small>{done} / {categoryTasks.length} complete</small></div></div><div className="category-tools"><div className="progress"><span style={{ width: `${categoryTasks.length ? done / categoryTasks.length * 100 : 0}%` }} /></div><button className="mini-action" onClick={onAdd}><Plus size={14} /> task</button></div></div>
    <div className="task-list">{rootsFor(tasks, category.id).length ? rootsFor(tasks, category.id).map((task) => <TaskRow key={task.id} task={task} allTasks={tasks} onEdit={onEdit} onAddSubtask={onAddSubtask} onToggle={onToggle} onDrag={onDrag} onDrop={onDrop} drag={drag} />) : <div className="empty">No items yet. Add the first thing you want to learn or build.</div>}</div>
  </article>;
}
function TaskRow({ task, allTasks, onEdit, onAddSubtask, onToggle, onDrag, onDrop, drag, level = 0 }: { task: Task; allTasks: Task[]; onEdit: (task: Task) => void; onAddSubtask: (task: Task) => void; onToggle: (task: Task) => void; onDrag: (drag: { type: "task"; id: string } | null) => void; onDrop: (type: "task", id: string, targetId: string) => void; drag: { type: "task" | "category"; id: string } | null; level?: number }) {
  const children = childrenOf(allTasks, task.id);
  return <div className={`task-row ${task.completed ? "done" : ""}`} style={{ "--depth": level } as React.CSSProperties} onDragOver={(e) => drag?.type === "task" && e.preventDefault()} onDrop={() => drag?.type === "task" && drag.id !== task.id && onDrop("task", drag.id, task.id)}>
    <Grabber onDragStart={() => onDrag({ type: "task", id: task.id })} /><button className="check" onClick={() => onToggle(task)} aria-label="Toggle complete">{task.completed ? <Check size={13} /> : null}</button><div className="task-info"><div className="task-title"><b>{task.title}</b><span className="tag">{kindLabels[task.kind]}</span><span className={`tag priority-${task.priority}`}>{priorityLabels[task.priority]}</span>{isOverdue(task) && <span className="tag overdue">overdue</span>}</div><div className="task-meta">{task.due_at && <span>{formatDue(task.due_at)}</span>}{task.url && <a href={task.url} target="_blank" rel="noreferrer">open link</a>}{task.notes && <span className="notes">{task.notes}</span>}</div>{children.length > 0 && <div className="subtasks">{children.map((child) => <TaskRow key={child.id} task={child} allTasks={allTasks} onEdit={onEdit} onAddSubtask={onAddSubtask} onToggle={onToggle} onDrag={onDrag} onDrop={onDrop} drag={drag} level={level + 1} />)}</div>}</div><div className="task-actions"><button onClick={() => onAddSubtask(task)} title="Add subtask"><Plus size={14} /></button><button onClick={() => onEdit(task)} title="Edit"><Pencil size={14} /></button></div>
  </div>;
}

function TaskEditor({ task, categoryId, parentId, categories, onClose, onSave, onDelete }: { task?: Task; categoryId?: string; parentId?: string | null; categories: Category[]; onClose: () => void; onSave: (draft: TaskDraft, id?: string, reminder?: { enabled: boolean; mode: string; remind_at: string | null }) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState<TaskDraft>({ title: task?.title || "", category_id: task?.category_id || categoryId || categories[0]?.id || "", parent_id: task?.parent_id || parentId || null, kind: task?.kind || "task", priority: task?.priority || "medium", due_at: task?.due_at?.slice(0, 16) || null, url: task?.url || "", notes: task?.notes || "" });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderAt, setReminderAt] = useState(task?.due_at?.slice(0, 16) || "");
  const update = (key: keyof TaskDraft, value: string | null) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="overlay"><div className="drawer"><div className="drawer-head"><div><div className="eyebrow">{task ? "EDIT ITEM" : "NEW ITEM"}</div><h2>{task ? "Edit task" : parentId ? "Add subtask" : "Add task"}</h2></div><button className="close" onClick={onClose}><X /></button></div><form onSubmit={(e) => { e.preventDefault(); onSave(draft, task?.id, { enabled: reminderEnabled, mode: "once", remind_at: reminderAt || draft.due_at }); }} className="form"><label>Title<input autoFocus required value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="What is the next action?" /></label><div className="two-col"><label>Category<select disabled={!!parentId} value={draft.category_id} onChange={(e) => update("category_id", e.target.value)}>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Type<select value={draft.kind} onChange={(e) => update("kind", e.target.value)}>{Object.entries(kindLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><div className="two-col"><label>Priority<select value={draft.priority} onChange={(e) => update("priority", e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Due date<input type="datetime-local" value={draft.due_at || ""} onChange={(e) => { update("due_at", e.target.value || null); if (!reminderAt) setReminderAt(e.target.value); }} /></label></div><label>Link<input type="url" value={draft.url} onChange={(e) => update("url", e.target.value)} placeholder="https://..." /></label><label>Notes<textarea rows={6} value={draft.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Context, questions, or the next useful detail..." /></label><div className="reminder-callout"><BellRing size={16} /><span><b>Local notifications</b><small>Use Alerts in the top bar to allow browser reminders. Your future logo can replace the placeholder icon.</small><label className="reminder-toggle"><input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} /> Remind me once at <input type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} /></label></span></div><div className="drawer-actions">{task ? <button type="button" className="danger button" onClick={() => onDelete(task.id)}><Trash2 size={14} /> Delete</button> : <span /> }<button type="button" className="button muted" onClick={onClose}>Cancel</button><button className="button primary">Save task</button></div></form></div></div>;
}

function CalendarView({ month, setMonth, tasks, onEdit }: { month: Date; setMonth: (date: Date) => void; tasks: Task[]; onEdit: (task: Task) => void }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1), days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(), offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: offset + days }, (_, index) => index < offset ? null : new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  return <div className="calendar"><div className="calendar-nav"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><h3>{month.toLocaleString([], { month: "long", year: "numeric" })}</h3><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div><div className="weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((date, index) => <div className={`calendar-day ${date && isoDate(date.toISOString()) === isoDate(new Date().toISOString()) ? "today" : ""}`} key={index}>{date && <><b>{date.getDate()}</b>{tasks.filter((task) => task.due_at && isoDate(task.due_at) === isoDate(date.toISOString())).map((task) => <button key={task.id} className={`calendar-task ${task.completed ? "done" : ""}`} onClick={() => onEdit(task)}>{task.title}</button>)}</>}</div>)}</div></div>;
}
function CategoryEditor({ onClose, onSave }: { onClose: () => void; onSave: (name: string, color: CategoryColor) => void }) {
  const [name, setName] = useState(""), [color, setColor] = useState<CategoryColor>("purple");
  return <div className="overlay"><div className="modal-card small-modal"><div className="drawer-head"><div><div className="eyebrow">NEW CATEGORY</div><h2>Add category</h2></div><button className="close" onClick={onClose}><X /></button></div><form className="form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim(), color); }}><label>Name<input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Systems CS" /></label><label>Accent<select value={color} onChange={(e) => setColor(e.target.value as CategoryColor)}><option value="purple">Purple</option><option value="teal">Teal</option></select></label><div className="drawer-actions"><span /><button type="button" className="button muted" onClick={onClose}>Cancel</button><button className="button primary">Add category</button></div></form></div></div>;
}
function ReportModal({ tasks, categories, onClose }: { tasks: Task[]; categories: Category[]; onClose: () => void }) {
  const done = tasks.filter((task) => task.completed).length;
  return <div className="overlay"><div className="modal-card"><div className="drawer-head"><div><div className="eyebrow">AUTO-SAVED REPORT</div><h2>Progress snapshot</h2></div><button className="close" onClick={onClose}><X /></button></div><div className="report-grid"><div><b>{tasks.length}</b><small>items</small></div><div><b>{done}</b><small>completed</small></div><div><b>{tasks.length ? Math.round(done / tasks.length * 100) : 0}%</b><small>completion rate</small></div></div><h4>By category</h4>{categories.map((category) => { const list = tasks.filter((task) => task.category_id === category.id); return <div className="report-line" key={category.id}><span>{category.name}</span><span>{list.filter((task) => task.completed).length} / {list.length}</span></div>; })}</div></div>;
}
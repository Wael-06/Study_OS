from __future__ import annotations

import json
import os
import platform
import sqlite3
import subprocess
import threading
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file

try:
    from notifypy import Notify
except Exception:
    Notify = None

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("STUDY_OS_DB_PATH", BASE_DIR / "data" / "study_os.db"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)

DEFAULT_CATEGORIES = [
    ("systems", "Systems CS", "purple"),
    ("math_algo", "Math & Algorithms", "purple"),
    ("ml", "Machine Learning", "teal"),
    ("backend", "Backend", "teal"),
    ("cp", "Competitive Programming", "purple"),
]


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            parent_id TEXT,
            title TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'task',
            url TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            priority TEXT NOT NULL DEFAULT 'medium',
            due_at TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            overdue_notified_at TEXT,
            FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE,
            FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL UNIQUE,
            enabled INTEGER NOT NULL DEFAULT 1,
            mode TEXT NOT NULL DEFAULT 'once',
            remind_at TEXT,
            interval_minutes INTEGER,
            weekdays TEXT,
            last_sent_at TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT,
            action TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE SET NULL
        );
        """
    )
    # v1 -> v1.1 migrations for already-created databases.
    task_columns = {row[1] for row in conn.execute("PRAGMA table_info(tasks)").fetchall()}
    if "position" not in task_columns:
        conn.execute("ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0")
        rows = conn.execute("SELECT id, category_id, parent_id FROM tasks ORDER BY created_at, id").fetchall()
        counters = {}
        for row in rows:
            key = (row[1], row[2] or "")
            pos = counters.get(key, 0)
            conn.execute("UPDATE tasks SET position=? WHERE id=?", (pos, row[0]))
            counters[key] = pos + 1
    if "overdue_notified_at" not in task_columns:
        conn.execute("ALTER TABLE tasks ADD COLUMN overdue_notified_at TEXT")

    count = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    if count == 0:
        for i, (cid, name, color) in enumerate(DEFAULT_CATEGORIES):
            conn.execute("INSERT INTO categories(id,name,color,position) VALUES (?,?,?,?)", (cid, name, color, i))
    conn.commit()
    conn.close()


def now_iso():
    return datetime.now().replace(microsecond=0).isoformat(timespec="seconds")


def row_to_dict(row):
    return dict(row) if row else None


def log_activity(conn, task_id, action):
    conn.execute(
        "INSERT INTO activity(task_id, action, created_at) VALUES (?,?,?)",
        (task_id, action, now_iso()),
    )


def send_notification(title: str, message: str):
    try:
        if Notify:
            notification = Notify()
            notification.title = title
            notification.message = message
            notification.send(block=False)
            return True
    except Exception:
        pass

    system = platform.system()
    try:
        if system == "Linux":
            subprocess.Popen(["notify-send", title, message])
            return True
        if system == "Windows":
            ps = (
                "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; "
                "$xml = New-Object Windows.Data.Xml.Dom.XmlDocument; "
                f"$xml.LoadXml('<toast><visual><binding template=\"ToastGeneric\"><text>{title}</text><text>{message}</text></binding></visual></toast>'); "
                "$toast = [Windows.UI.Notifications.ToastNotification]::new($xml); "
                "$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Study OS'); "
                "$notifier.Show($toast);"
            )
            subprocess.Popen(["powershell", "-NoProfile", "-Command", ps], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
    except Exception:
        pass
    return False


def reminder_due(reminder, now):
    if not reminder["enabled"] or not reminder["remind_at"]:
        return False
    remind_at = datetime.fromisoformat(reminder["remind_at"])
    last_sent = datetime.fromisoformat(reminder["last_sent_at"]) if reminder["last_sent_at"] else None
    mode = reminder["mode"]

    if mode == "once":
        return now >= remind_at and last_sent is None
    if mode == "daily":
        if now.time() < remind_at.time():
            return False
        return last_sent is None or last_sent.date() < now.date()
    if mode == "weekly":
        days = set()
        try:
            days = {int(x) for x in json.loads(reminder["weekdays"] or "[]")}
        except Exception:
            pass
        if now.weekday() not in days or now.time() < remind_at.time():
            return False
        return last_sent is None or last_sent < now.replace(hour=0, minute=0, second=0)
    if mode == "interval":
        mins = reminder["interval_minutes"] or 0
        if not last_sent:
            return now >= remind_at
        return now >= last_sent + timedelta(minutes=mins)
    return False


def reminder_worker():
    while True:
        try:
            conn = db()
            current = datetime.now().replace(second=0, microsecond=0)

            # Real overdue reminder: any unfinished item with a due time gets one
            # desktop notification after the deadline, even without a custom reminder.
            overdue_rows = conn.execute(
                "SELECT id, title, due_at FROM tasks WHERE completed=0 AND due_at IS NOT NULL AND due_at <= ? AND overdue_notified_at IS NULL",
                (current.isoformat(timespec="minutes"),),
            ).fetchall()
            for task in overdue_rows:
                if send_notification("Study OS — overdue", task["title"]):
                    conn.execute("UPDATE tasks SET overdue_notified_at=? WHERE id=?", (current.isoformat(timespec="minutes"), task["id"]))
                    conn.commit()

            rows = conn.execute(
                "SELECT r.*, t.title, t.completed FROM reminders r JOIN tasks t ON t.id=r.task_id WHERE r.enabled=1"
            ).fetchall()
            for r in rows:
                if r["completed"]:
                    continue
                if reminder_due(r, current):
                    if send_notification("Study OS reminder", r["title"]):
                        conn.execute("UPDATE reminders SET last_sent_at=? WHERE id=?", (current.isoformat(timespec="minutes"), r["id"]))
                        conn.commit()
            conn.close()
        except Exception:
            pass
        time.sleep(30)


init_db()
threading.Thread(target=reminder_worker, daemon=True).start()


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/state")
def state():
    conn = db()
    cats = conn.execute("SELECT * FROM categories ORDER BY position").fetchall()
    tasks = conn.execute("SELECT * FROM tasks ORDER BY category_id, COALESCE(parent_id, ''), position, created_at").fetchall()
    reminders = conn.execute("SELECT * FROM reminders").fetchall()
    conn.close()
    return jsonify({
        "categories": [dict(c) for c in cats],
        "tasks": [dict(t) for t in tasks],
        "reminders": [dict(r) for r in reminders],
    })


@app.post("/api/categories")
def create_category():
    payload = request.get_json(force=True)
    cid = uuid.uuid4().hex
    conn = db()
    pos = conn.execute("SELECT COALESCE(MAX(position), -1)+1 FROM categories").fetchone()[0]
    conn.execute("INSERT INTO categories(id,name,color,position) VALUES (?,?,?,?)", (cid, payload["name"].strip(), payload.get("color", "purple"), pos))
    conn.commit(); conn.close()
    return jsonify({"id": cid}), 201


@app.patch("/api/categories/<cid>")
def update_category(cid):
    payload = request.get_json(force=True)
    conn = db()
    conn.execute("UPDATE categories SET name=?, color=? WHERE id=?", (payload.get("name"), payload.get("color", "purple"), cid))
    conn.commit(); conn.close()
    return jsonify({"ok": True})


@app.delete("/api/categories/<cid>")
def delete_category(cid):
    conn = db(); conn.execute("DELETE FROM categories WHERE id=?", (cid,)); conn.commit(); conn.close()
    return jsonify({"ok": True})


@app.post("/api/tasks")
def create_task():
    p = request.get_json(force=True)
    tid = uuid.uuid4().hex
    created = now_iso()
    conn = db()
    parent_id = p.get("parent_id") or None
    sibling_count = conn.execute(
        "SELECT COUNT(*) FROM tasks WHERE category_id=? AND parent_id IS ?",
        (p["category_id"], parent_id),
    ).fetchone()[0]
    conn.execute(
        "INSERT INTO tasks(id,category_id,parent_id,title,kind,url,notes,priority,due_at,created_at,updated_at,position) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (tid, p["category_id"], parent_id, p["title"].strip(), p.get("kind", "task"), p.get("url", ""), p.get("notes", ""), p.get("priority", "medium"), p.get("due_at") or None, created, created, sibling_count),
    )
    log_activity(conn, tid, "created")
    conn.commit(); conn.close()
    return jsonify({"id": tid}), 201


@app.patch("/api/tasks/<tid>")
def update_task(tid):
    p = request.get_json(force=True)
    conn = db()
    current = conn.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
    if not current:
        conn.close(); return jsonify({"error": "not found"}), 404
    fields = {"category_id": current["category_id"], "parent_id": current["parent_id"], "title": current["title"], "kind": current["kind"], "url": current["url"], "notes": current["notes"], "priority": current["priority"], "due_at": current["due_at"], "completed": current["completed"]}
    for key in fields:
        if key in p:
            fields[key] = p[key]
    completed_at = current["completed_at"]
    if "completed" in p:
        if p["completed"] and not current["completed"]:
            completed_at = now_iso(); log_activity(conn, tid, "completed")
        elif not p["completed"] and current["completed"]:
            completed_at = None; log_activity(conn, tid, "reopened")
    overdue_notified_at = current["overdue_notified_at"] if "overdue_notified_at" in current.keys() else None
    if "due_at" in p and p.get("due_at") != current["due_at"]:
        overdue_notified_at = None
    if fields["completed"]:
        overdue_notified_at = None
    conn.execute(
        "UPDATE tasks SET category_id=?,parent_id=?,title=?,kind=?,url=?,notes=?,priority=?,due_at=?,completed=?,completed_at=?,updated_at=?,overdue_notified_at=? WHERE id=?",
        (fields["category_id"], fields["parent_id"], fields["title"], fields["kind"], fields["url"], fields["notes"], fields["priority"], fields["due_at"] or None, int(fields["completed"]), completed_at, now_iso(), overdue_notified_at, tid),
    )
    conn.commit(); conn.close()
    return jsonify({"ok": True})


@app.delete("/api/tasks/<tid>")
def delete_task(tid):
    conn = db(); conn.execute("DELETE FROM tasks WHERE id=?", (tid,)); conn.commit(); conn.close()
    return jsonify({"ok": True})


@app.post("/api/reorder")
def reorder():
    p = request.get_json(force=True)
    item_type = p.get("type")
    item_id = p.get("id")
    order = p.get("order", [])
    if item_type not in {"category", "task"} or not isinstance(order, list):
        return jsonify({"error": "invalid reorder payload"}), 400

    conn = db()
    try:
        if item_type == "category":
            for pos, cid in enumerate(order):
                conn.execute("UPDATE categories SET position=? WHERE id=?", (pos, cid))
        else:
            for pos, tid in enumerate(order):
                conn.execute("UPDATE tasks SET position=? WHERE id=?", (pos, tid))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"ok": True})


@app.put("/api/reminders/<tid>")
def put_reminder(tid):
    p = request.get_json(force=True)
    rid = uuid.uuid4().hex
    conn = db()
    existing = conn.execute("SELECT id FROM reminders WHERE task_id=?", (tid,)).fetchone()
    if existing:
        rid = existing["id"]
        conn.execute(
            "UPDATE reminders SET enabled=?,mode=?,remind_at=?,interval_minutes=?,weekdays=?,last_sent_at=? WHERE id=?",
            (int(p.get("enabled", 1)), p.get("mode", "once"), p.get("remind_at"), p.get("interval_minutes"), json.dumps(p.get("weekdays", [])), None, rid),
        )
    else:
        conn.execute(
            "INSERT INTO reminders(id,task_id,enabled,mode,remind_at,interval_minutes,weekdays) VALUES (?,?,?,?,?,?,?)",
            (rid, tid, int(p.get("enabled", 1)), p.get("mode", "once"), p.get("remind_at"), p.get("interval_minutes"), json.dumps(p.get("weekdays", []))),
        )
    conn.commit(); conn.close()
    return jsonify({"id": rid})


@app.delete("/api/reminders/<tid>")
def delete_reminder(tid):
    conn = db(); conn.execute("DELETE FROM reminders WHERE task_id=?", (tid,)); conn.commit(); conn.close()
    return jsonify({"ok": True})


@app.get("/api/report")
def report():
    conn = db()
    total = conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
    done = conn.execute("SELECT COUNT(*) FROM tasks WHERE completed=1").fetchone()[0]
    overdue = conn.execute("SELECT COUNT(*) FROM tasks WHERE completed=0 AND due_at IS NOT NULL AND due_at < ?", (now_iso(),)).fetchone()[0]
    cat_rows = conn.execute("""
        SELECT c.id, c.name, COUNT(t.id) total, COALESCE(SUM(t.completed),0) done
        FROM categories c LEFT JOIN tasks t ON t.category_id=c.id
        GROUP BY c.id, c.name ORDER BY c.position
    """).fetchall()
    seven = []
    for i in range(6, -1, -1):
        d = (datetime.now().date() - timedelta(days=i)).isoformat()
        c = conn.execute("SELECT COUNT(*) FROM activity WHERE action='completed' AND substr(created_at,1,10)=?", (d,)).fetchone()[0]
        seven.append({"date": d, "completed": c})
    conn.close()
    return jsonify({
        "total": total,
        "done": done,
        "overdue": overdue,
        "completion_rate": round(done / total * 100, 1) if total else 0,
        "categories": [dict(r) for r in cat_rows],
        "last7": seven,
    })


@app.get("/api/export")
def export_json():
    conn = db()
    data = {
        "categories": [dict(x) for x in conn.execute("SELECT * FROM categories ORDER BY position")],
        "tasks": [dict(x) for x in conn.execute("SELECT * FROM tasks ORDER BY category_id, COALESCE(parent_id, ''), position, created_at")],
        "reminders": [dict(x) for x in conn.execute("SELECT * FROM reminders")],
        "exported_at": now_iso(),
    }
    conn.close()
    out = BASE_DIR / "data" / "study-os-export.json"
    out.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return send_file(out, as_attachment=True, download_name="study-os-export.json")


@app.post("/api/import")
def import_json():
    p = request.get_json(force=True)
    conn = db()
    conn.execute("DELETE FROM reminders")
    conn.execute("DELETE FROM tasks")
    conn.execute("DELETE FROM categories")
    for i, c in enumerate(p.get("categories", [])):
        conn.execute("INSERT INTO categories(id,name,color,position) VALUES (?,?,?,?)", (c["id"], c["name"], c.get("color", "purple"), c.get("position", i)))
    for t in p.get("tasks", []):
        cols = (t["id"], t["category_id"], t.get("parent_id"), t["title"], t.get("kind", "task"), t.get("url", ""), t.get("notes", ""), t.get("priority", "medium"), t.get("due_at"), int(t.get("completed", 0)), t.get("completed_at"), t.get("created_at", now_iso()), t.get("updated_at", now_iso()), int(t.get("position", 0)), t.get("overdue_notified_at") )
        conn.execute("INSERT INTO tasks(id,category_id,parent_id,title,kind,url,notes,priority,due_at,completed,completed_at,created_at,updated_at,position,overdue_notified_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", cols)
    for r in p.get("reminders", []):
        conn.execute("INSERT INTO reminders(id,task_id,enabled,mode,remind_at,interval_minutes,weekdays,last_sent_at) VALUES (?,?,?,?,?,?,?,?)", (r["id"], r["task_id"], r.get("enabled", 1), r.get("mode", "once"), r.get("remind_at"), r.get("interval_minutes"), r.get("weekdays", "[]"), r.get("last_sent_at")))
    conn.commit(); conn.close()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("STUDY_OS_API_PORT", "5001")), debug=False)

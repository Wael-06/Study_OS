# Dtudy_OS — local study planner

A local browser app for planning and tracking study .

## v1.1 changes
- No sidebar; single focused board inspired by the uploaded references.
- Categories with progress bars.
- Tasks + nested subtasks.
- Add subtasks directly from each task — no parent-selection workflow.
- Drag handles beside categories, tasks and subtasks to rearrange order.
- Categories can be added directly beside the task/export controls.
- Priority, due dates, URLs and notes.
- Automatic saving to a local SQLite database.
- Automatic one-time desktop notification after an unfinished item's due time.
- Additional reminder modes: once, daily, weekly and every N minutes.
- Progress report with category breakdown and a 7-day completion graph.
- Manual JSON export/import for backup/share.
- GitHub sync deliberately left for v2.
- OS startup registration on Linux and Windows from the normal start script.

## Run on Linux

```bash
./start_linux.sh
```

The script creates a Python virtual environment, installs dependencies and registers:

```text
~/.config/autostart/study-os.desktop
```

After login, Study OS starts automatically and opens the local page.

## Run on Windows

Open PowerShell in the project folder and run:

```powershell
.\start_windows.ps1
```

The script creates the virtual environment, installs dependencies, creates a Startup shortcut for the current Windows user, starts the app and opens the browser.

## Local server

```text
http://127.0.0.1:5173
```

The reminder worker is part of the local app process, so OS startup keeps reminders alive without Electron or a paid service.

## Data

The real database is `data/study_os.db`. Export uses `data/study-os-export.json`.

# Study OS File-by-File Explanation

This file explains every important file in the project and what role it plays. The goal is to make the project easier to understand without rereading the whole codebase.

---

## Root project files

### [README.md](../README.md)
Purpose:
- high-level project documentation
- explains the idea, motivation, architecture, and development history

What it tells you:
- this app is a local study planner
- the project evolved from a Flask app into a React + TypeScript frontend
- it is meant to help with study planning, tasks, due dates, reminders, and progress tracking

Why it matters:
- it explains the intended architecture but not necessarily the current startup reality
- it helps you understand that this repo is a transition between old and new versions

---

### [package.json](../package.json)
Purpose:
- defines frontend scripts and dependencies
- tells how to run the app in development mode

Main scripts:
- `npm run dev` → starts backend and frontend together
- `npm run build` → builds the React app for production

Important detail:
- this project expects two services to run together
- Vite runs on port 5000 and the TypeScript API runs on port 5001

---

### [requirements.txt](../requirements.txt)
Purpose:
- Python dependencies for the backend

Packages:
- TypeScript API (`server/index.ts`)
- notify-py

Why it matters:
- if this isn’t installed, the backend fails
- The TypeScript API serves state and handles tasks, categories, reminders, and persistence

---

### [server/index.ts](../server/index.ts)
Purpose:
- active TypeScript HTTP server
- core backend logic
- SQLite database creation and API endpoints

What it contains:
- database initialization with SQLite
- default categories setup
- task/category/reminder tables
- API route handling and SQLite persistence
- API routes for reading/writing app data
- import/export logic
- app startup setup

Key database tables:
- `categories`
- `tasks`
- `reminders`
- `activity`

Important endpoints:
- `GET /api/state` → return task-category-reminder state
- `POST /api/tasks` → create a task
- `PATCH /api/tasks/<id>` → update a task
- `DELETE /api/tasks/<id>` → delete a task
- `POST /api/categories` → create category
- `PUT /api/reminders/<id>` → add or update reminder
- `DELETE /api/reminders/<id>` → delete reminder
- `GET /api/report` → summary report
- `GET /api/export` → export JSON backup
- `POST /api/import` → restore data from JSON

- this is the active data and logic layer
- the frontend depends on it for everything it shows

### [app.py](../app.py)
Purpose:
- legacy Flask implementation retained for rollback/reference during migration

Do not add new application behavior here unless deliberately maintaining the fallback implementation.

---

### [index.html](../index.html)
Purpose:
- project root HTML file

Why it matters:
- this is not the same as the Flask template file in [templates/index.html](../templates/index.html)
- it is part of the root workspace and may be used by build or static hosting scenarios

---

## Backend and app template files

### [templates/index.html](../templates/index.html)
Purpose:
- legacy Flask-rendered UI
- loads CSS and JavaScript for the old app

What it includes:
- page structure for the old dashboard
- buttons like Add task, Report, Import, Export
- placeholder DOM for the old UI

Why it matters:
- this is part of the old app
- it is not the React interface shown by the modern app

---

### [static/style.css](../static/style.css)
Purpose:
- styling for the old vanilla JS UI

Why it matters:
- it belongs to the legacy app
- it is separate from the modern React styling file in [src/styles.css](../src/styles.css)

---

### [static/app.js](../static/app.js)
Purpose:
- old frontend logic for the non-React app

What it does:
- loads app state from `/api/state`
- renders categories and tasks directly into DOM
- handles add/edit/delete task flows
- handles reminders, report panel, import/export
- manages drag-and-drop reorder logic

Why it matters:
- this is older app logic kept in the repo
- it explains the existence of multiple user interfaces in the project

---

## Vite and frontend setup

### [vite.config.ts](../vite.config.ts)
Purpose:
- Vite dev server configuration
- sets ports and API proxy rules

What it does:
- serves the frontend at port 5000
- proxies `/api` requests to the TypeScript API at 5001

Why it matters:
- this is the critical link between UI and backend
- if proxy rules are wrong, the UI cannot fetch data from Flask

---

### [vite.config.js](../vite.config.js)
Purpose:
- generated JavaScript version of the Vite config
- same role as the TypeScript version

Why it matters:
- it is generated output and should not be edited by hand
- edit `vite.config.ts`, then run the build when configuration changes

---

## React app source files

### [src/main.tsx](../src/main.tsx)
Purpose:
- React entry point

What it does:
- renders the root React app into the DOM
- imports the CSS file
- mounts the main App component

Why it matters:
- it is the actual frontend bootstrap for the modern app

---

### [src/App.tsx](../src/App.tsx)
Purpose:
- main application UI

What it contains:
- shell layout and app sections
- board view
- calendar view
- CP lab section
- task editor modal
- category editor
- report modal
- search and near-due queue
- import/export UI
- notifications and local state logic

Why it matters:
- this is the modern UI that users actually expect to run
- it is the center of the app logic

Important subcomponents inside this file:
- `CpLab` → competitive programming tracker
- `CategoryCard` → renders category board sections
- `TaskRow` → renders each task and nested subtask
- `TaskEditor` → modal form for task creation/edit
- `CalendarView` → monthly view for task due dates
- `CategoryEditor` → category creation form
- `ReportModal` → progress snapshot panel
- `JsonFormatModal` → example JSON format panel

---

### [src/api.ts](../src/api.ts)
Purpose:
- frontend API client

What it does:
- wraps fetch calls for backend endpoints
- makes the React app talk to the TypeScript API

Key exports:
- `api.state()` → fetches app state
- `api.createTask()` → creates a task
- `api.updateTask()` → updates a task
- `api.deleteTask()` → deletes a task
- `api.createCategory()` → creates a category
- `api.reorder()` → reorders tasks/categories
- `api.putReminder()` → adds or edits reminder
- `api.deleteReminder()` → removes reminder

Why it matters:
- if this fails, the UI cannot load data
- it represents the frontend contract with the backend

---

### [src/types.ts](../src/types.ts)
Purpose:
- TypeScript type definitions for the data model

Defines:
- `Category`
- `Task`
- `Reminder`
- `AppState`
- `TaskDraft`

Why it matters:
- makes frontend code consistent with backend JSON structure
- prevents mismatches between expected and returned data

---

### [src/styles.css](../src/styles.css)
Purpose:
- styling for the modern React app

Why it matters:
- this is the design layer for the current app version
- it is separate from the legacy CSS file

---

## Data and sample files

### [data/sample-study-plan.json](../data/sample-study-plan.json)
Purpose:
- example or test data for the planner

Why it matters:
- useful for import testing
- helps understand how saved plan data should look

---

## Documentation files

### [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
Purpose:
- explains the intended architecture and system layout

Why it matters:
- useful when understanding the overall design of the app

---

### [docs/PROJECT_GUIDE.md](../docs/PROJECT_GUIDE.md)
Purpose:
- likely developer guidance for working on the project

Why it matters:
- gives operational or project-level direction for development

---

### [docs/DEBUGGING_RUNBOOK.md](./DEBUGGING_RUNBOOK.md)
Purpose:
- provides the manual bug-fixing, testing, and recovery workflow

Why it matters:
- acts as the first reference when diagnosing a regression

---

### [docs/FILE_EXPLANATIONS.md](./FILE_EXPLANATIONS.md)
Purpose:
- complete overview of the project files and responsibilities

Why it matters:
- gives a quick-reference map for the repo

---

## Summary of the whole project

This repo is a study planner with:
- a local TypeScript backend
- SQLite storage
- a React frontend for the modern UI
- a legacy vanilla JS app still present in the repo

The main challenge is preserving behavior while moving from the older Python implementation to the TypeScript implementation.

Once you understand that the app is split into backend + frontend + legacy UI, the project becomes much easier to reason about.

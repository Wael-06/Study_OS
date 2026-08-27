# Study Planner

> A local-first study planning and execution system built because I needed a better way to learn.

Study Planner is a personal productivity and learning system for turning vague goals into concrete work, tracking progress, and keeping the entire learning journey in one place.

It started as a simple study planner. Over time, it became something much more personal: a tool shaped by the way I actually learn, the things I repeatedly forget, the periods where I lose focus, and the engineering skills I wanted to develop along the way.

## Why I built this

I did not build Study Planner because I wanted another generic todo application.

I built it because I kept falling into the same cycle: I would decide I wanted to learn a huge amount of material, collect courses, videos, articles, problems and project ideas, become distracted, lose track of what I actually wanted, and eventually forget why I started learning something in the first place.

At one point, I even built a CLI to solve this problem. It was bad, unfinished, and eventually forgotten.

Then I returned to the same problem: I was becoming unfocused again.

That was the push I needed.

Instead of making another temporary planning document, I decided to build the system I actually wanted to use.

The result is Study Planner.

## A month-long engineering journey

The current version is the result of roughly a month of experimentation, rebuilding, debugging, learning, and changing direction.

The project began as a Python study planner using Flask and a vanilla frontend. From there, I added local persistence, reminders, automatic startup, progress tracking, a calendar, and increasingly structured task management.

Eventually the original frontend became a bottleneck. The growing UI had more state, nested relationships, and interactions than I wanted to manage with an increasingly ad-hoc vanilla frontend.

That led to the current architecture:

**React + TypeScript + Vite** for the frontend, with **Flask + SQLite** remaining as the local backend and persistence layer.

This was not just a technology upgrade. It became part of the learning goal of the project: Study Planner should help me learn the engineering concepts I am using, not just produce a working interface.

## What Study Planner became

The original idea was simple: put study material into a queue so I could work through it without constantly deciding what to watch or read next.

That idea grew into a system built around:

- **Topics and categories** for larger learning areas.
- **Tasks and nested subtasks** for executable work.
- **Due dates and priorities** to make plans actionable.
- **A calendar** to give the learning journey a time dimension.
- **Near-due work** so important tasks do not disappear inside a large plan.
- **Progress tracking** to make completed work visible.
- **Local notifications and reminders** without depending on a paid service.
- **JSON export/import** so the data remains portable.
- **A local-first architecture** that runs on the machine and remains understandable.

The project is also moving toward an in-app **Competitive Programming Lab**.

The goal is not simply to count solved Codeforces problems. It is to test whether I actually understand them.

For example, if I solved a problem with help from a friend or by looking at an answer, Study Planner should be able to remember that problem and bring it back later for deliberate review.

The planned CP Lab includes:

- Codeforces history fetched from a handle.
- A record of problems solved with outside help.
- Delayed re-testing to verify whether the idea was actually learned.
- Review sessions inside future study plans.
- A stopwatch for recording how long each problem took.
- A distinction between **having seen a solution** and **being able to reproduce the solution independently**.

## Current architecture

```text
Browser
│
└── React + TypeScript (Vite)
    ├── Study board
    ├── Nested task rows
    ├── Calendar
    ├── Near-due queue
    ├── Browser notifications
    └── fetch('/api/...')
            │
            ▼
        Flask API
            │
            ▼
        SQLite
```

The frontend owns the application experience and typed client-side data flow.

The Flask layer remains responsible for the local API and persistence behavior.

SQLite keeps the system simple, portable, and dependency-light.

## Technology

### Frontend

- React
- TypeScript
- Vite
- Browser Notification API

### Backend

- Python
- Flask
- SQLite

### Development

- Git / GitHub
- Linux-first workflow
- Local startup scripts
- JSON export/import

## Building the UI with AI

A significant part of the current frontend was developed with AI assistance.

The UI was not generated blindly. I provided the product direction, sketches, interaction ideas, constraints, and visual structure, then used AI as an implementation partner.

The design was influenced by interfaces I like, including the clarity and compactness of the NeetCode ecosystem, while adapting those ideas to the broader problem of managing an entire learning journey.

This project gave me practical experience with AI-assisted development and agent-style workflows: describing a change, reviewing generated code, debugging incorrect assumptions, restructuring code, and learning how to give an AI enough context to be useful without giving up engineering judgment.

That experience is one of the most valuable outcomes of the project.

## Version history

### v1.2 — React + TypeScript frontend

- Reworked the frontend around React and TypeScript.
- Introduced typed frontend models and API helpers.
- Moved away from an increasingly difficult-to-maintain vanilla frontend.
- Kept Flask and SQLite as the local persistence layer.
- Continued iterating on the board, task hierarchy, calendar, reminders, and supporting workflows.
- Used AI much more heavily as a frontend development partner.

The migration was motivated by a real engineering bottleneck rather than technology chasing.

### v1.1 — Planner becomes a usable local system

- Single focused board with no permanent sidebar.
- Categories with progress bars.
- Tasks and nested subtasks.
- Direct subtask creation from each task.
- Drag-and-drop reordering.
- Priorities, due dates, URLs, and notes.
- SQLite persistence.
- One-time overdue desktop notifications.
- Daily, weekly, and interval reminders.
- Progress reports and a 7-day completion graph.
- JSON export/import.
- Linux and Windows startup registration.

### v1.0 — The original planner

- Python + Flask backend.
- Vanilla frontend.
- Study planning around categories and tasks.
- Local persistence.

## Current limitations

Study Planner is still a personal engineering project, not a polished commercial product.

There are known bugs and rough edges, especially around some of the more complex task/subtask interactions and the transition between the old backend model and the newer frontend architecture.

One known example is task selection behavior around nested subtasks.

I am solving these problems one at a time instead of pretending the system is finished.

## Running locally

### Linux

```bash
./start_linux.sh
```

### Windows

```powershell
.\start_windows.ps1
```

### Development

```bash
npm run dev
```

### Production frontend build

```bash
npm run build
```

The local application uses the browser frontend with the Flask API behind it.

## Data

The application stores its local database at:

```text
data/study_os.db
```

Exported study data is written to:

```text
data/study-os-export.json
```

## Project status

Study Planner is actively evolving.

The direction is to make it less like a simple task manager and more like an actual **learning operating system**: something that takes me from intention → planning → execution → review → measurement.

The Competitive Programming Lab is one of the next major steps toward that goal.

## Why this repository matters to me

This repository is more than a productivity app.

It is a record of a period where I was trying to become more disciplined about learning while simultaneously learning how to engineer better software.

The project has changed whenever my problems changed.

> **Build the tool you need when you discover the problem, then use the tool to understand the problem better.**

Study Planner exists because I got distracted, forgot what I wanted, started over, built something bad, came back to the same problem, and finally decided to build the system instead of complaining about the problem.

For the full story, see [`DEVELOPMENT_JOURNEY.md`](DEVELOPMENT_JOURNEY.md).
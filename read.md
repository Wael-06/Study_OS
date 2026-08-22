# Study OS — TypeScript + Vite + React

Study OS is a local-first study planning and execution system built around a React + TypeScript frontend and a Flask API.

## Included

* React + TypeScript frontend
* Vite configuration
* Flask API
* SQLite data model
* Competitive Programming lab
* Codeforces synchronization
* Calendar
* Near-due work queue
* Local notifications
* Linux-first workflow
* Project guide
* Architecture documentation

## Excluded

The project archive does **not** include:

* `node_modules/`
* Build output
* Caches
* Local SQLite database

---

## Run It in Replit

1. Download the project ZIP.
2. Upload and extract it into a Replit project.
3. Open the Replit Shell.
4. Install the frontend dependencies:

```bash
npm install
```

5. Start the application:

```bash
npm run dev
```

6. Open the Replit preview.

The project runs:

* **React/Vite:** port `5000`
* **Flask API:** port `5173`

---

## Run It Locally on Linux

After extracting the ZIP:

```bash
cd study-os
```

Install the frontend dependencies:

```bash
npm install
```

Install the Python dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Start the application:

```bash
npm run dev
```

Then open:

```text
http://localhost:5000
```

### Requirements

If Node.js or Python is not installed, use:

* **Node.js 20 or newer**
* **Python 3.11 or newer**

---

## Documentation

The main beginner-friendly documentation is located in:

```text
docs/PROJECT_GUIDE.md
docs/ARCHITECTURE.md
```

Start with `PROJECT_GUIDE.md` if you are new to the project.

Use `ARCHITECTURE.md` when you need to understand how the frontend, Flask API, database, synchronization, and other components fit together.

---

## Project Development Model

Study OS is designed to be developed locally first, with the browser acting as the primary interface.

The main development flow is:

```text
React + TypeScript
        ↓
      Vite
        ↓
   Flask API
        ↓
     SQLite
```

Additional application functionality such as Codeforces synchronization, the CP lab, calendar, notifications, and due-work processing is built around this core architecture.

The goal is to keep the project easy to run, inspect, modify, and extend without requiring a hosted database or paid external service.


---
name: Python runtime availability
description: Replit environment behavior for projects that keep a Python backend beside a Node frontend.
---

The workspace can have Node tooling available while no `python` or `python3` executable is present in the workflow environment. Install the Python module through the supported package-management flow before starting a Flask workflow.

**Why:** The imported app's combined Vite/Flask workflow initially failed with exit code 127 even though the shell and project files were otherwise ready.

**How to apply:** Check `command -v python3` before relying on a Python backend, and use `python3` in the workflow command once the runtime is installed.
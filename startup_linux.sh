#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
APP_DIR="$(pwd)"

if pgrep -f "npm run dev.*$APP_DIR" >/dev/null 2>&1; then
  exit 0
fi

npm install --no-fund --no-audit >/dev/null

nohup npm run dev >/tmp/study-os.log 2>&1 &
sleep 2
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:5000" >/dev/null 2>&1 || true
fi

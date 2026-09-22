#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
APP_DIR="$(pwd)"

npm install --no-fund --no-audit >/dev/null

mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/study-os.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Study OS
Comment=Start the local Study OS reminder service
Exec=$APP_DIR/startup_linux.sh
Terminal=false
X-GNOME-Autostart-enabled=true
DESKTOP

echo "Study OS startup registered for this Linux user."
npm run dev

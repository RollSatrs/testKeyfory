#!/usr/bin/env sh
set -e

# If node_modules is empty because of bind mount, (re)install deps
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "[entrypoint] Installing dependencies..."
  npm ci --include=optional || npm install --include=optional
fi

# Workaround npm optional deps issue for rollup native binaries
# Ensure rollup optional package for linux-x64-gnu gets installed when missing
if node -e "require('fs').accessSync('node_modules/@rollup/rollup-linux-x64-gnu', 0)" 2>/dev/null; then
  echo "[entrypoint] Rollup native present."
else
  echo "[entrypoint] Installing rollup native binary..."
  npm i -D @rollup/rollup-linux-x64-gnu || true
fi

if node -e "require('fs').accessSync('node_modules/lightningcss/node/lightningcss.linux-x64-gnu.node', 0)" 2>/dev/null; then
  echo "[entrypoint] lightningcss native present."
else
  echo "[entrypoint] Installing lightningcss native binary..."
  npm i -D lightningcss-linux-x64-gnu || true
fi

exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort

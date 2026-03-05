#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Replit deploy: load nix profile so node/npm are in PATH
if [ -f /home/runner/.nix-profile/etc/profile.d/nix.sh ]; then
  . /home/runner/.nix-profile/etc/profile.d/nix.sh
fi
export PATH="/home/runner/.nix-profile/bin:/usr/local/bin:/usr/bin:$PATH"
if command -v npm >/dev/null 2>&1; then
  npm install
fi
# Use node from PATH or find it in common locations (Replit Promote often has no PATH)
NODE=$(command -v node 2>/dev/null || true)
if [ -z "$NODE" ]; then
  for p in /home/runner/.nix-profile/bin/node /usr/local/bin/node /usr/bin/node; do
    if [ -x "$p" ]; then NODE=$p; break; fi
  done
fi
if [ -z "$NODE" ]; then
  echo "error: node not found. In Replit Deploy → Adjust settings, ensure Runtime/Environment is Node.js."
  exit 1
fi
exec "$NODE" server.js

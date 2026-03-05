#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Replit deploy: load nix profile so node/npm are in PATH
if [ -f /home/runner/.nix-profile/etc/profile.d/nix.sh ]; then
  . /home/runner/.nix-profile/etc/profile.d/nix.sh
fi
export PATH="/home/runner/.nix-profile/bin:/usr/local/bin:$PATH"
if command -v npm >/dev/null 2>&1; then
  npm install
fi
# Ensure node is available (same path as npm when from nix)
NODE=$(command -v node 2>/dev/null || echo "")
if [ -z "$NODE" ] && [ -x /home/runner/.nix-profile/bin/node ]; then
  export PATH="/home/runner/.nix-profile/bin:$PATH"
fi
exec node server.js

#!/bin/sh
# Pull, rebuild, test. Rebuild is the point: Claude runs dist/, so a bare
# git pull leaves it serving the old compiled code.
set -e
cd "$(dirname "$0")"
git pull --ff-only "${1:-origin}" main
npm install --silent
npm run build
npm test
echo "Done — restart Claude Code to load the new build."

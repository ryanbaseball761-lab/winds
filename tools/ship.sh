#!/bin/bash
# Ship a game update: bump the version, build, run the regression suite, publish to GitHub.
# Usage: tools/ship.sh 0.42.0 "what changed"
set -e; cd "$(dirname "$0")/.."; V="$1"; MSG="$2"
[ -z "$V" ] && { echo "usage: tools/ship.sh VERSION \"message\""; exit 1; }
sed -i "s/^const TW_VERSION = '[^']*';/const TW_VERSION = '$V';/" src/js/027-core.js
bash tools/build.sh
node tests/run.js || { echo "Tests failed: not shipping."; exit 1; }
printf '{"version":"%s","file":"index.html"}\n' "$V" > version.json
git add -A
git commit -q -m "Trade Winds $V: $MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017SMXwCmr6gCAUaSmHvTZKj"
git push -q origin HEAD:main && echo "shipped $V"

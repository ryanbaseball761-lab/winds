#!/bin/bash
# Ship a game update: check the version, build, run the regression suite, refresh the screen snapshots, publish to GitHub.
# Usage: tools/ship.sh 0.62.0 "what changed"
# Review `node tests/snapshot.js` differences BEFORE shipping: this script saves the current screens as the new baseline.
set -e; cd "$(dirname "$0")/.."; V="$1"; MSG="$2"
[ -z "$V" ] || [ -z "$MSG" ] && { echo "usage: tools/ship.sh VERSION \"message\""; exit 1; }
[[ "$V" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Version must look like 1.2.3"; exit 1; }
CUR=$(sed -n 's/.*"version":"\([^"]*\)".*/\1/p' version.json)
NEWER=$(printf '%s\n%s\n' "$CUR" "$V" | sort -V | tail -1)
{ [ "$NEWER" = "$V" ] && [ "$V" != "$CUR" ]; } || { echo "Version $V must be newer than the published $CUR (players only update to newer versions)."; exit 1; }
sed -i "s/^const TW_VERSION = '[^']*';/const TW_VERSION = '$V';/" src/js/027-core.js
bash tools/build.sh
node tests/run.js || { echo "Tests failed: not shipping."; git checkout -q -- src/js/027-core.js index.html; exit 1; }
node tests/snapshot.js save
printf '{"version":"%s","file":"index.html"}\n' "$V" > version.json
git add -A
git commit -q -m "Trade Winds $V: $MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017SMXwCmr6gCAUaSmHvTZKj"
git push -q origin HEAD:main && echo "shipped $V"

#!/bin/bash
# Builds index.html from src/. The game script is the files in src/order.txt, in that order.
set -e; cd "$(dirname "$0")/.."
{ cat src/app-pre.html; cat src/head.html; echo '<script>'; while read -r f; do [ -n "$f" ] && cat "src/js/$f"; done < src/order.txt; echo '</script>'; echo '<script>'; cat src/app-post.js; echo '</script></body></html>'; } > index.html.new
mv index.html.new index.html

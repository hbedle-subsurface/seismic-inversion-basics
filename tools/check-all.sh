#!/bin/sh
# Everything, in one command. Run before publishing.
for m in modules/*.html; do node tools/check-module.js "$m"   | tail -1; done
for m in modules/*.html; do node tools/check-panelout.js "$m" | tail -1; done
for m in modules/*.html; do node tools/check-glossary.js "$m" | sed -n '1p;3p;5p'; done
node tools/check-index.js    | tail -1
node tools/check-links.js
node tools/check-panels.js
node tools/check-head.js     | tail -1
node tools/check-overflow.js | tail -1
node tools/check-tabs.js     | tail -1
node tools/check-tabnav.js   | tail -1
node tools/check-terms.js    | head -1
node tools/check-reading.js  | tail -1
node tools/check-game.js     | tail -1
node tools/verify-fixes.js   | tail -1
echo
echo "Any line above that is not a pass is a failure; the script runs every"
echo "check rather than stopping at the first one."
echo
echo "check-steprefs.js and check-tie.js print for reading by eye; they have"
echo "no pass or fail, so they are not run here."

/* Will the tab strip fit on one line?

   The strip wraps gracefully now, but a module whose tabs need two rows still
   reads as a mistake before it reads as a design. This estimates the width of
   every button at the stylesheet's font and padding and compares it against the
   page's max width, so a step added with a long label is caught at the point it
   is added rather than in a screenshot.

   The estimate is deliberately generous — 7.1 px per character at 12.5 px in
   the body face, plus 25 px of padding and border per button — so a module that
   passes here has real room to spare. */
const fs = require('fs');
const MAXW = 1220;            // --maxw in assets/style.css
const PER_CHAR = 7.1, PER_BUTTON = 25, GAP = 3, SPACER = 14;
let fails = 0;
for (const f of fs.readdirSync('modules').filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync('modules/' + f, 'utf8');
  const labels = [...html.matchAll(/<button role="tab"[^>]*>([^<]*)<\/button>/g)]
    .map((m) => m[1].trim());
  if (!labels.length) continue;
  const w = labels.reduce((s, l) => s + l.length * PER_CHAR + PER_BUTTON, 0)
          + GAP * (labels.length - 1) + SPACER;
  const over = w - MAXW;
  const name = f.replace('.html', '').padEnd(30);
  if (over > 0) {
    fails++;
    console.log(name + 'WRAPS — about ' + Math.round(over) + ' px too wide for one line');
    console.log('   longest: ' + labels.slice().sort((a, b) => b.length - a.length)
                                       .slice(0, 3).map((l) => '"' + l + '"').join('  '));
  } else {
    console.log(name + 'fits, ' + Math.round(-over) + ' px to spare');
  }
}
console.log(fails ? '\ntab strips that wrap: ' + fails : '\nevery tab strip fits on one line');
process.exitCode = fails ? 1 : 0;

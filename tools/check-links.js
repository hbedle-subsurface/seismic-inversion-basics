/* Every internal link in the set has to point at a file that exists, and every
   module has to be reachable from the landing page. Cheap to run, and the one
   thing a renumber breaks silently. */
const fs = require('fs'), path = require('path');
let fails = 0;
const pages = ['index.html','glossary.html',
  ...fs.readdirSync('modules').filter(f=>f.endsWith('.html')).map(f=>'modules/'+f)];
for (const page of pages) {
  const dir = path.dirname(page);
  const html = fs.readFileSync(page,'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"#:]+\.(?:html|js|css))(?:#[^"]*)?"/g)) {
    const target = path.normalize(path.join(dir, m[1]));
    if (!fs.existsSync(target)) { fails++; console.log('  BROKEN ' + page + ' -> ' + m[1]); }
  }
}
/* The markdown is checked too. A renumber that misses the README leaves a
   broken link on the first page anyone arriving from GitHub reads, and the
   HTML pass above would never see it. */
const docs = fs.readdirSync('.').filter(f=>f.endsWith('.md'));
for (const page of docs) {
  const md = fs.readFileSync(page,'utf8');
  for (const m of md.matchAll(/\]\(([^)\s#:]+\.(?:html|js|css|md))(?:#[^)]*)?\)/g)) {
    const target = path.normalize(m[1]);
    if (!fs.existsSync(target)) { fails++; console.log('  BROKEN ' + page + ' -> ' + m[1]); }
  }
}
const linked = new Set([...fs.readFileSync('index.html','utf8')
  .matchAll(/href="modules\/([^"]+\.html)"/g)].map(m=>m[1]));
for (const f of fs.readdirSync('modules')) {
  if (f.endsWith('.html') && !linked.has(f)) { fails++; console.log('  UNLINKED ' + f + ' is not on the landing page'); }
}
console.log(fails ? 'broken or unlinked: ' + fails : 'all internal links resolve, all modules linked');
process.exitCode = fails ? 1 : 0;

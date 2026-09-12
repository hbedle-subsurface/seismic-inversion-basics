/* Every "step N" in the prose, with the step it actually points at.

   Reordering a module's tabs does not move the references to it in prose, and
   nothing else catches that: the page still works, it just tells the student to
   look in the wrong place. This cannot be checked automatically — only a person
   knows what a sentence meant — so it prints each reference alongside the title
   of the step it now names, which makes a wrong one obvious to read. */
const fs = require('fs');
for (const f of fs.readdirSync('modules').filter((x) => x.endsWith('.html'))) {
  const raw = fs.readFileSync('modules/' + f, 'utf8');
  const titles = {};
  for (const m of raw.matchAll(/<h3><span class="stepno[^"]*">(\d)<\/span>([^<]*)<\/h3>/g)) {
    titles[m[1]] = m[2].trim();
  }
  const prose = raw.replace(/<script[\s\S]*?<\/script>/g, '');
  const refs = [];
  for (const m of prose.matchAll(/[Ss]tep (\d)/g)) {
    const n = m[1];
    const around = prose.slice(Math.max(0, m.index - 60), m.index + 70)
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    refs.push({ n, title: titles[n] || '(NO SUCH STEP)', around });
  }
  if (!refs.length) continue;
  console.log('\n' + f.replace('.html', '') + '   steps: ' +
    Object.entries(titles).map(([k, v]) => k + '=' + v).join(' | '));
  for (const r of refs) {
    const bad = r.title === '(NO SUCH STEP)';
    console.log('   ' + (bad ? 'BROKEN ' : '       ') + 'step ' + r.n +
                ' = ' + r.title + '\n           …' + r.around + '…');
  }
}

/* How hard is the prose to read?

   Not a readability score — those are unreliable on technical writing, where a
   long word is often the correct word. This reports the sentences a student is
   most likely to have to read twice: the very long ones, and the ones stacking
   several clauses. Anything over about 40 words is worth looking at by hand.  */
const fs = require('fs');
const LIMIT = 40;
let flagged = 0;
for (const f of fs.readdirSync('modules').filter((x) => x.endsWith('.html')).concat([])) {
  const raw = fs.readFileSync('modules/' + f, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<(details|table)[\s\S]*?<\/\1>/g, '');   // asides and tables read differently
  const proseBlocks = [...raw.matchAll(/<p class="(?:lede|sub|fix|said)">([\s\S]*?)<\/p>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  const sentences = [];
  for (const b of proseBlocks) {
    for (const sent of b.split(/(?<=[.!?])\s+/)) {
      const n = sent.split(/\s+/).filter(Boolean).length;
      if (n) sentences.push({ sent, n });
    }
  }
  if (!sentences.length) continue;
  const avg = sentences.reduce((s, x) => s + x.n, 0) / sentences.length;
  const long = sentences.filter((x) => x.n > LIMIT).sort((a, b) => b.n - a.n);
  console.log(f.replace('.html', '').padEnd(30) +
    sentences.length + ' sentences, mean ' + avg.toFixed(1) + ' words' +
    (long.length ? ', ' + long.length + ' over ' + LIMIT : ''));
  for (const l of long.slice(0, 3)) {
    flagged++;
    console.log('   ' + l.n + 'w  ' + l.sent.slice(0, 150) + (l.sent.length > 150 ? '…' : ''));
  }
}
console.log(flagged ? '\nsentences worth shortening: ' + flagged : '\nno sentence over ' + LIMIT + ' words');

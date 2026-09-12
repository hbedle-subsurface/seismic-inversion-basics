/* Is every technical term a student meets actually in the dictionary?

   The glossary script marks terms it knows. This asks the other question: which
   words in the prose are technical enough that a geology undergraduate might
   stop at them, and are they defined anywhere? The candidate list below is
   maintained by hand — there is no way to detect "this word is jargon" — so add
   to it whenever a module introduces vocabulary. */
const fs = require('fs');

const CANDIDATES = [
  'acoustic impedance','impedance','reflection coefficient','reflectivity',
  'reflectivity series','wavelet','convolution','convolved','forward problem',
  'inverse problem','non-uniqueness','resolution','wedge model','tuning',
  'bandwidth','low-frequency model','background model','relative acoustic impedance',
  'colored inversion','sparse-spike inversion','model-based inversion',
  'full-waveform inversion','post-stack inversion','pre-stack inversion',
  'deterministic inversion','stochastic inversion','prior information',
  'two-way time','polarity','zero-phase','synthetic seismogram','well tie',
  'checkshot','sonic log','bright spot','misfit','deconvolution','stacking',
  'gas sand','density log','shear impedance','shear sonic','angle gather',
  'offset','horizon','trace','amplitude','frequency','phase','spectrum',
  'amplitude spectrum','band-limited','running sum','realization','variogram',
  'time-depth curve','cycle skip','normal incidence','Ricker','interval velocity',
  'net pay','porosity','lithology','compaction','ground roll','stack',
  'seismic band','elastic property','Vp/Vs','shear wave','anticline','wedge',
  'tuning thickness','side lobe','crossplot','facies','AVO','Zoeppritz',
  'signal-to-noise','migration','angle stack','gather','P-wave','S-wave',
];

/* Deliberately not in the dictionary. The audience is geology undergraduates,
   who arrive knowing these; defining them would be condescending and would add
   noise to a page that already marks plenty of words. "stack" is covered by the
   entry for "stacking", which is the form the prose uses when it matters. */
const NOT_NEEDED = new Set([
  'porosity', 'lithology', 'compaction', 'anticline', 'facies', 'stack',
]);

const gloss = fs.readFileSync('assets/glossary.js', 'utf8');
const known = new Set();
for (const m of gloss.matchAll(/^\s*'([^']+)': \{/gm)) known.add(m[1].toLowerCase());
for (const m of gloss.matchAll(/also: \[([^\]]*)\]/g)) {
  for (const a of m[1].split(',')) {
    const t = a.trim().replace(/^'|'$/g, '');
    if (t) known.add(t.toLowerCase());
  }
}

const prose = fs.readdirSync('modules').filter((f) => f.endsWith('.html'))
  .map((f) => ({ f, s: fs.readFileSync('modules/' + f, 'utf8')
      // prose only: strip the script block and the html tags
      .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ') }));

const missing = [];
for (const term of CANDIDATES) {
  const re = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  const used = prose.filter((p) => re.test(p.s)).map((p) => p.f.slice(0, 2));
  if (!used.length) continue;
  if (NOT_NEEDED.has(term.toLowerCase())) continue;
  if (!known.has(term.toLowerCase())) missing.push({ term, used });
}

if (missing.length) {
  console.log('Used in the prose, not in the dictionary:\n');
  for (const m of missing) {
    console.log('  ' + m.term.padEnd(30) + 'modules ' + m.used.join(', '));
  }
} else {
  console.log('every candidate term used in the prose is in the dictionary');
}
console.log('\ndictionary holds ' + known.size + ' terms and spellings');
process.exitCode = missing.length ? 1 : 0;

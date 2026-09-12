/* Does step 4 actually behave the way the prose says it does?

   Plays the ranking game the way the panel invites a student to play it: pick
   the bed with the largest thickness implied by its peak-to-trough gap. Runs
   120 deals at each of three frequencies and reports how often that strategy
   names the genuinely thickest bed, split by whether every bed in the deal was
   above the measured limit. If ranking by the gap were reliable below the
   limit, step 4 would be teaching the opposite of what the module says. */
const { JSDOM } = require('jsdom');
const fs = require('fs');

const file = 'modules/03-what-the-wavelet-does.html';
const html = fs.readFileSync(file, 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
                              url: 'https://example.org/modules/m.html' });
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function () {
  const noop = () => {};
  const img = (a, b) => ({ data: new Uint8ClampedArray(Math.max(1, (a|0)*(b|0)*4)), width: a, height: b });
  return new Proxy({}, { get: (t, k) => k === 'canvas' ? { width: 900, height: 600 }
    : k === 'measureText' ? () => ({ width: 40 })
    : k === 'createLinearGradient' ? () => ({ addColorStop: noop })
    : k === 'createImageData' ? img
    : k === 'getImageData' ? ((x, y, a, b) => img(a, b))
    : (typeof k === 'string' ? noop : undefined), set: () => true });
};
Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { get() { return 900; } });
const libs = [...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)]
  .map((m) => m[1]).filter((p) => !/count\.js$/.test(p));
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
w.eval(libs.map((p) => fs.readFileSync(p, 'utf8')).join('\n;\n') + '\n;\n' + inline);
const M = w.__MOD;

const argmax = (a, f) => a.reduce((b, x, i) => (f(x) > f(a[b]) ? i : b), 0);
const CLOSE = 0.25;
let fails = 0;

for (const fr of [20, 35, 60]) {
  let n = 0, bright = 0, gap = 0, close = 0, worst = 0;
  for (let deal = 1; deal <= 200; deal++) {
    Object.assign(M.S, { fr, deal });
    M.recompute();
    const beds = M.D.hidden;
    const thickest = argmax(beds, (b) => b.thick);
    n += 1;
    if (argmax(beds, (b) => b.size) === thickest) bright += 1;
    if (argmax(beds, (b) => b.implied) === thickest) gap += 1;
    const off = beds.map((b) => Math.abs(b.implied - b.thick) / b.thick);
    if (off.every((e) => e <= CLOSE)) close += 1;
    worst = Math.max(worst, Math.max.apply(null, off));
  }
  const pc = (k) => Math.round(100 * k / n) + '%';
  Object.assign(M.S, { fr, deal: 1 });
  M.recompute();
  console.log('  ' + String(fr).padStart(2) + ' Hz   limit ' + M.D.depart.toFixed(1) + ' m' +
              '   brightest is thickest ' + pc(bright) +
              '   separation ranks them ' + pc(gap) +
              '   all three within a quarter ' + pc(close) +
              '   worst single reading out by ' + Math.round(100 * worst) + '%');
  /* The brightest trace must be no better than picking at random, or step 4 is
     rewarding the instinct it exists to correct. */
  if (bright / n > 0.55) {
    fails += 1; console.log('     FAIL the brightest trace names the thickest bed too often');
  }
  /* The separation has to rank them, or the step has no winnable strategy. */
  if (gap / n < 0.95) {
    fails += 1; console.log('     FAIL the peak-to-trough separation does not rank the beds');
  }
}

/* And the reported thickness has to get better with frequency, which is the
   thing the second score is there to show. */
const closeAt = (fr) => {
  let n = 0, close = 0;
  for (let deal = 1; deal <= 200; deal++) {
    Object.assign(M.S, { fr, deal });
    M.recompute();
    n += 1;
    if (M.D.hidden.every((b) => Math.abs(b.implied - b.thick) <= CLOSE * b.thick)) close += 1;
  }
  return close / n;
};
const lo = closeAt(20), hi = closeAt(60);
if (!(hi > lo + 0.2)) {
  fails += 1;
  console.log('     FAIL the reported thickness does not improve with frequency: ' +
              Math.round(100 * lo) + '% at 20 Hz, ' + Math.round(100 * hi) + '% at 60 Hz');
}

console.log(fails ? '\nstep 4 does not behave as the prose says: ' + fails
                  : '\nbrightness misleads, the separation ranks, and the reported ' +
                    'thickness improves with frequency');
process.exitCode = fails ? 1 : 0;

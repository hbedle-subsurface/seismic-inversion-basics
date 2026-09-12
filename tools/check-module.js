/* Boot a conceptual-set module in JSDOM, drive it, and report anything broken.
   Kept deliberately small: it checks the things that silently go wrong —
   missing readout targets, NaN in a readout, and a module that fails to boot. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'modules/01-rock-makes-seismic.html';
const html = fs.readFileSync(file, 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
                              url: 'https://example.org/modules/m.html' });
const w = dom.window;

/* A stand-in 2D context. Every method is a no-op except the handful that have
   to hand something back, because a module that reads the return value of one
   of those crashes on undefined rather than on anything real. The list has
   grown as modules have started using more of the canvas API: the image-data
   pair is what a variable-density section needs, and a section is how every
   module from 5 onward draws its 2D line. */
w.HTMLCanvasElement.prototype.getContext = function () {
  const noop = () => {};
  const imageData = (width, height) => {
    const n = Math.max(1, (width | 0) * (height | 0) * 4);
    return { data: new Uint8ClampedArray(n), width: width, height: height };
  };
  return new Proxy({}, { get: (t, k) => {
    if (k === 'canvas') return { width: 900, height: 600 };
    if (k === 'measureText') return () => ({ width: 40 });
    if (k === 'createLinearGradient') return () => ({ addColorStop: noop });
    if (k === 'createRadialGradient') return () => ({ addColorStop: noop });
    if (k === 'createPattern') return () => null;
    if (k === 'createImageData') return imageData;
    if (k === 'getImageData') return (x, y, width, height) => imageData(width, height);
    if (k === 'isPointInPath' || k === 'isPointInStroke') return () => false;
    return typeof k === 'string' ? noop : undefined;
  }, set: () => true });
};
Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { get() { return 900; } });

// The libraries declare `const SEIS = ...`, so they must share a scope with the
// module's own script. Concatenate rather than injecting separately.
// assets/ and data/ both, so a module that loads a well log is fully tested
const libs = [...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)]
  .map((m) => m[1]).filter((p) => !/count\.js$/.test(p));
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const bundle = libs.map((p) => fs.readFileSync(p, 'utf8')).join('\n;\n') + '\n;\n' + inline;

let fails = 0;
const ok = (m) => console.log('  ok   ' + m);
const bad = (m) => { fails++; console.log('  FAIL ' + m); };

try { w.eval(bundle); ok('page booted with no runtime errors'); }
catch (e) { bad('boot threw: ' + e.message); }

const M = w.__MOD;
if (!M) { bad('window.__MOD not exported'); }
else {
  const ids = [...new Set([...inline.matchAll(/set\('([a-zA-Z0-9]+)'/g)].map((m) => m[1]))];
  const missing = ids.filter((i) => !w.document.getElementById(i));
  missing.length ? bad('set() targets not in the DOM: ' + missing.join(', '))
                 : ok(ids.length + ' readout targets all resolve');

  const panes = [...html.matchAll(/data-tab="([a-z0-9]+)"/g)].map((m) => m[1]);
  const badVals = [];
  panes.forEach((t) => {
    M.showTab(t);
    ids.forEach((i) => {
      const el = w.document.getElementById(i);
      const txt = el ? el.textContent : '';
      if (/NaN|Infinity|undefined/.test(txt)) badVals.push(t + ':' + i + '=' + txt);
    });
  });
  badVals.length ? bad('bad readouts: ' + badVals.slice(0, 6).join(' | '))
                 : ok('every readout is clean on all ' + panes.length + ' panes');

  // drive every control through its range
  const ctrls = [...new Set([...html.matchAll(/data-key="([a-zA-Z0-9]+)"/g)].map((m) => m[1]))];
  let states = 0, dirty = [];
  ctrls.forEach((k) => {
    const el = w.document.getElementById(k);
    if (!el) return;
    const lo = parseFloat(el.min), hi = parseFloat(el.max), st = parseFloat(el.step) || 1;
    const keep = M.S[k];
    for (let v = lo; v <= hi; v += st) {
      M.S[k] = v; M.recompute(); M.drawAll(); states++;
      ids.forEach((i) => {
        const e2 = w.document.getElementById(i);
        if (e2 && /NaN|Infinity|undefined/.test(e2.textContent)) dirty.push(k + '=' + v + ' -> ' + i);
      });
    }
    M.S[k] = keep;
  });
  M.recompute(); M.drawAll();
  dirty.length ? bad('bad readouts while driving: ' + dirty.slice(0, 4).join(' | '))
               : ok(states + ' control states across ' + ctrls.length + ' controls, all clean');

  // teaching checks specific to this set
  const q = html.match(/class="check"/) ? (html.match(/data-right="/g) || []).length : 0;
  q >= 3 ? ok(q + ' self-check questions with answers') : bad('too few self-check questions: ' + q);
  html.includes('class="miscon"') ? ok('has a misconception callout') : bad('no misconception callout');
  html.includes('class="whymatters"') ? ok('has a why-this-matters section') : bad('no why-this-matters');
  html.includes('class="instr"') ? ok('has instructor notes') : bad('no instructor notes');
}

console.log(fails ? `\n${fails} FAILED` : '\nall checks passed');
process.exit(fails ? 1 : 0);

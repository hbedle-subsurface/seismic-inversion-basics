/* Boots each module the way check-module.js does, then reads back the specific
   readouts that this round of fixes touched, at the defaults and across the
   controls that used to break them. Not part of the repository's own checks —
   this is the verification for the review. */
const { JSDOM } = require('jsdom');
const fs = require('fs');

function boot(file) {
  const html = fs.readFileSync(file, 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
                                url: 'https://example.org/modules/m.html' });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = function () {
    const noop = () => {};
    const imageData = (width, height) => ({
      data: new Uint8ClampedArray(Math.max(1, (width | 0) * (height | 0) * 4)),
      width: width, height: height });
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
  const libs = [...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)]
    .map((m) => m[1]).filter((p) => !/count\.js$/.test(p));
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
  w.eval(libs.map((p) => fs.readFileSync(p, 'utf8')).join('\n;\n') + '\n;\n' + inline);
  const g = (id) => (w.document.getElementById(id) || {}).textContent;
  const go = (state, tab) => {
    Object.assign(w.__MOD.S, state);
    w.__MOD.recompute();
    w.__MOD.showTab(tab);
  };
  return { w, g, go, M: w.__MOD };
}

const bad = [];
const check = (name, cond, detail) => {
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) bad.push(name);
};

/* ---------------- module 1 ---------------- */
console.log('\n01 — rock makes seismic');
{
  const { g, go, M } = boot('modules/01-rock-makes-seismic.html');
  go({}, 'p3');
  const d0 = g('s3d'), e0 = g('s3e');
  check('step 3 does not open solved', !/^1\.000/.test(d0), 'trace score ' + d0 + ', rock ' + e0);

  // find the exact answer, then multiply
  go({ gz1: 4200, gz2: 6900, gz3: 5500, gmul: 1 }, 'p3');
  const matched = g('s3d');
  check('the exact rock scores 1.000', /^1\.000/.test(matched), matched);

  const rows = [];
  for (const gmul of [0.5, 0.75, 1, 1.5, 2]) {
    go({ gz1: 4200, gz2: 6900, gz3: 5500, gmul }, 'p3');
    rows.push(gmul + '\u00d7 score ' + g('s3d').split(' ')[0] + ' rock ' + g('s3e'));
  }
  const allOne = rows.every((r) => /score 1\.000/.test(r));
  check('multiplier holds the trace score at 1.000', allOne);
  rows.forEach((r) => console.log('         ' + r));

  // amplitude-wrong guess must NOT score 1.000
  go({ gz1: 6000, gz2: 7000, gz3: 6600, gmul: 1 }, 'p3');
  check('a shape-right, size-wrong guess scores below 1.000',
        !/^1\.000/.test(g('s3d')), g('s3d'));

  go({}, 'p2');
  check('three-frequency readout is measured, not asserted',
        /all three peak at/.test(g('s2e')), g('s2e'));
}

/* ---------------- module 3 ---------------- */
console.log('\n03 — what the wavelet does');
{
  const { g, go } = boot('modules/03-what-the-wavelet-does.html');
  const deps = [];
  for (let fr = 12; fr <= 70; fr += 2) {
    go({ fr }, 'p2');
    const m = /([0-9.]+)\s*m/.exec(g('s2g'));
    deps.push([fr, m ? parseFloat(m[1]) : null]);
  }
  let mono = true, worst = '';
  for (let i = 1; i < deps.length; i++) {
    if (deps[i][1] > deps[i - 1][1] + 1e-9) {
      mono = false;
      worst = deps[i - 1][0] + ' Hz: ' + deps[i - 1][1] + ' m -> ' + deps[i][0] + ' Hz: ' + deps[i][1] + ' m';
    }
  }
  check('departure thickness never rises with frequency', mono, worst || 'monotonic 12-70 Hz');
  go({ fr: 30 }, 'p2');
  console.log('         at 30 Hz: ' + g('s2g') + ', gap ' + g('s2c') + ', measured ' + g('s2d'));
}

/* ---------------- module 6 ---------------- */
console.log('\n06 — the part that was never recorded');
{
  const { g, go } = boot('modules/06-never-recorded.html');
  let allDistinct = true, detail = [];
  for (const top of [1990, 2000, 2050, 2100, 2150, 2200, 2250, 2300]) {
    const errs = [], labels = [];
    for (const away of [0, 1, 2, 3]) {
      go({ top, away }, 'p3');
      errs.push(parseFloat(g('s3c').replace(/[^0-9.]/g, '')));
      labels.push(g('s3a'));
    }
    const distinct = new Set(errs.map((e) => e.toFixed(1))).size === 4;
    if (!distinct) { allDistinct = false; detail.push(top + ': ' + errs.join('/')); }
    console.log('         top ' + top + '  err ' + errs.map((e) => e.toFixed(0)).join(' ') +
                '   furthest: ' + labels[3]);
  }
  check('four distinct backgrounds at every window setting', allDistinct, detail.join('; '));

  go({ top: 2000, away: 0 }, 'p3');
  const lo = parseFloat(g('s3c').replace(/[^0-9.]/g, ''));
  go({ top: 2000, away: 3 }, 'p3');
  const hi = parseFloat(g('s3c').replace(/[^0-9.]/g, ''));
  check('default window still gives the quoted 915 -> 1,028',
        Math.round(lo) === 915 && Math.round(hi) === 1028, lo + ' -> ' + hi);
  check('both error values fit inside the plotted axis (max 1,400)',
        hi <= 1400, 'largest ' + hi);
}

/* ---------------- everything boots ---------------- */
console.log('\nall modules boot and report no NaN');
{
  let clean = true;
  for (const f of fs.readdirSync('modules')) {
    const html = fs.readFileSync('modules/' + f, 'utf8');
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
    const ids = [...new Set([...inline.matchAll(/set\('([a-zA-Z0-9]+)'/g)].map((m) => m[1]))];
    const { w } = boot('modules/' + f);
    // read the readouts themselves, not the page source: the inline script is
    // part of body.textContent and it mentions 'undefined' quite legitimately
    const bads = ids.filter((id) => {
      const el = w.document.getElementById(id);
      return el && /NaN|undefined|Infinity/.test(el.textContent);
    });
    if (bads.length) { clean = false; console.log('  FAIL ' + f + ': ' + bads.join(', ')); }
  }
  check('no NaN, undefined or Infinity in any readout', clean);
}

console.log('\n' + (bad.length ? bad.length + ' FAILED: ' + bad.join(', ') : 'all verification checks passed'));
process.exit(bad.length ? 1 : 0);

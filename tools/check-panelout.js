/* Opens a module in JSDOM, clicks the panel pop-out button, and checks that
   the second window is a live copy rather than a dead one.

   The failure this exists to catch is specific and silent: panelout.js pairs
   the panel with its clone by position, so anything that changes the element
   count of one and not the other leaves a second window whose sliders move and
   whose module does not. That looks fine in a screenshot.

   Usage:  node tools/check-panelout.js modules/01-rock-makes-seismic.html
           for m in modules/*.html; do node tools/check-panelout.js "$m" | tail -1; done
*/
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'modules/01-rock-makes-seismic.html';
const html = fs.readFileSync(file, 'utf8');

let fails = 0;
const ok = (m) => console.log('  ok   ' + m);
const bad = (m) => { fails++; console.log('  FAIL ' + m); };

/* --- a second window, good enough to be written to and read back ---------- */
const OPENED = [];
function makeCanvasStub(w) {
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
}

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
                              url: 'https://example.org/modules/m.html' });
const w = dom.window;
makeCanvasStub(w);

/* window.open has to hand back something with a document that can be written
   to and then queried, because that is the whole mechanism under test. */
w.open = function (url, name, features) {
  const child = new JSDOM('', { url: 'https://example.org/modules/m.html' });
  const cw = child.window;
  makeCanvasStub(cw);
  cw.name = name || '';
  cw.closed = false;
  cw.focus = () => {};
  cw.close = function () { cw.closed = true; };
  OPENED.push({ win: cw, name: name, features: features || '' });
  return cw;
};

const libs = [...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)]
  .map((m) => m[1]).filter((p) => !/count\.js$/.test(p));
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const bundle = libs.map((p) => fs.readFileSync(p, 'utf8')).join('\n;\n') + '\n;\n' + inline;

console.log(path.basename(file));

if (!libs.some((p) => /panelout\.js$/.test(p))) bad('assets/panelout.js is not loaded by this module');
else ok('assets/panelout.js is loaded');

try { w.eval(bundle); ok('page booted with no runtime errors'); }
catch (e) { bad('boot threw: ' + e.message); }

const doc = w.document;

/* panelout.js injects its button on DOMContentLoaded, and JSDOM fires that
   asynchronously after the script has been evaluated. Asserting straight after
   the eval tests a page that has not finished starting up, which is a harness
   bug rather than a page one. */
function ready() {
  return new Promise((resolve) => {
    if (doc.readyState !== 'loading') return resolve();
    doc.addEventListener('DOMContentLoaded', () => resolve());
    setTimeout(resolve, 2000);
  });
}

async function main() {
await ready();

const panel = doc.querySelector('.labhead');
if (!panel) bad('no .labhead for the pop-out to work on');

const btn = doc.querySelector('.po-panel-open');
if (!btn) { bad('the open button was not injected'); }
else {
  ok('the open button is on the panel');

  const before = panel.getElementsByTagName('*').length;
  btn.click();

  if (!OPENED.length) { bad('clicking the button opened no window'); }
  else {
    const child = OPENED[0].win;
    ok('clicking opens a window (' + OPENED[0].features + ')');

    if (!/^controls_/.test(OPENED[0].name || '')) bad('window name is not per-module: ' + OPENED[0].name);
    else ok('the window is named per module, so two modules do not share one');

    const wrap = child.document.getElementById('poWrap');
    const clone = wrap && wrap.querySelector('.labhead');
    if (!clone) { bad('no copy of the panel in the second window'); }
    else {
      ok('the panel was copied into the second window');

      /* The pairing test. panelout matches the two element by element in
         document order, so the counts have to agree or nothing is wired. */
      const a = panel.getElementsByTagName('*').length;
      const b = clone.getElementsByTagName('*').length;
      if (a !== b) bad('panel and copy differ in size (' + a + ' against ' + b + ') — the bridge will refuse to wire');
      else ok('panel and copy are the same shape (' + a + ' elements), so the bridge wires');

      if (before !== a) bad('opening the window changed the real panel');
      else ok('the real panel is unchanged by opening the window');

      /* The live test: move a control in the copy, and check the module in the
         first window actually recomputed. */
      const M = w.__MOD;
      const realRanges = [...panel.querySelectorAll('input[type="range"][data-key]')];
      const copyRanges = [...clone.querySelectorAll('input[type="range"][data-key]')];
      if (!M) bad('window.__MOD not exported, cannot test the bridge');
      else if (!copyRanges.length) console.log('  --   no slider in this panel to drive; the value bridge is untested here');
      else {
        const key = copyRanges[0].dataset.key;
        const start = Number(M.S[key]);
        const lo = Number(copyRanges[0].min), hi = Number(copyRanges[0].max);
        const target = (start - lo) > (hi - start) ? lo : hi;
        copyRanges[0].value = String(target);
        copyRanges[0].dispatchEvent(new child.window.Event('input', { bubbles: true }));

        if (Number(M.S[key]) !== target) {
          bad('moving "' + key + '" in the copy did not reach the module (' + start + ' -> ' + M.S[key] + ')');
        } else {
          ok('moving "' + key + '" in the copy drives the module (' + start + ' -> ' + M.S[key] + ')');
        }
        if (Number(realRanges[0].value) !== target) {
          bad('the real input was not updated to match the copy');
        } else {
          ok('the real input carries the copy\'s value');
        }
      }

      /* A button in the copy has to reach its counterpart. */
      const copyReset = clone.querySelector('#resetBtn, .reset');
      if (copyReset && M) {
        const k = copyRanges.length ? copyRanges[0].dataset.key : null;
        copyReset.click();
        if (k && Number(M.S[k]) === Number(copyRanges[0].value)) {
          console.log('  --   reset button forwarded (values re-synced)');
        }
        ok('a button in the copy reaches its counterpart without throwing');
      }

      /* The panel is hidden but still measurable, or the module's canvases
         collapse to zero width the next time it draws. */
      const holder = panel.parentNode;
      const style = holder.getAttribute('style') || '';
      if (!/height:\s*0/.test(style) || !/overflow:\s*hidden/.test(style)) {
        bad('the panel was not parked in a zero-height, measurable holder');
      } else {
        ok('the panel is parked where it can still be measured');
      }
      if (panel.style.display === 'none') bad('the panel was display:none, which breaks canvas sizing');

      /* And the way back. */
      const bar = doc.querySelector('.labhead') ? null : null;
      const backBtn = [...doc.querySelectorAll('button')]
        .find((b) => /bring them back/i.test(b.textContent || ''));
      if (!backBtn) bad('no way offered to bring the panel back');
      else {
        ok('a "bring them back" control is left in the panel\'s place');
        backBtn.click();
        if (doc.querySelector('.labhead') !== panel) bad('the panel did not come back');
        else if (panel.parentNode.getAttribute('style') === 'height:0;overflow:hidden') {
          bad('the panel came back but is still inside the hidden holder');
        } else {
          ok('the panel returns to the page when brought back');
        }
      }
    }
  }
}

}

main().then(() => {
  console.log(fails ? '  ' + fails + ' FAILED' : '  all checks passed');
  process.exit(fails ? 1 : 0);
}).catch((e) => {
  console.log('  FAIL harness threw: ' + e.message);
  process.exit(1);
});

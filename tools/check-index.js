/* The landing page and the glossary carry no module script, so check-module.js
   skips them. This boots both, confirms the glossary marker runs, and confirms
   the glossary page has opted out of marking its own definitions. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
let fails = 0;
for (const file of ['index.html', 'glossary.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
                                url: 'https://example.org/' + file });
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
  const libs = [...html.matchAll(/<script src="((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)]
    .map((m) => m[1]).filter((p) => !/count\.js$/.test(p));
  const inlineAll = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const inline = inlineAll.length ? inlineAll.pop()[1] : '';
  console.log(file);
  try {
    w.eval(libs.map((p) => fs.readFileSync(p, 'utf8')).join('\n;\n') + '\n;\n' + inline);
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    console.log('   ok   booted with no runtime errors');
  } catch (e) { fails++; console.log('   FAIL boot threw: ' + e.message); return; }

  const marked = w.document.querySelectorAll('.gterm').length;
  if (file === 'glossary.html') {
    marked === 0 ? console.log('   ok   glossary does not mark its own definitions')
                 : (fails++, console.log('   FAIL glossary marked ' + marked + ' of its own terms'));
    const anchors = w.document.querySelectorAll('dl.gloss dt[id]').length;
    const dts = w.document.querySelectorAll('dl.gloss dt').length;
    anchors === dts ? console.log('   ok   all ' + dts + ' entries have anchors')
                    : (fails++, console.log('   FAIL ' + (dts - anchors) + ' entries have no anchor'));
  } else {
    marked > 0 ? console.log('   ok   ' + marked + ' terms marked')
               : (fails++, console.log('   FAIL no terms marked'));
    const cards = w.document.querySelectorAll('.card-grid .card').length;
    console.log('   ok   ' + cards + ' module cards');
  }
}
console.log(fails ? '\nfailures: ' + fails : '\nall checks passed');
process.exitCode = fails ? 1 : 0;

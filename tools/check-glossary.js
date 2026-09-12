/* Does the glossary actually mark terms, and does it leave headings, links and
   control labels alone? */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
                              url: 'https://example.org/modules/m.html' });
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function () {
  const noop = () => {};
  const img = (a,b)=>({data:new Uint8ClampedArray(Math.max(1,(a|0)*(b|0)*4)),width:a,height:b});
  return new Proxy({}, { get: (t,k)=> k==='canvas'?{width:900,height:600}
    : k==='measureText'?()=>({width:40})
    : k==='createLinearGradient'?()=>({addColorStop:noop})
    : k==='createImageData'?img
    : k==='getImageData'?((x,y,a,b)=>img(a,b))
    : (typeof k==='string'?noop:undefined), set:()=>true });
};
Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { get(){return 900;} });
const libs = [...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)]
  .map(m=>m[1]).filter(p=>!/count\.js$/.test(p));
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
w.eval(libs.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n') + '\n;\n' + inline);
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));

const terms = [...w.document.querySelectorAll('.gterm')];
const uniq = new Set(terms.map(t=>t.getAttribute('data-term')));
console.log(file.split('/').pop());
console.log('   marked occurrences:', terms.length, ' distinct terms:', uniq.size);

// nothing should be marked inside a heading, a link or a control label
const bad = terms.filter(t => t.closest('h1,h2,h3,h4,a,label,button:not(.gterm),dt'));
console.log('   marked in a place it should not be:', bad.length);

// the pop-out button should have been added to the top panel
const po = w.document.querySelector('.po-panel-open');
console.log('   pop-out button:', po ? 'present — "' + po.textContent + '"' : 'MISSING');

/* Every marked term links to glossary.html#g-<slug>. A term whose anchor is not
   on that page sends a student to the top of the glossary to hunt, which is the
   thing the pop-up card exists to avoid. The libraries declare `const GLOSS`,
   which w.eval keeps in its own scope rather than putting on window, so the
   check is done against the glossary page itself. */
const slug = (k) => 'g-' + k.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
const gloss = fs.readFileSync('glossary.html', 'utf8');
const anchors = new Set([...gloss.matchAll(/<dt id="([^"]+)"/g)].map(m => m[1]));
const dead = [...uniq].filter(k => !anchors.has(slug(k)));
console.log('   terms with no glossary anchor:', dead.length ? dead : 'none');
console.log('   sample of what was marked:', [...uniq].slice(0, 8).join(', '));
if (dead.length || bad.length || !po) process.exitCode = 1;

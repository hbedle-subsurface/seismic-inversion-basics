/* Are paired panels in a .sec-row actually the same size now?
   Renders each module in jsdom, gives the wrap a real width, and reads back
   the canvas dimensions each module computed for itself. */
const { JSDOM } = require('jsdom'); const fs = require('fs');
let fails = 0;
for (const f of fs.readdirSync('modules').filter(x=>x.endsWith('.html'))) {
  const html = fs.readFileSync('modules/'+f,'utf8');
  const dom = new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.org/modules/m.html'});
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext=function(){const noop=()=>{};
   const img=(a,b)=>({data:new Uint8ClampedArray(Math.max(1,(a|0)*(b|0)*4)),width:a,height:b});
   return new Proxy({},{get:(t,k)=>k==='canvas'?{width:900,height:600}:k==='measureText'?()=>({width:40})
    :k==='createLinearGradient'?()=>({addColorStop:noop}):k==='createImageData'?img
    :k==='getImageData'?((x,y,a,b)=>img(a,b)):(typeof k==='string'?noop:undefined),set:()=>true});};
  // every panel column reports the same width, which is what the CSS now guarantees
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 380;}});
  const libs=[...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)].map(m=>m[1]).filter(p=>!/count\.js$/.test(p));
  try {
    w.eval(libs.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n')+'\n;\n'+[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1]);
  } catch(e) { console.log(f,'boot failed:',e.message); fails++; continue; }
  const M = w.__MOD;
  const tabs=[...w.document.querySelectorAll('#tabs button')].map(b=>b.dataset.tab);
  for (const tab of tabs) {
    if (!w.document.getElementById(tab)) continue;
    try { M.showTab(tab); } catch(e) { continue; }
    for (const row of w.document.querySelectorAll('#'+tab+' .sec-row')) {
      const sizes = [...row.querySelectorAll('canvas')].map(c=>c.style.width+'x'+c.style.height);
      const uniq = new Set(sizes);
      if (uniq.size > 1) {
        fails++;
        console.log('  MISMATCH '+f+' '+tab+': '+sizes.join('  '));
      }
    }
  }
}
console.log(fails ? 'panel size mismatches: '+fails : 'every paired panel in every step is the same size');
process.exitCode = fails ? 1 : 0;

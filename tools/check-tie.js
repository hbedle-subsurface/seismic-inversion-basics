/* Does module 5 behave the way its prose says?
   Drives the module through jsdom and prints its own numbers, so a change to
   the log window or the wavelet can be checked against the claims the page
   makes rather than against a screenshot.

   What the page claims, and this confirms:
     step 1  the slowest and fastest 100 m in the window differ by a few percent
     step 2  the synthetic starts in the wrong place, and there is a tie setting
             where the correlation goes close to 1
     step 3  a tie error is worth a stated number of meters, and it changes the
             impedance you would report at the target
*/
const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('modules/05-tying-a-well.html','utf8');
const dom = new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.org/modules/m.html'});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext=function(){const noop=()=>{};
 const img=(a,b)=>({data:new Uint8ClampedArray(Math.max(1,(a|0)*(b|0)*4)),width:a,height:b});
 return new Proxy({},{get:(t,k)=>k==='canvas'?{width:900,height:600}:k==='measureText'?()=>({width:40})
  :k==='createLinearGradient'?()=>({addColorStop:noop}):k==='createImageData'?img
  :k==='getImageData'?((x,y,a,b)=>img(a,b)):(typeof k==='string'?noop:undefined),set:()=>true});};
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 900;}});
const libs=[...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)].map(m=>m[1]).filter(p=>!/count\.js$/.test(p));
w.eval(libs.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n')+'\n;\n'+[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1]);
const M=w.__MOD,S=M.S;
const run=(o)=>{Object.assign(S,o);M.recompute();return M.D;};

console.log('--- step 1: are the two rulers proportional? ---');
for (const top of [1990, 2100, 2200, 2300]) {
  const D=run({top, fr:30, shift:0});
  console.log('  top '+top+' m: '+Math.round(D.depth1-D.depth0)+' m -> '+Math.round(D.timeSpan*1000)+' ms;'
    +'  slowest '+D.slow100.toFixed(1)+' ms at '+Math.round(D.slowZ)
    +', fastest '+D.fast100.toFixed(1)+' ms at '+Math.round(D.fastZ)
    +'  ('+(100*D.spread100/D.slow100).toFixed(1)+'%)');
}

console.log('\n--- step 2: is there a tie setting that works? ---');
run({top:2000});
let best={c:-2,ms:0};
for (let ms=-20; ms<=45; ms++) { const D=run({shift:ms}); if (D.corr>best.c) best={c:D.corr,ms}; }
console.log('  untied (0 ms)   correlation '+run({shift:0}).corr.toFixed(3));
console.log('  best tie        correlation '+best.c.toFixed(3)+' at '+best.ms+' ms');
console.log('  the page hides an 18 ms offset, so the best tie should be +18');

console.log('\n--- step 3: what a tie error costs ---');
console.log('  error   depth      impedance you report / truth / difference');
for (const err of [0, 5, 10, 20]) {
  const D=run({shift:18+err});
  console.log('  '+String(err).padStart(3)+' ms  '+String(Math.round(D.depthError)).padStart(4)+' m     '
    +String(Math.round(D.zAtYours)).padStart(6)+' / '+String(Math.round(D.zAtTrue)).padStart(6)
    +' / '+String(Math.round(Math.abs(D.zAtYours-D.zAtTrue))).padStart(6)
    +'   reading '+Math.round(D.depthYouRead)+' m, seismic at '+Math.round(D.depthTrue)+' m');
}

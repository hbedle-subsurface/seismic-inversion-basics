/* Does every control actually change the head panel? A slider that moves
   nothing on screen reads as broken, and the head is what a student sees
   first. This renders each module's head to a recording context and compares
   the drawing commands at each end of every control's range. */
const { JSDOM } = require('jsdom'); const fs=require('fs');
let fails=0;
for (const f of fs.readdirSync('modules').filter(x=>x.endsWith('.html'))) {
  const html=fs.readFileSync('modules/'+f,'utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://e.org/modules/m.html'});
  const w=dom.window;
  let log=[];
  w.HTMLCanvasElement.prototype.getContext=function(){
    const rec=(k)=>(...a)=>{ log.push(k+':'+a.map(v=>typeof v==='number'?v.toFixed(2):String(v)).join(',')); };
    const img=(a,b)=>({data:new Uint8ClampedArray(Math.max(1,(a|0)*(b|0)*4)),width:a,height:b});
    return new Proxy({},{get:(t,k)=> k==='canvas'?{width:900,height:600}
      : k==='measureText'?()=>({width:40})
      : k==='createLinearGradient'?()=>({addColorStop:()=>{}})
      : k==='createImageData'?img
      : k==='getImageData'?((x,y,a,b)=>img(a,b))
      : (typeof k==='string'?rec(k):undefined), set:(t,k,v)=>{log.push('set '+k+'='+v);return true;}});};
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 900;}});
  const libs=[...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)].map(m=>m[1]).filter(p=>!/count\.js$/.test(p));
  try { w.eval(libs.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n')+'\n;\n'+[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1]); }
  catch(e){ console.log(f,'boot failed'); fails++; continue; }
  const M=w.__MOD; if(!M) continue;
  const head=[...w.document.querySelectorAll('.labhead canvas')].map(c=>c.id);
  if(!head.length) continue;
  const draw=()=>{ log=[]; M.recompute(); M.drawAll(); return log.join('|'); };
  const dead=[];
  for (const inp of w.document.querySelectorAll('.labhead input[type=range]')) {
    const key=inp.dataset.key, lo=+inp.min, hi=+inp.max, save=M.S[key];
    M.S[key]=lo; const a=draw();
    M.S[key]=hi; const b=draw();
    M.S[key]=save; draw();
    if (a===b) dead.push(key);
  }
  console.log(f.replace('.html','').padEnd(30), dead.length? 'DEAD IN HEAD: '+dead.join(', ') : 'every head control changes the drawing');
  if (dead.length) fails++;
}
process.exitCode=fails?1:0;

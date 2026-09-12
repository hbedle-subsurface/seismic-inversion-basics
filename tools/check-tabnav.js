/* Boot every module, click every tab in turn, and confirm the right pane shows
   and every other pane is hidden. Reordering the strip is exactly the kind of
   edit that can leave a button pointing at nothing. */
const { JSDOM } = require('jsdom'); const fs=require('fs');
let fails=0;
for (const f of fs.readdirSync('modules').filter(x=>x.endsWith('.html'))) {
  const html=fs.readFileSync('modules/'+f,'utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://e.org/modules/m.html'});
  const w=dom.window;
  w.HTMLCanvasElement.prototype.getContext=function(){const noop=()=>{};
   const img=(a,b)=>({data:new Uint8ClampedArray(Math.max(1,(a|0)*(b|0)*4)),width:a,height:b});
   return new Proxy({},{get:(t,k)=>k==='canvas'?this:k==='measureText'?(s)=>({width:String(s).length*6})
    :k==='createLinearGradient'?()=>({addColorStop:noop}):k==='createImageData'?img
    :k==='getImageData'?((x,y,a,b)=>img(a,b)):(typeof k==='string'?noop:undefined),set:()=>true});};
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 900;}});
  const libs=[...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)].map(m=>m[1]).filter(p=>!/count\.js$/.test(p));
  try { w.eval(libs.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n')+'\n;\n'+[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1]); }
  catch(e){ console.log(f,'boot failed'); fails++; continue; }
  const btns=[...w.document.querySelectorAll('#tabs button')];
  const bad=[];
  for (const b of btns) {
    const id=b.dataset.tab;
    const pane=w.document.getElementById(id);
    if(!pane){ bad.push(b.textContent.trim()+' -> no pane "'+id+'"'); continue; }
    b.click();
    if(pane.hidden) bad.push(b.textContent.trim()+' -> pane stayed hidden');
    if(b.getAttribute('aria-selected')!=='true') bad.push(b.textContent.trim()+' -> not marked selected');
    const others=btns.filter(o=>o!==b && o.dataset.tab!==id)
      .filter(o=>{const p=w.document.getElementById(o.dataset.tab); return p && !p.hidden;});
    if(others.length) bad.push(b.textContent.trim()+' -> left '+others.length+' other pane(s) open');
  }
  console.log(f.replace('.html','').padEnd(30), bad.length? 'BROKEN: '+bad.join('; ') : btns.length+' tabs, all open the right pane');
  if(bad.length) fails++;
}
console.log(fails? '\nbroken tab strips: '+fails : '\nevery tab in every module opens its own pane');
process.exitCode=fails?1:0;

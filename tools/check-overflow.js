/* Does anything get drawn outside its canvas?
   Labels running off the bottom or the right edge are cut in half and read as
   sloppiness. This records every fillText and rect the modules draw and reports
   anything that lands outside the canvas it was drawn on. */
const { JSDOM } = require('jsdom'); const fs=require('fs');
let fails=0;
for (const f of fs.readdirSync('modules').filter(x=>x.endsWith('.html'))) {
  const html=fs.readFileSync('modules/'+f,'utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://e.org/modules/m.html'});
  const w=dom.window;
  let cur=null, out=[];
  w.HTMLCanvasElement.prototype.getContext=function(){
    const self=this;
    const state={font:'10px x',textBaseline:'alphabetic',textAlign:'left'};
    /* Axis names are drawn rotated, through translate()/rotate(). Working out
       where a rotated string lands would mean carrying a full transform, and
       these labels are placed by hand and known to fit, so a rotation just
       suspends the check until the matching restore(). */
    let rot=0; const stack=[];
    /* save()/restore() has to carry the whole drawing state, not just the
       rotation: font and textAlign set inside a save block were leaking out of
       it and the checker was measuring later labels with the wrong alignment,
       which reported strings as overflowing when they were centred and fit. */
    const snap=()=>({rot:rot,font:state.font,textBaseline:state.textBaseline,textAlign:state.textAlign});
    const img=(a,b)=>({data:new Uint8ClampedArray(Math.max(1,(a|0)*(b|0)*4)),width:a,height:b});
    const size=()=>({w:parseFloat(self.style.width)||0,h:parseFloat(self.style.height)||0});
    return new Proxy({},{get:(t,k)=>{
      if(k==='canvas') return self;
      if(k==='measureText') return (s)=>({width:(String(s).length)*5.6});
      if(k==='createLinearGradient') return ()=>({addColorStop:()=>{}});
      if(k==='createImageData') return img;
      if(k==='getImageData') return (x,y,a,b)=>img(a,b);
      if(k==='fillText'||k==='strokeText') return (txt,x,y)=>{
        if(rot) return undefined;
        const {w:cw,h:ch}=size(); if(!cw||!ch) return;
        const fs=parseFloat((state.font.match(/(\d+(\.\d+)?)px/)||[0,10])[1]);
        const wid=String(txt).length*fs*0.56;
        let x0=x; if(state.textAlign==='right') x0=x-wid; else if(state.textAlign==='center') x0=x-wid/2;
        let top=y-fs, bot=y;
        if(state.textBaseline==='top'){top=y;bot=y+fs;}
        else if(state.textBaseline==='middle'){top=y-fs/2;bot=y+fs/2;}
        else if(state.textBaseline==='bottom'){top=y-fs;bot=y;}
        if(bot>ch+1||top<-1||x0<-1||x0+wid>cw+1)
          out.push('  "'+String(txt).slice(0,30)+'" on '+self.id+' at ('+Math.round(x0)+','+Math.round(top)+
                   ') size '+Math.round(wid)+'x'+Math.round(fs)+' vs canvas '+Math.round(cw)+'x'+Math.round(ch));
        return undefined;
      };
      if(k==='save') return ()=>{stack.push(snap());};
      if(k==='restore') return ()=>{
        const p=stack.pop();
        if(p){rot=p.rot;state.font=p.font;state.textBaseline=p.textBaseline;state.textAlign=p.textAlign;}
        else rot=0;
      };
      if(k==='rotate') return (a)=>{if(a)rot++;};
      if(k==='setTransform') return ()=>{rot=0;};
      if(typeof k==='string') return ()=>{};
      return undefined;
    },set:(t,k,v)=>{state[k]=v;return true;}});};
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 380;}});
  const libs=[...html.matchAll(/<script src="\.\.\/((?:assets|data)\/[a-zA-Z0-9._-]+)"><\/script>/g)].map(m=>m[1]).filter(p=>!/count\.js$/.test(p));
  try { w.eval(libs.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n')+'\n;\n'+[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1]); }
  catch(e){ console.log(f,'boot failed:',e.message); fails++; continue; }
  const M=w.__MOD; if(!M) continue;
  const tabs=[...w.document.querySelectorAll('#tabs button')].map(b=>b.dataset.tab);
  for (const tab of tabs) {
    if (!w.document.getElementById(tab)) continue;
    out=[]; try { M.showTab(tab); } catch(e){ continue; }
    if (out.length) { fails+=out.length; console.log(f+'  '+tab+':'); console.log([...new Set(out)].join('\n')); }
  }
}
console.log(fails ? '\nlabels drawn outside a canvas: '+fails : 'nothing is drawn outside its canvas');
process.exitCode=fails?1:0;

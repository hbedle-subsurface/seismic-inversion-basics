const fs=require('fs');
const files=['index.html','glossary.html',
 ...fs.readdirSync('modules').map(f=>'modules/'+f),
 ...fs.readdirSync('assets').map(f=>'assets/'+f)];
const src={}; files.forEach(f=>src[f]=fs.readFileSync(f,'utf8'));
function report(ns, names, ownFile){
  console.log('\n=== '+ns+' ===');
  for(const n of names){
    const re=new RegExp('\\b'+ns+'\\.'+n+'\\b','g');
    const users=files.filter(f=>f!==ownFile && re.test(src[f])).map(f=>f.replace(/^(modules|assets)\//,''));
    const inOwn=(src[ownFile].match(re)||[]).length;
    console.log('  '+n.padEnd(24)+(users.length?users.join(' '):'UNUSED'+(inOwn?' (self '+inOwn+')':'')));
  }
}
const phys=src['assets/physics.js'].match(/return \{([\s\S]*?)\};/)[1].replace(/\s|\n/g,'').split(',').filter(Boolean);
report('PHYS', phys, 'assets/physics.js');
const seis=src['assets/seismic.js'].match(/return \{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s|\n/g,'').split(',').filter(Boolean).map(s=>s.split(':')[0]);
report('SEIS', seis, 'assets/seismic.js');
const pan=src['assets/panels.js'].match(/return \{([\s\S]*?)\};/)[1].replace(/\s|\n/g,'').split(',').filter(Boolean);
report('PANEL', pan, 'assets/panels.js');

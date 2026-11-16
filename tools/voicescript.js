// Writes docs/voice/script.csv: every story line a character speaks, with the id its recording must be saved as.
// Run after a build: node tools/voicescript.js
// Record each line as art/voice/<id>.mp3 and add the id to art/voice/index.json ({"lines":[...]}).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage(); await p.goto('file://'+path.join(__dirname,'..','index.html')); await p.waitForTimeout(900);
const rows=await p.evaluate(()=>{ const out=new Map(); const nm=k=>CAST[k]?CAST[k].n:k==='self'?'You (thinking)':k==='radio'?'Radio / ATC':k;
  const add=(who,text,where,kind)=>{ if(!who||!text) return; text=String(text); const spoken=kind==='beat'?text.split('|')[0]:text; const id=voKey(spoken); if(!out.has(id)) out.set(id,{id,who:nm(who),line:spoken.replace(/"/g,''),where,kind}); };
  // every flag on, none on, and each flag alone: enough to reach every variant of the lines that change with earlier choices
  const FL=new Set(); Object.values(DYN||{}).concat(Object.values(PRO_DYN||{})).concat(Object.values(BEATS).flat()).forEach(f=>{ if(typeof f==='function') (f.toString().match(/f\.([a-zA-Z]+)/g)||[]).forEach(x=>FL.add(x.slice(2))); });
  const variants=[{}, Object.fromEntries([...FL].map(k=>[k,true]))].concat([...FL].map(k=>({[k]:true})));
  const MC=mainChapters();
  MC.forEach((m,n)=>{ const where=`Ch ${n+1} ${m.title}`;
    (PRO[m.id]||[]).forEach(s=>{ if(Array.isArray(s)) add(s[1],s[2],where+' · prologue','cutscene'); });
    if(typeof PRO_DYN!=='undefined' && PRO_DYN[m.id]) variants.forEach(f=>{ try{ const r=PRO_DYN[m.id](f, S.st); (Array.isArray(r)?r:[]).forEach(s=>{ if(Array.isArray(s)) add(s[1],s[2],where+' · prologue (depends on choices)','cutscene'); }); }catch(_){} });
    (BEATS[m.id]||[]).forEach(x=>variants.forEach(f=>{ let b=x; try{ if(typeof b==='function') b=b(f); if(Array.isArray(b)) b={at:b[0],who:typeof b[1]==='function'?b[1](f):b[1],text:typeof b[2]==='function'?b[2](f):b[2]}; }catch(_){ b=null; } if(!b) return;
      add(b.who,b.text,where+' · in flight ('+b.at+')','beat'); (b.opts||[]).forEach(o=>{ if(o.order){ ['ok','fail'].forEach(r=>o.order[r]&&o.order[r].text&&add(o.order.who||'self',o.order[r].text,where+' · flight order '+r,'beat')); } }); }));
    if(m.id==='CR4') add('castillo',`Your jet training is paid for. ${money(22000)} is in your account. Book the checkride. Don't make me wait.`,where+' · after the flight','cutscene');
  });
  add('castillo',`I don't pay for wreckage. Get yourself together and do it again. Properly.`,'Any chapter · failed flight','cutscene');
  return [...out.values()]; });
const csv=v=>`"${String(v).replace(/"/g,'""')}"`;
fs.mkdirSync(path.join(__dirname,'..','docs','voice'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'..','docs','voice','script.csv'), 'id,character,line,where,kind\n'+rows.map(r=>[r.id,r.who,r.line,r.where,r.kind].map(csv).join(',')).join('\n')+'\n');
const by={}; rows.forEach(r=>{ by[r.who]=(by[r.who]||0)+1; });
console.log(rows.length+' lines', JSON.stringify(by)); await b.close(); })();

// A long career in fast-forward: 90 days of random jobs (good, bad and crashed), texts answered, properties,
// Castillo's loan left unpaid, bribes, insurance, market events, every page visited every few days.
// Fails on any script error, and on "undefined", "NaN" or "[object" anywhere on screen. Usage: node tests/soak.js [seed]
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+path.join(__dirname,'..','index.html')); await p.evaluate(s=>{localStorage.clear();localStorage.setItem('tradewinds.career.v1',s)},fs.readFileSync(path.join(__dirname,'fixture-save.json'),'utf8')); await p.reload(); await p.waitForTimeout(1200);
const r=await p.evaluate(async(seed)=>{ const W=ms=>new Promise(r=>setTimeout(r,ms)); let x=seed||7; const R=()=>{ x=(x*1103515245+12345)&0x7fffffff; return x/0x7fffffff; };
  document.querySelectorAll('.cut,.title-screen,.lic-overlay').forEach(e=>e.remove()); S._title=false; const st=S.st; const c=crime(st); c.on=true; st.cash=500000; c.dirty=40000; const bad=[]; const pages=['story','board','flight','pilot','profile','log','money','company','cup','academy','hangar','map'];
  const scan=(tag)=>{ const t=document.body.innerText; const m=t.match(/.{0,40}(undefined|NaN|\[object [A-Za-z]+\]).{0,40}/); if(m) bad.push(tag+': '+m[0].replace(/\s+/g,' ')); const pl=t.match(/.{0,30}(?<![\d.,])\b1 (days|jobs|flights|hours|nights|chapters|texts|messages|bounces|landings|weeks|tries|attempts|passengers)\b.{0,20}/); if(pl) bad.push(tag+' plural: '+pl[0].replace(/\s+/g,' ')); const dbl=t.match(/.{0,30}\b(the|a|to|of|and|you) \1\b.{0,20}/i); if(dbl) bad.push(tag+' doubled: '+dbl[0].replace(/\s+/g,' ')); };
  try{ propBuy('dive'); propBuy('bar'); loanTake(25000); twW().ins=true; }catch(e){ bad.push('setup '+e.message); }
  for(let day=0; day<90; day++){
    try{ ensureJobs(st); const L=(st.jobs||[]).filter(j=>!j.locked); const j=L[Math.floor(R()*L.length)];
      if(j){ st.active={job:j, accepted:Date.now(), started:Date.now()}; const roll=R();
        const f={ landing: roll<0.05?'crash':roll<0.3?'firm':'smooth', tdz:R()<0.7, center:true, fuel:30, fuelUnit:'pct', block:(j.est||30), landedAt:j.local?j.from:j.to, checklist:true, radio:true, weather:true, smooth:true, scen:null, tasks:[], verified:false, simFpm:Math.round(R()*700) };
        const res=score(j,f); if(roll<0.05){ res.crash=true; res.grade='F'; } applyResult(st,j,f,res); S.showResult=true; go('flight'); await W(30); scan('result day '+st.day); S.showResult=false; }
    }catch(e){ bad.push('flight day '+st.day+': '+e.message+' '+(e.stack||'').split('\n')[1]); st.active=null; }
    try{ rest(st); }catch(e){ bad.push('rest: '+e.message); }
    try{ const m=twW().phone.msgs.find(m=>m.ans==null && (PHONE_POOL.find(p=>p.id===m.pid)||{}).opts); if(m) phoneAnswer(m.id, R()<0.5?0:1); }catch(e){ bad.push('phone: '+e.message); }
    if(day%10===3){ try{ openPhone(); scan('phone'); twSheetClose(); }catch(e){ bad.push('openPhone '+e.message); } }
    if(day%7===0){ for(const v of pages){ try{ go(v); await W(20); scan(v+' day '+st.day); }catch(e){ bad.push('page '+v+': '+e.message); } } }
    if(day===40){ try{ c.heat=70; W && 0; twW().bribes[st.loc]={until:st.day+7,used:0}; }catch(_){} }
    document.querySelectorAll('.cut,.tw-sheet-bg').forEach(e=>e.remove());
  }
  return {bad:[...new Set(bad)].slice(0,40), day:st.day, cash:Math.round(st.cash), heat:c.heat, msgs:twW().phone.msgs.length, mkt:JSON.stringify(twW().mkt||null), isl:Object.keys(twW().isl).length, loan:JSON.stringify(twW().loan), errlog:(S.errs||window.TW_ERRS||[]).slice?.(-5)};
}, +(process.argv[2]||7));
console.log(JSON.stringify(r,null,1)); console.log('PAGE ERRORS', JSON.stringify([...new Set(errs)].slice(0,20),null,1)); await b.close(); process.exit(r.bad.length||errs.length?1:0); })();

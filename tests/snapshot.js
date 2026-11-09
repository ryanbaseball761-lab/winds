// Behaviour snapshot for refactors. It renders every page in several game states and runs the core
// game logic (jobs, days, every chapter's result), with random numbers and the clock frozen.
//   node tests/snapshot.js save    -> writes tests/snapshots/baseline.json (do this BEFORE refactoring)
//   node tests/snapshot.js         -> compares against the baseline and lists every difference
// A pure refactor must report 0 differences. Intended changes (story rewrite, balance) will differ:
// review the diff, then save a new baseline.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'), BASE=path.join(__dirname,'snapshots','baseline.json'), FIX=fs.readFileSync(path.join(__dirname,'fixture-save.json'),'utf8');
const MODE=process.argv[2]==='save'?'save':'check';
const FREEZE=`(()=>{ let s=1234567; Math.random=()=>{ s=(s*1103515245+12345)%2147483648; return s/2147483648; };
  const T=Date.UTC(2026,5,1,16,0,0); const _D=Date; class D extends _D{ constructor(...a){ super(...(a.length?a:[T])); } static now(){ return T; } } window.Date=D;
  window.setInterval=()=>0; window.speechSynthesis=undefined; })();`;
const STATES={
  early:`S.st.ratings=Object.assign(S.st.ratings,{PPL:1});`,
  midstory:`for(const m of mainChapters().slice(0,6)) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=30; c.heat=40; c.dirty=25000; S.st.cash=60000; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1});`,
  feds:`for(const m of mainChapters().slice(0,12)) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=55; c.heat=86; c.dirty=90000; S.st.cash=150; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1});`,
  endgame:`for(const m of mainChapters()) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=80; c.heat=20; c.ending='kingpin'; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1});`,
};
const VIEWS=['story','board','map','flight','pilot','money','cup','academy','profile','log','hangar'];
const norm=h=>String(h||'').replace(/\s+/g,' ').replace(/ (style|aria-[a-z]+)="[^"]*"/g,m=>m).trim();
(async()=>{ const b=await chromium.launch(); const out={};
 for(const [name,setup] of Object.entries(STATES)){
  const ctx=await b.newContext({viewport:{width:1300,height:900}}); await ctx.addInitScript(FREEZE); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+ROOT+'/index.html'); await p.evaluate(s=>{ localStorage.clear(); localStorage.setItem('tradewinds.career.v1',s); },FIX); await p.reload(); await p.waitForTimeout(900);
  const r=await p.evaluate(([setup,VIEWS])=>{ document.querySelectorAll('.cut,.title-screen').forEach(e=>e.remove()); S._title=false; S._walk=false; S.st.ui=S.st.ui||{}; S.st.ui.walk3=1; S.notifs=[];
    new Function(setup)(); S.st.jobs=genJobs(S.st); const o={};
    for(const v of VIEWS){ try{ S.view=v; S.showResult=false; render(); o['view:'+v]=document.querySelector('main').innerHTML; }catch(e){ o['view:'+v]='ERROR '+e.message; } }
    for(const t of ['fleet','settings','msfs','save']){ try{ S.view='hangar'; S.hangarTab=t; render(); o['hangar:'+t]=document.querySelector('main').innerHTML; }catch(e){ o['hangar:'+t]='ERROR '+e.message; } }
    try{ o['topbar']=document.querySelector('.topbar').innerHTML; }catch(e){}
    o['jobs']=JSON.stringify(S.st.jobs.map(j=>[j.id,j.kind,j.from,j.to,j.ac,j.pay,j.title,!!j.network,j.pax,j.cargo]));
    const st=JSON.parse(JSON.stringify(S.st)); const c0=S.st.cash; rest(S.st); o['day']=JSON.stringify({spent:c0-S.st.cash, heat:crime(S.st).heat, dirty:crime(S.st).dirty}); S.st=Object.assign(S.st,st);
    return o; },[setup,VIEWS]);
  Object.entries(r).forEach(([k,v])=>out[name+'/'+k]=norm(v)); if(errs.length) out[name+'/errors']=errs.join(' | ');
  await ctx.close(); }
 // every chapter's result at three grades, applied in order on one career
 { const ctx=await b.newContext(); await ctx.addInitScript(FREEZE); const p=await ctx.newPage(); await p.goto('file://'+ROOT+'/index.html'); await p.evaluate(s=>{ localStorage.clear(); localStorage.setItem('tradewinds.career.v1',s); },FIX); await p.reload(); await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{ document.querySelectorAll('.cut,.title-screen').forEach(e=>e.remove()); const st=S.st; Object.assign(st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1}); const o={};
    mainChapters().forEach((m,i)=>{ const g=['A','B','C'][i%3]; const ac=storyAircraft(st,m)[0]||m.ac[0]; st.loc=m.from; const job=storyJob(st,m,ac); st.active={job,accepted:Date.now(),started:Date.now()};
      applyResult(st,job,{landing:'smooth',tasks:[],simFpm:150},{score:{A:95,B:85,C:72}[g],grade:g,parts:[],crash:false,block:30});
      if(m.choice){ S.view='flight'; S.showResult=true; render(); document.querySelectorAll('.cut').forEach(e=>e.remove()); o[m.id+':result']=document.querySelector('main').innerHTML; const bs=[...document.querySelectorAll('[data-act="crime-choose"]:not([disabled])')]; const btn=bs[i%Math.max(1,bs.length)]; if(btn) btn.click(); }
      const c=crime(st); o[m.id+':state']=JSON.stringify({grade:g,cash:st.cash,power:c.power,heat:c.heat,dirty:c.dirty,choice:c.choice[m.id],flags:c.flags,ending:c.ending,last:st.last&&st.last.out}); });
    return o; });
  Object.entries(r).forEach(([k,v])=>out['story/'+k]=norm(v)); await ctx.close(); }
 await b.close();
 if(MODE==='save'){ fs.writeFileSync(BASE, JSON.stringify(out,null,0)); console.log('baseline saved:', Object.keys(out).length, 'snapshots'); return; }
 const base=JSON.parse(fs.readFileSync(BASE,'utf8')); const keys=new Set([...Object.keys(base),...Object.keys(out)]); const diffs=[];
 for(const k of keys){ const a=base[k], c=out[k]; if(a===c) continue; if(a==null||c==null){ diffs.push(`${k}: ${a==null?'NEW':'MISSING'}`); continue; }
  let i=0; while(i<a.length && a[i]===c[i]) i++; diffs.push(`${k}: differs at char ${i}\n    was: …${a.slice(Math.max(0,i-60),i+120)}…\n    now: …${c.slice(Math.max(0,i-60),i+120)}…`); }
 console.log(diffs.length? diffs.join('\n') : 'no differences'); console.log(`${diffs.length} differences across ${keys.size} snapshots`); process.exit(diffs.length?1:0); })();

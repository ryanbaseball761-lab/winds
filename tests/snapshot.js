// Behaviour snapshot for refactors. With random numbers and the clock frozen (timers only fire when
// the test advances time), it records:
//   - every page and hangar tab in four career states, plus the title and new-career screens
//   - the jobs list and a new day in each state
//   - every chapter's result, decision and state change, played in order
//   - seven complete flights fed by a scripted MSFS (tests/fakesim.js): legit job, hard landing,
//     three story chapters with their cutscenes and decisions, a network run and a checkride
//
//   node tests/snapshot.js save    -> writes tests/snapshots/baseline.json (do this BEFORE refactoring)
//   node tests/snapshot.js         -> compares against the baseline and lists every difference
// A pure refactor must report 0 differences. Intended changes (story text, balance) will differ:
// review the diff, then save a new baseline.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'); const {INIT}=require('./fakesim');
const ROOT=path.join(__dirname,'..'), BASE=path.join(__dirname,'snapshots','baseline.json'), FIX=fs.readFileSync(path.join(__dirname,'fixture-save.json'),'utf8');
const MODE=process.argv[2]==='save'?'save':'check'; const ONLY=process.argv[3]||'';
const HELP=`(()=>{ window.__h={
  clear(){ document.querySelectorAll('.cut,.title-screen,.beat,.pc-wrap').forEach(e=>e.remove()); S._title=false; S._walk=false; if(S.st){ S.st.ui=S.st.ui||{}; S.st.ui.walk3=1; } S.notifs=[]; },
  body(){ const c=document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e=>e.remove()); return c.innerHTML; },
  main(){ const m=document.querySelector('main'); return m?m.innerHTML:'(no main)'; },
  // click through a cutscene, recording every line; decisions take option number "pick"
  runCut(pick){ const L=[]; for(let n=0;n<400 && document.querySelector('.cut');n++){ const c=document.querySelector('.cut'); const st=c.querySelector('.cut-stage'); const t=st?st.textContent.replace(/\\s+/g,' ').trim():''; if(t && L[L.length-1]!==t) L.push(t);
      const o=c.querySelectorAll('.cut-opt:not([disabled])'); if(o.length){ o[(pick||0)%o.length].click(); } else { (st||c).click(); } __tick(900); } return L; },
  state(){ const st=S.st, c=crime(st); return JSON.stringify({cash:st.cash,loc:st.loc,day:st.day,flights:st.flights,rep:st.reputation,power:c.power,heat:c.heat,dirty:c.dirty,choice:c.choice,flags:c.flags,ending:c.ending,done:Object.keys(st.story.done).length,ratings:Object.keys(st.ratings).filter(k=>st.ratings[k]),last:st.last&&{res:st.last.res,out:st.last.out}}); },
  // fly the active job from engine start to parked, recording the screen at key moments
  async fly(opt){ opt=opt||{}; const out={}; const CAP=[0,1,3,5,9,20,32,37,38,40,42]; __fake.start(S.st.active.job,opt); out.pre=this.body();
    const beats=()=>{ const b=document.querySelector('.beat:not([data-seen])'); if(!b) return; b.dataset.seen=1; const n=Object.keys(out).filter(x=>x.startsWith('beat')).length; out['beat'+n+'@'+__fake.k]=b.textContent.replace(/\\s+/g,' ').trim();
      const o=b.querySelectorAll('[data-act="beat-opt"]'); if(o.length){ o[(opt.pick||0)%o.length].click(); __tick(300); out['beat'+n+'reply']=b.textContent.replace(/\\s+/g,' ').trim(); } };
    for(let k=0;k<=42;k++){ await __fake.poll(k,0); beats();
      for(let s=0;s<6 && S.st.active;s++){ __tick(5000); beats(); if(document.querySelector('.cut')) out['cut@'+k]=this.runCut(opt.pick).join(' | '); }
      if(CAP.includes(k)) out['k'+k]=this.body();
      if(!S.st.active) break; }
    if(S.st.active){ const d=document.querySelector('[data-act="debrief"]'); if(d){ d.click(); __tick(300); out.debrief=this.main(); const f=document.getElementById('debrief'); if(f){ f.querySelectorAll('input[name="task"]').forEach(x=>x.checked=true); const sc=f.querySelector('input[name="scen"]'); if(sc) sc.checked=true; f.requestSubmit(); } } }
    __tick(2500); if(document.querySelector('.cut')) out.aftercut=this.runCut(opt.pick).join(' | '); __tick(1500);
    out.result=this.body(); out.state=this.state(); out.toasts=JSON.stringify((S.notifs||[]).map(n=>n.m)); return out; },
}; })();`;
const STATES={
  early:`S.st.ratings=Object.assign(S.st.ratings,{PPL:1});`,
  midstory:`for(const m of mainChapters().slice(0,6)) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=30; c.heat=40; c.dirty=25000; S.st.cash=60000; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1});`,
  feds:`for(const m of mainChapters().slice(0,12)) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=55; c.heat=86; c.dirty=90000; S.st.cash=150; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1});`,
  endgame:`for(const m of mainChapters()) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=80; c.heat=20; c.ending='kingpin'; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1});`,
};
// story chapter N (1-based) is next, with everything it needs
const chapterState=n=>`const MC=mainChapters(); for(const m of MC.slice(0,${n-1})) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=${n>3}; c.power=${n*4}; c.heat=20; S.st.cash=80000; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1}); const m=MC[${n-1}]; S.st.hangar=S.st.hangar||{}; m.ac.forEach(k=>S.st.hangar[k]=true); S.st.loc=m.from;`;
const startStory=`S.view='story'; render(); const b=document.querySelector('[data-act="accept-story"],[data-act="story-go"]'); if(!b) throw new Error('no play button'); b.click(); __tick(600);`;
const FLIGHTS={
  legit:   {setup:STATES.early, start:`S.st.jobs=genJobs(S.st); S.view='board'; render(); const a=document.querySelector('[data-act="accept"][data-id]'); a.click();`, opt:{}},
  hard:    {setup:STATES.early, start:`S.st.jobs=genJobs(S.st); S.view='board'; render(); const a=document.querySelector('[data-act="accept"][data-id]'); a.click();`, opt:{fpm:640,bounces:2,g:2.4}},
  story2:  {setup:chapterState(2), start:startStory, opt:{pick:0}},
  story7:  {setup:chapterState(7), start:startStory, opt:{pick:1}},
  story19: {setup:chapterState(19), start:startStory, opt:{pick:0}},
  network: {setup:STATES.midstory, start:`S.st.jobs=genJobs(S.st); const j=S.st.jobs.find(x=>x.network); if(!j) throw new Error('no network job'); S.st.hangar=S.st.hangar||{}; S.st.hangar[j.ac]=true; S.st.loc=j.from; S.st.jobs=S.st.jobs.filter(x=>x.id!==j.id); S.st.active={job:j,accepted:Date.now()}; S.view='flight'; render();`, opt:{}},
  check:   {setup:STATES.early+`S.st.cash=90000;`, start:`S.view='pilot'; render(); const b=document.querySelector('[data-act="book-check"]:not([disabled])'); if(!b) throw new Error('no checkride'); b.click(); __tick(400);`, opt:{}},
};
const VIEWS=['story','board','map','flight','pilot','money','cup','academy','profile','log','hangar'];
const norm=h=>String(h==null?'':h).replace(/\s+/g,' ').trim();
(async()=>{ const b=await chromium.launch(); const out={};
 const open=async(save)=>{ const ctx=await b.newContext({viewport:{width:1300,height:900}}); await ctx.addInitScript(INIT); await ctx.addInitScript(HELP); const p=await ctx.newPage(); p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message));
   await p.goto('file://'+ROOT+'/index.html'); await p.evaluate(s=>{ localStorage.clear(); if(s) localStorage.setItem('tradewinds.career.v1',s); },save); await p.reload(); await p.evaluate(()=>__tick(3000)); p._ctx=ctx; return p; };
 const put=(prefix,r,p)=>{ Object.entries(r).forEach(([k,v])=>out[prefix+'/'+k]=norm(v)); if(p._errs.length) out[prefix+'/errors']=p._errs.join(' | '); };
 const want=n=>!ONLY||n.startsWith(ONLY);
 // 1. pages in each state
 for(const [name,setup] of Object.entries(STATES)){ if(!want('state')) break; const p=await open(FIX);
  const r=await p.evaluate(([setup,VIEWS])=>{ __h.clear(); new Function(setup)(); S.st.jobs=genJobs(S.st); const o={};
    for(const v of VIEWS){ try{ S.view=v; S.showResult=false; render(); __tick(200); o['view:'+v]=__h.main(); }catch(e){ o['view:'+v]='ERROR '+e.message; } }
    for(const t of ['fleet','settings','msfs','save']){ try{ S.view='hangar'; S.hangarTab=t; render(); __tick(200); o['hangar:'+t]=__h.main(); }catch(e){ o['hangar:'+t]='ERROR '+e.message; } }
    S.view='story'; render(); __tick(200); o['body:story']=__h.body();
    o['jobs']=JSON.stringify(S.st.jobs.map(j=>[j.id,j.kind,j.from,j.to,j.ac,j.pay,j.title,!!j.network,j.pax,j.cargo]));
    const c0=S.st.cash; rest(S.st); __tick(1500); o['day']=JSON.stringify({spent:c0-S.st.cash})+__h.state(); S.view='board'; render(); o['view:board-nextday']=__h.main();
    return o; },[setup,VIEWS]);
  put('state:'+name,r,p); await p._ctx.close(); }
 // 2. first-run screens
 if(want('first')){ let p=await open(FIX); put('first:title',{body:await p.evaluate(()=>__h.body())},p); await p._ctx.close();
  p=await open(null); const r=await p.evaluate(()=>{ const o={}; o.setup=__h.body(); const t=document.querySelector('[data-ts="new"],[data-ts]'); if(t){ t.click(); __tick(500); o.afterTitle=__h.body(); }
    const n=document.getElementById('pname'); if(n){ n.value='Test Pilot'; const c=document.getElementById('pcall'); if(c) c.value='TW1'; document.getElementById('setup-form').requestSubmit(); __tick(1500); }
    o.coldopen=__h.runCut(0).join(' | '); __tick(2000); o.walk=__h.runCut(0).join(' | '); __tick(1000); o.first=__h.body(); o.state=S.st?__h.state():'no career'; return o; });
  put('first:new',r,p); await p._ctx.close(); }
 // 3. every chapter's result at three grades, applied in order on one career
 if(want('story')){ const p=await open(FIX);
  const r=await p.evaluate(()=>{ __h.clear(); const st=S.st; Object.assign(st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1}); const o={};
    mainChapters().forEach((m,i)=>{ const g=['A','B','C'][i%3]; const ac=storyAircraft(st,m)[0]||m.ac[0]; st.loc=m.from; const job=storyJob(st,m,ac); st.active={job,accepted:Date.now(),started:Date.now()};
      applyResult(st,job,{landing:'smooth',tasks:[],simFpm:150},{score:{A:95,B:85,C:72}[g],grade:g,parts:[],crash:false,block:30});
      S.view='flight'; S.showResult=true; render(); __tick(1200); o[m.id+':aftercut']=__h.runCut(i).join(' | '); __tick(800); o[m.id+':result']=__h.main();
      const bs=[...document.querySelectorAll('[data-act="crime-choose"]:not([disabled])')]; if(bs.length){ bs[i%bs.length].click(); __tick(500); }
      o[m.id+':state']=__h.state(); S.showResult=false; S.view='story'; render(); __tick(300); o[m.id+':storypage']=__h.main(); });
    return o; });
  put('story',r,p); await p._ctx.close(); }
 // 4. complete flights with the scripted sim
 for(const [name,F] of Object.entries(FLIGHTS)){ if(!want('fly')) break; const p=await open(FIX);
  let r; try{ r=await p.evaluate(async([setup,start,opt])=>{ __h.clear(); new Function(setup)(); S.st.jobs=genJobs(S.st); const o={}; new Function(start)(); __tick(800);
      if(document.querySelector('.cut')) o.precut=__h.runCut(opt.pick).join(' | '); __tick(800); if(!S.st.active) throw new Error('flight did not start');
      o.job=JSON.stringify([S.st.active.job.id,S.st.active.job.kind,S.st.active.job.from,S.st.active.job.to,S.st.active.job.ac,S.st.active.job.title]);
      Object.assign(o, await __h.fly(opt)); return o; },[F.setup,F.start,F.opt]); }catch(e){ r={ERROR:e.message}; }
  put('fly:'+name,r,p); await p._ctx.close(); }
 await b.close();
 const bad=Object.entries(out).filter(([k,v])=>/\/errors$|\/ERROR$/.test(k)||/^ERROR /.test(v)); if(bad.length) console.log('PROBLEMS:\n'+bad.map(([k,v])=>'  '+k+': '+v.slice(0,300)).join('\n'));
 if(MODE==='save'){ fs.writeFileSync(BASE, JSON.stringify(out)); console.log('baseline saved:', Object.keys(out).length, 'snapshots,', (fs.statSync(BASE).size/1024|0)+' KB'); return; }
 const base=JSON.parse(fs.readFileSync(BASE,'utf8')); const keys=[...new Set([...Object.keys(base),...Object.keys(out)])].filter(k=>!ONLY||k.startsWith(ONLY)||k.split(':')[0]===ONLY.split(':')[0]); const diffs=[];
 for(const k of keys){ const a=base[k], c=out[k]; if(a===c) continue; if(a==null||c==null){ diffs.push(`${k}: ${a==null?'NEW':'MISSING'}`); continue; }
  let i=0; while(i<a.length && a[i]===c[i]) i++; diffs.push(`${k}: differs at char ${i}\n    was: …${a.slice(Math.max(0,i-80),i+160)}…\n    now: …${c.slice(Math.max(0,i-80),i+160)}…`); }
 console.log(diffs.length? diffs.slice(0,40).join('\n') : 'no differences'); console.log(`${diffs.length} differences across ${keys.length} snapshots`); process.exit(diffs.length?1:0); })();

// Regression suite: every check must pass before an update ships.  Usage: node tests/run.js
const fs=require('fs'), path=require('path'); const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'); const FIX=fs.readFileSync(path.join(__dirname,'fixture-save.json'),'utf8');
const results=[]; const ok=(n,c,info)=>{ results.push([n,!!c,info||'']); };
(async()=>{ const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:950}});
  const page=async()=>{ const p=await ctx.newPage(); p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); await p.goto('file://'+ROOT+'/index.html'); await p.waitForTimeout(600);
    await p.evaluate(s=>{ localStorage.clear(); localStorage.setItem('tradewinds.career.v1',s); },FIX); await p.reload(); await p.waitForTimeout(1300);
    await p.evaluate(()=>{ document.querySelectorAll('.cut,.title-screen').forEach(e=>e.remove()); S._title=false; S._walk=false; S.st.ui=S.st.ui||{}; S.st.ui.walk3=1; S.st.ratings=Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1}); S.st.minutes=99999; S.st.cash=500000; }); return p; };
  try{
  // 1. loads cleanly
  let p=await page(); ok('loads without script errors', p._errs.length===0, p._errs.join(' | '));
  // 2. every page draws and shows its own content
  const v=await p.evaluate(()=>{ const out=[]; for(const x of ['story','board','map','flight','pilot','money','cup','academy','profile','log','hangar']){ try{ S.view=x; render(); const t=(document.querySelector('main')||{}).innerText||''; if(!t.trim()) out.push(x+' empty'); if(x!=='board' && /Jobs at [A-Z]{4}/.test(t)) out.push(x+' shows the job board'); }catch(e){ out.push(x+' '+e.message); } }
    for(const t of ['fleet','settings','msfs','save']){ try{ S.view='hangar'; S.hangarTab=t; render(); }catch(e){ out.push('hangar/'+t+' '+e.message); } } return out; });
  ok('all pages draw their own content', v.length===0, v.join(', '));
  // 3. the whole main story plays through, with choices
  const s=await p.evaluate(()=>{ const st=S.st; const L=[]; for(const m of mainChapters()){ const ac=storyAircraft(st,m)[0]||m.ac[0]; st.loc=m.from; const job=storyJob(st,m,ac); st.active={job,accepted:Date.now(),started:Date.now()};
      applyResult(st,job,{landing:'smooth',tasks:[],simFpm:150},{score:85,grade:'B',parts:[],crash:false,block:30}); if(!st.story.done[m.id]) L.push(m.id+' not done');
      if(m.choice){ S.view='flight'; S.showResult=true; render(); document.querySelectorAll('.cut').forEach(e=>e.remove()); const b=document.querySelector('[data-act="crime-choose"]:not([disabled])'); if(!b) L.push(m.id+' no choice'); else b.click(); } }
    S.showResult=false; return {L, n:mainChapters().length, ending:crime(st).ending}; });
  ok('main story plays through (all chapters, choices, ending)', s.L.length===0 && s.n>=20 && !!s.ending, JSON.stringify(s));
  ok('no script errors during the story', p._errs.length===0, p._errs.join(' | ')); await p.close();
  // 4. cutscene after a chapter offers the decision
  p=await page(); const c=await p.evaluate(async()=>{ const st=S.st; ['CW1','CR2','CR3'].forEach(i=>st.story.done[i]=1); const m=CRIME.find(x=>x.id==='CR4'); st.loc=m.from; crime(st).proSeen={CR4:1}; st.active={job:storyJob(st,m,'C172'),accepted:Date.now()}; S.view='flight'; render(); document.querySelector('[data-act="test-skip"]').click(); await new Promise(r=>setTimeout(r,900)); return !!document.querySelector('.cut'); });
  await p.waitForTimeout(400); for(let i=0;i<14;i++){ const o=await p.$('.cut-opt'); if(o){ await o.click(); break; } await p.mouse.click(700,300); await p.waitForTimeout(250); }
  const ch=await p.evaluate(()=>crime().choice.CR4); ok('after-flight cutscene shows and takes the decision', c && ch!=null, `cut=${c} choice=${ch}`);
  // 5. skip gives a 100
  const sk=await p.evaluate(()=>{ const st=S.st; document.querySelectorAll('.cut').forEach(e=>e.remove()); st.jobs=genJobs(st); st.active={job:st.jobs[0],accepted:Date.now()}; S.view='flight'; S.showResult=false; render(); document.querySelector('[data-act="test-skip"]').click(); return st.last.res.score; });
  ok('test skip finishes as 100', sk===100, String(sk));
  // 6. a cancelled checkride is refunded
  const rf=await p.evaluate(()=>{ const st=S.st; document.querySelectorAll('.cut').forEach(e=>e.remove()); st.active=null; delete st.ratings.ATP; S.view='pilot'; render(); const b=document.querySelector('[data-act="book-check"][data-r="ATP"]'); if(!b) return 'no button'; const c0=st.cash; b.click(); const mid=st.cash; const y=document.createElement('button'); y.dataset.act='cancel-yes'; document.body.appendChild(y); y.click(); return {c0,mid,after:st.cash}; });
  ok('cancelled checkride is refunded', rf.c0===rf.after && rf.mid<rf.c0, JSON.stringify(rf)); await p.close();
  // 7. economy, feds, New Game+
  p=await page(); const e=await p.evaluate(()=>{ const st=S.st; for(const m of mainChapters().slice(0,10)) st.story.done[m.id]=1; const c=crime(st); c.on=true; c.power=40; c.heat=85; S.view='story'; render(); const feds=!!document.querySelector('.feds');
    st.jobs=genJobs(st); const net=st.jobs.filter(j=>j.network).length; document.querySelector('[data-act="pay-fix"]').click(); const h=c.heat; const cash0=st.cash; rest(st); const daily=cash0-st.cash;
    mainChapters().forEach(m=>st.story.done[m.id]=1); c.ending='kingpin'; S.view='story'; render(); const ng=document.querySelector('[data-act="ng-start"]'); ng.click(); ng.click(); document.querySelectorAll('.cut').forEach(x=>x.remove());
    return {feds,net,h,daily,ngDone:Object.keys(st.story.done).filter(k=>CRIME_IDS.has(k)).length, ng:crime(st).ng}; });
  ok('feds block at Heat 80+, no network runs then', e.feds && e.net===0, JSON.stringify(e)); ok('paying the fix cuts Heat', e.h<=55, String(e.h)); ok('new day charges fleet upkeep', e.daily>=330, String(e.daily)); ok('New Game+ restarts the story', e.ngDone===0 && e.ng===1, JSON.stringify(e));
  ok('no script errors in economy checks', p._errs.length===0, p._errs.join(' | ')); await p.close();
  // 8. regressions from the bug hunt
  p=await page(); const g=await p.evaluate(async()=>{ const st=S.st; const out={};
    /* chapters changed by earlier choices still get the right "Ch n/total" label */
    crime(st).flags.hidcase=1; const m=CRIME.find(x=>x.id==='CR9'); out.label=storyJob(st,m,'SF50').label;
    /* Expert: skipping the checklist still costs 10 points when MSFS measured the touchdown */
    st.ui=st.ui||{}; const d0=st.difficulty; st.difficulty='expert'; st.jobs=genJobs(st); const j=st.jobs.find(x=>!x.local)||st.jobs[0]; st.active={job:j,accepted:Date.now(),started:Date.now()};
    const f={landing:'smooth',tdz:true,center:true,fuel:999,fuelUnit:'lb',block:j.est||30,checklist:true,radio:true,weather:true,smooth:true,tasks:[]};
    out.expert=score(j,Object.assign({},f)).parts.some(x=>/checklist not completed/.test(x[0])); st.difficulty=d0; st.active=null;
    /* one flight never costs more than 12% airframe health, and nothing above 25% is grounded */
    const A=airframe(st,j.ac); A.h=60; const fo={landing:'hard',simBounces:4,simG:2.2}; const oo={notes:[],costs:0}; wearAirframe(st,j,fo,{crash:false},oo); out.wear=A.h; out.grounded=!!A.grounded;
    /* a double click on New day only starts one day */
    S.view='board'; render(); const day=st.day; const b=document.querySelector('[data-act="rest"]'); b.click(); b.click(); out.days=st.day-day;
    return out; });
  ok('chapter label survives earlier choices', /Chapter [1-9]\d* of 20/.test(g.label), g.label);
  ok('Expert checklist penalty is not lost', g.expert, String(g.expert));
  ok('wear is capped at 12% per flight, no grounding above 25%', g.wear===48 && !g.grounded, JSON.stringify(g));
  ok('double click on New day counts once', g.days===1, String(g.days));
  /* dollar amounts like $1,800 survive being placed into pages (they used to lose the "$1") */
  const money1=await p.evaluate(()=>{ const st=S.st; ['CW1','CR2','CR3','CR4','CR5','CR10','CR14','CR15'].forEach(id=>st.story.done[id]=1); crime(st).on=true; crime(st).dirty=5000; const bad=[]; for(const v of ['money','story','hangar']){ S.view=v; S.showResult=false; render(); const t=document.querySelector('main').innerText; if(/(^|\n|: )\s*,\d{3}/.test(t)) bad.push(v); } return bad; });
  ok('dollar amounts are never cut to ",800"', money1.length===0, money1.join(','));
  ok('no script errors in regression checks', p._errs.length===0, p._errs.join(' | ')); await p.close();
  // 9. MSFS clock: whatever offset the sim applies, setSimClock ends on the target time
  p=await page(); const clk=await p.evaluate(async()=>{ const out=[]; const realST=window.setTimeout; window.setTimeout=(f,ms)=>realST(f,0);
    for(const bug of [0,-240,300,720,-60]){ let simMin=0; S.simState='live'; S.sim=S.sim||{}; const set=m=>{ simMin=((m+bug)%1440+1440)%1440; S.sim.simLocalTime=`${String(Math.floor(simMin/60)).padStart(2,'0')}:${String(simMin%60).padStart(2,'0')}`; };
      S.mcp={ callTool: async(srv,tool,args)=>{ if(tool==='set_time'){ set(args.localMin); return {payload:{ok:true}}; } return {payload:{}}; } };
      for(const target of [9*60+30, 21*60, 5]){ const r=await setSimClock(target); const d=Math.abs(((simMinutes()-target)%1440+1440+720)%1440-720); out.push({bug,target,ok:r.ok,d}); } }
    window.setTimeout=realST; S.mcp=null; S.simState='off'; return out; });
  ok('MSFS clock lands on the planned time for any sim offset', clk.every(x=>x.ok && x.d<=3), JSON.stringify(clk.filter(x=>!x.ok||x.d>3)));
  // 10. airline: airliners, facilities, bases, refits, route market
  const co=await p.evaluate(()=>{ const st=S.st; st.cash=9e7; st.company={name:'Test Air',base:'TNCM',fleet:[],ledger:[],founded:1}; S.downPct=100; S.view='company'; render();
    document.querySelector('[data-act="co-buy"][data-src="new:A320"]').click(); const f=st.company.fleet[0]; const o={bought:!!f, hired:f&&f.hired===!canFly(st,'A320')};
    f.route={to:'TJSJ',fare:refFare(distNm(AP.TNCM,AP.TJSJ))}; const r0=routeDay(st,f,false);
    S.view='company'; render(); document.querySelector('[data-act="co-upg"][data-v="mkt"]').click(); const r1=routeDay(st,f,false); o.mktUp=r1.pax>=r0.pax;
    const f2={...f, fid:'x'}; st.company.fleet.push(f2); const r2=routeDay(st,f,false); o.shared=r2.pax<=r1.pax; st.company.fleet.pop();
    S.view='company'; render(); const sel=document.getElementById('co-newbase'); sel.value='TJSJ'; document.querySelector('[data-act="co-base"]').click(); o.base=(st.company.bases||[]).includes('TJSJ');
    S.view='company'; render(); document.querySelector('[data-act="co-refit"]').click(); o.refit=!!f.refit; const cash=st.cash; companyTick(st); o.tick=cash!==st.cash; o.value=companyValue(st)>0; return o; });
  ok('airline: buy an A320, facilities, bases, refits, shared routes', Object.values(co).every(Boolean), JSON.stringify(co));
  const earned=await p.evaluate(()=>{ const st=S.st; S.view='profile'; render(); const a=[...document.querySelectorAll('main *')].find(e=>/^Earned$/i.test(e.textContent.trim())); const pv=a&&a.parentElement.textContent.replace(/Earned/i,'').trim(); S.view='story'; render(); const b=[...document.querySelectorAll('.sh-stats span')].find(e=>/Earned/i.test(e.textContent)); const sv=b&&b.nextElementSibling.textContent.trim(); return [pv,sv]; });
  ok('Earned is the same on Profile and Story', earned[0] && earned[0].includes(earned[1]), JSON.stringify(earned));
  ok('no script errors in clock and airline checks', p._errs.length===0, p._errs.join(' | ')); await p.close();
  }catch(err){ ok('suite crashed', false, err.message); }
  await b.close(); let fail=0; for(const [n,good,info] of results){ console.log((good?'ok   ':'FAIL ')+n+(good?'':'  -> '+info)); if(!good) fail++; } console.log(fail?`${fail} FAILED`:'ALL PASSED'); process.exit(fail?1:0); })();

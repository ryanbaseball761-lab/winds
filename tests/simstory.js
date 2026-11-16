// A story chapter flown through the live code with fake MSFS data: in-flight story moments, a flight order (CH=CR4 steep turn), auto-finish and the aftermath.
// Flies a fake MSFS flight through the live-sim code (renderSimBits) and prints what the game did.
//   node tests/simflight.js [path/to/index.html]
// Used to check that a refactor of the sim code behaves the same: run it on two builds and diff the output.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const FILE=path.resolve(process.argv[2]||path.join(__dirname,'..','index.html')); const FIX=fs.readFileSync(path.join(__dirname,'fixture-save.json'),'utf8');
const FREEZE=`(()=>{ let s=99; Math.random=()=>{ s=(s*1103515245+12345)%2147483648; return s/2147483648; };
  let T=Date.UTC(2026,5,1,16,0,0); const _D=Date; class D extends _D{ constructor(...a){ super(...(a.length?a:[T])); } static now(){ return T; } } window.Date=D; window.__adv=ms=>{ T+=ms; };
  window.setInterval=()=>0; const _st=window.setTimeout; window.setTimeout=(f,ms)=>_st(f,0); window.speechSynthesis=undefined; })();`;
(async()=>{ const b=await chromium.launch(); const ctx=await b.newContext(); await ctx.addInitScript(FREEZE); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+FILE); await p.evaluate(s=>{ localStorage.clear(); localStorage.setItem('tradewinds.career.v1',s); },FIX); await p.reload(); await p.waitForTimeout(800);
  const log=await p.evaluate(async()=>{ document.querySelectorAll('.cut,.title-screen').forEach(e=>e.remove()); S._title=false;
    const st=S.st; const CH=mainChapters().find(x=>x.id===(window.__CH||'CR4')); mainChapters().forEach(x=>{ if(mainChapters().indexOf(x)<mainChapters().indexOf(CH)) st.story.done[x.id]=1; }); st.loc=CH.from; st.ratings.JET=true; const job=storyJob(st,CH,storyAircraft(st,CH)[0]||CH.ac[0]); const from=AP[job.from], to=AP[job.to]; const cuts=[]; new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.classList&&n.classList.contains('cut')) cuts.push(n.dataset.sig.slice(0,40)); }))).observe(document.body,{childList:true}); let beats=[], hdg=90, bank=0; const _sb=window.showBeat; window.showBeat=function(a,b,i){ const r=_sb.apply(this,arguments); beats.push((b.text||'').slice(0,40)); const o=document.querySelector('.beat [data-act="beat-opt"]'); if(o){ o.click(); if(a.order) bank=45; } return r; };
    st.active={job, accepted:Date.now()}; S.view='flight'; S.mcp=null; S.simState='live'; const out=[]; const toasts=[]; const _t=window.toast; window.toast=m=>{ toasts.push(String(m)); };
    const wait=()=>new Promise(r=>setTimeout(r,0));
    const lerp=(a,b,f)=>a+(b-a)*f;
    const rec={id:'r1', armedAt:Date.now(), phase:'parked'};
    const mk=(f,phase)=>{ const lat=lerp(from.lat,to.lat,f), lon=lerp(from.lon,to.lon,f); const air=phase==='air';
      return { position:{lat,lon,hdg:90,altFt:air?5500:from.el||0, aglFt:air?(f>0.97?400:5000):0}, motion:{onGround:!air, gs:phase==='parked'?0:air?140:15, ias:air?130:10, vsFpm:air?(f>0.9?-600:0):0, hdg:90},
        systems:{engineRunning:phase!=='parked'||f<0.5, fuelLb:600-f*200}, ext:{ flaps:{handle:air&&f>0.95?1:0,left:0,right:0,overspeed:false,damaged:false}, gear:{retractable:false,down:true,overspeed:false}, warnings:{stall:false,overspeed:false}, attitude:{bank:0,pitch:0}, controls:{yokeX:0}, lights:{landing:true}, autopilot:false, weather:{windKt:8,windDir:90,visSm:10,inCloud:false}, transponder:{mode:'alt'} },
        recorder:rec, aircraft:{title:AC[job.ac].n} }; };
    const steps=[[0,'parked'],[0,'taxi'],[0.02,'air'],[0.3,'air'],[0.35,'air'],[0.4,'air'],[0.45,'air'],[0.5,'air'],[0.55,'air'],[0.6,'air'],[0.9,'air'],[0.98,'air'],[1,'taxi'],[1,'parked']];
    for(let k=0;k<steps.length;k++){ const [f,ph]=steps[k]; __adv(bank?20000:4*60000);
      if(ph==='air' && !rec.takeoff) rec.takeoff={t:Date.now()}; if(k===12){ rec.touchdown={fpm:180,lat:to.lat,lon:to.lon,g:1.2}; rec.bounces=0; rec.phase='landed'; } if(k===13){ rec.blockIn=true; rec.blockMinutes=28; rec.fuelNowLb=380; }
      rec.phase = ph==='air'?'airborne':rec.phase; S.sim=mk(f,ph); if(bank){ hdg=(hdg+120)%360; S.sim.position.hdg=hdg; S.sim.ext.attitude.bank=bank; } if(st.active&&st.active.started&&!rec._a){ rec._a=1; rec.armedAt=st.active.started; } if(rec.takeoff&&!rec.takeoff.lat){ rec.takeoff.lat=from.lat; rec.takeoff.lon=from.lon; } try{ renderSimBits(); }catch(e){ out.push('THROW '+e.message); } await wait(); await wait();
      { if(st.active&&st.active.order&&st.active.order.state!=='active') bank=0; if(st.active&&st.active.order) out.push('order '+st.active.order.state+' turned '+Math.round(st.active.order.turned||0)); }

      const a=st.active; out.push(`step ${k} ${ph} f=${f}: started=${!!(a&&a.started)} view=${S.view} active=${!!a} cab=${a&&a.cab?a.cab.log.map(x=>x.who+':'+x.text).join(' | '):''}`); }
    out.push('BEATS '+beats.length+': '+beats.map(b=>b.slice(0,40)).join(' || '));  out.push('CUTS '+cuts.join(' || ')); const L=st.last; out.push('RESULT '+(L?JSON.stringify({grade:L.res.grade,score:L.res.score,notes:L.out.notes,pay:L.out.pay}):'none')); out.push('TOASTS '+toasts.join(' || ')); out.push('CASH '+st.cash+' REP '+st.reputation);
    return out; });
  console.log(log.join('\n')); if(errs.length) console.log('ERRORS', errs.join(' | ')); const bad=errs.length || log.some(l=>/^THROW|RESULT none/.test(l)); await b.close(); process.exit(bad?1:0); })();

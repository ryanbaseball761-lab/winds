// Plays whole careers headlessly in different styles and reports how the economy feels.
//   node tools/sim.js            -> table of results (4 play styles x 3 seeds)
//   node tools/sim.js --json     -> raw numbers
// Uses the real game code from index.html (build first). Each flight is "flown" by picking a grade
// from the style's skill, then the game's own score/applyResult/rest logic does the rest.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'); const FIX=fs.readFileSync(path.join(ROOT,'tests','fixture-save.json'),'utf8');
const STYLES={
  legit:  {net:false, skill:'good', buy:false},   // never takes network runs
  mixed:  {net:'cool', skill:'good', buy:true},   // network runs while Heat is under 55
  greedy: {net:true, skill:'good', buy:true, fix:true},   // always takes the best-paying job, pays off the feds
  sloppy: {net:'cool', skill:'bad', buy:true},    // like mixed, but lands C/D and sometimes crashes
};
const SEEDS=(process.env.SEEDS||'11,22,33').split(',').map(Number); const ONLY=process.env.STYLE;
(async()=>{ const b=await chromium.launch(); const rows=[];
 for(const [name,style] of Object.entries(STYLES)) for(const seed of SEEDS){ if(ONLY && name!==ONLY) continue;
  const ctx=await b.newContext(); await ctx.addInitScript(`(()=>{ let s=${seed}; Math.random=()=>{ s=(s*1103515245+12345)%2147483648; return s/2147483648; }; window.speechSynthesis=undefined; })();`);
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+ROOT+'/index.html'); await p.evaluate(s=>{ localStorage.clear(); localStorage.setItem('tradewinds.career.v1',s); },FIX); await p.reload();
  await p.waitForTimeout(900);
  const r=await p.evaluate(style=>{ window.setTimeout=()=>0; window.setInterval=()=>0; window.toast=()=>{}; window.render=()=>{}; window.save=()=>{}; window.takeover=()=>{}; window.achPop=()=>{};
    const st=S.st; const MC=mainChapters(); const c=()=>crime(st);
    const pickGrade=()=>{ const x=Math.random(); if(style.skill==='good') return x<0.4?'A':x<0.8?'B':'C'; if(x<0.03) return 'crash'; return x<0.25?'B':x<0.6?'C':x<0.9?'D':'F'; };
    const fly=job=>{ const g=pickGrade(); const crash=g==='crash'; const sc={A:95,B:85,C:74,D:64,F:50}[g]||0; st.active={job,accepted:Date.now(),started:Date.now()};
      const f={landing:crash?'crash':g==='A'?'smooth':g==='D'||g==='F'?'hard':'firm', tasks:(job.tasks||[]).slice(), landedAt:job.local?job.from:job.to, simFpm:g==='A'?120:300, fuel:999, fuelUnit:'lb', block:job.est||plan(job).est};
      applyResult(st, job, f, {score:sc, grade:crash?'F':g, parts:[], crash, block:f.block, fuelMin:60}); return {g, crash}; };
    const M={ days:0, act:{}, chapters:0, flights:0, net:0, fedsDays:0, peakHeat:0, minCash:st.cash, shortfalls:0, busts:0, searches:0, fixes:0, laundered:0, crewHired:0, safes:0, ending:null };
    const actOf=m=>CRIME_ACTS.findIndex(a=>a.arc===m.arc)+1;
    for(let day=0; day<400 && !c().ending; day++){ M.days=day+1;
      // launder whatever is dirty, through the cheapest option
      if(c().dirty>0){ const o=launderOpts(st).sort((a,b)=>a.fee-b.fee)[0]; const amt=c().dirty; M.laundered+=amt; c().dirty=0; txn(st,Math.round(amt*(1-o.fee)),'Laundered',o.n); if(o.heat) crBump(c(),'heat',o.heat); }
      // feds
      if(fedsWatching(st)){ M.fedsDays++; if(style.fix && st.cash>=fixCost(st)){ txn(st,-fixCost(st),'Payoffs','fix'); crBump(c(),'heat',-30); M.fixes++; } }
      // spend: crew and safehouses
      if(style.buy){ CREW.filter(k=>st.story.done[k.need] && !(c().crew&&c().crew[k.id]) && !k.lost(c().flags,st.story.done) && st.cash>k.cost*1.5).forEach(k=>{ txn(st,-k.cost,'Operation',k.n); c().crew=c().crew||{}; c().crew[k.id]=1; M.crewHired++; });
        const lv=safeLevel(st); const s=SAFEHOUSES[lv+1]; if(s && st.cash>s.cost*2){ txn(st,-s.cost,'Operation',s.n); c().safe=s.id; M.safes++; } }
      // the next chapter, if it can be played
      const m=MC.find(x=>!st.story.done[x.id]);
      if(m && !(c().on && fedsWatching(st))){ (((m.req||{}).ratings)||[]).forEach(r=>{ st.ratings[r]=true; }); const ok=!m.req||!m.req.after||st.story.done[m.req.after];
        if(ok){ if(st.loc!==m.from){ const d=deadheadCost(st,m.from); txn(st,-(d.cost||0),'Travel','seat'); st.loc=m.from; }
          const ac=m.ac.find(k=>AC[k])||m.ac[0]; st.hangar[ac]=true; const job=storyJob(st,m,ac); if(!M.act[actOf(m)]) M.act[actOf(m)]=M.days;
          const res=fly(job); if(!res.crash){ M.chapters++;
            if(m.choice){ const opts=m.choice.opts.map((o,i)=>({o,i})).filter(x=>!(x.o.ending && ENDING_REQ[x.o.ending](c())));
              const pick=style.net===false ? opts[opts.length>1&&m.id==='CR17'?1:0] : opts.sort((a,b)=>(b.o.power||0)-(a.o.power||0))[0];
              const bt=document.createElement('button'); bt.dataset.act='crime-choose'; bt.dataset.i=pick.i; document.body.appendChild(bt); bt.click(); bt.remove(); } } } }
      // side jobs for the rest of the day
      for(let k=0;k<3;k++){ ensureJobs(st); let L=(st.jobs||[]).filter(j=>j.kind==='gen' && j.from===st.loc);
        const wantNet = style.net===true || (style.net==='cool' && c().heat<55); if(!wantNet) L=L.filter(j=>!j.network);
        L.sort((a,b)=>b.pay-a.pay); const j=L[0]; if(!j) break; st.jobs=st.jobs.filter(x=>x!==j);
        const before={heat:c().heat}; const res=fly(j); M.flights++; if(j.network) M.net++;
        const n=(st.last&&st.last.out&&st.last.out.notes)||[]; if(n.some(x=>/^BUSTED/.test(x))) M.busts++; if(n.some(x=>/^Customs searched/.test(x))) M.searches++; }
      M.peakHeat=Math.max(M.peakHeat,c().heat);
      const before=st.cash; rest(st); M.minCash=Math.min(M.minCash, st.cash); if(fin(st).ledger.slice(0,5).some(x=>/couldn't cover/.test(x.m))) M.shortfalls++; }
    const cats={}; fin(st).ledger.forEach(x=>{ cats[x.c]=(cats[x.c]||0)+x.a; }); M.cats=cats; M.ledgerLen=fin(st).ledger.length; M.ending=c().ending; M.doneIds=MC.filter(x=>st.story.done[x.id]).length; M.choice17=c().choice.CR17; M.next=(MC.find(x=>!st.story.done[x.id])||{}).id; M.cash=st.cash; M.power=c().power; M.heat=c().heat; M.net=M.net; return M; }, style);
  rows.push(Object.assign({style:name, seed}, r, {errors:errs.length})); await ctx.close(); }
 await b.close();
 if(process.argv.includes('--json')){ console.log(JSON.stringify(rows,null,1)); return; }
 const avg=(L,k)=>Math.round(L.reduce((s,x)=>s+(typeof k==='function'?k(x):x[k]||0),0)/L.length);
 console.log('style   | days | act2 act3 act4 act5 | flights net | peak heat | feds days | busts searches | final cash | min cash | shortfalls | ending');
 for(const s of Object.keys(STYLES)){ const L=rows.filter(r=>r.style===s); if(!L.length) continue;
  console.log(`${s.padEnd(7)} | ${String(avg(L,'days')).padStart(4)} | ${[2,3,4,5].map(a=>String(avg(L,x=>x.act[a]||0)).padStart(4)).join(' ')} | ${String(avg(L,'flights')).padStart(7)} ${String(avg(L,'net')).padStart(3)} | ${String(avg(L,'peakHeat')).padStart(9)} | ${String(avg(L,'fedsDays')).padStart(9)} | ${String(avg(L,'busts')).padStart(5)} ${String(avg(L,'searches')).padStart(8)} | ${('$'+avg(L,'cash').toLocaleString()).padStart(10)} | ${('$'+avg(L,'minCash').toLocaleString()).padStart(8)} | ${String(avg(L,'shortfalls')).padStart(10)} | ${L.map(x=>x.ending||'-').join(',')}${L.some(x=>x.errors)?' (errors)':''}`); }
})();

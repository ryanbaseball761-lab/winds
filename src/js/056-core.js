/* ===================== MORE: in-flight requests, quick filters, first flight, real aircraft numbers, fair diversions, clear debrief, story goals ===================== */

/* ---- 1. requests during the flight, checked from MSFS ---- */
const ASKS = [
  {k:'lap', when:j=>!j.local, text:j=>`A passenger asks for one lap around ${AP[j.to].isl} before you land. Circle the destination at 1,000–2,500 ft.`},
  {k:'climb', when:j=>!j.local, text:j=>{ const alt=['ga','stol','amph','hp','bush'].includes(AC[j.ac].cls)?6500:12500; j._askAlt=alt; return `The cabin is getting bounced around. Climb to at least ${alt.toLocaleString()} ft to find smoother air.`; }},
  {k:'hold', when:j=>true, text:j=>`Traffic at the destination: you've been asked to hold. Stay airborne at least 10 minutes longer than planned.`},
  {k:'coast', when:j=>!j.local, text:j=>`A photographer on board wants one pass along the coastline below 1,500 ft, away from the airports.`}
];
const _mrGen = genJobs;
genJobs = function(st){ const L=_mrGen(st); for(const j of L){ if(j.kind==='gen' && !j.checkout && !j.scen && Math.random()<0.35){ const o=pick(ASKS.filter(x=>x.when(j))); if(o){ j.ask={k:o.k, text:o.text(j), amt:Math.max(40, Math.round(j.pay*0.25/10)*10), alt:j._askAlt}; } } } return L; };
function askMet(job, rec){ const a=job.ask; if(!a || !rec) return null; const tr=rec.track||[]; const to=job.local?AP[job.from]:AP[job.to], fr=AP[job.from]; const p=plan(job);
  if(a.k==='climb') return (rec.maxAltFt||0) >= a.alt - 100;
  if(a.k==='hold') return (rec.airborneMinutes||0) >= Math.max(5, p.est - CLS[AC[job.ac].cls].over) + 9;
  if(a.k==='lap') return tr.filter(t=>distNm({lat:t[0],lon:t[1]},to)<5 && t[2]-(to.el||0)>900 && t[2]-(to.el||0)<2700).length >= 6;
  if(a.k==='coast') return tr.some(t=>t[2]<1500 && t[2]>300 && distNm({lat:t[0],lon:t[1]},to)>5 && distNm({lat:t[0],lon:t[1]},fr)>5);
  return null; }
/* reveal the request once you're on your way */
const _mrSim = renderSimBits;
renderSimBits = function(){ _mrSim(); try{ const a=S.st&&S.st.active; if(!a || !a.started || !a.job.ask || a.askShown || S.simState!=='live') return; const s=S.sim; if(!s||!s.motion||s.motion.onGround) return;
    const pr=ifProgress(a); if(pr.pct!=null && pr.pct<20) return; a.askShown=true; save(); takeover({kind:'orders', kicker:`Request from the cabin · +${money(a.job.ask.amt)}`, title:'Can you do something for us?', text:a.job.ask.text, sub:'Checked automatically from MSFS when you land. Optional.', ms:9000}); S.keepScroll=true; render(); }catch(_){} };
const _mrIf = inflightView;
inflightView = function(){ const h=_mrIf(); const a=S.st&&S.st.active; if(!a || !a.job.ask || !a.askShown) return h; return h.replace(/(<section class="if-head">[\s\S]*?<\/section>)/, m=>m+`<section class="notice ask-note"><b>Cabin request (+${money(a.job.ask.amt)}):</b> ${esc(a.job.ask.text)}</section>`); };

/* ---- 5. diversions for a good reason are paid fairly ---- */
const _mrApply = applyResult;
applyResult = function(st, job, f, res){ const r=_mrApply(st, job, f, res); try{ const o=st.last&&st.last.out; if(!o) return r; const rec=S.sim&&S.sim.recorder;
    // cabin request
    if(job.ask && !res.crash){ const met=askMet(job, rec); if(met===true){ txn(st, job.ask.amt, 'Tips & bonuses', 'Cabin request'); o.pay+=job.ask.amt; o.notes.push(`Cabin request done: +${money(job.ask.amt)}. The passengers noticed.`); } else if(met===false) o.notes.push(`Cabin request not done this time. No harm done.`); }
    // fair diversion
    const landed=f.landedAt||job.to; if(!res.crash && !job.local && !job.scen && landed!==job.to && AP[landed]){ const w=(S.sim&&S.sim.ext&&S.sim.ext.weather)||null; const lowFuel = res.fuelMin!=null && res.fuelMin < plan(job).reserveMin*1.2; const badWx = w && (w.visSm<3 || w.windKt>AC[job.ac].xw+5 || w.inCloud) || job.wx.ifr;
      if(lowFuel || badWx){ const extra=Math.round(job.pay*0.35/10)*10; txn(st, extra, 'Flight pay', 'Diversion allowance'); o.pay+=extra; o.notes.push(`Good call diverting to ${landed} (${lowFuel?'fuel':'weather'}). The client pays three quarters of the fare.`); st.reputation=clamp(st.reputation+1,0,100); } } }catch(_){} return r; };

/* ---- 6. a clear "how you did" at the top of the result ---- */
function debriefSummary(L){ const {res,f,out,job}=L; const parts=(res.parts||[]).map(p=>({n:p[0], pts:p[1], max:p[2], r:p[2]?p[1]/p[2]:1}));
  const best=parts.filter(p=>p.max>0).sort((a,b)=>b.r-a.r)[0]; const worst=parts.filter(p=>p.max>0 && p.r<0.8).sort((a,b)=>a.r-b.r).slice(0,2);
  const tip = n => /landing/i.test(n) ? 'Slow the descent in the last 50 ft: a gentle flare, then hold it off.' : /touchdown point|zone/i.test(n) ? 'Pick the aiming point early and keep it fixed in the windscreen all the way down.' : /centerline/i.test(n) ? 'Small rudder corrections over the threshold, and a wing down into any crosswind.' : /fuel/i.test(n) ? 'Load fuel for the trip plus the reserve before you start.' : /block/i.test(n) ? 'Fly closer to the planned route and speeds.' : /airmanship/i.test(n) ? 'Run the checklist and keep the ride smooth for the cabin.' : /passenger|comfort/i.test(n) ? 'Gentle turns and slow descents keep the cabin happy.' : 'Fly it by the book next time.';
  return `<section class="panel how-did"><p class="label">How you did</p><div class="hd-grid">
    ${best?`<div class="hd good"><span>Best</span><b>${esc(best.n.replace(/\s*\(.*$/,''))}</b><small>${best.pts}/${best.max}</small></div>`:''}
    ${worst.map(w=>`<div class="hd work"><span>Work on</span><b>${esc(w.n.replace(/\s*\(.*$/,''))}</b><small>${esc(tip(w.n))}</small></div>`).join('') || `<div class="hd good"><span>Work on</span><b>Nothing major</b><small>Clean flight. Keep it up.</small></div>`}
  </div></section>`; }
const _mrResult = resultView;
resultView = function(){ const h=_mrResult(); const L=S.st.last; if(!L||!L.res) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  const first=main.querySelector(':scope > section'); const box=tpl(debriefSummary(L)).content.firstElementChild; if(first) first.after(box);
  const grid=main.querySelector(':scope > .grid-2'); if(grid){ const d=wrapDetails([grid], 'Full scorecard and details'); grid.parentNode ? null : null; main.appendChild(d); }
  return t.innerHTML; };

/* ---- 2. one-tap filters on the job board ---- */
const _mrFilter = filterJobs;
filterJobs = function(list){ let L=_mrFilter(list); const p=boardPrefs(); if(p.quick==='short') L=L.filter(j=>(j.est||plan(j).est)<=30); return L; };
const _mrBoard = boardView;
boardView = function(){ const h=_mrBoard(); if(S.view!=='board'||!S.st) return h; const p=boardPrefs(); const on=k=>p.quick===k||(k==='pay'&&p.sort==='pay'&&!p.quick)?'on':'';
  const bar=`<div class="quick-f"><button class="${!p.quick&&p.sort!=='pay'?'on':''}" data-act="qf" data-v="all">All</button><button class="${on('short')}" data-act="qf" data-v="short">Under 30 min</button><button class="${on('pay')}" data-act="qf" data-v="pay">Best pay</button><button data-act="nav" data-v="story">Story</button></div>`;
  return h.replace(/(<h2>Jobs at [^<]*<\/h2>)/, '$1'+bar); };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="qf"]'); if(!b) return; const p=boardPrefs(); const v=b.dataset.v; if(v==='all'){ delete p.quick; p.sort='dep'; } else if(v==='short'){ p.quick='short'; p.sort='dep'; } else if(v==='pay'){ delete p.quick; p.sort='pay'; } setBoardPrefs(p); S.keepScroll=true; render(); });

/* ---- 3. first flight: the board shows only what matters ---- */
const _mrBoard2 = boardView;
boardView = function(){ const h=_mrBoard2(); const st=S.st; if(S.view!=='board' || !st || st.flights>0 || st.active) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  main.querySelectorAll('aside, .jgrid, .calm-showmore, .quick-f, .board-tools').forEach(e=>e.remove()); main.querySelectorAll('.section-title').forEach(e=>{ if(/Jobs at/.test(e.textContent)) e.remove(); });
  const note=document.createElement('section'); note.className='panel first-note'; note.innerHTML=`<p class="label">Start here</p><h3>Fly your first story chapter</h3><p class="small">Press <b>Fly this chapter</b> above. The game walks you through loading into MSFS, and the job board opens up after your first landing.</p>`;
  const camp=main.querySelector('.campaign'); if(camp) camp.after(note); return t.innerHTML; };

/* ---- 4. use the real numbers of the aircraft loaded in MSFS ---- */
function adoptSpec(){ const s=S.sim, st=S.st; if(!s || !s.spec || S.simState!=='live' || !st) return; const L=loadedAircraft(); if(!L || !L.id || !AC[L.id]) return; const id=L.id; st.acReal=st.acReal||{}; if(st.acReal[id]) return;
  const sp=s.spec, a=AC[id]; const r={}; if(sp.cruiseKt>50 && sp.cruiseKt<700 && Math.abs(sp.cruiseKt-a.cruise)/a.cruise<0.4) r.cruise=Math.round(sp.cruiseKt);
  if(sp.maxGrossLb>sp.emptyLb && sp.emptyLb>500){ const u=sp.maxGrossLb-sp.emptyLb; if(Math.abs(u-a.useful)/a.useful<0.5) r.useful=Math.round(u); }
  const cap=(sp.fuelGal||0); if(cap>5 && a.burn>0){ const dens=a.fuel==='avgas'?6:6.7; const rng=Math.round(cap*dens/a.burn*(r.cruise||a.cruise)*0.85); if(Math.abs(rng-a.range)/a.range<0.6) r.range=rng; }
  if(Object.keys(r).length){ st.acReal[id]=r; Object.assign(a, r); save(); toast(`Using your MSFS ${a.n} numbers for planning.`); } else st.acReal[id]={}; }
const _mrRender = render; render = function(){ try{ if(!S._acReal && S.st){ S._acReal=true; for(const k in (S.st.acReal||{})) if(AC[k]) Object.assign(AC[k], S.st.acReal[k]); } }catch(_){} return _mrRender.apply(this, arguments); };
const _mrSim2 = renderSimBits;
renderSimBits = function(){ _mrSim2(); try{ adoptSpec(); }catch(_){} };

/* ---- 8. every main chapter says what's at stake ---- */
const CH_GOAL = {
  CW1:['Prove to Mari you can fly her way.','Your first day at Coral Wing.'], CW2:['Get the flour to Statia before the ovens go cold.','Mari gave you the dawn runs.'],
  CW3:['Give a honeymoon couple the sunset of their lives.','The trainee is starting to get the good jobs.'], CW4:['Steal back the customers Calloway poached, fairly.','Jack Calloway, the hangar next door, wants your work.'],
  BO1:['Fly Mari to the bank, and find out why Azure wants Coral Wing.','A glossy turboprop has parked next to the faded blue hangar.'], BO2:['Get the fuel samples tested before anyone calls it a maintenance problem.','Someone put sugar in the Caravan.'],
  BO3:['Fly the inspector to Statia, and keep your head when he asks questions.','Azure is trying to make Coral Wing look unsafe.'], BO4:['Win Coral Wing its first real freight contract.','The Buyout is turning into a fight.'],
  BO5:['Beat Azure on the evaluation flight that decides five years of work.','Everything comes down to one mail run.'],
  HW1:['Fly the quiet man in the linen shirt, and don\'t ask questions.','Coral Wing survived the Buyout. Now the interesting customers find you.'], HW2:['Help a billionaire hide a reef from the world.','"L. Smith" is Lionel Hartwell, and he has a secret.'],
  HW3:['Get Hartwell out before the story breaks.','A journalist in London knows about the reef.'], HW4:['Fly Hartwell to tell the world himself.','Hartwell has decided to stop hiding.'], HW5:['Bring everyone home for the reef center\'s opening.','A year after the quiet passenger.'],
  OW1:['Hear Mari\'s offer, and decide what kind of pilot you want to be.','You\'re a Commercial pilot with a reputation now.'], MR1:['Fly Mari\'s last flight, in the airplane her father flew.','Mari is retiring.'],
  TR1:['Get Nova to Miami for the start of her first US tour.','You\'re jet-rated, and a star from home asks for you by name.'], TR2:['Get the band to Atlanta through the thunderstorms.','The tour is on.'], TR3:['Land at O\'Hare in a real crosswind.','Two cities down.'],
  TR4:['Fly into New York at night for Madison Square Garden.','The biggest show of Nova\'s life.'], TR5:['Bring Nova home over Maho Beach at sunset.','The tour is over.'],
  CO1:['Choose your company\'s first pilot.','Your own airline is real.'], CO2:['Turn down Vale\'s offer, or don\'t.','Preston Vale has one more play.'], CO3:['Hear Mari\'s announcement in the air over Maho Beach.','The last chapter.']
};
const _mrHero = chapterHero;
chapterHero = function(job){ const h=_mrHero(job); const g=CH_GOAL[job.story]; if(!g) return h; return h.replace('</h1>', `</h1><div class="ch-goal"><p class="ch-prev"><span>Previously</span> ${esc(g[1])}</p><p class="ch-obj"><span>Your goal</span> ${esc(g[0])}</p></div>`); };

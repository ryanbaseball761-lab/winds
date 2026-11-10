/* ===================== MORE: in-flight requests, quick filters, first flight, real aircraft numbers, fair diversions, clear debrief, story goals ===================== */

/* ---- 1. requests during the flight, checked from MSFS ---- */
const ASKS = [
  {k:'lap', when:j=>!j.local, text:j=>`A passenger asks for one lap around ${AP[j.to].isl} before you land. Circle the destination at 1,000–2,500 ft.`},
  {k:'climb', when:j=>!j.local, text:j=>{ const alt=['ga','stol','amph','hp','bush'].includes(AC[j.ac].cls)?6500:12500; j._askAlt=alt; return `The cabin is getting bounced around. Climb to at least ${alt.toLocaleString()} ft to find smoother air.`; }},
  {k:'hold', when:j=>true, text:j=>`Traffic at the destination: you've been asked to hold. Stay airborne at least 10 minutes longer than planned.`},
  {k:'coast', when:j=>!j.local, text:j=>`A photographer on board wants one pass along the coastline below 1,500 ft, away from the airports.`}
];
function askMet(job, rec){ const a=job.ask; if(!a || !rec) return null; const tr=rec.track||[]; const to=job.local?AP[job.from]:AP[job.to], fr=AP[job.from]; const p=plan(job);
  if(a.k==='climb') return (rec.maxAltFt||0) >= a.alt - 100;
  if(a.k==='hold') return (rec.airborneMinutes||0) >= Math.max(5, p.est - CLS[AC[job.ac].cls].over) + 9;
  if(a.k==='lap') return tr.filter(t=>distNm({lat:t[0],lon:t[1]},to)<5 && t[2]-(to.el||0)>900 && t[2]-(to.el||0)<2700).length >= 6;
  if(a.k==='coast') return tr.some(t=>t[2]<1500 && t[2]>300 && distNm({lat:t[0],lon:t[1]},to)>5 && distNm({lat:t[0],lon:t[1]},fr)>5);
  return null; }
/* reveal the request once you're on your way */
const _mrIf = inflightView;
inflightView = function(){ const h=_mrIf(); const a=S.st&&S.st.active; if(!a || !a.job.ask || !a.askShown) return h; return h.replace(/(<section class="if-head">[\s\S]*?<\/section>)/, m=>m+`<section class="notice ask-note"><b>Cabin request (+${money(a.job.ask.amt)}):</b> ${esc(a.job.ask.text)}</section>`); };

/* ---- 5. diversions for a good reason are paid fairly ---- */

/* ---- 6. a clear "how you did" at the top of the result ---- */
function debriefSummary(L){ const {res,f,out,job}=L; const parts=(res.parts||[]).map(p=>({n:p[0], pts:p[1], max:p[2], r:p[2]?p[1]/p[2]:1}));
  const best=parts.filter(p=>p.max>0).sort((a,b)=>b.r-a.r)[0]; const worst=parts.filter(p=>p.max>0 && p.r<0.8).sort((a,b)=>a.r-b.r).slice(0,2);
  const tip = n => /landing/i.test(n) ? 'Slow the descent in the last 50 ft: a gentle flare, then hold it off.' : /touchdown point|zone/i.test(n) ? 'Pick the aiming point early and keep it fixed in the windscreen all the way down.' : /centerline/i.test(n) ? 'Small rudder corrections over the threshold, and a wing down into any crosswind.' : /fuel/i.test(n) ? 'Load fuel for the trip plus the reserve before you start.' : /block/i.test(n) ? 'Fly closer to the planned route and speeds.' : /airmanship/i.test(n) ? 'Run the checklist and keep the ride smooth for the cabin.' : /passenger|comfort/i.test(n) ? 'Gentle turns and slow descents keep the cabin happy.' : 'Fly it by the book next time.';
  return `<section class="panel how-did"><p class="label">How you did</p><div class="hd-grid">
    ${best?`<div class="hd good"><span>Best</span><b>${esc(best.n.replace(/\s*\(.*$/,''))}</b><small>${best.pts}/${best.max}</small></div>`:''}
    ${worst.map(w=>`<div class="hd work"><span>Work on</span><b>${esc(w.n.replace(/\s*\(.*$/,''))}</b><small>${esc(tip(w.n))}</small></div>`).join('') || `<div class="hd good"><span>Work on</span><b>Nothing major</b><small>Clean flight. Keep it up.</small></div>`}
  </div></section>`; }

/* ---- 2. one-tap filters on the job board ---- */
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

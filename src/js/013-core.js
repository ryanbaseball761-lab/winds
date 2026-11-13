/* ===================== APP SHELL (sidebar + top bar) & LIVE CABIN ===================== */
const VIEW_META = {
  board:['Job board','Today\'s flying, story missions and dispatch'],
  map:['Map','Every airport in your world'],
  flight:['Flight','Briefing, live tracking and debrief'],
  cockpit:['Cockpit','Phase-by-phase companion for your second screen'],
  pilot:['Pilot','License, ratings and checkrides'],
  story:['Story','Your storylines, chapter by chapter'],
  log:['Logbook','Every flight you\'ve flown'],
  money:['Money','Cash, credit and the ledger'],
  company:['Airline','Your own airline: aircraft, crews and routes'],
  hangar:['Hangar','Aircraft you own in MSFS and the sim connection']
};
const NAV_GROUP_NAMES = ['Fly','Career','Business'];
function initials(n){ return n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('') || 'P'; }
/* sim status text lives in the sidebar now */
/* keep the mobile rail scrolled to the active tab */
(function(){ const app=document.getElementById('app'); if(!app || !window.MutationObserver) return;
  new MutationObserver(()=>{ const t=app.querySelector('.mrail .tab[aria-current="page"]'); const rail=t&&t.parentElement; if(!rail || rail.scrollWidth<=rail.clientWidth) return; rail.scrollLeft=Math.max(0, t.offsetLeft-(rail.clientWidth-t.offsetWidth)/2); }).observe(app,{childList:true});
})();

/* ---------- Live cabin & radio: characters react to what you actually do in MSFS ---------- */

/* passenger comfort: jolts, steep dives and the touchdown cost comfort; a butter landing earns some back.
   (The passenger and ATC chatter that used to come with this was retired: the cabin stays quiet.) */
function cabinTick(){
  const st=S.st; const a=st && st.active; const s=S.sim; if(!simRelevant(a) || !s.motion) return;
  const rec = simRecFor(a); if(!rec) return;
  const job=a.job; a.cab = a.cab || {f:{}, log:[], comfort:100, cd:0};
  const C=a.cab, now=Date.now(); const air = rec.takeoff && !rec.touchdown && !s.motion.onGround;
  if(air && (s.motion.gForce>1.35 || s.motion.gForce<0.65) && now-C.cd>15000){ C.cd=now; C.comfort=Math.max(0,C.comfort-8); }
  if(air && s.motion.vsFpm < -1800 && now-C.cd>15000){ C.cd=now; C.comfort=Math.max(0,C.comfort-5); }
  if(rec.touchdown && !C.f.td){ C.f.td=now; const fpm=rec.touchdown.fpm; C.comfort=Math.max(0, C.comfort-(fpm<200?0:fpm<350?6:20)); if(fpm<100) C.comfort=Math.min(100,C.comfort+5); }
  C.log=C.log.filter(m=>m.kind && !ATC_WHO.test(m.who||''));
  job.comfort = Math.round(C.comfort);
  try{ save(); }catch(e){}
}

function cabinBlock(){ return S.st && S.st.active ? `<section class="panel stack cabin-host">${cabinInner()}</section>` : ''; }
/* comfort pays */

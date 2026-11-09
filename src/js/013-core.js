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
  company:['Company','Your own airline'],
  hangar:['Hangar','Aircraft you own in MSFS and the sim connection']
};
const NAV_GROUP_NAMES = ['Fly','Career','Business'];
function initials(n){ return n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('') || 'P'; }
function band(){
  const st=S.st; const r=topRating(st); const rk=rankOf(st);
  const emp = st.company ? esc(st.company.name) : 'Coral Wing Air';
  const avail = storyAvailable(st).length;
  const rides = RATING_ORDER.filter(x=>x!=='CO' && checkrideReady(st,x).ok).length;
  const badge = v => v==='flight' && st.active ? `<span class="nb live" aria-label="flight booked">1</span>` : v==='story' && avail ? `<span class="nb" aria-label="${avail} chapters available">${avail}</span>` : v==='pilot' && rides ? `<span class="nb" aria-label="${rides} checkrides ready">${rides}</span>` : '';
  const label = Object.fromEntries(VIEWS);
  const item = (k, cls) => `<button class="${cls}" data-act="nav" data-v="${k}" ${S.view===k?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${NAV_ICON[k]||''}</svg><span class="lbl">${label[k]}</span>${badge(k)}</button>`;
  const meta = VIEW_META[S.view] || [label[S.view]||'',''];
  const live = S.simState==='live';
  return `<aside class="side" aria-label="Main menu">
    <div class="side-brand">${LOGO}<div><b>Trade Winds</b><span>Caribbean career for MSFS</span></div></div>
    <div class="side-pilot">
      <div class="pav">${esc(initials(st.pilot.name))}</div>
      <div style="min-width:0"><b>${esc(st.pilot.name)}</b><span>${esc(rk.name)} · ${emp}</span>
        <div class="xp" title="${rk.next?`Next rank: ${rk.next} at ${rk.nextH} h`:'Top rank'}"><i style="width:${rk.pct.toFixed(0)}%"></i></div>
        <small>${fmtH(st.minutes)} logged${rk.next?` · ${esc(rk.next)} at ${rk.nextH} h`:''}</small></div>
    </div>
    <nav class="side-nav">${NAV_GROUPS.map((g,i)=>`<p class="side-g">${NAV_GROUP_NAMES[i]}</p>${g.filter(k=>label[k]).map(k=>item(k,'snav')).join('')}`).join('')}</nav>
    <div class="side-foot"><span class="simdot ${live?'on':''}"></span><span id="sim-band">${live?'MSFS live':'Sim not connected'}</span><span class="sep">·</span><span id="sync">${syncText()}</span></div>
  </aside>
  <header class="topbar">
    <div class="tb-in">
      <div class="tb-title"><div class="tb-brand">${LOGO}<b>Trade Winds</b></div><h1>${esc(meta[0])}</h1><p>${esc(meta[1])}</p></div>
      <div class="hud">
        <span class="hp"><small>At</small><b class="mono">${esc(st.loc)}</b></span>
        <span class="hp"><small>Day ${st.day}</small><b class="mono">${dateTxt(st.day)} ${hhmm(st.clock)}</b></span>
        <span class="hp cash"><small>Cash</small><b class="mono">${money(st.cash)}</b></span>
        <span class="hp hide-s"><small>License</small><b class="mono">${r.code}</b></span>
        ${st.active?`<button class="hp go" data-act="nav" data-v="flight"><small>Booked</small><b class="mono">${esc(st.active.job.from)}→${esc(st.active.job.local?st.active.job.from:st.active.job.to)}</b></button>`:''}
      </div>
    </div>
    <nav class="mrail" aria-label="Sections">${NAV_GROUPS.map(g=>g.filter(k=>label[k]).map(k=>item(k,'tab')).join('')).join('<span class="tab-sep" aria-hidden="true"></span>')}</nav>
  </header>`;
}
/* sim status text lives in the sidebar now */
const _shellRenderSim = renderSimBits;
renderSimBits = function(){
  _shellRenderSim();
  const b=document.getElementById('sim-band'); if(b) b.textContent = S.simState==='live' ? 'MSFS live' : 'Sim not connected';
  const d=document.querySelector('.simdot'); if(d) d.classList.toggle('on', S.simState==='live');
  try{ cabinTick(); }catch(e){}
  document.querySelectorAll('.cabin-host').forEach(el=>{ el.innerHTML = cabinInner(); });
};
/* keep the mobile rail scrolled to the active tab */
(function(){ const app=document.getElementById('app'); if(!app || !window.MutationObserver) return;
  new MutationObserver(()=>{ const t=app.querySelector('.mrail .tab[aria-current="page"]'); const rail=t&&t.parentElement; if(!rail || rail.scrollWidth<=rail.clientWidth) return; rail.scrollLeft=Math.max(0, t.offsetLeft-(rail.clientWidth-t.offsetWidth)/2); }).observe(app,{childList:true});
})();

/* ---------- Live cabin & radio: characters react to what you actually do in MSFS ---------- */
const CABIN_LINES = {
  takeoff:[`"Here we go!" Someone in row 2 grips the armrest, then laughs at themselves.`,`A passenger presses their nose to the window as the island drops away.`,`"Is it always this quick?" asks the passenger in the back. "I barely felt that."`],
  cruise:[`The cabin settles down. Someone opens a bag of plantain chips.`,`"Can we see Saba from here?" a passenger asks, pointing at a dark shape on the horizon.`,`Quiet in the back. Somebody has fallen asleep, mouth open.`],
  bump:[`The airplane drops and a phone hits the floor. "Was that us?"`,`"Whoa!" A water bottle rolls down the aisle. Nervous laughter.`,`Somebody yelps. You hear the unmistakable crinkle of a sick bag being opened.`],
  dive:[`"My ears!" Two passengers are pinching their noses and blowing.`,`The descent feels steep from the back. Someone asks if everything is okay.`],
  near:[`"Is that {isl}? It's beautiful." Phones come out all over the cabin.`,`The water below turns turquoise. A passenger starts filming out the window.`],
  tdB:[`Silence, then: "Wait, are we down already?" A round of applause from the cabin.`,`That one was butter. Someone in the back actually says "Bravo."`],
  tdS:[`A soft, smooth arrival. A passenger gives you a thumbs-up through the cockpit gap.`,`Nice landing. The cabin barely notices.`],
  tdF:[`A firm thump. "Well, we're definitely down," someone says.`,`A solid arrival. A coffee cup rattles but survives.`],
  tdH:[`BANG. Overhead bins rattle and somebody swears in three languages.`,`A hard landing. The cabin goes very quiet.`],
  cargoTo:[`Dez on the radio: "Wheels up. Don't break my eggs." Even when there are no eggs.`,`Dispatch: "Copy your departure. Cargo's insured, but fly like it isn't."`],
  cargoTd:[`Dispatch: "Nice arrival. Ground crew is heading out to unload."`,`Dez: "Cargo's in one piece? Good. Mari wants pictures."`]
};

function cabinTick(){
  const st=S.st; const a=st && st.active; const s=S.sim; if(!a || !s || S.simState!=='live' || !s.motion) return;
  const rec = simRecFor(a); if(!rec) return;
  const job=a.job; a.cab = a.cab || {f:{}, log:[], comfort:100, cd:0};
  const C=a.cab, now=Date.now(); const pax = job.pax>0;
  const host = job.chars && job.chars[0] && CAST[job.chars[0]] ? CAST[job.chars[0]].n.replace(/".*?"\s*/,'').split(' ')[0] : (job.client||'').split(' ')[0];
  const say = (key, who, text) => { if(C.f[key]) return; C.f[key]=now; C.log.unshift({t:now, who, text}); C.log=C.log.slice(0,12); if(S.view!=='flight' && S.view!=='cockpit') toast(`${who}: ${text.replace(/<[^>]+>/g,'')}`.slice(0,140)); };
  const air = rec.takeoff && !rec.touchdown && !s.motion.onGround;
  if(rec.blockOut) say('out','Ground',`${flightNo(job)}, taxi approved. Have a good flight.`);
  if(rec.takeoff) say('to', pax?'Cabin':'Radio', cabinPick(pax?'takeoff':'cargoTo', job));
  if(air && s.position.aglFt>1500 && Math.abs(s.motion.vsFpm)<300) say('cruise', pax?'Cabin':'Radio', pax?cabinPick('cruise',job):`ATC: "${flightNo(job)}, radar contact. Proceed on course."`);
  if(air && (s.motion.gForce>1.35 || s.motion.gForce<0.65) && now-C.cd>15000){ C.cd=now; C.comfort=Math.max(0,C.comfort-8); if(pax){ if(!C.f.bump) say('bump','Cabin',cabinPick('bump',job)); else if(!C.f.bump2) say('bump2','Cabin',`Another jolt. ${host?host+' is':'Everyone is'} gripping the seat now.`); } }
  if(air && s.motion.vsFpm < -1800 && now-C.cd>15000){ C.cd=now; C.comfort=Math.max(0,C.comfort-5); if(pax) say('dive','Cabin',cabinPick('dive',job)); }
  if(air && !job.local && AP[job.to] && s.position){ const d=distNm({lat:s.position.lat,lon:s.position.lon},AP[job.to]); const tot=distNm(AP[job.from],AP[job.to]); if(d<Math.min(12, tot*0.45)) say('near', pax?'Cabin':'Radio', pax?cabinPick('near',job):`Approach: "${flightNo(job)}, ${job.to} in sight? Cleared visual approach."`); }
  if(rec.touchdown && !C.f.td){ const fpm=rec.touchdown.fpm; const k=fpm<100?'tdB':fpm<200?'tdS':fpm<350?'tdF':'tdH'; C.comfort=Math.max(0, C.comfort-({tdB:0,tdS:0,tdF:6,tdH:20}[k])); if(fpm<100) C.comfort=Math.min(100,C.comfort+5); say('td', pax?'Cabin':'Radio', pax?cabinPick(k,job):cabinPick('cargoTd',job)); say('td2','Recorder',`Touchdown at ${fpm} fpm, ${rec.touchdown.g} G.`); }
  if(rec.blockIn) say('in', host||'Ground', host ? `${host} unbuckles and smiles. "Thanks for the ride. Same time next week?"` : `Parked. Shut down when you're ready.`);
  job.comfort = Math.round(C.comfort);
  try{ save(); }catch(e){}
}

function cabinBlock(){ return S.st && S.st.active ? `<section class="panel stack cabin-host">${cabinInner()}</section>` : ''; }
const _shellCockpit = cockpitView;
cockpitView = function(){ const h=_shellCockpit(); return h.replace(/<\/main>\s*$/, cabinBlock()+'</main>'); };
const _shellFlight = flightView;
flightView = function(){ const h=_shellFlight(); if(!S.st.active || S.debrief) return h; return h.replace('<section class="panel stack" id="simpanel">', cabinBlock()+'<section class="panel stack" id="simpanel">'); };
/* comfort pays */
const _shellAfter = afterFlight;
afterFlight = function(st, job, f, res, out){
  const r = _shellAfter(st, job, f, res, out);
  if(job.pax && typeof job.comfort==='number' && !res.crash){
    out.notes.push(`Passenger comfort: ${job.comfort}/100.`);
    if(job.comfort>=90 && !job.company){ const tip=Math.max(20, Math.round(job.pay*0.08/10)*10); txn(st, tip, 'Tips & bonuses', 'Comfort bonus'); out.pay += tip; out.notes.push(`The passengers loved the ride: ${money(tip)} comfort bonus.`); }
    else if(job.comfort<50){ st.reputation = clamp(st.reputation-2,0,100); out.notes.push(`A rough ride. Word gets around: reputation −2.`); }
  }
  return r;
};

/* ===================== IN-FLIGHT SCREEN (after Start flight) ===================== */
function flightPhase(a){
  const s=S.sim; const rec = simRecFor(a); const live = S.simState==='live' && s && s.motion;
  if(!live) return {k:'manual', n:'Flying', d:'MSFS not connected. Fly it, then log the landing.'};
  const m=s.motion, p=s.position||{}; const ph = rec ? rec.phase : 'waiting';
  if(ph==='in') return {k:'in', n:'Parked', d:'Logging your flight…'};
  if(ph==='landed' || ph==='taxi-in') return {k:'taxiin', n:'Landed', d:'Taxi to parking and shut down (or set the parking brake).'};
  if(m.onGround) return ph==='taxi-out' ? {k:'taxi', n:'Taxi', d:'Taxi to the runway. Keep it under 15 knots.'} : {k:'pre', n:'Preflight', d:'Engine start, then taxi when ready.'};
  const job=a.job; const dest=job.local?AP[job.from]:AP[job.to]; const togo=distNm({lat:p.lat,lon:p.lon},dest);
  if(togo<8 && p.aglFt<2500) return {k:'final', n:'Approach', d:'Stable by 500 ft: on speed, on glidepath, configured.'};
  if(m.vsFpm>400) return {k:'climb', n:'Climb', d:'Climb to cruise. Watch temperatures and traffic.'};
  if(m.vsFpm<-400) return {k:'descent', n:'Descent', d:'Plan to be slow and configured early.'};
  return {k:'cruise', n:'Cruise', d:'Trim, lean, and enjoy the view.'};
}
function ifProgress(a){
  const s=S.sim, job=a.job; const from=AP[job.from], to=job.local?AP[job.from]:AP[job.to]; const total = job.local ? (job.tourNm||40) : distNm(from,to);
  if(!(S.simState==='live' && s && s.position)) return {pct: null, togo: total, total};
  const togo = job.local ? null : distNm({lat:s.position.lat,lon:s.position.lon}, to);
  return {pct: togo==null?null:Math.max(0,Math.min(100,(1-togo/Math.max(total,1))*100)), togo, total};
}
function ifLiveHTMLBase(){
  const st=S.st, a=st&&st.active; if(!a) return '';
  const s=S.sim, live = S.simState==='live' && s && s.motion; const ph=flightPhase(a); const pr=ifProgress(a);
  const tile=(lbl,val,unit,cls='')=>`<div class="if-tile ${cls}"><span>${lbl}</span><b class="mono">${val}</b><small>${unit}</small></div>`;
  const eta = live && !s.motion.onGround && pr.togo!=null ? Math.round(pr.togo/Math.max(s.motion.gs,1)*60) : null;
  const tiles = live ? [
    /* route, distance, ETA, altitude, ground speed and fuel are on the flight display above; these are the flying numbers */
    tile('Airspeed', Math.round(s.motion.ias||0), 'knots'),
    tile('Vertical speed', (s.motion.vsFpm>0?'+':'')+Math.round(s.motion.vsFpm||0), 'fpm', s.motion.vsFpm<-1000?'warn':''), tile('Heading', String(Math.round(s.position.hdg!=null?s.position.hdg:(s.motion.hdg||0))).padStart(3,'0')+'°', 'true')
  ].join('') : `<p class="small muted" style="grid-column:1/-1">Connect MSFS to see live instruments, your position and an ETA here.</p>`;
  return `<div class="if-phase"><span class="if-ph-dot ${ph.k}"></span><div><b>${esc(ph.n)}</b><span>${esc(ph.d)}</span></div></div>
    <div class="if-tiles">${tiles}</div>`;
}
function ifMiniMap(a){
  const job=a.job; const A=AP[job.from], B=job.local?AP[job.from]:AP[job.to]; const s=S.sim; const P=(S.simState==='live'&&s&&s.position)?{lat:s.position.lat,lon:s.position.lon}:null;
  const pts=[A,B].concat(P?[P]:[]); let la0=Math.min(...pts.map(p=>p.lat)), la1=Math.max(...pts.map(p=>p.lat)), lo0=Math.min(...pts.map(p=>p.lon)), lo1=Math.max(...pts.map(p=>p.lon));
  const pad=Math.max(0.15,(la1-la0)*0.25,(lo1-lo0)*0.25); la0-=pad; la1+=pad; lo0-=pad; lo1+=pad; const W=400,H=260; const k=Math.cos((la0+la1)/2*Math.PI/180); const sc=Math.min(W/((lo1-lo0)*k), H/(la1-la0));
  const X=lo=>(W-(lo1-lo0)*k*sc)/2+(lo-lo0)*k*sc, Y=la=>H-((H-(la1-la0)*sc)/2+(la-la0)*sc);
  const near = Object.keys(AP).filter(c=>!AP[c].water && AP[c].lat>la0 && AP[c].lat<la1 && AP[c].lon>lo0 && AP[c].lon<lo1).slice(0,30);
  const rec=simRecFor(a); const tr=rec&&rec.track||[];
  return `<svg viewBox="0 0 ${W} ${H}" class="if-map" aria-label="Route map">${near.map(c=>`<circle cx="${X(AP[c].lon).toFixed(1)}" cy="${Y(AP[c].lat).toFixed(1)}" r="3" class="nap"/><text x="${(X(AP[c].lon)+5).toFixed(1)}" y="${(Y(AP[c].lat)-4).toFixed(1)}" class="napl">${c}</text>`).join('')}
    <line x1="${X(A.lon)}" y1="${Y(A.lat)}" x2="${X(B.lon)}" y2="${Y(B.lat)}" class="if-rt"/>${tr.length>1?`<polyline points="${tr.map(p=>`${X(p[1]).toFixed(1)},${Y(p[0]).toFixed(1)}`).join(' ')}" class="flown"/>`:''}
    <circle cx="${X(A.lon)}" cy="${Y(A.lat)}" r="6" class="r-start"/><circle cx="${X(B.lon)}" cy="${Y(B.lat)}" r="6" class="r-end"/>
    ${P?`<g transform="translate(${X(P.lon).toFixed(1)} ${Y(P.lat).toFixed(1)}) rotate(${s.position.hdg||0})" class="liveplane"><circle r="14" class="halo"/><path d="M0 -12 L3 -3 L12 2 L12 4 L3 2 L2 9 L5 11 L5 12 L0 11 L-5 12 L-5 11 L-2 9 L-3 2 L-12 4 L-12 2 L-3 -3Z"/></g>`:''}</svg>`;
}
/* the checklist moves on by itself as the flight does (start, taxi, takeoff, then the approach list in cruise);
   it never goes backwards, and a tab you pick yourself stays until the next phase of flight */
const CK_FOR = { pre:/before|start|preflight/i, taxi:/taxi|start/i, climb:/takeoff|climb/i, cruise:/approach|descent|cruise/i, descent:/approach|descent/i, final:/landing|approach/i, taxiin:/landing|after|shut/i };
function ckFollowPhase(a, ph){ try{ const f=flightPhase(a); if(!CK_FOR[f.k] || a.ck.lastK===f.k) return; a.ck.lastK=f.k;
  const i=ph.findIndex((x,j)=>j>=(a.ck.p||0) && CK_FOR[f.k].test(x.n)); if(i>=0) a.ck.p=i; }catch(_){} }
function ifChecklistHTML(a){
  const ph=cockpitPhases(S.st, a.job); a.ck=a.ck||{p:0,done:{}}; ckFollowPhase(a, ph); const cur=clamp(a.ck.p,0,ph.length-1); const P=ph[cur];
  return `<div class="row between"><h3>Checklist · ${esc(P.n)}</h3><span class="mono small muted">${P.items.filter((_,i)=>a.ck.done[cur+'-'+i]).length}/${P.items.length}</span></div>
    <div class="if-phases">${ph.map((x,i)=>`<button class="${i===cur?'on':''}" data-act="ck-phase" data-i="${i}">${x.items.every((_,j)=>a.ck.done[i+'-'+j])?'✓ ':''}${esc(x.n)}</button>`).join('')}</div>
    <div class="if-ck">${P.items.map((t,i)=>{ const on=!!a.ck.done[cur+'-'+i]; return `<button class="ck ${on?'on':''}" data-act="ck-item" data-k="${cur}-${i}" aria-pressed="${on}"><span class="box">${on?'✓':''}</span><span>${esc(t)}</span></button>`; }).join('')}</div>`;
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="if-brief"],[data-act="if-back"]'); if(!b) return;
  S.ifBrief = b.dataset.act==='if-brief'; render(); window.scrollTo(0,0);
});
/* going to the in-flight screen the moment you start */
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="start"]')){ S.ifBrief=false; setTimeout(()=>{ if(S.st && S.st.active && S.st.active.started){ S.view='flight'; render(); window.scrollTo(0,0); } },0); } });
/* live refresh without disturbing the checklist */
setInterval(()=>{ const t=document.getElementById('if-timer'); if(t) t.textContent = durTxt(Math.round((Date.now()-Number(t.dataset.start))/60000)); }, 15000);

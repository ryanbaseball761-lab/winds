/* ===================== SIM SYNC: briefing weather and clock follow MSFS ===================== */
function simWx(base){ const x=S.sim&&S.sim.ext; if(!x || S.simState!=='live') return null; const w=x.weather; if(!w) return null;
  const vis = Math.min(10, w.visSm||10); const ifr = vis < 3 || (w.inCloud && vis<5); const cat = vis<1?'LIFR':vis<3?'IFR':vis<5?'MVFR':'VFR';
  const cl = w.inCloud ? [['BKN',1500],['OVC',4000]] : (base && base.cl) || [['FEW',2500]];
  return Object.assign({}, base||{}, { key:'live', n:'Live MSFS weather', cat, ifr, desc:`Taken from your MSFS session at the departure airport.`, dir: w.windKt<3?0:(Math.round(w.windDir/10)*10)%360||360, spd:w.windKt, gust:0, vis, cl, t:w.oatC, td:w.oatC-5, qnh:w.qnhHpa, live:true, wx: vis<3?'BR':'' }); }
function simMinutes(){ const t=S.sim&&S.sim.simLocalTime; if(!t || S.simState!=='live') return null; const [h,m]=t.split(':').map(Number); return h*60+m; }
function atDeparture(job){ const s=S.sim; if(!s||!s.position||S.simState!=='live') return false; return distNm({lat:s.position.lat,lon:s.position.lon}, AP[job.from]) < 3; }
function syncPrefs(){ const st=S.st; st.sync = st.sync || {wx:true, time:true}; return st.sync; }
/* adopt live weather automatically while parked at the departure field */
function trySyncWx(){ const a=S.st&&S.st.active; if(!a || a.started || !syncPrefs().wx) return; const job=a.job; if(job.wx&&job.wx.live) return; if(!atDeparture(job)) return;
  const w=simWx(job.wx); if(!w) return; job.wx=w; save(); toast('Briefing weather now matches MSFS.'); if(S.view==='flight') render(); }
/* show the per-item fix buttons */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="pf-usetime"],[data-act="pf-usewx"]'); if(!b || !S.st || !S.st.active) return; const job=S.st.active.job;
  if(b.dataset.act==='pf-usewx'){ const w=simWx(job.wx); if(w){ job.wx=w; toast('Briefing weather now matches MSFS.'); } }
  else { const m=simMinutes(); if(m==null) return; if(isNight(m) && !hasRating(S.st,'COMM')){ toast('Trainee pilots fly in daylight only. Set MSFS to daytime.'); return; } job.dep=Math.round(m/5)*5; if(job.dep>S.st.clock || S.st.clock-job.dep<720) S.st.clock=Math.max(S.st.clock, job.dep-5); toast(`Flight moved to ${hhmm(job.dep)} to match MSFS.`); }
  save(); render(); });
/* hangar toggles */
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="sync-wx"],[data-act="sync-time"]'); if(!b||!S.st) return; const p=syncPrefs(); p[b.dataset.act==='sync-wx'?'wx':'time']=b.checked; save(); });

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
const _syncSim = renderSimBits;
renderSimBits = function(){ _syncSim(); try{ trySyncWx(); }catch(_){} };
const _syncChecks = preflightChecks;
preflightChecks = function(job){ const out=_syncChecks(job); const m=simMinutes(); if(m==null) return out;
  const diffMin = Math.abs((((m - job.dep) % 1440) + 1440 + 720) % 1440 - 720); const ok = diffMin <= 45;
  out.splice(2,0,{k:'time', ok, t: ok?`MSFS time ${S.sim.simLocalTime} matches`:`MSFS time is ${S.sim.simLocalTime}, flight planned for ${hhmm(job.dep)}`, d: ok?'':`Set the MSFS time to ${hhmm(job.dep)}, or move this flight to the sim's time.`, act: ok?null:'pf-usetime', actLabel:'Use MSFS time'});
  const wxOk = !!(job.wx&&job.wx.live); out.push({k:'wx', ok:wxOk, t: wxOk?'Briefing uses live MSFS weather':'Briefing weather is generated', d: wxOk?'':(atDeparture(job)?'':'It switches to your MSFS weather once you\'re at the departure airport.'), act: (!wxOk && simWx())?'pf-usewx':null, actLabel:'Use MSFS weather'});
  return out; };
/* show the per-item fix buttons */
const _syncPfHTML = preflightHTML;
preflightHTML = function(job){ let h=_syncPfHTML(job); for(const c of preflightChecks(job)){ if(!c.act) continue; h=h.replace(`<b>${esc(c.t)}</b>`, `<b>${esc(c.t)}</b> <button class="btn xs" data-act="${c.act}">${esc(c.actLabel)}</button>`); } return h; };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="pf-usetime"],[data-act="pf-usewx"]'); if(!b || !S.st || !S.st.active) return; const job=S.st.active.job;
  if(b.dataset.act==='pf-usewx'){ const w=simWx(job.wx); if(w){ job.wx=w; toast('Briefing weather now matches MSFS.'); } }
  else { const m=simMinutes(); if(m==null) return; if(isNight(m) && !hasRating(S.st,'COMM')){ toast('Trainee pilots fly in daylight only. Set MSFS to daytime.'); return; } job.dep=Math.round(m/5)*5; if(job.dep>S.st.clock || S.st.clock-job.dep<720) S.st.clock=Math.max(S.st.clock, job.dep-5); toast(`Flight moved to ${hhmm(job.dep)} to match MSFS.`); }
  save(); render(); });
/* hangar toggles */
const _syncHangar = hangarView;
hangarView = function(){ const h=_syncHangar(); const p=syncPrefs();
  const sec=`<section class="panel stack"><h3>Match MSFS</h3><label class="row"><input type="checkbox" data-act="sync-wx" ${p.wx?'checked':''}> Use live MSFS weather in briefings when you're at the departure airport</label><label class="row"><input type="checkbox" data-act="sync-time" ${p.time?'checked':''}> Check that the MSFS clock matches the flight</label></section>`;
  return h.replace('<main class="wrap stack fade">','<main class="wrap stack fade">'+sec); };
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="sync-wx"],[data-act="sync-time"]'); if(!b||!S.st) return; const p=syncPrefs(); p[b.dataset.act==='sync-wx'?'wx':'time']=b.checked; save(); });
const _syncChecks2 = preflightChecks;
preflightChecks = function(job){ const out=_syncChecks2(job); return syncPrefs().time ? out : out.filter(c=>c.k!=='time'); };

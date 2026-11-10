/* ===================== DECLUTTER, ACCESSIBILITY, FLIGHT LOGS ===================== */
/* ---- tabs unlock as you need them ---- */
const TAB_UNLOCK = {
  log:     {t:st=>st.flights>=1, why:'after your first flight'},
  profile: {t:st=>st.flights>=3, why:'after 3 flights'},
  money:   {t:st=>st.flights>=3, why:'after 3 flights'},
  cup:     {t:st=>st.flights>=5, why:'after 5 flights'},
  company: {t:st=>!!st.company || hasRating(st,'COMM'), why:'with your Commercial license'}
};
function uiPrefs(){ const st=S.st; st.ui = st.ui || {}; return st.ui; }

function checkUnlocks(){ const st=S.st; if(!st) return; const ui=uiPrefs(); ui.seen = ui.seen || {}; const label=Object.fromEntries(VIEWS);
  for(const k in TAB_UNLOCK){ if(ui.seen[k]) continue; if(TAB_UNLOCK[k].t(st)){ ui.seen[k]=1; if(st.flights>0) setTimeout(()=>toast(`New tab unlocked: ${label[k]||k}`), 1200); } } }

/* ---- fewer interruptions ---- */



/* ---- accessibility: text size, motion, contrast ---- */
function applyA11y(){ const ui = S.st ? uiPrefs() : {}; const el=document.documentElement;
  el.style.setProperty('--tw-zoom', String(ui.zoom||1)); el.classList.toggle('tw-zoom', (ui.zoom||1)!==1);
  el.classList.toggle('rm', !!ui.reduceMotion); el.classList.toggle('hc', !!ui.contrast); }

/* ---- settings live in one place (Hangar) ---- */
function settingsHTML(){ const ui=uiPrefs(); const z=ui.zoom||1;
  return `<section class="panel stack" id="settings"><div class="row between"><h3>Settings</h3><span class="small muted">Saved with your career</span></div>
  <div class="set-grid">
    <div><p class="label">Text size</p><div class="diff">${[[1,'Normal'],[1.12,'Large'],[1.25,'Larger']].map(([v,l])=>`<button class="${z===v?'on':''}" data-act="ui-zoom" data-v="${v}">${l}</button>`).join('')}</div></div>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="reduceMotion" ${ui.reduceMotion?'checked':''}> Reduce motion and animations</label>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="contrast" ${ui.contrast?'checked':''}> High contrast text and outlines</label>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="quiet" ${ui.quiet?'checked':''}> Quiet mode: no urgent-job pop-ups</label>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="allTabs" ${ui.allTabs?'checked':''}> Show every tab now (skip unlocking them)</label>
  </div>
  ${window.twNative&&twNative.openFolder?`<div class="row"><button class="btn sm" data-act="open-logs">Open flight logs folder</button><span class="tiny muted">Every flight with MSFS connected is recorded here. Send one along if something looks wrong.</span></div>`:''}</section>`; }
const _dcHangar = hangarView;
hangarView = function(){ const h=_dcHangar(); return h.replace('<main class="wrap stack fade">','<main class="wrap stack fade">'+settingsHTML()); };
document.addEventListener('click', e=>{ const z=e.target.closest('[data-act="ui-zoom"]'); if(z && S.st){ uiPrefs().zoom=Number(z.dataset.v); save(); S.keepScroll=true; render(); return; }
  if(e.target.closest('[data-act="open-logs"]') && window.twNative && twNative.openFolder) twNative.openFolder('flight-logs'); });
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="ui-flag"]'); if(!b||!S.st) return; uiPrefs()[b.dataset.k]=b.checked; save(); S.keepScroll=true; render(); });

/* ---- flight data log: every MSFS sample during a flight, saved when it ends ---- */
S.trace = null;
function traceSample(){ const a=S.st&&S.st.active, s=S.sim; if(!a || !a.started || S.simState!=='live' || !s || !s.position) return;
  if(!S.trace || S.trace.id!==a.job.id) S.trace={id:a.job.id, job:{from:a.job.from,to:a.job.to,ac:a.job.ac,title:a.job.title,kind:a.job.kind,scen:a.job.scen||null}, started:Date.now(), samples:[]};
  const T=S.trace, now=Date.now(); const last=T.samples[T.samples.length-1]; if(last && now-last.t < 4000) return; if(T.samples.length>3000) return;
  const x=s.ext||{}; T.samples.push({t:now, lat:+s.position.lat.toFixed(5), lon:+s.position.lon.toFixed(5), alt:s.position.altFt, agl:s.position.aglFt, hdg:s.position.hdg, ias:s.motion.ias, gs:s.motion.gs, vs:s.motion.vsFpm, g:s.motion.gForce, gnd:s.motion.onGround?1:0, fuel:s.systems&&s.systems.fuelLb, flaps:x.flaps&&x.flaps.handle, gear:x.gear?(x.gear.down?1:0):null, bank:x.attitude&&x.attitude.bank, pitch:x.attitude&&x.attitude.pitch, rate:x.simRate, wind:x.weather?`${x.weather.windDir}/${x.weather.windKt}`:null, phase:s.recorder&&s.recorder.phase}); }
async function writeFlightLog(job, f, res){ const T=S.trace; if(!window.twNative || !twNative.flightLog) return;
  const d=new Date(); const name=`${d.toISOString().slice(0,16).replace(/[:T]/g,'-')}_${job.from}_${job.local?job.from:job.to}.json`;
  const rec = S.sim && S.sim.recorder; const body={ app: (typeof TW_VERSION!=='undefined'?TW_VERSION:''), difficulty:diff(), job:{id:job.id,title:job.title,from:job.from,to:job.to,ac:job.ac,kind:job.kind,scen:job.scen||null,dep:job.dep,est:job.est}, result:{score:res.score, grade:res.grade, parts:res.parts}, input:Object.assign({}, f, {td:f.td||null}), recorder:rec||null, samples:(T&&T.id===job.id)?T.samples:[], aircraftTitle:S.sim&&S.sim.aircraft&&S.sim.aircraft.title, errors:errLog().slice(-10) };
  try{ await twNative.flightLog(name, JSON.stringify(body)); }catch(_){} S.trace=null; }
/* ---- a calmer job board ---- */
const _dcDispatch = dispatchCard;
dispatchCard = function(st){ let h=_dcDispatch(st); const n=(st.brief&&st.brief.msgs||[]).length;
  return h.replace('<div class="msgs">', `<details class="dispatch-more"><summary class="small">Crew messages and today's tip (${n})</summary><div class="msgs">`).replace(/<\/section>\s*$/, '</details></section>'); };
const _dcWeekly = weeklyPanel;
weeklyPanel = function(st){ if(st.flights < 2 && !(st.ui&&st.ui.allTabs)) return ''; let h=_dcWeekly(st); if(st.flights < 5 && !(st.ui&&st.ui.allTabs)) h=h.replace(/<div class="league">[\s\S]*(?=<\/section>\s*$)/, ''); return h; };

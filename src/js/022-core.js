/* ===================== AUTOMATIC DEBRIEF + DIFFICULTY ===================== */
/* ---- difficulty ---- */
const DIFF = {
  casual:{n:'Casual', d:'Forgiving scoring: a hard landing counts as firm, rough rides cost less. Checklist optional.'},
  standard:{n:'Standard', d:'The full career as designed. Checklist optional.'},
  expert:{n:'Expert', d:'Mandatory checklist before every flight, real consequences, and 15% extra pay.'}
};
function diff(){ return (S.st && S.st.difficulty) || 'standard'; }
 // Preflight, Start, Taxi, Before takeoff
var checklistDone; /* defined in full below (051-core.js) */
var checklistCount; /* defined in full below (051-core.js) */
const _dfBand = band;
band = function(){
  const h=_dfBand(); const d=diff();
  const sel = `<div class="diff" role="group" aria-label="Difficulty">${Object.keys(DIFF).map(k=>`<button class="${k===d?'on':''}" data-act="diff" data-v="${k}" title="${esc(DIFF[k].d)}">${DIFF[k].n}</button>`).join('')}</div>`;
  return h.replace('<div class="hud">', `<div class="hud">${sel}`);
};
const _dfPass = boardingPass;
boardingPass = function(st, job, p, a, started, mins, ai){
  let h=_dfPass(st, job, p, a, started, mins, ai);
  if(diff()==='expert' && !started && !checklistDone(st.active)){ const [n,t]=checklistCount(st.active);
    h=h.replace('<button class="btn action" data-act="start">Start flight</button>', `<button class="btn action" data-act="nav" data-v="cockpit">Complete checklist (${n}/${t})</button><span class="chip warn">Expert: checklist required before engine start</span>`); }
  return h;
};
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="diff"]'); if(b && S.st){ S.st.difficulty=b.dataset.v; save(); toast(`${DIFF[b.dataset.v].n}: ${DIFF[b.dataset.v].d}`); S.keepScroll=true; render(); return; }
  const s=e.target.closest('[data-act="start"]'); if(s && S.st && S.st.active && diff()==='expert' && !checklistDone(S.st.active)){ e.stopImmediatePropagation(); e.preventDefault(); toast('Expert mode: finish the checklist first.'); go('cockpit'); }
}, true);
/* Expert: the block timer can't start from the checklist until earlier phases are ticked */
const _dfScore = score;
score = function(job, f){
  if(diff()==='casual' && f.landing==='hard') f = Object.assign({}, f, {landing:'firm'});
  const r=_dfScore(job, f);
  if(diff()==='expert' && S.st.active && !checklistDone(S.st.active)) { r.score=Math.max(0,r.score-10); r.grade = r.score>=90?'A':r.score>=80?'B':r.score>=70?'C':r.score>=60?'D':'F'; }
  return r;
};
const _dfAfter = afterFlight;
afterFlight = function(st, job, f, res, out){
  const r=_dfAfter(st, job, f, res, out);
  if(diff()==='expert' && !res.crash && job.kind!=='check' && !job.company){ const b=Math.round(out.pay*0.15/10)*10; if(b>0){ txn(st,b,'Tips & bonuses','Expert pay'); out.pay+=b; out.notes.push(`Expert difficulty: +${money(b)} (15%).`); } }
  if(diff()==='casual' && job.comfort!=null && job.comfort<50) st.reputation=clamp(st.reputation+2,0,100); // undo the rough-ride penalty
  return r;
};

/* ---- automatic debrief from the MSFS recorder ---- */

function autoFinish(rec, how){
  const st=S.st, a=st.active, job=a.job; if(!a || a._autoDone) return; a._autoDone=true;
  const near = nearestAirport(rec.touchdown.lat, rec.touchdown.lon);
  const landedAt = near.d < 6 ? near.code : (job.local ? job.from : job.to);
  let landing = landingClass(rec.touchdown.fpm); if(rec.bounces>1 && landing==='butter') landing='smooth'; if(rec.bounces>2 && landing==='smooth') landing='firm';
  const comfort = a.cab ? Math.round(a.cab.comfort) : null;
  const block = rec.blockMinutes || Math.max(1, Math.round((Date.now()-(a.started||a.accepted))/60000));
  const f = { landing, tdz: rec.touchdown.fpm < 400, center: rec.bounces===0, fuel: rec.fuelNowLb!=null?rec.fuelNowLb:0, fuelUnit:'lb', block, landedAt,
    checklist: diff()==='expert' ? checklistDone(a) : true, radio:true, weather:true, smooth: comfort==null || comfort>=75, scen:null, tasks:[], bonus:false, request:false,
    verified:true, td:rec.touchdown, simFpm:rec.touchdown.fpm, simBounces:rec.bounces, simG:rec.touchdown.g, comfort, auto:true };
  const res = score(job, f); applyResult(st, job, f, res); S.debrief=false; S.showResult=true; S.busy.journalDone=false; save();
  S.view='flight'; try{ history.replaceState(null,'','#flight'); }catch(_){} render(); window.scrollTo(0,0);
  toast(how==='parked' ? 'Parked. Flight logged automatically from MSFS.' : 'Flight logged from MSFS.');
}
/* finish automatically once you're parked (engine off or parking brake) */
const _dfRender = renderSimBits;
renderSimBits = function(){ _dfRender(); const a=S.st&&S.st.active; if(!a || a._autoDone) return; const rec=autoReady(a); if(rec && rec.blockIn) autoFinish(rec,'parked'); };
/* "Log the landing" skips the form when MSFS already has everything */
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="debrief"]'); if(!b || !S.st || !S.st.active) return;
  const rec=autoReady(S.st.active); if(!rec) return; e.stopImmediatePropagation(); e.preventDefault(); autoFinish(rec,'button');
}, true);
const _dfPass2 = boardingPass;
boardingPass = function(st, job, p, a, started, mins, ai){
  let h=_dfPass2(st, job, p, a, started, mins, ai);
  const live = S.simState==='live';
  if(live) h=h.replace('>Log the landing<', '>Finish flight<');
  return h;
};

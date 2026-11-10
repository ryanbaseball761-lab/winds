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

/* ---- automatic debrief from the MSFS recorder ---- */

/* finish automatically once you're parked (engine off or parking brake) */
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

/* ===================== YOUR PLANE REMEMBERS: airframe health ===================== */
function airframe(st, id){ st.airframes = st.airframes || {}; return st.airframes[id] = st.airframes[id] || {h:100, grounded:0, log:[]}; }
function isGrounded(st, id){ const a=st.airframes && st.airframes[id]; return !!(a && a.grounded && st.day < a.grounded); }
function canFly(st, id){ return canFlyBase(st, id) && !isGrounded(st, id); }
/* Dez works on the fleet overnight */
/* tired airframes sometimes misbehave */
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="accept"],[data-act="accept-story"],[data-act="call-yes"],[data-act="urg-yes"]'); if(!b) return;
  setTimeout(()=>{ const st=S.st, a=st&&st.active; if(!a || a._wearChecked) return; a._wearChecked=true; const A=st.airframes&&st.airframes[a.job.ac]; if(!A || A.h>=60 || a.job.scen || a.job.kind==='check') return;
    if(Math.random() < (60-A.h)/150){ const cls=AC[a.job.ac].cls; const pickS=['rough_engine','electrical','bird_strike'].filter(k=>SCEN[k] && (SCEN[k].cls==='*' || SCEN[k].cls.includes(cls))); if(pickS.length){ a.job.scen=pick(pickS); a.job.tiredAirframe=true; save(); render(); toast(`Heads up: this ${AC[a.job.ac].n} is at ${A.h}% health. Expect sealed orders.`); } } },50);
});
function healthBar(h){ return `<div class="meter ${h<50?'bad':h<75?'warn':''}" title="Airframe health ${h}%"><i style="width:${h}%"></i></div>`; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="rush-repair"]'); if(!b || !S.st) return; const A=airframe(S.st,b.dataset.id); const cost=Math.round((100-A.h)*22/10)*10; if(S.st.cash<cost) return; txn(S.st,-cost,'Maintenance',`Rush repair: ${AC[b.dataset.id].n}`); A.h=100; A.grounded=0; save(); toast(`${AC[b.dataset.id].n} repaired. Dez stayed late.`); S.keepScroll=true; render(); });

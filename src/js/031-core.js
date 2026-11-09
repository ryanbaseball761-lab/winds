/* ===================== YOUR PLANE REMEMBERS: airframe health ===================== */
function airframe(st, id){ st.airframes = st.airframes || {}; return st.airframes[id] = st.airframes[id] || {h:100, grounded:0, log:[]}; }
function isGrounded(st, id){ const a=st.airframes && st.airframes[id]; return !!(a && a.grounded && st.day < a.grounded); }
const _wCanFly = canFly;
canFly = function(st, id){ return _wCanFly(st, id) && !isGrounded(st, id); };
const _wStoryAc = storyAircraft;
storyAircraft = function(st, m){ return _wStoryAc(st, m).filter(k=>!isGrounded(st,k)); };
const _wAfter = afterFlight;
afterFlight = function(st, job, f, res, out){
  const r=_wAfter(st, job, f, res, out); if(job.company) return r;
  const A=airframe(st, job.ac); const t=(job._cab&&job._cab.tally)||{}; const why=[];
  let dmg = 1;
  if(res.crash){ dmg+=60; why.push('accident'); }
  else if(f.landing==='hard'){ dmg+=12; why.push('hard landing'); } else if(f.landing==='firm'){ dmg+=3; }
  if(f.simBounces>1){ dmg+=3*(f.simBounces-1); why.push('bounced landing'); }
  if(f.simG && f.simG>1.8){ dmg+=8; why.push(`${f.simG} G touchdown`); }
  if(t.flapOver){ dmg+=8*t.flapOver; why.push('flap overspeed'); } if(t.flapDmg){ dmg+=20; why.push('flap damage'); }
  if(t.overspeed){ dmg+=6*t.overspeed; why.push('overspeed'); } if(t.gearOver){ dmg+=8; why.push('gear overspeed'); }
  if(f.landing==='butter' && !res.crash) dmg=Math.max(0,dmg-1);
  A.h = Math.max(0, A.h - dmg); A.log.unshift({day:st.day, d:dmg, why:why.join(', ')||'normal wear'}); A.log=A.log.slice(0,10);
  if(dmg>=10 && !job.lend){ const cost=Math.round(dmg*18/10)*10; txn(st,-cost,'Accidents & fines',`Damage deductible: ${AC[job.ac].n}`); out.costs=(out.costs||0)+cost; out.notes.push(`Dez inspected the ${AC[job.ac].n}: ${why.join(', ')}. Your damage deductible is ${money(cost)}.`); }
  out.notes.push(`${AC[job.ac].n} airframe health: ${A.h}%${dmg>1?` (−${dmg})`:''}.`);
  if(A.h < 40){ A.grounded = st.day + (A.h<20?3:2); out.notes.push(`It's grounded for repairs until day ${A.grounded}. Dez is not happy.`); addJournal(st, `${AC[job.ac].n} grounded`, `Dez takes one look and reaches for his toolbox. "This one sits until I say so."`, ['dez'], 'flight'); }
  return r;
};
/* Dez works on the fleet overnight */
const _wRest = rest;
rest = function(st){ const r=_wRest(st); for(const id in (st.airframes||{})){ const A=st.airframes[id]; A.h=Math.min(100, A.h + (isGrounded(st,id)?18:6)); if(A.grounded && st.day>=A.grounded && A.h>=40) A.grounded=0; } return r; };
/* tired airframes sometimes misbehave */
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="accept"],[data-act="accept-story"],[data-act="call-yes"],[data-act="urg-yes"]'); if(!b) return;
  setTimeout(()=>{ const st=S.st, a=st&&st.active; if(!a || a._wearChecked) return; a._wearChecked=true; const A=st.airframes&&st.airframes[a.job.ac]; if(!A || A.h>=60 || a.job.scen || a.job.kind==='check') return;
    if(Math.random() < (60-A.h)/150){ const cls=AC[a.job.ac].cls; const pickS=['rough_engine','electrical','bird_strike'].filter(k=>SCEN[k] && (SCEN[k].cls==='*' || SCEN[k].cls.includes(cls))); if(pickS.length){ a.job.scen=pick(pickS); a.job.tiredAirframe=true; save(); render(); toast(`Heads up: this ${AC[a.job.ac].n} is at ${A.h}% health. Expect sealed orders.`); } } },50);
});
const _wChips = chipsFor;
chipsFor = function(st, job){ const A=st.airframes&&st.airframes[job.ac]; return _wChips(st, job) + (A && A.h<70 ? `<span class="chip ${A.h<50?'bad':'warn'}" title="Airframe health">🔧 ${A.h}%</span>` : ''); };
function healthBar(h){ return `<div class="meter ${h<50?'bad':h<75?'warn':''}" title="Airframe health ${h}%"><i style="width:${h}%"></i></div>`; }
const _wHangar = hangarView;
hangarView = function(){
  const st=S.st; let h=_wHangar(); const list=Object.keys(st.airframes||{}).filter(k=>AC[k]);
  const sec = list.length ? `<section class="panel stack"><div class="row between"><h3>Airframe health</h3><span class="small muted">Gentle flying keeps them healthy. Dez repairs a little every night.</span></div>
    <div class="cards">${list.map(k=>{ const A=st.airframes[k]; const g=isGrounded(st,k); const cost=Math.round((100-A.h)*22/10)*10; return `<div class="cell stack" style="gap:6px"><div class="row between"><b>${esc(AC[k].n)}</b><span class="mono">${A.h}%</span></div>${healthBar(A.h)}<span class="tiny muted">${g?`Grounded until day ${A.grounded}`:A.log[0]?`Last flight: ${esc(A.log[0].why)}`:''}</span>${A.h<100?`<button class="btn sm" data-act="rush-repair" data-id="${k}" ${st.cash<cost?'disabled':''}>Rush repair · ${money(cost)}</button>`:''}</div>`; }).join('')}</div></section>` : '';
  return h.replace('<main class="wrap stack fade">', '<main class="wrap stack fade">'+sec);
};
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="rush-repair"]'); if(!b || !S.st) return; const A=airframe(S.st,b.dataset.id); const cost=Math.round((100-A.h)*22/10)*10; if(S.st.cash<cost) return; txn(S.st,-cost,'Maintenance',`Rush repair: ${AC[b.dataset.id].n}`); A.h=100; A.grounded=0; save(); toast(`${AC[b.dataset.id].n} repaired. Dez stayed late.`); S.keepScroll=true; render(); });

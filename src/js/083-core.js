/* ===================== FLIGHT SCREEN, REORGANIZED: ticket first, then three plain steps ===================== */
const _flLay = flightView;
flightView = function(){ const h=_flLay(); const a=S.st&&S.st.active; if(!a || a.started || S.showResult || S.debrief) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  const job=a.job; const to=job.local?job.from:job.to; const toN=AP[to]?AP[to].n:to, fromN=AP[job.from]?AP[job.from].n:job.from;
  const skip=main.querySelector(':scope > .test-skip-bar'); const hero=main.querySelector(':scope > .chapter-hero'); const pass=main.querySelector(':scope > .pass'); const setup=main.querySelector(':scope > #preflight, :scope > .preflight');
  const brief=[...main.querySelectorAll(':scope > section')].find(s=>/^Briefing/.test(headText(s)));
  const more=[...main.querySelectorAll(':scope > .flight-more, :scope > details')];
  /* how it works, in three steps */
  const how=document.createElement('section'); how.className='fl-how';
  how.innerHTML=`<div class="fl-step"><span>1</span><div><b>Set up MSFS</b><p>Load the ${esc(AC[job.ac]?AC[job.ac].n:job.ac)} at <b>${esc(job.from)}</b> using the setup below: parking spot, fuel, time and weather.</p></div></div>
    <div class="fl-step"><span>2</span><div><b>Fly ${esc(job.from)} → ${esc(to)}</b><p>${job.local?`Take off from ${esc(fromN)}, fly the circuit or tour, and come back.`:`Take off from ${esc(fromN)} and fly to ${esc(toN)}.`} The app tracks you once the engine is running, or press <b>Start flight</b>.</p></div></div>
    <div class="fl-step"><span>3</span><div><b>Land at ${esc(to)}</b><p>Land and slow to taxi speed. The flight finishes and is graded automatically.</p></div></div>`;
  /* checkride tasks: visible, not hidden in a drawer */
  let tasks=null; if(job.kind==='check' && job.tasks && job.tasks.length){ tasks=document.createElement('section'); tasks.className='panel fl-tasks'; tasks.innerHTML=`<p class="label">What the examiner is grading</p><ul class="tight">${job.tasks.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`; more.forEach(d=>{ if(/Checkride tasks/.test(headText(d)||d.textContent.slice(0,40))) d.remove(); }); }
  /* order: (test bar) · chapter hero · ticket · how it works · checkride tasks · setup · briefing (folded) · details */
  const order=[skip, hero, pass, how, tasks, setup].filter(Boolean);
  order.slice().reverse().forEach(n=>main.prepend(n));
  if(setup){ const lab=setup.querySelector('.label'); if(lab) lab.textContent='Step 1 · set up MSFS'; }
  if(brief){ brief.remove(); if(job.kind!=='story'){ const d=wrapDetails([brief], job.kind==='check'?'About this checkride':'Client briefing'); if(d) (setup?setup.after(d):main.appendChild(d)); } }
  return t.innerHTML; };
(function(){ const s=document.createElement('style'); s.textContent=`
.fl-how{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
.fl-step{display:grid;grid-template-columns:30px 1fr;gap:10px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.fl-step > span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:var(--sea);color:#140f05}
.fl-step b{display:block;margin-bottom:3px}.fl-step p{margin:0;font-size:13px;color:var(--muted);line-height:1.45}.fl-step p b{display:inline;color:var(--ink)}
.fl-tasks{margin-bottom:14px}.fl-tasks ul{margin:6px 0 0}
@media (max-width:820px){.fl-how{grid-template-columns:1fr}}`; document.head.appendChild(s); })();


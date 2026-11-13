/* ===================== FIRST-LAUNCH SETUP WIZARD ===================== */
/* One screen before the first flight: difficulty, MSFS connection, voices, then Play. */
function wizardHTML(st){ const live=S.simState==='live';
  const conn = live ? `Connected${S.sim&&S.sim.aircraft&&S.sim.aircraft.title?`: ${esc(S.sim.aircraft.title)}`:''}` : S.simState==='nosim'||S.simState==='waiting' ? 'Waiting for MSFS…' : 'Not connected yet';
  return `<div class="overlay" role="dialog" aria-modal="true" aria-label="Before your first flight"><div class="tour panel wiz wiz-one">
    <p class="label">Before your first flight</p><h2>Three quick choices</h2>
    <div class="wiz-sec"><b>Difficulty</b><div class="diff">${Object.keys(DIFF).map(d=>`<button class="${diff()===d?'on':''}" data-act="diff" data-v="${d}" title="${esc(DIFF[d].d)}">${DIFF[d].n}</button>`).join('')}</div><p class="tiny muted">${esc(DIFF[diff()].d)}</p></div>
    <div class="wiz-sec"><b>Microsoft Flight Simulator</b><div class="wiz-status ${live?'ok':''}"><span class="simdot ${live?'on':''}"></span><span>${conn}</span><button class="btn sm ghost" data-act="wiz-recheck">Check again</button></div><p class="tiny muted">Start MSFS and load into any flight; Trade Winds connects by itself. No sim right now? You can still look around.</p></div>
    <div class="wiz-sec"><b>Voices</b><div class="row"><button class="btn sm" data-act="voice">${typeof voiceOn==='function'&&voiceOn()?'🔊 Voices on':'🔇 Voices off'}</button><button class="btn sm ghost" data-act="voice-test">▶ Test</button></div></div>
    <div class="row between wiz-go"><button class="btn ghost" data-act="wiz-academy">New to flight sims? Learn the basics first</button>${st.story.done.CW1?`<button class="btn primary" data-act="tour-skip">Done</button>`:`<button class="btn action" data-act="wiz-fly">▶ Play chapter 1</button>`}</div>
  </div></div>`;
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act^="wiz-"],[data-act="tour-skip"]'); if(!b || !S.st) return; const act=b.dataset.act;
  if(act==='tour-skip'){ S.wizOpen=false; S.wiz=0; return; }
  if(act==='wiz-next'){ S.wiz=(S.wiz||0)+1; render(); }
  else if(act==='wiz-back'){ S.wiz=Math.max(0,(S.wiz||0)-1); render(); }
  else if(act==='wiz-recheck'){ simPoll(true); setTimeout(render,1200); }
  else if(act==='wiz-academy'){ S.st.tourDone=true; S.wizOpen=false; S.wiz=0; save(); go('academy'); }
  else if(act==='wiz-fly'){ S.st.tourDone=true; S.wizOpen=false; S.wiz=0; save(); render(); if(!S.st.active){ const bt=document.createElement('button'); bt.dataset.act='accept-story'; bt.dataset.id='CW1'; bt.style.display='none'; document.body.appendChild(bt); bt.click(); bt.remove(); } else go('flight'); }
  else if(act==='wiz-open'){ S.wizOpen=true; render(); }
});
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="tour-skip"]') && S.st){ S.st.tourDone=true; S.wizOpen=false; save(); render(); } });

/* ===================== FIRST-LAUNCH SETUP WIZARD ===================== */
const WIZ = ['welcome','difficulty','sim','sound','skill','first'];
function wizardHTML(st){
  const i=Math.min(S.wiz||0, WIZ.length-1), k=WIZ[i]; const live=S.simState==='live';
  const dots=`<div class="tour-dots">${WIZ.map((_,j)=>`<span class="${j===i?'on':''}"></span>`).join('')}</div>`;
  let body='';
  if(k==='welcome') body=`<p class="label">Welcome aboard</p><h2>Let's get you flying in about five minutes</h2><p>Trade Winds turns Microsoft Flight Simulator into a Caribbean flying career: real jobs, a story, characters who talk to you while you fly, and your landings graded straight from the sim.</p><div class="wiz-art">${islandArt('TNCM', 1050, 600, 150, 'C172')}</div>`;
  if(k==='difficulty') body=`<p class="label">Step 1 of 4</p><h2>How do you want to play?</h2><div class="wiz-choices">${Object.keys(DIFF).map(d=>`<button class="wiz-choice ${diff()===d?'on':''}" data-act="diff" data-v="${d}"><b>${DIFF[d].n}</b><span>${esc(DIFF[d].d)}</span></button>`).join('')}</div><p class="tiny muted">You can change this any time from the top bar.</p>`;
  if(k==='sim') body=`<p class="label">Step 2 of 4</p><h2>Connect Microsoft Flight Simulator</h2>
    <div class="wiz-status ${live?'ok':''}"><span class="simdot ${live?'on':''}"></span><b>${live?`Connected${S.sim&&S.sim.aircraft&&S.sim.aircraft.title?`: ${esc(S.sim.aircraft.title)}`:''}`:S.simState==='nosim'||S.simState==='waiting'?'Bridge ready. Waiting for MSFS…':'Not connected yet'}</b></div>
    <p class="small">${window.TW_STANDALONE?'Start MSFS 2020 or 2024 and load into any flight. Trade Winds connects on its own; nothing to install.':'Start MSFS and load into any flight. In the browser version, the MSFS Bridge also needs to be running (Hangar tab has the setup).'}</p>
    <p class="tiny muted">No sim right now? You can skip this and log flights by hand.</p><button class="btn sm" data-act="wiz-recheck">Check again</button>`;
  if(k==='sound') body=`<p class="label">Step 3 of 4</p><h2>Hear your crew</h2><p>Your instructor talks you through each flight, passengers react, and ATC calls you on the radio.</p>
    <div class="row"><button class="btn primary" data-act="voice-test">▶ Test voices</button><button class="btn" data-act="voice">${typeof voiceOn==='function'&&voiceOn()?'🔊 Voices on':'🔇 Voices off'}</button><button class="btn" data-act="sfx-toggle">${sfxOn()?'🎧 Radio sounds on':'Radio sounds off'}</button></div><p class="tiny muted">More voice options live on the Hangar tab.</p>`;
  if(k==='skill') body=`<p class="label">Step 4 of 4</p><h2>How well do you know MSFS?</h2><div class="wiz-choices"><button class="wiz-choice" data-act="wiz-academy"><b>I'm new to flight sims</b><span>Start the Flight Academy: controls, takeoff, landing, step by step with live coaching.</span></button><button class="wiz-choice" data-act="wiz-next"><b>I know my way around</b><span>Straight to my first job in St. Martin.</span></button></div>`;
  if(k==='first'){ const m=STORY.find(x=>x.id==='CW1'); body=`<p class="label">You're ready</p><h2>Your first job: ${esc(m.title)}</h2><p>A 10-mile hop from Sint Maarten (TNCM) to Anguilla (TQPF) in a Cessna 172, with Dez in the right seat. Set it up in MSFS at TNCM, runway 10, then press Start.</p><div class="wiz-art">${islandArt('TQPF', m.dep, 600, 140, 'C172')}</div>`; }
  const nav = k==='first'
    ? `<div class="row between"><button class="btn ghost" data-act="tour-skip">Go to the job board</button>${st.story.done.CW1?'':`<button class="btn action" data-act="wiz-fly">Fly it now ✈</button>`}</div>`
    : `<div class="row between"><button class="btn ghost" data-act="${i?'wiz-back':'tour-skip'}">${i?'Back':'Skip setup'}</button>${k==='skill'?'':`<button class="btn primary" data-act="wiz-next">${i?'Next':'Let\'s go'}</button>`}</div>`;
  return `<div class="overlay" role="dialog" aria-modal="true" aria-label="Setup"><div class="tour panel wiz">${dots}${body}${nav}</div></div>`;
}
const _wzTour = tourHTML;
tourHTML = function(st){ if(st && !st.tourDone && (st.flights||0)===0) return wizardHTML(st); if(st && S.wizOpen) return wizardHTML(st); return _wzTour(st); };
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act^="wiz-"],[data-act="tour-skip"]'); if(!b || !S.st) return; const act=b.dataset.act;
  if(act==='tour-skip'){ S.wizOpen=false; S.wiz=0; return; }
  if(act==='wiz-next'){ S.wiz=(S.wiz||0)+1; render(); }
  else if(act==='wiz-back'){ S.wiz=Math.max(0,(S.wiz||0)-1); render(); }
  else if(act==='wiz-recheck'){ simPoll(true); setTimeout(render,1200); }
  else if(act==='wiz-academy'){ S.st.tourDone=true; S.wizOpen=false; S.wiz=0; save(); go('academy'); }
  else if(act==='wiz-fly'){ S.st.tourDone=true; S.wizOpen=false; S.wiz=0; save(); const m=STORY.find(x=>x.id==='CW1'); const acs=storyAircraft(S.st,m); if(acs.length && !S.st.active){ S.st.active={job:storyJob(S.st,m,acs[0]), accepted:Date.now()}; save(); } go('flight'); }
  else if(act==='wiz-open'){ S.wizOpen=true; S.wiz=2; render(); }
});
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="tour-skip"]') && S.st){ S.st.tourDone=true; S.wizOpen=false; save(); render(); } });
const _wzHangar = hangarView;
hangarView = function(){ return _wzHangar().replace('<main class="wrap stack fade">', '<main class="wrap stack fade"><div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="wiz-open">Run the setup check again</button></div>'); };

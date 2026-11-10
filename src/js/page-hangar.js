/* ===================== HANGAR PAGE =====================
   Four tabs: Your fleet, Settings, MSFS connection, Saves & help.
   hangarView() draws the tab bar and the sections of the current tab. */

const HG_TABS = [['fleet','Your fleet'],['settings','Settings'],['msfs','MSFS connection'],['save','Saves & help']];

/* ---------- Settings tab ---------- */

function settingsHTML(){
  const ui=uiPrefs(); const z=ui.zoom||1; const d=diff(); const u=uiP(); const v=u.vol||{}; const story=(S.st&&S.st.ui)||{}; const cutSize=u.cutSize||'m';
  const slider=(k,n)=>`<label class="vol"><span>${n}</span><input type="range" min="0" max="100" step="5" value="${v[k]==null?80:v[k]}" data-act="vol" data-k="${k}"><b>${v[k]==null?80:v[k]}</b></label>`;
  return `<section class="panel stack" id="settings"><div class="row between"><h3>Settings</h3><span class="small muted">Saved with your career</span></div>
  <div class="set-grid">
    <div><p class="label">Volume</p>${slider('voice','Voices')}${slider('music','Music')}${slider('fx','Effects')}</div>
    <div><p class="label">Units</p><div class="diff"><button class="${u.metric?'':'on'}" data-act="units" data-v="imp">Imperial (lb, gal)</button><button class="${u.metric?'on':''}" data-act="units" data-v="met">Metric (kg, L)</button></div><p class="tiny muted" style="margin-top:4px">Altitudes stay in feet and distances in nautical miles, as in aviation.</p></div>
    <div><p class="label">Cutscenes</p><p class="tiny muted" style="margin:0 0 4px">Cutscene text size</p><div class="diff" style="margin-bottom:8px">${[['s','Small'],['m','Normal'],['l','Large']].map(([k,n])=>`<button class="${cutSize===k?'on':''}" data-act="cut-size" data-v="${k}">${n}</button>`).join('')}</div>
      <label class="row"><input type="checkbox" data-act="ui-tog2" data-k="skipCuts" ${u.skipCuts?'checked':''}> Skip all cutscenes (choices still appear on the result screen)</label>
      <label class="row"><input type="checkbox" data-act="ui-tog2" data-k="autoCut" ${u.autoCut?'checked':''}> Play cutscenes automatically (no clicking between lines)</label></div>
    <div><p class="label">Story</p><label class="row"><input type="checkbox" data-act="ui-tog" data-k="noRecap" ${story.noRecap?'':'checked'}> "Previously on" recap when the app opens</label>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-act="cold-again">Replay the opening scene</button><button class="btn sm" data-act="walk-again">Show the welcome walkthrough</button></div></div>
    <div><p class="label">Keyboard</p><p class="small muted" style="line-height:1.7"><kbd>1</kbd>–<kbd>5</kbd> pages · <kbd>Ctrl K</kbd> or <kbd>/</kbd> search · <kbd>F</kbd> your flight · <kbd>Space</kbd> next in a cutscene · <kbd>Esc</kbd> skip · <kbd>M</kbd> menu in flight mode · <kbd>←</kbd> back a line · <kbd>?</kbd> all shortcuts</p></div>
    <div><p class="label">Difficulty</p><div class="diff">${Object.keys(DIFF).map(k=>`<button class="${k===d?'on':''}" data-act="diff" data-v="${k}" title="${esc(DIFF[k].d)}">${DIFF[k].n}</button>`).join('')}</div><p class="tiny muted" style="margin-top:4px">${esc(DIFF[d].d)}</p></div>
    <div><p class="label">Appearance</p><button class="btn sm" data-act="theme">${THEME_LBL[themePref()]}</button></div>
    <div><p class="label">Text size</p><div class="diff">${[[1,'Normal'],[1.12,'Large'],[1.25,'Larger']].map(([v,l])=>`<button class="${z===v?'on':''}" data-act="ui-zoom" data-v="${v}">${l}</button>`).join('')}</div></div>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="reduceMotion" ${ui.reduceMotion?'checked':''}> Reduce motion and animations</label>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="contrast" ${ui.contrast?'checked':''}> High contrast text and outlines</label>
    <label class="row"><input type="checkbox" data-act="ui-flag" data-k="quiet" ${ui.quiet?'checked':''}> Quiet mode: no urgent-job pop-ups</label>
  </div>
  ${window.twNative&&twNative.openFolder?`<div class="row"><button class="btn sm" data-act="open-logs">Open flight logs folder</button><span class="tiny muted">Every flight with MSFS connected is recorded here. Send one along if something looks wrong.</span></div>`:''}</section>`;
}

function hangarSettingsTab(st){
  const p=syncPrefs(); const P=proPrefs();
  return `${settingsHTML()}
    <section class="panel stack"><h3>Flight setup</h3><label class="row"><input type="checkbox" data-act="pro-flag" data-k="fullChecklist" ${P.fullChecklist?'checked':''}> Detailed checklists (9 phases instead of 5)</label><label class="row"><input type="checkbox" data-act="pro-flag2" data-k="autoTime" ${P.autoTime!==false?'checked':''}> Set the MSFS clock to the flight's departure time automatically (app only)</label></section>
    <section class="panel stack"><h3>Voices &amp; copilot</h3><label class="row"><input type="checkbox" data-act="pro-flag" data-k="copilot" ${P.copilot!==false?'checked':''}> Copilot callouts: "Airspeed alive", "Rotate", "Positive rate", and 1000 / 500 / 100 / 50 / 30 / 10 on landing</label>${premiumVoiceHTML()}</section>
    <section class="panel stack"><h3>Match MSFS</h3><label class="row"><input type="checkbox" data-act="sync-wx" ${p.wx?'checked':''}> Use live MSFS weather in briefings when you're at the departure airport</label><label class="row"><input type="checkbox" data-act="sync-time" ${p.time?'checked':''}> Check that the MSFS clock matches the flight</label></section>
    <section class="panel row between"><div><h3>Urgent dispatch calls</h3><p class="small muted">Real-time 2× pay jobs pop up while the game is open. You get ${URG_ACCEPT_MIN} minutes to accept and ${URG_TAKEOFF_MIN} to get wheels up.</p></div><div class="row"><button class="btn sm" data-act="urg-toggle">${urgentOn()?'Turn off':'Turn on'}</button><button class="btn sm ghost" data-act="urg-test">Send one now</button></div></section>
    ${voiceSettingsHTML()}`;
}

/* ---------- MSFS connection tab ---------- */

function hangarMsfsTab(){
  return `${panelSetupHTML()}
    <div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="wiz-open">Run the setup check again</button></div>
    <section class="panel stack" style="max-width:760px" id="sim-hangar">${simHangarHTML()}</section>`;
}

/* ---------- Saves & help tab ---------- */

function hangarSaveTab(st){
  return `<section class="panel stack" style="max-width:760px"><h3>Save data</h3>
      <p class="small muted">${esc(syncText())}. Copy the text below to back up your career, or paste a backup to restore it.</p>
      <textarea id="save-text" aria-label="Career save data" spellcheck="false">${esc(JSON.stringify(st))}</textarea>
      <div class="row"><button class="btn sm primary" data-act="export-file">Export career file</button><button class="btn sm" data-act="import-file">Import career file</button><button class="btn sm" data-act="copy-save">Copy</button><button class="btn sm" data-act="import-save">Restore from the text above</button>
      ${S.confirm==='reset' ? `<span class="small">Erase this career and start over?</span><button class="btn sm danger" data-act="reset-yes">Erase it</button><button class="btn sm" data-act="confirm-no">Cancel</button>` : `<button class="btn sm danger" data-act="reset">Start a new career</button>`}</div>
    </section>
    <section class="panel stack" style="max-width:760px"><h3>Report a problem</h3><p class="small muted">Something broke or felt wrong? Describe it and save a report. It includes the version, recent errors (${errLog().length}) and your sim status, but not your whole save.</p><textarea id="bug-note" placeholder="What happened? What did you expect?" style="min-height:90px"></textarea><div class="row"><button class="btn sm primary" data-act="bug-save">Save report</button><button class="btn sm" data-act="bug-copy">Copy report</button><span class="tiny muted">Version ${TW_VERSION}</span></div></section>
    ${backupsHTML()}`;
}

/* ---------- Your fleet tab ---------- */

/* What's loaded in MSFS right now. */
function loadedNowCard(st){
  const live=S.simState==='live'; const L=live?loadedAircraft():{};
  return `<section class="panel loaded-now"><p class="label">Loaded in MSFS</p>${live?(L.id?`<h3>${esc(AC[L.id].n)}</h3><p class="small muted">${esc(AC[L.id].cls)} · cruise ${AC[L.id].cruise} kt · range ${AC[L.id].range} nm${st.hangar&&st.hangar[L.id]?' · in your hangar list':' · <b>not ticked in your hangar list below</b>'}</p>`:`<h3>${esc(L.title||'Nothing loaded')}</h3><p class="small muted">This aircraft isn't one the game knows.</p>`):`<h3>MSFS isn't connected</h3><p class="small muted">Start MSFS and load an aircraft to see it here.</p>`}</section>`;
}
/* Health of the aircraft you've flown, with a paid rush repair. */
function airframeHealthSection(st){
  const list=Object.keys(st.airframes||{}).filter(k=>AC[k]); if(!list.length) return '';
  return `<section class="panel stack"><div class="row between"><h3>Airframe health</h3><span class="small muted">Gentle flying keeps them healthy. Dez repairs a little every night.</span></div>
    <div class="cards">${list.map(k=>{ const A=st.airframes[k]; const g=isGrounded(st,k); const cost=Math.round((100-A.h)*22/10)*10; return `<div class="cell stack" style="gap:6px"><div class="row between"><b>${esc(AC[k].n)}</b><span class="mono">${A.h}%</span></div>${healthBar(A.h)}<span class="tiny muted">${g?`Grounded until day ${A.grounded}`:A.log[0]?`Last flight: ${esc(A.log[0].why)}`:''}</span>${A.h<100?`<button class="btn sm" data-act="rush-repair" data-id="${k}" ${st.cash<cost?'disabled':''}>Rush repair · ${money(cost)}</button>`:''}</div>`; }).join('')}</div></section>`;
}
/* The tick list of every aircraft, by class, folded away under one heading. */
function ownedAircraftList(st){
  const groups = {}; Object.keys(AC).forEach(k=>{ const c=AC[k].cls; (groups[c]=groups[c]||[]).push(k); });
  const owned=Object.keys(st.hangar||{}).filter(k=>st.hangar[k] && AC[k]).length;
  const card = k => { const a=AC[k]; return `<div class="cell stack" style="gap:6px"><div class="hg-sil">${acSvg(k)}</div><label class="check"><input type="checkbox" data-hangar="${k}" ${st.hangar[k]?'checked':''}> <b>${esc(a.n)}</b></label>
      <div class="row" style="gap:4px">${a.req.map(r=>`<span class="chip ${st.ratings[r]?'good':''}">${RATINGS[r].code}</span>`).join('')}${st.types[k]?`<span class="chip sea">${st.types[k]} flown</span>`:''}</div>
      <p class="small">${esc(a.note)}</p><p class="tiny mono muted">${esc(a.v)}</p><p class="tiny muted">${a.pax} pax · ${a.useful.toLocaleString()} lb useful · ${a.cruise} kt · ${a.range.toLocaleString()} nm · ${a.rwy.toLocaleString()} ft runway · ${a.xw} kt crosswind</p></div>`; };
  return `<details class="calm-more"><summary>Aircraft you own in MSFS <span class="tiny muted">${owned} selected</span></summary><div class="calm-more-in">
    ${Object.keys(groups).map(g=>`<section><div class="section-title"><h3>${esc(CLS[g].name)}</h3></div><div class="cards">${groups[g].map(card).join('')}</div></section>`).join('')}</div></details>`;
}
/* When MSFS has an aircraft loaded that the game doesn't know, its numbers are filled into the "bring your own" form. */
function prefillOwnAircraftForm(){
  const L=loadedAircraft(); const g=specGuess(S.sim&&S.sim.spec); if(!g || !L.title || L.id) return; const set=(id,v)=>{ const el=document.getElementById(id); if(el && !el.value && v) el.value=v; };
  const c=document.getElementById('byo-cls'); if(c && !c.dataset.touched){ c.value=g.cls; } set('byo-pax',g.pax); set('byo-cruise',g.cruise); set('byo-range',g.range); set('byo-vapp',g.vapp);
  const n=document.querySelector('.byo .small.muted'); if(n && !n.dataset.spec){ n.dataset.spec='1'; n.insertAdjacentHTML('afterend', `<p class="notice small">Filled in from MSFS: ${esc(L.title)}. Check the numbers, then add it.</p>`); }
}

function hangarView(){
  const st=S.st; const cur=S.hangarTab||'fleet';
  setTimeout(prefillOwnAircraftForm, 0);
  const tabs=`<nav class="hg-tabs">${HG_TABS.map(([k,l])=>`<button class="${k===cur?'on':''}" data-act="hg-tab" data-v="${k}">${l}</button>`).join('')}</nav>`;
  if(cur==='fleet') return `<main class="wrap stack fade">${loadedNowCard(st)}${fleetCrewHTML(st)}${tabs}
    ${airframeHealthSection(st)}${byoSection(st)}
    <section class="panel stack"><h2>Hangar</h2><p class="small muted">Untick any aircraft you don't have in your copy of MSFS (2020 or 2024) so the career never assigns it. Numbers are approximate planning figures; check each aircraft's own EFB for real limits.</p></section>
    ${ownedAircraftList(st)}</main>`;
  const body = cur==='settings' ? hangarSettingsTab(st) : cur==='msfs' ? hangarMsfsTab() : cur==='save' ? hangarSaveTab(st) : '';
  return `<main class="wrap stack fade">${tabs}${body}</main>`;
}

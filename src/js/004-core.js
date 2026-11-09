/* ===================== LIVE MSFS (via the local MSFS Bridge) ===================== */
const SIM_SERVER = 'host:msfs-bridge';
const SIM_STOP_CODES = ['server_not_connected','not_in_manifest','not_granted','capability_disabled','capability_removed','blocked_by_policy','selection_required','server_not_found'];
async function simInit(){
  const c = window.claude; if(!c || !c.use) return;
  let m=null; try{ m = await c.use('mcp'); }catch(e){ m=null; }
  S.mcp = m; S.simState = m ? 'checking' : 'off'; renderSimBits();
  if(m) simPoll();
}
async function simPoll(manual){
  clearTimeout(S.simTimer);
  if(!S.mcp) return;
  if(document.hidden && !manual){ S.simTimer = setTimeout(simPoll, 5000); return; }
  try{
    const r = await S.mcp.callTool(SIM_SERVER, 'sim_status', {}, { cache:false });
    let p = r.payload; if(typeof p === 'string'){ try{ p = JSON.parse(p); }catch(e){ p=null; } }
    if(p && p.bridge){ S.sim = p; S.simState = p.receivingData ? 'live' : p.connected ? 'waiting' : 'nosim'; S.simErr=null; }
  }catch(e){
    S.simErr = e && e.code || 'upstream_error';
    S.simState = SIM_STOP_CODES.includes(S.simErr) ? 'nobridge' : 'error';
  }
  renderSimBits();
  if(S.simState !== 'nobridge'){ const fast = S.st && (S.st.active || (S.st.academy && S.st.academy.cur) || (S.st.cup && S.st.cup.cur)); S.simTimer = setTimeout(simPoll, fast ? ((S.view==='flight'||S.view==='cockpit'||S.view==='academy'||S.view==='cup') ? 2500 : 4000) : 15000); }
}
function simRecFor(active){
  const s = S.sim; if(!s || !s.recorder || !active) return null;
  const r = s.recorder; if(active.recId && r.id !== active.recId) return null;
  if(!active.recId && active.started && r.armedAt && !s.mock && r.armedAt < active.started - 120000) return null;
  return r;
}
function nearestAirport(lat, lon){ let best=null, bd=1e9; for(const k in AP){ const d=distNm({lat,lon},AP[k]); if(d<bd){bd=d;best=k;} } return {code:best, d:bd}; }
function landingClass(fpm){ return fpm<100?'butter':fpm<200?'smooth':fpm<350?'firm':'hard'; }
function acMatches(title, acId){
  if(!title) return null; const t = title.toLowerCase(); const n = AC[acId].n.toLowerCase();
  const keys = n.match(/[a-z]*\d+[a-z0-9-]*|caravan|beaver|goose|otter|porter|cub|savage|bonanza|citation|king air|vision|skyhawk|icon|pilatus|tbm|dc-3|airbus|boeing|heart/g) || [];
  return keys.some(k => t.includes(k.replace(/-/g,'')) || t.includes(k));
}
function simStatusLine(){
  switch(S.simState){
    case 'live': return `<span class="chip good">MSFS live</span>`;
    case 'waiting': return `<span class="chip warn">MSFS connected, no flight loaded</span>`;
    case 'nosim': return `<span class="chip warn">Bridge running, MSFS not detected</span>`;
    case 'checking': return `<span class="chip">Looking for MSFS…</span>`;
    case 'error': return `<span class="chip warn">Bridge didn't answer</span>`;
    case 'nobridge': return `<span class="chip">Bridge not connected</span>`;
    default: return `<span class="chip">Live sim off</span>`;
  }
}
function simPanelHTML(){
  const st=S.st; const a = st && st.active; const s=S.sim;
  if(!S.mcp || S.simState==='nobridge' || S.simState==='off'){
    return `<div class="row between"><h3>Live from MSFS</h3>${simStatusLine()}</div><p class="small muted">Connect the MSFS Bridge to record your takeoff, touchdown rate, fuel and block time automatically. It works when this page is open in the Claude desktop app on the PC running MSFS. Setup is on the Hangar tab.</p>${S.mcp?`<button class="btn sm" data-act="sim-retry">Check again</button>`:''}`;
  }
  if(S.simState!=='live'){ return `<div class="row between"><h3>Live from MSFS</h3>${simStatusLine()}</div><p class="small muted">${esc(s && s.note || 'Start MSFS and load into a flight. The bridge connects automatically.')}</p><button class="btn sm" data-act="sim-retry">Check again</button>`; }
  const job = a && a.job; const rec = simRecFor(a);
  const m=s.motion, pos=s.position, sys=s.systems;
  let distTo='';
  if(job && pos){ const dTo = job.local ? distNm(pos, AP[job.from]) : distNm(pos, AP[job.to]); const dFrom = distNm(pos, AP[job.from]); distTo = `<dt>${job.local?'From base':'To '+esc(job.to)}</dt><dd>${dTo.toFixed(1)} nm</dd>${!a.started && dFrom>3 && !AP[job.from].water?`<dt>Heads up</dt><dd style="color:var(--warn)">You're ${dFrom.toFixed(0)} nm from ${esc(job.from)}. Spawn at the departure airport.</dd>`:''}`; }
  const match = job ? acMatches(s.aircraft.title, job.ac) : null;
  return `<div class="row between"><h3>Live from MSFS</h3>${simStatusLine()}</div>
    <p class="small"><b>${esc(s.aircraft.title||'Unknown aircraft')}</b>${s.aircraft.atcId?` · <span class="mono">${esc(s.aircraft.atcId)}</span>`:''} ${match===false?'<span class="chip warn">Not the job\'s aircraft</span>':match?'<span class="chip good">Right aircraft</span>':''}</p>
    <dl class="kv small">
      <dt>Speed</dt><dd class="mono">${m.ias} kt IAS · ${m.gs} kt GS</dd>
      <dt>Altitude</dt><dd class="mono">${pos.altFt.toLocaleString()} ft · ${m.vsFpm>0?'+':''}${m.vsFpm} fpm</dd>
      <dt>Fuel</dt><dd class="mono">${sys.fuelLb.toLocaleString()} lb (${sys.fuelGal} gal)</dd>
      ${distTo}
      ${s.simLocalTime?`<dt>Sim time</dt><dd class="mono">${s.simLocalTime}${job?` (planned ${hhmm(job.dep)})`:''}</dd>`:''}
    </dl>
    ${rec ? `<div><p class="label">Flight recorder · ${esc(rec.phase.replace('-',' '))}</p><ul class="tight small" style="margin-top:4px">
      ${rec.blockOut?`<li>Block out recorded${rec.blockMinutes!=null?` · ${durTxt(rec.blockMinutes)} so far`:''}</li>`:'<li>Waiting for you to start taxiing</li>'}
      ${rec.takeoff?`<li>Takeoff at ${rec.takeoff.ias} kt</li>`:''}
      ${rec.touchdown?`<li><b>Touchdown: ${rec.touchdown.fpm} fpm</b>, ${rec.touchdown.g} G${rec.bounces?` · ${rec.bounces} bounce${rec.bounces>1?'s':''}`:''}</li>`:''}
      ${rec.blockIn?`<li>Block in: ${durTxt(rec.blockMinutes)} total, ${rec.fuelUsedLb} lb used</li>`:''}
    </ul></div>` : (a ? `<p class="small muted">${a.started?'Recorder not linked to this flight yet.':'Press Start flight and the recorder arms automatically.'}</p>` : '')}`;
}
function renderSimBits(){
  const el=document.getElementById('simpanel'); if(el) el.innerHTML = simPanelHTML();
  const h=document.getElementById('sim-hangar'); if(h) h.innerHTML = simHangarHTML();
  const b=document.getElementById('sim-band'); if(b) b.innerHTML = S.simState==='live' ? '● MSFS live' : '';
  const d=document.getElementById('sim-debrief'); if(d && S.st && S.st.active) d.innerHTML = simDebriefHTML(S.st.active.job);
}
function simHangarHTML(){
  return `<div class="row between"><h3>Live MSFS connection</h3>${simStatusLine()}</div>
  <p class="small">The MSFS Bridge is a small program on your PC that reads MSFS 2020 or 2024 through SimConnect and hands this page your position, fuel and an automatic flight recording: block out, takeoff, touchdown rate, landing spot and block in. The debrief fills itself in from it.</p>
  <ol class="tight small"><li>Install Node.js (LTS) if you don't have it.</li><li>Unzip the <b>msfs-bridge</b> folder somewhere permanent, for example <span class="mono">C:\\Users\\you\\msfs-bridge</span>, and double-click <span class="mono">install.bat</span>.</li><li>In the Claude desktop app: Settings → Developer → Edit Config, and add the <span class="mono">msfs-bridge</span> entry from the README. Restart the Claude app.</li><li>Open this page in the Claude desktop app on the same PC, start MSFS, and load into a flight.</li></ol>
  <p class="small muted">It only works in the Claude desktop app on the PC running MSFS. In a browser or on your phone the career still works; you just log landings by hand.</p>
  ${S.mcp?`<button class="btn sm" data-act="sim-retry">Check connection</button>`:''}`;
}
function simDebriefHTML(job){
  const a=S.st.active; const rec = simRecFor(a);
  if(!rec || !rec.touchdown){ return S.simState==='live' ? `<div class="notice small">MSFS is connected, but the recorder hasn't captured a landing for this flight yet. Fill in the form by hand, or land first.</div>` : ''; }
  const near = nearestAirport(rec.touchdown.lat, rec.touchdown.lon);
  return `<div class="notice"><b>From MSFS:</b> touchdown ${rec.touchdown.fpm} fpm (${rec.touchdown.g} G)${rec.bounces?`, ${rec.bounces} bounce${rec.bounces>1?'s':''}`:''} · landed ${near.d<6?`at ${esc(near.code)}`:`${near.d.toFixed(0)} nm from ${esc(near.code)}`} · fuel now ${rec.fuelNowLb} lb${rec.blockMinutes?` · block ${durTxt(rec.blockMinutes)}`:''}. These values are filled in below; adjust anything that's off.</div>`;
}
function simPrefill(form){
  const a=S.st.active; const rec=simRecFor(a); if(!rec || !rec.touchdown) return false;
  const cls = landingClass(rec.touchdown.fpm); const r = form.querySelector(`input[name="landing"][value="${cls}"]`); if(r) r.checked = true;
  if(rec.fuelNowLb!=null){ const fu=document.getElementById('fuelUnit'); if(fu){ fu.value='lb'; document.getElementById('fuel').value = rec.fuelNowLb; } }
  if(rec.blockMinutes){ document.getElementById('block').value = rec.blockMinutes; }
  const near = nearestAirport(rec.touchdown.lat, rec.touchdown.lon); const sel=document.getElementById('landedAt');
  if(near.d<6 && sel){ if(![...sel.options].some(o=>o.value===near.code)){ const o=document.createElement('option'); o.value=near.code; o.textContent=`${near.code} · ${AP[near.code].isl}`; sel.appendChild(o); } sel.value=near.code; }
  form.dataset.simVerified = '1'; form.dataset.simFpm = rec.touchdown.fpm; form.dataset.simBounces = rec.bounces; form.dataset.simG = rec.touchdown.g;
  return true;
}
async function simArm(){
  if(!S.mcp || S.simState==='nobridge' || S.simState==='off') return;
  const a=S.st.active;
  try{ const r = await S.mcp.callTool(SIM_SERVER, 'flight_recorder_reset', { label: a.job.title.slice(0,100) }, { cache:false }); let p=r.payload; if(typeof p==='string'){ try{p=JSON.parse(p);}catch(e){} } if(p && p.recorderId){ a.recId = p.recorderId; save(); } }
  catch(e){ /* recorder still auto-arms on block out; fall back to time matching */ }
  simPoll(true);
}
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && S.mcp && S.simState!=='nobridge') simPoll(true); });

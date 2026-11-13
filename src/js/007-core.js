/* ===================== UI ===================== */
const S = { st:null, view:'board', debrief:false, showResult:false, confirm:null, toast:null, sample:null, sampleOff:false, db:null, sync:'device', busy:{}, travelTo:'', saveTimer:null, saving:false, pending:false };
const app = document.getElementById('app');
const VIEWS = [['board','Job board'],['map','Map'],['flight','Flight'],['cockpit','Cockpit'],['pilot','Pilot'],['story','Story'],['log','Logbook'],['money','Money'],['company','Company'],['hangar','Hangar']];

/* ---------- persistence ---------- */
function loadLocal(){ try{ const t=localStorage.getItem(KEY); return t?JSON.parse(t):null; }catch(e){ return null; } }
function saveBase(){ const st=S.st; if(!st) return; st.savedAt=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){}
  clearTimeout(S.saveTimer); S.saveTimer=setTimeout(flush, 1200); }
async function flush(){ if(!S.db || !S.st) return; if(S.saving){ S.pending=true; return; } S.saving=true;
  try{ await S.db.doc(DB_DOC).set({ json: JSON.stringify(S.st), savedAt: S.st.savedAt }); S.sync='account'; }
  catch(e){ S.sync = e && e.code==='quota_exceeded' ? 'full' : 'device'; }
  S.saving=false; renderSync(); if(S.pending){ S.pending=false; flush(); } }
async function connect(){
  const c = window.claude; if(!c || !c.use) return;
  c.use('sample').then(s=>{ S.sample=s; if(s) render(); }).catch(()=>{});
  let db=null; try{ db = await c.use('db'); }catch(e){ db=null; }
  if(!db) return; S.db=db;
  try{
    const snap = await Promise.race([ db.doc(DB_DOC).get(), new Promise((_,rej)=>setTimeout(()=>rej({code:'timeout'}),10000)) ]);
    if(snap && snap.exists){ const d=snap.data(); const remote = d && d.json ? JSON.parse(d.json) : null;
      if(remote && (!S.st || (remote.savedAt||0) > (S.st.savedAt||0))){ S.st = migrate(remote); try{ localStorage.setItem(KEY, JSON.stringify(S.st)); }catch(e){} render(); }
      else if(S.st){ flush(); }
      S.sync='account';
    } else if(S.st){ flush(); }
    renderSync();
  }catch(e){ S.sync='device'; renderSync(); }
}

/* ---------- helpers ---------- */
function topRating(st){ const order=['ATP','JET','TURB','IR','COMM','PPL']; for(const r of order) if(st.ratings[r]) return RATINGS[r]; return RATINGS.PPL; }
function syncTextBase(){ return {account:'Saved to your account', device:'Saved in this browser', full:'Account storage full: saving in this browser'}[S.sync]; }
function renderSync(){ const el=document.getElementById('sync'); if(el) el.textContent=syncText(); }


function avatarBase(k){ const c=CAST[k]; const ini=c.n.replace(/".*?"\s*/,'').split(' ').filter(w=>/^[A-Z]/.test(w)).slice(-2).map(w=>w[0]).join(''); return `<div class="avatar" style="background:${c.col}" aria-hidden="true">${esc(ini)}</div>`; }
/* a character's face: painted portrait if there is one, else the drawn SVG portrait, else initials */
function avatar(k){ const u=ART.portraits[k]; if(u) return `<span class="avatar art-av" style="background-image:url('${u}')" role="img" aria-label="${esc(CAST[k]?CAST[k].n:k)}"></span>`;
  const svg=portraitSVG(k); if(svg){ const c=CAST[k]||{}; return `<div class="avatar portrait" style="background:${c.col||'#0b746f'}" aria-hidden="true">${svg}</div>`; }
  return avatarBase(k); }



/* ---------- band ---------- */


/* ---------- setup ---------- */


/* ---------- board ---------- */

function genLocWxBase(st){ const k=st.loc+'|'+st.day; if(!st.locWx || st.locWx.k!==k){ st.locWx = {k, wx: genWx(st, st.loc, null, st.clock)}; } return st.locWx.wx; }

/* ---------- flight ---------- */
function autoTeach(st, job, p){
  const out=[]; const a=AC[job.ac]; const to=AP[job.to], from=AP[job.from];
  const r = rwyAnalysis(job.to, job.wx, job.ac);
  if(r.water){ out.push(`Water landing: land into the wind (${pad3(job.wx.dir)}°). ${job.wx.spd<6 ? 'The water will be glassy, so use the glassy-water technique: hold landing attitude with a 100–150 fpm descent and let it touch.' : 'Some chop helps you judge height. Watch for swells and boats.'}`); }
  else out.push(`Expect runway ${r.rw} at ${job.to}: about ${Math.round(r.head)} kt of headwind and ${Math.round(r.xw)} kt of crosswind${r.gxw?` (${Math.round(r.gxw)} kt in gusts)`:''}. The ${a.n}'s demonstrated crosswind is around ${a.xw} kt.${r.over?' That\'s beyond it today, so consider another runway, waiting or an alternate.':''}`);
  const da = densityAlt(from.el, job.wx.t, job.wx.qnh); if(!from.water && da > from.el + 1200) out.push(`Density altitude at ${job.from} is about ${da.toLocaleString()} ft at ${job.wx.t} °C. The airplane performs as if the airport were that high, so expect a longer takeoff roll and a weaker climb.`);
  if(!job.local && ZONE(from.c)!==ZONE(to.c)) out.push(`International flight: ${COUNTRY[from.c]} to ${COUNTRY[to.c]}. File a flight plan, carry your passport and the passengers' details, and clear customs and immigration on arrival.`);
  if(isUS(job.to) && !isUS(job.from)) out.push(`Arriving in US airspace: altimeter settings are in inches of mercury and visibility in statute miles. ${job.to==='KFLL'||job.to==='KMIA'||job.to==='KPBI'?'File eAPIS and enter the Florida ADIZ on a flight plan with a transponder code.':''}`);
  if(job.wx.ifr) out.push(`Instrument conditions at the destination: file IFR, brief the approach and the missed approach before you start down, and know your alternate (${p.altCode||'n/a'}).`);
  if(isNight(job.dep) && !job.wx.ifr) out.push(`Night flight. Over water at night there's no horizon, so trust your attitude indicator and fly a stabilized approach to a lit runway.`);
  if(!st.types[job.ac]) out.push(`First flight in the ${a.n}. ${a.note} Speeds: ${a.v}.`);
  if(p.over===0 && p.total > p.useful*0.92) out.push(`You're within ${Math.round(p.useful - p.total)} lb of max takeoff weight. Taking off heavy means a longer roll and a slower climb.`);
  out.push(`Read the METAR: wind ${pad3(job.wx.dir)}° at ${job.wx.spd} kt${job.wx.gust?`, gusting ${job.wx.gust}`:''}; visibility ${job.wx.vis>=10?'10+ miles':job.wx.vis+' miles'}; ${job.wx.cl.map(c=>({FEW:'few',SCT:'scattered',BKN:'broken',OVC:'overcast'}[c[0]])+' clouds at '+c[1].toLocaleString()+' ft'+(c[2]?' with cumulonimbus':'')).join(', ')}; ${job.wx.t} °C.`);
  return out.slice(0,6);
}
function debriefView(job, p){
  const st=S.st; const a=AC[job.ac]; const started=st.active.started; const mins = started ? Math.max(5,Math.round((Date.now()-started)/60000)) : p.est;
  const sc = job.scen ? SCEN[job.scen] : null;
  const alts = Object.keys(AP).filter(k=>!AP[k].water && k!==job.to && longestRwy(AP[k])>=a.rwy).map(k=>({k,d:distNm(AP[job.to],AP[k])})).sort((x,y)=>x.d-y.d).slice(0,6).map(x=>x.k);
  if(!alts.includes(job.from) && job.from!==job.to) alts.unshift(job.from);
  const unit = a.fuel==='elec' ? 'pct' : (a.fuel==='avgas' ? 'gal' : 'lb');
  const opt = (name,val,label,checked) => `<label class="opt"><input type="radio" name="${name}" value="${val}" ${checked?'checked':''}><span>${label}</span></label>`;
  return `<main class="wrap fade"><form id="debrief" class="panel stack" style="max-width:860px">
    <div><p class="label">Debrief · ${esc(job.title)}</p><h1 style="font-size:30px;margin-top:4px">How did it go?</h1><p class="muted small" style="margin-top:4px">Report honestly. The grade only teaches you something if it's true.</p></div>
    <div id="sim-debrief">${simDebriefHTML(job)}</div>
    <div class="field"><span>Landing</span><div class="opt-group">${Object.entries(LANDING).map(([k,v])=>opt('landing',k,v.n,k==='smooth')).join('')}</div><small>MSFS doesn't show touchdown rate by default. Use your vertical speed indicator just before touchdown, a landing-rate add-on, or how hard it felt.</small></div>
    <div class="form-grid">
      <div class="field"><span>Touched down in the touchdown zone?</span><div class="opt-group">${opt('tdz','1','Yes',true)}${opt('tdz','0','No, long or short',false)}</div></div>
      <div class="field"><span>On the centerline?</span><div class="opt-group">${opt('center','1','Yes',true)}${opt('center','0','Drifted',false)}</div></div>
    </div>
    <div class="form-grid">
      <label class="field"><span>${unit==='pct'?'Battery remaining (%)':'Fuel remaining at shutdown'}</span><input id="fuel" type="number" min="0" step="any" required value=""></label>
      ${unit==='pct'?'':`<label class="field"><span>Fuel units</span><select id="fuelUnit"><option value="gal" ${unit==='gal'?'selected':''}>US gallons</option><option value="lb" ${unit==='lb'?'selected':''}>pounds</option><option value="kg">kilograms</option></select></label>`}
      <label class="field"><span>Block time (minutes)</span><input id="block" type="number" min="1" step="1" required value="${mins}"><small>Planned: ${p.est} min${started?'. Prefilled from your timer.':''}</small></label>
      <label class="field"><span>Where did you land?</span><select id="landedAt">${[job.to,...alts.filter(k=>k!==job.to)].map(k=>`<option value="${k}">${k} · ${esc(AP[k].isl)}${k===job.to?' (planned)':''}</option>`).join('')}</select></label>
    </div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><span>Airmanship (tick what you actually did)</span>
      <label class="check"><input type="checkbox" id="checklist" checked> Used the checklists: preflight, before takeoff, approach</label>
      <label class="check"><input type="checkbox" id="radio" checked> Made proper radio calls, or followed ATC</label>
      <label class="check"><input type="checkbox" id="weather" checked> Checked the weather and fuel before departure</label>
      <label class="check"><input type="checkbox" id="smooth" checked> Kept it smooth: no stall warnings, no steep bank over 45°, no hard maneuvering</label>
    </fieldset>
    ${job.request?`<div class="field"><span>Passenger request: ${esc(REQUESTS.find(r=>r.id===job.request).n)}. Did you make it happen?</span><div class="opt-group">${opt('request','1','Yes',false)}${opt('request','0','No',true)}</div></div>`:''}
    ${job.bonus && !job.bonus.auto?`<div class="field"><span>Bonus objective: ${esc(job.bonus.text)}</span><div class="opt-group">${opt('bonus','1','Done it',false)}${opt('bonus','0','Not this time',true)}</div></div>`:''}
    ${sc?`<div class="field"><span>Sealed orders: ${esc(sc.n)}</span><div class="opt-group">${opt('scen','book','Handled by the book',true)}${opt('scen','messy','Handled, but messy',false)}${opt('scen','ignored','Ignored it',false)}</div></div>`:''}
    ${job.kind==='check'?`<fieldset class="field" style="border:0;padding:0;margin:0"><span>Checkride tasks completed</span>${job.tasks.map((t,i)=>`<label class="check"><input type="checkbox" name="task" value="${i}"> ${esc(t)}</label>`).join('')}</fieldset>`:''}
    <div class="row"><button class="btn action" type="submit">Submit debrief</button><button class="btn" type="button" data-act="debrief-back">Back to briefing</button></div>
  </form></main>`;
}

/* ---------- pilot ---------- */

/* ---------- story ---------- */


/* ---------- logbook ---------- */
function logView(){
  const st=S.st;
  if(!st.log.length) return `<main class="wrap"><div class="empty fade"><h3>Your logbook is empty</h3><p>Fly your first job and it'll show up here.</p></div></main>`;
  const earned = st.log.reduce((s,l)=>s+(l.pay||0),0);
  return `<main class="wrap stack fade"><section class="panel"><div class="section-title"><h2>Logbook</h2><span class="small muted">${st.log.length} flights · ${fmtH(st.minutes)} · ${money(earned)} earned</span></div>
    <div class="scroll-x"><table><thead><tr><th>Day</th><th>Route</th><th>Aircraft</th><th>Flight</th><th class="num">Block</th><th>Landing</th><th>Grade</th><th class="num">Net pay</th></tr></thead>
    <tbody>${st.log.map(l=>`<tr><td class="mono">${l.day} · ${hhmm(l.dep)}</td><td class="mono">${esc(l.from)} → ${esc(l.to)}</td><td>${esc(AC[l.ac]?.n||l.ac)}</td><td>${esc(l.title)}</td><td class="num">${durTxt(l.min)}</td><td>${esc((LANDING[l.landing]?.n||'').split(' (')[0])}</td><td><b>${l.grade}</b>${l.verified?' <span class="chip sea" title="Recorded by MSFS">MSFS</span>':''}</td><td class="num">${money(l.pay)}</td></tr>`).join('')}</tbody></table></div></section></main>`;
}

/* ---------- company ---------- */


/* ---------- hangar ---------- */

/* ---------- render ---------- */
function goBase(v){ if(v==='flight' && S.mcp && S.simState!=='nobridge') setTimeout(()=>simPoll(true),0); S.view=v; S.confirm=null; if(v!=='flight'){ S.debrief=false; } if(location.hash!=='#'+v){ try{ history.replaceState(null,'','#'+v); }catch(e){ location.hash=v; } } render(); window.scrollTo(0,0); }

/* ---------- AI ---------- */
function castBible(){ return Object.values(CAST).map(c=>`- ${c.n}: ${c.role}. ${c.bio}`).join('\n'); }
async function aiBrief(){
  const st=S.st; const job=st.active?.job; if(!job||!S.sample) return;
  S.busy.brief=true; S.busy.briefErr=''; S.keepScroll=true; render();
  const a=AC[job.ac]; const recent = st.journal.slice(0,4).map(j=>j.title).join('; ');
  const prompt = `You write the pre-flight story briefings for "Trade Winds", a flight-simulator career game set in the Caribbean. The player flies each job for real in Microsoft Flight Simulator 2024.

Write the briefing for the flight below. Keep every fact exactly as given (airports, aircraft, passenger count, cargo, time of day, weather). Second person, present tense. Warm, vivid and specific to the place, like a good travel writer who is also a pilot. Three short paragraphs, about 200 words in total. Include one line of dialogue from the client or a recurring character. Don't invent emergencies or twists, and don't mention sealed orders.

Recurring cast (use one only if it fits naturally):
${castBible()}

Pilot: ${st.pilot.name}, ${topRating(st).n}, ${(st.minutes/60).toFixed(1)} career hours, reputation ${st.reputation}/100. Recent journal: ${recent}.

Flight: ${job.title} (${job.label})
Client: ${job.client||'n/a'}
From: ${AP[job.from].n}, ${AP[job.from].isl} (${job.from})
To: ${job.local?'local flight returning to the same airport':`${AP[job.to].n}, ${AP[job.to].isl} (${job.to})`}
Aircraft: ${a.n}
Passengers: ${job.pax}; cargo: ${job.cargo} lb${job.cargoLabel?` (${job.cargoLabel})`:''}
Departure: ${hhmm(job.dep)} local (${timeLabel(job.dep)})
Weather: ${job.wx.n}. ${job.wx.desc}
Outline to build on: ${(job.paras||[]).join(' ')}

Reply with only JSON: {"headline": "max 8 words", "paragraphs": ["...", "...", "..."], "passenger_note": "one sentence on what the client cares about most"}`;
  try{
    const r = await S.sample.json(prompt, { modelTier:'default', cache:false });
    if(r && Array.isArray(r.paragraphs) && r.paragraphs.length){ job.ai = { headline:String(r.headline||job.title).slice(0,90), paragraphs:r.paragraphs.slice(0,4).map(String), passenger_note:String(r.passenger_note||'') }; save(); }
    else S.busy.briefErr = `Claude's answer came back in an unexpected shape. Try again.`;
  }catch(e){ S.busy.briefErr = aiErr(e); }
  S.busy.brief=false; S.keepScroll=true; render();
}
function aiErr(e){ const c=e&&e.code; if(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(c)){ S.sampleOff=true; return `Claude isn't available on this page right now.`; } if(c==='rate_limited') return `Claude is busy. Try again in a minute.`; if(c==='cancelled') return ''; if(c==='invalid_json') return `The answer didn't come back in the expected format. Try again.`; return `Couldn't reach Claude. Try again.`; }

/* ---------- events ---------- */
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-act]'); if(!b) return;
  const act=b.dataset.act; const st=S.st;
  if(b.tagName==='A') e.preventDefault();
  switch(act){
    case 'nav': go(b.dataset.v); return;
    case 'map-sel': S.mapSel=b.dataset.k; S.keepScroll=true; render(); return;
    case 'map-zoom': S.mapZoom=b.dataset.z; S.keepScroll=true; render(); return;
    case 'accept': { const job = st.jobs.find(j=>j.id===b.dataset.id); if(!job) return; st.jobs = st.jobs.filter(j=>j.id!==job.id); st.followups=(st.followups||[]).filter(x=>x.id!==job.id); st.active={job, accepted:Date.now()}; save(); S.debrief=false; S.showResult=false; go('flight'); return; }
    case 'accept-story': { const m = STORY.find(x=>x.id===b.dataset.id); const sel = document.querySelector(`[data-story-ac="${m.id}"]`); const acs = storyAircraft(st,m); const acId = sel?sel.value:acs[0]; if(!acId) return; st.active={job:storyJob(st,m,acId), accepted:Date.now()}; save(); S.showResult=false; go('flight'); return; }
    case 'deadhead': { const to=b.dataset.to; if(!to||!AP[to]) return; const d=deadheadCost(st,to); if(st.cash<d.cost) return; txn(st,-d.cost,'Travel','Deadhead to '+to); st.duty+=d.min; st.clock+=d.min; st.loc=to; st.visited[to]=true; st.jobsKey=''; addJournal(st, `Deadheaded to ${AP[to].isl}`, `Rode in the back of an airliner to ${AP[to].n}. ${money(d.cost)} for the ticket and a window seat.`, [], 'travel'); save(); toast(`You're now at ${to}.`); render(); window.scrollTo(0,0); return; }
    case 'rest': { const net = rest(st); save(); toast(net!=null ? `New day. Company net yesterday: ${money(net)}` : `New day. Fresh jobs are posted.`); render(); window.scrollTo(0,0); return; }
    case 'start': st.active.started = Date.now(); save(); S.keepScroll=true; render(); simArm(); return;
    case 'open': S.confirm='open'; S.keepScroll=true; render(); return;
    case 'open-req': st.active.reqOpen=true; save(); S.keepScroll=true; render(); return;
    case 'ai-surprise': aiSurprise(); return;
    case 'open-yes': st.active.opened=true; S.confirm=null; save(); S.keepScroll=true; render(); return;
    case 'cancel': S.confirm='cancel'; S.keepScroll=true; render(); return;
    case 'cancel-yes': { const j=st.active.job; if(j.kind==='gen'){ st.reputation=clamp(st.reputation-3,0,100); } st.active=null; S.confirm=null; save(); toast('Job cancelled.'); go('board'); return; }
    case 'confirm-no': S.confirm=null; S.keepScroll=true; render(); return;
    case 'debrief': S.debrief=true; render(); { const fm=document.getElementById('debrief'); if(fm) simPrefill(fm); } window.scrollTo(0,0); return;
    case 'sim-retry': S.simState = S.mcp ? 'checking' : 'off'; renderSimBits(); simPoll(true); return;
    case 'debrief-back': S.debrief=false; render(); return;
    case 'done-result': S.showResult=false; S.busy.journalDone=false; S.busy.journalErr=''; go('board'); return;
    case 'show-last': S.showResult=true; render(); return;
    case 'ai-brief': aiBrief(); return;
    case 'book-check': { const rid=b.dataset.r; const sel=document.getElementById('cr-'+rid); const acId=sel?sel.value:null; if(!acId) return; st.active={job:checkrideJob(st,rid,acId), accepted:Date.now()}; save(); S.showResult=false; go('flight'); return; }
    case 'sell': S.confirm='sell-'+b.dataset.f; S.keepScroll=true; render(); return;
    case 'copy-save': { const ta=document.getElementById('save-text'); const t=ta.value; if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(()=>toast('Copied.')).catch(()=>{ ta.select(); toast('Press Ctrl+C to copy.'); }); } else { ta.select(); toast('Press Ctrl+C to copy.'); } return; }
    case 'import-save': { try{ const obj=JSON.parse(document.getElementById('save-text').value); if(!obj || !obj.pilot || !obj.ratings) throw 0; S.st=migrate(obj); save(); toast('Career restored.'); go('board'); }catch(err){ toast(`That text isn't a valid save.`); } return; }
    case 'reset': S.confirm='reset'; S.keepScroll=true; render(); return;
    case 'reset-yes': { S.st=null; S.confirm=null; try{ localStorage.removeItem(KEY); }catch(e){} if(S.db){ S.db.doc(DB_DOC).delete().catch(()=>{}); } render(); return; }
  }
});
document.addEventListener('change', e=>{
  const t=e.target;
  if(t.dataset && t.dataset.hangar){ S.st.hangar[t.dataset.hangar]=t.checked; S.st.jobsKey=''; save(); return; }
  if(t.id==='travel-to'){ S.travelTo=t.value; S.keepScroll=true; render(); }
});
document.addEventListener('submit', e=>{
  e.preventDefault(); const form=e.target; const st=S.st;
  if(form.id==='setup-form'){ const name=document.getElementById('pname').value.trim()||'Pilot'; const call=document.getElementById('pcall').value.trim(); S.st=newState(name,call); save(); flush(); go('board'); return; }
  if(form.id==='co-form'){ const name=document.getElementById('coname').value.trim(); if(!name) return; txn(st,-RATINGS.CO.fee,'Licenses & training','Air Operator Certificate'); st.ratings.CO=true; st.company={name, base:st.loc, fleet:[], ledger:[], founded:st.day}; addJournal(st, `Founded ${name}`, `Paperwork filed, certificate framed, a new sign over a borrowed hangar door at ${AP[st.loc].n}. Mari brought cake.`, ['mari','dez'], 'milestone'); save(); toast(`${name} is open for business.`); render(); return; }
  if(form.id==='debrief'){
    const fd = new FormData(form); const job=st.active.job;
    const f = { landing:fd.get('landing'), tdz:fd.get('tdz')==='1', center:fd.get('center')==='1', fuel:parseFloat(document.getElementById('fuel').value)||0, fuelUnit:(document.getElementById('fuelUnit')||{}).value||'pct', block:Math.max(1,parseInt(document.getElementById('block').value,10)||plan(job).est), landedAt:document.getElementById('landedAt').value, checklist:document.getElementById('checklist').checked, radio:document.getElementById('radio').checked, weather:document.getElementById('weather').checked, smooth:document.getElementById('smooth').checked, scen:fd.get('scen')||null, tasks:fd.getAll('task'), bonus: fd.get('bonus')==='1', request: fd.get('request')==='1', verified: form.dataset.simVerified==='1' && form.dataset.simFpm!=null, simFpm: Number(form.dataset.simFpm||0), simBounces: Number(form.dataset.simBounces||0), simG: form.dataset.simG?Number(form.dataset.simG):null, comfort: (S.st.active && S.st.active.cab) ? Math.round(S.st.active.cab.comfort) : null };
    const res = score(job, f); applyResult(st, job, f, res); S.debrief=false; S.showResult=true; S.busy.journalDone=false; save(); render(); window.scrollTo(0,0); return;
  }
});
window.addEventListener('hashchange', ()=>{ const v=location.hash.slice(1); if(VIEWS.some(x=>x[0]===v) && v!==S.view){ S.view=v; S.confirm=null; render(); } });

/* ---------- boot ---------- */
function boot(){
  const local = loadLocal(); S.st = local ? migrate(local) : null;
  const h = location.hash.slice(1); if(VIEWS.some(x=>x[0]===h)) S.view=h;
  render(); connect(); simInit();
  setInterval(()=>{ if(S.st && S.st.active && S.st.active.started && S.view==='flight' && !S.debrief && !S.showResult){ const el=document.querySelector('.chip.good'); if(el && /Block timer/.test(el.textContent)){ el.textContent = `Block timer running: ${durTxt(Math.round((Date.now()-S.st.active.started)/60000))}`; } } }, 30000);
}

/* ---------- extras UI ---------- */
function stars(n){ return `<span class="on">${'★'.repeat(n)}</span><span class="off">${'★'.repeat(5-n)}</span>`; }
function dispatchCardBase(st){
  if(!st.brief || st.brief.day!==st.day){ newDayBrief(st); save(); }
  const b=st.brief; const storm=stormActive(st); const fest=festivalOn(st);
  return `<section class="panel dispatch"><div class="row between"><p class="label">Morning dispatch · Day ${st.day} · ${dateTxt(st.day)}</p><span class="small muted">Coral Wing ops board</span></div>
    <h3 style="margin-top:6px;font-size:18px">${esc(b.headline)}</h3>
    ${storm?`<p class="small" style="color:var(--bad);margin-top:4px">Hurricane ${esc(storm.name)}, Category ${storm.cat}: ${esc(REGIONS[storm.region].name)} through day ${storm.until}. ${hasRating(st,'IR')?'Instrument conditions on routes there, and relief flights pay 30% more.':'Flights there need an Instrument Rating until it passes.'}</p>`:''}
    ${fest.length?`<p class="small" style="margin-top:4px"><b>${esc(fest.map(f=>f.n).join(', '))}</b> is on. Charters to ${esc(fest.map(f=>AP[f.ap].isl).join(', '))} pay 40% more.</p>`:''}
    <div class="msgs">${b.msgs.map(m=>`<div class="msg">${avatar(m.from)}<div style="min-width:0"><b class="small">${esc(CAST[m.from].n.replace(/ ".*?"/,''))}</b><p class="small">${esc(m.text)}</p></div></div>`).join('')}</div>
    <p class="small tip"><b>Pilot tip:</b> ${esc(b.tip)}</p></section>`;
}
function pilotExtras(st){
  const r=rankOf(st); const got=ACH.filter(a=>st.ach&&st.ach[a.id]);
  const last=st.log.slice(0,20).reverse(); const W=600,H=150,P=24;
  let chart='<p class="small muted">Fly a few flights to see your trend.</p>';
  if(last.length>=2){ const x=i=>P+i*(W-2*P)/(last.length-1), y=v=>H-P-(v/100)*(H-2*P);
    const pts=last.map((l,i)=>`${x(i).toFixed(1)},${y(l.score).toFixed(1)}`).join(' ');
    chart=`<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Scores of your last ${last.length} flights">${[50,70,90].map(v=>`<line x1="${P}" x2="${W-P}" y1="${y(v)}" y2="${y(v)}" class="cg"/><text x="2" y="${y(v)+4}" class="ct">${v}</text>`).join('')}<polyline points="${pts}" class="cl"/>${last.map((l,i)=>`<circle cx="${x(i)}" cy="${y(l.score)}" r="4.5" class="cd g${l.grade}"><title>Day ${l.day}: ${esc(l.title)} · ${l.score}${l.fpm?` · ${l.fpm} fpm`:''}</title></circle>`).join('')}</svg>`; }
  return `<div class="grid-2">
    <section class="panel stack"><div class="row between"><h3>Score trend</h3><span class="small muted">Last ${last.length} flights</span></div>${chart}</section>
    <section class="panel stack"><p class="label">Rank</p><h2>${esc(r.name)}</h2>${r.next?`<div class="meter"><i style="width:${r.pct}%"></i></div><p class="small muted">${(st.minutes/60).toFixed(1)} of ${r.nextH} hours to ${esc(r.next)}</p>`:'<p class="small">The top of the ladder.</p>'}</section>
  </div>
  <section><div class="section-title"><h2>Achievements</h2><span class="small muted">${got.length} of ${ACH.length}</span></div>
    <div class="achs">${ACH.map(a=>{ const on=st.ach&&st.ach[a.id]; return `<div class="ach ${on?'on':''}"><b>${esc(a.n)}</b><span class="small muted">${esc(a.d)}</span>${on?`<span class="tiny mono">Day ${on}</span>`:''}</div>`; }).join('')}</div></section>`;
}

document.addEventListener('keydown', e=>{ if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('g[data-act]')){ e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click',{bubbles:true})); } });

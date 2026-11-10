/* ===================== UI ===================== */
const S = { st:null, view:'board', debrief:false, showResult:false, confirm:null, toast:null, sample:null, sampleOff:false, db:null, sync:'device', busy:{}, travelTo:'', saveTimer:null, saving:false, pending:false };
const app = document.getElementById('app');
const VIEWS = [['board','Job board'],['map','Map'],['flight','Flight'],['cockpit','Cockpit'],['pilot','Pilot'],['story','Story'],['log','Logbook'],['money','Money'],['company','Company'],['hangar','Hangar']];

/* ---------- persistence ---------- */
function loadLocal(){ try{ const t=localStorage.getItem(KEY); return t?JSON.parse(t):null; }catch(e){ return null; } }
function save(){ const st=S.st; if(!st) return; st.savedAt=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){}
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
var toast; /* defined in full below (047-core.js) */
var renderToast; /* defined in full below (047-core.js) */
function topRating(st){ const order=['ATP','JET','TURB','IR','COMM','PPL']; for(const r of order) if(st.ratings[r]) return RATINGS[r]; return RATINGS.PPL; }
function syncText(){ return {account:'Saved to your account', device:'Saved in this browser', full:'Account storage full: saving in this browser'}[S.sync]; }
function renderSync(){ const el=document.getElementById('sync'); if(el) el.textContent=syncText(); }


var dutyAfter; /* defined in full below (061-core.js) */
function avatar(k){ const c=CAST[k]; const ini=c.n.replace(/".*?"\s*/,'').split(' ').filter(w=>/^[A-Z]/.test(w)).slice(-2).map(w=>w[0]).join(''); return `<div class="avatar" style="background:${c.col}" aria-hidden="true">${esc(ini)}</div>`; }


/* ---------- band ---------- */


/* ---------- setup ---------- */


/* ---------- board ---------- */

function boardView(){
  const st=S.st; ensureJobs(st);
  const here=AP[st.loc];
  const _sa = storyAvailable(st); const stories = _sa.filter(m=>!m.side).slice(0,2).concat(_sa.filter(m=>m.side).slice(0,1));
  const ready = RATING_ORDER.filter(r=>r!=='CO' && checkrideReady(st,r).ok);
  const locWx = genLocWx(st);
  const dutyPct = Math.min(100, st.duty/DUTY_MAX*100);
  let storyHTML = stories.map(m=>{
    const acs = storyAircraft(st, m);
    if(st.loc!==m.from){
      const dh = deadheadCost(st, m.from);
      const pseudo = storyJob(st, m, acs[0]||m.ac[0]);
      return stripHTML(st, pseudo, {btn: `<button class="btn sm" data-act="deadhead" data-to="${m.from}" ${st.active||st.cash<dh.cost?'disabled':''}>Deadhead to ${m.from} · ${money(dh.cost)}</button>`});
    }
    if(!acs.length){ const pseudo = storyJob(st, m, m.ac[0]); return stripHTML(st, pseudo, {locked:true, btn:`<span class="chip warn">Needs: ${m.ac.map(k=>AC[k].n.replace(/^(Cessna|Beechcraft|Diamond|CubCrafters|Zlin|ICON|de Havilland Canada|Grumman|Pilatus|Daher|Douglas|Cirrus|Airbus|Boeing|Heart Aerospace)\s/,'')).slice(0,3).join(' / ')}</span>`}); }
    const job = storyJob(st, m, acs[0]);
    const sel = acs.length>1 ? `<label class="row small" style="margin-top:8px;gap:6px"><span class="muted">Fly it in</span><select data-story-ac="${m.id}" style="width:auto;max-width:100%;padding:5px 8px;font-size:13px">${acs.map(k=>`<option value="${k}">${esc(AC[k].n)}</option>`).join('')}</select></label>` : '';
    return stripHTML(st, job, {extra:sel, btn: st.active ? `<button class="btn sm" disabled>Flight booked</button>` : `<button class="btn action sm" data-act="accept-story" data-id="${m.id}">Accept</button>`});
  }).join('');
  const jobsHTML = st.jobs.length ? st.jobs.map(j=>stripHTML(st,j)).join('') : `<div class="empty"><h3>No work at ${esc(st.loc)} right now</h3><p>Rest until tomorrow for new jobs, or deadhead to a busier airport.</p></div>`;
  const regions = allowedRegions(st);
  const dests = Object.keys(AP).filter(k=>k!==st.loc && !AP[k].water && regions.includes(AP[k].r)).sort((a,b)=>AP[a].isl.localeCompare(AP[b].isl));
  const tv = S.travelTo && dests.includes(S.travelTo) ? S.travelTo : dests[0];
  const dh = tv ? deadheadCost(st, tv) : null;
  const rw = rwyAnalysis(st.loc, locWx);
  return `<main class="wrap">${todayHero(st)}<div class="grid-2">
   <div class="stack fade">
    ${campaignCard(st)}${dispatchCard(st)}
    ${st.active ? `<div class="notice"><b>Flight booked:</b> ${esc(st.active.job.title)} (${esc(st.active.job.from)} → ${esc(st.active.job.to)}). <a href="#flight" data-act="nav" data-v="flight">Open the briefing</a></div>`:''}
    ${st.clock>=1440 || st.duty>=DUTY_MAX ? `<div class="notice warn"><b>You're out of duty time for today.</b> Rest to start a new day with fresh jobs.</div>`:''}
    ${stories.length ? `<section><div class="section-title"><h2>Story missions</h2><span class="muted small">Chapters you can fly from here today</span></div><div class="jgrid">${storyHTML}</div></section>`:''}
    ${ready.length ? `<div class="notice"><b>Checkride ready:</b> ${ready.map(r=>RATINGS[r].n).join(', ')}. <a href="#pilot" data-act="nav" data-v="pilot">Book it on the Pilot tab</a></div>`:''}
    <section><div class="section-title"><h2>Jobs at ${esc(st.loc)}</h2><div class="row"><span class="muted small">${st.company?'Coral Wing work and your own company\'s contracts':'Posted by Coral Wing dispatch'}</span>${S.sample && !S.sampleOff?`<button class="btn sm action" data-act="ai-surprise" ${S.busy.surprise||st.active?'disabled':''}>${S.busy.surprise?'Dispatch is on the phone…':'Surprise me'}</button>`:''}</div></div>${S.busy.surpriseErr?`<p class="small" style="color:var(--bad);margin-bottom:8px">${esc(S.busy.surpriseErr)}</p>`:''}<div class="jgrid">${jobsHTML}</div></section>
   </div>
   <aside class="stack">
    ${goalsHTML(st)}
    <div class="panel">
      <p class="label">${esc(COUNTRY[here.c])}</p>
      <h2 style="margin-top:2px">${esc(here.n)}</h2>
      <p class="muted small">${esc(here.isl)} · ${esc(st.loc)} · elevation ${here.el} ft</p>
      <div class="metar" style="margin-top:12px">${esc(metar(st.loc, locWx, st.day, st.clock))}</div>
      <dl class="kv" style="margin-top:12px">
        <dt>Weather</dt><dd>${esc(locWx.n)}</dd>
        <dt>Runways</dt><dd class="mono">${here.rw.map(r=>`${r[0]} · ${r[1].toLocaleString()} ft`).join('<br>')}</dd>
        <dt>In use</dt><dd>Runway ${esc(rw.rw)} · ${Math.round(rw.head)} kt headwind, ${Math.round(rw.xw)} kt crosswind</dd>
        <dt>Fuel</dt><dd class="mono">Avgas $${fuelPrice(st,st.loc,'avgas').toFixed(2)} · Jet-A $${fuelPrice(st,st.loc,'jeta').toFixed(2)}</dd>
      </dl>
      <p class="small" style="margin-top:10px">${esc(here.note)}</p>
    </div>
    <div class="panel stack">
      <div class="row between"><h3>Duty day</h3><span class="mono small">${durTxt(st.duty)} / 10 h</span></div>
      <div class="meter ${dutyPct>85?'bad':dutyPct>65?'warn':''}"><i style="width:${dutyPct}%"></i></div>
      <p class="small muted">Pilots get 10 hours of duty per day, counting waiting time, flights and turnarounds.</p>
      <button class="btn" data-act="rest" ${st.active?'disabled':''}>Rest until tomorrow, 07:00</button>
    </div>
    <div class="panel stack">
      <h3>Travel as a passenger</h3>
      <p class="small muted">Deadhead on an airline seat to another airport. Costs a ticket and some duty time, and you don't log the hours.</p>
      <label class="field"><span class="sr">Destination</span><select id="travel-to">${dests.map(k=>`<option value="${k}" ${k===tv?'selected':''}>${esc(AP[k].isl)} · ${k}</option>`).join('')}</select></label>
      ${dh?`<p class="small mono">${dh.d} nm · ${money(dh.cost)} · ~${durTxt(dh.min)}</p>`:''}
      <button class="btn" data-act="deadhead" data-to="${tv||''}" ${st.active||!dh||st.cash<dh.cost?'disabled':''}>Book the seat</button>
    </div>
    <details class="panel"><summary>How a flight works</summary>
      <ol class="tight small" style="margin-top:8px">
        <li>Accept a job. The Flight tab gives you the story, the route, the weather to set in MSFS and the load sheet.</li>
        <li>Set up MSFS exactly as the briefing says, then press <b>Start flight</b> to run the block timer.</li>
        <li>If there are sealed orders, open them at the trigger point and handle the situation.</li>
        <li>After shutdown, press <b>Log the landing</b> and report honestly. Your grade drives pay, reputation and story outcomes.</li>
      </ol></details>
   </aside></div></main>`;
}
function genLocWx(st){ const k=st.loc+'|'+st.day; if(!st.locWx || st.locWx.k!==k){ st.locWx = {k, wx: genWx(st, st.loc, null, st.clock)}; } return st.locWx.wx; }

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
function flightView(){
  const st=S.st;
  if(S.showResult && st.last) return resultView();
  if(!st.active){
    return `<main class="wrap"><div class="empty fade"><h3>No flight booked</h3><p>Pick a job from the board to get your briefing.</p><p style="margin-top:14px"><button class="btn primary" data-act="nav" data-v="board">Go to the job board</button>${st.last?` <button class="btn" data-act="show-last">See last result</button>`:''}</p></div></main>`;
  }
  const job = st.active.job; const a=AC[job.ac]; const p=plan(job); const from=AP[job.from], to=AP[job.to];
  if(S.debrief) return debriefView(job, p);
  const sc = job.scen ? SCEN[job.scen] : null;
  const started = st.active.started; const mins = started ? Math.round((Date.now()-started)/60000) : 0;
  const rwDep = rwyAnalysis(job.from, job.wx, job.ac), rwArr = rwyAnalysis(job.to, job.wx, job.ac);
  const ai = job.ai;
  const teach = [...(job.teachStory||[]), ...autoTeach(st, job, p)];
  const loadRows = [
    ['Passengers', job.pax ? `${job.pax} × ${a.cls==='airliner'||a.cls==='widebody'?185:190} lb = ${p.paxLb.toLocaleString()} lb` : '—'],
    ['Bags', p.bagLb ? `${p.bagLb.toLocaleString()} lb` : '—'],
    ['Cargo', job.cargo ? `${job.cargo.toLocaleString()} lb${job.cargoLabel?` (${esc(job.cargoLabel)})`:''}` : '—'],
    ['Pilot', `170 lb`],
    ['Payload', `${p.payload.toLocaleString()} lb`],
  ];
  const fuelRows = a.fuel==='elec' ? [['Energy', `Battery-electric with hybrid reserve. Leave with at least 20% battery for reserve.`]] : [
    ['Trip', `${p.tripLb.toLocaleString()} lb`],['Contingency 10%', `${p.contLb.toLocaleString()} lb`],[`Reserve (${p.reserveMin} min)`, `${p.resLb.toLocaleString()} lb`],
    ...(p.altLb?[[`Alternate ${p.altCode} (${p.altNm} nm)`, `${p.altLb.toLocaleString()} lb`]]:[]),['Taxi', `${Math.round(a.burn*0.08).toLocaleString()} lb`],
    ['Minimum fuel', `<b>${p.fuelLb.toLocaleString()} lb</b> (${p.gal.toLocaleString()} US gal ${a.fuel==='avgas'?'avgas':'Jet-A'})${['airliner','widebody'].includes(a.cls)?` · ${Math.round(p.fuelLb/2.2046).toLocaleString()} kg`:''}`]];
  return `<main class="wrap stack fade">
    ${boardingPass(st, job, p, a, started, mins, ai)}
    <div class="grid-2">
     <div class="stack">
      <section class="panel stack">
        <div class="row between"><h2>Briefing</h2>${S.sample && !S.sampleOff ? `<button class="btn sm" data-act="ai-brief" ${S.busy.brief?'disabled':''}>${S.busy.brief?'Writing…':ai?'Rewrite with Claude':'Write the full story with Claude'}</button>`:''}</div>
        <div class="brief ${ai?'ai':''}">${(ai?ai.paragraphs:job.paras).map(t=>`<p>${esc(t)}</p>`).join('')}</div>
        ${ai?.passenger_note?`<p class="small"><b>What matters to them:</b> ${esc(ai.passenger_note)}</p>`:''}
        ${S.busy.briefErr?`<p class="small" style="color:var(--bad)">${esc(S.busy.briefErr)}</p>`:''}
      </section>
      ${job.kind==='check' ? `<section class="panel"><h2>Checkride tasks</h2><p class="small muted" style="margin-top:4px">Fly every task. You'll tick off the ones you completed in the debrief.</p><ul class="tight">${job.tasks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>`:''}
      ${job.bonus?`<section class="notice"><b>Bonus objective (+${money(job.bonus.amt)}):</b> ${esc(job.bonus.text)}${job.bonus.auto==='fpm'?' <span class="muted small">(checked from your landing)</span>':job.bonus.auto==='block'?' <span class="muted small">(checked from your block time)</span>':''}</section>`:''}
      ${job.festival?`<section class="notice"><b>${esc(job.festival)}</b> is on at the destination: busy ramp, crowded frequency, and 40% extra pay.</section>`:''}
      ${job.stormName?`<section class="notice bad"><b>Hurricane ${esc(job.stormName)}</b> is affecting this route. Expect instrument conditions, strong gusts and heavy rain. Turning back is always an option.</section>`:''}
      <section class="teach"><h3>What this flight teaches</h3><ul class="tight small">${teach.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>
      ${sc ? (st.active.opened ? `<section class="opened"><p class="label">Sealed orders, opened</p><h3 style="margin:4px 0 6px">${esc(sc.n)}</h3><p>${esc(sc.text)}</p><p class="small" style="margin-top:8px"><b>In the sim:</b> ${esc(sc.sim)}</p></section>`
        : `<section class="sealed"><p class="label">Sealed orders</p><h3 style="margin:4px 0 6px">Do not open yet</h3><p class="small">${esc(sc.trigger)} Something will happen on this flight. You'll be graded on how you handle it.</p>${S.confirm==='open' ? `<div class="row" style="margin-top:10px"><span class="small">Have you reached the trigger point?</span><button class="btn action sm" data-act="open-yes">Open them</button><button class="btn sm" data-act="confirm-no">Not yet</button></div>`:`<button class="btn action sm" style="margin-top:10px" data-act="open">Open sealed orders</button>`}</section>`) : ''}
      ${surpriseFlightHTML(job)}
      <section class="panel stack">
        <h2>Conditions</h2>
        <p><b>${esc(job.wx.n)}</b> <span class="chip ${job.wx.cat==='VFR'?'good':job.wx.cat==='MVFR'?'warn':'bad'}">${job.wx.cat}</span></p>
        <p class="small muted">${esc(job.wx.desc)}</p>
        <div><p class="label">Departure ${esc(job.from)}</p><div class="metar">${esc(metar(job.from, job.wx, st.day, job.dep))}</div></div>
        ${job.local?'':`<div><p class="label">Destination ${esc(job.to)}</p><div class="metar">${esc(metar(job.to, job.wx, st.day, job.dep + p.est))}</div></div>`}
        <dl class="kv">
          <dt>Departure runway</dt><dd>${rwDep.water?'Water':esc(rwDep.rw)} · ${Math.round(rwDep.head)} kt head, ${Math.round(rwDep.xw)} kt cross</dd>
          ${job.local?'':`<dt>Arrival runway</dt><dd>${rwArr.water?'Into the wind':esc(rwArr.rw)} · ${Math.round(rwArr.head)} kt head, ${Math.round(rwArr.xw)} kt cross ${rwArr.over?'<span class="chip bad">Over crosswind limit</span>':''}</dd>`}
          ${from.water?'':`<dt>Density altitude</dt><dd>${densityAlt(from.el, job.wx.t, job.wx.qnh).toLocaleString()} ft at ${esc(job.from)}</dd>`}
        </dl>
      </section>
      <section class="panel stack">
        <h2>Load & fuel</h2>
        <div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
          <div><p class="label">Load sheet</p><dl class="kv" style="margin-top:6px">${loadRows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl></div>
          <div><p class="label">Fuel plan</p><dl class="kv" style="margin-top:6px">${fuelRows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl></div>
        </div>
        <p class="small">Takeoff weight check: payload ${a.fuel==='elec'?'':'+ fuel '}= ${p.total.toLocaleString()} lb of ${p.useful.toLocaleString()} lb useful load. ${p.over>0?`<b style="color:var(--bad)">Over by ${p.over} lb.</b>`:`<span style="color:var(--good)">Within limits.</span>`}</p>
      </section>
     </div>
     <aside class="stack">
      <section class="panel stack" id="simpanel">${simPanelHTML()}</section>
      <section class="panel stack">
        <h3>Set up MSFS</h3>
        <ol class="tight small">
          <li><b>Aircraft:</b> ${esc(a.n)}, any livery.</li>
          <li><b>Departure:</b> ${esc(job.from)}${from.water?'':`, runway ${esc(rwDep.rw)} or a parking spot`}.</li>
          <li><b>Destination:</b> ${job.local?`local flight, back to ${esc(job.from)}`:to.water?`${esc(to.n)}: add a custom waypoint at ${to.lat.toFixed(3)}, ${to.lon.toFixed(3)} and land on the water nearby`:`${esc(job.to)} (${esc(to.n)})`}.</li>
          <li><b>Time:</b> ${hhmm(job.dep)} local, ${dateOf(st.day).toLocaleDateString('en-US',{month:'long',day:'numeric',timeZone:'UTC'})}.</li>
          <li><b>Weather (custom):</b> wind ${pad3(job.wx.dir)}° at ${job.wx.spd} kt${job.wx.gust?` gusting ${job.wx.gust}`:''}, ${job.wx.t} °C, visibility ${job.wx.vis>=10?'10+ sm':job.wx.vis+' sm'}${job.wx.wx?` with ${({HZ:'haze','-SHRA':'light showers',SHRA:'showers',TSRA:'thunderstorms'})[job.wx.wx]||job.wx.wx}`:''}, ${job.wx.cl.map(c=>`${c[0]} ${c[1].toLocaleString()} ft`).join(', ')}, pressure ${job.wx.qnh} hPa. Or use live weather and fly what you get.</li>
          <li><b>Fuel:</b> ${a.fuel==='elec'?'full charge':`at least ${p.fuelLb.toLocaleString()} lb (${p.gal} gal), more if you like a bigger margin`}. <b>Payload:</b> ${p.payload.toLocaleString()} lb.</li>
          ${job.scen?`<li><b>Failures:</b> leave them off. Your sealed orders will tell you what to simulate.</li>`:''}
        </ol>
      </section>
      <section class="panel stack">
        <h3>Route</h3>
        <dl class="kv">
          <dt>Distance</dt><dd>${p.dist} nm${job.local?' (suggested loop)':''}</dd>
          ${p.hdg!=null?`<dt>Course</dt><dd>${pad3(p.hdg)}° true</dd>`:''}
          <dt>Planned time</dt><dd>${durTxt(p.est)} block</dd>
          <dt>Alternate</dt><dd>${p.altCode?`${esc(p.altCode)}, ${esc(AP[p.altCode].isl)} (${p.altNm} nm)`:'—'}</dd>
          <dt>Rules</dt><dd>${p.ifr?'IFR':'VFR'}${isNight(job.dep)?' · night':''}</dd>
          <dt>Pay</dt><dd>${job.kind==='check'?'Checkride (no pay)':job.company?`${money(Math.round(job.pay*2.6))} revenue, ${money(a.op)}/h operating cost`:money(job.pay)+' (scaled by your grade)'}</dd>
        </dl>
      </section>
      <section class="panel stack">
        <div class="row between"><h3>${esc(a.n)}</h3>${!st.types[job.ac]?'<span class="chip new">New type</span>':`<span class="chip">${st.types[job.ac]} flight${st.types[job.ac]===1?'':'s'}</span>`}</div>
        <p class="small">${esc(a.note)}</p>
        <p class="small mono">${esc(a.v)}</p>
        <p class="small muted">${a.pax} pax · ${a.cruise} kt · ${a.range.toLocaleString()} nm range · needs ${a.rwy.toLocaleString()} ft runway</p>
      </section>
      ${job.local?'':`<section class="panel stack"><h3>${esc(to.n)}</h3><p class="small muted">${esc(to.isl)} · ${esc(COUNTRY[to.c])}</p><p class="small">${esc(to.note)}</p>${to.rw?`<p class="small mono">${to.rw.map(r=>`${r[0]} · ${r[1].toLocaleString()} ft`).join(' / ')}</p>`:''}</section>`}
     </aside>
    </div></main>`;
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
function resultView(){
  const st=S.st; const {job,res,out} = st.last; const sc = job.scen?SCEN[job.scen]:null;
  const passFail = job.kind==='check' ? (out.pass?`<span class="chip good">Passed</span>`:`<span class="chip bad">Not passed</span>`) : '';
  return `<main class="wrap stack fade">
    <section class="panel"><div class="row" style="gap:24px;align-items:center">
      ${scoreRing(res)}
      <div class="stack" style="gap:4px;min-width:0;flex:1">
        <p class="label">Flight complete · score ${res.score}/100</p>
        <h1 style="font-size:28px">${esc(job.title)}</h1>
        <p class="muted">${esc(job.from)} → ${esc(st.log[0]?.to||job.to)} · ${esc(AC[job.ac].n)} · ${durTxt(res.block)}</p>
        <div class="row">${st.last.f && st.last.f.verified?`<span class="chip sea">Verified by MSFS · ${st.last.f.simFpm} fpm</span>`:''}${passFail}${out.pay?`<span class="chip good">+${money(out.pay)}</span>`:''}${out.costs?`<span class="chip bad">−${money(out.costs)}</span>`:''}<span class="chip">Reputation ${st.reputation}/100</span></div>
      </div></div></section>
    ${out.story?`<section class="panel"><p class="label">Outcome</p><div class="brief" style="margin-top:6px"><p>${esc(out.story)}</p></div></section>`:''}
    ${surpriseResultHTML(out)}
    ${out.ach&&out.ach.length?`<section class="panel ach-pop"><p class="label">Achievement unlocked</p><div class="row" style="margin-top:6px">${out.ach.map(a=>`<div class="medal"><b>${esc(a.n)}</b><span class="small muted">${esc(a.d)}</span></div>`).join('')}</div></section>`:''}
    ${out.review?`<section class="panel"><p class="label">Passenger review</p><p class="stars" aria-label="${out.review.stars} of 5 stars">${stars(out.review.stars)}</p><p class="brief" style="margin-top:4px">"${esc(out.review.text)}"</p><p class="small muted">${esc(out.review.who)}</p></section>`:''}
    ${out.notes.length?`<section class="notice"><ul class="tight">${out.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></section>`:''}
    <div class="grid-2">
      <section class="panel"><h2>Scorecard</h2><div class="scroll-x" style="margin-top:8px"><table><thead><tr><th>Item</th><th class="num">Points</th><th class="num">Max</th></tr></thead><tbody>${res.parts.map(p=>`<tr><td style="white-space:normal">${esc(p[0])}</td><td class="num">${p[1]}</td><td class="num">${p[2]}</td></tr>`).join('')}</tbody></table></div></section>
      ${sc?`<section class="teach"><h3>By the book: ${esc(sc.n)}</h3><ul class="tight small">${sc.book.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></section>`:'<div></div>'}
    </div>
    <div class="row">
      <button class="btn primary" data-act="done-result">Back to the job board</button>
      ${S.sample && !S.sampleOff ? `<button class="btn" data-act="ai-journal" ${S.busy.journal?'disabled':''}>${S.busy.journal?'Writing…':'Write a journal entry with Claude'}</button>`:''}
      ${S.busy.journalDone?`<span class="small" style="color:var(--good)">Added to your Story journal.</span>`:''}
      ${S.busy.journalErr?`<span class="small" style="color:var(--bad)">${esc(S.busy.journalErr)}</span>`:''}
    </div></main>`;
}

/* ---------- pilot ---------- */
function pilotView(){
  const st=S.st; const s=st.stats;
  const rungs = RATING_ORDER.map(rid=>{
    const R=RATINGS[rid]; const earned=!!st.ratings[rid]; const chk = checkrideReady(st, rid);
    let action='';
    if(earned) action = `<span class="chip good">Earned</span>`;
    else if(rid==='CO') action = chk.ok ? `<button class="btn sm action" data-act="nav" data-v="company">Apply on the Company tab</button>` : '';
    else if(chk.ok){ const acs = checkrideAircraft(st, rid); action = acs.length ? `<div class="row"><select id="cr-${rid}" style="width:auto;padding:6px 8px;font-size:13px" aria-label="Checkride aircraft">${acs.map(k=>`<option value="${k}">${esc(AC[k].n)}</option>`).join('')}</select>${feeSelect(st,rid)}<button class="btn sm action" data-act="book-check" data-r="${rid}" ${st.active?'disabled':''}>Book checkride</button></div>` : `<span class="chip warn">No suitable aircraft in your hangar</span>`; }
    const req = R.req||{}; const hrsPct = req.hours ? Math.min(100, st.minutes/60/req.hours*100) : 100;
    return `<div class="rung ${earned?'earned':chk.ok?'ready':''}">
      <div class="badge">${R.code}</div>
      <div style="min-width:0"><div class="row" style="gap:8px"><b>${esc(R.n)}</b>${R.dest?`<span class="chip">${R.dest}</span>`:''}</div>
        <p class="small muted">${esc(R.unlocks||R.blurb||'')}</p>
        ${!earned && req.hours ? `<div class="row small" style="margin-top:6px;gap:8px"><div class="meter" style="flex:1;min-width:120px"><i style="width:${hrsPct}%"></i></div><span class="mono">${(st.minutes/60).toFixed(1)} / ${req.hours} h</span></div>`:''}
        ${!earned && !chk.ok && chk.miss?.length ? `<p class="tiny muted" style="margin-top:4px">Needs: ${esc(chk.miss.join(' · '))}</p>`:''}
      </div><div>${action}</div></div>`;
  }).join('');
  const types = Object.keys(st.types).sort((a,b)=>st.types[b]-st.types[a]);
  const landTot = ['butter','smooth','firm','hard','crash'].reduce((t,k)=>t+(s[k]||0),0)||1;
  return `<main class="wrap stack fade">
    
    ${licenseCard(st)}
    ${pilotExtras(st)}
    <div class="grid-2">
      <section><div class="section-title"><h2>Ratings & qualifications</h2><span class="small muted">Earn each one with a checkride</span></div><div class="ladder">${rungs}</div></section>
      <aside class="stack">
        <section class="panel stack"><h3>Landings</h3>${['butter','smooth','firm','hard','crash'].map(k=>`<div><div class="row between small"><span>${LANDING[k].n}</span><span class="mono">${s[k]||0}</span></div><div class="meter ${k==='hard'?'warn':k==='crash'?'bad':''}"><i style="width:${(s[k]||0)/landTot*100}%"></i></div></div>`).join('')}
        <p class="small muted">Diversions: ${s.diverts} · Emergencies handled by the book: ${s.scen}</p></section>
        <section class="panel stack"><h3>Types flown</h3>${types.length?`<ul class="tight small">${types.map(k=>`<li>${esc(AC[k].n)} <span class="muted">· ${st.types[k]} flight${st.types[k]===1?'':'s'}</span></li>`).join('')}</ul>`:'<p class="small muted">None yet. Your first flight adds one.</p>'}
        <p class="small muted">Airports visited: ${Object.keys(st.visited).length} of ${Object.keys(AP).filter(k=>!AP[k].water).length}</p></section>
      </aside></div></main>`;
}

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
function go(v){ if(v==='flight' && S.mcp && S.simState!=='nobridge') setTimeout(()=>simPoll(true),0); S.view=v; S.confirm=null; if(v!=='flight'){ S.debrief=false; } if(location.hash!=='#'+v){ try{ history.replaceState(null,'','#'+v); }catch(e){ location.hash=v; } } render(); window.scrollTo(0,0); }

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
async function aiJournal(){
  const st=S.st; const L=st.last; if(!L||!S.sample) return;
  S.busy.journal=true; S.busy.journalErr=''; S.keepScroll=true; render();
  const {job,res,out,f} = L; const sc = job.scen?SCEN[job.scen]:null;
  const prompt = `Write a short first-person pilot's journal entry (about 120 words, one or two paragraphs, plain prose) for a flight in "Trade Winds", a Caribbean flight-sim career game. Be specific and human: what the light looked like, what the passengers said, what the pilot learned. Stay consistent with these facts:

Pilot: ${st.pilot.name}
Flight: ${job.title} (${job.label}), ${AP[job.from].isl} to ${AP[st.log[0]?.to||job.to].isl}, ${AC[job.ac].n}
Time: ${timeLabel(job.dep)}, weather: ${job.wx.n}
Landing: ${LANDING[f.landing].n}; grade ${res.grade} (${res.score}/100)
${sc?`Situation in flight: ${sc.n}. Pilot's handling: ${({book:'by the book',messy:'handled, but messy',ignored:'ignored it'})[f.scen]}`:''}
${out.story?`What happened next: ${out.story}`:''}

Reply with the journal text only, no title.`;
  try{
    const r = await S.sample(prompt, { modelTier:'default', cache:false });
    addJournal(st, `Notes: ${job.title}`, r.text.trim(), job.chars||[], 'ai'); save(); S.busy.journalDone=true;
  }catch(e){ S.busy.journalErr = aiErr(e); }
  S.busy.journal=false; S.keepScroll=true; render();
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
    case 'ai-journal': aiJournal(); return;
    case 'book-check': { const rid=b.dataset.r; const sel=document.getElementById('cr-'+rid); const acId=sel?sel.value:null; if(!acId) return; st.active={job:checkrideJob(st,rid,acId), accepted:Date.now()}; save(); S.showResult=false; go('flight'); return; }
    case 'buy': { const k=b.dataset.ac; const c=st.company; const first = !c.fleet.length && !c.bought; const price = Math.round(AC[k].price*(first&&st.voucher?1-st.voucher:1)); const t=loanTerms(price); if(st.cash<t.down) return; st.cash-=t.down; c.fleet.push({fid:uid(), ac:k, reg:regFor(st), price, loanLeft:t.total, daily:t.daily, hired:false, cond:100, flights:0}); if(first){ c.bought=true; st.voucher=0; } st.jobsKey=''; addJournal(st, `Bought a ${AC[k].n}`, `${c.name} takes delivery of ${c.fleet[c.fleet.length-1].reg}. ${money(t.down)} down, ${money(t.daily)} a day for five years.`, ['mari'], 'milestone'); save(); toast(`Welcome to the fleet, ${c.fleet[c.fleet.length-1].reg}.`); S.keepScroll=true; render(); return; }
    case 'hire': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); f.hired=!f.hired; st.jobsKey=''; save(); S.keepScroll=true; render(); return; }
    case 'repair': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); const cost=Math.round((100-f.cond)*f.price*0.0003); if(st.cash<cost) return; st.cash-=cost; f.cond=100; save(); S.keepScroll=true; render(); return; }
    case 'sell': S.confirm='sell-'+b.dataset.f; S.keepScroll=true; render(); return;
    case 'sell-yes': { const c=st.company; const f=c.fleet.find(x=>x.fid===b.dataset.f); const val=Math.round(f.price*0.75*(f.cond/100) - f.loanLeft); st.cash+=val; c.fleet=c.fleet.filter(x=>x!==f); S.confirm=null; st.jobsKey=''; save(); toast(`Sold ${f.reg}.`); S.keepScroll=true; render(); return; }
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
function dispatchCard(st){
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

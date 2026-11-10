/* ===================== FLIGHT PAGE =====================
   flightView() shows one of five things:
     1. the result of the flight you just finished      -> resultView()   (page-result.js)
     2. "No flight booked"
     3. the manual debrief form (no MSFS connection)     -> debriefView()
     4. flight mode, once the flight has started         -> inflightView()
     5. the pre-flight page: the ticket, three steps, the MSFS setup, then the details
   While flying you can open the briefing again (S.ifBrief); that shows the full briefing layout. */

/* ---------- pieces ---------- */

/* The flight display at the top of flight mode: route, progress, live numbers, and the goal. */
function hudHTML(a){
  const s=S.sim||{}; const live=S.simState==='live'&&s.position; const job=a.job; const to=job.local?job.from:job.to; const dest=AP[to];
  const togo=live?distNm({lat:s.position.lat,lon:s.position.lon},dest):null; const gs=live&&s.motion?Math.round(s.motion.gs||0):null; const eta=togo!=null&&gs>40?Math.round(togo/gs*60):null;
  const fuel=live&&s.systems&&s.systems.fuelLb!=null?Math.round(s.systems.fuelLb):null; const alt=live?Math.round((s.position.altFt||0)/10)*10:null;
  const cell=(k,v,u)=>`<div class="hud-c"><span>${k}</span><b>${v==null?'—':v}${v==null?'':`<small>${u||''}</small>`}</b></div>`;
  let prog='', airCell='', extra='', goal='';
  try{ /* how far along the route, and minutes since takeoff */
    const tot=Math.max(1,distNm(AP[job.from],dest)); const left=live?togo:tot; const pct=job.local?null:Math.max(0,Math.min(100,Math.round((1-left/tot)*100)));
    const rec=s.recorder; const air=rec&&rec.takeoff?Math.round((Date.now()-rec.takeoff.t)/60000):null;
    if(pct!=null) prog=`<div class="fhud-prog"><i style="width:${pct}%"></i><span>${pct}%</span></div>`;
    if(air!=null) airCell=`<div class="hud-c"><span>In the air</span><b>${air}<small> min</small></b></div>`; }catch(_){}
  try{ /* course to the destination, the landing runway when close, and what this flight is for */
    const cells=[]; if(live){ const b=Math.round(brg({lat:s.position.lat,lon:s.position.lon},dest)); const hdg=s.motion&&s.motion.hdg!=null?Math.round(s.motion.hdg):null; const off=hdg!=null?((b-hdg+540)%360)-180:0;
      cells.push(`<div class="hud-c hud-brg"><span>Course to ${esc(to)}</span><b>${pad3(b)}°</b><i style="transform:rotate(${off}deg)">↑</i></div>`);
      if(togo<20 && !dest.water){ const w=s.ext&&s.ext.weather; const wx=w?Object.assign({},job.wx,{dir:w.windDir,spd:w.windKt,gust:0}):job.wx; let r=null; try{ r=rwyAnalysis(to,wx,job.ac); }catch(_){} if(r&&!r.water) cells.push(`<div class="hud-c hud-rw"><span>Land runway</span><b>${esc(r.rw)}</b><small>${pad3(wx.dir)}°/${wx.spd} kt</small></div>`); } }
    const g = job.kind==='story' && typeof CH_GOAL!=='undefined' && CH_GOAL[job.story] ? `<p class="hud-goal"><span>Goal</span> ${esc(CH_GOAL[job.story][0])}</p>` : job.kind==='check' ? `<p class="hud-goal"><span>Checkride</span> ${esc((job.tasks||[]).join(' · '))}</p>` : job.network ? `<p class="hud-goal"><span>Network run</span> ${job.lowLevel?'Stay under 1,000 ft for the bonus. ':''}${job.drop?'Night drop at a closed strip. ':''}Heat +5 when you land.</p>` : '';
    extra=cells.join(''); goal=g; }catch(_){}
  return `<section class="fhud"><div class="fhud-route"><b>${esc(job.from)}</b><i></i><b>${esc(to)}</b><span>${esc(job.title)}</span></div>${prog}<div class="fhud-cells">${airCell}${extra}${cell('To go',togo!=null?Math.round(togo):null,' nm')}${cell('ETA',eta,' min')}${cell('Ground speed',gs,' kt')}${cell('Altitude',alt!=null?alt.toLocaleString():null,' ft')}${cell('Fuel',fuel!=null?fuel.toLocaleString():null,' lb')}</div>${live?'':'<p class="small muted" style="margin:8px 0 0">MSFS isn\'t connected, so live numbers are off. The flight still finishes with the Finish button.</p>'}${goal}</section>`;
}

/* The banner at the top of a story chapter's pre-flight page. `lead` is extra HTML placed first inside it. */
function chapterHero(job, lead=''){
  const m=STORY.find(x=>x.id===job.story); if(!m) return ''; const chs=STORY.filter(x=>x.arc===m.arc); const idx=chs.indexOf(m)+1;
  const to=job.local?AP[job.from]:AP[job.to]; const d=job.local?(job.tourNm||40):Math.round(distNm(AP[job.from],AP[job.to]));
  const feat = m.feature || (m.teach&&m.teach[0]) || '';
  const art = typeof islandArt==='function' ? (()=>{ try{ return islandArt(job.local?job.from+'L':job.to, job.dep, 1200, 300, job.ac); }catch(_){ return ''; } })() : '';
  const g=CH_GOAL[job.story];
  return `<section class="chapter-hero" style="--arc:${arcColor(m.arc)}">${lead}${art?`<div class="ch-art" aria-hidden="true">${art}</div>`:''}<div class="ch-in">
    <div class="row between"><p class="ch-kicker">${esc(m.arc)} · Chapter ${idx} of ${chs.length}${m.side?' · side story':''}</p><div class="row ch-cast">${(m.chars||[]).filter(k=>CAST[k]).map(k=>avatar(k)).join('')}</div></div>
    <h1>${esc(m.title)}</h1>${g?`<div class="ch-goal"><p class="ch-prev"><span>Previously</span> ${esc(g[1])}</p><p class="ch-obj"><span>Your goal</span> ${esc(g[0])}</p></div>`:''}
    ${CRIME_IDS.has(job.story) ? '' : `<div class="ch-brief">${(job.paras||m.brief||[]).map(t=>`<p>${esc(t)}</p>`).join('')}</div>`}
    <div class="ch-feature"><div><span class="label">Featured flight</span><b class="mono">${esc(job.from)} → ${esc(job.local?job.from:job.to)}</b><span class="small">${esc(to.n)}, ${esc(to.isl)} · ${d.toLocaleString()} nm</span></div>${feat?`<p class="small">${esc(feat)}</p>`:''}</div>
  </div></section>`;
}

/* The ticket: who you're flying for, the route, and the Start / Finish / Cancel buttons. */
function boardingPass(st, job, p, a, started, mins, ai){
  const from=AP[job.from], to=AP[job.to];
  const base = job.lend ? (job.ac==='CJ4'?'Starling II · Private':'Starling · Private') : job.company ? st.company.name : job.airline ? 'Antilles Blue Airways' : 'Coral Wing Air';
  const storyCarrier = carrierFor(st, job);   // the story changes who you fly for
  const carrier = base==='Coral Wing Air' && storyCarrier ? storyCarrier : esc(base);
  let startBtn = `<button class="btn action" data-act="start">Start flight</button>`;
  if(diff()==='expert' && !started && !checklistDone(st.active)){ const [n,t]=checklistCount(st.active); startBtn=`<button class="btn action" data-act="nav" data-v="cockpit">Complete checklist (${n}/${t})</button><span class="chip warn">Expert: checklist required before engine start</span>`; }
  return `<section class="pass"><div class="pass-art">${islandArt(job.local?job.from+'L':job.to, job.dep, 1200, 170, job.ac)}</div>
    <div class="pass-main">
      <div class="row between"><span class="carrier">${LOGO}<b>${carrier}</b></span><span class="row">${chipsFor(st,job)}</span></div>
      <p class="label" style="margin-top:12px">${esc(job.label)}${job.client?` · ${esc(job.client)}`:''}</p>
      <h1 class="pass-title">${esc(ai?.headline || job.title)}</h1>
      <div class="pass-route">
        <div><div class="code">${esc(job.from)}</div><div class="city">${esc(from.isl)}</div></div>
        ${passPlane()}
        <div style="text-align:right"><div class="code">${job.local?'↺':esc(job.to)}</div><div class="city">${job.local?'Local flight':esc(to.isl)}</div></div>
      </div>
      <div class="pass-fields">
        <div><span>Flight</span><b class="mono">${esc(flightNo(job))}</b></div>
        <div><span>Departs</span><b class="mono">${hhmm(job.dep)}</b></div>
        <div><span>Block</span><b class="mono">${durTxt(p.est)}</b></div>
        <div><span>Aircraft</span><b>${esc(a.n.replace(/^(Cessna|Beechcraft|Diamond|CubCrafters|Zlin|ICON|de Havilland Canada|Grumman|Pilatus|Daher|Douglas|Cirrus|Airbus|Boeing|Heart Aerospace)\s/,''))}</b></div>
        <div><span>Distance</span><b class="mono">${p.dist} nm</b></div>
        <div><span>Pay</span><b class="mono">${job.kind==='check'?'—':money(job.pay)}</b></div>
      </div>
      <div class="row" style="margin-top:14px">
        ${started ? `<span class="chip good">Block timer running: ${durTxt(mins)}</span>` : startBtn}
        ${started ? `<button class="btn primary" data-act="debrief">${S.simState==='live'?'Finish flight':'Log the landing'}</button>` : ''}
        <button class="btn" data-act="nav" data-v="cockpit">Open cockpit checklist</button>
        ${S.confirm==='cancel' ? `<span class="small">Cancel this job? ${job.kind==='story'||job.kind==='check'?'You can pick it up again later.':'The client will remember.'}</span><button class="btn danger sm" data-act="cancel-yes">Yes, cancel</button><button class="btn sm" data-act="confirm-no">Keep it</button>` : `<button class="btn ghost" data-act="cancel">${job.kind==='story'?'Cancel chapter (play it again any time)':'Cancel job'}</button>`}
      </div>
      ${planLinks(job)}
    </div>
    <div class="pass-stub" aria-hidden="true">
      <span class="label">Pilot in command</span><b>${esc(st.pilot.name)}</b>
      <span class="label">Seat</span><b>Left</b>
      <span class="label">Date</span><b class="mono">${dateTxt(st.day)}</b>
      <div class="barcode"></div>
    </div>
  </section>`;
}

/* "Set up MSFS for this flight": five numbered tiles and a row of quick checks. Redrawn on every sim tick. */
function preflightHTML(job){
  const act=S.st&&S.st.active; const s=S.sim; const started=act&&act.started; const live=S.simState==='live';
  const moving = live && s && s.motion && (!s.motion.onGround || s.motion.gs>2);
  if(started && moving) return `<div class="row between"><div><p class="label">Flight setup</p><h3>Done. You're on your way.</h3></div></div><p class="small muted">Fuel and weights are locked once you're moving.</p>`;
  const C = preflightChecks(job); const get=k=>C.find(c=>c.k===k); const p=plan(job); const R=runwayPlan(job); const wx=job.wx;
  const fuelGal=Math.ceil(Math.max(p.gal*1.3, p.gal+5)), payload=Math.max(0,p.payload-170); const fuel=get('fuel'), time=get('time'), wxc=get('wx'); const park=suggestParking(job);
  if(live) fetchParking(job.from);
  const tile=(cls, icon, title, body, action)=>`<div class="su-tile ${cls}"><div class="su-ic" aria-hidden="true">${icon}</div><div class="su-b"><p class="label">${title}</p>${body}</div>${action?`<div class="su-a">${action}</div>`:''}</div>`;
  /* the airline checkride lands on the ILS runway */
  const ils = job.kind==='check' && job.rating==='ATP' && job.ilsRwy ? job.ilsRwy : null;
  const landRw = R.arr ? (R.arr.water ? 'water' : (ils && /^\s*[0-9]{2}[LRC]?\s*$/i.test(R.arr.rw) ? ils : esc(R.arr.rw))) : '';
  const rwBig = R.dep && !R.dep.water ? `<div class="su-rw"><span><small>Take off</small><b class="mono">${esc(R.dep.rw)}</b></span>${R.arr?`<i>→</i><span><small>Land</small><b class="mono">${landRw}</b></span>`:''}</div>` : `<div class="su-rw"><span><b>Into the wind</b></span></div>`;
  const tiles = [
    tile('', '🅿','1. Spawn here', `<b>${esc(park.spot?park.spot.name:'GA ramp')}</b><p class="tiny">${esc(park.text)}</p>`, park.spot && live && S.sim.position && distNm({lat:S.sim.position.lat,lon:S.sim.position.lon},AP[job.from])<3 && S.sim.motion && S.sim.motion.gs<1 ? `<button class="btn" data-act="park-move">Move me there</button>`:''),
    tile(fuel&&fuel.ok?'ok':'todo','⛽','2. Fuel &amp; weight', `<b>${fuelGal} gal · ${payload} lb</b><p class="tiny">${fuel?esc(fuel.t):'Plan '+p.gal+' gal plus reserve'}</p>`, live?`<button class="btn primary" data-act="pf-load" ${S.loading?'disabled':''}>${S.loading?'Loading…':'Load into MSFS'}</button>`:`<span class="tiny muted">Set in the MSFS fuel &amp; payload menu</span>`),
    tile(time? (time.ok?'ok':'todo') : '', '🕙','3. Time of day', `<b>${hhmm(job.dep)} local</b><p class="tiny">${time?esc(time.t):'Set this time in MSFS before you load in.'}</p>`, time&&!time.ok&&time.act?`<button class="btn primary" data-act="${time.act}">${esc(time.actLabel)}</button>`:''),
    tile('rw','🛫','4. Runways', `${rwBig}<p class="tiny">Wind ${pad3(wx.dir)}° at ${wx.spd}${wx.gust?'G'+wx.gust:''} kt · ${esc(windTxt(R.dep))}${R.dep&&R.dep.over?' · <b class="bad-t">over this aircraft\'s crosswind limit</b>':''}</p>${ils?`<p class="small" style="margin-top:6px"><b>Approach: ILS ${ils}</b>, RNAV ${ils} as backup</p>`:''}`, ''),
    tile(wxc&&wxc.ok?'ok':'', '☁','5. Weather', `<b>${esc(wx.n)}</b><p class="tiny">${wxc?esc(wxc.ok?wxc.t:'MSFS can\'t be changed by add-ons. Use Live weather in MSFS and the briefing matches it.'):'Generated for this flight.'}</p>`, wxc&&wxc.act?`<button class="btn" data-act="${wxc.act}">${esc(wxc.actLabel)}</button>`:'')
  ].join('');
  const chipTxt=c=>`${c.ok?'✓':'!'} ${c.t}`;
  const small = C.filter(c=>['sim','pos','ac','park'].includes(c.k)).filter(c=>!(started && /nm from|Moving|Parked|At [A-Z]{4}/.test(chipTxt(c)))).map(c=>`<span class="su-chip ${c.ok?'ok':'no'}" title="${esc(c.d||'')}">${c.ok?'✓':'!'} ${esc(c.t)}</span>`).join('');
  /* MSFS has a different aircraft loaded that can fly this job: offer to switch */
  let switchAc='';
  try{ if(act && !started && live){ const L=loadedAircraft(); if(L.id && L.id!==job.ac && canFly(S.st, L.id) && refitJob(S.st, JSON.parse(JSON.stringify(job)), L.id))
      switchAc=`<div class="notice switch-ac"><b>MSFS has the ${esc(AC[L.id].n)} loaded.</b> <button class="btn sm primary" data-act="use-loaded">Fly this job in it instead</button></div>`; } }catch(_){}
  return `<div class="row between"><div><p class="label">${started?'Before takeoff':'Step 1 · set up MSFS'}</p><h3>Set up MSFS for this flight</h3></div><div class="row"><button class="btn sm ghost" data-act="pf-pln">Flight plan (.pln)</button><button class="btn sm ghost" data-act="pf-recheck">Check again</button></div></div>
    ${switchAc}<div class="su-chips">${small}</div><div class="su-grid">${tiles}</div>`;
}

/* ---------- flight mode ---------- */

function inflightView(){
  const st=S.st, a=st.active, job=a.job, ac=AC[job.ac];
  const mins = Math.round((Date.now()-a.started)/60000);
  const rec=S.sim&&S.sim.recorder; const airborne = S.simState==='live' && ((S.sim.motion&&!S.sim.motion.onGround) || (rec && rec.takeoff && simRecFor(a)));
  let runways=''; try{ const R=runwayPlan(job); if(R.dep) runways=`<p class="if-rw">Take off <b class="mono">${esc(R.dep.water?'into wind':R.dep.rw)}</b>${R.arr?` · Land <b class="mono">${esc(R.arr.water?'into wind':R.arr.rw)}</b>`:''} · wind ${pad3(job.wx.dir)}°/${job.wx.spd} kt</p>`; }catch(_){}
  const orders = job.scen && a.opened && a.scenPlan ? ordersHTML(a,!!S.ordersPop) : job.scen ? `<div class="notice small">📩 Sealed orders aboard. They open automatically ${TRIG_LABEL[SCEN_TRIGGER[job.scen]||'mid']}.</div>` : '';
  return `<main class="wrap stack fade inflight"><div class="test-skip-bar">${SKIP_BTN}<span class="tiny muted">Testing shortcut</span></div><div class="fm-bar"><span class="fm-dot"></span> Flight mode <button class="btn sm ghost" data-act="fm-menu">${S.fmMenu?'Hide menu':'Show menu'}</button></div>${hudHTML(a)}${guideActive()?guideHTML(a):''}
    <section class="if-head">
      <div style="min-width:0"><p class="label">In flight · ${esc(flightNo(job))} · ${esc(ac.n)}</p>${runways}<h1>${esc(job.title)}</h1></div>
      ${NOTE_BTN}<div class="row"><span class="if-timer mono" id="if-timer" data-start="${a.started}">${durTxt(mins)}</span>
        <button class="btn sm ghost" data-act="big-open">⛶ Big display</button><button class="btn sm ghost" data-act="if-brief">Briefing</button><button class="btn sm ghost" data-act="nav" data-v="cockpit">Full checklist</button>
        <button class="btn action" data-act="debrief">${S.simState==='live'?'Finish flight':'Log the landing'}</button></div>
    </section>${approachCard(a)||''}${airborne?'':`<section class="panel stack preflight fsetup" id="preflight" data-x="1">${preflightHTML(job)}</section>`}
    <div class="callout-host" aria-live="assertive">${typeof calloutHTML==='function'?calloutHTML():''}</div>
    ${orders}<section class="panel stack if-live" id="if-live">${ifLiveHTML()}</section>
    <div class="if-grid">
      <div class="stack"><section class="panel if-mapwrap" id="if-map">${ifMiniMap(a)}</section><section class="panel stack">${ifChecklistHTML(a)}</section></div>
      <div class="stack">${typeof cabinBlock==='function'?cabinBlock():''}
        ${job.manifest?manifestHTML(job):''}<section class="panel stack small"><h3>Quick reference</h3><dl class="kv"><dt>Speeds</dt><dd class="mono">${esc(ac.v)}</dd><dt>Departure</dt><dd>${esc(job.from)} runway ${esc(rwyAnalysis(job.from,job.wx,job.ac).rw)}</dd>${job.local?'':`<dt>Arrival</dt><dd>${esc(job.to)} runway ${esc(rwyAnalysis(job.to,job.wx,job.ac).rw)}</dd>`}<dt>Wind</dt><dd class="mono">${pad3(job.wx.dir)}° / ${job.wx.spd}${job.wx.gust?'G'+job.wx.gust:''} kt</dd><dt>Load</dt><dd>${job.pax?job.pax+' pax':''}${job.pax&&job.cargo?' + ':''}${job.cargo?job.cargo+' lb':''}</dd></dl>
        ${job.scen?`<button class="btn sm" data-act="if-brief">Sealed orders: open in the briefing</button>`:''}<button class="btn sm ghost danger" data-act="cancel">Cancel flight</button></section>
      </div>
    </div>
  </main>`;
}

/* ---------- the briefing ---------- */

function briefingSection(job){ const ai=job.ai;
  return `<section class="panel stack">
        <div class="row between"><h2>Briefing</h2>${S.sample && !S.sampleOff ? `<button class="btn sm" data-act="ai-brief" ${S.busy.brief?'disabled':''}>${S.busy.brief?'Writing…':ai?'Rewrite with Claude':'Write the full story with Claude'}</button>`:''}</div>
        <div class="brief ${ai?'ai':''}">${(ai?ai.paragraphs:job.paras).map(t=>`<p>${esc(t)}</p>`).join('')}</div>
        ${ai?.passenger_note?`<p class="small"><b>What matters to them:</b> ${esc(ai.passenger_note)}</p>`:''}
        ${S.busy.briefErr?`<p class="small" style="color:var(--bad)">${esc(S.busy.briefErr)}</p>`:''}
      </section>`; }

/* Sealed orders in the briefing: closed until they open on their own, then the orders themselves. */
function sealedOrdersSection(act){ const job=act.job; const sc = job.scen ? SCEN[job.scen] : null; if(!sc) return '';
  if(!act.opened) return `<section class="sealed"><p class="label">Sealed orders</p><h3 style="margin:4px 0 6px">They'll open on their own</h3><p class="small">Something will happen on this flight ${TRIG_LABEL[SCEN_TRIGGER[job.scen]||'mid']}. The orders pop up automatically, and you'll be graded on how you handle it.</p></section>`;
  return act.scenPlan ? ordersHTML(act,false) : `<section class="opened"><p class="label">Sealed orders, opened</p><h3 style="margin:4px 0 6px">${esc(sc.n)}</h3><p>${esc(sc.text)}</p><p class="small" style="margin-top:8px"><b>In the sim:</b> ${esc(sc.sim)}</p></section>`; }

/* The two-column briefing: conditions, load and fuel on the left; live sim, route, aircraft and destination on the right. */
function briefingGrid(st, job, p, withBriefing, noTasks){
  const a=AC[job.ac]; const from=AP[job.from], to=AP[job.to];
  const rwDep = rwyAnalysis(job.from, job.wx, job.ac), rwArr = rwyAnalysis(job.to, job.wx, job.ac);
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
  return `<div class="grid-2">
     <div class="stack">
      ${withBriefing?briefingSection(job):''}
      ${job.kind==='check' && !noTasks ? `<section class="panel"><h2>Checkride tasks</h2><p class="small muted" style="margin-top:4px">Fly every task. You'll tick off the ones you completed in the debrief.</p><ul class="tight">${job.tasks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>`:''}
      ${job.bonus?`<section class="notice"><b>Bonus objective (+${money(job.bonus.amt)}):</b> ${esc(job.bonus.text)}${job.bonus.auto==='fpm'?' <span class="muted small">(checked from your landing)</span>':job.bonus.auto==='block'?' <span class="muted small">(checked from your block time)</span>':''}</section>`:''}
      ${job.festival?`<section class="notice"><b>${esc(job.festival)}</b> is on at the destination: busy ramp, crowded frequency, and 40% extra pay.</section>`:''}
      ${job.stormName?`<section class="notice bad"><b>Hurricane ${esc(job.stormName)}</b> is affecting this route. Expect instrument conditions, strong gusts and heavy rain. Turning back is always an option.</section>`:''}
      <section class="teach"><h3>What this flight teaches</h3><ul class="tight small">${teach.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>
      ${sealedOrdersSection(st.active)}
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
      ${cabinBlock()}<section class="panel stack" id="simpanel">${simPanelHTML()}</section>
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
    </div>`;
}

/* ---------- the page ---------- */

function flightView(){
  const st=S.st; const act=st.active;
  if(S.showResult && st.last) return resultView();
  if(!act) return `<main class="wrap"><div class="empty fade"><h3>No flight booked</h3><p>Pick a job from the board to get your briefing.</p><p style="margin-top:14px"><button class="btn primary" data-act="nav" data-v="board">Go to the job board</button>${st.last?` <button class="btn" data-act="show-last">See last result</button>`:''}</p></div></main>`;
  const job = act.job; const a=AC[job.ac]; const p=plan(job);
  const started = act.started;
  if(started && !S.debrief && !S.showResult && !S.ifBrief && !S.confirm) return inflightView();
  if(S.debrief) return debriefView(job, p);
  const mins = started ? Math.round((Date.now()-started)/60000) : 0;
  const skipBar = `<div class="test-skip-bar">${SKIP_BTN}<span class="tiny muted">Testing shortcut</span></div>`;
  const pass = boardingPass(st, job, p, a, started, mins, job.ai);
  const guide = guideActive() ? guideHTML(act) : '';

  /* flying, with the briefing open (or a confirm question showing): the full briefing */
  if(started) return `<main class="wrap stack fade">${skipBar}${S.ifBrief?`<div style="margin-bottom:14px"><button class="btn sm primary" data-act="if-back">← Back to in-flight view</button></div>`:''}
    ${pass}${guide}
    ${briefingGrid(st, job, p, true)}</main>`;

  /* before the flight */
  const to=job.local?job.from:job.to; const toN=AP[to]?AP[to].n:to, fromN=AP[job.from]?AP[job.from].n:job.from;
  const isStory = job.kind==='story', isCheck = job.kind==='check' && job.tasks && job.tasks.length;
  const hero = isStory ? chapterHero(job, CRIME_IDS.has(job.story) && proFor(job.story) ? `<button class="btn sm ghost pro-replay" data-act="pro-replay">▶ Replay prologue</button>` : '') : '';
  const how = `<section class="fl-how"><div class="fl-step"><span>1</span><div><b>Set up MSFS</b><p>Load the ${esc(AC[job.ac]?AC[job.ac].n:job.ac)} at <b>${esc(job.from)}</b> using the setup below: parking spot, fuel, time and weather.</p></div></div>
    <div class="fl-step"><span>2</span><div><b>Fly ${esc(job.from)} → ${esc(to)}</b><p>${job.local?`Take off from ${esc(fromN)}, fly the circuit or tour, and come back.`:`Take off from ${esc(fromN)} and fly to ${esc(toN)}.`} The app tracks you once the engine is running, or press <b>Start flight</b>.</p></div></div>
    <div class="fl-step"><span>3</span><div><b>Land at ${esc(to)}</b><p>Land and slow to taxi speed. The flight finishes and is graded automatically.</p></div></div></section>`;
  const tasks = isCheck ? `<section class="panel fl-tasks"><p class="label">What the examiner is grading</p><ul class="tight">${job.tasks.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const setup = `<section class="panel stack preflight fsetup" id="preflight">${preflightHTML(job)}</section>`;
  const briefing = isStory ? '' : `<details class="calm-more"><summary>${job.kind==='check'?'About this checkride':'Client briefing'}</summary><div class="calm-more-in">${briefingSection(job)}</div></details>`;
  /* the flight details drawer (a checkride already lists its tasks above, so they are left out here) */
  const details = `<details class="calm-more flight-more"><summary>Flight details: conditions, weights, route, aircraft and passengers</summary><div class="calm-more-in">${job.manifest?manifestHTML(job):''}${briefingGrid(st, job, p, false, isCheck)}</div></details>`;
  return `<main class="wrap stack fade">${skipBar}${hero}${pass}${how}${tasks}${setup}${briefing}${guide}${details}</main>`;
}

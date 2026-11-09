/* ===================== POLISH: look & feel, onboarding, boarding pass, cockpit companion ===================== */
const LOGO = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".5"/><path d="M5 19c4-1 7-1 11 0s7 1 11 0" fill="none" stroke="var(--coral)" stroke-width="2" stroke-linecap="round"/><path d="M16 6l2.2 7.5 7.3 1.8-7.3 1.6L16 24l-2.2-7.1-7.3-1.6 7.3-1.8z" fill="currentColor"/></svg>`;

/* ---------- scenery ---------- */
function islandsSVG(cls){ return `<svg class="${cls||'isles'}" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V92c60-4 90-30 150-34s95 26 150 30 70-16 120-18 70 20 110 20h670v30z" class="isle1"/><path d="M640 120V96c40-2 70-40 120-44s80 30 130 34 120-8 170-14 90 14 140 18v30z" class="isle2"/><path d="M0 120v-10c200 6 400-6 600 0s400 6 600 0v10z" class="sea"/></svg>`; }
function skyClass(min){ const t=timeLabel(min); return t==='Night'?'night':t==='Dawn'?'dawn':t==='Sunset'?'sunset':'day'; }

/* ---------- start screen ---------- */
function setupView(){
  return `<main class="setup-wrap">
    <section class="setup-hero sky-day">
      <div class="sun" aria-hidden="true"></div>
      <svg class="plane-fly" viewBox="0 0 120 40" aria-hidden="true"><path d="M8 22h70l18-14h8l-8 14h14l6-6h4l-3 8 3 8h-4l-6-6H96l8 14h-8L78 26H8c-4 0-4-4 0-4z" fill="currentColor"/></svg>
      ${islandsSVG('isles big')}
      <div class="wrap setup-copy">
        <p class="eyebrow">A Caribbean career for Microsoft Flight Simulator 2024</p>
        <h1>Trade Winds</h1>
        <p class="lede">A fresh licence and a cheap job flying a Cessna in St. Martin. Then the mechanic asks you for a small favor. Five acts later you're flying a 747 full of contraband, and either running the Caribbean or running from it.</p>
      </div>
    </section>
    <div class="wrap">
      <div class="setup-grid">
        <form id="setup-form" class="panel stack setup-card">
          <h2>Create your pilot</h2>
          <label class="field"><span>Your name</span><input id="pname" type="text" value="Ryan" maxlength="40" required></label>
          <label class="field"><span>Callsign or nickname <small>(optional)</small></span><input id="pcall" type="text" placeholder="e.g. Maverick" maxlength="30"></label>
          <button class="btn action big" type="submit">Start my career</button>
          <p class="tiny muted">Your career saves automatically.</p>
        </form>
        <div class="features">
          ${[['Fly real jobs','Every job is a real flight you fly in MSFS 2020 or 2024: route, aircraft, weather and load, all planned for you.'],['Live a story','Recurring characters, secret celebrity passengers, sealed orders that go wrong mid-flight, and plot twists after you land.'],['Earn your wings','Checkrides from Commercial to Airline Transport Pilot, plus sign-offs for the world\'s scariest runways.'],['Build an airline','Buy used aircraft, finance them, set fares on your own routes, and watch your net worth grow (or not).']].map(([t,d])=>`<div class="feature"><h3>${t}</h3><p class="small muted">${d}</p></div>`).join('')}
        </div>
      </div>
    </div></main>`;
}

/* ---------- welcome tour ---------- */
const TOUR = [
  {t:`Welcome to Coral Wing`, d:`You're a trainee pilot in St. Martin. Mari, the owner, will hand you work. Dez, the dispatcher, will hand you nicknames. Your first story chapter is waiting at the top of the job board.`},
  {t:`Pick a job, read the briefing`, d:`Accept a job and the Flight tab becomes your boarding pass: the story, the route, the weather to set in MSFS, the load sheet and the fuel plan. There's also a one-click flight plan for SimBrief.`},
  {t:`Fly it with the Cockpit tab`, d:`Open the Cockpit tab on your phone or second screen. It walks you through each phase of the flight with your speeds, runway and winds. Some flights carry sealed envelopes: open them when they say.`},
  {t:`Log the landing honestly`, d:`After shutdown, press "Log the landing". Your grade sets your pay, your reputation and how the story turns. Get the free MSFS Bridge (Hangar tab) and the debrief fills itself in.`}
];
function tourHTML(st){
  if(!st || st.tourDone) return ''; const i=S.tourStep||0; const s=TOUR[i];
  return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="tour-t"><div class="tour panel">
    <div class="tour-dots">${TOUR.map((_,k)=>`<span class="${k===i?'on':''}"></span>`).join('')}</div>
    <p class="label">Step ${i+1} of ${TOUR.length}</p><h2 id="tour-t">${s.t}</h2><p class="brief">${s.d}</p>
    <div class="row between" style="margin-top:8px"><button class="btn ghost" data-act="tour-skip">Skip</button><div class="row">${i>0?`<button class="btn" data-act="tour-back">Back</button>`:''}<button class="btn action" data-act="tour-next">${i===TOUR.length-1?`Let's fly`:'Next'}</button></div></div>
  </div></div>`;
}

/* ---------- today hero on the board ---------- */
function todayHero(st){
  const ap=AP[st.loc]; const wx=genLocWx(st); const r=rankOf(st); const sky=skyClass(st.clock);
  return `<section class="today sky-${sky}">
    <div class="sun" aria-hidden="true"></div>
    ${islandsSVG()}
    <div class="today-in">
      <div style="min-width:0"><p class="eyebrow">${esc(COUNTRY[ap.c])} · ${esc(st.loc)}</p><h1>${esc(ap.isl)}</h1><p class="today-sub">${esc(ap.n)} · ${dateTxt(st.day)} · ${seasonName(st)}</p></div>
      <div class="today-right"><div class="clock mono">${hhmm(st.clock)}</div><p class="today-sub">${esc(wx.n)} · ${wx.t} °C · wind ${pad3(wx.dir)}° ${wx.spd}${wx.gust?'G'+wx.gust:''} kt</p><p class="today-sub"><span class="pill">${esc(r.name)}</span> <span class="pill">${money(st.cash)}</span></p></div>
    </div></section>`;
}

/* ---------- boarding pass ---------- */
const ICAO_TYPE = {C152:'C152',C172:'C172',DA40:'DA40',G36:'BE36',BEAVER:'DHC2',GOOSE:'G21',PC6:'PC6T',C208:'C208',DA62:'DA62',DHC6:'DHC6',PC12:'PC12',TBM:'TBM9',KA350:'B350',DC3:'DC3',SF50:'SF50',CJ4:'C25C',A320:'A20N',B38M:'B38M',A321:'A21N',A333:'A333',B748:'B748'};
function flightNo(job){ let h=0; for(const ch of job.id) h=(h*31+ch.charCodeAt(0))%900; if(job.lend) return job.tail||'N50VL'; return (job.company?'':'CW ')+(100+h); }
function planLinks(job){
  if(job.local || AP[job.to].water) return '';
  const t = ICAO_TYPE[job.ac]; const sb = `https://dispatch.simbrief.com/options/custom?orig=${job.from}&dest=${job.to}${t?`&type=${t}`:''}`; const sv = `https://skyvector.com/?fpl=${job.from}%20${job.to}`;
  return `<div class="row small"><a class="btn sm ghost" href="${sb}" target="_blank" rel="noopener">Plan in SimBrief ↗</a><a class="btn sm ghost" href="${sv}" target="_blank" rel="noopener">View on SkyVector ↗</a></div>`;
}
function boardingPass(st, job, p, a, started, mins, ai){
  const from=AP[job.from], to=AP[job.to]; const carrier = job.lend ? (job.ac==='CJ4'?'Starling II · Private':'Starling · Private') : job.company ? st.company.name : job.airline ? 'Antilles Blue Airways' : 'Coral Wing Air';
  return `<section class="pass">
    <div class="pass-main">
      <div class="row between"><span class="carrier">${LOGO}<b>${esc(carrier)}</b></span><span class="row">${chipsFor(st,job)}</span></div>
      <p class="label" style="margin-top:12px">${esc(job.label)}${job.client?` · ${esc(job.client)}`:''}</p>
      <h1 class="pass-title">${esc(ai?.headline || job.title)}</h1>
      <div class="pass-route">
        <div><div class="code">${esc(job.from)}</div><div class="city">${esc(from.isl)}</div></div>
        <div class="pass-arc" aria-hidden="true"><svg viewBox="0 0 200 40"><path d="M4 34 Q100 -14 196 34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5"/></svg><span>✈</span></div>
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
        ${started ? `<span class="chip good">Block timer running: ${durTxt(mins)}</span>` : `<button class="btn action" data-act="start">Start flight</button>`}
        <button class="btn primary" data-act="debrief">Log the landing</button>
        <button class="btn" data-act="nav" data-v="cockpit">Open cockpit checklist</button>
        ${S.confirm==='cancel' ? `<span class="small">Cancel this job? ${job.kind==='story'||job.kind==='check'?'You can pick it up again later.':'The client will remember.'}</span><button class="btn danger sm" data-act="cancel-yes">Yes, cancel</button><button class="btn sm" data-act="confirm-no">Keep it</button>` : `<button class="btn ghost" data-act="cancel">Cancel job</button>`}
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

/* ---------- score ring ---------- */
function scoreRing(res){ const r=46, c=2*Math.PI*r, off=c*(1-res.score/100);
  return `<div class="ring g${res.grade}"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="${r}" class="ring-bg"/><circle cx="55" cy="55" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 55 55)"/></svg><span class="grade ${res.grade}">${res.grade}</span></div>`; }

/* ---------- pilot license card ---------- */
function licenseCard(st){
  const rated = RATING_ORDER.filter(r=>st.ratings[r]); let h=7; for(const ch of st.pilot.name+st.created) h=(h*33+ch.charCodeAt(0))%999999;
  return `<section class="license">
    <div class="lic-top"><span>${LOGO} Eastern Caribbean Civil Aviation</span><span class="mono">No. TW-${String(h).padStart(6,'0')}</span></div>
    <div class="lic-body">
      <div class="lic-photo">${esc(st.pilot.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())}</div>
      <div style="min-width:0"><p class="label">Pilot license</p><h2>${esc(st.pilot.name)}${st.pilot.call?` <span class="muted">"${esc(st.pilot.call)}"</span>`:''}</h2>
        <p class="small">${esc(rankOf(st).name)} · ${(st.minutes/60).toFixed(1)} hours · ${st.flights} flights · reputation ${st.reputation}</p>
        <div class="row" style="gap:6px;margin-top:8px">${rated.map(r=>`<span class="stamp">${RATINGS[r].code}</span>`).join('')}</div></div>
    </div></section>`;
}

/* ---------- cockpit companion ---------- */
function speedsOf(a){ const out={}; for(const part of a.v.split('·')){ const m=part.trim().match(/^([A-Za-z\- ]+?)\s*~?\s*(M?[\d.]+)/); if(m) out[m[1].trim().toLowerCase()]=m[2]; } return out; }
function cockpitPhases(st, job){
  const a=AC[job.ac]; const p=plan(job); const sp=speedsOf(a); const dep=rwyAnalysis(job.from, job.wx, job.ac), arr=rwyAnalysis(job.to, job.wx, job.ac);
  const piston = a.fuel==='avgas' && !['DC3'].includes(job.ac); const turbine = ['turbo','stol'].includes(a.cls) && a.fuel==='jeta' && !['DA40','DA62'].includes(job.ac);
  const jet = ['jet','airliner','widebody','regional'].includes(a.cls); const retract = ['G36','KA350','TBM','PC12','DA62','GOOSE','DC3','SF50','CJ4','A320','B38M','A321','A333','B748','ES30'].includes(job.ac);
  const vr = sp['vr']||sp['lift-off']||sp['v1/vr']||'—', vy = sp['vy']||sp['vyse']||'—', app = sp['approach']||sp['vref']||sp['vapp']||'—';
  const sc = job.scen?SCEN[job.scen]:null;
  return [
    {n:`Preflight`, items:[`Walk around the aircraft: control surfaces, tires, oil and fuel caps`, a.fuel==='elec'?`Battery charged to 100%`:`Fuel on board: at least ${p.fuelLb.toLocaleString()} lb (${p.gal} gal)`, `Payload loaded: ${p.payload.toLocaleString()} lb, takeoff weight within limits`, `Weather: ${job.wx.n}, wind ${pad3(job.wx.dir)}° at ${job.wx.spd} kt`, ...(job.local||ZONE(AP[job.from].c)===ZONE(AP[job.to].c)?[]:[`International: flight plan filed, passports and paperwork aboard`]), job.pax?`Passenger briefing: belts, doors, exits, no phones in the cockpit`:`Cargo secured and tied down`]},
    {n:`Start`, items: jet ? [`Battery and APU on, FMS route ${job.from}–${job.to} loaded`,`Takeoff speeds set: V1/Vr about ${vr} kt`,`Engines start, monitor N2, ITT and oil pressure`,`After start: anti-ice as needed, flight controls checked`] : turbine ? [`Battery on, fuel pump on`,`Clear prop, starter engaged`,`Introduce fuel at light-off. Watch ITT and be ready to abort a hot start`,`Generator on, avionics on`] : [`Mixture rich, throttle cracked, beacon on`,`"Clear prop!" Starter engaged`,`Oil pressure in the green within 30 seconds`,`Avionics on, set frequencies and transponder code`]},
    {n:`Taxi`, items:[`Taxi clearance to runway ${dep.water?'(water: taxi to open water into the wind)':dep.rw}`,`Brakes checked as you start moving`,`Flight instruments: heading and turn coordinator moving correctly`,`Hold short of the runway`]},
    {n:`Before takeoff`, items:[...(piston?[`Run-up: 1,700 RPM, check magnetos and carb heat (if fitted)`]:[]),`Flight controls free and correct`,`Trim set for takeoff, flaps as required`,`Transponder ALT, lights on`,`Takeoff brief: runway ${dep.water?'(water)':dep.rw}, ${Math.round(dep.head)} kt head, ${Math.round(dep.xw)} kt cross. Rotate at ${vr} kt`,`If anything goes wrong before rotation: abort`]},
    {n:`Takeoff & climb`, items:[`Full power, check engine instruments in the green`,`Rotate at ${vr} kt`, retract?`Positive rate: gear up`:`Climb at ${vy} kt`, `Flaps up at a safe altitude`, `Climb checklist: ${piston?'lean the mixture above 3,000 ft (density altitude is high in the islands)':'climb power set'}`]},
    {n:`Cruise`, items:[`Course ${p.hdg!=null?pad3(p.hdg)+'° true':'around your tour loop'}, ${p.dist} nm, planned ${durTxt(p.est)} block`, piston?`Lean for cruise`:`Cruise power set`, `Halfway: compare fuel against the plan`, ...(job.request?[`Open the passenger request envelope (Flight tab)`]:[]), ...(sc?[`Sealed orders: ${sc.trigger}`]:[]), ...(job.bonus?[`Bonus objective: ${job.bonus.text}`]:[])]},
    {n:`Descent & approach`, items:[`Destination weather: ${job.wx.n}`, arr.water?`Water landing: into the wind (${pad3(job.wx.dir)}°), check for boats and swimmers`:`Expect runway ${arr.rw}: ${Math.round(arr.head)} kt head, ${Math.round(arr.xw)} kt cross${arr.over?' (over the crosswind limit, consider another runway or your alternate)':''}`, `Approach brief, including the go-around plan`, retract?`GUMPS: gas, undercarriage down, mixture, props, seatbelts`:`Before landing: fuel selector, mixture, seatbelts`, `Approach speed about ${app} kt`]},
    {n:`Landing`, items:[`Stabilized by 500 ft above the runway: on speed, on path, configured. Otherwise go around`,`Aim for the touchdown zone`,`Hold the centerline. Crosswind: wing low into the wind`,`Smooth flare: let it settle`]},
    {n:`Shutdown`, items:[`Clear the runway, flaps up, transponder standby`,`Taxi to parking, parking brake set`,`Engine shutdown, avionics and master off`,`Note fuel remaining and block time, then press "Log the landing"`]}
  ];
}
function cockpitView(){
  const st=S.st; const a0=st.active;
  if(!a0) return `<main class="wrap"><div class="empty fade"><h3>No flight in progress</h3><p>Accept a job and this tab becomes your phase-by-phase cockpit companion. It works best on a phone or tablet beside your sim.</p><p style="margin-top:14px"><button class="btn primary" data-act="nav" data-v="board">Find a job</button></p></div></main>`;
  const job=a0.job; const a=AC[job.ac]; const ph=cockpitPhases(st, job); a0.ck=a0.ck||{p:0,done:{}}; const cur=clamp(a0.ck.p,0,ph.length-1);
  const live = S.simState==='live' && S.sim && S.sim.motion ? S.sim : null;
  const P=ph[cur]; const doneN=P.items.filter((_,i)=>a0.ck.done[cur+'-'+i]).length;
  return `<main class="wrap stack fade cockpit">
    <div class="row between"><div><p class="label">${esc(job.from)} → ${esc(job.local?job.from:job.to)} · ${esc(a.n)}</p><h1 style="font-size:28px">Cockpit</h1></div>
      ${live?`<div class="live-strip mono"><span>${live.motion.ias} KIAS</span><span>${live.position.altFt.toLocaleString()} ft</span><span>${live.motion.vsFpm>0?'+':''}${live.motion.vsFpm} fpm</span><span>${live.systems.fuelLb} lb</span></div>`:''}</div>
    <div class="phases" role="tablist">${ph.map((x,i)=>{ const all=x.items.every((_,j)=>a0.ck.done[i+'-'+j]); return `<button class="phase ${i===cur?'on':''} ${all?'done':''}" data-act="ck-phase" data-i="${i}" role="tab" aria-selected="${i===cur}">${all?'✓ ':''}${x.n}</button>`; }).join('')}</div>
    <section class="panel stack ck-panel">
      <div class="row between"><h2>${P.n}</h2><span class="mono small muted">${doneN}/${P.items.length}</span></div>
      <div class="ck-list">${P.items.map((t,i)=>{ const on=!!a0.ck.done[cur+'-'+i]; return `<button class="ck ${on?'on':''}" data-act="ck-item" data-k="${cur}-${i}" aria-pressed="${on}"><span class="box">${on?'✓':''}</span><span>${esc(t)}</span></button>`; }).join('')}</div>
      <div class="row between">${cur>0?`<button class="btn" data-act="ck-phase" data-i="${cur-1}">← ${ph[cur-1].n}</button>`:'<span></span>'}${cur<ph.length-1?`<button class="btn action big" data-act="ck-next">Next: ${ph[cur+1].n} →</button>`:`<button class="btn action big" data-act="debrief-go">Log the landing</button>`}</div>
    </section>
    <section class="panel"><dl class="kv"><dt>Speeds</dt><dd class="mono small">${esc(a.v)}</dd><dt>Departure</dt><dd>${esc(job.from)} runway ${esc(rwyAnalysis(job.from,job.wx,job.ac).rw)}</dd>${job.local?'':`<dt>Arrival</dt><dd>${esc(job.to)} runway ${esc(rwyAnalysis(job.to,job.wx,job.ac).rw)}</dd>`}<dt>Wind</dt><dd class="mono">${pad3(job.wx.dir)}° / ${job.wx.spd}${job.wx.gust?'G'+job.wx.gust:''} kt</dd></dl></section>
  </main>`;
}

/* ---------- events ---------- */
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act]'); if(!b || !S.st) return; const st=S.st; const act=b.dataset.act;
  if(act==='tour-next'){ if((S.tourStep||0)>=TOUR.length-1){ st.tourDone=true; save(); } else S.tourStep=(S.tourStep||0)+1; render(); }
  else if(act==='tour-back'){ S.tourStep=Math.max(0,(S.tourStep||0)-1); render(); }
  else if(act==='tour-skip'){ st.tourDone=true; save(); render(); }
  else if(act==='ck-item' && st.active){ const ck=st.active.ck; ck.done[b.dataset.k]=!ck.done[b.dataset.k]; if(b.dataset.k.startsWith('4-') && !st.active.started){ st.active.started=Date.now(); simArm(); } save(); S.keepScroll=true; render(); }
  else if(act==='ck-phase' && st.active){ st.active.ck.p=Number(b.dataset.i); save(); S.keepScroll=true; render(); }
  else if(act==='ck-next' && st.active){ const ck=st.active.ck; ck.p=ck.p+1; if(ck.p===4 && !st.active.started){ st.active.started=Date.now(); simArm(); toast('Block timer started.'); } save(); render(); window.scrollTo(0,0); }
  else if(act==='debrief-go'){ S.view='flight'; S.debrief=true; try{ history.replaceState(null,'','#flight'); }catch(_){} render(); const fm=document.getElementById('debrief'); if(fm) simPrefill(fm); window.scrollTo(0,0); }
});

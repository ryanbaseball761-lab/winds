/* ===================== POLISH: look & feel, onboarding, boarding pass, cockpit companion ===================== */
const LOGO = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".5"/><path d="M5 19c4-1 7-1 11 0s7 1 11 0" fill="none" stroke="var(--coral)" stroke-width="2" stroke-linecap="round"/><path d="M16 6l2.2 7.5 7.3 1.8-7.3 1.6L16 24l-2.2-7.1-7.3-1.6 7.3-1.8z" fill="currentColor"/></svg>`;

/* ---------- scenery ---------- */
function islandsSVG(cls){ return `<svg class="${cls||'isles'}" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V92c60-4 90-30 150-34s95 26 150 30 70-16 120-18 70 20 110 20h670v30z" class="isle1"/><path d="M640 120V96c40-2 70-40 120-44s80 30 130 34 120-8 170-14 90 14 140 18v30z" class="isle2"/><path d="M0 120v-10c200 6 400-6 600 0s400 6 600 0v10z" class="sea"/></svg>`; }
function skyClass(min){ const t=timeLabel(min); return t==='Night'?'night':t==='Dawn'?'dawn':t==='Sunset'?'sunset':'day'; }

/* ---------- start screen ---------- */
function setupView(){
  const feats=[['A story you fly','Twenty chapters in five acts. Every chapter is a real flight in MSFS, with scenes before and after, phone calls in the air, and a choice at the end that the story remembers.'],
    ['Power and Heat','Every run makes you stronger and more wanted. Push too hard and customs starts searching your plane.'],
    ['Cessna to 747','Earn your licences with real checkrides as the story moves you from a borrowed Cessna to the Vision Jet, the CJ4, the 737 and the 747.'],
    ['Graded by the sim','Trade Winds follows your flight live and grades the touchdown, the centerline, the fuel and the airmanship by itself.']];
  return `<main class="setup-wrap">
    <section class="setup-hero noir">
      <div class="sh-art" aria-hidden="true">${typeof SCENES!=='undefined'?SCENES.ramp():''}</div><div class="sh-shade" aria-hidden="true"></div>
      <div class="wrap setup-copy">
        <p class="eyebrow">A crime story for Microsoft Flight Simulator</p>
        <h1>Trade Winds</h1>
        <p class="lede">A fresh licence and a cheap job flying a Cessna in St. Martin. Then the mechanic asks you for a small favor. Five acts later you're flying a 747 full of contraband, and either running the Caribbean or running from it.</p>
      </div>
    </section>
    <div class="wrap">
      <div class="setup-grid">
        <form id="setup-form" class="panel stack setup-card">
          <h2>Who's flying?</h2>
          <label class="field"><span>Your name</span><input id="pname" type="text" placeholder="Your name" maxlength="40" required autofocus></label>
          <label class="field"><span>Callsign or nickname <small>(optional)</small></span><input id="pcall" type="text" placeholder="e.g. Maverick" maxlength="30"></label>
          <button class="btn action big" type="submit">Start the story</button>
          <p class="tiny muted">Your career saves automatically.</p>
        </form><div class="import-row"><span class="small muted">Already flying Trade Winds somewhere else?</span><button class="btn sm" type="button" data-act="import-file">Import career file</button></div>
        <div class="features">${feats.map(([t,d])=>`<div class="feat"><b>${t}</b><p>${d}</p></div>`).join('')}</div>
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
function tourBase(st){
  if(!st || st.tourDone) return ''; const i=S.tourStep||0; const s=TOUR[i];
  return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="tour-t"><div class="tour panel">
    <div class="tour-dots">${TOUR.map((_,k)=>`<span class="${k===i?'on':''}"></span>`).join('')}</div>
    <p class="label">Step ${i+1} of ${TOUR.length}</p><h2 id="tour-t">${s.t}</h2><p class="brief">${s.d}</p>
    <div class="row between" style="margin-top:8px"><button class="btn ghost" data-act="tour-skip">Skip</button><div class="row">${i>0?`<button class="btn" data-act="tour-back">Back</button>`:''}<button class="btn action" data-act="tour-next">${i===TOUR.length-1?`Let's fly`:'Next'}</button></div></div>
  </div></div>`;
}
/* top of the Flight page when no flight is booked: the setup screen for a new career, or the tour */
function tourHTML(st){ const wiz = st && ((!st.tourDone && (st.flights||0)===0) || S.wizOpen);
  return wiz ? wizardHTML(st) : tourBase(st); }


/* ---------- today hero on the board ---------- */
function todayHeroBase(st){
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
function flightNoBase(job){ let h=0; for(const ch of job.id) h=(h*31+ch.charCodeAt(0))%900; if(job.lend) return job.tail||'N50VL'; return (job.company?'':'CW ')+(100+h); }
function planLinks(job){
  if(job.local || AP[job.to].water) return '';
  const t = ICAO_TYPE[job.ac]; const sb = `https://dispatch.simbrief.com/options/custom?orig=${job.from}&dest=${job.to}${t?`&type=${t}`:''}`; const sv = `https://skyvector.com/?fpl=${job.from}%20${job.to}`;
  return `<div class="row small"><a class="btn sm ghost" href="${sb}" target="_blank" rel="noopener">Plan in SimBrief ↗</a><a class="btn sm ghost" href="${sv}" target="_blank" rel="noopener">View on SkyVector ↗</a></div>`;
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
function cockpitPhasesBase(st, job){
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
function cockpitBase(){
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
/* the cockpit companion: live callouts on top, then the phase-by-phase page, the cabin and the panel setup */
function cockpitView(){ let h=cockpitBase().replace('<main class="wrap stack fade cockpit">', '<main class="wrap stack fade cockpit"><div class="callout-host" aria-live="assertive">'+calloutHTML()+'</div>');
  h=h.replace(/<\/main>\s*$/, cabinBlock()+'</main>'); const p=panelSetupHTML(); return p ? h.replace(/<\/main>\s*$/, p+'</main>') : h; }


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

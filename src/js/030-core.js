/* ===================== PRE-FLIGHT SIM CHECK, LOAD THE PLANE, MSFS FLIGHT PLAN (.PLN) ===================== */
function cruiseAltFor(job){ const a=AC[job.ac], d=plan(job).dist; const c=a.cls;
  if(['airliner','widebody','regional'].includes(c)) return d<150?24000:35000;
  if(c==='jet') return d<120?14000:(job.ac==='SF50'?28000:37000);
  if(c==='turbo') return d<80?8500:d<250?16500:24000;
  if(job.local) return 2500; return d<30?2500:d<90?4500:d<200?6500:8500; }
function preflightChecks(job){
  const s=S.sim, live=S.simState==='live' && s && s.position; const p=plan(job); const out=[];
  out.push({k:'sim', ok:!!live, t:live?'MSFS connected':'MSFS not connected', d:live?'':'Start MSFS and load into a flight. Trade Winds will see it in a few seconds.'});
  if(!live) return out;
  const dep=AP[job.from]; const d=distNm({lat:s.position.lat,lon:s.position.lon}, dep);
  out.push({k:'pos', ok:d<3, t:d<3?`At ${job.from}`:`You're ${d<100?Math.round(d)+' nm':'far'} from ${job.from}`, d:d<3?'':`Start your MSFS flight at ${dep.n} (${job.from}).`});
  const title=s.aircraft&&s.aircraft.title||''; const L=loadedAircraft(); const acOk = L.id===job.ac || acMatches(title, job.ac) || (AC[job.ac].custom && AC[job.ac].simTitle===title);
  out.push({k:'ac', ok:acOk, t:acOk?`Right aircraft: ${AC[job.ac].n}`:`MSFS has “${title||'unknown'}” loaded`, d:acOk?'':`This job is planned for the ${AC[job.ac].n}.`});
  const gal = s.systems && s.systems.fuelGal!=null ? s.systems.fuelGal : null; const fuelOk = gal!=null && gal >= p.gal*0.95;
  out.push({k:'fuel', ok:fuelOk, t:gal==null?'Fuel unknown':`Fuel ${Math.round(gal)} gal (plan ${p.gal} gal)`, d:fuelOk?'':'Load the plane below, or set fuel in the MSFS fuel menu.', fix:true});
  const parked = s.motion.onGround && s.motion.gs<1; out.push({k:'park', ok:parked, t:parked?'Parked on the ground':'Moving or airborne', d:parked?'':'Run the check while parked at the gate.'});
  return out;
}
function plnLLA(lat, lon, altFt){ const f=(v,pos,neg)=>{ const a=Math.abs(v), d=Math.floor(a), m=Math.floor((a-d)*60), s=((a-d)*60-m)*60; return `${v>=0?pos:neg}${d}° ${m}' ${s.toFixed(2)}"`; }; return `${f(lat,'N','S')},${f(lon,'E','W')},+${String((altFt||0).toFixed(2)).padStart(9,'0')}`; }
function buildPLN(job){
  const A=AP[job.from], B=job.local?AP[job.from]:AP[job.to]; const to=job.local?job.from:job.to; const alt=cruiseAltFor(job); const ifr = plan(job).ifr || ['jet','airliner','regional','widebody'].includes(AC[job.ac].cls);
  const x=s=>String(s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  return `<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document Type="AceXML" version="1,0">
    <Descr>AceXML Document</Descr>
    <FlightPlan.FlightPlan>
        <Title>${x(job.from)} to ${x(to)}</Title>
        <FPType>${ifr?'IFR':'VFR'}</FPType>
        <RouteType>Direct</RouteType>
        <CruisingAlt>${alt}</CruisingAlt>
        <DepartureID>${x(job.from)}</DepartureID>
        <DepartureLLA>${plnLLA(A.lat,A.lon,A.el)}</DepartureLLA>
        <DestinationID>${x(to)}</DestinationID>
        <DestinationLLA>${plnLLA(B.lat,B.lon,B.el)}</DestinationLLA>
        <Descr>Trade Winds: ${x(job.title)}</Descr>
        <DepartureName>${x(A.n)}</DepartureName>
        <DestinationName>${x(B.n)}</DestinationName>
        <AppVersion><AppVersionMajor>11</AppVersionMajor><AppVersionBuild>282174</AppVersionBuild></AppVersion>
        <ATCWaypoint id="${x(job.from)}"><ATCWaypointType>Airport</ATCWaypointType><WorldPosition>${plnLLA(A.lat,A.lon,A.el)}</WorldPosition><ICAO><ICAOIdent>${x(job.from)}</ICAOIdent></ICAO></ATCWaypoint>
        <ATCWaypoint id="${x(to)}"><ATCWaypointType>Airport</ATCWaypointType><WorldPosition>${plnLLA(B.lat,B.lon,B.el)}</WorldPosition><ICAO><ICAOIdent>${x(to)}</ICAOIdent></ICAO></ATCWaypoint>
    </FlightPlan.FlightPlan>
</SimBase.Document>
`; }
async function savePLN(job){
  const name=`TradeWinds_${job.from}_${job.local?job.from:job.to}.pln`; const text=buildPLN(job);
  if(window.twNative && twNative.saveFile){ try{ const ok=await twNative.saveFile(name, new TextEncoder().encode(text)); if(ok) toast('Flight plan saved. In MSFS open the World Map, choose Load, and pick the file.'); }catch(_){} return; }
  try{ const dl=window.claude && await claude.use('downloads'); if(dl){ await dl.save({filename:name+'.txt', data:text}); toast('Saved as .pln.txt (the browser only allows text files). Rename it to .pln, then in MSFS: World Map → Load.'); return; } }catch(err){ if(err && err.code==='declined') return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/xml'})); a.download=name; a.click(); }catch(_){ toast('Saving isn\'t available here.'); }
}
async function loadIntoSim(job){
  if(!S.mcp){ toast('MSFS isn\'t connected.'); return; } const p=plan(job);
  const fuelGal = Math.ceil(Math.max(p.gal*1.3, p.gal+5)); const payloadLb = Math.max(0, p.payload - 170);
  S.loading=true; renderPreflight();
  try{ const r=await S.mcp.callTool(SIM_SERVER,'load_aircraft',{fuelGal, payloadLb},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} }
    if(o && o.ok){ toast(`Loaded: ${o.fuel!=null?o.fuel+' gal of fuel':'fuel unchanged'}, ${o.payload!=null?o.payload+' lb of passengers and cargo':'payload unchanged'}.${o.notes&&o.notes.length?' '+o.notes[0]:''}`); }
    else toast(o && o.error ? `Couldn't load: ${o.error}` : `Couldn't load the plane. Update the MSFS Bridge to v1.3.`);
  }catch(e){ toast(e && (e.code==='not_in_manifest'||e.code==='tool_not_found'||/unknown|not found/i.test(e.message||'')) ? 'Your MSFS Bridge is older than v1.3. Update it to load the plane automatically.' : 'Couldn\'t reach MSFS to load the plane.'); }
  S.loading=false; setTimeout(()=>simPoll(true), 800); renderPreflight();
}
function preflightHTML(job){
  const C=preflightChecks(job); const p=plan(job); const allOk=C.every(c=>c.ok); const live=S.simState==='live';
  return `<div class="row between"><div><p class="label">Before you start</p><h3>Pre-flight sim check ${allOk?'<span class="chip good">All set</span>':''}</h3></div><button class="btn sm ghost" data-act="pf-recheck">Check again</button></div>
    <ul class="pf-list">${C.map(c=>`<li class="${c.ok?'ok':'no'}"><span class="pf-ic">${c.ok?'✓':'!'}</span><div><b>${esc(c.t)}</b>${c.d?`<span class="tiny muted">${esc(c.d)}</span>`:''}</div></li>`).join('')}</ul>
    <div class="row">${live?`<button class="btn sm primary" data-act="pf-load" ${S.loading?'disabled':''}>${S.loading?'Loading…':`Load ${Math.ceil(Math.max(p.gal*1.3, p.gal+5))} gal + ${Math.max(0,p.payload-170)} lb into MSFS`}</button>`:''}<button class="btn sm" data-act="pf-pln">Download MSFS flight plan (.pln)</button></div>
    <p class="tiny muted">Cruise altitude in the plan: ${cruiseAltFor(job).toLocaleString()} ft. Loading works with most default aircraft; some add-ons manage fuel and weights in their own tablet.</p>`;
}
function renderPreflight(){ const el=document.getElementById('preflight'); const a=S.st&&S.st.active; if(el && a) el.innerHTML=preflightHTML(a.job); }
const _pfFlight = flightView;
flightView = function(){ const h=_pfFlight(); const a=S.st&&S.st.active; if(!a || a.started || S.debrief || S.showResult) return h;
  return h.replace(/(<\/section>)/, `$1<section class="panel stack preflight" id="preflight">${preflightHTML(a.job)}</section>`); };
const _pfRender = renderSimBits;
renderSimBits = function(){ _pfRender(); if(S.view==='flight') renderPreflight(); };
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="pf-load"],[data-act="pf-pln"],[data-act="pf-recheck"]'); if(!b || !S.st || !S.st.active) return; const job=S.st.active.job;
  if(b.dataset.act==='pf-load') loadIntoSim(job); else if(b.dataset.act==='pf-pln') savePLN(job); else { simPoll(true); toast('Checking MSFS…'); }
});

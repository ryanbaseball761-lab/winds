/* ===================== FROM YOUR FIRST TEST FLIGHTS ===================== */

/* ---- 1. shorter checklists (5 phases, 3–4 items), detailed list optional ---- */
const _tfPhases = cockpitPhases;
const CK_GROUPS = [
  {n:'Before start', rx:/preflight/i, keys:[/fuel on board|^fuel/i,/payload|weight/i,/brief|weather/i,/passenger/i]},
  {n:'Start & taxi', rx:/^start|taxi/i, keys:[/mixture|starter|start/i,/avionics|transponder|frequenc/i,/taxi|hold short/i]},
  {n:'Takeoff', rx:/before takeoff|takeoff/i, keys:[/takeoff brief|rotate at/i,/flaps|trim/i,/climb at|climb/i,/lights|transponder alt/i]},
  {n:'Approach', rx:/cruise|descent|approach/i, keys:[/expect runway|runway/i,/before landing|seatbelt/i,/approach speed|kt/i]},
  {n:'Landing', rx:/landing|shutdown/i, keys:[/stabiliz/i,/touchdown|centerline/i,/parking brake|park|shutdown/i]}
];
cockpitPhases = function(st, job){ const full=_tfPhases(st, job); if((st&&st.pro&&st.pro.fullChecklist) || !full || full.length<5) return full;
  return CK_GROUPS.map(g=>{ const pool=[].concat(...full.filter(p=>g.rx.test(p.n) && !(g.n==='Start & taxi' && /before takeoff/i.test(p.n))).map(p=>p.items)); const out=[];
    for(const k of g.keys){ const it=pool.find(x=>k.test(x) && !out.includes(x)); if(it) out.push(it); }
    for(const x of pool){ if(out.length>=3) break; if(!out.includes(x)) out.push(x); }
    return {n:g.n, items:out.slice(0,4)}; }).filter(p=>p.items.length); };
/* expert: only "Before start" and "Start & taxi" are required before engine start */
checklistDone = function(a){ if(!a) return false; const ph=cockpitPhases(S.st, a.job); const ck=a.ck||{done:{}}; const n=(S.st.pro&&S.st.pro.fullChecklist)?4:2; for(let i=0;i<Math.min(n,ph.length);i++) for(let j=0;j<ph[i].items.length;j++) if(!ck.done[i+'-'+j]) return false; return true; };
checklistCount = function(a){ const ph=cockpitPhases(S.st, a.job); const ck=a.ck||{done:{}}; const n=(S.st.pro&&S.st.pro.fullChecklist)?4:2; let d=0,t=0; for(let i=0;i<Math.min(n,ph.length);i++) for(let j=0;j<ph[i].items.length;j++){ t++; if(ck.done[i+'-'+j]) d++; } return [d,t]; };

/* ---- 2. no scripted ATC: MSFS ATC does that job ---- */
const ATC_WHO = /^(Ground|Radio|ATC|Approach|Tower|Center|Departure)$/i;
const _tfCabin = cabinTick;
cabinTick = function(){ const r=_tfCabin.apply(this, arguments); try{ const a=S.st&&S.st.active; if(a&&a.cab&&a.cab.log) a.cab.log=a.cab.log.filter(m=>!ATC_WHO.test(m.who||'')); }catch(_){} return r; };

/* ---- 3. big moments take over the screen ---- */

/* ---- 4. story briefing up top, like the opening of a chapter ---- */
function chapterHero(job){ const m=STORY.find(x=>x.id===job.story); if(!m) return ''; const meta=arcMeta(m.arc); const chs=STORY.filter(x=>x.arc===m.arc); const idx=chs.indexOf(m)+1;
  const col = m.side ? '#e8782a' : (meta.main ? '#1f9d55' : (meta.col||'#0b746f'));
  const to=job.local?AP[job.from]:AP[job.to]; const d=job.local?(job.tourNm||40):Math.round(distNm(AP[job.from],AP[job.to]));
  const feat = m.feature || (m.teach&&m.teach[0]) || '';
  const art = typeof islandArt==='function' ? (()=>{ try{ return islandArt(job.local?job.from+'L':job.to, job.dep, 1200, 300, job.ac); }catch(_){ return ''; } })() : '';
  return `<section class="chapter-hero" style="--arc:${col}">${art?`<div class="ch-art" aria-hidden="true">${art}</div>`:''}<div class="ch-in">
    <div class="row between"><p class="ch-kicker">${esc(m.arc)} · Chapter ${idx} of ${chs.length}${m.side?' · side story':''}</p><div class="row ch-cast">${(m.chars||[]).filter(k=>CAST[k]).map(k=>avatar(k)).join('')}</div></div>
    <h1>${esc(m.title)}</h1>
    <div class="ch-brief">${(job.paras||m.brief||[]).map(t=>`<p>${esc(t)}</p>`).join('')}</div>
    <div class="ch-feature"><div><span class="label">Featured flight</span><b class="mono">${esc(job.from)} → ${esc(job.local?job.from:job.to)}</b><span class="small">${esc(to.n)}, ${esc(to.isl)} · ${d.toLocaleString()} nm</span></div>${feat?`<p class="small">${esc(feat)}</p>`:''}</div>
  </div></section>`; }
const _tfFlight = flightView;
flightView = function(){ let h=_tfFlight(); const a=S.st&&S.st.active; if(!a || a.started || S.showResult || S.debrief || a.job.kind!=='story') return h;
  h = h.replace(/<section class="panel stack">\s*<div class="row between"><h2>Briefing<\/h2>[\s\S]*?<\/section>/, '');
  return h.replace(/(<main class="wrap[^>]*>)/, '$1'+chapterHero(a.job)); };

/* ---- 5 + 6 + 7. load the plane, suggested parking and the sim clock, also once the flight has started ---- */
const PARK_PREF = { ga:['ramp_ga_small','ramp_ga','ramp_ga_medium'], stol:['ramp_ga_small','ramp_ga','ramp_ga_medium'], amph:['ramp_ga_small','ramp_ga','dock_ga'], hp:['ramp_ga_small','ramp_ga','ramp_ga_medium'], bush:['ramp_ga_medium','ramp_ga','ramp_ga_small'],
  twin:['ramp_ga_medium','ramp_ga','ramp_ga_large'], turbo:['ramp_ga_medium','ramp_ga_large','ramp_ga'], jet:['ramp_ga_large','ramp_ga_medium','gate_small'], regional:['gate_small','gate_medium','ramp_ga_large'], airliner:['gate_medium','gate_heavy'], widebody:['gate_heavy','gate_medium'] };
const PARK_LABEL = { ramp_ga:'GA ramp', ramp_ga_small:'GA ramp, small', ramp_ga_medium:'GA ramp, medium', ramp_ga_large:'GA ramp, large', ramp_cargo:'cargo ramp', gate_small:'small gate', gate_medium:'medium gate', gate_heavy:'heavy gate', dock_ga:'seaplane dock', ramp_ga_extra:'GA ramp', gate_extra:'gate' };
S.park = S.park || {};
function depRunway(job){ try{ const r=rwyAnalysis(job.from, job.wx, job.ac); const e=rwyEnds(job.from).find(x=>x.id===r.rw) || rwyEnds(job.from)[0]; return e||null; }catch(_){ return null; } }
function suggestParking(job){ const P=S.park[job.from]; const cls=AC[job.ac].cls; const pref=(job.cat==='cargo' && !['ga','stol','amph'].includes(cls)) ? ['ramp_cargo', ...(PARK_PREF[cls]||[])] : (PARK_PREF[cls]||PARK_PREF.ga);
  const rw=depRunway(job);
  if(!P || !P.spots || !P.spots.length) return { generic:true, text:`${PARK_LABEL[pref[0]]||'GA ramp'} parking${rw?` close to runway ${rw.id}`:''}`, rw };
  let best=null; for(let i=0;i<pref.length && !best;i++){ const c=P.spots.filter(s=>s.type===pref[i]); if(!c.length) continue; c.forEach(s=>{ s._d = rw ? distNm(s, rw.thr) : 0; }); c.sort((a,b)=>a._d-b._d); best=c[0]; }
  if(!best){ const c=P.spots.slice(); if(rw) c.forEach(s=>s._d=distNm(s,rw.thr)); c.sort((a,b)=>(a._d||0)-(b._d||0)); best=c[0]; }
  return { spot:best, rw, text:`${best.name} (${PARK_LABEL[best.type]||best.type.replace(/_/g,' ')})${rw?`, ${best._d<0.1?'right beside':(best._d.toFixed(1)+' nm from')} runway ${rw.id}`:''}` }; }
async function fetchParking(icao){ if(!S.mcp || S.park[icao] && (S.park[icao].spots || Date.now()-S.park[icao].t<60000)) return; S.park[icao]={t:Date.now()};
  try{ const r=await S.mcp.callTool(SIM_SERVER,'parking_spots',{icao},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} } if(o && o.ok && o.spots && o.spots.length){ S.park[icao]={t:Date.now(), spots:o.spots}; renderPreflight(); } }catch(_){} }
function parkingRowHTML(job){ if(job.local===undefined) return ''; const s=suggestParking(job); const live=S.simState==='live'; const atDep = live && S.sim.position && distNm({lat:S.sim.position.lat,lon:S.sim.position.lon},AP[job.from])<3;
  return `<div class="park-row"><span class="pf-ic">P</span><div><b>Spawn at: ${esc(s.text)}</b><span class="tiny muted">${s.generic?`In the MSFS world map, choose ${esc(job.from)} and pick a parking spot of this type near runway ${s.rw?esc(s.rw.id):''}.`:'Pick this spot in the MSFS world map when you load in, or use the button once you\'re in the sim.'}</span></div>${!s.generic && atDep && S.sim.motion && S.sim.motion.gs<1 ? `<button class="btn xs" data-act="park-move">Move me there</button>`:''}</div>`; }
async function autoClock(){ const a=S.st&&S.st.active; if(!a || a.started || a._clockSet || !(S.st.pro?S.st.pro.autoTime!==false:true) || S.simState!=='live' || !S.mcp) return; const s=S.sim; if(!s || !s.motion || !s.motion.onGround || !atDeparture(a.job)) return;
  a._clockSet=true; try{ const r=await S.mcp.callTool(SIM_SERVER,'set_time',{localMin:a.job.dep},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} } if(o && o.ok) toast(`MSFS clock set to ${hhmm(a.job.dep)} for this flight.`); }catch(_){} }
const _tfPfHTML = preflightHTML;
preflightHTML = function(job){ let h=_tfPfHTML(job); if(S.simState==='live') fetchParking(job.from);
  h = h.replace('<ul class="pf-list">', parkingRowHTML(job)+'<ul class="pf-list">');
  return h.replace('Briefing weather is generated', 'Briefing weather is generated').replace("It switches to your MSFS weather once you're at the departure airport.", "MSFS doesn't let add-ons change its weather, so the briefing follows MSFS instead: it switches to your sim's weather once you're at the departure airport. Live weather in MSFS works best."); };
document.addEventListener('click', async e=>{ if(!e.target.closest('[data-act="park-move"]') || !S.st || !S.st.active) return; const s=suggestParking(S.st.active.job); if(!s.spot) return;
  try{ const r=await S.mcp.callTool(SIM_SERVER,'move_to',{lat:s.spot.lat, lon:s.spot.lon, hdg:s.spot.hdg},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} } toast(o&&o.ok?`Moved to ${s.spot.name}.`:`Couldn't move: ${o&&o.error||'update the MSFS Bridge'}`); }catch(err){ toast('Moving the aircraft needs the Trade Winds app (or MSFS Bridge 1.5).'); } });
/* after "Start flight": keep the loading tools until you take off */
const _tfInflight = inflightView;
inflightView = function(){ let h=_tfInflight(); const a=S.st&&S.st.active; if(!a) return h; const rec=S.sim&&S.sim.recorder; const airborne = S.simState==='live' && ((S.sim.motion&&!S.sim.motion.onGround) || (rec && rec.takeoff && simRecFor(a)));
  if(airborne) return h; return h.replace(/(<main class="wrap[^>]*>[\s\S]*?<\/section>)/, m=>m+`<section class="panel stack preflight" id="preflight">${preflightHTML(a.job)}</section>`); };


/* settings */
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="pro-flag2"]'); if(!b||!S.st) return; proPrefs()[b.dataset.k]=b.checked; save(); });

/* ---- the mainland: The Tour (jet era) + charters to the US and Mexico ---- */
CAST.nova = {n:`Nova Reyes`, col:'#b0306a', role:`Pop star from Philipsburg, Sint Maarten`, bio:`Grew up two streets from the airport fence, watching jets cross Maho Beach. Now she sells out arenas, and she still gets airsick in small planes.`};
PORTRAIT.nova = {skin:'#9a6440', hair:'#2a120c', style:'long', top:'elegant', topC:'#1c1f2e', acc:['earrings','shades-head']};
ARC_META['The Tour'] = {main:true, n:3.5, tag:`Nova Reyes takes her first US tour, and she wants the pilot from home flying her.`, col:'#1f9d55'};
STORY.push(
 {id:'TR1',arc:`The Tour`,title:`The Call From Miami`,chars:['nova','mari'],req:{ratings:['JET'],hours:35},from:'TNCM',to:'KMIA',ac:['CJ4'],pax:5,cargo:400,cargoLabel:`stage outfits, two guitars and a lot of hair spray`,time:'day',dep:600,wx:'trades',
  feature:`Your first jet leg to the US mainland: 1,000 nm north over the islands, then into Miami's busy Class B airspace and US customs.`,
  brief:[`Nova Reyes grew up two streets from Princess Juliana's fence, watching the big jets cross Maho Beach. Now she's the biggest pop star the islands have ever produced, and her first US tour starts in Miami in two days.`,`Her label booked a fancy charter company. Nova cancelled it. "I want the pilot from home," she tells Mari on the phone. Mari hands you the phone. Five cities, one CJ4, and a star who still gets airsick in small planes.`],
  teach:[`Flying into the US from abroad: you need an airport of entry for customs. Miami is one, and the CBP ramp is busy.`,`Miami Class B is a different world from the islands. Expect vectors, speed restrictions and a fast-talking controller. Read back everything.`],
  out:{good:`Nova's manager times the flight and says it beat the airline by forty minutes. Nova just says, "Smoothest flight of my life," and sleeps the whole way into Miami.`,ok:`A long day, but the band arrives in Miami on time. Nova signs a T-shirt for the customs officer.`,bad:`It's a bumpy arrival into Miami, and Nova is a little green. "Still better than the boat," she says.`},rep:{mari:3}},
 {id:'TR2',arc:`The Tour`,title:`Atlanta Thunder`,chars:['nova'],req:{after:'TR1'},from:'KMIA',to:'KATL',ac:['CJ4'],pax:5,cargo:400,cargoLabel:`the band's gear and a cooler of Nova's mom's johnnycakes`,time:'day',dep:900,wx:'tstorm',
  feature:`Summer thunderstorms over Georgia, then an arrival into the busiest airport in the world.`,
  brief:[`Second city: Atlanta, the busiest airport on the planet. A line of afternoon thunderstorms is building across Georgia, and the show starts at eight.`,`Nova's drummer has never flown in a small jet and asks every five minutes whether the bumps are normal. Nova's answer: "Ask the pilot. The pilot is the calm one."`],
  teach:[`Thunderstorms: give the big cells at least 20 nm of space, and never fly under an anvil. Ask ATC early for deviations.`,`Atlanta runs several parallel runways at once. Confirm your runway and your approach before you start down.`],
  out:{good:`You weave between towering cells and land on time. The drummer stops asking questions and starts filming the clouds.`,ok:`A few long deviations, but the band makes soundcheck with ten minutes to spare.`,bad:`It's a rough ride through the edge of a cell, and the drummer is done talking. Nobody blames you. Everybody's quiet.`},rep:{}},
 {id:'TR3',arc:`The Tour`,title:`The Windy City`,chars:['nova'],req:{after:'TR2'},from:'KATL',to:'KORD',ac:['CJ4'],pax:5,cargo:400,cargoLabel:`costumes, a keyboard and a box of merch`,time:'day',dep:660,wx:'north',
  feature:`O'Hare in a gusty northwest wind: a busy arrival with a real crosswind landing at the end.`,
  brief:[`Chicago in a gusty northwest wind. Nova has never been somewhere this cold in her life and has bought a coat that looks like a sleeping bag.`,`O'Hare is all parallel runways and fast-moving traffic. The controller will give you a runway, an approach and a speed, all in one breath.`],
  teach:[`A strong crosswind in a jet: crab on final, then kick it straight with rudder just before touchdown. Keep the upwind wing slightly low.`,`Add half the gust factor to your approach speed, and don't let the airplane float.`],
  out:{good:`A textbook crosswind landing. Nova's manager, who used to fly airlines, gives you a single, approving nod.`,ok:`A firm, crabbed arrival, but safe. Nova steps out into the wind and immediately gets back in.`,bad:`A rough landing in the gusts. Nova says she's fine. The keyboard is less sure.`},rep:{}},
 {id:'TR4',arc:`The Tour`,title:`New York, New York`,chars:['nova'],req:{after:'TR3'},from:'KORD',to:'KTEB',ac:['CJ4'],pax:5,cargo:400,cargoLabel:`the stage outfits for Madison Square Garden`,time:'night',dep:1170,wx:'calm',
  feature:`A night arrival into Teterboro with the Manhattan skyline off your left wing.`,
  brief:[`The big one: Madison Square Garden. You're flying into Teterboro at night, the airport New York's private jets use, sitting under some of the busiest airspace in the world.`,`Somewhere over Pennsylvania, Nova comes up to the cockpit and sits on the jump seat, very quietly. "I used to dream about this," she says. "Not the show. Landing in New York."`],
  teach:[`Teterboro sits under the New York Class B. Altitudes on the arrival are strict and low. Fly them exactly.`,`Night arrival over a city: the lights hide the terrain and the runway. Trust the approach, not the view.`],
  out:{good:`The Manhattan skyline slides past the left wing, and you put it down gently at Teterboro. Nova doesn't say anything. She just squeezes your shoulder.`,ok:`A busy night arrival, but tidy. The Garden is sold out, and Nova dedicates a song to "my pilot."`,bad:`It's a long, hard night arrival, and the landing is firm. Nova still plays the best show of her life.`},rep:{}},
 {id:'TR5',arc:`The Tour`,title:`Homecoming`,chars:['nova','mari'],req:{after:'TR4'},from:'KTEB',to:'TNCM',ac:['CJ4'],pax:5,cargo:400,cargoLabel:`a Grammy-shaped box nobody is allowed to talk about`,time:'sunset',dep:1020,wx:'trades',reward:{bonus:8000,note:`Nova's label pays a homecoming bonus, and she insists the Coral Wing crew are her guests at her next island show.`},
  feature:`1,450 nm over the Atlantic, then the famous Maho Beach arrival into Princess Juliana at sunset, in a jet, with the whole island watching.`,
  brief:[`The tour is over and Nova wants to go home. Not to Miami. Home: Philipsburg, where her mother is waiting on Maho Beach with half the island.`,`It's a long overwater leg from New York, and you'll arrive at sunset over the most famous beach in aviation. Nova asks for one thing: "Make it a good one. My mom is filming."`],
  teach:[`Long overwater legs: plan fuel with a real reserve and an alternate, and keep track of the nearest airport the whole way.`,`The Maho Beach approach to runway 10 is low over the sand and the road. Stay on the glidepath, because the fence is right there.`],
  out:{good:`You cross Maho Beach at sunset and the crowd goes wild. Nova's mother's video gets four million views by morning. In every one of them, the landing is perfect.`,ok:`A lovely sunset arrival. Nova runs across the ramp to her mother before the engines have spooled down.`,bad:`A firm arrival in front of half the island. Nobody cares. Nova's home.`},rep:{mari:5}}
);
ARCH.push({id:'mainland',label:`Mainland charter`,kind:'vip',w:0,cls:['jet','turbo'],need:'JET',pax:[1,6],cargo:[50,300],vip:true,mult:1.3,
  story:c=>{ const who=pick([[`${pick(NAMES.first)} ${pick(NAMES.last)}`,`a hotel developer`],[`${pick(NAMES.first)} ${pick(NAMES.last)}`,`a cardiologist heading to a conference`],[`The ${pick(NAMES.last)} family`,`going home after a month in the islands`],[`${pick(NAMES.first)} ${pick(NAMES.last)}`,`a film producer`]]);
    return { title:`Charter to ${c.to.isl}`, client:who[0], paras:[`${who[0]}, ${who[1]}, wants a private flight from ${c.from.isl} to ${c.to.n} in ${c.to.isl}. Airlines would mean two connections and a day of airports. You can do it in a few hours.`,`It's a long leg off the islands and onto the mainland, so plan fuel carefully, file the right customs paperwork, and expect busy, fast-talking airspace at the other end.`] }; }});
const MAINLAND = ['KMIA','KFLL','KPBI','KTEB','KJFK','KATL','KORD','MMUN','MZBZ','MRLB','MPTO'].filter(k=>AP[k]);
/* the clock row offers to set MSFS instead of moving the flight */
const _tfChecks = preflightChecks;
preflightChecks = function(job){ const out=_tfChecks(job); const t=out.find(c=>c.k==='time'); if(t && !t.ok && window.twNative){ t.act='pf-settime'; t.actLabel=`Set MSFS to ${hhmm(job.dep)}`; t.d='Or set the time in the MSFS weather & time panel.'; } return out; };
document.addEventListener('click', async e=>{ if(!e.target.closest('[data-act="pf-settime"]') || !S.st || !S.st.active || !S.mcp) return; const job=S.st.active.job;
  try{ const r=await S.mcp.callTool(SIM_SERVER,'set_time',{localMin:job.dep},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} } toast(o&&o.ok?`MSFS clock set to ${hhmm(job.dep)}.`:`Couldn't set the clock: ${o&&o.error||'unknown'}`); setTimeout(()=>simPoll(true), 1200); }catch(_){ toast('Setting the clock needs the Trade Winds app.'); } });
const _tfPf2 = preflightHTML;
preflightHTML = function(job){ const h=_tfPf2(job); return (S.st&&S.st.active&&S.st.active.started) ? h.replace('<p class="label">Before you start</p>','<p class="label">Before takeoff</p>') : h; };

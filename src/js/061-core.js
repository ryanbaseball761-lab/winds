/* ===================== FROM TEST FLIGHT #2 ===================== */

/* ---- 1. flight screen reads top to bottom: briefing, setup steps, then the boarding pass with Start ---- */
const _fbFlight = flightView;
flightView = function(){ const h=_fbFlight(); const a=S.st&&S.st.active; if(!a || a.started || S.showResult || S.debrief) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  const hero=main.querySelector(':scope > .chapter-hero'); const brief=[...main.querySelectorAll(':scope > section')].find(s=>/^Briefing/.test(headText(s))); const setup=main.querySelector('#preflight'); const pass=main.querySelector(':scope > .pass');
  const top=hero||brief; if(top) main.prepend(top); if(setup) (top?top.after(setup):main.prepend(setup)); if(pass && setup) setup.after(pass);
  return t.innerHTML; };
/* setup tiles in the order you do them, numbered; parking first */
const STEP_ORDER = [['Parking spot','Spawn here'],['Fuel & cargo','Fuel & weight'],['Time of day','Time of day'],['Runways','Runways'],['Weather','Weather']];
const _fbPf = preflightHTML;
preflightHTML = function(job){ const a=S.st&&S.st.active; const s=S.sim; const started=a&&a.started; const moving = S.simState==='live' && s && s.motion && (!s.motion.onGround || s.motion.gs>2);
  if(started && moving) return `<div class="row between"><div><p class="label">Flight setup</p><h3>Done. You're on your way.</h3></div></div><p class="small muted">Fuel and weights are locked once you're moving.</p>`;
  const t=tpl(_fbPf(job)); const grid=t.content.querySelector('.su-grid'); if(grid){ const tiles=[...grid.children]; let n=1;
    STEP_ORDER.forEach(([label,newLabel])=>{ const tl=tiles.find(x=>((x.querySelector('.label')||{}).textContent||'')===label); if(tl){ tl.querySelector('.label').textContent=`${n++}. ${newLabel}`; grid.appendChild(tl); } }); }
  if(started) t.content.querySelectorAll('.su-chip').forEach(c=>{ if(/nm from|Moving|Parked|At [A-Z]{4}/.test(c.textContent)) c.remove(); });
  return t.innerHTML; };
/* fuel and weights are locked once you're rolling or airborne; and only fuel is loaded, so the plane can't tip over */
loadIntoSim = async function(job){ if(!S.mcp){ toast('MSFS isn\'t connected.'); return; } const s=S.sim; const rec=s&&s.recorder;
  if(s && s.motion && (!s.motion.onGround || s.motion.gs>2) || (rec && rec.takeoff && S.st.active && S.st.active.started)){ toast('Fuel is locked once you\'re moving.'); return; }
  const p=plan(job); const fuelGal=Math.ceil(Math.max(p.gal*1.3, p.gal+5)); S.loading=true; renderPreflight();
  try{ const r=await S.mcp.callTool(SIM_SERVER,'load_aircraft',{fuelGal},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} }
    toast(o && o.ok ? `Loaded ${o.fuel!=null?o.fuel+' gal of fuel':'fuel'}. Set passengers and bags (${Math.max(0,p.payload-170)} lb) in the MSFS weight menu.` : `Couldn't load fuel${o&&o.error?': '+o.error:''}.`); }
  catch(e){ toast('Couldn\'t reach MSFS to load fuel.'); }
  S.loading=false; setTimeout(()=>simPoll(true), 800); renderPreflight(); };

/* ---- 2. fuel warning: plan with cruise speed, not the slow takeoff groundspeed, and wait until you're established ---- */
/* (replaces the check inside the safety calls by giving it honest inputs) */

/* ---- 5 + 6. no duty day, no "past midnight": the day rolls over by itself ---- */
dutyAfter = function(){ return 0; };
const _fbBoard = boardView;
boardView = function(){ const h=_fbBoard(); if(S.view!=='board'||!S.st) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  main.querySelectorAll('section, .notice, aside > *').forEach(s=>{ if(!s.parentNode) return; const ht=headText(s); if((/Duty day/.test(ht) || /out of duty time/i.test(s.textContent)) && !/Travel as a passenger/.test(s.textContent)) s.remove(); });
  const aside=main.querySelector('aside.stack'); if(aside){ const nd=document.createElement('section'); nd.className='panel stack'; nd.innerHTML=`<div class="row between"><h3>Want different work?</h3></div><p class="small muted">Start a new day for a fresh set of jobs.</p><button class="btn" data-act="rest">New day</button>`; aside.prepend(nd); }
  return t.innerHTML; };

/* ---- 7. Coral Wing pays your deadhead tickets until you run your own company ---- */
const _fbDh = deadheadCost;
deadheadCost = function(st, to){ const d=_fbDh(st, to); return (st && st.company) ? d : Object.assign({}, d, {cost:0, paid:true}); };

/* ---- 8. two storylines: the main story and Starling; the other stories become special charters once you're Commercial ---- */
const KEEP_ARCS = new Set([...MAIN_ORDER, 'Starling']);
const SPECIALS = STORY.filter(m=>!KEEP_ARCS.has(m.arc) && !/^CG/.test(m.id));
for(let i=STORY.length-1;i>=0;i--) if(!KEEP_ARCS.has(STORY[i].arc)) STORY.splice(i,1);
ARCH.push({id:'special', label:'Special charter', kind:'vip', w:0, cls:['ga','stol','hp','bush','twin','turbo','amph','jet'], need:'COMM', pax:[1,9], cargo:[0,500], story:()=>({title:'',client:'',paras:[]})});

/* ---- sealed orders that don't match the sky: weather scenarios need real weather ---- */
const WX_SCEN = new Set(['squall']);
function skyIsClear(){ const w=S.simState==='live' && S.sim && S.sim.ext && S.sim.ext.weather; return !!(w && w.visSm>=7 && !w.inCloud); }

/* ---- comfort only counts when the cabin actually rode along ---- */
/* ---- the board's sky matches MSFS when you're sitting at that airport ---- */
const _fbLocWx = genLocWx;
genLocWx = function(st){ const base=_fbLocWx(st); try{ const s=S.sim; if(S.simState==='live' && s && s.position && distNm({lat:s.position.lat,lon:s.position.lon},AP[st.loc])<5){ const w=simWx(base); if(w) return w; } }catch(_){} return base; };

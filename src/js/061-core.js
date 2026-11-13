/* ===================== FROM TEST FLIGHT #2 ===================== */

/* ---- 1. flight screen reads top to bottom: briefing, setup steps, then the boarding pass with Start ---- */
/* setup tiles in the order you do them, numbered; parking first */
const STEP_ORDER = [['Parking spot','Spawn here'],['Fuel & cargo','Fuel & weight'],['Time of day','Time of day'],['Runways','Runways'],['Weather','Weather']];
/* fuel and weights are locked once you're rolling or airborne; and only fuel is loaded, so the plane can't tip over */
async function loadIntoSim(job){ if(!S.mcp){ toast('MSFS isn\'t connected.'); return; } const s=S.sim; const rec=s&&s.recorder;
  if(s && s.motion && (!s.motion.onGround || s.motion.gs>2) || (rec && rec.takeoff && S.st.active && S.st.active.started)){ toast('Fuel is locked once you\'re moving.'); return; }
  const p=plan(job); const fuelGal=Math.ceil(Math.max(p.gal*1.3, p.gal+5)); S.loading=true; renderPreflight();
  try{ const r=await S.mcp.callTool(SIM_SERVER,'load_aircraft',{fuelGal},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} }
    toast(o && o.ok ? `Loaded ${o.fuel!=null?o.fuel+' gal of fuel':'fuel'}. Set passengers and bags (${Math.max(0,p.payload-170)} lb) in the MSFS weight menu.` : `Couldn't load fuel${o&&o.error?': '+o.error:''}.`); }
  catch(e){ toast('Couldn\'t reach MSFS to load fuel.'); }
  S.loading=false; setTimeout(()=>simPoll(true), 800); renderPreflight(); };

/* ---- 2. fuel warning: plan with cruise speed, not the slow takeoff groundspeed, and wait until you're established ---- */
/* (replaces the check inside the safety calls by giving it honest inputs) */

/* ---- 5 + 6. no duty day, no "past midnight": the day rolls over by itself ---- */
function dutyAfter(){ return 0; }

/* ---- 7. Coral Wing pays your deadhead tickets until you run your own company ---- */
function deadheadCost(st, to){ const d=deadheadCostBase(st, to); return (st && st.company) ? d : Object.assign({}, d, {cost:0, paid:true}); }

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
function genLocWx(st){ const base=genLocWxBase(st); try{ const s=S.sim; if(S.simState==='live' && s && s.position && distNm({lat:s.position.lat,lon:s.position.lon},AP[st.loc])<5){ const w=simWx(base); if(w) return w; } }catch(_){} return base; }

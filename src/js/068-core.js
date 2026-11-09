/* ===================== VOICES THAT FIT THE FLIGHT ===================== */
/* checkrides: the examiner talks like an examiner, never like a scared tourist */
CABIN_CTX.check = {
  takeoff:[`The examiner makes a note on her kneeboard and says nothing.`,`"Good. Climb on runway heading," the examiner says.`],
  cruise:[`"Nice and steady. Carry on," the examiner says.`,`The examiner taps the altimeter. "Hold that altitude for me."`],
  near:[`"All right. Show me a good landing," the examiner says.`],
  bump:[`"Bit of turbulence. Keep the wings level," the examiner says calmly.`],
  bump2:[`"Smooth inputs," the examiner reminds you.`],
  dive:[`"Watch your descent rate," the examiner says.`],
  tdB:[`"Very nice," the examiner says, writing.`], tdS:[`"Good," the examiner says, writing.`], tdF:[`"A bit firm. It'll do," the examiner says.`], tdH:[`The examiner winces and writes for a long time.`]};
const _vcCat = cabinCategory;
cabinCategory = function(job){ return job && job.kind==='check' ? 'check' : _vcCat(job); };

/* in cloud or rain nobody comments on the view */
const IMC_LINES = {
  takeoff:[`The windows go white a few seconds after takeoff. The cabin goes quiet.`],
  cruise:[`Nothing but grey outside the windows. Someone asks how you can tell which way is up.`,`Rain streaks across the windows. Everyone is quiet, watching the cloud.`],
  near:[`"Are we close? I can't see a thing out there," someone asks.`]};
function inMurk(){ const w=S.simState==='live' && S.sim && S.sim.ext && S.sim.ext.weather; return !!(w && (w.inCloud || (w.visSm!=null && w.visSm<4))); }
const _vcPick = cabinPick;
cabinPick = function(k, job){ if(job && job.kind!=='check' && IMC_LINES[k] && inMurk()) return pick(IMC_LINES[k]); return _vcPick(k, job); };

/* water landings: wheels must be UP. No "check gear" calls asking for them down; a warning if they're down */
function waterDest(a){ if(!a) return false; const code=a.job.local?a.job.from:a.job.to; return !!(AP[code] && AP[code].water); }
function noGearCheck(fn){ return function(){ const a=S.st&&S.st.active; const g=S.sim&&S.sim.ext&&S.sim.ext.gear; if(g && waterDest(a)){ const r=g.retractable; g.retractable=false; try{ return fn.apply(this, arguments); } finally { g.retractable=r; } } return fn.apply(this, arguments); }; }
coachTick = noGearCheck(coachTick);
copilotTick = noGearCheck(copilotTick);
const _vcSim = renderSimBits;
renderSimBits = function(){ _vcSim(); try{ const a=S.st&&S.st.active, s=S.sim; if(!a||!a.started||!waterDest(a)||!s||!s.position||!s.motion||s.motion.onGround) return; const g=s.ext&&s.ext.gear; const dest=AP[a.job.local?a.job.from:a.job.to];
  if(g && g.retractable && g.down && distNm({lat:s.position.lat,lon:s.position.lon},dest)<4 && s.position.aglFt<1500) safeSay('watergear', `Gear is down. Gear up for a water landing!`, 30000); }catch(_){} };

/* the copilot never calls for gear on an airplane whose wheels don't move */
const _vcSay = copilotSay;
copilotSay = function(text, key){ const g=S.sim&&S.sim.ext&&S.sim.ext.gear; if(/gear/i.test(String(text)) && g && !g.retractable) text=String(text).replace(/\s*Check gear!?/i,' stable.').replace(/Five hundred\.\s+stable\./,'Five hundred, stable.'); return _vcSay(text, key); };

/* checkride texts */
try{ RATINGS.SEA.tasks = [`Takeoff and climb-out from Juliana`, `Water landing in Simpson Bay Lagoon: landing attitude, a steady 100–150 fpm down, no flaring by eye`, `Taxi slowly clear of boats`]; }catch(_){}
try{ SCEN.engine_fail_twin.sim = `MSFS 2024 has no simple failures menu for this. In the DA62, switch the LEFT ENGINE MASTER off (leave it off until you're set up to land). In a twin with mixture levers, pull the left mixture to cut-off instead.`; }catch(_){}

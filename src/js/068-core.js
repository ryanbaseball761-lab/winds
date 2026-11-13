/* ===================== VOICES THAT FIT THE FLIGHT ===================== */
/* water landings: wheels must be UP. No "check gear" calls asking for them down; a warning if they're down */
function waterDest(a){ if(!a) return false; const code=a.job.local?a.job.from:a.job.to; return !!(AP[code] && AP[code].water); }

/* the copilot never calls for gear on an airplane whose wheels don't move */

/* checkride texts */
try{ RATINGS.SEA.tasks = [`Takeoff and climb-out from Juliana`, `Water landing in Simpson Bay Lagoon: landing attitude, a steady 100–150 fpm down, no flaring by eye`, `Taxi slowly clear of boats`]; }catch(_){}
try{ SCEN.engine_fail_twin.sim = `MSFS 2024 has no simple failures menu for this. In the DA62, switch the LEFT ENGINE MASTER off (leave it off until you're set up to land). In a twin with mixture levers, pull the left mixture to cut-off instead.`; }catch(_){}

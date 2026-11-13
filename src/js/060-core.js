/* ===================== GUARD: ignore MSFS menu scenes and anything that isn't your flight ===================== */
/* the sim data only counts once the flight has started, and only near the route */
function simRelevant(a){ const s=S.sim; if(!a || !a.started || S.simState!=='live' || !s || !s.position) return false; const p={lat:s.position.lat, lon:s.position.lon};
  const from=AP[a.job.from], to=a.job.local?from:AP[a.job.to]; const route=a.job.local?(a.job.tourNm||40):distNm(from,to); const lim=Math.max(60, route*1.3+30);
  return distNm(p,from) < lim || distNm(p,to) < lim; }
/* a flight only logs itself if it took off from the departure airport after you started, and landed at an airport */
function autoReady(a){ if(!a || !a.started) return null; const rec=simRecFor(a); if(!rec || !rec.touchdown || !rec.takeoff) return null; const j=a.job;
  if(j.kind==='check' || j.request || (j.bonus && !j.bonus.auto)) return null;
  if(rec.takeoff.t < a.started - 120000) return null;
  if(rec.takeoff.lat!=null && distNm({lat:rec.takeoff.lat, lon:rec.takeoff.lon}, AP[j.from]) > 8) return null;
  const near=nearestAirport(rec.touchdown.lat, rec.touchdown.lon); if(near.d > 6) return null;
  if(rec.touchdown.t - rec.takeoff.t < 90000) return null;
  return rec; }
/* rename: The Logbook is now "Lost & Found" */
(function(){ const OLD='The Logbook', NEW='Lost & Found'; STORY.forEach(m=>{ if(m.arc===OLD) m.arc=NEW; }); if(ARC_META[OLD]){ ARC_META[NEW]=Object.assign({}, ARC_META[OLD], {tag:`A lost logbook from 1978, a mail pilot who vanished, and the examiner who knew him.`}); delete ARC_META[OLD]; } if(typeof ARC_COLORS!=='undefined'){ ARC_COLORS[NEW]=ARC_COLORS[OLD]||'#7a5c3a'; delete ARC_COLORS[OLD]; if(ARC_META[NEW]) ARC_META[NEW].col=ARC_COLORS[NEW]; } })();

/* ===================== Checkrides: an A or B (or 70+) with no crash is a pass ===================== */
const _ckEasy = applyResult;
applyResult = function(st, job, f, res){ if(job.kind==='check' && f && !res.crash && (res.score>=70 || res.grade==='A' || res.grade==='B')){ f.tasks=(job.tasks||[]).slice(); if(f.landing==='hard') f.landing='firm'; res.score=Math.max(70, res.score); } return _ckEasy(st, job, f, res); };
/* a checkride already failed with an A or B is passed now */
(function(){ let done=false; const _r=render; render=function(){ if(!done && S.st){ done=true; try{ const st=S.st, L=st.last;
  if(L && L.job && L.job.kind==='check' && L.out && !L.out.pass && L.res && !L.res.crash && (L.res.grade==='A'||L.res.grade==='B'||L.res.score>=70) && !st.ratings[L.job.rating]){
    const R=RATINGS[L.job.rating]; st.ratings[L.job.rating]=true; if(st.cooldown) delete st.cooldown[L.job.rating]; L.out.pass=true;
    L.out.notes=(L.out.notes||[]).filter(n=>!/^Not this time/.test(n)); L.out.notes.push(`Passed. You now hold the ${R.n}.`);
    try{ addJournal(st,`Earned: ${R.n}`, `${CAST[L.job.chars[0]].n} signs the logbook. ${R.unlocks}`, L.job.chars, 'milestone'); }catch(_){}
    save(); setTimeout(()=>toast(`Checkride passed: you now hold the ${R.n}.`),800); } }catch(_){} } return _r.apply(this, arguments); }; })();

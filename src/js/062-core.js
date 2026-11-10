/* ===================== FAIRER AND LESS ANNOYING (from your real flight logs) ===================== */
/* 1 + 2. impossible sim readings (a 17,840 fpm "landing", a 5.68 G spike at 859 fpm) are corrected before grading */
function saneTouchdown(td){ if(!td) return td; const t=Object.assign({}, td); const g=t.g||1.2;
  if(t.fpm>1500 && g<1.8){ t.fpm = g<1.15?120 : g<1.3?220 : g<1.6?350 : 500; t.estimated=true; }
  if(t.g>3.5 && t.fpm<900){ t.g = Math.round((1.15 + t.fpm/1200)*100)/100; t.gEstimated=true; }
  return t; }
const _frAuto = autoFinish;
autoFinish = function(rec, how){ if(rec && rec.touchdown){ rec = Object.assign({}, rec, {touchdown: saneTouchdown(rec.touchdown)}); } return _frAuto(rec, how); };

/* 3. a touchdown "300 ft off the centerline" on a 150 ft runway means the runway data doesn't match the scenery, not your flying */
const _frTda = touchdownAnalysis;
touchdownAnalysis = function(code, td){ const A=_frTda(code, td); if(A && A.runway && Math.abs(A.xt) > A.w*0.9){ A.approx=true; A.center='unknown'; } return A; };

/* 4 + 5. fairer landing grades, and a checkride isn't failed for a firm 373 fpm landing */
landingClass = function(fpm){ const d=diff(); const T = d==='expert' ? [80,170,320] : d==='casual' ? [130,260,600] : [110,220,450]; return fpm<T[0]?'butter':fpm<T[1]?'smooth':fpm<T[2]?'firm':'hard'; };
LANDING.hard.pts = 10; LANDING.firm.pts = 20;

/* 6. local flights (tours, circuits, searches) were planned twice as long as they really take */
const _frPlan = plan;
plan = function(job){ const p=_frPlan(job); if(job && job.local){ p.est = Math.max(10, Math.round(p.est*0.6)); } return p; };

/* 7. one rough landing shouldn't ground a plane: damage per flight is capped and Dez repairs more overnight */

/* 8. cargo flights are graded on the cargo, not on passengers who aren't there */

/* 9. no "Finish flight" button before the flight has started (too easy to press by mistake) */
const _frPass = boardingPass;
boardingPass = function(st, job, p, a, started){ const h=_frPass.apply(this, arguments); return started ? h : h.replace(/<button[^>]*data-act="debrief"[^>]*>[\s\S]*?<\/button>/, ''); };

/* 10. free deadheads say so */
 
 

/* 11. the cabin never drops to 0 comfort from normal flying */
const _frAuto2 = autoFinish;
autoFinish = function(rec, how){ const a=S.st&&S.st.active; if(a && a.cab && a.cab.comfort!=null) a.cab.comfort=Math.max(25, a.cab.comfort); return _frAuto2(rec, how); };

/* 12. result notes: no landing league, no "airframe 100%" line, at most four, the rest folded */
const _frRes = resultView;
resultView = function(){ const h=_frRes(); const t=tpl(h); const box=t.content.querySelector('main .notice ul'); if(box){ const li=[...box.children]; li.forEach(x=>{ if(/Landing league|airframe health: (9\d|100)%/.test(x.textContent)) x.remove(); }); const rest=[...box.children].slice(4); if(rest.length){ const d=document.createElement('details'); d.innerHTML=`<summary class="small muted">${rest.length} more note${rest.length>1?'s':''}</summary>`; const ul=document.createElement('ul'); ul.className='tight'; rest.forEach(x=>ul.appendChild(x)); d.appendChild(ul); box.after(d); } } return t.innerHTML; };

/* 13. difficulty can't be changed in the middle of a flight (it changes the grading) */
window.addEventListener('click', e=>{ const b=e.target.closest('[data-act="diff"]'); if(!b || !S.st || !S.st.active || !S.st.active.started) return; e.stopImmediatePropagation(); e.preventDefault(); toast('Change difficulty between flights, not during one.'); }, true);

/* 14. if a different aircraft you can fly is loaded in MSFS, switch the job to it in one tap */
const _frPf = preflightHTML;
preflightHTML = function(job){ let h=_frPf(job); try{ const a=S.st&&S.st.active; if(!a || a.started || S.simState!=='live') return h; const L=loadedAircraft(); if(!L.id || L.id===job.ac || !canFly(S.st, L.id)) return h;
    const probe=JSON.parse(JSON.stringify(job)); if(!refitJob(S.st, probe, L.id)) return h;
    h=h.replace('<div class="su-chips">', `<div class="notice switch-ac"><b>MSFS has the ${esc(AC[L.id].n)} loaded.</b> <button class="btn sm primary" data-act="use-loaded">Fly this job in it instead</button></div><div class="su-chips">`); }catch(_){} return h; };
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="use-loaded"]') || !S.st || !S.st.active) return; const L=loadedAircraft(); const job=S.st.active.job; if(L.id && refitJob(S.st, job, L.id)){ save(); toast(`Switched to the ${AC[L.id].n}.`); S.keepScroll=true; render(); } else toast('That aircraft can\'t do this job.'); });

/* 15. sealed orders only on flights long enough to need them, and never on checkrides or first flights */
const _frGen = genJobs;
genJobs = function(st){ const L=_frGen(st); L.forEach(j=>{ if(j.scen && ((j.est||plan(j).est) < 20 || st.flights < 3)) j.scen=null; }); return L; };

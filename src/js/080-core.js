/* ===================== TESTING: skip any flight with a perfect grade ===================== */
function testSkip(){ const st=S.st, a=st&&st.active; if(!a) return; const job=a.job; a.started=a.started||Date.now();
  const f={ landing:'butter', tdz:true, center:true, fuel:40, fuelUnit:'pct', block:(job.est||plan(job).est), landedAt:job.local?job.from:job.to, checklist:true, radio:true, weather:true, smooth:true, scen:null, tasks:(job.tasks||[]).slice(), bonus:true, request:true, verified:false, simFpm:0, simBounces:0, simG:null, comfort:null, testSkip:true };
  const res=score(job, f); res.score=100; res.grade='A'; res.crash=false; if(res.parts) res.parts=res.parts.map(p=>[p[0],p[2],p[2]]);
  applyResult(st, job, f, res); try{ if(st.last){ st.last.res.score=100; st.last.res.grade='A'; if(st.last.out){ st.last.out.score=100; st.last.out.grade='A'; } } }catch(_){} try{ if(st.last && st.last.out) st.last.out.notes.unshift('Skipped for testing: counted as a perfect flight.'); }catch(_){}
  S.debrief=false; S.showResult=true; S.busy.journalDone=false; save(); go('flight'); window.scrollTo(0,0); }
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="test-skip"]')) testSkip(); });
const SKIP_BTN = `<button class="btn sm test-skip" data-act="test-skip" title="Testing only: finishes this flight as a perfect A">Skip flight (test) · 100% A</button>`;
(function(){ const s=document.createElement('style'); s.textContent=`.test-skip-bar{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin:0 0 10px}.test-skip{border:1px dashed #c8962a;color:#c8962a;background:transparent}`; document.head.appendChild(s); })();

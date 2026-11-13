/* ===================== 20 UPGRADES: clarity, pages and testing ===================== */

/* ---- 14. one "Right now" button in the header on every page ---- */
function rightNowBase(st){ if(!st) return null; const a=st.active; if(a) return {t:a.started?'Flight in progress':'Your booked flight', b:a.started?'Open flight':'Open flight', act:'nav', v:'flight'};
  const MC=mainChapters(); const next=MC.find(m=>!st.story.done[m.id]); if(!next) return {t:'Story complete', b:'Side jobs', act:'nav', v:'board'};
  const availSet=new Set(storyAvailable(st).map(m=>m.id)); const s=chapterStatus(st,next,availSet); const n=MC.indexOf(next)+1;
  if(s.k==='ready') return {t:`Chapter ${n} · ${next.title}`, b:'▶ Play', act:'accept-story', id:next.id};
  if(s.k==='travel') return {t:`Chapter ${n} · ${next.title}`, b:'▶ Play', act:'story-go', id:next.id};
  if(s.k==='locked'){ const need=((next.req||{}).ratings||[]).find(r=>!st.ratings[r]); if(need && checkrideReady(st,need).ok) return {t:`Next: ${RATINGS[need].n} checkride`, b:'Book it', act:'nav', v:'pilot'}; if(need) return {t:`Needs ${RATINGS[need].n}`, b:'Fly side jobs', act:'nav', v:'board'}; }
  if(s.k==='aircraft') return {t:`Chapter ${n} needs an aircraft`, b:'Hangar', act:'nav', v:'hangar'};
  return {t:`Chapter ${n} · ${next.title}`, b:'Story', act:'nav', v:'story'}; }

/* ---- 15. result screen: one summary card, everything else folded ---- */

/* ---- 16. pilot page: the licence ladder says what each licence unlocks in the story ---- */
const LADDER = [['PPL','Act 1 · the Cessna'],['JET','Act 2 · the Vision Jet and the CJ4'],['ATP','Act 4 · airliners and the 747']];
document.addEventListener('click', e=>{ const a=e.target.closest('[data-act="lad-go"]'); if(!a) return; e.preventDefault(); const el=document.querySelector(`[data-act="book-check"][data-r="${a.dataset.r}"]`); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); });

/* ---- 17. the map shows the story: past chapters, and the next destination pulsing ---- */


/* ---- 19. test sessions: try things out, then put your real career back ---- */
const TEST_KEY='tw.realCareer.backup';
function testSession(){ try{ return !!localStorage.getItem(TEST_KEY); }catch(_){ return false; } }
document.addEventListener('click', async e=>{ const b=e.target.closest('[data-act="test-session"]'); if(!b||!S.st) return;
  if(!testSession()){ const json=JSON.stringify(S.st); try{ localStorage.setItem(TEST_KEY, json); }catch(_){ toast('Could not save a backup.'); return; } try{ if(window.twNative&&twNative.flightLog) await twNative.flightLog('real-career-backup.json', json); }catch(_){} S.st.ui=S.st.ui||{}; S.st.ui.testTools=true; save(); toast('Test session started. Your real career is backed up.'); }
  else { let json=null; try{ json=localStorage.getItem(TEST_KEY); }catch(_){} if(!json) return; S.st=JSON.parse(json); S.st.savedAt=Date.now(); try{ localStorage.removeItem(TEST_KEY); }catch(_){} save(); toast('Test session ended. Your real career is back.'); }
  S.keepScroll=true; render(); });

/* ---- 20. leftovers from the old career: Academy, Butter Cup and old names ---- */
TEXT_FIX.push([/Coral Wing's (pilots|crews|chief pilot)/g,'the island pilots'],[/Mari says,?/g,'Your instructor says'],[/the Coral Wing (team|family)/g,'the islands']);

(function(){ const s=document.createElement('style'); s.textContent=`
.now-pill{display:flex;align-items:center;gap:10px;padding:4px 4px 4px 14px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:13px;max-width:420px}.now-pill span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}.now-pill .btn{border-radius:999px;white-space:nowrap}
.res-more{margin-top:16px}
.ladder{margin-bottom:16px}.lad-row{display:flex;align-items:center;gap:0;margin-top:10px;flex-wrap:wrap}.lad{display:grid;justify-items:start;gap:2px;min-width:180px}.lad small{color:var(--muted)}
.lad-dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--line);font-weight:700;margin-bottom:4px}.lad.has .lad-dot{background:#7cbf6f;border-color:#7cbf6f;color:#0a0a0c}.lad.ready .lad-dot{border-color:var(--sea);color:var(--sea)}
.lad-line{flex:1;min-width:30px;height:2px;background:var(--line);margin:0 12px 34px}
.map-pulse{animation:mpulse 1.6s infinite;transform-box:fill-box;transform-origin:center}@keyframes mpulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}.map-next{fill:#ece6da;font-size:14px;font-weight:700;paint-order:stroke;stroke:#000;stroke-width:3px}
.launder{margin:14px 0;border-left:4px solid #c8962a}.launder h3{margin:2px 0 0;font-family:var(--f-mono)}
.fleet .fc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:8px}.fc-ac{display:grid;gap:2px;padding:12px;border:1px solid var(--line);border-radius:10px}.fc-ac small{color:var(--muted);font-size:12px}
.fc-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.fc-row p{margin:2px 0 0}
.perks{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:8px}.perks li{opacity:.5}.perks li.on{opacity:1}.perks li p{margin:2px 0 0;font-size:13px;color:var(--muted)}
.test-banner{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:9000;background:#3a1d0c;color:#ffd9a8;border:1px solid #c8962a;border-radius:999px;padding:4px 6px 4px 14px;font-size:13px;display:flex;gap:10px;align-items:center}`; document.head.appendChild(s); })();

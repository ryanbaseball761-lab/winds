/* ===================== POLISH ROUND (0.81) =====================
   Fifty small upgrades and fixes. Numbers match docs/launch/patch-0.81.md. */

/* 1. the title screen is a still picture: no rain, no pan, no flashes */
(function(){ const s=document.createElement('style'); s.textContent=`
.title-screen .ts-rain{display:none!important}
.title-screen .ts-bg,.title-screen .ts-bg *,.title-screen .ts-bg *::before,.title-screen .ts-bg *::after{animation:none!important;transition:none!important}
.title-screen .ts-bg{inset:0!important;transform:none!important}
.title-screen [class*="flash"],.title-screen [class*="bolt"],.title-screen [class*="light"]{display:none!important}`; document.head.appendChild(s); })();

/* 2. the existing "Reduce motion" setting now also stops the new animations: sweeping radar, timers, sheets */
function reduceMotion(){ return !!(S.st&&S.st.ui&&S.st.ui.reduceMotion) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
AFTER_RENDER.push(function motionClass(){ const on=reduceMotion(); document.documentElement.classList.toggle('calm-motion', on); if(S.st&&S.st.ui&&S.st.ui.reduceMotion) document.documentElement.classList.add('rm'); });
(function(){ const s=document.createElement('style'); s.textContent=`
html.calm-motion *,html.calm-motion *::before,html.calm-motion *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important}
html.calm-motion .confetti,html.calm-motion [class*="confetti"],html.calm-motion .cut-flash,html.calm-motion .bolt{display:none!important}
html.calm-motion .bt-timer i{animation-duration:var(--td,20s)!important}`; document.head.appendChild(s); })();

/* 7. Reyes's interview can be reopened from her text if you closed it */
AFTER_RENDER.push(function ivReopen(){ const st=S.st; if(!st) return; const c=crime(st), w=twW(); if(!w.ivDue || c.flags.interviewed) return; document.querySelectorAll('.ph-msg').forEach(li=>{ if(li.querySelector('[data-act="iv-open"]')) return; if(/come in and talk to me today/.test(li.textContent)) li.insertAdjacentHTML('beforeend',`<div class="ph-opts"><button class="btn sm" data-act="iv-open">Go see her</button></div>`); }); });
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="iv-open"]')||!S.st) return; const w=twW(); w.iv=w.iv||{i:0,res:{truth:0,lie:0,caught:0,heat:0}}; twSheet('Interview: Agent Reyes', interviewHTML(S.st), 'wide'); });

/* 10. daily costs on the Money page include insurance and your property income */

/* 11. sell a property back for 60% of what you paid */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="w-sell"]'); if(!b||!S.st) return; const p=PROPS.find(x=>x.id===b.dataset.id); if(!p||!propOwned(p.id)) return;
  if(!b.dataset.ok){ b.dataset.ok=1; b.textContent=`Sell for ${money(Math.round(p.price*0.6))}?`; return; } delete twW().props[p.id]; txn(S.st, Math.round(p.price*0.6), 'Property', `Sold: ${p.n}`); save(); toast(`Sold the ${p.n}.`); S.keepScroll=true; render(); });

/* 12. your airplane's name appears on the boarding pass and the job board */
AFTER_RENDER.push(function nickShow(){ const st=S.st; if(!st||!st.w||!st.w.ac) return;
  if(S.view==='flight' && st.active){ const n=acName(st.active.job.ac); const f=[...document.querySelectorAll('.pass-fields > div')].find(d=>/Aircraft/.test(d.textContent)); if(n && f && !f.querySelector('.nick')) f.insertAdjacentHTML('beforeend',`<small class="nick">${esc(n)}</small>`); }
  if(S.view==='board'){ document.querySelectorAll('.jr-ac').forEach(el=>{ if(el.dataset.nk) return; el.dataset.nk=1; const id=Object.keys(AC).find(k=>AC[k].n===el.textContent.trim()); const n=id&&acName(id); if(n) el.insertAdjacentHTML('beforeend',` <small class="nick">${esc(n)}</small>`); }); } });

/* 13. (sorting lives in the board's own Sort menu) */

/* 14. Castillo's loan: when it's nearly due, the top bar says so */
AFTER_RENDER.push(function loanChip(){ const st=S.st; const L=st&&st.w&&st.w.loan; const sub=document.querySelector('.cb-sub'); if(!sub || sub.querySelector('.cb-loan')) return; if(!L) return; const left=L.due-st.day; if(left>3) return;
  sub.insertAdjacentHTML('afterbegin', `<button class="cb-booked cb-loan" data-act="nav" data-v="money"><small>Owed to Castillo</small><b class="mono">${money(L.owe)} · ${left<=0?'today':left+' day'+(left>1?'s':'')}</b></button>`); });

/* 15. this week's event also shows on the Story page */
AFTER_RENDER.push(function weekOnStory(){ if(S.view!=='story'||!S.st||(S.storyTab&&S.storyTab!=='chapter')) return; const hero=document.querySelector('.story-card'); if(!hero||document.querySelector('.w-week')) return; const h=weekCardHTML(S.st); if(h) hero.insertAdjacentHTML('afterend', h); });

/* 17. Enter on a result screen goes to the next chapter (or back to the jobs) */
document.addEventListener('keydown', e=>{ if(e.key!=='Enter' || !S.showResult || document.querySelector('.cut,.tw-sheet,.title-screen')) return; const t=e.target; if(t && /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(t.tagName)) return;
  const b=document.querySelector('main .btn.action, main .btn.primary'); if(b){ e.preventDefault(); b.click(); } });

/* 18. M mutes and unmutes all sound */
document.addEventListener('keydown', e=>{ if((e.key!=='m'&&e.key!=='M')||e.ctrlKey||e.metaKey||e.altKey) return; const t=e.target; if(t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return; const u=uiP(); u.muted=!u.muted; save(); toast(u.muted?'Sound off (M to turn it back on).':'Sound on.'); try{ if(u.muted){ speechSynthesis.cancel(); } }catch(_){} });

/* 19. the command palette (Ctrl+K) knows the new places */

/* 20. the kbd hints don't run on every tiny DOM change any more */
/* (handled in feat-ui by the observer; throttled here) */
(function(){ let q=false; const mo=new MutationObserver(()=>{ if(q) return; q=true; requestAnimationFrame(()=>{ q=false; document.querySelectorAll('.beat .bt-o button, .ph-opts button').forEach(b=>{ if(b.querySelector('kbd')) return; const i=[...b.parentElement.children].indexOf(b); b.insertAdjacentHTML('afterbegin',`<kbd class="kh">${i+1}</kbd>`); }); }); }); mo.observe(document.body,{childList:true,subtree:true}); })();

/* 25. "Flight details" on the result remembers whether you keep it open */
document.addEventListener('toggle', e=>{ const d=e.target; if(!(d.tagName==='DETAILS') || !S.showResult || !S.st) return; if(!/Flight details/.test((d.querySelector('summary')||{}).textContent||'')) return; uiP().detailsOpen=d.open; save(); }, true);
AFTER_RENDER.push(function detailsOpen(){ if(!S.showResult||!S.st||!uiP().detailsOpen) return; document.querySelectorAll('main details').forEach(d=>{ if(/Flight details/.test((d.querySelector('summary')||{}).textContent||'') && !d.dataset.o){ d.dataset.o=1; d.open=true; } }); });

/* 26. the boarding pass shows at most three tags */
AFTER_RENDER.push(function passTags(){ const host=[...document.querySelectorAll('.pass .row')].find(r=>r.querySelector('.chip')); if(!host) return; const t=[...host.querySelectorAll('.chip')]; t.slice(3).forEach(e=>e.remove()); });

/* 27. stats: texts answered, ATC followed, islands that welcome you */
AFTER_RENDER.push(function moreStats(){ if(S.view!=='profile'||!S.st) return; const w=S.st.w||{}, s=w.stats||{}; const host=document.querySelector('.w-isl'); if(!host||host.querySelector('.w-stats')) return;
  const welcome=Object.values(w.isl||{}).filter(v=>v>=30).length; host.insertAdjacentHTML('afterbegin', `<div class="ro-strip w-stats"><div><small>Texts answered</small><b class="mono">${s.ph||0}</b></div><div><small>ATC instructions followed</small><b class="mono">${s.atc||0}</b></div><div><small>Short fuel caught</small><b class="mono">${s.fuel||0}</b></div><div><small>Islands that welcome you</small><b class="mono">${welcome}</b></div>${w.halcon?`<div><small>Races with Halcón</small><b class="mono">${w.halcon.w}–${w.halcon.l}</b></div>`:''}</div>`); });

/* 28. the title screen says how long you've been away */

/* 29. a short credits screen from the title menu */
document.addEventListener('click', e=>{ if(!e.target.closest('[data-ts-credits]')) return; e.stopPropagation(); const el=document.createElement('div'); el.className='tw-sheet-bg'; el.style.zIndex=13000;
  el.innerHTML=`<div class="tw-sheet" role="dialog" aria-modal="true" aria-label="Credits"><header><h2>Credits</h2><button class="btn sm ghost" data-act="w-close">Close</button></header><div class="tw-sheet-body"><p><b>Trade Winds</b><br>Designed and produced by Ryan.</p><p class="small muted">Story, code and art made with Claude (Anthropic).</p><p class="small muted">Fonts: IBM Plex, under the SIL Open Font License. Weather: U.S. National Hurricane Center. Flight planning links: SimBrief, SkyVector.</p><p class="small muted">Not affiliated with Microsoft, Asobo or any airline, airport or person. Every character and company in this story is made up.</p></div></div>`;
  document.body.appendChild(el); }, true);

/* 30. Settings: reduce motion, and a switch to show every system right away for players who want it all */
AFTER_RENDER.push(function polishSettings(){ if(S.view!=='hangar'||S.hangarTab!=='settings'||!S.st) return; const box=document.querySelector('.ui3-set'); if(!box||box.querySelector('[data-act="ui-all"]')) return; const u=uiP();
  box.insertAdjacentHTML('beforeend', `<label class="row" style="gap:8px;margin-top:6px"><input type="checkbox" data-act="ui-all" ${u.allSystems?'checked':''}> Show every system from the start (skip the gradual introductions)</label>`); });
document.addEventListener('change', e=>{ const i=e.target.closest('[data-act="ui-all"]'); if(!i||!S.st) return; uiP().allSystems=i.checked; save(); render(); });

(function(){ const s=document.createElement('style'); s.textContent=`
.nick{display:block;color:var(--amb);font-family:var(--f-body);font-size:12px;font-weight:500}.jr-ac .nick{display:inline}

.mkt-line{margin:0!important;padding:10px 14px;border:1px solid var(--line);border-left:2px solid var(--amb);background:var(--surface)}.mkt-line .btn{margin-left:8px}
.ts-credits{margin-right:6px}
.w-stats{margin-bottom:14px}
`; document.head.appendChild(s); })();

/* 31. the Story button for a chapter you can't fly yet says what you need */
AFTER_RENDER.push(function needAircraft(){ if(S.view!=='story') return; document.querySelectorAll('.story-card [data-act="nav"][data-v="hangar"]').forEach(b=>{ if(b.dataset.fx) return; b.dataset.fx=1; const nx=storyAvailable(S.st).filter(m=>CRIME_IDS.has(m.id)||m.arc==='Coral Wing')[0]; const role=nx&&typeof storyRoleName==='function'?storyRoleName(nx):''; b.textContent = role ? `Get ${/^[aeiou]/i.test(role)?'an':'a'} ${role.toLowerCase()} in the Hangar` : 'Get the right aircraft in the Hangar'; }); });

/* 32. "Next" in the top bar knows when Reyes wants to see you */

/* 33. at night, the customs scene happens under the floodlights, not on a sunny ramp (see customsScene in feat-flight.js) */

/* 34. the bank's weekly text includes what insurance cost you */
DAY_HOOKS.push(st=>{ const w=st.w; if(!w || !w.ins) return; w.insWk=(w.insWk||0)+insDaily(st); if(st.day%7===0){ if(w.insWk) phonePush({from:'bank', text:`Island Credit Union: ${money(w.insWk)} went to your hull insurance this week.`}); w.insWk=0; } });

/* 35. insured flights say so on the boarding pass */
AFTER_RENDER.push(function insuredTag(){ if(S.view!=='flight'||!S.st||!S.st.active||!insOn()) return; const host=[...document.querySelectorAll('.pass .row')].find(r=>r.querySelector('.chip')); if(host && !host.querySelector('.ins-chip')) host.insertAdjacentHTML('beforeend','<span class="chip ins-chip">Insured</span>'); });

/* 36. bounded save growth: old per-day customs markers are cleaned up */
DAY_HOOKS.push(st=>{ if(st._csDay){ for(const k in st._csDay){ const d=Number(k.split('|')[1]); if(st.day-d>3) delete st._csDay[k]; } } if(st._islSaid && Object.keys(st._islSaid).length>60) st._islSaid={}; });

/* 37. Halcón's race shows up in the result */
AFTER_RESULT.push(function halconNote(st, job){ if(!job.rival) return; const o=st.last&&st.last.out; const h=st.w&&st.w.halcon; if(o&&h) o.notes.push(`You and Halcón: ${h.w} win${h.w===1?'':'s'}, ${h.l} loss${h.l===1?'':'es'}.`); });

/* 38. when a new weekly event starts, the job board says so with a toast the first time you open it */
/* (the week's market event shows as a banner on the Jobs page; no toast on top of it) */


/* 42. the job board's sealed-destination rows say "Sealed" in the To column, never "????" */
AFTER_RENDER.push(function sealedTo(){ if(S.view!=='board') return; document.querySelectorAll('.jr-rt b').forEach(b=>{ if(b.textContent.trim()==='????'){ b.textContent='Sealed'; b.parentElement.title='Destination in a sealed envelope'; } }); });

/* 43. a market event's island gets a marker on the map */
AFTER_RENDER.push(function mktMap(){ if(S.view!=='map'||!S.st) return; const e=mktNow(); if(!e||document.querySelector('.map-mkt')) return; const main=document.querySelector('main'); const h=main&&main.querySelector('h1,h2'); if(h) h.insertAdjacentHTML('afterend', `<p class="map-mkt small"><b>This week:</b> ${esc(e.text)}</p>`); });

/* 45. the beta question only asks once per chapter, even if you replay it */

/* 46. secret achievements count on the achievements list ("3 of 10 secrets found") */
AFTER_RENDER.push(function secretCount(){ const list=document.querySelector('.ach')&&document.querySelector('.ach').parentElement; if(!list||list.querySelector('.sx-count')||!S.st) return; const got=SECRET_ACH.filter(a=>S.st.ach&&S.st.ach[a.id]).length; list.insertAdjacentHTML('beforebegin', `<p class="small muted sx-count">${got} of ${SECRET_ACH.length} secret achievements found.</p>`); });

/* 47. Twitch: !tip is explained in the streamer settings */
AFTER_RENDER.push(function tipHelp(){ const s=document.querySelector('.streamer-set, [data-streamer]'); if(!s||s.querySelector('.tip-help')) return; s.insertAdjacentHTML('beforeend','<p class="small muted tip-help">Viewers can type <code>!tip</code> to send you $50 of game money (once each per day, up to 20 a day).</p>'); });

/* 48. Enter in the friend-code box adds it */
document.addEventListener('keydown', e=>{ if(e.key!=='Enter') return; if(e.target && (e.target.id==='cup-friend-c'||e.target.id==='cup-friend-n')){ e.preventDefault(); const b=document.querySelector('[data-act="cup-add"]'); b&&b.click(); } });

/* 49. buying something you can't afford explains how much more you need */

(function(){ const s=document.createElement('style'); s.textContent=`.map-mkt{padding:8px 12px;border-left:2px solid var(--amb);background:var(--surface);margin:8px 0}.sx-count{margin:0 0 8px}`; document.head.appendChild(s); })();
/* the title screen fits a phone: the name doesn't run off the edge and the footer doesn't overlap */
(function(){ const s=document.createElement('style'); s.textContent=`@media (max-width:600px){ .title-screen .ts-logo{gap:12px;margin-bottom:4vh}.title-screen .ts-logo svg{width:42px;height:42px}.title-screen .ts-logo h1{font-size:9vw;letter-spacing:.04em}.title-screen .ts-in{padding:0 7vw}.title-screen .ts-new,.title-screen .ts-foot{position:static!important;margin-top:18px}.title-screen .ts-menu button b{font-size:19px} }`; document.head.appendChild(s); })();

/* a radio or cabin line never knocks a question you haven't answered yet off the screen: it waits its turn */

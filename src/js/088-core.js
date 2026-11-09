/* ===================== 20 UPGRADES: clarity, pages and testing ===================== */

/* ---- 14. one "Right now" button in the header on every page ---- */
function rightNow(st){ if(!st) return null; const a=st.active; if(a) return {t:a.started?'Flight in progress':'Your booked flight', b:a.started?'Open flight':'Open flight', act:'nav', v:'flight'};
  const MC=mainChapters(); const next=MC.find(m=>!st.story.done[m.id]); if(!next) return {t:'Story complete', b:'Side jobs', act:'nav', v:'board'};
  const availSet=new Set(storyAvailable(st).map(m=>m.id)); const s=chapterStatus(st,next,availSet); const n=MC.indexOf(next)+1;
  if(s.k==='ready') return {t:`Chapter ${n} · ${next.title}`, b:'▶ Play', act:'accept-story', id:next.id};
  if(s.k==='travel') return {t:`Chapter ${n} · ${next.title}`, b:'▶ Play', act:'story-go', id:next.id};
  if(s.k==='locked'){ const need=((next.req||{}).ratings||[]).find(r=>!st.ratings[r]); if(need && checkrideReady(st,need).ok) return {t:`Next: ${RATINGS[need].n} checkride`, b:'Book it', act:'nav', v:'pilot'}; if(need) return {t:`Needs ${RATINGS[need].n}`, b:'Fly side jobs', act:'nav', v:'board'}; }
  if(s.k==='aircraft') return {t:`Chapter ${n} needs an aircraft`, b:'Hangar', act:'nav', v:'hangar'};
  return {t:`Chapter ${n} · ${next.title}`, b:'Story', act:'nav', v:'story'}; }
function nowHTML(st){ const r=rightNow(st); if(!r) return ''; return `<div class="now-pill"><span>${esc(r.t)}</span><button class="btn sm action" data-act="${r.act}" ${r.v?`data-v="${r.v}"`:''} ${r.id?`data-id="${r.id}"`:''}>${esc(r.b)}</button></div>`; }
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ const hud=document.querySelector('.topbar .hud'); if(hud && S.st){ const old=document.querySelector('.now-pill'); if(old) old.remove(); const t=tpl(nowHTML(S.st)); if(t.content.firstElementChild) hud.prepend(t.content.firstElementChild); } }catch(_){} return x; }; })();

/* ---- 15. result screen: one summary card, everything else folded ---- */
const _uiRes = resultView;
resultView = function(){ const h=_uiRes(); const st=S.st, L=st&&st.last; if(!L||!L.job) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  const kids=[...main.children]; const sum=kids.find(e=>e.tagName==='SECTION'); const bar=main.querySelector('.next-bar'); const keep=new Set([sum,bar].filter(Boolean));
  kids.forEach(e=>{ if(e.querySelector && (e.querySelector('[data-act="after-replay"]') || e.classList.contains('choice'))) keep.add(e); });
  const rest=kids.filter(e=>!keep.has(e) && !(e.tagName==='DIV' && e.classList.contains('row') && /Back to the job board/.test(e.textContent) && !e.classList.contains('next-bar')));
  kids.forEach(e=>{ if(e.tagName==='DIV' && e.classList.contains('row') && !e.classList.contains('next-bar') && /Back to the job board/.test(e.textContent)) e.remove(); });
  const c=crime(st); const extra=[]; if(c.on && L.job && (L.job.network||L.job.kind==='story')) extra.push(`<span class="chip">Power ${c.power}</span><span class="chip ${c.heat>=60?'warn':''}">Heat ${c.heat}</span>`); if(c.dirty) extra.push(`<span class="chip warn">Dirty cash ${money(c.dirty)}</span>`);
  if(sum && extra.length){ const ch=sum.querySelector('.chips, .row'); const d=document.createElement('div'); d.className='row'; d.style.cssText='gap:6px;margin-top:8px;flex-wrap:wrap'; d.innerHTML=extra.join(''); (ch?ch.after(d):sum.appendChild(d)); }
  const flat=[]; rest.forEach(e=>{ if(e.tagName==='DETAILS'){ [...e.children].filter(x=>x.tagName!=='SUMMARY').forEach(x=>flat.push(x)); e.remove(); } else { e.remove(); flat.push(e); } });
  if(flat.length){ const d=wrapDetails(flat, 'Flight details: score, passengers, notes and share card'); if(d){ d.classList.add('res-more'); main.appendChild(d); } }
  if(bar) bar.querySelectorAll('button').forEach(b=>{ if(/Back to the job board/.test(b.textContent)) b.textContent='Side jobs'; });
  return t.innerHTML; };

/* ---- 16. pilot page: the licence ladder says what each licence unlocks in the story ---- */
const LADDER = [['PPL','Act 1 · the Cessna'],['JET','Act 2 · the Vision Jet and the CJ4'],['ATP','Act 4 · airliners and the 747']];
const _uiPilot = pilotView;
pilotView = function(){ const h=_uiPilot(); const st=S.st; const steps=LADDER.map(([r,u])=>{ const has=st.ratings[r]; const ready=!has && checkrideReady(st,r).ok; return `<div class="lad ${has?'has':ready?'ready':''}"><span class="lad-dot">${has?'✓':ready?'!':''}</span><b>${esc(RATINGS[r].n)}</b><small>${esc(u)}</small>${ready?`<a href="#" class="small" data-act="lad-go" data-r="${r}">Checkride ready, book below</a>`:''}</div>`; }).join('<i class="lad-line"></i>');
  return h.replace(/(<main[^>]*>)/, `$1<section class="panel ladder"><p class="label">Your path through the story</p><div class="lad-row">${steps}</div><p class="small muted" style="margin-top:8px">Other ratings (Commercial, Instrument, Multi-Engine…) open more side jobs but aren't needed for the story.</p></section>`); };
document.addEventListener('click', e=>{ const a=e.target.closest('[data-act="lad-go"]'); if(!a) return; e.preventDefault(); const el=document.querySelector(`[data-act="book-check"][data-r="${a.dataset.r}"]`); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); });

/* ---- 17. the map shows the story: past chapters, and the next destination pulsing ---- */
const _uiMap = mapView;
mapView = function(){ const h=_uiMap(); try{ const st=S.st; const v=MAPV[S.mapZoom||'east']; const W=1000; const X=lon=>(lon-v.lon[0])/(v.lon[1]-v.lon[0])*W; const H=Math.round(1000*(v.lat[1]-v.lat[0])/(v.lon[1]-v.lon[0])*1.05); const Y=lat=>H-(lat-v.lat[0])/(v.lat[1]-v.lat[0])*H;
  const MC=mainChapters(); let g='<g class="story-lines">'; MC.forEach(m=>{ if(!st.story.done[m.id]) return; const a=AP[m.from], b=AP[m.to]; if(!a||!b) return; const col=(CRIME_ACTS.find(x=>x.arc===m.arc)||{}).col||'#c8962a'; g+=`<line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="${col}" stroke-width="2" stroke-opacity=".55" stroke-dasharray="5 4"/>`; });
  const next=MC.find(m=>!st.story.done[m.id]); if(next && AP[next.to]){ const b=AP[next.to], a=AP[next.from]; g+=`<line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="#d23b2c" stroke-width="3"/><circle cx="${X(b.lon)}" cy="${Y(b.lat)}" r="9" fill="none" stroke="#d23b2c" stroke-width="3" class="map-pulse"/><text x="${X(b.lon)+12}" y="${Y(b.lat)-12}" class="map-next">Next: ${esc(next.title)}</text>`; }
  g+='</g>'; const i=h.indexOf('</svg>'); return i>0 ? h.slice(0,i)+g+h.slice(i) : h; }catch(_){ return h; } };

/* ---- dirty cash, fleet, crew and rank rewards on the right pages ---- */
(function(){ const _b=boardView; boardView=function(){ const h=_b(); try{ const l=launderHTML(S.st); return l ? h.replace('<div class="b2-head">', l+'<div class="b2-head">') : h; }catch(_){ return h; } }; })();
(function(){ const _m=moneyView; moneyView=function(){ const h=_m(); try{ const l=launderHTML(S.st); return l ? h.replace(/(<main[^>]*>)/, '$1'+l) : h; }catch(_){ return h; } }; })();
(function(){ const _hv=hangarView; hangarView=function(){ const h=_hv(); try{ if((S.hangarTab||'fleet')!=='fleet') return h; const f=fleetCrewHTML(S.st); return f ? h.replace(/(<main[^>]*>(?:\s*<div class="row[^"]*calm-subnav[\s\S]*?<\/div>)?)/, '$1'+f) : h; }catch(_){ return h; } }; })();
(function(){ const _sv=storyView; storyView=function(){ const h=_sv(); try{ const c=crime(S.st); if(!c.on) return h; const perks=RANK_PERKS.map(([v,n,p])=>`<li class="${c.power>=v?'on':''}"><b>${n}</b> <span class="mono small">${v}+</span><p>${esc(p)}</p></li>`).join('');
  const f=fleetCrewHTML(S.st); return h.replace('<section class="panel"><h3>The five acts</h3>', `<div class="sh-grid">${f||''}<section class="panel"><h3>Rank rewards <span class="small muted">Power ${c.power}</span></h3><ul class="perks">${perks}</ul></section></div><section class="panel"><h3>The five acts</h3>`); }catch(_){ return h; } }; })();

/* ---- 19. test sessions: try things out, then put your real career back ---- */
const TEST_KEY='tw.realCareer.backup';
function testSession(){ try{ return !!localStorage.getItem(TEST_KEY); }catch(_){ return false; } }
document.addEventListener('click', async e=>{ const b=e.target.closest('[data-act="test-session"]'); if(!b||!S.st) return;
  if(!testSession()){ const json=JSON.stringify(S.st); try{ localStorage.setItem(TEST_KEY, json); }catch(_){ toast('Could not save a backup.'); return; } try{ if(window.twNative&&twNative.flightLog) await twNative.flightLog('real-career-backup.json', json); }catch(_){} S.st.ui=S.st.ui||{}; S.st.ui.testTools=true; save(); toast('Test session started. Your real career is backed up.'); }
  else { let json=null; try{ json=localStorage.getItem(TEST_KEY); }catch(_){} if(!json) return; S.st=JSON.parse(json); S.st.savedAt=Date.now(); try{ localStorage.removeItem(TEST_KEY); }catch(_){} save(); toast('Test session ended. Your real career is back.'); }
  S.keepScroll=true; render(); });
(function(){ const _b=boardView; boardView=function(){ const h=_b(); const on=testSession(); const box=`<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="btn sm ${on?'action':''}" data-act="test-session">${on?'End test session · restore my real career':'Start a test session'}</button><span class="tiny muted">${on?'Anything you do now is thrown away when you end the session.':'Backs up your career first, so you can skip and experiment freely.'}</span></div>`;
  return h.replace('<button class="btn sm" data-act="practice"', box+'<button class="btn sm" data-act="practice"'); }; })();
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ if(testSession() && !document.querySelector('.test-banner')){ const d=document.createElement('div'); d.className='test-banner'; d.innerHTML=`Test session: changes will be thrown away <button class="btn sm" data-act="test-session">End and restore</button>`; document.body.appendChild(d); } if(!testSession()) document.querySelectorAll('.test-banner').forEach(e=>e.remove()); }catch(_){} return x; }; })();

/* ---- 20. leftovers from the old career: Academy, Butter Cup and old names ---- */
TEXT_FIX.push([/Coral Wing's (pilots|crews|chief pilot)/g,'the island pilots'],[/Mari says,?/g,'Your instructor says'],[/the Coral Wing (team|family)/g,'the islands']);
(function(){ const _av=typeof academyView==='function'?academyView:null; if(!_av) return; academyView=function(){ return _av().replace(/Coral Wing/g,'the islands'); }; })();

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

/* ===================== SMALL UI PIECES =====================
   Pop-up messages (toast) and the search bar's list of things you can jump to (cmdItems). */

/* ---------- pop-up messages ---------- */

const TOAST_QUEUE = [];   // messages waiting for a cutscene or the title screen to finish

/* Shows a short message bottom-right and adds it to the notifications list.
   During a cutscene or on the title screen it waits its turn. */
function toast(msg){
  if(/^New tab unlocked/i.test(String(msg))) return;   // the five-item menu has everything now
  if(document.querySelector('.cut,.title-screen') && !S._cabMute){ TOAST_QUEUE.push(msg); return; }
  showToast(msg);
}
function showToast(msg){
  try{ if(!S._cabMute && msg){ S.notifs.unshift({t:Date.now(), m:String(msg)}); S.notifs=S.notifs.slice(0,40); const b=document.querySelector('.bell b'); if(b){ b.textContent=S.notifs.length-S.notifSeen; b.style.display=''; } } }catch(_){}
  if(S._cabMute) return;
  const m=String(msg); const now=Date.now(); if(S._lt===m && now-(S._ltT||0)<20000) return; S._lt=m; S._ltT=now;   // the same message twice in 20 s shows once
  S.toast=msg; let host=document.getElementById('toasts'); if(!host){ host=document.createElement('div'); host.id='toasts'; host.setAttribute('role','status'); host.setAttribute('aria-live','polite'); document.body.appendChild(host); }
  const k=toastKind(msg); const el=document.createElement('div'); el.className='toast2 '+k; el.innerHTML=`<span class="ti">${k==='ok'?'✓':k==='warn'?'!':'✈'}</span><span class="tt"></span><i class="tbar"></i>`; el.querySelector('.tt').textContent=msg;
  host.appendChild(el); while(host.children.length>3) host.firstElementChild.remove();
  if(k==='warn') softTone(330,.08); else if(k==='ok') softTone(880,.05);
  const ttl = Math.min(7000, 2800 + String(msg).length*25); el.style.setProperty('--ttl', ttl+'ms');
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>{ el.remove(); if(!host.children.length) S.toast=null; }, 350); }, ttl);
}
setInterval(()=>{ if(TOAST_QUEUE.length && !document.querySelector('.cut,.title-screen')) showToast(TOAST_QUEUE.shift()); }, 1200);

/* ---------- the search bar (Ctrl K) ---------- */

/* Everything the search bar can jump to: pages, actions, checkrides, chapters, achievements, airports, people.
   Each item is {n: name, k: kind shown on the right, run()}. Things you used recently come first. */
function cmdItems(){ const st=S.st; const L=[]; if(!st) return L; const pg=(n,v,k,run)=>L.push({n, k:k||'Page', run:run||(()=>go(v))});
  pg('Main story','story'); pg('Jobs','board'); pg('Map','map'); pg('Flight','flight'); pg('Pilot & licences','pilot'); pg('Money','money'); pg('Hangar','hangar'); pg('Butter Cup','cup'); pg('Academy','academy'); pg('Logbook','log'); pg('Settings','hangar','Page · Hangar → Settings', ()=>{ S.hangarTab='settings'; go('hangar'); });
  const r=rightNow(st); if(r) L.push({n:`${r.b.replace('▶ ','')}: ${r.t}`, k:'Right now', run:()=>clickAct(r.act, r.v, r.id)});
  RATING_ORDER.filter(x=>!st.ratings[x] && checkrideReady(st,x).ok).forEach(x=>L.push({n:`Book checkride: ${RATINGS[x].n}`, k:'Pilot', run:()=>{ go('pilot'); setTimeout(()=>{ const b=document.querySelector(`[data-act="book-check"][data-r="${x}"]`); if(b) b.scrollIntoView({block:'center'}); },200); }}));
  if(crime(st).dirty) L.push({n:'Launder dirty cash', k:'Money', run:()=>go('money')});
  if(st.active) L.push({n:'Load fuel into MSFS', k:'Flight', run:()=>{ go('flight'); setTimeout(()=>clickAct('pf-load'),200); }});
  L.push({n:'New day', k:'Action', run:()=>clickAct('rest')}, {n:'Practice landing', k:'Action', run:()=>clickAct('practice')}, {n:testSession()?'End test session':'Start test session', k:'Action', run:()=>clickAct('test-session')}, {n:'Travel as a passenger', k:'Action', run:()=>{ go('board'); setTimeout(()=>{ const d=document.querySelector('.b2-more'); if(d){ d.open=true; d.scrollIntoView({block:'center'}); } },200); }});
  Object.keys(AP).filter(k=>!AP[k].water).forEach(k=>L.push({n:`${k} · ${AP[k].n}`, k:`Airport · ${AP[k].isl}`, airport:k, run:()=>{ S.mapSel=k; go('map'); }}));
  try{ mainChapters().forEach((m,i)=>{ if(st.story.done[m.id]) L.push({n:`Chapter ${i+1}: ${m.title}`, k:'Story · replay the opening', run:()=>{ go('story'); setTimeout(()=>playPrologue(m,()=>{}),200); }}); }); ACH.forEach(a=>L.push({n:`${a.n}`, k:st.ach&&st.ach[a.id]?'Achievement · unlocked':'Achievement · '+a.d, run:()=>go('profile')})); }catch(_){}
  /* what you used recently is remembered (the last five) and listed first */
  let rec=[]; try{ rec=JSON.parse(localStorage.getItem('tw.cmdRecent')||'[]'); }catch(_){}
  L.forEach(it=>{ const run=it.run; it.run=()=>{ try{ const r=[it.n].concat(rec.filter(x=>x!==it.n)).slice(0,5); localStorage.setItem('tw.cmdRecent', JSON.stringify(r)); }catch(_){} run(); };
    const k=rec.indexOf(it.n); if(k>=0){ it.k='Recent · '+it.k; it._rec=5-k; } else if(it.airport){ const a=AP[it.airport]; it.k=`Airport · ${a.isl} · ${longestRwy(a).toLocaleString()} ft`; } });
  try{ metPeople(st).forEach(k=>L.push({n:CAST[k].n, k:'Person · '+(CAST[k].role||''), run:()=>{ go('story'); setTimeout(()=>personCard(k),150); }})); }catch(_){}
  return L; }

/* ---------- double-click guard ---------- */

/* A double click on a button that costs money or moves the career on (New day, Accept, a choice...)
   only counts once. */
const ONCE_ACTS = new Set(['rest','accept','accept-story','story-go','crime-choose','book-check','hire','buy-safe','launder','deadhead','cancel-yes','signoff','start','reset-yes','rush-repair','practice']);
let LAST_ACT = {k:'', t:0};
window.addEventListener('click', e=>{
  const b=e.target.closest('[data-act]'); if(!b || !ONCE_ACTS.has(b.dataset.act)) return;
  const k=b.dataset.act+'|'+(b.dataset.id||b.dataset.v||b.dataset.i||b.dataset.r||''); const now=Date.now();
  if(LAST_ACT.k===k && now-LAST_ACT.t<800){ e.stopImmediatePropagation(); e.preventDefault(); return; }
  LAST_ACT={k, t:now};
}, true);

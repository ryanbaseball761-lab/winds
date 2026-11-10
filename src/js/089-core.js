/* ===================== 10 UI UPGRADES: sleek and easy to move through ===================== */

/* ---- 1. five places in the menu; the rest live as tabs inside them ---- */
const NAV5 = [
  {v:'story', n:'Story', ico:'<path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3"/>'},
  {v:'board', n:'Jobs', ico:'<rect x="4" y="6" width="16" height="13" rx="2"/><path d="M9 6V4h6v2M4 11h16"/>', tabs:[['board','Jobs'],['map','Map']]},
  {v:'flight', n:'Flight', ico:'<path d="M3 13l18-7-7 18-2-8z"/>'},
  {v:'pilot', n:'Pilot', ico:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', tabs:[['pilot','Licences'],['money','Money'],['cup','Butter Cup'],['academy','Academy']]},
  {v:'hangar', n:'Hangar', ico:'<path d="M3 20V9l9-5 9 5v11M7 20v-6h10v6"/>'} ];
function navGroup(v){ return NAV5.find(g=>g.v===v || (g.tabs||[]).some(t=>t[0]===v)) || NAV5.find(g=>g.v==='pilot' && ['profile','log','company','cockpit'].includes(v)) || null; }

/* ---- 3. flight mode: once you're flying, the flight takes over the screen ---- */
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="fm-menu"]')) return; S.fmMenu=!S.fmMenu; S.keepScroll=true; render(); });

/* ---- 4. command bar: Ctrl+K (or /) to jump anywhere ---- */
function cmdItems(){ const st=S.st; const L=[]; if(!st) return L; const pg=(n,v,k)=>L.push({n, k:k||'Page', run:()=>go(v)});
  pg('Main story','story'); pg('Jobs','board'); pg('Map','map'); pg('Flight','flight'); pg('Pilot & licences','pilot'); pg('Money','money'); pg('Hangar','hangar'); pg('Butter Cup','cup'); pg('Academy','academy'); pg('Logbook','log'); pg('Settings','hangar','Page · Hangar → Settings');
  const r=rightNow(st); if(r) L.push({n:`${r.b.replace('▶ ','')}: ${r.t}`, k:'Right now', run:()=>clickAct(r.act, r.v, r.id)});
  RATING_ORDER.filter(x=>!st.ratings[x] && checkrideReady(st,x).ok).forEach(x=>L.push({n:`Book checkride: ${RATINGS[x].n}`, k:'Pilot', run:()=>{ go('pilot'); setTimeout(()=>{ const b=document.querySelector(`[data-act="book-check"][data-r="${x}"]`); if(b) b.scrollIntoView({block:'center'}); },200); }}));
  if(crime(st).dirty) L.push({n:'Launder dirty cash', k:'Money', run:()=>go('money')});
  if(st.active) L.push({n:'Load fuel into MSFS', k:'Flight', run:()=>{ go('flight'); setTimeout(()=>clickAct('pf-load'),200); }});
  L.push({n:'New day', k:'Action', run:()=>clickAct('rest')}, {n:'Practice landing', k:'Action', run:()=>clickAct('practice')}, {n:testSession()?'End test session':'Start test session', k:'Action', run:()=>clickAct('test-session')}, {n:'Travel as a passenger', k:'Action', run:()=>{ go('board'); setTimeout(()=>{ const d=document.querySelector('.b2-more'); if(d){ d.open=true; d.scrollIntoView({block:'center'}); } },200); }});
  Object.keys(AP).filter(k=>!AP[k].water).forEach(k=>L.push({n:`${k} · ${AP[k].n}`, k:`Airport · ${AP[k].isl}`, run:()=>{ S.mapSel=k; go('map'); }}));
  return L; }
function clickAct(act, v, id){ const b=document.createElement('button'); b.dataset.act=act; if(v) b.dataset.v=v; if(id) b.dataset.id=id; b.style.display='none'; document.body.appendChild(b); b.click(); b.remove(); }
function openCmd(){ if(document.querySelector('.cmd')) return; const el=document.createElement('div'); el.className='cmd'; el.innerHTML=`<div class="cmd-box" role="dialog" aria-label="Go to"><input type="text" placeholder="Go to a page, airport or action…" aria-label="Search"><ul></ul><p class="cmd-foot"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</p></div>`; document.body.appendChild(el);
  const inp=el.querySelector('input'), ul=el.querySelector('ul'); const all=cmdItems(); let sel=0, list=[];
  const score=(it,q)=>{ if(!q) return it._rec?3+it._rec:it.k==='Right now'?3:it.k==='Page'?2:it.k.startsWith('Airport')?0:1; const s=(it.n+' '+it.k).toLowerCase(); const w=q.toLowerCase().split(/\s+/).filter(Boolean); if(!w.every(x=>s.includes(x))) return -1; return (s.startsWith(w[0])?3:0)+(it.n.toLowerCase().includes(q.toLowerCase())?2:0)+(it.k==='Page'?1:0); };
  const draw=()=>{ const q=inp.value.trim(); list=all.map(it=>[it,score(it,q)]).filter(x=>x[1]>=0).sort((a,b)=>b[1]-a[1]).slice(0,9).map(x=>x[0]); sel=Math.min(sel,list.length-1); ul.innerHTML=list.map((it,i)=>`<li class="${i===sel?'on':''}" data-i="${i}"><b>${esc(it.n)}</b><span>${esc(it.k)}</span></li>`).join('')||'<li class="none">Nothing matches</li>'; };
  const close=()=>{ el.remove(); try{ window.removeEventListener('keydown', kd, true); }catch(_){} }; const run=i=>{ const it=list[i]; close(); if(it) it.run(); };
  inp.addEventListener('input',()=>{ sel=0; draw(); }); const kd=e=>{ if(e.target!==inp) return; e.stopPropagation(); if(e.key==='ArrowDown'){ sel=Math.min(list.length-1,sel+1); draw(); e.preventDefault(); } else if(e.key==='ArrowUp'){ sel=Math.max(0,sel-1); draw(); e.preventDefault(); } else if(e.key==='Enter'){ run(sel); } else if(e.key==='Escape'){ close(); } }; window.addEventListener('keydown', kd, true); const _close=close;
  ul.addEventListener('click',e=>{ const li=e.target.closest('li[data-i]'); if(li) run(Number(li.dataset.i)); }); el.addEventListener('click',e=>{ if(e.target===el) close(); }); draw(); setTimeout(()=>inp.focus(),10); }

/* ---- 10. keyboard: 1-5 pages, Ctrl+K or / for the command bar, F for the flight ---- */
document.addEventListener('keydown', e=>{ if(document.querySelector('.cut')) return; const typing=/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||'')) || e.target.isContentEditable;
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCmd(); return; } if(typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key==='/'){ e.preventDefault(); openCmd(); return; } const n=Number(e.key); if(n>=1 && n<=5 && S.st){ go(NAV5[n-1].v); return; } if(e.key.toLowerCase()==='f' && S.st && S.st.active){ go('flight'); } });

/* ---- 6. job cards become one-line rows; click a row for the full card ---- */
function jobRow(st, j){ const card=stripHTML(st, j); const acc=(card.match(/<button[^>]*data-act="accept"[^>]*>[\s\S]*?<\/button>/)||[''])[0] || (card.match(/<button[^>]*class="[^"]*jc-go[^"]*"[^>]*>[\s\S]*?<\/button>/)||[''])[0];
  const to=j.local?j.from:j.to; const est=j.est||(()=>{ try{ return plan(j).est; }catch(_){ return 0; } })(); const kind=j.network?'net':j.special||j.vip?'vip':'legit'; const lbl=j.label||(j.network?'Network run':'Job');
  const tag=j.drop?'Night drop':j.lowLevel?'Low level':j.hot?'Hot':j.bonus?'Bonus':'';
  return `<div class="jrow k-${kind} ${S.openJob===j.id?'open':''}"><button class="jr-main" data-act="job-open" data-id="${j.id}" aria-expanded="${S.openJob===j.id}">
      <span class="jr-k">${esc(lbl)}</span><span class="jr-rt"><b>${esc(j.from)}</b> → <b>${esc(to==='????'?'????':to)}</b></span><span class="jr-t">${esc(j.title)}${tag?` <em>${tag}</em>`:''}</span>
      <span class="jr-m">${esc(AC[j.ac]?AC[j.ac].n:j.ac)} · ${est?durTxt(est):''} · ${j.dep<=st.clock?'now':hhmm(j.dep)}</span><span class="jr-p">${money(j.pay)}</span></button>
    <span class="jr-go">${acc}</span>${S.openJob===j.id?`<div class="jr-card">${card}</div>`:''}</div>`; }
(function(){ const _b=boardView; boardView=function(){ const h=_b(); if(!S.st) return h; try{ const t=tpl(h); const grid=t.content.querySelector('.b2-grid'); if(!grid) return h; const st=S.st; const ids=[...grid.querySelectorAll('[data-act="accept"][data-id]')].map(b=>b.dataset.id);
  const jobs=ids.map(id=>(st.jobs||[]).find(j=>j.id===id)).filter(Boolean); if(!jobs.length) return h; const list=document.createElement('div'); list.className='jlist'; list.innerHTML=`<div class="jl-head"><span>Type</span><span>Route</span><span>Job</span><span>Aircraft · time · departs</span><span>Pay</span><span></span></div>`+jobs.map(j=>jobRow(st,j)).join(''); grid.replaceWith(list); return t.innerHTML; }catch(_){ return h; } }; })();
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="job-open"]'); if(!b) return; S.openJob = S.openJob===b.dataset.id ? null : b.dataset.id; S.keepScroll=true; render(); });


/* ---- 8. notifications: one stack at the bottom right, plus a history in the header ---- */
S.notifs=S.notifs||[]; S.notifSeen=0;
(function(){ const _t=toast; toast=function(msg){ try{ if(!S._cabMute && msg){ S.notifs.unshift({t:Date.now(), m:String(msg)}); S.notifs=S.notifs.slice(0,40); const b=document.querySelector('.bell b'); if(b){ b.textContent=S.notifs.length-S.notifSeen; b.style.display=''; } } }catch(_){} return _t.apply(this, arguments); }; })();
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="cmd"]')){ openCmd(); return; } const b=e.target.closest('[data-act="bell"]'); if(!b) { if(!e.target.closest('.notif-pane')) document.querySelectorAll('.notif-pane').forEach(p=>p.remove()); return; } const open=document.querySelector('.notif-pane'); if(open){ open.remove(); return; }
  S.notifSeen=S.notifs.length; const c=b.querySelector('b'); if(c) c.style.display='none'; const p=document.createElement('div'); p.className='notif-pane'; p.innerHTML=`<p class="label">Notifications</p>${S.notifs.length?`<ul>${S.notifs.map(n=>`<li><span>${new Date(n.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>${esc(n.m)}</li>`).join('')}</ul>`:'<p class="small muted">Nothing yet this session.</p>'}`; document.body.appendChild(p); });


/* ---- 2 + 5 + 10. one layout system, one type scale, one meaning per colour, motion ---- */
(function(){ const s=document.createElement('style'); s.textContent=`
:root{--r-card:14px;--gap:16px}
main.wrap{max-width:1180px;margin-left:auto;margin-right:auto}
main.wrap > * + *{margin-top:var(--gap)}
main .panel,main section.panel{border-radius:var(--r-card)}
main h1{font-size:28px;letter-spacing:-.01em}main h2{font-size:21px}main h3{font-size:16px}
main .label{font-size:11px;letter-spacing:.14em}
.jcard .chips .chip:nth-child(n+3){display:none}
.btn{transition:transform .08s ease, background .15s, border-color .15s, color .15s}.btn:active:not([disabled]){transform:scale(.97)}
.btn:focus-visible,.snav:focus-visible,.jr-main:focus-visible{outline:2px solid var(--sea);outline-offset:2px}
.fade{animation:pgIn .28s ease both}@keyframes pgIn{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.fade{animation:none}.btn{transition:none}}
/* sidebar */
.side-nav{display:grid;gap:4px;margin-top:10px}.side-nav .snav{display:grid;grid-template-columns:22px 1fr auto auto;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;font-size:15px}
.side-nav .snav svg{width:20px;height:20px}.side-nav .snav kbd{font-size:10px;opacity:0;border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--muted)}.side-nav .snav:hover kbd{opacity:1}
.side-nav .snav.on{background:rgba(200,150,42,.12);color:#f0d9a6}.side-nav .snav.on svg{color:#c8962a}
.subtabs{display:flex;gap:4px;margin:0 0 16px;border-bottom:1px solid var(--line)}.subtabs button{border:0;background:none;color:var(--muted);font:inherit;font-size:14px;font-weight:600;padding:10px 14px;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-1px}.subtabs button.on{color:var(--ink);border-bottom-color:#c8962a}.subtabs button:hover{color:var(--ink)}
/* flight mode */
body.flying #app > .side,body.flying .topbar .hud .now-pill{display:none}body.flying #app{grid-template-columns:minmax(0,1fr)!important}body.flying #app > *:not(.side){grid-column:1!important}body.flying main.wrap{max-width:1280px}
.fm-bar{display:flex;align-items:center;gap:10px;font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7cbf6f}.fm-bar .btn{margin-left:auto;text-transform:none;letter-spacing:0;font-family:inherit}
.fm-dot{width:8px;height:8px;border-radius:50%;background:#7cbf6f;animation:btRing 1.4s infinite;box-shadow:0 0 0 0 rgba(124,191,111,.6)}
.fhud{background:linear-gradient(180deg,#121316,#0d0e10);border:1px solid var(--line);border-radius:var(--r-card);padding:18px 22px}
.fhud-route{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.fhud-route b{font-family:var(--f-mono);font-size:30px}.fhud-route i{flex:0 0 120px;height:2px;background:linear-gradient(90deg,#c8962a,transparent)}.fhud-route span{color:var(--muted);margin-left:auto}
.fhud-cells{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:14px}.hud-c{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.hud-c span{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.hud-c b{font-family:var(--f-mono);font-size:24px}.hud-c small{font-size:12px;color:var(--muted);margin-left:3px}
@media (max-width:760px){.fhud-cells{grid-template-columns:repeat(2,1fr)}}
/* command bar */
.cmd{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.55);display:grid;place-items:start center;padding-top:12vh;animation:pgIn .15s ease}
.cmd-box{width:min(620px,calc(100vw - 32px));background:#141417;border:1px solid #2c2c31;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden}
.cmd-box input{width:100%;border:0;border-bottom:1px solid #2c2c31;background:transparent;color:var(--ink);font:inherit;font-size:18px;padding:16px 18px;outline:none}
.cmd-box ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}.cmd-box li{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer}.cmd-box li span{color:var(--muted);font-size:12px}.cmd-box li.on{background:rgba(200,150,42,.15)}.cmd-box li.none{color:var(--muted);cursor:default}
.cmd-foot{margin:0;padding:8px 14px;border-top:1px solid #2c2c31;font-size:12px;color:var(--muted)}kbd{font-family:var(--f-mono);font-size:11px;border:1px solid #3a3a40;border-radius:4px;padding:1px 5px}
.cmd-btn,.bell{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);color:var(--muted);border-radius:10px;padding:6px 10px;cursor:pointer;position:relative}.cmd-btn svg,.bell svg{width:18px;height:18px}.bell b{position:absolute;top:-6px;right:-6px;background:#c23a2b;color:#fff;font-size:10px;border-radius:999px;padding:1px 5px}
/* notifications */
#toasts{position:fixed!important;right:20px!important;bottom:20px!important;left:auto!important;top:auto!important;display:flex;flex-direction:column-reverse;gap:8px;z-index:9400;max-width:380px}#toasts > *:nth-child(n+4){display:none}
.notif-pane{position:fixed;right:20px;top:72px;z-index:9450;width:min(380px,calc(100vw - 40px));max-height:60vh;overflow:auto;background:#141417;border:1px solid #2c2c31;border-radius:14px;padding:14px 16px;box-shadow:0 20px 60px rgba(0,0,0,.5)}.notif-pane ul{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:8px}.notif-pane li{font-size:14px;line-height:1.4}.notif-pane li span{display:block;font-size:11px;color:var(--muted);font-family:var(--f-mono)}
/* job rows */
.jlist{border:1px solid var(--line);border-radius:var(--r-card);overflow:hidden;background:var(--surface)}
.jl-head,.jr-main{display:grid;grid-template-columns:120px 150px 1fr 230px 100px;gap:14px;align-items:center}
.jl-head{padding:10px 150px 10px 18px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}.jl-head span:last-child{display:none}
.jrow{position:relative;border-bottom:1px solid var(--line)}.jrow:last-child{border-bottom:0}
.jr-main{width:100%;text-align:left;border:0;background:transparent;color:var(--ink);font:inherit;padding:14px 150px 14px 18px;cursor:pointer}.jr-main:hover{background:rgba(255,255,255,.03)}
.jrow.k-net{box-shadow:inset 3px 0 0 #c23a2b}.jrow.k-vip{box-shadow:inset 3px 0 0 #c8962a}
.jr-k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.k-net .jr-k{color:#e5533d}.k-vip .jr-k{color:#c8962a}
.jr-rt{font-family:var(--f-mono);font-size:14px}.jr-t{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jr-t em{font-style:normal;font-size:11px;color:#e5533d;border:1px solid #6b2a20;border-radius:4px;padding:1px 6px;margin-left:6px}
.jr-m{font-size:13px;color:var(--muted)}.jr-p{font-family:var(--f-mono);font-weight:700;font-size:16px;text-align:right}
.jr-go{position:absolute;right:16px;top:9px}.jr-go .btn{padding:8px 16px}
.jr-card{padding:0 18px 18px}.jr-card .jcard{margin:0;max-width:640px}.jr-card .jc-art{display:none}.jr-card .jc-go{display:none}
@media (max-width:1000px){.jl-head{display:none}.jr-main{grid-template-columns:1fr auto;padding-right:120px}.jr-k,.jr-m{grid-column:1}.jr-rt{grid-column:1}.jr-t{grid-column:1}.jr-p{grid-column:2;grid-row:1}}
.loaded-now{border-left:4px solid #7cbf6f}`; document.head.appendChild(s); })();
(function(){ const s=document.createElement('style'); s.textContent=`.cut-title .cut-sub p{font-family:inherit;text-transform:none;letter-spacing:0;color:#d6d0c4;font-size:clamp(15px,1.5vw,19px);margin:8px 0;line-height:1.5}.cut-title .cut-sub p b{color:#fff}.cut-title .cut-sub .cut-nerve span,.cut-title .cut-sub .cut-meters span{font-family:var(--f-mono)}`; document.head.appendChild(s); })();

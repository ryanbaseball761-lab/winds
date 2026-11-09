/* ===================== MORE UPGRADES: building on the new UI ===================== */

/* ---- 1. flight HUD v2: heading to the destination, runway and wind on approach, and the chapter goal ---- */
function brg(a,b){ const r=Math.PI/180, y=Math.sin((b.lon-a.lon)*r)*Math.cos(b.lat*r), x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lon-a.lon)*r); return (Math.atan2(y,x)/r+360)%360; }
const _m1Hud = hudHTML;
hudHTML = function(a){ let h=_m1Hud(a); try{ const s=S.sim||{}; const job=a.job; const to=job.local?job.from:job.to; const dest=AP[to]; const live=S.simState==='live'&&s.position;
  const extra=[]; if(live){ const b=Math.round(brg({lat:s.position.lat,lon:s.position.lon},dest)); const hdg=s.motion&&s.motion.hdg!=null?Math.round(s.motion.hdg):null; const off=hdg!=null?((b-hdg+540)%360)-180:0;
    extra.push(`<div class="hud-c hud-brg"><span>Course to ${esc(to)}</span><b>${pad3(b)}°</b><i style="transform:rotate(${off}deg)">↑</i></div>`);
    const togo=distNm({lat:s.position.lat,lon:s.position.lon},dest); if(togo<20 && !dest.water){ const w=s.ext&&s.ext.weather; const wx=w?Object.assign({},job.wx,{dir:w.windDir,spd:w.windKt,gust:0}):job.wx; let r=null; try{ r=rwyAnalysis(to,wx,job.ac); }catch(_){} if(r&&!r.water) extra.push(`<div class="hud-c hud-rw"><span>Land runway</span><b>${esc(r.rw)}</b><small>${pad3(wx.dir)}°/${wx.spd} kt</small></div>`); } }
  const goal = job.kind==='story' && typeof CH_GOAL!=='undefined' && CH_GOAL[job.story] ? `<p class="hud-goal"><span>Goal</span> ${esc(CH_GOAL[job.story][0])}</p>` : job.kind==='check' ? `<p class="hud-goal"><span>Checkride</span> ${esc((job.tasks||[]).join(' · '))}</p>` : job.network ? `<p class="hud-goal"><span>Network run</span> ${job.lowLevel?'Stay under 1,000 ft for the bonus. ':''}${job.drop?'Night drop at a closed strip. ':''}Heat +5 when you land.</p>` : '';
  if(extra.length) h=h.replace('<div class="fhud-cells">','<div class="fhud-cells">'+extra.join(''));
  if(goal) h=h.replace('</section>', goal+'</section>'); }catch(_){} return h; };

/* ---- 2. result screen: pay counts up, Power and Heat show what changed ---- */
(function(){ const _ap=applyResult; applyResult=function(st,job,f,res){ const c=crime(st); const p0=c.power, h0=c.heat; const r=_ap(st,job,f,res); try{ st.last.delta={power:c.power-p0, heat:c.heat-h0}; }catch(_){} return r; }; })();
const _m2Res = resultView;
resultView = function(){ const h=_m2Res(); const L=S.st&&S.st.last; if(!L||!L.delta||!crime().on) return h; const d=L.delta, c=crime(); if(!d.power && !d.heat) return h;
  const bar=(n,v,dv,col)=>`<div class="dbar"><span>${n}</span><div class="db-t"><i style="width:${Math.max(0,v-Math.max(0,dv))}%;background:${col}"></i><i class="db-new" style="width:${Math.abs(dv)}%;background:${dv>=0?col:'transparent'};${dv<0?`outline:1px dashed ${col}`:''}"></i></div><b>${v} <small class="${dv>0?'up':dv<0?'down':''}">${dv>0?'+':''}${dv||''}</small></b></div>`;
  return h.replace('<div class="row next-bar">', `<section class="panel deltas">${bar('Power',c.power,d.power,'#c8962a')}${bar('Heat',c.heat,d.heat,'#c23a2b')}</section><div class="row next-bar">`); };
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ if(S.showResult && !S._counted){ S._counted=true; const el=[...document.querySelectorAll('main section b, main section .big, main section strong')].find(e=>/^\+\$[\d,]+$/.test(e.textContent.trim())); if(el){ const target=Number(el.textContent.replace(/[^\d]/g,'')); let t0=null; const step=ts=>{ if(!t0) t0=ts; const k=Math.min(1,(ts-t0)/900); el.textContent='+'+money(Math.round(target*(1-Math.pow(1-k,3)))); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); } } if(!S.showResult) S._counted=false; }catch(_){} return x; }; })();

/* ---- 3. story achievements ---- */
ACH.push(
  {id:'cx_box',n:`No Questions Asked`,d:`Deliver Dez's box without opening it.`,t:s=>!!(s.story&&s.story.done.CW1)},
  {id:'cx_jet',n:`Fast Money`,d:`Fly Castillo's Vision Jet.`,t:s=>!!s.story.done.CR5},
  {id:'cx_storm',n:`Nobody Else Would`,d:`Fly through the storm in Into the Storm.`,t:s=>!!s.story.done.CR8},
  {id:'cx_heavy',n:`Heavy Metal`,d:`Fly your first airliner chapter.`,t:s=>!!s.story.done.CR14},
  {id:'cx_747',n:`Queen of the Skies`,d:`Fly the 747 in the story.`,t:s=>!!s.story.done.CR16},
  {id:'cx_king',n:`Kingpin`,d:`Take Castillo's place.`,t:s=>!!(s.crime&&s.crime.ending==='kingpin')},
  {id:'cx_witness',n:`Witness`,d:`Bring Castillo down.`,t:s=>!!(s.crime&&s.crime.ending==='witness')},
  {id:'cx_ghost',n:`Ghost`,d:`Vanish with the money.`,t:s=>!!(s.crime&&s.crime.ending==='ghost')},
  {id:'cx_cool',n:`Ice Cold`,d:`Reach Power 60 with Heat under 30.`,t:s=>!!(s.crime&&s.crime.power>=60&&s.crime.heat<30)},
  {id:'cx_loyal',n:`Loyal to the End`,d:`Save Dez and Tico.`,t:s=>!!(s.crime&&s.crime.flags.dezFree&&s.crime.flags.ticoRan)},
  {id:'cx_dirty',n:`Washing Machine`,d:`Launder $100,000 in total.`,t:s=>(s.crime&&s.crime.laundered||0)>=100000},
  {id:'cx_radar',n:`Under the Radar`,d:`Earn a low-level bonus on a network run.`,t:s=>!!(s.crime&&s.crime.radar)}
);
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="launder"]'); if(!b||!S.st) return; const c=crime(); c.laundered=(c.laundered||0)+(c.dirty||0); }, true);
(function(){ const _ap=applyResult; applyResult=function(st,job,f,res){ const before=new Set(Object.keys(st.ach||{})); const r=_ap(st,job,f,res); try{ const o=st.last&&st.last.out; if(o && o.notes.some(n=>/^Under the radar:/.test(n))) crime(st).radar=1; checkAch(st); const fresh=ACH.filter(a=>st.ach&&st.ach[a.id]&&!before.has(a.id)); fresh.forEach((a,i)=>setTimeout(()=>achPop(a), 1200+i*2600)); }catch(_){} return r; }; })();
function achPop(a){ const d=document.createElement('div'); d.className='achpop'; d.innerHTML=`<span>Achievement</span><b>${esc(a.n)}</b><small>${esc(a.d)}</small>`; document.body.appendChild(d); try{ chimeUp&&chimeUp(); }catch(_){} setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(),500); }, 3800); }

/* ---- 4 + 5. story page: trust with each person, your numbers, and replay any chapter's scenes ---- */
const _m4Story = storyView;
storyView = function(){ let h=_m4Story(); try{ const st=S.st, c=crime(st); const MC=mainChapters(); const done=MC.filter(m=>st.story.done[m.id]);
  /* trust bars on people */
  h=h.replace(/<div class="sh-p">([\s\S]*?)<b>([^<]+)<\/b>/g, (m0,pre,name)=>{ const k=Object.keys(CAST).find(x=>CAST[x].n===name.replace(/&quot;/g,'"').replace(/&amp;/g,'&')); const v=k?Math.round(st.rep[k]||0):null; return v==null?m0:`<div class="sh-p">${pre}<b>${name}</b><span class="trust" title="Trust ${v}/100"><i style="width:${Math.min(100,v)}%"></i></span>`; });
  /* replay buttons in the timeline */
  h=h.replace(/<li style="--c:([^"]+)"><span class="sh-n">(\d+)<\/span><div><b>([^<]+)<\/b>/g, (m0,col,n,t)=>{ const m=MC[Number(n)-1]; return m&&st.story.done[m.id]?`<li style="--c:${col}"><span class="sh-n">${n}</span><div><b>${t}</b><button class="sh-replay" data-act="replay-ch" data-id="${m.id}" title="Replay the opening scene">▶ Replay</button>`:m0; });
  /* numbers */
  const earned=fin(st).ledger.filter(x=>x.a>0).reduce((s,x)=>s+x.a,0); const best=(st.log||[]).filter(x=>x.fpm).reduce((b,x)=>Math.min(b,x.fpm),9999);
  const stats=`<section class="panel sh-stats"><div><span>Chapters</span><b>${done.length}<small>/${MC.length}</small></b></div><div><span>Flights</span><b>${st.flights||0}</b></div><div><span>Hours</span><b>${Math.round((st.minutes||0)/6)/10}</b></div><div><span>Earned</span><b>${money(earned)}</b></div><div><span>Best landing</span><b>${best<9999?best+'<small> fpm</small>':'—'}</b></div><div><span>Laundered</span><b>${money(c.laundered||0)}</b></div></section>`;
  h=h.replace('<div class="sh-grid">', stats+'<div class="sh-grid">'); }catch(_){} return h; };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="replay-ch"]'); if(!b) return; const m=CRIME.find(x=>x.id===b.dataset.id); if(m) playPrologue(m, ()=>{}); });

/* ---- 6. settings: everything in one place, in sections ---- */
const _m6Set = settingsHTML;
settingsHTML = function(){ const h=_m6Set(); const ui=(S.st&&S.st.ui)||{}; return h.replace('<div class="set-grid">', `<div class="set-grid">
  <div><p class="label">Story</p><label class="row"><input type="checkbox" data-act="ui-tog" data-k="noRecap" ${ui.noRecap?'':'checked'}> "Previously on" recap when the app opens</label><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-act="walk-again">Show the welcome walkthrough</button></div></div>
  <div><p class="label">Keyboard</p><p class="small muted" style="line-height:1.7"><kbd>1</kbd>–<kbd>5</kbd> pages · <kbd>Ctrl K</kbd> or <kbd>/</kbd> search · <kbd>F</kbd> your flight · <kbd>Space</kbd> next in a cutscene · <kbd>Esc</kbd> skip</p></div>`); };
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="ui-tog"]'); if(!b||!S.st) return; S.st.ui=S.st.ui||{}; S.st.ui[b.dataset.k]=!b.checked; save(); });
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="walk-again"]')||!S.st) return; S.st.ui.walk3=0; save(); location.reload(); });

/* ---- 7. what Power, Heat and dirty cash mean, wherever they appear ---- */
const CX_TIPS = { Power:`Power: how much of the network answers to you. Grows with chapters, hard choices and network runs. Unlocks rank rewards.`, Heat:`Heat: how close the law is. Network runs raise it; legit jobs, lying low and laundering through Caribe Cargo keep it down. Above 60 customs searches you; at 90 you're busted.`, Dirty:`Dirty cash: money from network runs. Launder it on the Jobs or Money page before you can spend it.` };
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ document.querySelectorAll('.sc-m span, .hq-m span, .dbar > span, .chip, .launder .label').forEach(el=>{ if(el.title) return; const t=el.textContent.trim(); const k=/^Power/.test(t)?'Power':/^Heat/.test(t)?'Heat':/^Dirty/i.test(t)?'Dirty':null; if(k){ el.title=CX_TIPS[k]; el.classList.add('has-tip'); } }); }catch(_){} return x; }; })();

/* ---- 8. jobs: see the route on the map ---- */
const _m8Row = jobRow;
jobRow = function(st, j){ const h=_m8Row(st, j); return S.openJob===j.id ? h.replace('<div class="jr-card">', `<div class="jr-card"><button class="btn sm ghost" data-act="job-map" data-id="${j.id}" style="margin:0 0 10px">Show route on the map</button>`) : h; };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="job-map"]'); if(!b||!S.st) return; S.mapRoute=b.dataset.id; const j=(S.st.jobs||[]).find(x=>x.id===b.dataset.id); if(j) S.mapSel=j.local?j.from:j.to; go('map'); });
const _m8Map = mapView;
mapView = function(){ const h=_m8Map(); try{ const j=S.mapRoute&&(S.st.jobs||[]).find(x=>x.id===S.mapRoute); if(!j) return h; const v=MAPV[S.mapZoom||'east']; const W=1000; const X=lon=>(lon-v.lon[0])/(v.lon[1]-v.lon[0])*W; const H=Math.round(1000*(v.lat[1]-v.lat[0])/(v.lon[1]-v.lon[0])*1.05); const Y=lat=>H-(lat-v.lat[0])/(v.lat[1]-v.lat[0])*H;
  const a=AP[j.from], b=AP[j.local?j.from:j.to]; const g=`<g><line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="#c8962a" stroke-width="3"/><circle cx="${X(b.lon)}" cy="${Y(b.lat)}" r="7" fill="#c8962a"/><text x="${X(b.lon)+10}" y="${Y(b.lat)+18}" class="map-next">${esc(j.title)} · ${money(j.pay)}</text></g>`; const i=h.indexOf('</svg>');
  const back=`<div class="row" style="gap:8px;margin-bottom:10px"><button class="btn sm" data-act="map-back">← Back to jobs</button><button class="btn sm primary" data-act="accept" data-id="${j.id}">Accept · ${money(j.pay)}</button></div>`;
  return (i>0?h.slice(0,i)+g+h.slice(i):h).replace(/(<main[^>]*>)/, '$1'+back); }catch(_){ return h; } };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="map-back"]')){ S.mapRoute=null; go('board'); } else if(e.target.closest('[data-act="nav"]')) S.mapRoute=null; }, true);

/* ---- 9. cash changes flash in the header ---- */
(function(){ let last=null; const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ const st=S.st; if(!st) return x; const v=st.cash; if(last!=null && v!==last){ const el=[...document.querySelectorAll('.topbar .hud *')].find(e=>!e.children.length && /^\$[\d,−-]+$/.test(e.textContent.trim())); if(el){ const d=document.createElement('span'); d.className='cashfx '+(v>last?'up':'down'); d.textContent=(v>last?'+':'−')+money(Math.abs(v-last)); el.parentElement.style.position='relative'; el.parentElement.appendChild(d); setTimeout(()=>d.remove(),1800); } } last=v; }catch(_){} return x; }; })();

/* ---- 10. a smooth landing on the story page: the next chapter card glows when it's ready to play ---- */
(function(){ const s=document.createElement('style'); s.textContent=`
.hud-brg{position:relative}.hud-brg i{position:absolute;right:12px;top:12px;font-style:normal;font-size:22px;color:#c8962a;transition:transform .6s}
.hud-rw b{color:#7cbf6f}.hud-goal{margin:12px 0 0;font-size:14px;color:var(--ink)}.hud-goal span{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#c8962a;margin-right:8px}
.fhud-cells{grid-template-columns:repeat(auto-fit,minmax(130px,1fr))!important}
.deltas{display:grid;gap:10px}.dbar{display:grid;grid-template-columns:60px 1fr 80px;gap:12px;align-items:center;font-size:13px}.db-t{height:10px;border-radius:6px;background:rgba(255,255,255,.06);overflow:hidden;display:flex}.db-t i{display:block;height:100%}.db-new{animation:dbIn 1s ease .3s both}@keyframes dbIn{from{width:0!important}}
.dbar b{font-family:var(--f-mono)}.dbar small.up{color:#e0b24a}.dbar small.down{color:#7cbf6f}
.achpop{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9600;display:grid;justify-items:center;gap:2px;background:linear-gradient(180deg,#2a2112,#141310);border:1px solid #c8962a;border-radius:14px;padding:12px 26px;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:pgIn .4s ease}.achpop.out{opacity:0;transition:.5s}.achpop span{font-family:var(--f-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#c8962a}.achpop b{font-size:18px}.achpop small{color:var(--muted)}
.trust{display:block;width:120px;height:4px;border-radius:3px;background:rgba(255,255,255,.08);margin:4px 0 2px}.trust i{display:block;height:100%;border-radius:3px;background:#c8962a}
.sh-replay{margin-left:10px;border:0;background:none;color:var(--muted);font:inherit;font-size:12px;cursor:pointer}.sh-replay:hover{color:#c8962a}
.sh-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.sh-stats div{display:grid;gap:2px}.sh-stats span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.sh-stats b{font-family:var(--f-mono);font-size:20px}.sh-stats small{font-size:12px;color:var(--muted)}
@media (max-width:900px){.sh-stats{grid-template-columns:repeat(3,1fr)}}
.has-tip{cursor:help;text-decoration:underline dotted rgba(255,255,255,.25);text-underline-offset:3px}
.cashfx{position:absolute;right:6px;top:-14px;font-family:var(--f-mono);font-size:12px;font-weight:700;animation:cashUp 1.8s ease forwards;pointer-events:none}.cashfx.up{color:#7cbf6f}.cashfx.down{color:#e5533d}@keyframes cashUp{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
.story-card .sc-next:has(.btn.action.big){box-shadow:0 0 0 1px rgba(194,58,43,.35),0 0 40px rgba(194,58,43,.12);animation:glowIn 2.4s ease-in-out infinite alternate}@keyframes glowIn{to{box-shadow:0 0 0 1px rgba(194,58,43,.55),0 0 60px rgba(194,58,43,.2)}}
@media (prefers-reduced-motion:reduce){.story-card .sc-next{animation:none!important}}`; document.head.appendChild(s); })();

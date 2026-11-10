/* ===================== MORE UPGRADES: building on the new UI ===================== */

/* ---- 1. flight HUD v2: heading to the destination, runway and wind on approach, and the chapter goal ---- */
function brg(a,b){ const r=Math.PI/180, y=Math.sin((b.lon-a.lon)*r)*Math.cos(b.lat*r), x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lon-a.lon)*r); return (Math.atan2(y,x)/r+360)%360; }


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
function achPop(a){ const d=document.createElement('div'); d.className='achpop'; d.innerHTML=`<span>Achievement</span><b>${esc(a.n)}</b><small>${esc(a.d)}</small>`; document.body.appendChild(d); try{ chimeUp&&chimeUp(); }catch(_){} setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(),500); }, 3800); }

/* ---- 4 + 5. story page: trust with each person, your numbers, and replay any chapter's scenes ---- */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="replay-ch"]'); if(!b) return; const m=CRIME.find(x=>x.id===b.dataset.id); if(m) playPrologue(m, ()=>{}); });

/* ---- 6. settings: everything in one place, in sections ---- */
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="ui-tog"]'); if(!b||!S.st) return; S.st.ui=S.st.ui||{}; S.st.ui[b.dataset.k]=!b.checked; save(); });
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="walk-again"]')||!S.st) return; S.st.ui.walk3=0; save(); location.reload(); });

/* ---- 7. what Power, Heat and dirty cash mean, wherever they appear ---- */
const CX_TIPS = { Power:`Power: how much of the network answers to you. Grows with chapters, hard choices and network runs. Unlocks rank rewards.`, Heat:`Heat: how close the law is. Network runs raise it; legit jobs, lying low and laundering through Caribe Cargo keep it down. Above 60 customs searches you; at 90 you're busted.`, Dirty:`Dirty cash: money from network runs. Launder it on the Jobs or Money page before you can spend it.` };

/* ---- 8. jobs: see the route on the map ---- */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="job-map"]'); if(!b||!S.st) return; S.mapRoute=b.dataset.id; const j=(S.st.jobs||[]).find(x=>x.id===b.dataset.id); if(j) S.mapSel=j.local?j.from:j.to; go('map'); });
const _m8Map = mapView;
mapView = function(){ const h=_m8Map(); try{ const j=S.mapRoute&&(S.st.jobs||[]).find(x=>x.id===S.mapRoute); if(!j) return h; const v=MAPV[S.mapZoom||'east']; const W=1000; const X=lon=>(lon-v.lon[0])/(v.lon[1]-v.lon[0])*W; const H=Math.round(1000*(v.lat[1]-v.lat[0])/(v.lon[1]-v.lon[0])*1.05); const Y=lat=>H-(lat-v.lat[0])/(v.lat[1]-v.lat[0])*H;
  const a=AP[j.from], b=AP[j.local?j.from:j.to]; const g=`<g><line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="#c8962a" stroke-width="3"/><circle cx="${X(b.lon)}" cy="${Y(b.lat)}" r="7" fill="#c8962a"/><text x="${X(b.lon)+10}" y="${Y(b.lat)+18}" class="map-next">${esc(j.title)} · ${money(j.pay)}</text></g>`; const i=h.indexOf('</svg>');
  const back=`<div class="row" style="gap:8px;margin-bottom:10px"><button class="btn sm" data-act="map-back">← Back to jobs</button><button class="btn sm primary" data-act="accept" data-id="${j.id}">Accept · ${money(j.pay)}</button></div>`;
  return (i>0?h.slice(0,i)+g+h.slice(i):h).replace(/(<main[^>]*>)/, '$1'+back); }catch(_){ return h; } };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="map-back"]')){ S.mapRoute=null; go('board'); } else if(e.target.closest('[data-act="nav"]')) S.mapRoute=null; }, true);


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

/* ===================== REWORK: a calm story card and a clean Side jobs page ===================== */

/* ---- the next-chapter action, in plain words ---- */
function playAction(st, m, availSet, n){ const s=chapterStatus(st, m, availSet);
  if(st.active) return {btn:`<button class="btn" data-act="nav" data-v="flight">Finish your current flight first</button>`, note:''};
  if(s.k==='ready') return {btn:`<button class="btn action big" data-act="accept-story" data-id="${m.id}">▶ Play chapter ${n}</button>`, note:''};
  if(s.k==='travel'){ const d=deadheadCost(st,s.at); return {btn:`<button class="btn action big" data-act="story-go" data-id="${m.id}" ${st.cash<d.cost?'disabled':''}>▶ Play chapter ${n}</button>`, note: d.cost ? `Includes a ${money(d.cost)} seat to ${esc(s.at)}.` : `You'll be flown to ${esc(s.at)} for free first.`}; }
  if(s.k==='aircraft') return {btn:`<button class="btn" data-act="nav" data-v="hangar">Open the Hangar</button>`, note:`Needs one of these in your MSFS hangar: ${m.ac.map(k=>AC[k]?AC[k].n:k).join(', ')}.`};
  if(s.k==='locked'){ const need=((m.req||{}).ratings||[]).filter(r=>!st.ratings[r]); const btns=chapterAction(st, m, availSet, false);
    return {btn: btns || `<button class="btn" data-act="nav" data-v="pilot">Open Pilot</button>`, note: need.length ? `Needs your ${need.map(r=>RATINGS[r].n).join(' and ')} first.` : `Finish the previous chapter first.`}; }
  return {btn:'', note:''}; }

/* ---- the main story card (Main story page) ---- */
campaignCard = function(st){ const c=crime(st); const MC=mainChapters(); const availSet=new Set(storyAvailable(st).map(m=>m.id));
  const next=MC.find(m=>!st.story.done[m.id]); const done=MC.filter(m=>st.story.done[m.id]); const last=done[done.length-1];
  const act=next ? CRIME_ACTS.find(a=>a.arc===next.arc) : CRIME_ACTS[CRIME_ACTS.length-1]; const ai=CRIME_ACTS.indexOf(act);
  const bar=MC.map(m=>{ const a=CRIME_ACTS.find(x=>x.arc===m.arc); return `<i class="${st.story.done[m.id]?'d':m===next?'n':''}" style="--c:${a.col}" title="${esc(m.title)}"></i>`; }).join('');
  const meters = c.on ? `<div class="sc-m"><span class="sc-rank">${esc(crimeRank(c))}</span><span>Power <b>${c.power}</b></span><span>Heat <b class="${c.heat>=60?'hot':''}">${c.heat}</b></span></div>` : '';
  let body='';
  if(next){ const n=MC.indexOf(next)+1; const mm=dynM(st,next); const acN=storyAircraft(st,next)[0]||next.ac[0]; const pa=playAction(st,next,availSet,n);
    const who=mm.chars.filter(k=>CAST[k]).map(k=>`<span class="sc-who"><span class="sc-avw">${avatar(k)}</span>${esc({reyes:'Reyes',castillo:'Castillo'}[k]||shortName(k))}</span>`).join('');
    body=`<div class="sc-next">
      <p class="sc-k">Chapter ${n} of ${MC.length}</p><h2>${esc(next.title)}</h2><p class="sc-hook">${esc(next.hook||'')}</p>
      <div class="sc-meta"><b>${esc(next.from)} → ${esc(next.to)}</b><span>${esc(AC[acN]?AC[acN].n:acN)}</span><span>${esc({dawn:'Dawn',day:'Daytime',dusk:'Dusk',night:'Night'}[next.time]||'')}</span>${who?`<span class="sc-whos">${who}</span>`:''}</div>
      <div class="sc-go">${pa.btn}${pa.note?`<span class="small muted">${pa.note}</span>`:''}</div></div>`; }
  else { const end={kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'}[c.ending]||'The end'; body=`<div class="sc-next"><p class="sc-k">Story complete</p><h2>Ending: ${esc(end)}</h2><p class="sc-hook">Side jobs and the Starling story are still out there.</p></div>`; }
  return `<section class="panel campaign story-card fade" style="--arc:${act.col}">
    <div class="sc-top"><p class="sc-act">Act ${ai+1} · ${esc(act.arc)}</p>${meters}</div>
    <div class="sc-bar">${bar}</div>
    ${last?`<p class="sc-prev"><span>Previously</span> ${esc(last.recap||'')}</p>`:''}
    ${body}
  </section>`; };

/* ---- the Side jobs page ---- */
function jobTabOf(j){ return j.network?'network':j.special||j.vip?'special':'legit'; }
boardView = function(){ const st=S.st; ensureJobs(st); const here=AP[st.loc]; const c=crime(st); const live=S.simState==='live'; const L=live?loadedAircraft():{};
  const MC=mainChapters(); const next=MC.find(m=>!st.story.done[m.id]); const availSet=new Set(storyAvailable(st).map(m=>m.id));
  let w=null; try{ w=genLocWx(st); }catch(_){}
  const H=(()=>{ try{ return HOUSING[fin(st).housing]||HOUSING.bunk; }catch(_){ return {rent:0}; } })();
  /* status line */
  const status=`<div class="b2-status">
    <span class="b2-here"><b>${esc(st.loc)}</b> ${esc(here.isl||here.n)}</span>
    <span>${hhmm(st.clock)} local</span>${w&&w.dir!=null?`<span>Wind ${pad3(w.dir)}°/${w.spd} kt</span>`:''}
    <span class="b2-dot ${live?'ok':''}">${live?'MSFS connected':'MSFS not connected'}</span>${L.id?`<span>Loaded: ${esc(AC[L.id].n)}</span>`:''}
    <span class="b2-sp"></span><button class="btn sm" data-act="rest" ${st.active?'disabled':''}>New day · rent ${money(H.rent||0)}</button></div>`;
  /* story strip */
  let strip=''; if(next){ const n=MC.indexOf(next)+1; const act=CRIME_ACTS.find(a=>a.arc===next.arc)||CRIME_ACTS[0]; const pa=playAction(st,next,availSet,n);
    strip=`<section class="b2-story" style="--arc:${act.col}"><div><p class="sc-k">Main story · Chapter ${n} of ${MC.length}</p><b>${esc(next.title)}</b><span class="small muted"> ${esc(next.hook||'')}</span></div><div class="b2-story-go">${pa.btn.replace('btn action big','btn action')}<button class="btn ghost sm" data-act="nav" data-v="story">Story</button></div></section>`; }
  /* notices */
  const ready=RATING_ORDER.filter(r=>r!=='CO' && !st.ratings[r] && checkrideReady(st,r).ok);
  const notes=[ st.active?`<div class="b2-note"><b>Flight booked:</b> ${esc(st.active.job.title)} (${esc(st.active.job.from)} → ${esc(st.active.job.local?st.active.job.from:st.active.job.to)}) <button class="btn sm action" data-act="nav" data-v="flight">Open flight</button></div>`:'',
    ready.length?`<div class="b2-note"><b>Checkride ready:</b> ${ready.map(r=>esc(RATINGS[r].n)).join(', ')} <button class="btn sm" data-act="nav" data-v="pilot">Book checkride</button></div>`:'' ].join('');
  /* jobs */
  const tab=S.jobTab||'all'; let jobs=(st.jobs||[]).slice(); try{ jobs=filterJobs(jobs); }catch(_){}
  const count=k=>(st.jobs||[]).filter(j=>k==='all'||jobTabOf(j)===k).length;
  if(tab!=='all') jobs=jobs.filter(j=>jobTabOf(j)===tab);
  const sort=S.jobSort||'pay'; if(sort==='pay') jobs.sort((a,b)=>b.pay-a.pay); else if(sort==='short') jobs.sort((a,b)=>(a.est||plan(a).est)-(b.est||plan(b).est)); else jobs.sort((a,b)=>a.dep-b.dep);
  const lim=S.allJobs?999:6; const shown=jobs.slice(0,lim);
  const tabs=[['all','All'],['network','Network runs'],['legit','Legit'],['special','Charters']].filter(([k])=>k==='all'||count(k)).map(([k,n])=>`<button class="${tab===k?'on':''}" data-act="job-tab" data-v="${k}">${n} <small>${count(k)}</small></button>`).join('');
  const cards = shown.length ? shown.map(j=>stripHTML(st,j)).join('') : `<div class="empty"><h3>No jobs here right now</h3><p>Start a new day, or travel to a busier airport.</p></div>`;
  /* travel */
  const regions=allowedRegions(st); const dests=Object.keys(AP).filter(k=>k!==st.loc && !AP[k].water && regions.includes(AP[k].r)).sort((a,b)=>AP[a].isl.localeCompare(AP[b].isl)); const tv=S.travelTo&&dests.includes(S.travelTo)?S.travelTo:dests[0]; const dh=tv?deadheadCost(st,tv):null;
  return `<main class="wrap board2 fade">
    ${status}${strip}${notes}
    <div class="b2-head"><h2>Jobs at ${esc(st.loc)}</h2><div class="b2-tabs">${tabs}</div>
      <select data-act="job-sort" aria-label="Sort jobs"><option value="pay" ${sort==='pay'?'selected':''}>Best pay</option><option value="short" ${sort==='short'?'selected':''}>Shortest</option><option value="soon" ${sort==='soon'?'selected':''}>Soonest</option></select></div>
    ${c.on?`<p class="small muted b2-hint">Network runs pay more and raise your Heat. Legit jobs cool it down.</p>`:''}
    <div class="jgrid b2-grid">${cards}</div>
    ${jobs.length>lim?`<button class="btn ghost calm-showmore" data-act="all-jobs">Show all ${jobs.length} jobs</button>`:''}
    <div class="b2-foot">
      <details class="panel b2-more"><summary>Travel as a passenger</summary><div class="stack" style="margin-top:10px"><label class="field"><span class="sr">Destination</span><select id="travel-to">${dests.map(k=>`<option value="${k}" ${k===tv?'selected':''}>${esc(AP[k].isl)} · ${k}</option>`).join('')}</select></label>${dh?`<p class="small mono">${dh.d} nm · ${dh.cost?money(dh.cost):'free'} · ~${durTxt(dh.min)}</p>`:''}<button class="btn" data-act="deadhead" data-to="${tv||''}" ${st.active||!dh||st.cash<dh.cost?'disabled':''}>Book the seat</button></div></details>
      <details class="panel b2-more"><summary>Practice and testing</summary><div class="stack" style="margin-top:10px"><button class="btn sm" data-act="practice" ${st.active?'disabled':''}>Practice landing (no pay, just a grade)</button><label class="row"><input type="checkbox" data-act="calm-test" ${testMode()?'checked':''}> Calm test mode <span class="tiny muted">(no sealed orders or urgent jobs)</span></label></div></details>
    </div></main>`; };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="job-tab"]'); if(!b) return; S.jobTab=b.dataset.v; S.allJobs=false; S.keepScroll=true; render(); });
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="job-sort"]'); if(!b) return; S.jobSort=b.value; S.keepScroll=true; render(); });
const _b2Story = storyView; storyView = function(){ return _b2Story().replace(/ &amp; start · \$0/g,' &amp; start (free)').replace(/ & start · \$0/g,' & start (free)').replace(/(<li class="[^"]*">[^<]*<\/li>)/g,'$1'); };
/* the role label in the sidebar shouldn't get cut off */
(function(){ const _sr=storyRole; storyRole=function(st){ const r=_sr(st); return r==="Castillo's network"?'Castillo':r==='Caribe Cargo (owner)'?'Caribe Cargo':r; }; })();

(function(){ const s=document.createElement('style'); s.textContent=`
.story-card{padding:22px 24px;border-top:3px solid var(--arc)}
.sc-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.sc-act{margin:0;font-family:var(--f-mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--arc)}
.sc-m{display:flex;gap:14px;align-items:center;font-size:13px;color:var(--muted)}.sc-m b{color:var(--ink);font-family:var(--f-mono)}.sc-m b.hot{color:#e5533d}
.sc-rank{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--arc) 18%,transparent);color:var(--arc)}
.sc-bar{display:flex;gap:3px;margin:12px 0 14px}.sc-bar i{flex:1;height:5px;border-radius:3px;background:color-mix(in srgb,var(--c) 20%,transparent)}.sc-bar i.d{background:var(--c)}.sc-bar i.n{background:var(--c);opacity:.55}
.sc-prev{margin:0 0 16px;font-size:14px;color:var(--muted)}.sc-prev span{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--arc);margin-right:6px}
.sc-next{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.sc-k{margin:0;font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.sc-next h2{font-size:28px;margin:4px 0 6px}.sc-hook{margin:0 0 12px;font-size:16px;color:var(--ink);opacity:.85}
.sc-meta{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:0 0 16px;font-size:13px;color:var(--muted)}.sc-meta b{color:var(--ink);font-family:var(--f-mono)}
.sc-whos{display:inline-flex;gap:12px;align-items:center}.sc-who{display:inline-flex;flex-direction:row;align-items:center;gap:6px;white-space:nowrap}.sc-who .avatar{width:24px!important;height:24px!important;min-width:24px;flex:none;margin:0}
.sc-avw{width:26px;height:26px;display:inline-block;flex:none;border-radius:50%;overflow:hidden}.sc-avw > *{width:100%!important;height:100%!important;min-width:0!important;margin:0!important}.sc-meta .sc-whos{flex-basis:100%;margin-top:6px}
.sc-go{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.btn.big{padding:12px 22px;font-size:16px}
.board2{max-width:1180px}
.b2-status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;font-size:13px;color:var(--muted);padding:4px 0 14px;border-bottom:1px solid var(--line);margin-bottom:16px}
.b2-here b{font-family:var(--f-mono);color:var(--ink);margin-right:4px}.b2-sp{flex:1}
.b2-dot::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#8f897e;margin-right:6px;vertical-align:1px}.b2-dot.ok::before{background:#7cbf6f}
.b2-story{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 18px;border:1px solid var(--line);border-left:4px solid var(--arc);border-radius:12px;background:var(--surface);margin-bottom:12px}
.b2-story b{font-size:17px}.b2-story-go{display:flex;gap:8px;align-items:center}
.b2-note{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border:1px solid var(--line);border-radius:10px;margin-bottom:10px;font-size:14px}
.b2-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:22px 0 6px}.b2-head h2{margin:0;font-size:20px}.b2-head select{width:auto;margin-left:auto;padding:6px 10px;font-size:13px}
.b2-tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:3px}.b2-tabs button{border:0;background:transparent;color:var(--muted);font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer}.b2-tabs button.on{background:var(--ink);color:var(--bg)}.b2-tabs small{opacity:.6;margin-left:2px}
.b2-hint{margin:0 0 10px}
.b2-grid{grid-template-columns:repeat(auto-fill,minmax(330px,1fr))!important}
.b2-grid .jc-art{display:none}
.b2-grid .jcard{padding-top:4px}.b2-grid .net-tag{display:none}.b2-grid .jcard:has(.net-tag){border-color:#6b2a20;box-shadow:inset 3px 0 0 #c23a2b}
.b2-grid .chips .chip:not(.warn):not(.good):not(.vio){display:none}
.b2-foot{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.b2-more summary{cursor:pointer;font-weight:600}
@media (max-width:760px){.b2-foot{grid-template-columns:1fr}}`; document.head.appendChild(s); })();

/* ===================== CLARITY: one main story, fly from the story card, an obvious flight setup, calmer screens ===================== */
/* ---- the main story is one line, in this order; everything else is a side story ---- */
const MAIN_ORDER = ['Coral Wing','The Buyout','Hartwell','Own Wings','The Tour','Your Company'];
(function(){ for(const a of new Set(STORY.map(m=>m.arc))){ const m=ARC_META[a] = ARC_META[a] || {n:99,tag:'',col:'#e8782a'}; m.main = MAIN_ORDER.includes(a); if(m.main) m.n = MAIN_ORDER.indexOf(a)+1; else if(m.n<10) m.n = 10+m.n; } })();
function mainChapters(){ return [].concat(...MAIN_ORDER.map(a=>STORY.filter(m=>m.arc===a))); }
function chapterAction(st, m, availSet, small){
  const s = chapterStatus(st, m, availSet); const sz = small?'sm':''; const busy = !!st.active;
  if(busy && (s.k==='ready'||s.k==='travel')) return `<span class="chip">Finish your current flight first</span>`;
  if(s.k==='ready') return `<button class="btn action ${sz}" data-act="accept-story" data-id="${m.id}">Fly this chapter</button>`;
  if(s.k==='travel'){ const d=deadheadCost(st,s.at); return `<button class="btn action ${sz}" data-act="story-go" data-id="${m.id}" ${st.cash<d.cost?'disabled':''}>Fly in to ${esc(s.at)} &amp; start · ${money(d.cost)}</button>`; }
  if(s.k==='aircraft') return `<button class="btn ${sz}" data-act="nav" data-v="hangar">Add an aircraft in the Hangar</button>`;
  if(s.k==='locked'){ const btns=[]; for(const r of ((m.req||{}).ratings||[])){ if(st.ratings[r]) continue; const cr=checkrideReady(st,r);
      if(st.cooldown && st.cooldown[r]!=null) btns.push(`<button class="btn ${sz}" data-act="signoff" data-r="${r}">Get signed off for ${esc(RATINGS[r].code||r)} and continue</button>`);
      if(cr.ok) btns.push(`<button class="btn action ${sz}" data-act="nav" data-v="pilot">Take the ${esc(RATINGS[r].n)} checkride</button>`); }
    return btns.join(' '); }
  return ''; }
campaignCard = function(st){
  const availSet = new Set(storyAvailable(st).map(m=>m.id)); const MC = mainChapters(); const doneMain = MC.filter(m=>st.story.done[m.id]).length;
  const avail = MC.filter(m=>!st.story.done[m.id] && chapterStatus(st,m,availSet).k!=='locked');
  const next = avail[0] || MC.find(m=>!st.story.done[m.id]);
  let main = '';
  if(next){ const s=chapterStatus(st,next,availSet); const arcCh=STORY.filter(x=>x.arc===next.arc); const art = (()=>{ try{ return islandArt(next.local?next.from+'L':next.to, next.dep, 1200, 220, next.ac[0]); }catch(_){ return ''; } })();
    main = `<div class="main-next"><div class="mn-art" aria-hidden="true">${art}</div><div class="mn-in">
      <p class="mn-kicker">Main story · Chapter ${MC.indexOf(next)+1} of ${MC.length} · ${esc(next.arc)}</p>
      <h3>${esc(next.title)}</h3>
      <p class="mn-teaser">${s.k==='locked'?'':esc(((next.brief||[])[0]||'').split(/(?<=[.!?])\s/).slice(0,2).join(' '))}</p>
      <p class="small mn-status">${statusLine(st,s,next)}</p>
      <div class="row" style="margin-top:4px">${chapterAction(st,next,availSet,false)}${avail.length>1?`<span class="tiny muted">${avail.length-1} more main chapter${avail.length>2?'s':''} open on the story map</span>`:''}</div>
    </div></div>`; }
  else main = `<div class="main-next done"><div class="mn-in"><p class="mn-kicker">Main story</p><h3>Every main chapter flown</h3><p class="small">The side stories are still out there.</p></div></div>`;
  const sides = arcList().filter(a=>!MAIN_ORDER.includes(a)).map(a=>arcState(st,a,availSet)).filter(a=>a.status.k!=='complete' && (a.done>0 || ['ready','travel','aircraft'].includes(a.status.k)));
  const rank={ready:0,travel:1,aircraft:2,locked:3}; sides.sort((a,b)=>rank[a.status.k]-rank[b.status.k] || a.meta.n-b.meta.n);
  const sideRows = sides.slice(0,4).map(a=>`<div class="side-row" style="--arc:${a.meta.col}"><span class="sr-dot"></span><div style="min-width:0"><b>${esc(a.arc)}</b> <span class="tiny muted">${a.done}/${a.total}</span><p class="small">Chapter ${a.ch.indexOf(a.next)+1}: ${a.status.k==='locked'&&a.done===0?'???':esc(a.next.title)}${a.status.k==='travel'?` <span class="tiny muted">· starts at ${esc(a.status.at)}</span>`:''}</p></div><div>${chapterAction(st,a.next,availSet,true)}</div></div>`).join('');
  return `<section class="panel campaign fade">
    <div class="row between" style="align-items:flex-end"><div><p class="label">Your story</p><h2 style="font-size:20px">Main story: ${doneMain} of ${MC.length} chapters</h2></div><button class="btn sm ghost" data-act="nav" data-v="story">Story map →</button></div>
    <div class="meter big" style="margin:10px 0 14px"><i style="width:${Math.round(doneMain/Math.max(1,MC.length)*100)}%"></i></div>
    ${main}
    ${sideRows?`<div class="side-list"><p class="label" style="margin:14px 0 6px">Side stories</p>${sideRows}</div>`:''}
  </section>`; };
/* deadhead to the start airport and open the chapter in one tap */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="story-go"]'); if(!b||!S.st) return; e.stopImmediatePropagation(); const st=S.st; const m=STORY.find(x=>x.id===b.dataset.id); if(!m || st.active) return;
  const to=m.from; if(st.loc!==to){ const d=deadheadCost(st,to); if(st.cash<d.cost){ toast(`You need ${money(d.cost)} for the ticket to ${to}.`); return; } txn(st,-d.cost,'Travel','Deadhead to '+to); st.duty+=d.min; st.clock+=d.min; st.loc=to; st.visited[to]=true; st.jobsKey=''; addJournal(st, `Deadheaded to ${AP[to].isl}`, `Rode in the back of an airliner to ${AP[to].n} for "${m.title}".`, [], 'travel'); }
  const acs=storyAircraft(st,m); if(!acs.length){ save(); toast(`You're at ${to}, but none of the aircraft for this chapter are in your Hangar.`); render(); return; }
  st.active={job:storyJob(st,m,acs[0]), accepted:Date.now()}; save(); S.showResult=false; go('flight'); toast(`You're at ${to}. "${m.title}" is ready.`); }, true);
/* a failed checkride shouldn't stop the story */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="signoff"]'); if(!b||!S.st) return; const r=b.dataset.r, st=S.st; if(!RATINGS[r]) return;
  st.ratings[r]=true; if(st.cooldown) delete st.cooldown[r]; addJournal(st, `Signed off: ${RATINGS[r].n}`, `After a long talk and a few extra circuits, the examiner signs your ${RATINGS[r].n}. "Keep practicing," she says. "The sky will test you again."`, ['wilkins'], 'milestone'); save(); toast(`${RATINGS[r].n} signed off. The story continues.`); S.keepScroll=true; render(); });
const _clResult = resultView;
resultView = function(){ let h=_clResult(); const L=S.st.last; if(L && L.job && L.job.kind==='check' && L.out && !L.out.pass && !S.st.ratings[L.job.rating]){
    h=h.replace('<div class="grid-2">', `<section class="panel signoff"><div><p class="label">Didn't pass this time</p><h3>Retest tomorrow, or keep the story moving</h3><p class="small muted">The examiner can sign you off now so the next chapters open. You can still retake the checkride any time for the practice.</p></div><button class="btn primary" data-act="signoff" data-r="${L.job.rating}">Sign me off and continue</button></section><div class="grid-2">`); }
  return h; };
/* story map: main story first, side stories under their own heading; travel buttons start the chapter */
const _clStory = storyView;
storyView = function(){ let h=_clStory(); const t=document.createElement('template'); t.innerHTML=h; const grid=t.content.querySelector('.arc-grid'); if(!grid) return h;
  const cards=[...grid.children]; const main=[], side=[]; cards.forEach(c=>{ const name=(c.querySelector('h3')||{}).textContent||''; (MAIN_ORDER.includes(name)?main:side).push([name,c]); });
  main.sort((a,b)=>MAIN_ORDER.indexOf(a[0])-MAIN_ORDER.indexOf(b[0]));
  const g1=document.createElement('div'); g1.className='arc-grid'; main.forEach(x=>g1.appendChild(x[1])); const g2=document.createElement('div'); g2.className='arc-grid side'; side.forEach(x=>g2.appendChild(x[1]));
  const h1=document.createElement('div'); h1.className='section-title'; h1.innerHTML='<h2>Main story</h2><span class="small muted">Play these in order. This is the heart of the career.</span>';
  const h2=document.createElement('div'); h2.className='section-title'; h2.innerHTML='<h2>Side stories</h2><span class="small muted">Optional storylines you can fly any time they open</span>';
  grid.replaceWith(h1, g1, h2, g2);
  t.content.querySelectorAll('li.ch.travel').forEach(li=>{ const title=(li.querySelector('.ch-t')||{}).textContent; const m=STORY.find(x=>x.title===title); const btn=li.querySelector('[data-act="deadhead"]'); if(m && btn){ btn.dataset.act='story-go'; btn.dataset.id=m.id; btn.classList.add('action'); btn.textContent = btn.textContent.replace('Deadhead to','Fly in to').replace(' · ',' & start · '); } });
  return t.innerHTML; };

/* ---- flight setup: big, obvious tiles for runway, fuel, clock, parking and weather ---- */
function runwayPlan(job){ const dep=rwyAnalysis(job.from, job.wx, job.ac); const arr=job.local?null:rwyAnalysis(job.to, job.wx, job.ac); return {dep, arr}; }
function windTxt(r){ if(!r) return ''; if(r.water) return 'into the wind'; return `${Math.round(Math.max(0,r.head))} kt headwind, ${Math.round(r.xw)} kt crosswind${r.head<0?' (tailwind!)':''}`; }
preflightHTML = function(job){
  const C = preflightChecks(job); const get=k=>C.find(c=>c.k===k); const p=plan(job); const live=S.simState==='live'; const R=runwayPlan(job); const wx=job.wx;
  const fuelGal=Math.ceil(Math.max(p.gal*1.3, p.gal+5)), payload=Math.max(0,p.payload-170); const fuel=get('fuel'), time=get('time'), wxc=get('wx'); const park=suggestParking(job);
  if(live) fetchParking(job.from);
  const tile=(cls, icon, title, body, action)=>`<div class="su-tile ${cls}"><div class="su-ic" aria-hidden="true">${icon}</div><div class="su-b"><p class="label">${title}</p>${body}</div>${action?`<div class="su-a">${action}</div>`:''}</div>`;
  const rwBig = R.dep && !R.dep.water ? `<div class="su-rw"><span><small>Take off</small><b class="mono">${esc(R.dep.rw)}</b></span>${R.arr?`<i>→</i><span><small>Land</small><b class="mono">${esc(R.arr.water?'water':R.arr.rw)}</b></span>`:''}</div>` : `<div class="su-rw"><span><b>Into the wind</b></span></div>`;
  const tiles = [
    tile('rw','🛫','Runways', `${rwBig}<p class="tiny">Wind ${pad3(wx.dir)}° at ${wx.spd}${wx.gust?'G'+wx.gust:''} kt · ${esc(windTxt(R.dep))}${R.dep&&R.dep.over?' · <b class="bad-t">over this aircraft\'s crosswind limit</b>':''}</p>`, ''),
    tile(fuel&&fuel.ok?'ok':'todo','⛽','Fuel & cargo', `<b>${fuelGal} gal · ${payload} lb</b><p class="tiny">${fuel?esc(fuel.t):'Plan '+p.gal+' gal plus reserve'}</p>`, live?`<button class="btn primary" data-act="pf-load" ${S.loading?'disabled':''}>${S.loading?'Loading…':'Load into MSFS'}</button>`:`<span class="tiny muted">Set in the MSFS fuel &amp; payload menu</span>`),
    tile(time? (time.ok?'ok':'todo') : '', '🕙','Time of day', `<b>${hhmm(job.dep)} local</b><p class="tiny">${time?esc(time.t):'Set this time in MSFS before you load in.'}</p>`, time&&!time.ok&&time.act?`<button class="btn primary" data-act="${time.act}">${esc(time.actLabel)}</button>`:''),
    tile('', '🅿','Parking spot', `<b>${esc(park.spot?park.spot.name:'GA ramp')}</b><p class="tiny">${esc(park.text)}</p>`, park.spot && live && S.sim.position && distNm({lat:S.sim.position.lat,lon:S.sim.position.lon},AP[job.from])<3 && S.sim.motion && S.sim.motion.gs<1 ? `<button class="btn" data-act="park-move">Move me there</button>`:''),
    tile(wxc&&wxc.ok?'ok':'', '☁','Weather', `<b>${esc(wx.n)}</b><p class="tiny">${wxc?esc(wxc.ok?wxc.t:'MSFS can\'t be changed by add-ons. Use Live weather in MSFS and the briefing matches it.'):'Generated for this flight.'}</p>`, wxc&&wxc.act?`<button class="btn" data-act="${wxc.act}">${esc(wxc.actLabel)}</button>`:'')
  ].join('');
  const small = C.filter(c=>['sim','pos','ac','park'].includes(c.k)).map(c=>`<span class="su-chip ${c.ok?'ok':'no'}" title="${esc(c.d||'')}">${c.ok?'✓':'!'} ${esc(c.t)}</span>`).join('');
  return `<div class="row between"><div><p class="label">${S.st.active&&S.st.active.started?'Before takeoff':'Flight setup'}</p><h3>Set up MSFS for this flight</h3></div><div class="row"><button class="btn sm ghost" data-act="pf-pln">Flight plan (.pln)</button><button class="btn sm ghost" data-act="pf-recheck">Check again</button></div></div>
    <div class="su-chips">${small}</div><div class="su-grid">${tiles}</div>`; };
renderPreflight = function(){ const el=document.getElementById('preflight'); const a=S.st&&S.st.active; if(el && a) el.innerHTML=preflightHTML(a.job); };
/* setup sits right under the boarding pass */
const _clFlight = flightView;
flightView = function(){ const h=_clFlight(); const a=S.st&&S.st.active; if(!a || a.started || S.showResult || S.debrief) return h; const t=document.createElement('template'); t.innerHTML=h;
  const pf=t.content.querySelector('#preflight'), pass=t.content.querySelector('.pass'); if(pf && pass){ pf.classList.add('fsetup'); pass.after(pf); } return t.innerHTML; };
const _clInflight = inflightView;
inflightView = function(){ let h=_clInflight(); const a=S.st&&S.st.active; if(!a) return h; try{ const R=runwayPlan(a.job); if(R.dep) h=h.replace(/(<p class="label">In flight[^<]*<\/p>)/, `$1<p class="if-rw">Take off <b class="mono">${esc(R.dep.water?'into wind':R.dep.rw)}</b>${R.arr?` · Land <b class="mono">${esc(R.arr.water?'into wind':R.arr.rw)}</b>`:''} · wind ${pad3(a.job.wx.dir)}°/${a.job.wx.spd} kt</p>`); }catch(_){} return h.replace('id="preflight"','id="preflight" data-x="1"').replace('class="panel stack preflight"','class="panel stack preflight fsetup"'); };

/* ---- each screen gets its own atmosphere ---- */
const _clRender = render;
render = function(){ const r=_clRender.apply(this, arguments); try{ document.documentElement.dataset.view = S.showResult && S.view==='flight' ? 'result' : (S.st&&S.st.active&&S.st.active.started&&S.view==='flight'?'inflight':S.view||''); }catch(_){} return r; };

/* ---- hangar in tabs instead of one very long page ---- */
const HG_TABS = [['fleet','Your fleet'],['settings','Settings'],['msfs','MSFS connection'],['save','Saves & help']];
function hgGroup(title, el){ const t=(title||'').toLowerCase(); if(/settings|flight setup|voices|match msfs|urgent/.test(t)) return 'settings'; if(/live msfs|inside the sim|setup check/.test(t) || (el.textContent||'').includes('Run the setup check again')) return 'msfs'; if(/save data|backups|report a problem/.test(t)) return 'save'; return 'fleet'; }
const _clHangar = hangarView;
hangarView = function(){ const h=_clHangar(); const t=document.createElement('template'); t.innerHTML=h; const main=t.content.querySelector('main'); if(!main) return h; const cur=S.hangarTab||'fleet';
  [...main.children].forEach(el=>{ const g=hgGroup((el.querySelector('h2,h3')||{}).textContent, el); if(g!==cur) el.remove(); });
  const bar=document.createElement('nav'); bar.className='hg-tabs'; bar.innerHTML=HG_TABS.map(([k,l])=>`<button class="${k===cur?'on':''}" data-act="hg-tab" data-v="${k}">${l}</button>`).join(''); main.prepend(bar); return t.innerHTML; };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="hg-tab"]'); if(!b) return; S.hangarTab=b.dataset.v; S.keepScroll=true; render(); });

/* the old 'Set up MSFS' list in the sidebar is now the Flight setup panel */
const _clFlight2 = flightView;
flightView = function(){ const h=_clFlight2(); return h.replace(/<section class="panel stack">\s*<h3>Set up MSFS<\/h3>[\s\S]*?<\/section>/, ''); };

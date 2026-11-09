/* ===================== STORY PROGRESS, NAV & STORY TAB ===================== */
const ARC_META = {
  'Coral Wing':      {main:true, n:1, tag:`Your first weeks flying for Mari at Coral Wing Air.`, col:'#0b746f'},
  'Hartwell':        {main:true, n:2, tag:`A reclusive billionaire, a reef, and a secret worth protecting.`, col:'#a0671c'},
  'Own Wings':       {main:true, n:3, tag:`From pilot to owner: Mari's offer, and a company of your own.`, col:'#d9532f'},
  'Starling':        {n:4, tag:`Vivienne's Vision Jet, with Abe in the right seat.`, col:'#c2603a'},
  'The Short Ones':  {n:5, tag:`St. Barth, Saba and the shortest runways in the islands.`, col:'#6a49a8'},
  'Rosa':            {n:6, tag:`A baker who has never once been late, and won't start now.`, col:'#b0522a'},
  'Calloway':        {n:7, tag:`Your rival next door, and the day his luck runs out.`, col:'#c23b2a'},
  'Dez':             {n:8, tag:`Cricket, Dez, and a match he absolutely cannot miss.`, col:'#2a68aa'},
  'Hurricane Season':{n:9, tag:`Relief flights after the storm passes.`, col:'#3d5a80'},
  'Going Abroad':    {n:10, tag:`Ferry flights north, the Mayan coast, and across the Atlantic.`, col:'#1d7f47'}
};
function arcMeta(arc){ return ARC_META[arc] || {n:99, tag:'', col:'#0b746f'}; }
function arcList(){ return [...new Set(STORY.map(m=>m.arc))].sort((a,b)=>arcMeta(a).n-arcMeta(b).n); }
function arcChapters(arc){ return STORY.filter(m=>m.arc===arc); }

function unlockHint(st, m){
  const r=m.req||{}, miss=[];
  if(r.after && !st.story.done[r.after]){ const p=STORY.find(x=>x.id===r.after); miss.push(`finish “${p?p.title:r.after}”`); }
  (r.ratings||[]).forEach(x=>{ if(!st.ratings[x]) miss.push(RATINGS[x].n); });
  if(r.hours && st.minutes/60 < r.hours) miss.push(`${r.hours} career hours (you have ${(st.minutes/60).toFixed(1)})`);
  return miss;
}
/* Where a chapter stands right now: done | ready | travel | aircraft | locked */
function chapterStatus(st, m, availSet){
  if(st.story.done[m.id]) return {k:'done'};
  const avail = availSet ? availSet.has(m.id) : storyAvailable(st).some(x=>x.id===m.id);
  if(!avail) return {k:'locked', miss:unlockHint(st,m)};
  const acs = storyAircraft(st, m);
  if(!acs.length) return {k:'aircraft', ac:m.ac};
  if(st.loc!==m.from) return {k:'travel', at:m.from};
  return {k:'ready', at:m.from};
}
function arcState(st, arc, availSet){
  const ch = arcChapters(arc); const done = ch.filter(m=>st.story.done[m.id]).length;
  const next = ch.find(m=>!st.story.done[m.id]) || null;
  return {arc, ch, done, total:ch.length, next, status: next ? chapterStatus(st,next,availSet) : {k:'complete'}, meta:arcMeta(arc)};
}
const ST_LABEL = {ready:['Ready','ok'], travel:['Travel first','go'], aircraft:['Needs aircraft','hold'], locked:['Locked','lock'], complete:['Complete','ok'], done:['Done','ok']};
function statusLine(st, s, m){
  if(s.k==='ready') return `Ready to fly from <b>${esc(s.at)}</b>, where you are now.`;
  if(s.k==='travel') return `Starts at <b>${esc(s.at)}</b> (${esc(AP[s.at].isl)}). Deadhead or fly there first.`;
  if(s.k==='aircraft') return `Needs one of these in your MSFS hangar: ${s.ac.map(k=>esc(AC[k].n)).join(', ')}.`;
  if(s.k==='locked') return s.miss.length ? `Unlocks with: ${s.miss.map(esc).join(' · ')}.` : `Unlocks as your career grows.`;
  if(s.k==='complete') return `Every chapter flown.`;
  return '';
}
function segsHTML(st, a){ return `<div class="segs" aria-hidden="true">${a.ch.map(m=>`<i class="${st.story.done[m.id]?'d':m===a.next?'n':''}"></i>`).join('')}</div>`; }
function stPill(k){ const [t,c]=ST_LABEL[k]; return `<span class="stp ${c}">${t}</span>`; }

/* ---------- board: "Your story" tracker ---------- */
function campaignCard(st){
  const availSet = new Set(storyAvailable(st).map(m=>m.id));
  const all = arcList().map(a=>arcState(st,a,availSet));
  const doneAll = all.reduce((s,a)=>s+a.done,0), totalAll = all.reduce((s,a)=>s+a.total,0);
  const rank = {ready:0, travel:1, aircraft:2, locked:3, complete:4};
  let show = all.filter(a=>a.status.k!=='complete' && (a.done>0 || ['ready','travel','aircraft'].includes(a.status.k)));
  const mainNext = all.find(a=>a.meta.main && a.status.k!=='complete');
  if(mainNext && !show.includes(mainNext)) show.push(mainNext);
  show.sort((a,b)=>rank[a.status.k]-rank[b.status.k] || (b.meta.main?1:0)-(a.meta.main?1:0) || a.meta.n-b.meta.n);
  show = show.slice(0,4);
  const rows = show.map(a=>`<div class="arc-row" style="--arc:${a.meta.col}">
      <div class="arc-mark">${a.done}<small>/${a.total}</small></div>
      <div style="min-width:0">
        <div class="row between" style="gap:6px"><span class="arc-name">${esc(a.arc)} <span class="tiny muted">${a.meta.main?'Main story':'Side story'}</span></span>${stPill(a.status.k)}</div>
        ${segsHTML(st,a)}
        <p class="small"><span class="muted">Chapter ${a.ch.indexOf(a.next)+1}:</span> <b>${a.status.k==='locked' && a.done===0 && !a.meta.main ? '???' : esc(a.next.title)}</b></p>
        <p class="tiny muted">${statusLine(st,a.status,a.next)}</p>
      </div></div>`).join('');
  return `<section class="panel campaign fade">
    <div class="row between" style="align-items:flex-end"><div><p class="label">Your story</p><h2 style="font-size:20px">${doneAll} of ${totalAll} chapters flown</h2></div>
      <button class="btn sm ghost" data-act="nav" data-v="story">Open story map →</button></div>
    <div class="meter big" style="margin:10px 0 14px"><i style="width:${Math.round(doneAll/totalAll*100)}%"></i></div>
    <div class="arc-rows">${rows || `<p class="small muted">Fly jobs and earn ratings to open new chapters.</p>`}</div>
  </section>`;
}

/* Story strips say which chapter they are */
const _progStoryJob = storyJob;
storyJob = function(st, m, acId){
  const j = _progStoryJob(st, m, acId); const ch = arcChapters(m.arc);
  j.label = `${m.arc} · Ch ${ch.indexOf(m)+1}/${ch.length}`; return j;
};

/* ---------- navigation ---------- */
const NAV_ICON = {
  board:`<path d="M9 4h6v3H9zM7 5H5v15h14V5h-2M8 11h8M8 15h5"/>`,
  map:`<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>`,
  flight:`<path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5v2l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z"/>`,
  cockpit:`<path d="M4 15a8 8 0 1 1 16 0M12 15l4-5M4 19h16"/>`,
  pilot:`<path d="M4 5h16v14H4zM8 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 17c.5-1.6 1.6-2.5 2.5-2.5s2 .9 2.5 2.5M13 10h4M13 14h4"/>`,
  story:`<path d="M4 5c3-1.3 5.5-1.3 8 0v14c-2.5-1.3-5-1.3-8 0zM12 5c2.5-1.3 5-1.3 8 0v14c-3-1.3-5.5-1.3-8 0"/>`,
  log:`<path d="M6 3h11a1 1 0 0 1 1 1v17H7a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2zM5 18a2 2 0 0 1 2-2h11M9 7h6M9 11h6"/>`,
  money:`<path d="M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 10v4M18 10v4"/>`,
  company:`<path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 11h2M14 11h2"/>`,
  hangar:`<path d="M2 20h20M4 20V11a8 8 0 0 1 16 0v9M8 20v-5h8v5"/>`
};
const NAV_GROUPS = [['board','map','flight','cockpit'],['pilot','story','log'],['money','company','hangar']];
function band(){
  const st=S.st; const r=topRating(st);
  const emp = st.company ? esc(st.company.name) : 'Coral Wing Air';
  const avail = storyAvailable(st).length;
  const rides = RATING_ORDER.filter(x=>x!=='CO' && checkrideReady(st,x).ok).length;
  const badge = v => v==='flight' && st.active ? `<span class="nb live" aria-label="flight booked">1</span>` : v==='story' && avail ? `<span class="nb" aria-label="${avail} chapters available">${avail}</span>` : v==='pilot' && rides ? `<span class="nb" aria-label="${rides} checkrides ready">${rides}</span>` : '';
  const label = Object.fromEntries(VIEWS);
  const tab = k => `<button class="tab" data-act="nav" data-v="${k}" ${S.view===k?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${NAV_ICON[k]||''}</svg><span>${label[k]}</span>${badge(k)}</button>`;
  return `<header class="band"><div class="wrap band-in">
    <div class="brand">${LOGO}<b>Trade Winds</b><span>${esc(st.pilot.name)} · ${rankOf(st).name} · ${emp}</span></div>
    <div class="stat"><span class="k">At</span><span class="v">${esc(st.loc)}</span></div>
    <div class="stat"><span class="k">Day ${st.day}</span><span class="v">${dateTxt(st.day)} ${hhmm(st.clock)}</span></div>
    <div class="stat"><span class="k">Cash</span><span class="v">${money(st.cash)}</span></div>
    <div class="stat"><span class="k">Logged</span><span class="v">${fmtH(st.minutes)}</span></div>
    <div class="stat"><span class="k">License</span><span class="v">${r.code}</span></div>
    <span class="sync" id="sim-band">${S.simState==='live'?'● MSFS live':''}</span><span class="sync" id="sync">${syncText()}</span>
  </div>
  <nav class="tabs-wrap" aria-label="Sections"><div class="wrap tabs">${NAV_GROUPS.map(g=>g.filter(k=>label[k]).map(tab).join('')).join('<span class="tab-sep" aria-hidden="true"></span>')}</div></nav></header>`;
}

/* ---------- Story tab ---------- */
function storyView(){
  const st=S.st;
  const availSet = new Set(storyAvailable(st).map(m=>m.id));
  const arcs = arcList().map(a=>arcState(st,a,availSet));
  const doneAll = arcs.reduce((s,a)=>s+a.done,0), totalAll = arcs.reduce((s,a)=>s+a.total,0);
  const arcsDone = arcs.filter(a=>a.status.k==='complete').length;
  const ready = arcs.filter(a=>['ready','travel'].includes(a.status.k));
  const pct = Math.round(doneAll/totalAll*100);
  const ring = `<div class="pring" style="--p:${pct}"><div><b>${pct}%</b><span>complete</span></div></div>`;
  const chapterRow = (a, m, i) => {
    const s = chapterStatus(st, m, availSet); const isNext = m===a.next;
    const reveal = s.k==='done' || isNext || availSet.has(m.id);
    let action = '';
    if(s.k==='ready') action = st.active ? `<span class="chip">Finish your current flight first</span>` : `<button class="btn action sm" data-act="accept-story" data-id="${m.id}">Fly this chapter</button>`;
    else if(s.k==='travel'){ const dh=deadheadCost(st,s.at); action = `<button class="btn sm" data-act="deadhead" data-to="${s.at}" ${st.active||st.cash<dh.cost?'disabled':''}>Deadhead to ${s.at} · ${money(dh.cost)}</button>`; }
    return `<li class="ch ${s.k}${isNext?' next':''}">
      <span class="node">${s.k==='done'?'✓':s.k==='locked'?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"/></svg>`:i+1}</span>
      <div style="min-width:0">
        <p class="ch-t">${reveal?esc(m.title):'Untold chapter'}</p>
        <p class="tiny muted">${reveal?`${esc(m.from)} → ${esc(m.local?m.from:m.to)} · ${esc(AC[m.ac[0]].n)}${m.ac.length>1?' or similar':''}`:''}${s.k==='done'?'':reveal?'<br>':''}${s.k!=='done'?statusLine(st,s,m):''}</p>
        ${action?`<div style="margin-top:6px">${action}</div>`:''}
      </div></li>`;
  };
  const arcCard = a => `<article class="arc-card" style="--arc:${a.meta.col}">
      <header><div class="row between" style="gap:8px"><span class="label" style="color:inherit;opacity:.85">${a.meta.main?'Main story':'Side story'}</span>${stPill(a.status.k)}</div>
        <h3>${esc(a.arc)}</h3><p class="small">${esc(a.meta.tag)}</p>
        <div class="row between" style="margin-top:10px"><div class="segs light">${a.ch.map(m=>`<i class="${st.story.done[m.id]?'d':m===a.next?'n':''}"></i>`).join('')}</div><span class="mono small">${a.done}/${a.total}</span></div></header>
      <ol class="chapters">${a.ch.map((m,i)=>chapterRow(a,m,i)).join('')}</ol></article>`;
  const journal = `<section class="panel"><div class="section-title"><h2>Journal</h2><span class="small muted">${st.journal.length} entries</span></div>
      <div class="journal">${st.journal.map(e=>`<article class="entry"><div class="when">Day ${e.day}<br>${hhmm(e.clock||0)}</div><div style="min-width:0"><h4>${esc(e.title)} ${e.grade?`<span class="chip">${e.grade}</span>`:''}${e.kind==='milestone'?' <span class="chip good">Milestone</span>':''}${e.kind==='ai'?' <span class="chip sea">Journal</span>':''}</h4><p class="${e.kind==='ai'?'ai-out':''}">${esc(e.text)}</p></div></article>`).join('')}</div></section>`;
  const people = `<section><div class="section-title"><h2>The people</h2><span class="small muted">Relationships grow with every good flight</span></div>
      <div class="cast">${Object.keys(CAST).map(k=>{ const c=CAST[k], v=st.rep[k]||10; return `<div class="person"><div class="who">${avatar(k)}<div style="min-width:0"><b>${esc(c.n)}</b><p class="tiny muted">${esc(c.role)}</p></div></div><p class="small">${esc(c.bio)}</p><div class="row between small"><span>${repWord(v)}</span><span class="mono">${v}/100</span></div><div class="meter"><i style="width:${v}%"></i></div></div>`; }).join('')}</div></section>`;
  return `<main class="wrap stack fade">
    <section class="story-hero">
      ${ring}
      <div style="min-width:0"><p class="label" style="color:inherit;opacity:.75">Story map</p><h1>${doneAll} of ${totalAll} chapters flown</h1>
        <p>${arcsDone} of ${arcs.length} storylines complete. ${ready.length ? `<b>${ready.length}</b> chapter${ready.length>1?'s':''} can be flown now.` : `Earn ratings and hours to open the next chapters.`}</p>
        <div class="row" style="margin-top:12px">${ready.slice(0,3).map(a=>`<span class="hero-chip" style="--arc:${a.meta.col}">${esc(a.arc)}: ${esc(a.next.title)}</span>`).join('')}</div></div>
    </section>
    <div class="arc-grid">${arcs.map(arcCard).join('')}</div>
    ${journal}
    ${guestbookHTML(st)}
    ${reviewsSection(st)}
    ${people}
  </main>`;
}

/* Keep the active tab in view on narrow screens */
(function(){ const app=document.getElementById('app'); if(!app || !window.MutationObserver) return;
  new MutationObserver(()=>{ const t=app.querySelector('.tab[aria-current="page"]'); const rail=t&&t.parentElement; if(!rail || rail.scrollWidth<=rail.clientWidth) return;
    const want = t.offsetLeft - (rail.clientWidth - t.offsetWidth)/2; rail.scrollLeft = Math.max(0, want); }).observe(app,{childList:true});
})();

/* ===================== CALM: fewer things on every screen ===================== */
function tpl(h){ const t=document.createElement('template'); t.innerHTML=h; return t; }
function headText(el){ return ((el.querySelector('h1,h2,h3,.label')||{}).textContent||'').trim(); }
function wrapDetails(nodes, title, cls){ if(!nodes.length) return null; const d=document.createElement('details'); d.className='calm-more '+(cls||''); const s=document.createElement('summary'); s.innerHTML=title; d.appendChild(s); const box=document.createElement('div'); box.className='calm-more-in'; nodes.forEach(n=>box.appendChild(n)); d.appendChild(box); return d; }

/* ---- navigation: fewer tabs ---- */

/* ---- job board ---- */
const CHIP_KEEP = /urgent|vip|sealed|bonus|owner|ifr|night|instructor|festival|storm|hurricane|2×|double/i;
const _cmBoard = boardView;
boardView = function(){ const h=_cmBoard(); if(S.view!=='board' || !S.st) return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h; const st=S.st;
  // story chapters already live in the story card, and the morning dispatch is noise
  main.querySelectorAll('section').forEach(sec=>{ const ht=headText(sec); if(/^Story missions/.test(ht) || sec.classList.contains('dispatch')) sec.remove(); });
  // sidebar: keep the day (duty, rest, travel); everything else folds away
  const aside=main.querySelector('aside.stack'); if(aside){ const extra=[]; [...aside.children].forEach(el=>{ const ht=headText(el); if(/duty day/i.test(ht) || /travel as a passenger/i.test(ht)) return; if(/how a flight works|goals|weekly|this week|hurricane|landing league/i.test(ht) || el.classList.contains('weekly')) { el.remove(); return; } extra.push(el); });
    const d=wrapDetails(extra.filter(e=>e.parentNode).map(e=>{ e.remove(); return e; }), `About ${esc(AP[st.loc].n)}`, 'aside-more'); if(d) aside.appendChild(d); }
  // job cards: two tags at most, and only six cards until you ask for more
  main.querySelectorAll('.jcard').forEach(c=>{ const chips=[...c.querySelectorAll('.chip')]; let kept=0; chips.forEach(ch=>{ if(CHIP_KEEP.test(ch.textContent) && kept<2){ kept++; } else ch.remove(); }); });
  const grid=[...main.querySelectorAll('.jgrid')].pop(); if(grid && !S.allJobs){ const cards=[...grid.children]; if(cards.length>6){ cards.slice(6).forEach(c=>c.remove()); const more=document.createElement('button'); more.className='btn ghost calm-showmore'; more.dataset.act='all-jobs'; more.textContent=`Show all ${cards.length} jobs`; grid.after(more); } }
  // story card: the main chapter plus at most two side stories
  const rows=[...main.querySelectorAll('.campaign .side-row')]; if(rows.length>2){ rows.slice(2).forEach(r=>r.remove()); const a=document.createElement('button'); a.className='btn sm ghost'; a.dataset.act='nav'; a.dataset.v='story'; a.textContent=`${rows.length-2} more side stor${rows.length-2>1?'ies':'y'} on the story map`; main.querySelector('.campaign .side-list').appendChild(a); }
  return t.innerHTML; };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="all-jobs"]')){ S.allJobs=true; S.keepScroll=true; render(); } });
const _cmGo = go; go = function(v){ if(v!=='board') S.allJobs=false; return _cmGo.apply(this, arguments); };

/* ---- flight briefing: the essentials, then one "Flight details" drawer ---- */

/* ---- pilot page: ratings first, the rest folded ---- */
const _cmPilot = pilotView;
pilotView = function(){ const h=_cmPilot(); const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h; const st=S.st;
  const nav=document.createElement('div'); nav.className='row calm-subnav'; nav.innerHTML=`<button class="btn sm" data-act="nav" data-v="profile">Profile &amp; stats</button><button class="btn sm" data-act="nav" data-v="log">Logbook</button>`; main.prepend(nav);
  const folds=[];
  [...main.querySelectorAll('section, aside > *, :scope > div')].forEach(el=>{ const ht=headText(el); if(/^Achievements|^Personal records|^Score trend|^Landings|^Types flown/i.test(ht) && !folds.some(f=>f.contains(el)||el.contains(f))) folds.push(el); });
  // ratings: earned and ready ones stay, plus the next two to work toward; the rest fold away
  const rungs=[...main.querySelectorAll('.rung')]; const locked=rungs.filter(r=>!r.classList.contains('earned') && !r.classList.contains('ready'));
  const later=locked.slice(2); if(later.length){ const anchor=later[0].previousElementSibling; const d2=wrapDetails(later.map(r=>{ r.remove(); return r; }), `${later.length} more ratings later in your career`, 'later-ratings'); if(anchor) anchor.after(d2); }
  const d=wrapDetails(folds.map(e=>{ e.remove(); return e; }), 'Achievements, landings and records'); if(d) main.appendChild(d);
  main.querySelectorAll('aside').forEach(as=>{ if(!as.children.length){ const g=as.parentElement; as.remove(); if(g) g.style.gridTemplateColumns='minmax(0,1fr)'; } });
  return t.innerHTML; };

/* ---- quieter cabin feed: last four lines ---- */
const _cmCabin = cabinInner;
cabinInner = function(){ const h=_cmCabin(); if(!h) return h; const t=tpl(h); const lines=[...t.content.querySelectorAll('.feed > *, .cab-feed > *, .feed-line')]; lines.slice(4).forEach(l=>l.remove()); return t.innerHTML; };
/* ---- story map: the storylines, then journal / guestbook / reviews / people folded ---- */



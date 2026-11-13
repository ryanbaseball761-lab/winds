/* ===================== PILOT PAGE (Licences tab) ===================== */

function pilotBaseHTML(){
  const st=S.st; const s=st.stats;
  const rungs = RATING_ORDER.map(rid=>{
    const R=RATINGS[rid]; const earned=!!st.ratings[rid]; const chk = checkrideReady(st, rid);
    let action='';
    if(earned) action = `<span class="chip good">Earned</span>`;
    else if(rid==='CO') action = chk.ok ? `<button class="btn sm action" data-act="nav" data-v="company">Apply on the Company tab</button>` : '';
    else if(chk.ok){ const acs = checkrideAircraft(st, rid); action = acs.length ? `<div class="row"><select id="cr-${rid}" style="width:auto;padding:6px 8px;font-size:13px" aria-label="Checkride aircraft">${acs.map(k=>`<option value="${k}">${esc(AC[k].n)}</option>`).join('')}</select>${feeSelect(st,rid)}<button class="btn sm action" data-act="book-check" data-r="${rid}" ${st.active?'disabled':''}>Book checkride</button></div>` : `<span class="chip warn">No suitable aircraft in your hangar</span>`; }
    const req = R.req||{}; const hrsPct = req.hours ? Math.min(100, st.minutes/60/req.hours*100) : 100;
    return `<div class="rung ${earned?'earned':chk.ok?'ready':''}">
      <div class="badge">${R.code}</div>
      <div style="min-width:0"><div class="row" style="gap:8px"><b>${esc(R.n)}</b>${R.dest?`<span class="chip">${R.dest}</span>`:''}</div>
        <p class="small muted">${esc(R.unlocks||R.blurb||'')}</p>
        ${!earned && req.hours ? `<div class="row small" style="margin-top:6px;gap:8px"><div class="meter" style="flex:1;min-width:120px"><i style="width:${hrsPct}%"></i></div><span class="mono">${(st.minutes/60).toFixed(1)} / ${req.hours} h</span></div>`:''}
        ${!earned && !chk.ok && chk.miss?.length ? `<p class="tiny muted" style="margin-top:4px">Needs: ${esc(chk.miss.join(' · '))}</p>`:''}
      </div><div>${action}</div></div>`;
  }).join('');
  const types = Object.keys(st.types).sort((a,b)=>st.types[b]-st.types[a]);
  const landTot = ['butter','smooth','firm','hard','crash'].reduce((t,k)=>t+(s[k]||0),0)||1;
  return `<main class="wrap stack fade">
    
    ${licenseCard(st)}
    ${pilotExtras(st)}
    <div class="grid-2">
      <section><div class="section-title"><h2>Ratings & qualifications</h2><span class="small muted">Earn each one with a checkride</span></div><div class="ladder">${rungs}</div></section>
      <aside class="stack">
        <section class="panel stack"><h3>Landings</h3>${['butter','smooth','firm','hard','crash'].map(k=>`<div><div class="row between small"><span>${LANDING[k].n}</span><span class="mono">${s[k]||0}</span></div><div class="meter ${k==='hard'?'warn':k==='crash'?'bad':''}"><i style="width:${(s[k]||0)/landTot*100}%"></i></div></div>`).join('')}
        <p class="small muted">Diversions: ${s.diverts} · Emergencies handled by the book: ${s.scen}</p></section>
        <section class="panel stack"><h3>Types flown</h3>${types.length?`<ul class="tight small">${types.map(k=>`<li>${esc(AC[k].n)} <span class="muted">· ${st.types[k]} flight${st.types[k]===1?'':'s'}</span></li>`).join('')}</ul>`:'<p class="small muted">None yet. Your first flight adds one.</p>'}
        <p class="small muted">Airports visited: ${Object.keys(st.visited).length} of ${Object.keys(AP).filter(k=>!AP[k].water).length}</p></section>
      </aside></div></main>`;
}

/* Licences tab: the story path, the licence card, ratings, and (folded) achievements, landings and records */
function pilotView(){ const st=S.st;
  let h = pilotBaseHTML().replace(/<\/main>\s*$/, recordsPanel(st)+'</main>');
  h = pilotFold(h);
  h = h.replace(/(reputation \d+)/, '<span title="Reputation (0–100) grows with good flights. Higher reputation means better pay and VIP clients.">$1</span>');
  h = h.replace(/<select([^>]*)aria-label="Checkride fee"/g, '<select$1aria-label="Checkride fee" title="Faster checkrides cost more"');
  return h.replace(/(<main[^>]*>)/, m=>m+storyLadderHTML(st));
}
/* Profile/Logbook links on top; locked ratings past the next two and the stat panels fold away */
function pilotFold(h){ const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  const nav=document.createElement('div'); nav.className='row calm-subnav'; nav.innerHTML=`<button class="btn sm" data-act="nav" data-v="profile">Profile &amp; stats</button><button class="btn sm" data-act="nav" data-v="log">Logbook</button>`; main.prepend(nav);
  const folds=[];
  [...main.querySelectorAll('section, aside > *, :scope > div')].forEach(el=>{ const ht=headText(el); if(/^Achievements|^Personal records|^Score trend|^Landings|^Types flown/i.test(ht) && !folds.some(f=>f.contains(el)||el.contains(f))) folds.push(el); });
  const rungs=[...main.querySelectorAll('.rung')]; const locked=rungs.filter(r=>!r.classList.contains('earned') && !r.classList.contains('ready'));
  const later=locked.slice(2); if(later.length){ const anchor=later[0].previousElementSibling; const d2=wrapDetails(later.map(r=>{ r.remove(); return r; }), `${later.length} more ratings later in your career`, 'later-ratings'); if(anchor) anchor.after(d2); }
  const d=wrapDetails(folds.map(e=>{ e.remove(); return e; }), 'Achievements, landings and records'); if(d) main.appendChild(d);
  main.querySelectorAll('aside').forEach(as=>{ if(!as.children.length){ const g=as.parentElement; as.remove(); if(g) g.style.gridTemplateColumns='minmax(0,1fr)'; } });
  return t.innerHTML; }
/* the ratings the story needs, in order, with a Book button when one is ready */
function storyLadderHTML(st){ const steps=LADDER.map(([r,u])=>{ const has=st.ratings[r]; const ready=!has && checkrideReady(st,r).ok; return `<div class="lad ${has?'has':ready?'ready':''}"><span class="lad-dot">${has?'✓':ready?'!':''}</span><b>${esc(RATINGS[r].n)}</b><small>${esc(u)}</small>${ready?(checkrideAircraft(st,r).length?`<button class="btn sm action" data-act="book-check" data-r="${r}">Book checkride · ${money(feeFor(st,r))}</button>`:`<a href="#" class="small" data-act="nav" data-v="hangar">Tick an aircraft for it in the Hangar</a>`):''}</div>`; }).join('<i class="lad-line"></i>');
  return `<section class="panel ladder"><p class="label">Your path through the story</p><div class="lad-row">${steps}</div><p class="small muted" style="margin-top:8px">Other ratings (Commercial, Instrument, Multi-Engine…) open more side jobs but aren't needed for the story.</p></section>`; }

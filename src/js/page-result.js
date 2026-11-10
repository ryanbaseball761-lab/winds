/* ===================== RESULT PAGE =====================
   Shown on the Flight page right after a flight (S.showResult). From the top:
     the summary (grade, pay, Power and Heat), what changed, the next step, your decision if the
     chapter has one, then everything else folded under "Flight details". */

/* The flight's notes: the first four, and the rest folded away. Routine notes are left out. */
function resultNotes(out){
  if(!out.notes.length) return '';
  const notes=out.notes.filter(n=>!/Landing league|airframe health: (9\d|100)%/.test(n)); const more=notes.slice(4);
  const li=n=>`<li>${esc(n)}</li>`;
  return `<section class="notice"><ul class="tight">${notes.slice(0,4).map(li).join('')}</ul>${more.length?`<details><summary class="small muted">${more.length} more note${more.length>1?'s':''}</summary><ul class="tight">${more.map(li).join('')}</ul></details>`:''}</section>`;
}
/* Power and Heat: where they are now and what this flight changed. */
function resultDeltas(st){
  const L=st.last; const c=crime(st); if(!L.delta || !c.on) return ''; const d=L.delta; if(!d.power && !d.heat) return '';
  const bar=(n,v,dv,col)=>`<div class="dbar"><span>${n}</span><div class="db-t"><i style="width:${Math.max(0,v-Math.max(0,dv))}%;background:${col}"></i><i class="db-new" style="width:${Math.abs(dv)}%;background:${dv>=0?col:'transparent'};${dv<0?`outline:1px dashed ${col}`:''}"></i></div><b>${v} <small class="${dv>0?'up':dv<0?'down':''}">${dv>0?'+':''}${dv||''}</small></b></div>`;
  return `<section class="panel deltas">${bar('Power',c.power,d.power,'#c8962a')}${bar('Heat',c.heat,d.heat,'#c23a2b')}</section>`;
}
function resultHeatWarning(st){
  const c=crime(st); if(!c.on || c.heat<60) return '';
  return `<div class="heat-warn">${c.heat>=80 ? `Heat ${c.heat}: the feds are watching. Story chapters are on hold until it's under 80.` : `Heat ${c.heat}: customs is searching planes now. A clean landing gets you waved through; legit jobs cool it down.`}</div>`;
}
/* "Side jobs" and the button for the next chapter you can act on. */
function resultNextBar(st){
  const MC=mainChapters(); const availSet=new Set(storyAvailable(st).map(m=>m.id));
  const next=MC.find(m=>!st.story.done[m.id] && chapterStatus(st,m,availSet).k!=='locked');
  const upNext=MC.find(m=>!st.story.done[m.id]); const n=MC.indexOf(upNext)+1;
  let btn='';
  if(next){ const lead = upNext ? `Chapter ${n}: ` : 'Next: ';
    btn=chapterAction(st,next,availSet,false).replace('Fly this chapter',`${lead}${esc(next.title)}`).replace(/Fly in to (\w+) &amp; start · \$0/, (m,ap)=>`${lead}${esc(next.title)} (free flight to ${ap})`);
    if(upNext) btn=btn.replace('>Add an aircraft in the Hangar<', `>Chapter ${n} needs the ${esc(AC[upNext.ac[0]]?AC[upNext.ac[0]].n:upNext.ac[0])}: open Hangar<`); }
  return `<div class="row next-bar"><button class="btn primary" data-act="nav" data-v="board">Side jobs</button>${btn}</div>`;
}

function resultView(){
  const st=S.st; const L=st.last; const {job,res,out}=L; const f=L.f; const c=crime(st);
  const sc = job.scen?SCEN[job.scen]:null;
  const isChapter = CRIME_IDS.has(job.story);
  setTimeout(paintCard,0);
  const passFail = job.kind==='check' ? (out.pass?`<span class="chip good">Passed</span>`:`<span class="chip bad">Not passed</span>`) : '';
  const crimeChips = (c.on && (job.network||job.kind==='story') ? `<span class="chip">Power ${c.power}</span><span class="chip ${c.heat>=60?'warn':''}">Heat ${c.heat}</span>` : '') + (c.dirty ? `<span class="chip warn">Dirty cash ${money(c.dirty)}</span>` : '');
  const choice = choiceHTML(st) || '';
  const manifest = out.manifest ? `<section class="panel stack"><p class="label">Your passengers</p><div class="mf-list">${out.manifest.map(x=>`<div class="mf"><span class="mf-ic">${TRAITS[x.p.trait].i}</span><div><b>${esc(x.p.name)}</b> <span class="stars small">${'★'.repeat(x.s)}${'☆'.repeat(5-x.s)}</span><span class="small">${esc(x.line)}</span></div></div>`).join('')}</div></section>` : '';
  const failedCheckride = job.kind==='check' && !out.pass && !st.ratings[job.rating];
  return `<main class="wrap stack fade">
    ${isChapter?`<div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="btn sm ghost" data-act="after-replay">▶ Replay scene</button></div>`:''}
    <section class="panel"><div class="row" style="gap:24px;align-items:center">
      ${scoreRing(res)}
      <div class="stack" style="gap:4px;min-width:0;flex:1">
        <p class="label">Flight complete · score ${res.score}/100</p>
        <h1 style="font-size:28px">${esc(job.title)}</h1>
        <p class="muted">${esc(job.from)} → ${esc(st.log[0]?.to||job.to)} · ${esc(AC[job.ac].n)} · ${durTxt(res.block)}</p>
        <div class="row">${f && f.verified?`<span class="chip sea">Verified by MSFS · ${f.simFpm} fpm</span>`:''}${passFail}${out.pay?`<span class="chip good">+${money(out.pay)}</span>`:''}${out.costs?`<span class="chip bad">−${money(out.costs)}</span>`:''}<span class="chip">Reputation ${st.reputation}/100</span></div>
      </div></div>${crimeChips?`<div class="row" style="gap: 6px; margin-top: 8px; flex-wrap: wrap;">${crimeChips}</div>`:''}</section>
    ${resultDeltas(st)}${resultHeatWarning(st)}${resultNextBar(st)}
    ${choice}
    <details class="calm-more res-more"><summary>Flight details: score, passengers, notes and share card</summary><div class="calm-more-in">
      <div class="row" style="justify-content:flex-end">${NOTE_BTN}</div>
      ${debriefSummary(L)}
      ${replaySection(st)||''}
      ${manifest}
      ${out.story?`<section class="panel"><p class="label">Outcome</p><div class="brief" style="margin-top:6px"><p>${esc(out.story)}</p></div></section>`:''}
      ${surpriseResultHTML(out)}
      ${out.ach&&out.ach.length?`<section class="panel ach-pop"><p class="label">Achievement unlocked</p><div class="row" style="margin-top:6px">${out.ach.map(a=>`<div class="medal"><b>${esc(a.n)}</b><span class="small muted">${esc(a.d)}</span></div>`).join('')}</div></section>`:''}
      ${out.review?`<section class="panel"><p class="label">Passenger review</p><p class="stars" aria-label="${out.review.stars} of 5 stars">${stars(out.review.stars)}</p><p class="brief" style="margin-top:4px">"${esc(out.review.text)}"</p><p class="small muted">${esc(out.review.who)}</p></section>`:''}
      ${resultNotes(out)}
      ${touchdownPanel(f)||''}
      ${failedCheckride?`<section class="panel signoff"><div><p class="label">Didn't pass this time</p><h3>Retest tomorrow, or keep the story moving</h3><p class="small muted">The examiner can sign you off now so the next chapters open. You can still retake the checkride any time for the practice.</p></div><button class="btn primary" data-act="signoff" data-r="${job.rating}">Sign me off and continue</button></section>`:''}
      <div class="calm-more-in"><div class="grid-2">
        <section class="panel"><h2>Scorecard</h2><div class="scroll-x" style="margin-top:8px"><table><thead><tr><th>Item</th><th class="num">Points</th><th class="num">Max</th></tr></thead><tbody>${res.parts.map(p=>`<tr><td style="white-space:normal">${esc(p[0])}</td><td class="num">${p[1]}</td><td class="num">${p[2]}</td></tr>`).join('')}</tbody></table></div></section>
        ${sc?`<section class="teach"><h3>By the book: ${esc(sc.n)}</h3><ul class="tight small">${sc.book.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></section>`:'<div></div>'}
      </div></div>
      <div class="calm-more-in">${cardSection()}</div>
    </div></details></main>`;
}

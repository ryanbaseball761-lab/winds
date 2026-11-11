/* ===================== STORY PAGE =====================
   storyView() is the home of the main story: the next chapter (campaignCard), your numbers,
   the story so far, the people, your operation (fleet, crew, safehouse, rank rewards) and the five acts. */

/* Who you work for, as shown under your name. */
function storyRole(st){ const c=crime(st);
  if(c.ending==='kingpin') return 'Kingpin'; if(c.ending==='witness') return 'New name, new island'; if(c.ending==='ghost') return 'Whereabouts unknown';
  if(st.story.done.CR15) return 'Caribe Cargo'; if(c.on) return "Castillo's crew"; return 'Coral Wing Air'; }

/* The ways to launder dirty cash that are open to you right now. */
function launderOpts(st){ const d=st.story.done; let L=[];
  L.push({id:'dez',n:'Dez, cash under the counter',fee:0.25,heat:3}); if(d.CR5) L.push({id:'trust',n:'The Hartwell Reef Trust',fee:0.15,heat:1}); if(d.CR15) L.push({id:'caribe',n:'Caribe Cargo invoices',fee:0.08,heat:0});
  if(safeLevel(st)>=1) L=L.map(o=>Object.assign({},o,{fee:Math.max(0.03,o.fee-0.05)}));   // a safehouse takes 5 points off every fee
  if(crime(st).flags.dezJail) L=L.map(o=>o.id==='dez'?{id:'changer',n:'A money changer in Philipsburg',fee:0.3,heat:4}:o);   // with Dez in prison, someone else takes his place
  return L; }

/* The button (and a note under it) for playing a chapter from where you are now. */
function playAction(st, m, availSet, n){
  const s=chapterStatus(st, m, availSet);
  const r = (()=>{
    if(!st.active && crime(st).on && fedsWatching(st) && CRIME_IDS.has(m.id)) return {btn:`<button class="btn" data-act="nav" data-v="board">Lie low first</button>`, note:`Heat ${crime(st).heat}: the feds are watching. Get it under 80 to play.`};
    if(st.active) return {btn:`<button class="btn" data-act="nav" data-v="flight">Finish your current flight first</button>`, note:''};
    if(s.k==='ready') return {btn:`<button class="btn action big" data-act="accept-story" data-id="${m.id}">▶ Play chapter ${n}</button>`, note:''};
    if(s.k==='travel'){ const d=deadheadCost(st,s.at); return {btn:`<button class="btn action big" data-act="story-go" data-id="${m.id}" ${st.cash<d.cost?'disabled':''}>▶ Play chapter ${n}</button>`, note: d.cost ? `Includes a ${money(d.cost)} seat to ${esc(s.at)}.` : `You'll be flown to ${esc(s.at)} for free first.`}; }
    if(s.k==='aircraft') return {btn:`<button class="btn" data-act="nav" data-v="hangar">Open the Hangar</button>`, note:`Needs one of these in your MSFS hangar: ${m.ac.map(k=>AC[k]?AC[k].n:k).join(', ')}.`};
    if(s.k==='locked'){ const need=((m.req||{}).ratings||[]).filter(r=>!st.ratings[r]); const btns=chapterAction(st, m, availSet, false);
      return {btn: btns || `<button class="btn" data-act="nav" data-v="pilot">Open Pilot</button>`, note: need.length ? `Needs your ${need.map(r=>RATINGS[r].n).join(' and ')} first.` : `Finish the previous chapter first.`}; }
    return {btn:'', note:''}; })();
  /* the chapter needs an aircraft you're licensed for but haven't ticked: one click adds it */
  if(s.k==='aircraft'){ const opts=m.ac.filter(k=>AC[k] && canFly(st,k)).slice(0,3); if(opts.length) r.btn=opts.map(k=>`<button class="btn sm" data-act="own-ac" data-v="${k}">I own the ${esc(AC[k].n)}</button>`).join('')+r.btn; }
  return r;
}

/* The card for the next chapter: act, progress, "previously", and the Play button. */
function campaignCard(st){ const c=crime(st); const MC=mainChapters(); const availSet=new Set(storyAvailable(st).map(m=>m.id));
  const next=MC.find(m=>!st.story.done[m.id]); const done=MC.filter(m=>st.story.done[m.id]); const last=done[done.length-1];
  const act=next ? CRIME_ACTS.find(a=>a.arc===next.arc) : CRIME_ACTS[CRIME_ACTS.length-1]; const ai=CRIME_ACTS.indexOf(act);
  const bar=MC.map(m=>{ const a=CRIME_ACTS.find(x=>x.arc===m.arc); return `<i class="${st.story.done[m.id]?'d':m===next?'n':''}" style="--c:${a.col}" title="${esc(m.title)}"></i>`; }).join('');
  const meters = c.on ? `<div class="sc-m"><span class="sc-rank">${esc(crimeRank(c))}</span><span>Power <b>${c.power}</b></span><span>Heat <b class="${c.heat>=60?'hot':''}">${c.heat}</b></span></div>` : '';
  let body='';
  if(next){ const n=MC.indexOf(next)+1; const mm=dynM(st,next); const acN=storyAircraft(st,next)[0]||next.ac[0]; const pa=playAction(st,next,availSet,n);
    const who=mm.chars.filter(k=>CAST[k]).map(k=>`<span class="sc-who"><span class="sc-avw">${avatar(k)}</span>${esc({reyes:'Reyes',castillo:'Castillo'}[k]||shortName(k))}</span>`).join('');
    let length=''; try{ const jj=storyJob(st,next,acN); length=`<span>~${durTxt(jj.est||plan(jj).est)}</span>`; }catch(_){}   // roughly how long the flight is
    body=`<div class="sc-next">
      <p class="sc-k">Chapter ${n} of ${MC.length}</p><h2>${esc(next.title)}</h2><p class="sc-hook">${esc(next.hook||'')}</p>
      <div class="sc-meta"><b>${esc(next.from)} → ${esc(next.to)}</b>${length}<span>${esc(AC[acN]?AC[acN].n:acN)}</span><span>${esc({dawn:'Dawn',day:'Daytime',dusk:'Dusk',night:'Night'}[next.time]||'')}</span>${who?`<span class="sc-whos">${who}</span>`:''}</div>
      <div class="sc-go">${pa.btn}${pa.note?`<span class="small muted">${pa.note}</span>`:''}</div></div>`; }
  else { const end={kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'}[c.ending]||'The end'; body=`<div class="sc-next"><p class="sc-k">Story complete</p><h2>Ending: ${esc(end)}</h2><p class="sc-hook">Side jobs and the Starling story are still out there.</p></div>`; }
  return `<section class="panel campaign story-card fade" style="--arc:${act.col}">
    <div class="sc-top"><p class="sc-act">Act ${ai+1} · ${esc(act.arc)}</p>${meters}</div>
    <div class="sc-bar">${bar}</div>
    ${last?`<p class="sc-prev"><span>Previously</span> ${esc(recapOf(st,last))}</p>`:''}
    ${body}
  </section>`;
}

/* Your jets (with what each costs per day) and the crew you can hire. */
function fleetCrewHTML(st){ const d=st.story.done; const f=FLEET.filter(x=>d[x[0]]); const c=crime(st); if(!f.length && !c.on) return '';
  const crew=CREW.filter(k=>d[k.need]).map(k=>{ const lost=k.lost(c.flags,d); const has=c.crew&&c.crew[k.id];
    const hire = !k.cost ? `<button class="btn sm" data-act="hire" data-v="${k.id}">Bring on</button>` : st.cash<k.cost ? `<span class="small muted">Hire · ${money(k.cost)} (you need ${money(k.cost-st.cash)} more)</span>` : `<button class="btn sm" data-act="hire" data-v="${k.id}">Hire · ${money(k.cost)}</button>`;
    return `<div class="fc-row"><div><b>${esc(k.n)}</b><p class="small muted">${lost?'No longer with you.':esc(k.perk)}</p></div>${lost?'<span class="chip">Gone</span>':has?'<span class="chip good">On your crew</span>':hire}</div>`; }).join('');
  return `<section class="panel fleet"><p class="label">Your operation</p><h3>Fleet</h3>${f.length?`<div class="fc-grid">${f.map(x=>`<div class="fc-ac"><b class="mono">${x[3]}</b><span>${esc(x[2])}</span><small>${esc(x[4])}</small>${UPKEEP[x[1]]?`<small class="mono">${money(UPKEEP[x[1]])}/day</small>`:''}</div>`).join('')}</div>`:'<p class="small muted">Your first jet comes in Act 2.</p>'}
    ${crew?`<h3 style="margin-top:16px">Crew</h3>${crew}`:''}</section>`; }

/* Daily costs and the safehouses, bought in order. */
function operationHTML(st){ const c=crime(st); if(!c.on) return ''; const L=dailyCosts(st); const tot=L.reduce((s,x)=>s+x[1],0); const lv=safeLevel(st);
  const buy=(s,i)=> i<=lv ? '<span class="chip good">Yours</span>'
    : i>lv+1 ? `<span class="small muted">${money(s.cost)} · buy the one above first</span>`
    : st.cash<s.cost ? `<span class="small muted">${money(s.cost)} · you need ${money(s.cost-st.cash)} more</span>`
    : `<button class="btn sm" data-act="buy-safe" data-v="${s.id}" >Buy · ${money(s.cost)}</button>`;
  return `<section class="panel op-panel"><p class="label">Your operation</p><div class="op-grid">
    <div><h3>Daily costs <span class="mono">${money(tot)}</span></h3>${L.length?`<ul class="tight small">${L.map(x=>`<li>${esc(x[0])}: ${money(x[1])}</li>`).join('')}</ul>`:'<p class="small muted">Nothing yet. Jets and crew cost money every day.</p>'}</div>
    <div><h3>Safehouse</h3>${SAFEHOUSES.map((s,i)=>`<div class="fc-row"><div><b>${esc(s.n)}</b><p class="small muted">${esc(s.perk)}</p></div>${buy(s,i)}</div>`).join('')}</div></div>${st.company?`<div class="fc-row" style="margin-top:12px"><div><b>${esc(st.company.name)}</b><p class="small muted">${st.company.fleet.length} aircraft of your own. Buy more, hire crews and put them on routes that earn while you rest.</p></div><button class="btn sm" data-act="nav" data-v="company">Open the airline</button></div>`:''}</section>`; }

function storyView(){
  const st=S.st; const c=crime(st); const MC=mainChapters(); const availSet=new Set(storyAvailable(st).map(m=>m.id)); const done=MC.filter(m=>st.story.done[m.id]); const next=MC.find(m=>!st.story.done[m.id]);
  const actNo=arc=>CRIME_ACTS.findIndex(a=>a.arc===arc)+1;
  /* the story so far: one line per finished chapter, grouped by act, each with a replay button */
  let lastArc=null;
  const time = done.length ? done.map(m=>{ const ch=m.choice&&c.choice[m.id]!=null?m.choice.opts[c.choice[m.id]].t:null; const col=arcMeta(m.arc).col;
      const head = m.arc!==lastArc ? `<li class="sh-act-h" style="--c:${col}">Act ${actNo(m.arc)} · ${esc(m.arc)}</li>` : ''; lastArc=m.arc;
      return `${head}<li style="--c:${col}"><span class="sh-n">${MC.indexOf(m)+1}</span><div><b>${esc(m.title)}</b><button class="sh-replay" data-act="replay-ch" data-id="${m.id}" title="Replay the opening scene">▶ Replay</button><p>${esc(m.recap||'')}</p>${ch?`<p class="sh-ch">You chose: ${esc(ch)}</p>`:''}</div></li>`; }).join('')
    : `<li style="--c:var(--muted)"><span class="sh-n">·</span><div><b>Nothing yet</b><p>Your story starts with chapter 1, at the top of this page.</p></div></li>`;
  /* the people you've met, with how much each trusts you */
  const people = metPeople(st).map(k=>{ const v=Math.round(st.rep[k]||0); return `<div class="sh-p">${avatar(k)}<div><b>${esc(CAST[k].n)}</b><span class="trust" title="Trust ${v}/100"><i style="width:${Math.min(100,v)}%"></i></span><p>${esc(personStatus(st,k))}</p></div></div>`; }).join('');
  const acts = CRIME_ACTS.map((a,i)=>{ const ch=MC.filter(m=>m.arc===a.arc); return `<div class="sh-act" style="--c:${a.col}"><p class="label">Act ${i+1} · ${ch.filter(m=>st.story.done[m.id]).length}/${ch.length}</p><h4>${esc(a.arc)}</h4><ol>${ch.map(m=>{ const isD=st.story.done[m.id], isN=m===next; const req=(m.req&&m.req.ratings||[]).filter(r=>!st.ratings[r]).map(r=>RATINGS[r]?RATINGS[r].n:r).join(', '); return `<li class="${isD?'d':isN?'n':''}">${isD?'✓':isN?'▶':'·'} ${esc(m.title)}${!isD&&req?` <small>${esc(req)}</small>`:''}</li>`; }).join('')}</ol></div>`; }).join('');
  const epi = c.ending ? epilogue(st) : [];
  const earned=fin(st).ledger.filter(x=>x.a>0).reduce((s,x)=>s+x.a,0); const best=(st.log||[]).filter(x=>x.fpm).reduce((b,x)=>Math.min(b,x.fpm),9999);
  const stats=`<section class="panel sh-stats"><div><span>Chapters</span><b>${done.length}<small>/${MC.length}</small></b></div><div><span>Flights</span><b>${st.flights||0}</b></div><div><span>Hours</span><b>${Math.round((st.minutes||0)/6)/10}</b></div><div><span>Earned</span><b>${money(earned)}</b></div><div><span>Best landing</span><b>${best<9999?best+'<small> fpm</small>':'—'}</b></div>${c.on?`<div><span>Laundered</span><b>${money(c.laundered||0)}</b></div>`:''}</section>`;
  const operation = !c.on ? '' : `<div class="sh-grid">${fleetCrewHTML(st)||''}<section class="panel"><h3>Rank rewards <span class="small muted">Power ${c.power}</span></h3><ul class="perks">${RANK_PERKS.map(([v,n,p])=>`<li class="${c.power>=v?'on':''}"><b>${n}</b> <span class="mono small">${v}+</span><p>${esc(p)}</p></li>`).join('')}</ul></section></div>`;
  const side = STORY.filter(m=>m.arc==='Starling'); const sNext=side.find(m=>!st.story.done[m.id]);
  return `<main class="wrap story-home fade">${ngHTML(st)||''}${fedsHTML(st)||''}
    ${campaignCard(st)}
    ${epi.length?`<section class="panel"><h3>What became of everyone</h3><ul class="tight">${epi.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
    ${stats}<div class="sh-grid">
      <section class="panel"><h3>The story so far</h3><ol class="sh-time">${time}</ol></section>
      <section class="panel"><h3>The people</h3><div class="sh-people">${people||'<p class="small muted">You\'ll meet them soon.</p>'}</div></section>
    </div>
    ${operation}${operationHTML(st)||''}<section class="panel"><h3>The five acts</h3><div class="sh-acts">${acts}</div></section>
    ${sNext?`<section class="panel sh-side"><p class="label">Side story · legit work</p><h3>Starling</h3><p class="small muted">${esc(sNext.title)}: a clean charter job flying private jets. Doesn't affect the main story.</p><div class="row" style="margin-top:8px">${chapterAction(st,sNext,availSet,true).replace(' &amp; start · $0',' &amp; start (free)')}</div></section>`:''}
  </main>`;
}

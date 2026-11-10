/* ===================== JOBS PAGE =====================
   boardView() is the Jobs page: where you are, the next story chapter, anything that needs your
   attention, then the job list. A job is shown as a row (jobRow) that opens into a card (stripHTML). */

/* Can this job be accepted right now? */
function canAcceptJob(st, job){ return !st.active && !(dutyAfter(st, job) > DUTY_MAX); }

/* A job as a card: route, pay, aircraft, weather and the Accept button.
   opts.btn replaces the button, opts.extra adds HTML under the tags, opts.locked greys the card out. */
function stripHTML(st, job, opts={}){
  const extra = opts.extra||'';
  const a=AC[job.ac]; const p=plan(job); const kd=jobKind(job);
  const load = job.pax ? `${job.pax} pax${job.cargo?` · ${job.cargo} lb`:''}` : job.cargo ? `${job.cargo} lb cargo` : 'Ferry, empty';
  const payTxt = job.kind==='check' ? 'Checkride' : job.company ? money(Math.round(job.pay*2.6 - a.op*job.est/60)) : money(job.pay);
  const payLbl = job.kind==='check' ? '' : job.company ? 'est. profit' : 'pay';
  const btn = opts.btn!==undefined ? opts.btn : (st.active ? `<button class="btn sm" disabled>Flight booked</button>` : !canAcceptJob(st, job) ? `<span class="chip warn">Over duty limit</span>` : `<button class="btn primary jc-go" data-act="accept" data-id="${job.id}">Accept ${ICO_PLANE}</button>`);
  const from = AP[job.from], to = job.mystery ? null : AP[job.to];
  const toCode = job.mystery ? '????' : job.local ? job.from : job.to;
  const toName = job.mystery ? 'Sealed destination' : job.local ? 'Local flight' : to.isl.replace(/\s*\(.*\)/,'');
  const dist = job.mystery ? '' : job.local ? `${p.dist} nm loop` : `${p.dist} nm`;
  const w = job.wx;
  const wxHTML = job.mystery
    ? `<span class="jc-wx"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"/></svg>${job.celeb?'Rumor: someone famous':job.aiGen?'A very odd booking':'Sealed until you accept'}</span>`
    : `<span class="jc-wx" title="${esc(w.n)}"><svg viewBox="0 0 24 24" aria-hidden="true">${WX_ICON[wxIconKey(w)]}</svg><span>${esc((x=>x.charAt(0).toUpperCase()+x.slice(1))(w.n.replace(/^(Classic|Passing) /,'')))}</span><span class="mono">${pad3(w.dir)}°/${w.spd}${w.gust?'G'+w.gust:''}</span></span>`;
  const title = job.mystery ? (job.aiGen?esc(job.title):'Confidential charter') : esc(job.title);
  const mark = job.event ? ['data-event="1" ','event '] : job.checkout ? ['data-checkout="1" ','checkout '] : ['',''];
  const ld=S.simState==='live'?loadedAircraft():{};
  const netTags = (job.drop?'<span class="chip warn">Night drop</span>':'') + (job.lowLevel?'<span class="chip warn">Stay under 1,000 ft: +25%</span>':'') + (job.hot?'<span class="chip warn">Hot airport</span>':'');
  return `<article ${mark[0]}class="jcard ${mark[1]}k-${kd.k} ${opts.locked?'locked':''}" style="--k:${kd.c}">${job.network?'<span class="net-tag">Network · +Heat</span>':''}${ld.id && job.ac===ld.id?'<span class="loaded-tag">Loaded in MSFS</span>':''}<div class="jc-art">${islandArt(job.mystery?'????':job.local?job.from+'L':job.to, job.dep, 600, 120, job.ac)}</div>
    <div class="jc-top"><span class="jc-type">${esc(kd.t)}</span><span class="jc-pay"><b>${payTxt}</b>${payLbl?`<small>${payLbl}</small>`:''}</span></div>
    <div class="jc-route">
      <div><b>${esc(job.from)}</b><span>${esc(from.isl.replace(/\s*\(.*\)/,''))}</span></div>
      <div class="jc-line" aria-hidden="true"><i></i>${ICO_PLANE}<i></i></div>
      <div class="r"><b>${esc(toCode)}</b><span>${esc(toName)}</span></div>
    </div>
    <h3 class="jc-title">${title}</h3>
    <p class="jc-meta">${esc(a.n.replace(/^(Cessna|Beechcraft|Diamond|CubCrafters|Zlin|ICON|de Havilland Canada|Grumman|Pilatus|Daher|Douglas|Cirrus|Airbus|Boeing|Heart Aerospace)\s/,''))} · ${load}${dist?` · ${dist}`:''} · ~${durTxt(p.est)} · <span class="mono">${job.dep<=st.clock?'Ready now':`STD ${hhmm(job.dep)}`}</span></p>
    <div class="chips">${netTags}${chipsFor(st,job)}</div>${extra}
    <div class="jc-foot">${wxHTML}${btn}</div>
  </article>`;
}

/* A job as one row of the list. Click it to open the full card underneath. */
function jobRow(st, j){
  const open=S.openJob===j.id;
  const to=j.local?j.from:j.to; const est=j.est||(()=>{ try{ return plan(j).est; }catch(_){ return 0; } })(); const kind=j.network?'net':j.special||j.vip?'vip':'legit'; const lbl=j.label||(j.network?'Network run':'Job');
  const tag=j.drop?'Night drop':j.lowLevel?'Low level':j.hot?'Hot':j.bonus?'Bonus':'';
  const accept = canAcceptJob(st, j) ? `<button class="btn primary jc-go" data-act="accept" data-id="${j.id}">${j.network?'Take the run':'Accept'} ${ICO_PLANE}</button>` : '';
  return `<div class="jrow k-${kind} ${open?'open':''}"><button class="jr-main" data-act="job-open" data-id="${j.id}" aria-expanded="${open}">
      <span class="jr-k">${esc(lbl)}</span><span class="jr-rt"><b>${esc(j.from)}</b> → <b>${esc(to==='????'?'????':to)}</b></span><span class="jr-t" title="${esc(j.title)}">${esc(j.title)}${tag?` <em>${tag}</em>`:''}</span>
      <span class="jr-m" title="${esc((AC[j.ac]||{}).n||'')}">${esc(AC[j.ac]?AC[j.ac].n:j.ac)} · ${est?durTxt(est):''} · ${j.dep<=st.clock?'now':hhmm(j.dep)}</span><span class="jr-p">${money(j.pay)}${j.network?'<small class="dirty">dirty · Heat +5</small>':''}</span></button>
    <span class="jr-go">${accept}</span>${open?`<div class="jr-card"><button class="btn sm ghost" data-act="job-map" data-id="${j.id}" style="margin:0 0 10px">Show route on the map</button>${stripHTML(st, j)}</div>`:''}</div>`;
}

/* "Checkride ready": the licences the story needs first, the optional ones folded into "+N optional". */
function checkrideReadyNote(st){
  const all=RATING_ORDER.filter(r=>r!=='CO' && !st.ratings[r] && checkrideReady(st,r).ok).map(r=>esc(RATINGS[r].n)); if(!all.length) return '';
  const storyNeeds=['Jet Type Rating','Airline Transport Pilot','Private Pilot']; const main=all.filter(n=>storyNeeds.some(k=>n.startsWith(k))); const rest=all.filter(n=>!main.includes(n)); const shown=main.length?main:all.slice(0,1); const more=all.length-shown.length;
  return `<div class="b2-note"><b>Checkride ready:</b> ${shown.join(', ')}${more?` <span class="small muted" title="${rest.join(', ')}">+${more} optional</span>`:''} <button class="btn sm" data-act="nav" data-v="pilot">Book checkride</button></div>`;
}

function boardView(){
  const st=S.st; ensureJobs(st); const here=AP[st.loc]; const c=crime(st); const live=S.simState==='live'; const L=live?loadedAircraft():{};
  const MC=mainChapters(); const next=MC.find(m=>!st.story.done[m.id]); const availSet=new Set(storyAvailable(st).map(m=>m.id));
  let w=null; try{ w=genLocWx(st); }catch(_){}
  /* where you are, and the button that starts a new day (its price is rent plus fleet and crew) */
  const H=(()=>{ try{ return HOUSING[fin(st).housing]||HOUSING.bunk; }catch(_){ return {rent:0}; } })();
  const ops=dailyCosts(st).reduce((s,x)=>s+x[1],0);
  const status=`<div class="b2-status">
    <span class="b2-here"><b>${esc(st.loc)}</b> ${esc(here.isl||here.n)}</span>
    <span>${hhmm(st.clock)} local</span>${w&&w.dir!=null?`<span>Wind ${pad3(w.dir)}°/${w.spd} kt</span>`:''}
    <span class="b2-dot ${live?'ok':''}">${live?'MSFS connected':'MSFS not connected'}</span>${L.id?`<span>Loaded: ${esc(AC[L.id].n)}</span>`:''}
    <span class="b2-sp"></span><button class="btn sm" data-act="rest" title="Rent ${money(H.rent||0)}${ops?` + fleet and crew ${money(ops)}`:''}" ${st.active?'disabled':''}>New day · ${money((H.rent||0)+ops)}</button></div>`;
  /* the next story chapter */
  let strip=''; if(next){ const n=MC.indexOf(next)+1; const act=CRIME_ACTS.find(a=>a.arc===next.arc)||CRIME_ACTS[0]; const pa=playAction(st,next,availSet,n);
    strip=`<section class="b2-story" style="--arc:${act.col}"><div><p class="sc-k">Main story · Chapter ${n} of ${MC.length}</p><b>${esc(next.title)}</b><span class="small muted"> ${esc(next.hook||'')}</span></div><div class="b2-story-go">${pa.btn.replace('btn action big','btn action')}<button class="btn ghost sm" data-act="nav" data-v="story">Story</button></div></section>`; }
  /* things that need your attention */
  const booked = st.active?`<div class="b2-note"><b>Flight booked:</b> ${esc(st.active.job.title)} (${esc(st.active.job.from)} → ${esc(st.active.job.local?st.active.job.from:st.active.job.to)}) <button class="btn sm action" data-act="nav" data-v="flight">Open flight</button></div>`:'';
  const dirty = !c.dirty ? '' : S.view!=='board' ? launderHTML(st) : `<div class="b2-note launder-mini"><b>Dirty cash ${money(c.dirty||0)}</b><span class="small muted">Launder it before you can spend it.</span><button class="btn sm" data-act="nav" data-v="money">Launder</button></div>`;
  /* the job list */
  const tab=S.jobTab||'all'; let jobs=(st.jobs||[]).slice(); try{ jobs=filterJobs(jobs); }catch(_){}
  const count=k=>(st.jobs||[]).filter(j=>k==='all'||jobTabOf(j)===k).length;
  if(tab!=='all') jobs=jobs.filter(j=>jobTabOf(j)===tab);
  const sort=S.jobSort||'pay'; if(sort==='pay') jobs.sort((a,b)=>b.pay-a.pay); else if(sort==='short') jobs.sort((a,b)=>(a.est||plan(a).est)-(b.est||plan(b).est)); else jobs.sort((a,b)=>a.dep-b.dep);
  const lim=S.allJobs?999:6; const shown=jobs.slice(0,lim);
  const tabs=[['all','All'],['network','Network runs'],['legit','Legit'],['special','Charters']].filter(([k])=>k==='all'||count(k)).map(([k,n])=>`<button class="${tab===k?'on':''}" data-act="job-tab" data-v="${k}">${n} <small>${count(k)}</small></button>`).join('');
  const rows=shown.filter(j=>canAcceptJob(st,j));
  /* rows you can accept; with a flight already booked, the jobs are shown as cards to browse */
  const list = rows.length ? `<div class="jlist"><div class="jl-head"><span>Type</span><span>Route</span><span>Job</span><span>Aircraft · time · departs</span><span>Pay</span><span></span></div>${rows.map(j=>jobRow(st,j)).join('')}</div>`
    : `<div class="jgrid b2-grid">${shown.length ? shown.map(j=>stripHTML(st,j)).join('') : `<div class="empty"><h3>No jobs here right now</h3><p>Start a new day for fresh work, or travel to a busier airport.</p><div class="row" style="gap:8px;justify-content:center;margin-top:10px"><button class="btn sm" data-act="rest">New day</button><button class="btn sm" data-act="cmd">Find an airport</button></div></div>`}</div>`;
  /* travel as a passenger */
  const regions=allowedRegions(st); const dests=Object.keys(AP).filter(k=>k!==st.loc && !AP[k].water && regions.includes(AP[k].r)).sort((a,b)=>AP[a].isl.localeCompare(AP[b].isl)); const tv=S.travelTo&&dests.includes(S.travelTo)?S.travelTo:dests[0]; const dh=tv?deadheadCost(st,tv):null;
  const testing=testSession();
  return `<main class="wrap board2 fade">
    ${status}${strip}${booked}${checkrideReadyNote(st)}
    ${dirty}${fedsHTML(st)}<div class="b2-head"><h2>Jobs at ${esc(st.loc)}</h2><div class="b2-tabs">${tabs}</div>
      <select data-act="job-sort" aria-label="Sort jobs"><option value="pay" ${sort==='pay'?'selected':''}>Best pay</option><option value="short" ${sort==='short'?'selected':''}>Shortest</option><option value="soon" ${sort==='soon'?'selected':''}>Soonest</option></select></div>
    ${c.on?`<p class="small muted b2-hint">Network runs pay more and raise your Heat. Legit jobs cool it down.</p>`:''}
    ${list}
    ${jobs.length>lim?`<button class="btn ghost calm-showmore" data-act="all-jobs">Show all ${jobs.length} jobs</button>`:''}
    <div class="b2-foot">
      <details class="panel b2-more"><summary>Travel as a passenger</summary><div class="stack" style="margin-top:10px"><label class="field"><span class="sr">Destination</span><select id="travel-to">${dests.map(k=>`<option value="${k}" ${k===tv?'selected':''}>${esc(AP[k].isl)} · ${k}</option>`).join('')}</select></label>${dh?`<p class="small mono">${dh.d} nm · ${dh.cost?money(dh.cost):'free'} · ~${durTxt(dh.min)}</p>`:''}<button class="btn" data-act="deadhead" data-to="${tv||''}" ${st.active||!dh||st.cash<dh.cost?'disabled':''}>Book the seat</button></div></details>
      <details class="panel b2-more"><summary>Practice and testing</summary><div class="stack" style="margin-top:10px"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="btn sm ${testing?'action':''}" data-act="test-session">${testing?'End test session · restore my real career':'Start a test session'}</button><span class="tiny muted">${testing?'Anything you do now is thrown away when you end the session.':'Backs up your career first, so you can skip and experiment freely.'}</span></div><button class="btn sm" data-act="practice" ${st.active?'disabled':''}>Practice landing (no pay, just a grade)</button><label class="row"><input type="checkbox" data-act="calm-test" ${testMode()?'checked':''}> Calm test mode <span class="tiny muted">(no sealed orders or urgent jobs)</span></label></div></details>
    </div></main>`;
}

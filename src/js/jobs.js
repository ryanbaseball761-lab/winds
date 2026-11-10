/* ===================== JOBS =====================
   Building the job board, the story and checkride flights, and the small helpers around them.
     genJobs(st)      -> a fresh list of jobs for where you are today
     ensureJobs(st)   -> makes sure st.jobs is current (new airport or new day = new list)
     storyJob / checkrideJob -> the flight for a story chapter or a licence test
   genJobs is a list of named steps that run in order. Add a step; don't wrap. */

/* ---------- the job board ---------- */

const GEN_JOB_STEPS = [
  /* six ordinary jobs, plus three for your own company if you have one */
  function basicJobs(st){
    const jobs=[]; const arcs = ARCH.filter(a=>archOk(st,a)).map(a=>({...a,w:archWeight(st,a)})).filter(a=>a.w>0);
    let tries=0;
    while(jobs.length<6 && tries<80){ tries++; const arch=wpickArr(arcs); const j=makeJob(st, arch, false); if(j && !jobs.some(x=>x.to===j.to && x.arch===j.arch)) jobs.push(j); }
    if(st.company && fleetTypes(st).length){ let t=0, n=0; while(n<3 && t<40){ t++; const arch=wpickArr(arcs); const j=makeJob(st, arch, true); if(j){ jobs.push(j); n++; } } }
    return decorateJobs(st, jobs).sort((x,y)=>x.dep-y.dep);
  },
  /* difficulty: Expert adds a few in-flight emergencies, Casual removes half */
  function difficultyEmergencies(st, L){ const d=diff();
    for(const j of L){ if(d==='expert' && !j.scen && Math.random()<0.08){ const sc=scenFor(j); if(sc) j.scen=sc; } if(d==='casual' && j.scen && Math.random()<0.5) j.scen=null; } },
  /* a weekend event on another island: jobs going there pay more, and there are always two */
  function weekendEventJobs(st, L){ const ev=weekendEvent(st); if(!ev || st.loc===ev.ap) return;
    for(const j of L){ if(j.to===ev.ap && !j.local){ j.pay=Math.round(j.pay*1.35/10)*10; j.event=ev.n; } }
    let tries=0; while(L.filter(j=>j.to===ev.ap).length<2 && tries<25){ tries++; const arch=pick(ARCH.filter(a=>archOk(st,a) && !a.local && !a.airline)); const j=makeJob(st, arch, false); if(j && apOk(st, ev.ap, j.ac) && distNm(AP[st.loc],AP[ev.ap]) < AC[j.ac].range*0.8){ j.to=ev.ap; const p=plan(j); if(p.over>0||!p.range) continue; j.pay=Math.round(payFor(st,j)*1.35/10)*10; j.est=p.est; j.event=ev.n; j.title=`${ev.n}: ${j.title.replace(/ to .*$/,'')} to ${AP[ev.ap].isl}`; L.push(j); } } },
  /* with a jet rating: up to two long flights to the mainland */
  function mainlandJobs(st, L){ if(!hasRating(st,'JET') || MAINLAND.includes(st.loc) || AP[st.loc].water) return; const arch=ARCH.find(a=>a.id==='mainland');
    let n=0; for(let t=0;t<14 && n<2;t++){ const j=makeJob(st, Object.assign({}, arch, {w:1}), false); if(!j) continue; const opts=MAINLAND.filter(k=>apOk(st,k,j.ac) && distNm(AP[st.loc],AP[k]) < AC[j.ac].range*0.8 && distNm(AP[st.loc],AP[k])>300); if(!opts.length) continue;
      j.to=pick(opts); const p=plan(j); if(p.over>0||!p.range) continue; const s=arch.story({from:AP[st.loc],to:AP[j.to],ac:AC[j.ac]}); j.title=s.title; j.client=s.client; j.paras=s.paras; j.pay=payFor(st,j); j.est=p.est; j.mainland=true; L.push(j); n++; } },
  /* no more than two jobs for the same aircraft, where another type fits */
  function spreadAircraft(st, L){
    const used={}; for(const j of L) used[j.ac]=(used[j.ac]||0)+1;
    for(const j of L){ if(j.kind!=='gen' || j.company || used[j.ac]<=2) continue; const arch=ARCH.find(a=>a.id===j.arch); if(!arch) continue;
      const cands=eligibleAircraft(st).filter(k=>k!==j.ac && arch.cls.includes(AC[k].cls) && (used[k]||0)<2).sort((a,b)=>((used[a]||0)-(used[b]||0)) || ((st.types[a]||0)-(st.types[b]||0)));
      for(const k of cands){ const from=j.ac; if(refitJob(st,j,k)){ used[from]--; used[k]=(used[k]||0)+1; break; } } } },
  /* type checkouts with Mari for aircraft you own in MSFS but aren't licensed for yet */
  function checkoutJobs(st, L){ if(st.company) return;
    const pool=Object.keys(AC).filter(k=>st.hangar[k] && !canFly(st,k) && CHECKOUT_TXT[AC[k].cls] && !AC[k].custom && !['jet','regional','airliner','widebody'].includes(AC[k].cls) && AC[k].req.filter(r=>!st.ratings[r]).length<=2);
    let n=0; for(let t=0;t<10 && n<2 && pool.length;t++){ const acId=pick(pool); if(L.some(j=>j.ac===acId)) continue; const a=AC[acId];
      const to=pickDest(st, st.loc, acId, {id:'checkout'}, Math.max(25, 40*a.cruise/60)); if(!to) continue;
      const dep=Math.round((st.clock+ri(30,150))/5)*5; const job={ id:uid(), kind:'gen', arch:'checkout', label:'Type checkout', cat:'pax', from:st.loc, to, local:false, tourNm:0, ac:acId, pax:1, cargo:20, dep, wx:genWx(st,to,null,dep), checkout:true, company:false };
      const p=plan(job); if(p.over>0 || !p.range) continue;
      job.title=`Checkout: ${a.n}`; job.client=CAST.mari.n; job.paras=[`Mari wants you checked out in Coral Wing's ${a.n} before the busy season. Your license doesn't cover it on your own yet, so she'll ride in the right seat as your instructor. Fly it to ${AP[to].isl} and back to her standards, and she'll sign your logbook.`, CHECKOUT_TXT[a.cls]];
      job.pay=Math.round(payFor(st,job)*0.45/10)*10; job.est=p.est; L.push(job); n++; pool.splice(pool.indexOf(acId),1); } },
  /* cabin requests were removed from the game. These two random draws are kept so the same save still
     produces the same job list; remove them together with the next change to job generation. */
  function retiredCabinRequests(st, L){ for(const j of L){ if(j.kind==='gen' && !j.checkout && !j.scen && Math.random()<0.35){ pick(ASKS.filter(x=>x.when(j))); } } },
  /* a calm test session has no emergencies */
  function calmTestSession(st, L){ if(st.ui && st.ui.calmTest) L.forEach(j=>{ j.scen=null; }); },
  /* with a commercial licence: sometimes a one-off special charter from this airport */
  function specialCharter(st, L){ if(!hasRating(st,'COMM')) return; st.specialDone=st.specialDone||{};
    const opts=SPECIALS.filter(m=>m.from===st.loc && !st.specialDone[m.id] && !st.story.done[m.id] && ratingsOk(st,(m.req||{}).ratings||[]) && m.ac.some(k=>canFly(st,k) && apOk(st,m.to,k)));
    if(opts.length && Math.random()<0.6){ const m=pick(opts); const acId=m.ac.find(k=>canFly(st,k) && apOk(st,m.to,k)); const j=storyJob(st,m,acId);
      Object.assign(j,{kind:'gen', arch:'special', story:undefined, special:m.id, label:'Special charter', id:'X-'+m.id+'-'+st.day}); j.pay=Math.round(payFor(st,j)*1.4/10)*10; L.unshift(j); } },
  /* no emergencies on very short flights or in your first three flights; no cabin requests at all */
  function gentleStart(st, L){ L.forEach(j=>{ if(j.scen && ((j.est||plan(j).est) < 20 || st.flights < 3)) j.scen=null; }); if(st.flights<3) L.forEach(j=>{ j.scen=null; }); L.forEach(j=>{ delete j.ask; }); },
  /* once you work for Castillo: one to three cargo jobs become network runs (more pay, more Heat) */
  function networkRuns(st, L){ const c=crime(st); if(!c.on) return; const n=1+(c.power>=45?1:0)+(c.power>=70?1:0); let k=0;
    L.forEach(j=>{ if(k<n && j.kind==='gen' && j.cargo>0 && !j.special && !j.story){ k++; j.network=true; j.label='Network run'; j.title=`${pick(NET_TITLES)} for the network`; j.client='The network'; j.pay=Math.round(j.pay*(2.4+c.power/100)/10)*10; j.scen=null; } }); },
  /* network runs: rank pay, night drops at closed strips, low-level runs, hot airports */
  function networkVariety(st, L){ const c=crime(st); if(!c.on) return; c.hot=c.hot||{};
    L.forEach(j=>{ if(!j.network) return; j.pay=Math.round(j.pay*rankMul(c)/10)*10;
      if(Math.random()<0.4){ const strips=DROP_STRIPS.filter(k=>AP[k] && k!==st.loc && apOk(st,k,j.ac) && distNm(AP[st.loc],AP[k])<Math.min(400,(AC[j.ac].range||500)*0.6)); if(strips.length){ const k=pick(strips); j.to=k; j.drop=true; j.dep=Math.max(j.dep, 1260); j.title=`Night drop at ${AP[k].isl}`; j.pay=Math.round(j.pay*1.3*(c.power>=28?1.15:1)/10)*10; j.paras=[`The strip at ${AP[k].n} closes at sunset. Tonight it's open for you: two trucks, headlights on, engines running. Land, unload, leave.`]; try{ j.est=plan(j).est; }catch(_){} } }
      if(Math.random()<0.35){ j.lowLevel=true; }   // the "Low level" tag on the row says it; the title stays clean
      if(c.hot[j.to]){ j.hot=true; j.pay=Math.round(j.pay*1.2/10)*10; } }); },
  /* crew, the private strip and New Game+ raise network pay */
  function networkPayPerks(st, L){
    L.forEach(j=>{ if(!j.network) return; let m=1; if(crewHas(st,'tico')) m+=0.05; if(crewHas(st,'fo') && ['airliner','widebody','regional'].includes(AC[j.ac].cls)) m+=0.1; j.pay=Math.round(j.pay*m/10)*10; });
  },
  function privateStripPay(st, L){ if(crime(st).safe==='strip') L.forEach(j=>{ if(j.network) j.pay=Math.round(j.pay*1.2/10)*10; }); },
  /* at Heat 80+ there are no network runs; airports that banned you are off the list for 3 days */
  function fedsAndBans(st, L){ const c=crime(st); let R=L; if(fedsWatching(st)) R=R.filter(j=>!j.network); const now=st.day; c.ban=c.ban||{}; return R.filter(j=>!(c.ban[j.to] && now-c.ban[j.to]<3)); },
  function newGamePlusPay(st, L){ if(crime(st).ng) L.forEach(j=>{ if(j.network) j.pay=Math.round(j.pay*1.5/10)*10; }); },
];
function genJobs(st){
  let L=null;
  for(const step of GEN_JOB_STEPS){ try{ const r=step(st, L); if(r) L=r; }catch(e){ if(!L) throw e; } }
  return L;
}

function ensureJobs(st){
  const keyBefore = st.jobsKey;
  const key = st.loc+'|'+st.day; if(st.jobsKey!==key){ st.jobs = genJobs(st); st.jobsKey=key; }
  const fresh = st.jobsKey!==keyBefore;
  /* usually one Starling charter on a fresh board */
  if(fresh || !st._starlingChecked){ st._starlingChecked = true;
    if(!st.jobs.some(j=>j.arch==='starling') && Math.random()<0.8){ const j = starlingTrip(st); if(j) st.jobs.unshift(j); } }
  /* the aircraft you have loaded in MSFS always has a few jobs, listed first */
  const L = loadedAircraft();
  if(L.id && canFly(st, L.id) && !st.active){
    const have = st.jobs.filter(j=>j.ac===L.id).length;
    if(have < 2 && st._loadedFor !== st.jobsKey+'|'+L.id){ st._loadedFor = st.jobsKey+'|'+L.id;
      for(let i=0;i<3-have;i++){ const j=makeJobFor(st, L.id); if(j) st.jobs.push(j); } }
    st.jobs.forEach(j=>{ j.loaded = j.ac===L.id; });
    st.jobs.sort((a,b)=>(b.loaded?1:0)-(a.loaded?1:0));
  }
  /* real Caribbean events happening this week add 20% */
  if(fresh || !st._rwChecked){ st._rwChecked=true; const evs=realEvents(); for(const j of st.jobs){ const e=evs.find(e=>e.ap.includes(j.to)); if(e && !j.realEvent){ j.realEvent=e.n; j.pay=Math.round(j.pay*1.2/10)*10; } } }
}

/* The job list after your filters and sort; jobs for the aircraft loaded in MSFS come first. */
function filterJobs(list){ const p=boardPrefs(); let L=list.slice();
  if(p.kind && p.kind!=='all') L=L.filter(j=> p.kind==='vip' ? j.vip : p.kind==='urgent' ? j.urgent : p.kind==='local' ? j.local : (j.cat||'')===p.kind);
  if(p.ac && p.ac!=='all') L=L.filter(j=>j.ac===p.ac);
  const by=p.sort||'dep'; const key={dep:j=>j.dep, pay:j=>-j.pay, rate:j=>-jobPerHour(j), short:j=>j.local?(j.tourNm||40):distNm(AP[j.from],AP[j.to]), long:j=>-(j.local?(j.tourNm||40):distNm(AP[j.from],AP[j.to]))}[by]||(j=>j.dep);
  L=L.sort((a,b)=>key(a)-key(b));
  if(p.quick==='short') L=L.filter(j=>(j.est||plan(j).est)<=30);
  const ld=S.simState==='live'?loadedAircraft():{}; if(!ld.id) return L;
  return L.filter(j=>j.ac===ld.id).concat(L.filter(j=>j.ac!==ld.id)); }

/* The little tags on a job. */
function chipsFor(st, job){
  const c=[];
  if(job.loaded) c.push(`<span class="chip sky">✈ Loaded in MSFS</span>`);
  if(job.mystery && !(st.active && st.active.job===job)){ c.push(`<span class="chip vio">Confidential</span>`); if(job.followup) c.push(`<span class="chip sea">Follow-up</span>`); if(job.request) c.push(`<span class="chip vio">Passenger request</span>`); if(!st.types[job.ac]) c.push(`<span class="chip new">New type</span>`); }
  else {
    if(job.followup) c.push(`<span class="chip sea">Follow-up</span>`);
    if(job.request) c.push(`<span class="chip vio">Passenger request</span>`);
    if(job.kind==='story') c.push(`<span class="chip sea">Story</span>`);
    if(job.lend) c.push(`<span class="chip vio">Owner's jet</span>`);
    if(job.company) c.push(`<span class="chip sky">Your company</span>`);
    if(job.vip) c.push(`<span class="chip warn">VIP</span>`);
    if(job.urgent) c.push(`<span class="chip bad">Urgent</span>`);
    if(job.wx.ifr) c.push(`<span class="chip vio">IFR</span>`);
    if(isNight(job.dep)) c.push(`<span class="chip">Night</span>`);
    if(!st.types[job.ac]) c.push(`<span class="chip new">New type</span>`);
    if(!job.local && !st.visited[job.to] && !AP[job.to].water) c.push(`<span class="chip new">New airport</span>`);
    if(AP[job.to].water) c.push(`<span class="chip sky">Water landing</span>`);
    if(!job.local && ZONE(AP[job.from].c)!==ZONE(AP[job.to].c)) c.push(`<span class="chip">Customs</span>`);
    if(job.scen) c.push(`<span class="chip bad">Sealed orders</span>`);
    if(job.bonus) c.push(`<span class="chip good">Bonus +${money(job.bonus.amt)}</span>`);
    if(job.festival) c.push(`<span class="chip vio">${esc(job.festival)}</span>`);
    if(job.stormName) c.push(`<span class="chip bad">Hurricane ${esc(job.stormName)}</span>`);
  }
  if(job.realEvent) c.push(`<span class="chip warn" title="Happening around this time in the real Caribbean">🌍 ${esc(job.realEvent)} +20%</span>`);
  const A=st.airframes&&st.airframes[job.ac]; if(A && A.h<70) c.push(`<span class="chip ${A.h<50?'bad':'warn'}" title="Airframe health">🔧 ${A.h}%</span>`);
  return c.join('');
}

/* An urgent job that pops up in real time: accept within 5 minutes, wheels up within 15. */
function spawnUrgent(force){
  const st=S.st;
  if(!force && st && ((st.ui&&st.ui.quiet) || st.flights<3)) return null;
  if(!st || st.active || st.urgent || (!force && !urgentOn())) return null;
  const opts = URG_REASONS.filter(r=>{ const a=ARCH.find(x=>x.id===r.arch); return a && (!a.need || hasRating(st,a.need)); });
  for(let i=0;i<10;i++){ const r=pick(opts); const arch=ARCH.find(x=>x.id===r.arch); const job=makeJob(st, arch, false); if(!job || job.local) continue;
    const isl=AP[job.to].isl.replace(/\s*\(.*\)/,'');
    job.pay = Math.round(job.pay*2/10)*10; job.urgent=true; job.realtime=true; job.title=r.t.replace('{to}',isl); job.label='Urgent dispatch'; job.paras=[r.d.replace(/\{to\}/g,isl), ...(job.paras||[]).slice(0,1)];
    st.urgent = {job, expires: Date.now()+URG_ACCEPT_MIN*60000}; save(); notifyUrgent(job); render();
    try{ takeover({kind:'urgent', kicker:'Urgent flight · 2× pay', title:job.title, text:`${AP[job.from].isl} to ${AP[job.to].isl}. Accept within 5 minutes; wheels up within 15.`, btn:'Show me', ms:7000}); }catch(_){}
    return job; }
  return null;
}

/* ---------- story and checkride flights ---------- */

/* Which of a chapter's aircraft you can fly it in right now (the one loaded in MSFS first). */
function storyAircraft(st, m){
  const list = m.ac.filter(k=>(m.lend ? !!st.hangar[k] : canFly(st,k)) && apOk(st,m.to,k) && apOk(st,m.from,k)).filter(k=>!isGrounded(st,k));
  const L=S.simState==='live'?loadedAircraft():{}; return (L.id && list.includes(L.id)) ? [L.id, ...list.filter(x=>x!==L.id)] : list; }

/* The flight for a story chapter. Earlier choices can change the chapter (dynM). */
function storyJob(st, chapter, acId){
  const m = dynM(st, chapter);
  const wx = genWx(st, m.to, m.wx, m.dep);
  const job = { id:'S-'+m.id, kind:'story', story:m.id, title:m.title, label:m.arc, cat: m.cargo>m.pax*190?'cargo':'pax', from:m.from, to:m.to, local:!!m.local, tourNm:m.local?45:0,
    ac:acId, pax:m.pax, cargo:m.cargo, cargoLabel:m.cargoLabel, dep:m.dep, wx, scen:m.scen||null, paras:m.brief, teachStory:m.teach, chars:m.chars, airline:!!m.airline, client:CAST[m.chars[0]]?.n||'' };
  job.pay = payFor(st, job); job.est = plan(job).est;
  if(m.lend){ job.lend = true; job.pay = m.fee || job.pay; job.tail = acId==='CJ4'?'N52VL':STARLING_TAIL; }
  const ch = arcChapters(chapter.arc); job.label = `${chapter.arc} · Ch ${ch.indexOf(chapter)+1}/${ch.length}`;
  return job;
}

function basicCheckride(st, rid, acId){
  const R=RATINGS[rid]; let to = st.loc, local=true;
  if(R.dest){ to=R.dest; local=false; }
  if(R.water){ let best=null,bd=1e9; for(const k in AP){ if(!AP[k].water) continue; const d=distNm(AP[st.loc],AP[k]); if(d<bd){bd=d;best=k;} } if(best && bd < AC[acId].range*0.6){ to=best; local=false; } }
  if(R.hub){ let best=null,bd=1e9; for(const k in AP){ if(k===st.loc||AP[k].water||longestRwy(AP[k])<7000) continue; const d=distNm(AP[st.loc],AP[k]); if(d>80&&d<bd){bd=d;best=k;} } if(best){ to=best; local=false; } }
  const dep = Math.round((st.clock + 45)/5)*5;
  const wx = genWx(st, to, R.wx || (rid==='IR'?'wave':'trades'), dep);
  const ex = CAST[R.examiner||'wilkins'];
  const job = { id:'C-'+rid, kind:'check', rating:rid, title:`${R.n} checkride`, label:`Checkride`, cat:'check', from:st.loc, to, local, tourNm: local?35:0, ac:acId,
    pax:1, cargo:0, dep, wx, scen:R.scen||null, tasks:R.tasks, client:ex.n, chars:[R.examiner||'wilkins'],
    paras:[`${ex.n} meets you at the aircraft with a clipboard. ${ex.bio}`, `"Fly it like I'm not here," she says. ${R.n} unlocks: ${R.unlocks}`] };
  if(R.examiner==='devries') job.paras = [`Inspector Henk de Vries arrives with a thermos of tea and a clipboard. "Saba forgives nothing," he says, "so neither do I. But I am very fair."`, `He'll ride in the right seat for the whole flight. Pass, and you can land at the shortest commercial runway in the world. ${R.unlocks}`];
  if(R.examiner==='marchetti') job.paras = [`Capitaine Hélène Marchetti flew Twin Otters into St. Barth for twenty years. She looks at your airplane, then at you, and says only, "We go."`, `Pass, and you're cleared for one of the most famous approaches anywhere. ${R.unlocks}`];
  job.pay = 0; job.est = plan(job).est; return job;
}
/* The flight for a licence test. */
function checkrideJob(st, rid, acId){
  /* Seaplane: a short hop from Juliana to Simpson Bay Lagoon (you're flown to Juliana for free) */
  if(rid==='SEA'){
    const moved = st.loc!=='TNCM'; if(moved) st.loc='TNCM';
    const j=basicCheckride(st, rid, acId); Object.assign(j, { from:'TNCM', to:'WSBL', local:false, tourNm:0, wx:genWx(st,'WSBL','calm',j.dep) });
    j.paras=[`${CAST[RATINGS.SEA.examiner].n} meets you at the seaplane on the ramp at Princess Juliana${moved?' (Coral Wing flew you over for free)':''}.`, `"Short and simple," she says. "Take off, swing around the lagoon, and put us down in Simpson Bay Lagoon, right over there. Gentle and steady, that's all I'm looking for." Pass, and you hold the Seaplane Rating: ${RATINGS.SEA.unlocks}`];
    j.est=Math.max(10, plan(j).est); return j; }
  const j=basicCheckride(st, rid, acId); if(rid!=='ATP') return j;
  /* Airline Transport Pilot: fly to a nearby airport with an ILS (San Juan if it's in range) */
  const here=AP[st.loc]; const opts=ILS_FIELDS.filter(f=>AP[f[0]] && f[0]!==st.loc).map(f=>({f, d:distNm(here,AP[f[0]])})).filter(x=>x.d>=60 && x.d<=Math.min(400,(AC[acId]?AC[acId].range:900)*0.5)).sort((a,b)=>a.d-b.d);
  const pickF=(opts.find(x=>x.f[0]==='TJSJ')||opts[0]); if(!pickF) return j; const [code,rw,ils,rnav]=pickF.f;
  Object.assign(j, { to:code, local:false, tourNm:0, wx:genWx(st, code, 'trades', j.dep), ilsRwy:rw });
  j.tasks=[`Departure briefing and a clean takeoff from ${st.loc}`, `Autopilot and FMS from the climb to the approach`, `Fly the ${ils} to ${code} (the ${rnav} is your backup) and land in the touchdown zone`];
  j.paras=[`${CAST.wilkins?CAST.wilkins.n:'The examiner'} meets you at the jet bridge with a clipboard.`, `"Today you'll take her to ${AP[code].n} and fly the ${ils}. Load the ${rnav} as the backup. Stabilized by a thousand feet, please." Pass, and you hold the Airline Transport Pilot licence.`];
  j.est=plan(j).est; return j;
}

/* ---------- loading a save ---------- */

/* Brings an older save up to date. Runs every time a save is loaded. */
function migrate(st){
  registerCustomAc(st);
  st.celebs=st.celebs||{}; st.souvenirs=st.souvenirs||{}; st.gifts=st.gifts||{}; st.followups=st.followups||[]; st.ach=st.ach||{}; st.reviews=st.reviews||[]; if(!st.landedAt){ st.landedAt={}; (st.log||[]).forEach(l=>{ if(l.landing!=='crash') st.landedAt[l.to]=(st.landedAt[l.to]||0)+1; }); } if(!st.stats) st.stats={butter:0,smooth:0,firm:0,hard:0,crash:0,nm:0,diverts:0,scen:0}; if(!st.cooldown) st.cooldown={}; if(!st.visited) st.visited={}; Object.keys(AC).forEach(k=>{ if(st.hangar[k]===undefined) st.hangar[k]=true; }); Object.keys(CAST).forEach(k=>{ if(st.rep[k]===undefined) st.rep[k]=10; });
  const r=finMigrate(st);
  if(r && !r._cabFix){ r._cabFix=true; if(r.active && r.active.cab) delete r.active.cab; if(r.active) delete r.active.recId; }
  return r;
}

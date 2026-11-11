/* ===================== RENDER =====================
   render() redraws the whole page from S (what's on screen) and S.st (the career).
   It runs in three parts, always in this order:
     1. before drawing: one-time start-up fixes for old saves, and small state set-up
     2. draw the page (with a crash guard, so a broken screen can never lock you out)
     3. after drawing: finishing touches on the page that was just drawn
   Add a new step to the list it belongs in; don't wrap render(). */

/* ---------- 1. before drawing ---------- */

/* Fixes that run once per app start, on the first draw that has a career loaded, in this order. */
const STARTUP_FIXES = [
  /* a booked ATP checkride that isn't flown yet is moved to the ILS route */
  function moveATPCheckride(st){ try{ const a=st.active; if(a && !a.started && a.job.kind==='check' && a.job.rating==='ATP' && !a.job.ilsRwy){ const paid=a.job.paid; const ac=a.job.ac; st.loc=a.job.from; a.job=checkrideJob(st,'ATP',ac); if(paid) a.job.paid=paid; save(); setTimeout(()=>toast(`Your airline checkride now goes to ${a.job.to}: ILS runway ${a.job.ilsRwy}.`),900); } }catch(_){} },
  /* refund a checkride that was cancelled before refunds existed (the Airline Transport Pilot booking) */
  function refundCancelledATP(st){ try{ if(!st.ckRefund1){ st.ckRefund1=1; const F=fin(st); const a=st.active;
    ['ATP'].forEach(rid=>{ const R=RATINGS[rid]; if(st.ratings[rid] || (a && a.job.kind==='check' && a.job.rating===rid)) return; const paid=F.ledger.find(x=>x.m===`${R.n} checkride` && x.a<0); const refunded=F.ledger.some(x=>/^Refund: /.test(x.m||'') && x.m.includes(R.n));
      if(paid && !refunded){ txn(st, -paid.a, 'Licenses & training', `Refund: ${R.n} checkride (cancelled)`); setTimeout(()=>toast(`Refunded ${money(-paid.a)} for your cancelled ${R.n} checkride.`), 1200); } });
    save(); } }catch(_){} },
  /* with no flight booked, the app opens on the Story page */
  function openOnStory(st){ if(!st.active && (S.view==='board'||!S.view)) S.view='story'; },
  /* an old save: the old main story is cleared once so the crime story starts at chapter 1 */
  function migrateToCrimeStory(st){ try{
    if(st.crimeV===1){ st.crimeV=2; const keep=new Set(['CW1','CR2','CR3','CR4']); for(const id in (st.story.done||{})) if(/^CR\d+$/.test(id) && !keep.has(id)) delete st.story.done[id]; const c0=crime(st); for(const id in c0.choice) if(!keep.has(id)) delete c0.choice[id]; delete c0.ending; if(st.active && !st.active.started && st.active.job.kind==='story' && /^CR\d+$/.test(st.active.job.story) && !keep.has(st.active.job.story)) st.active=null; save(); }
    if(!st.crimeV){ st.crimeV=2;
      ['CW1','CW2','CW3','CW4','BO1','BO2','BO3','BO4','BO5','HW1','HW2','HW3','HW4','HW5','OW1','MR1','TR1','TR2','TR3','TR4','TR5','CO1','CO2','CO3'].forEach(id=>{ if(st.story && st.story.done) delete st.story.done[id]; });
      if(st.active && !st.active.started && st.active.job.kind==='story' && !STORY.find(m=>m.id===st.active.job.story)) st.active=null;
      st.rep.castillo = st.rep.castillo||10; st.rep.reyes = st.rep.reyes||10; crime(st); save(); } else crime(st);
    st.rep.castillo=st.rep.castillo||10; st.rep.reyes=st.rep.reyes||10; }catch(_){} },
  /* a checkride already failed with an A or B is passed now */
  function passGoodCheckride(st){ try{ const L=st.last;
    if(L && L.job && L.job.kind==='check' && L.out && !L.out.pass && L.res && !L.res.crash && (L.res.grade==='A'||L.res.grade==='B'||L.res.score>=70) && !st.ratings[L.job.rating]){
      const R=RATINGS[L.job.rating]; st.ratings[L.job.rating]=true; if(st.cooldown) delete st.cooldown[L.job.rating]; L.out.pass=true;
      L.out.notes=(L.out.notes||[]).filter(n=>!/^Not this time/.test(n)); L.out.notes.push(`Passed. You now hold the ${R.n}.`);
      try{ addJournal(st,`Earned: ${R.n}`, `${CAST[L.job.chars[0]].n} signs the logbook. ${R.unlocks}`, L.job.chars, 'milestone'); }catch(_){}
      save(); setTimeout(()=>toast(`Checkride passed: you now hold the ${R.n}.`),800); } }catch(_){} },
  /* a booked seaplane checkride on the old long route is rebuilt once */
  function rebuildSeaplaneCheckride(st){ try{ const a=st.active; if(a && !a.started && a.job.kind==='check' && a.job.rating==='SEA' && a.job.to!=='WSBL'){ a.job=checkrideJob(st,'SEA',a.job.ac); save(); setTimeout(()=>toast('Seaplane checkride is now a short hop: Juliana to Simpson Bay Lagoon.'),800); } }catch(_){} },
  /* a booked HW2 on an old route is un-booked once, so the story card offers the new one */
  function unbookOldHW2(st){ try{ const a=st.active; if(a && !a.started && a.job.story==='HW2' && a.job.to!=='TNCM'){ st.active=null; save(); if(S.view==='flight') S.view='board'; setTimeout(()=>toast('Below the Surface is now a runway flight: Grand Case to Juliana. Start it again from the story card.'),800); } }catch(_){} },
  /* an old save sitting "after midnight" starts a fresh day */
  function rollPastMidnight(st){ try{ if(st.clock>=1440 && !st.active){ rest(st); save(); } }catch(_){} },
  /* a booked flight opens the Flight screen when the app starts */
  function openBookedFlight(st){ if(st.active && S.view==='board') S.view='flight'; },
];
const RENDER_ONCE = { startup:false, jobPrefs:false, walkthrough:false, recap:false, title:false };
let renderFails = 0;      // consecutive draws that crashed
let renderLastCash = null; // for the cash flash in the header
let renderViewChanged = false; // did this draw switch pages?

/* the job list remembers your tab and sort (read them back once) */
function restoreJobListPrefs(){ if(!RENDER_ONCE.jobPrefs && S.st){ RENDER_ONCE.jobPrefs=true; const u=S.st.ui||{}; if(u.jobTab) S.jobTab=u.jobTab; if(u.jobSort) S.jobSort=u.jobSort; } }
/* first run: the cold open, then one card that jumps back to the start of the story */
function maybeStartWalkthrough(){ if(RENDER_ONCE.walkthrough || !S.st || S._title) return; RENDER_ONCE.walkthrough=true; const st=S.st; st.ui=st.ui||{};
  if(!st.ui.walk3 && !(st.active&&st.active.started)){ S._walk=true; st.ui.walk3=1; save();
    setTimeout(()=>cutscene({col:'#c8962a', art:(typeof SCENES!=='undefined'?SCENES.ramp():''), shots:[...(typeof coldOpenShots==='function'?coldOpenShots():[]),
      {card:true,kicker:'How it works',title:'You fly every chapter',sub:`<p>Each chapter is a real flight in MSFS, with a scene before it and a choice after it. The game follows your flight and grades the landing by itself.</p>`}], onEnd:()=>{ S._walk=false; }}), 700); } }
/* aircraft specs you measured in MSFS replace the built-in ones (once per app start) */
function applyMeasuredAircraft(){ try{ if(!S._acReal && S.st){ S._acReal=true; for(const k in (S.st.acReal||{})) if(AC[k]) Object.assign(AC[k], S.st.acReal[k]); } }catch(_){} }
/* an old save with no record of which tabs it has seen: mark the ones already unlocked */
function initSeenTabs(){ try{ const st=S.st; if(st && !(st.ui && st.ui.seen)){ st.ui=st.ui||{}; st.ui.seen={}; for(const k in TAB_UNLOCK) if(TAB_UNLOCK[k].t(st)) st.ui.seen[k]=1; } }catch(_){} }
/* a booked job from an old save gets its passenger manifest */
function ensureManifest(){ const a=S.st&&S.st.active; if(a && a.job.manifest===undefined){ a.job.manifest = makeManifest(a.job); } }

/* ---------- 2. draw ---------- */

function drawPage(){
  const y = window.scrollY;
  if(!S.st){ app.innerHTML = setupView(); return; }
  const v = S.view;
  const body = v==='cockpit'?cockpitView(): v==='money'?moneyView(): v==='map'?mapView(): v==='flight'?flightView(): v==='pilot'?pilotView(): v==='story'?storyView(): v==='log'?logView(): v==='company'?companyView(): v==='hangar'?hangarView(): v==='cup'?cupView(): v==='academy'?academyView(): v==='profile'?profileView(): boardView();
  app.innerHTML = band() + body + tourHTML(S.st);
  if(S.keepScroll) window.scrollTo(0,y); S.keepScroll=false;
}
/* If a screen crashes: log it, fall back to the job board once, then show a recovery screen. */
function drawPageGuarded(){
  try{ drawPage(); renderFails=0; }
  catch(e){ renderFails++; try{ logErr(`render(${S.view}): ${e && e.message}`); }catch(_){}
    const app=document.getElementById('app'); if(!app) return;
    if(renderFails<2 && S.view!=='board'){ S.view='board'; S.debrief=false; S.showResult=false; S.confirm=null; try{ drawPage(); toast('Something went wrong on that screen, so you\'re back on the job board. A report was saved.'); return; }catch(_){ } }
    app.innerHTML = `<main class="wrap"><div class="panel stack" style="max-width:640px;margin:60px auto;text-align:center"><h2>Turbulence in the code</h2><p>Trade Winds hit an error drawing this screen. Your career is saved.</p><p class="tiny muted mono">${esc(String(e&&e.message||e).slice(0,200))}</p><div class="row" style="justify-content:center"><button class="btn primary" data-act="st-home">Back to the job board</button><button class="btn" data-act="st-restore">Restore last backup</button></div></div></main>`;
  }
}

/* ---------- 3. after drawing ---------- */

/* each step is independent: one failing never stops the others */
const AFTER_RENDER = [
  function a11y(){ applyA11y(); },
  /* a page change fades in; then small per-page effects */
  function pageFade(){ S._lastView=S.view; if(renderViewChanged && !calmMotion()){ const m=document.querySelector('main'); if(m){ m.classList.remove('view-in'); void m.offsetWidth; m.classList.add('view-in'); } } afterRenderFx(); },
  /* tell the stylesheet which screen is showing */
  function tagView(){ document.documentElement.dataset.view = S.showResult && S.view==='flight' ? 'result' : (S.st&&S.st.active&&S.st.active.started&&S.view==='flight'?'inflight':S.view||''); },
  /* old wording in saved text is replaced with your current role */
  function fixRoleText(){ fixText(document.body); },
  /* the after-flight scene plays once, as soon as the result screen for a main-story chapter appears */
  function playAftermathOnce(){ const st=S.st, L=st&&st.last; if(S.showResult && L && L.job && L.job.kind==='story' && CRIME_IDS.has(L.job.story) && !document.querySelector('.cut')){ const c=crime(st); c.afterSeen=c.afterSeen||{}; const key=L.job.id+':'+(L.job.accepted||'')+':'+(L.res&&L.res.score);
    if(!c.afterSeen[key]){ c.afterSeen[key]=1; const ks=Object.keys(c.afterSeen); if(ks.length>40) delete c.afterSeen[ks[0]]; save(); setTimeout(playAftermath, 350); } } },
  /* "Previously on Trade Winds" when you open the app mid-story */
  function previouslyOn(){ if(RENDER_ONCE.recap || !S.st) return; RENDER_ONCE.recap=true; const st=S.st; const MC=mainChapters(); const dn=MC.filter(m=>st.story.done[m.id]);
    if(dn.length && !S._walk && !S._title && !(st.active&&st.active.started) && !S.showResult && !(st.ui&&st.ui.noRecap)){ const last3=dn.slice(-3); const next=MC.find(m=>!st.story.done[m.id]); const act=next?CRIME_ACTS.find(a=>a.arc===next.arc):CRIME_ACTS[CRIME_ACTS.length-1];
      const shots=[{card:true,kicker:'Previously on',title:'Trade Winds',auto:1600}].concat(last3.map(m=>[`Chapter ${MC.indexOf(m)+1} · ${m.title}`, null, recapOf(st,m)])); if(next) shots.push({card:true,kicker:`Up next · Chapter ${MC.indexOf(next)+1}`,title:next.title,sub:`<p>${esc(next.hook||'')}</p>`});
      setTimeout(()=>{ if(!document.querySelector('.cut')) cutscene({shots, col:act.col, art:SCENES.office(), onEnd:()=>{}}); }, 900); } },
  /* the test-session banner */
  function testBanner(){ if(testSession() && !document.querySelector('.test-banner')){ const d=document.createElement('div'); d.className='test-banner'; d.innerHTML=`Test session: changes will be thrown away <button class="btn sm" data-act="test-session">End and restore</button>`; document.body.appendChild(d); } if(!testSession()) document.querySelectorAll('.test-banner').forEach(e=>e.remove()); },
  /* the tabs under the main menu (Jobs/Map, Pilot/Money/...) */
  function subTabs(){ const g=navGroup(S.view); const main=document.querySelector('main'); if(g && g.tabs && main && !main.querySelector('.subtabs') && !(S.view==='flight')){ const d=document.createElement('div'); d.className='subtabs'; d.innerHTML=g.tabs.map(([v,n])=>`<button class="${S.view===v||(v==='pilot'&&['profile','log'].includes(S.view))?'on':''}" data-act="nav" data-v="${v}">${n}</button>`).join(''); main.prepend(d); } },
  /* flight mode: the page chrome hides while you're flying */
  function flyingClass(){ const a=S.st&&S.st.active; const on=!!(a&&a.started&&S.view==='flight'&&!S.showResult&&!S.debrief); document.body.classList.toggle('flying', on && !S.fmMenu); },
  /* result screen: the pay counts up once */
  function countUpPay(){ if(S.showResult && !S._counted){ S._counted=true; const el=[...document.querySelectorAll('main section b, main section .big, main section strong')].find(e=>/^\+\$[\d,]+$/.test(e.textContent.trim())); if(el){ const target=Number(el.textContent.replace(/[^\d]/g,'')); let t0=null; const step=ts=>{ if(!t0) t0=ts; const k=Math.min(1,(ts-t0)/900); el.textContent='+'+money(Math.round(target*(1-Math.pow(1-k,3)))); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); } } if(!S.showResult) S._counted=false; },
  /* hover tips on Power, Heat and Dirty wherever they appear */
  function meterTips(){ document.querySelectorAll('.sc-m span, .hq-m span, .dbar > span, .chip, .launder .label').forEach(el=>{ if(el.title) return; const t=el.textContent.trim(); const k=/^Power/.test(t)?'Power':/^Heat/.test(t)?'Heat':/^Dirty/i.test(t)?'Dirty':null; if(k){ el.title=CX_TIPS[k]; el.classList.add('has-tip'); } }); },
  /* cash changes flash in the header */
  function cashFlash(){ const st=S.st; if(!st) return; const v=st.cash; if(renderLastCash!=null && v!==renderLastCash){ const el=[...document.querySelectorAll('.topbar .hud *')].find(e=>!e.children.length && /^\$[\d,−-]+$/.test(e.textContent.trim())); if(el){ const d=document.createElement('span'); d.className='cashfx '+(v>renderLastCash?'up':'down'); d.textContent=(v>renderLastCash?'+':'−')+money(Math.abs(v-renderLastCash)); el.parentElement.style.position='relative'; el.parentElement.appendChild(d); setTimeout(()=>d.remove(),1800); } } renderLastCash=v; },
  /* the title screen shows once, right after the first draw */
  function showTitleOnce(){ if(!RENDER_ONCE.title && S._title){ RENDER_ONCE.title=true; setTimeout(showTitle, 50); } },
  /* metric units, if chosen in Settings */
  function metricUnits(){ if(uiP().metric){ const w=document.createTreeWalker(document.getElementById('app')||document.body, NodeFilter.SHOW_TEXT); const L=[]; while(w.nextNode()) L.push(w.currentNode); L.forEach(n=>{ if(/\d\s?(lb|gal)\b/.test(n.nodeValue)) n.nodeValue=toMetric(n.nodeValue); }); } },
  /* the sub-tab for the page you're on is the one highlighted */
  function subTabHighlight(){ document.querySelectorAll('.subtabs button').forEach(b=>{ if(b.dataset.v==='pilot' && ['profile','log'].includes(S.view)) b.classList.remove('on'); if(b.dataset.v===S.view) b.classList.add('on'); }); },
  /* the job list remembers your tab and sort (write them back) */
  function storeJobListPrefs(){ if(S.st){ const u=S.st.ui=S.st.ui||{}; if(u.jobTab!==S.jobTab||u.jobSort!==S.jobSort){ u.jobTab=S.jobTab; u.jobSort=S.jobSort; } } },
  /* the window title says where you are in the story */
  function windowTitle(){ const st=S.st; if(!st){ document.title='Trade Winds'; return; } const a=st.active; if(a){ document.title=`${a.job.from} → ${a.job.local?a.job.from:a.job.to} · Trade Winds`; } else { const MC=mainChapters(); const n=MC.find(m=>!st.story.done[m.id]); document.title = n ? `Chapter ${MC.indexOf(n)+1}: ${n.title} · Trade Winds` : 'Trade Winds'; } },
  /* the new-career screen has no sub-tabs */
  function noSubTabsOnSetup(){ if(!S.st) document.querySelectorAll('.subtabs').forEach(e=>e.remove()); },
  /* the browser tab warns you when the feds are on you */
  function fedsInTitle(){ const c=S.st&&crime(); if(c&&c.on&&c.heat>=80&&!/^⚠/.test(document.title)) document.title='⚠ '+document.title; },
];


function render(){
  restoreJobListPrefs();
  maybeStartWalkthrough();
  if(!RENDER_ONCE.startup && S.st){ RENDER_ONCE.startup=true; STARTUP_FIXES.forEach(fix=>fix(S.st)); }
  applyMeasuredAircraft();
  initSeenTabs();
  renderViewChanged = S._lastView !== S.view;
  ensureManifest();

  drawPageGuarded();

  for(const step of AFTER_RENDER){ try{ step(); }catch(_){} }
}

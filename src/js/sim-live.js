/* ===================== LIVE SIM =====================
   Everything that reacts to MSFS while it's connected.
   renderSimBits() is the sim tick: it runs every time new data arrives from MSFS (about once a second)
   and whenever the connection state changes. It is a list of named steps that run in order.
   Add a step to SIM_TICK; don't wrap renderSimBits(). */

const SIM_CHIMES = {};   // per flight: which cabin chimes have played

/* Story moments wait while someone is talking, and stay quiet below 1,000 ft unless the next one is for short final. */
function storyBeatsHeld(){
  const s=S.sim; const a=S.st&&S.st.active; let held=false;
  try{ if(window.speechSynthesis && speechSynthesis.speaking) held=true; if(s&&s.position&&s.motion&&!s.motion.onGround && (s.position.aglFt||0)<1000 && a){ const L=beatsFor(a); const nxt=L.find((b,i)=>!(a.beatsDone||{})[i]); if(nxt && nxt.at!=='final') held=true; } }catch(_){}
  return held;
}

const SIM_TICK = [
  function armRecorder(){ autoArm(); },
  function instructorCalls(){ coachTick(); },
  /* the small live panels on the page */
  function livePanels(){
    const el=document.getElementById('simpanel'); if(el) el.innerHTML = simPanelHTML();
    const h=document.getElementById('sim-hangar'); if(h) h.innerHTML = simHangarHTML();
    const d=document.getElementById('sim-debrief'); if(d && S.st && S.st.active) d.innerHTML = simDebriefHTML(S.st.active.job);
    const b=document.getElementById('sim-band'); if(b) b.textContent = S.simState==='live' ? 'MSFS live' : 'Sim not connected';
    const dot=document.querySelector('.simdot'); if(dot) dot.classList.toggle('on', S.simState==='live');
  },
  function cabin(){ try{ cabinTick(); }catch(e){} document.querySelectorAll('.cabin-host').forEach(el=>{ el.innerHTML = cabinInner(); }); },
  function callouts(){ document.querySelectorAll('.callout-host').forEach(el=>{ el.innerHTML = calloutHTML(); }); },
  function speakNewLines(){ speakNew(); },
  /* parked with the engine off after landing: the flight is logged by itself */
  function finishWhenParked(){ const a=S.st&&S.st.active; if(!a || a._autoDone) return; const rec=autoReady(a); if(rec && rec.blockIn) autoFinish(rec,'parked'); },
  /* urgent jobs: note the takeoff time */
  function urgentTakeoffTime(){ const a=S.st&&S.st.active; if(a && a.job.realtime && !a.job._toAt){ const rec=simRecFor(a); if(rec && rec.takeoff) { a.job._toAt=rec.takeoff.t; save(); } } },
  function academy(){ academyTick(); },
  function liveMap(){ if(S.view==='map' && S.st && S.st.active && S.simState==='live'){ S.keepScroll=true; render(); } },
  function inflightPanels(){ if(S.view==='flight' && S.st && S.st.active && S.st.active.started && !S.debrief && !S.showResult && !S.ifBrief){
    const l=document.getElementById('if-live'); if(l) l.innerHTML=ifLiveHTML(); const m=document.getElementById('if-map'); if(m) m.innerHTML=ifMiniMap(S.st.active); } },
  function preflight(){ if(S.view==='flight') renderPreflight(); },
  /* cabin chimes with passengers on board: after takeoff, top of descent, parked */
  function cabinChimes(){ const a=S.st&&S.st.active; if(!a || S.simState!=='live') return; const rec=simRecFor(a); if(!rec) return; const s=S.sim; const key=a.recId||'x'; const F=SIM_CHIMES[key]=SIM_CHIMES[key]||{};
    if(a.job.pax){ if(rec.takeoff && !F.to){ F.to=1; setTimeout(()=>chime(),12000); }
      if(!F.desc && rec.takeoff && s.motion && !s.motion.onGround && s.motion.vsFpm<-500 && s.position.aglFt<4000){ F.desc=1; chime(true); }
      if(rec.blockIn && !F.in){ F.in=1; chime(); } } },
  function bigMode(){ if(S.big){ const el=document.getElementById('bigmode'); if(el) el.innerHTML=bigInner(); } },
  function butterCup(){ cupTick(); },
  /* sealed orders open when the trigger point is reached */
  function sealedOrders(){ const a=S.st&&S.st.active; if(a && a.job.scen && !a.opened && a.started && trigReached(a)) openOrders(a,'live'); },
  function syncWeather(){ trySyncWx(); },
  function trace(){ traceSample(); },
  function copilot(){ copilotTick(); },
  /* the step-by-step flight guide moves on */
  function flightGuide(){ if(guideActive() && S.view==='flight'){ const a=S.st.active; const before=JSON.stringify(a.guide||{}); guideHTML(a); if(JSON.stringify(a.guide)!==before){ S.keepScroll=true; render(); } } },
  function clock(){ autoClock(); },
  /* engine running at the departure airport: the flight starts by itself */
  function startWhenEngineRuns(){ const a=S.st&&S.st.active, s=S.sim; if(!a || a.started || S.simState!=='live' || !s || !s.motion || !s.systems) return;
    if(!(s.systems.engineRunning || !s.motion.onGround) || !atDeparture(a.job)) return;
    if(diff()==='expert' && !checklistDone(a)){ if(!a._ckNag){ a._ckNag=true; toast('Expert: finish the Before start and Start & taxi checklists to start the flight.'); } return; }
    a.started=Date.now(); save(); if(!a.recId) simArm(); toast('Engine running: flight started.'); S.keepScroll=true; render(); },
  function adoptAircraftSpecs(){ adoptSpec(); },
  function connectionCard(){ if(S.view==='board'){ const el=document.querySelector('.conn-card'); if(el){ const t=tpl(connCard(S.st)); el.replaceWith(t.content.firstElementChild); } } },
  /* a flight that just started opens the Flight page */
  function openFlightPage(tick){ const a=tick.active; if(a && !tick.wasStarted && a.started && S.view!=='flight') go('flight'); },
  /* safety calls from the copilot: too fast, too fast for flaps, fuel */
  function safetyCalls(){ const a=S.st&&S.st.active, s=S.sim; if(!simRelevant(a) || !s.motion || s.motion.onGround) return;
    if(SAFE.id!==a.job.id){ SAFE.id=a.job.id; SAFE.t={}; }
    const cls=AC[a.job.ac].cls, ias=s.motion.ias, x=s.ext||{};
    if(ias > (VWARN[cls]||200)) safeSay('fast', `Speed! ${ias} knots. Power back.`, 20000);
    if(x.flaps && x.flaps.handle>0 && ias > (VFLAP[cls]||110)) safeSay('flapfast', `Too fast for flaps. Slow down before you extend them.`, 20000);
    // fuel: enough for the rest of the trip plus the reserve?
    const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; const p=plan(a.job); const ac=AC[a.job.ac];
    if(s.systems && s.systems.fuelLb!=null && ac.burn>0 && s.position){ const togo=a.job.local?0:distNm({lat:s.position.lat,lon:s.position.lon},dest); const needLb=(togo/Math.max(60,s.motion.gs||ac.cruise)*60 + p.reserveMin*0.75)/60*ac.burn; if(s.systems.fuelLb < needLb) safeSay('fuel', `Fuel check. We're getting close to the reserve. Consider the nearest airport.`, 300000); } },
  /* the approach card appears near the destination and stays current */
  function approachCardLive(){ const a=S.st&&S.st.active; if(!a||!a.started||S.view!=='flight') return; const want=!!approachCard(a); const has=!!document.querySelector('.appr-card'); if(want!==has){ S.keepScroll=true; render(); } else if(has){ const t=tpl(approachCard(a)); document.querySelector('.appr-card').replaceWith(t.content.firstElementChild); } },
  function waterLandingGear(){ const a=S.st&&S.st.active, s=S.sim; if(!a||!a.started||!waterDest(a)||!s||!s.position||!s.motion||s.motion.onGround) return; const g=s.ext&&s.ext.gear; const dest=AP[a.job.local?a.job.from:a.job.to];
    if(g && g.retractable && g.down && distNm({lat:s.position.lat,lon:s.position.lon},dest)<4 && s.position.aglFt<1500) safeSay('watergear', `Gear is down. Gear up for a water landing!`, 30000); },
  /* story moments during a chapter: at most one every 40 seconds, in order */
  function storyBeats(tick){ const a=S.st&&S.st.active; if(!a||!a.started||a.job.kind!=='story'||!BEATS[a.job.story]||!simRelevant(a)) return; if(tick.beatsHeld || Date.now()-BEAT.last<40000) return;
    const ph=beatPhase(a); if(!ph) return; a.beatsDone=a.beatsDone||{}; const list=beatsFor(a);
    for(let i=0;i<list.length;i++){ if(a.beatsDone[i]) continue; const b=list[i]; if(!ph[b.at]) break; a.beatsDone[i]=1; BEAT.last=Date.now(); save(); showBeat(a,b,i); break; } },
  /* what the flight is remembered for: time in the air, time below 1,000 ft, transponder, real fuel burn */
  function trackFlight(){ const a=S.st&&S.st.active, s=S.sim; if(!a||!a.started||!s||S.simState!=='live'||!s.motion||!s.position) return; const now=Date.now(); const T=a.track=a.track||{air:0,low:0,last:now,fuel:[]}; const dt=Math.min(20,(now-T.last)/1000); T.last=now;
    if(!s.motion.onGround){ T.air+=dt; if((s.position.aglFt||0)<1000) T.low+=dt; }
    if(s.systems && s.systems.fuelLb!=null){ T.fuel.push([now, s.systems.fuelLb]); while(T.fuel.length && now-T.fuel[0][0]>15*60000) T.fuel.shift(); }
    const x=s.ext||{}; if(a.job.network && x.transponder!=null){ T.xpdrSeen=true; if(String(x.transponder.mode||x.transponder).match(/stby|standby|off/i)) T.dark=(T.dark||0)+dt; }
    const c=crime(); if(a.job.network && c.heat>=50 && !a.cgCall && T.air>240){ a.cgCall=true; showBeat(a,{at:'cruise',who:'radio',text:`Aircraft on this frequency, U.S. Coast Guard. Be advised, we are conducting air interdiction operations in this sector.|Your Heat is high. They might be talking about you.`},99); } },
  /* the flight display at the top of flight mode */
  function flightDisplay(){ const a=S.st&&S.st.active; const el=document.querySelector('.fhud'); if(a&&el){ const t=tpl(hudHTML(a)); el.replaceWith(t.content.firstElementChild); } },
  /* the aircraft you load in MSFS is added to your hangar list */
  function addLoadedAircraft(){ if(S.simState!=='live'||!S.st) return; const L=loadedAircraft(); if(L.id && S.st.hangar && !S.st.hangar[L.id]){ S.st.hangar[L.id]=true; save(); toast(`Added the ${AC[L.id].n} to your hangar list, since it's loaded in MSFS.`); } },
];
function renderSimBits(){
  const a=S.st&&S.st.active;
  const tick = { beatsHeld: storyBeatsHeld(), active:a, wasStarted: a&&a.started };
  for(const step of SIM_TICK){ try{ step(tick); }catch(_){} }
}

/* ---------- the instructor / copilot voice ---------- */

/* On a water landing the gear stays up, so the "check gear" calls are switched off while fn runs. */
function noGearCheck(fn){ return function(){ const a=S.st&&S.st.active; const g=S.sim&&S.sim.ext&&S.sim.ext.gear; if(g && waterDest(a)){ const r=g.retractable; g.retractable=false; try{ return fn.apply(this, arguments); } finally { g.retractable=r; } } return fn.apply(this, arguments); }; }

/* The instructor's calls (stall, overspeed, gear, unstable approach...), each with its own cool-down. */
function coachCalls(){
  const st=S.st; const a=st && st.active; const s=S.sim; if(!a || !s || S.simState!=='live' || !s.motion) return;
  const rec = simRecFor(a); if(!rec) return;
  a.cab = a.cab || {f:{}, log:[], comfort:100, cd:0}; const C=a.cab; C.cc=C.cc||{}; C.tally=C.tally||{};
  const job=a.job, now=Date.now(), x=s.ext, m=s.motion, pos=s.position||{};
  const who = shortName(coachFor(job));
  const say = (key, text, cd=60000, crit=false, once=false) => {
    if(once && C.cc[key]) return; if(C.cc[key] && now-C.cc[key] < cd) return;
    C.cc[key]=now; C.tally[key]=(C.tally[key]||0)+1;
    C.log.unshift({t:now, who, text, kind: crit?'crit':'coach'}); C.log=C.log.slice(0,14);
    if(crit){ C.callout={t:now, who, text}; toast(`${who}: ${text}`.slice(0,150)); }
  };
  const air = !m.onGround && rec.takeoff && !(rec.touchdown && rec.phase!=='airborne');
  const distTo = (!job.local && AP[job.to] && pos.lat!=null) ? distNm({lat:pos.lat,lon:pos.lon},AP[job.to]) : null;
  const final = air && distTo!=null && distTo < 5 && pos.aglFt < 1200 && m.vsFpm < 200;
  const vapp = vappOf(job.ac);
  if(m.onGround && !rec.takeoff && m.gs < 1 && x && Math.abs(x.controls.yokeX) > 0.15) say('stickOff', pick(COACH.stickOff).replace('{p}', Math.round(Math.abs(x.controls.yokeX)*100)), 0, true, true);
  if(x){
    if(x.flaps.overspeed) say('flapOver', pick(COACH.flapOver), 20000, true);
    if(x.flaps.damaged) say('flapDmg', pick(COACH.flapDmg), 0, true, true);
    if(Math.abs(x.flaps.left - x.flaps.right) > 12) say('flapSplit', pick(COACH.flapSplit), 30000, true);
    if(x.gear.overspeed) say('gearOver', pick(COACH.gearOver), 30000, true);
    if(x.warnings.stall && air) say('stall', pick(COACH.stall), 15000, true);
    if(x.warnings.overspeed && air) say('overspeed', pick(COACH.overspeed), 30000, true);
    if(air && Math.abs(x.attitude.bank) > 45){ if(!C.cc.bank || now-C.cc.bank>=45000){ if(job.pax) C.comfort=Math.max(0,C.comfort-6); } say('bank', pick(COACH.bank), 45000, false); }
    if(air && Math.abs(x.attitude.bank) > 40 && Math.abs(x.controls.yokeX) < 0.06 && !x.autopilot) say('rollNoInput', pick(COACH.rollNoInput).replace('{b}', Math.abs(x.attitude.bank)), 60000, true);
    if(final && x.gear.retractable && !x.gear.down && pos.aglFt < 800) say('gearUp', pick(COACH.gearUp), 20000, true);
    if(rec.takeoff && !C.cc.noLightChecked){ C.cc.noLightChecked=now; if(!x.lights.landing && now - rec.takeoff.t < 60000) say('noLight', pick(COACH.noLight), 0, false, true); }
  }
  if(air && rec.takeoff && now - rec.takeoff.t < 90000 && pos.aglFt > 400 && m.vsFpm > 300) say('goodTakeoff', pick(COACH.goodTakeoff), 0, false, true);
  if(final && pos.aglFt < 700 && m.vsFpm < -1100) say('sink', pick(COACH.sink), 25000, true);
  if(final && vapp && pos.aglFt < 1000 && m.ias > vapp + 20) say('fast', pick(COACH.fast).replace('{v}', vapp), 30000, false);
  if(final && vapp && pos.aglFt < 600 && m.ias < vapp - 12) say('slow', pick(COACH.slow).replace('{v}', vapp), 30000, true);
  if(final && vapp && pos.aglFt < 600 && pos.aglFt > 300 && Math.abs(m.ias - vapp) <= 8 && m.vsFpm > -900 && m.vsFpm < -300) say('stableApp', pick(COACH.stableApp), 0, false, true);
  if(rec.touchdown && rec.touchdown.fpm < 100) say('butter', pick(COACH.butter), 0, false, true);
}
/* One instructor tick: the calls, then what the flight will be judged on (mistake tally, the weather you flew through). */
function coachTickBody(){
  coachCalls();
  const a=S.st&&S.st.active; if(a && a.cab) a.job._cab = {tally:a.cab.tally};
  const x=S.sim&&S.sim.ext; if(!a || !x || S.simState!=='live') return;
  const w=x.weather; const W = a.job._wx = a.job._wx || {maxWind:0, minVis:99, cloud:false};
  W.maxWind=Math.max(W.maxWind, w.windKt||0); W.minVis=Math.min(W.minVis, w.visSm||99); if(w.inCloud && !S.sim.motion.onGround) W.cloud=true;
}
function coachTick(){ return noGearCheck(coachTickBody)(); }

/* A line from the copilot: shown in the flight log and spoken. Each key is said once. */
function copilotSay(text, key){
  const g=S.sim&&S.sim.ext&&S.sim.ext.gear; if(/gear/i.test(String(text)) && g && !g.retractable) text=String(text).replace(/\s*Check gear!?/i,' stable.').replace(/Five hundred\.\s+stable\./,'Five hundred, stable.');   // fixed gear: no gear call
  const m=String(text).match(/(\d{4,}) feet per minute/); if(m && Number(m[1])>1500) text='Down and safe.';   // a bad sensor reading is never read out
  if(CP.said[key]) return; CP.said[key]=1; S.copilotLast={text, t:Date.now()}; const a=S.st&&S.st.active; if(a && a.cab && a.cab.log){ const t=Date.now(); a.cab.log.unshift({t, who:'Copilot', text, kind:'copilot'}); a.cab.log=a.cab.log.slice(0,14); try{ VQ.lastT=Math.max(VQ.lastT,t); }catch(_){} }
  if(!(typeof voiceOn==='function' && voiceOn()) || !window.speechSynthesis) return; try{ const u=new SpeechSynthesisUtterance(text); const v=pickVoice(false,2)||pickVoice(false,0); if(v) u.voice=v; u.rate=1.08; u.pitch=0.95; u.volume=voiceVol(); speechSynthesis.speak(u); }catch(_){}
}

/* A safety call: each kind has its own repeat time, and two calls are never closer than 6 seconds. */
function safeSay(key, text, every){
  if(key==='fuel'){ const a=S.st&&S.st.active, s=S.sim;
    /* judged from your actual burn rate over the last minutes, not the book number */
    const T=a&&a.track; if(!a||!s||!T||T.fuel.length<2||!s.position||!s.motion) return;
    const [t0,f0]=T.fuel[0], [t1,f1]=T.fuel[T.fuel.length-1]; const mins=(t1-t0)/60000; if(mins<6) return; const burn=(f0-f1)/mins; if(!(burn>0)) return;
    const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; const togo=a.job.local?0:distNm({lat:s.position.lat,lon:s.position.lon},dest); const gs=Math.max(60,s.motion.gs||AC[a.job.ac].cruise);
    const need=burn*(togo/gs*60 + 30); if(!(f1 < need)) return;
    text=`Fuel check. At this burn rate we'll land with less than thirty minutes left. Consider the nearest airport.`;
    /* and never in the first five minutes, or while the book numbers still say there's plenty */
    const rec=s.recorder; if(!rec||!rec.takeoff||Date.now()-rec.takeoff.t<5*60000) return;
    const ac=AC[a.job.ac], p=plan(a.job); const needLb=(togo/ac.cruise*60 + p.reserveMin*0.6)/60*ac.burn; if(!(s.systems && s.systems.fuelLb < needLb)) return; }
  const now=Date.now(); if(SAFE.t[key] && now-SAFE.t[key] < (every||60000)) return; if(SAFE.any && now-SAFE.any < 6000) return; SAFE.any=now; SAFE.t[key]=now; try{ copilotSay(text, key+':'+now); }catch(_){}
}

/* ---------- finishing from MSFS ---------- */

/* Logs the flight from what MSFS recorded. */
function autoFinish(rec, how){
  { const a=S.st&&S.st.active; if(a && a.cab && a.cab.comfort!=null) a.cab.comfort=Math.max(25, a.cab.comfort); }   // comfort never reads below 25
  if(rec && rec.touchdown){ rec = Object.assign({}, rec, {touchdown: saneTouchdown(rec.touchdown)}); }
  const st=S.st, a=st.active, job=a.job; if(!a || a._autoDone) return; a._autoDone=true;
  const near = nearestAirport(rec.touchdown.lat, rec.touchdown.lon);
  const landedAt = near.d < 6 ? near.code : (job.local ? job.from : job.to);
  let landing = landingClass(rec.touchdown.fpm); if(rec.bounces>1 && landing==='butter') landing='smooth'; if(rec.bounces>2 && landing==='smooth') landing='firm';
  const comfort = a.cab ? Math.round(a.cab.comfort) : null;
  const block = rec.blockMinutes || Math.max(1, Math.round((Date.now()-(a.started||a.accepted))/60000));
  const f = { landing, tdz: rec.touchdown.fpm < 400, center: rec.bounces===0, fuel: rec.fuelNowLb!=null?rec.fuelNowLb:0, fuelUnit:'lb', block, landedAt,
    checklist: diff()==='expert' ? checklistDone(a) : true, radio:true, weather:true, smooth: comfort==null || comfort>=75, scen:null, tasks:[], bonus:false, request:false,
    verified:true, td:rec.touchdown, simFpm:rec.touchdown.fpm, simBounces:rec.bounces, simG:rec.touchdown.g, comfort, auto:true };
  const res = score(job, f); applyResult(st, job, f, res); S.debrief=false; S.showResult=true; S.busy.journalDone=false; save();
  S.view='flight'; try{ history.replaceState(null,'','#flight'); }catch(_){} render(); window.scrollTo(0,0);
  toast(how==='parked' ? 'Parked. Flight logged automatically from MSFS.' : 'Flight logged from MSFS.');
}

/* ---------- full-screen moments ---------- */

/* A full-screen card (urgent job, sealed orders, a bust). Closes by itself after o.ms. */
function takeover(o){ document.querySelectorAll('.takeover').forEach(x=>x.remove()); const d=document.createElement('div'); d.className='takeover tk-'+(o.kind||'orders'); d.setAttribute('role','alertdialog'); d.setAttribute('aria-label', o.title);
  d.innerHTML=`${o.kind==='weather'?'<div class="tk-rain"></div><div class="fx-flash"></div>':''}<div class="tk-in"><p class="tk-kicker">${esc(o.kicker||'')}</p><h1>${esc(o.title)}</h1>${o.text?`<p class="tk-text">${esc(o.text)}</p>`:''}${o.sub?`<p class="tk-sub">${esc(o.sub)}</p>`:''}<button class="btn primary" data-act="tk-close">${esc(o.btn||'Got it')}</button></div><i class="tk-timer" style="--ttl:${o.ms||9000}ms"></i>`;
  document.body.appendChild(d); try{ crackle && crackle(0.3,0.3); }catch(_){}
  const close=()=>{ d.classList.add('out'); setTimeout(()=>d.remove(),400); }; d.addEventListener('click', e=>{ if(e.target.closest('[data-act="tk-close"]')) close(); }); setTimeout(close, o.ms||9000); }

/* Opens the sealed orders for an in-flight emergency. */
function openOrders(a, how){
  if(a && !a.opened && nearDestination(a)) return;   // too late in the flight: it stays sealed
  /* a weather emergency under a clear sky becomes a different emergency */
  if(a && !a.opened && WX_SCEN.has(a.job.scen) && skyIsClear()){ const alt=['rough_engine','electrical','pax_medical','runway_closed'].filter(k=>SCEN[k] && (SCEN[k].cls==='*' || SCEN[k].cls.includes(AC[a.job.ac].cls)) && (!SCEN[k].pax || a.job.pax>0));
    if(alt.length) a.job.scen=pick(alt); else { a.job.scen=null; return; } }
  if(testMode()) return;
  if(a.opened) return; a.opened=true; a.scenAt=Date.now(); a.scenPlan=scenarioPlan(a); save();
  S.ordersPop=true; toast(`Sealed orders: ${a.scenPlan.title}`);
  try{ if(typeof crackle==='function') crackle(0.25,0.3); if(window.speechSynthesis && voiceOn()){ const u=new SpeechSynthesisUtterance(`Sealed orders. ${a.scenPlan.text} ${a.scenPlan.sim}`); u.volume=voiceVol(); const v=pickVoice(false,1); if(v) u.voice=v; speechSynthesis.cancel(); speechSynthesis.speak(u); } }catch(_){}
  try{ if('Notification' in window && Notification.permission==='granted') new Notification('Trade Winds: sealed orders', {body:a.scenPlan.text}); }catch(_){}
  S.keepScroll=true; render();
  try{ if(a.scenPlan){ const sc=SCEN[a.job.scen]||{}; const wx=/squall|shower|storm|wave|weather|rain/i.test((a.job.scen||'')+' '+(sc.n||'')+' '+a.scenPlan.title);
    takeover({kind:wx?'weather':'orders', kicker:'Sealed orders', title:a.scenPlan.title, text:a.scenPlan.text, sub:a.scenPlan.sim, ms:11000}); } }catch(_){}
}

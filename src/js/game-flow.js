/* ===================== GAME FLOW =====================
   What happens to the career when a flight is scored and finished, and when a new day starts.
     score(job, f)                 -> the grade for a flight
     applyResult(st, job, f, res)  -> pays, logs and moves the story on; returns the result sheet ("out")
     afterFlight(...)              -> the extras on top of the basic result (bonuses, wear, records)
     rest(st)                      -> starts a new day
   Each is one function made of named steps that run in a fixed order. Add a step; don't wrap. */

/* ---------- scoring ---------- */

/* When MSFS tells us where the wheels touched, work out the runway, the distance past the threshold and the centerline offset. */
function scoreTouchdownPoint(job, f){
  if(f && f.td && f.td.lat!=null && f.landing!=='crash'){ const code = f.landedAt || (job.local?job.from:job.to); const A = touchdownAnalysis(code, f.td); f.tda = A;
    if(A && A.runway){ f.tdz = A.zone==='aim' || A.zone==='zone'; f.center = !A.approx ? (A.center==='on' || A.center==='near') : f.center; } }
}
/* An in-flight emergency flown automatically is judged by where you landed. */
function scenVerdict(job, f, P){ const landed=f.landedAt;
  return P.divert ? (landed===P.target ? 'book' : landed===job.to ? 'ignored' : 'messy') : (landed===P.target || landed===P.alt ? 'book' : 'messy'); }

/* The score sheet: every line is [label, points, out of]. */
function scoreSheet(job, f){
  const a=AC[job.ac], p=plan(job); const parts=[];
  const L = LANDING[f.landing]||LANDING.firm; parts.push([`Landing`, L.pts, 30]);
  if(f.landing==='crash'){ return { score:0, grade:'F', parts:[[`Landing`,-40,30]], crash:true, fuelMin:0, block:f.block }; }
  parts.push([`Touchdown zone`, f.tdz?10:3, 10]);
  parts.push([`Centerline / alignment`, f.center?5:2, 5]);
  let fuelMin;
  if(a.fuel==='elec'){ fuelMin = (f.fuel/100)*90; parts.push([`Battery reserve`, f.fuel>=20?15:f.fuel>=10?6:-10, 15]); }
  else { const lb = f.fuelUnit==='gal' ? f.fuel*p.density : f.fuelUnit==='kg' ? f.fuel*2.2046 : f.fuel; fuelMin = a.burn ? lb/a.burn*60 : 999; const r=p.reserveMin; parts.push([`Fuel reserve (${Math.round(fuelMin)} min left, ${r} required)`, fuelMin>=r?15:fuelMin>=r*0.5?6:-10, 15]); }
  const slow = f.block > p.est*1.3 + 8; parts.push([`Block time vs plan (${durTxt(f.block)} vs ${durTxt(p.est)})`, f.diverted ? 8 : slow?4:10, 10]);
  const pr = ['checklist','radio','weather','smooth'].filter(k=>f[k]).length*5; parts.push([`Airmanship`, pr, 20]);
  if(job.kind==='check'){ const n=job.tasks.length, done=(f.tasks||[]).length; parts.push([`Checkride tasks (${done}/${n})`, Math.round(10*done/n), 10]); }
  else if(job.scen){ const s=SCEN[job.scen]; let how=f.scen||'book'; const landed=f.landedAt||job.to; let label=s.n;
    if(s.divert && how==='book' && !job.local && (s.returnHome ? landed!==job.from : landed===job.to)){ how='messy'; label=`${s.n} (by the book meant ${s.returnHome?'returning to '+job.from:'diverting'})`; }
    const m={book:10, messy:5, ignored:-10}[how]; parts.push([label, m, 10]); }
  else parts.push([`Passenger experience`, f.landing==='hard'?3:10, 10]);
  let total = parts.reduce((s,p)=>s+p[1],0); total = clamp(Math.round(total),0,100);
  return { score:total, grade:gradeOf(total), parts, fuelMin:Math.round(fuelMin), block:f.block };
}
function retotal(r){ const tot=clamp(Math.round(r.parts.reduce((s,p)=>s+p[1],0)),0,100); r.score=tot; r.grade=gradeOf(tot); }

function score(job, f){
  scoreTouchdownPoint(job, f);
  let g = f;   // the flight as it is judged (difficulty and emergencies can adjust a copy)
  const act=S.st&&S.st.active; if(job.scen && f.auto && act && act.scenPlan && !f.scen) g = Object.assign({}, g, {scen: scenVerdict(job, f, act.scenPlan)});
  if(diff()==='casual' && g.landing==='hard') g = Object.assign({}, g, {landing:'firm'});
  const r = scoreSheet(job, g);
  /* a measured touchdown replaces the two estimated lines */
  const A=f&&f.tda;
  if(A && A.runway){ r.parts = r.parts.map(p=>{
      if(/^Touchdown zone/.test(p[0])){ const pts = A.zone==='aim'?10 : A.zone==='zone'?8 : A.zone==='long'? (A.fromThr < A.zoneEnd+1000?4:1) : 0;
        return [`Touchdown point: ${A.zone==='short'?`${Math.abs(A.fromThr)} ft SHORT of the threshold`:`${A.fromThr.toLocaleString()} ft past the threshold of ${A.runway}`}${A.zone==='long'?' (floated long)':A.zone==='aim'?' (on the aiming point)':''}`, pts, 10]; }
      if(/^Centerline/.test(p[0]) && !A.approx){ const pts = A.center==='on'?5:A.center==='near'?4:A.center==='wide'?2:0; return [`Centerline: ${Math.abs(A.xt)} ft ${A.xt>0?'right':A.xt<0?'left':''} of center`, pts, 5]; }
      return p; });
    retotal(r); }
  /* with no passengers on board, the last line is about the cargo */
  if(job && !job.pax && r.parts){ r.parts=r.parts.map(p=>/^Passenger experience/.test(p[0]) ? ['Cargo care', f.landing==='hard'?6:10, 10] : p); retotal(r); }
  /* Expert: skipping the checklist costs 10 points (applied last, so the recounts above can't undo it) */
  if(diff()==='expert' && S.st.active && !checklistDone(S.st.active) && !r.crash){ r.parts.push(['Expert: checklist not completed', -10, 0]); retotal(r); }
  return r;
}

/* ---------- finishing a flight ---------- */

const toneOf = res => (res.grade==='A'||res.grade==='B') ? 'good' : res.grade==='C' ? 'ok' : 'bad';

/* Checkrides are forgiving: a decent score passes, and a firm-ish "hard" landing isn't held against you. */
function easeCheckride(job, f, res){
  if(job.kind==='check' && f && !res.crash && (res.score>=70 || res.grade==='A' || res.grade==='B')){ f.tasks=(job.tasks||[]).slice(); if(f.landing==='hard') f.landing='firm'; res.score=Math.max(70, res.score); }
  if(job.kind==='check' && job.rating==='SEA' && !res.crash && f && f.landing!=='hard') res.score=Math.max(70, res.score);
  if(job.kind==='check' && f && f.landing==='hard' && (f.simFpm||0) < 550 && !res.crash){ f.landing='firm'; }
}
/* The Setup (CRB): if someone warned you mid-flight, you walk away with the load. */
function setupWarnedOutcome(st, job){
  if(job.story==='CRB' && flagsOf(st).warned){ job.out={good:`You park at the passenger terminal instead of the cargo ramp and walk out with a crowd of tourists. From the taxi you watch three trucks full of Medina's men circle an empty cargo ramp. Castillo sold you to them, and it didn't work.`,ok:`You park at the passenger terminal and walk out with the tourists. Three trucks of Medina's men wait on an empty cargo ramp. Castillo sold you out, and it didn't work.`,bad:`A rough landing, but you park at the passenger terminal and slip out with the tourists. Medina's men wait on an empty cargo ramp. Castillo sold you out.`}; }
}
/* A practice flight changes nothing in the career. */
function practiceResult(st, job, f, res){
  const out={ id:job.id, title:job.title, grade:res.grade, score:res.score, parts:res.parts, pay:0, costs:0, notes:['Practice flight: no pay, and nothing was added to your logbook or career.'], ok:true, story:'', jobKind:'practice' };
  if(f.verified) out.notes.push(`Recorded by MSFS: touchdown at ${f.simFpm} fpm${f.simBounces?`, ${f.simBounces} bounce${f.simBounces>1?'s':''}`:''}.`);
  st.active=null; st.last={job, res, out, f}; save(); return out;
}
/* Bonus objectives that MSFS can judge by itself. */
function judgeBonusObjective(job, f){
  try{ const b=job.bonus; if(b && f){ const A=f.tda;
    if(b.auto==='zone') f.bonus = !!(A && A.zone==='aim'); else if(b.auto==='center') f.bonus = !!(A && !A.approx && Math.abs(A.xt)<=10); else if(b.auto==='comfort') f.bonus = f.comfort!=null && f.comfort>=90; else if(!b.auto) f.bonus = false; } }catch(_){}
}

/* The basic result: pay, checkride pass/fail, reputation, the story chapter, the logbook and the clock. */
function settleFlight(st, job, f, res){
  const a=AC[job.ac]; const p=plan(job); const sc = job.scen?SCEN[job.scen]:null;
  const chapter = job.kind==='story' ? STORY.find(x=>x.id===job.story) : null;
  const altOut = chapter && ALT_OUT[chapter.id] ? ALT_OUT[chapter.id](st) : null;   // outcome text that depends on earlier choices
  const out = { id:job.id, title:job.title, grade:res.grade, score:res.score, parts:res.parts, pay:0, costs:0, notes:[], ok:true, story:'', jobKind:job.kind };
  const landedAt = f.landedAt || job.to;
  const expectedDivert = sc && sc.divert;
  const divertedOk = landedAt!==job.to && (expectedDivert || f.scen==='book');
  // pay
  let factor = 0.6 + res.score/100*0.6;
  if(res.crash){ factor=0; out.ok=false; }
  else if(landedAt!==job.to && !job.local && !divertedOk){ factor*=0.4; out.notes.push(`You landed at ${landedAt} instead of ${job.to}, so the client pays only part of the fare.`); }
  else if(landedAt!==job.to && !job.local){ out.notes.push(`Diverting was the right call. The client pays in full, and Coral Wing arranges onward transport.`); st.stats.diverts++; }
  if(job.kind==='check'){
    const n=job.tasks.length, done=(f.tasks||[]).length;
    const pass = !res.crash && res.score>=70 && done/n>=0.8 && f.landing!=='hard';
    out.pass = pass;
    if(pass){ st.ratings[job.rating]=true; out.notes.push(`Passed. You now hold the ${RATINGS[job.rating].n}.`); addJournal(st,`Earned: ${RATINGS[job.rating].n}`, `${CAST[job.chars[0]].n} signs the logbook. ${RATINGS[job.rating].unlocks}`, job.chars, 'milestone'); st.rep[job.chars[0]] = clamp(st.rep[job.chars[0]]+5,0,100); }
    else { st.cooldown[job.rating] = st.day+1; out.notes.push(`Not this time. You need a score of 70 or more, at least 80% of the tasks done, and no hard landing. You can retest after a day's rest.`); }
  } else {
    let gross = Math.round(job.pay*factor);
    if(job.company){ const rev = Math.round(gross*2.6); const cb = companyFlightCost(st, job, res.block); const cost = cb.total; out.pay = rev; out.costs = cost; out.costBreak = cb; txn(st, rev, 'Company revenue', job.title); txn(st, -cb.fuel, 'Fuel', job.title); txn(st, -cb.maint, 'Maintenance', job.title); txn(st, -cb.fees, 'Landing & handling fees', job.title); const f2 = st.company.fleet.find(x=>x.ac===job.ac && !x.hired); if(f2){ f2.cond = Math.max(30, f2.cond - (f.landing==='hard'?6:f.landing==='firm'?1.2:0.6)); f2.flights=(f2.flights||0)+1; } }
    else { out.pay = gross; txn(st, gross, 'Flight pay', job.title); }
    if(res.grade==='A' && !res.crash){ const bonus = Math.round(job.pay*0.1/10)*10; if(!job.company && bonus>0){ txn(st, bonus, 'Tips & bonuses', 'Client tip'); out.notes.push(`Client tip for an excellent flight: ${money(bonus)}.`); out.pay += bonus; } }
  }
  if(res.crash){ const fine = Math.round(Math.max(2000, (a.price||5e6)*0.002)); txn(st, -fine, 'Accidents & fines', job.title); out.costs += fine; out.notes.push(`Accident investigation, insurance excess and repairs: ${money(fine)}.`); st.stats.crash++; }
  // reputation
  const repDelta = res.crash?-12 : {A:3,B:2,C:0,D:-2,F:-4}[res.grade];
  st.reputation = clamp(st.reputation + repDelta, 0, 100);
  // story
  if(job.kind==='story'){
    const m = chapter;
    if(!res.crash){ st.story.done[m.id]=true; }
    const tone = res.crash ? 'bad' : toneOf(res);
    out.story = res.crash ? `The mission ends with an accident report instead of a happy client. You can try this chapter again.` : (altOut||m.out)[tone];
    if(!res.crash){ for(const k in (m.rep||{})){ st.rep[k] = clamp((st.rep[k]||10) + (tone==='bad'? Math.round(m.rep[k]/3) : m.rep[k]), 0, 100); } }
    if(!res.crash && m.reward){ if(m.reward.voucher){ st.voucher = m.reward.voucher; } if(m.reward.bonus){ txn(st, m.reward.bonus, 'Gifts & windfalls', m.title); out.pay += m.reward.bonus; } if(m.reward.note) out.notes.push(m.reward.note); }
    addJournal(st, `${m.title}`, out.story, m.chars, 'story', res.grade);
  } else if(job.kind==='gen'){
    const line = res.crash ? `The ${job.label.toLowerCase()} ended badly at ${landedAt}.` : `${job.client}: ${job.label.toLowerCase()} from ${AP[job.from].isl} to ${AP[landedAt].isl}, grade ${res.grade}.`;
    const ar = ARCH.find(x=>x.id===job.arch); if(ar && ar.char && !res.crash){ st.rep[ar.char] = clamp((st.rep[ar.char]||10) + ({A:4,B:3,C:1,D:0,F:-2}[res.grade]), 0, 100); }
    addJournal(st, job.title, line, ar&&ar.char?[ar.char]:[], 'flight', res.grade);
  }
  // logbook & stats
  if(f.verified){ out.notes.push(`Recorded by MSFS: touchdown at ${f.simFpm} fpm${f.simBounces?`, with ${f.simBounces} bounce${f.simBounces>1?'s':''}`:''}.`); }
  st.minutes += res.block; st.flights += 1; st.stats[f.landing] = (st.stats[f.landing]||0)+1; st.stats.nm += p.dist; if(job.scen && f.scen==='book') st.stats.scen++;
  const firstType = !st.types[job.ac]; st.types[job.ac] = (st.types[job.ac]||0) + 1; if(firstType && !res.crash) out.notes.push(`New type in your logbook: ${a.n}.`);
  const firstAp = !st.visited[landedAt]; st.visited[landedAt]=true; if(firstAp && !AP[landedAt].water) out.notes.push(`First landing at ${AP[landedAt].n}, ${AP[landedAt].isl}.`);
  st.log.unshift({ id:uid(), day:st.day, dep:job.dep, from:job.from, to:landedAt, ac:job.ac, min:res.block, grade:res.grade, score:res.score, pay:out.pay-out.costs, title:job.title, kind:job.kind, landing:f.landing, verified:!!f.verified, fpm:f.verified?f.simFpm:null });
  st.log = st.log.slice(0,300);
  // clock
  const start = Math.max(st.clock, job.dep);
  st.duty += Math.min(60, start - st.clock) + res.block + 30; st.clock = start + res.block + 30;
  st.loc = AP[landedAt].water ? job.from : landedAt; // after a water landing you return to base
  if(AP[landedAt].water) out.notes.push(`After the water landing you fly back to ${job.from} (not logged separately).`);
  st.active = null; st.last = { job, res, out, f };
  if(st.clock >= 1440){ out.notes.push(`It's past midnight. Time to rest.`); }
  afterFlight(st, job, f, res, out);
  st.jobsKey = '';
  return out;
}

/* The steps that run after the basic result, in order. Each gets (st, job, f, res, was) where "was" holds
   values from before the flight was settled; st.last.out is the result sheet. A step that fails is skipped. */
const AFTER_RESULT = [
  /* Expert: landing below the legal fuel reserve is fined */
  function expertFuelFine(st, job, f, res){ if(job.practice) return;
    if(diff()==='expert' && !res.crash && job.kind!=='check' && res.fuelMin!=null && res.fuelMin < plan(job).reserveMin*0.75 && AC[job.ac].fuel!=='elec'){ const fine=Math.max(250, Math.round(job.pay*0.2/10)*10); txn(st,-fine,'Accidents & fines','Landed below reserve fuel'); const o=st.last&&st.last.out; if(o){ o.costs=(o.costs||0)+fine; o.notes.push(`Expert: you landed with ${res.fuelMin} min of fuel, below the legal reserve. The authority fines you ${money(fine)}.`); } st.reputation=clamp(st.reputation-2,0,100); } },
  /* reputation is harder to gain the more you have */
  function slowReputation(st, job, f, res, was){ if(job.practice) return; const before=was.reputation; const d=st.reputation-before;
    if(d>0){ const scaled = d * Math.max(0.15, 1 - before/110); st._repFrac = (st._repFrac||0) + scaled; const whole=Math.floor(st._repFrac); st._repFrac -= whole; st.reputation = clamp(before + whole, 0, 100); } },
  function unlocks(st, job){ if(job.practice) return; checkUnlocks(); },
  function flightLogFile(st, job, f, res){ if(job.practice) return; if(f && f.verified) writeFlightLog(job, f, res); },
  /* cabin requests, and a fair deal when you divert for fuel or weather */
  function cabinAndDiversion(st, job, f, res){ if(job.practice) return; const o=st.last&&st.last.out; if(!o) return; const rec=S.sim&&S.sim.recorder;
    if(job.ask && !res.crash){ const met=askMet(job, rec); if(met===true){ txn(st, job.ask.amt, 'Tips & bonuses', 'Cabin request'); o.pay+=job.ask.amt; o.notes.push(`Cabin request done: +${money(job.ask.amt)}. The passengers noticed.`); } else if(met===false) o.notes.push(`Cabin request not done this time. No harm done.`); }
    const landed=f.landedAt||job.to; if(!res.crash && !job.local && !job.scen && landed!==job.to && AP[landed]){ const w=(S.sim&&S.sim.ext&&S.sim.ext.weather)||null; const lowFuel = res.fuelMin!=null && res.fuelMin < plan(job).reserveMin*1.2; const badWx = w && (w.visSm<3 || w.windKt>AC[job.ac].xw+5 || w.inCloud) || job.wx.ifr;
      if(lowFuel || badWx){ const extra=Math.round(job.pay*0.35/10)*10; txn(st, extra, 'Flight pay', 'Diversion allowance'); o.pay+=extra; o.notes.push(`Good call diverting to ${landed} (${lowFuel?'fuel':'weather'}). The client pays three quarters of the fare.`); st.reputation=clamp(st.reputation+1,0,100); } } },
  /* there are no duty hours: landing after midnight simply starts the next day */
  function rollDay(st){ st.duty=0; const o=st.last&&st.last.out; if(o) o.notes=o.notes.filter(n=>!/past midnight/i.test(n)); if(st.clock>=1440){ rest(st); if(o) o.notes.push('A new day starts with fresh jobs on the board.'); } },
  /* one-off special flights are marked done and get their own outcome text */
  function specialFlight(st, job, f, res){ if(job.special && !res.crash){ st.specialDone=st.specialDone||{}; st.specialDone[job.special]=1; const m=SPECIALS.find(x=>x.id===job.special); const o=st.last&&st.last.out; if(m && o){ o.story=m.out[toneOf(res)]; } } },
  /* the main story: Castillo's work starts with chapter CR4; each chapter adds Power and Heat; legit jobs cool Heat */
  function storyPowerHeat(st, job, f, res){ const c=crime(st); const o=st.last&&st.last.out;
    if(job.kind==='story' && CRIME_IDS.has(job.story) && !res.crash){
      if(job.story==='CR4') c.on=true;
      else if(c.on){ crBump(c,'power',2); crBump(c,'heat',4); }
      if(o){ const m=CRIME.find(x=>x.id===job.story); if(m && m.choice) o.notes=o.notes.filter(n=>!/^Choices stick/.test(n)); } }
    else if(c.on && !res.crash && job.kind==='gen'){ crBump(c,'heat',-2); } },
  /* network runs add Heat; at Heat 60+ customs may search you, at 90+ you're busted */
  function customs(st, job, f, res){ const c=crime(st); const o=st.last&&st.last.out; if(!c.on || res.crash) return;
    if(job.network){ crBump(c,'heat',7); crBump(c,'power',1); }   // (a network run is also a 'gen' job, so the −2 above already ran: net +5)
    if((job.network || job.kind==='story') && o){
      if(c.heat>=90){ txn(st,-50000,'Payoffs',`Lawyers, ${job.to}`); crBump(c,'power',-10); c.heat=50; o.notes.push(`BUSTED at ${job.to}. Customs found the hidden compartment. The network's lawyers got you out for $50,000. Power −10, Heat down to 50.`); try{ setTimeout(()=>takeover({kind:'orders',kicker:'Busted',title:`Customs at ${job.to}`,text:`They found the hidden compartment. The network's lawyers got you out, for $50,000.`,ms:9000}),600); }catch(_){} }
      else if(c.heat>=60){ if(res.grade==='A'||res.grade==='B'){ o.notes.push(`Customs came out to the plane, but a clean landing and calm answers got you waved through. Heat −5.`); crBump(c,'heat',-5); }
        else { const cost=Math.round(c.heat*60/10)*10; txn(st,-cost,'Payoffs',`Customs at ${job.to}`); crBump(c,'heat',-15); o.notes.push(`Customs searched the plane at ${job.to}. Your people made it go away for ${money(cost)}. Heat −15. (A cleaner landing gets you waved through.)`); } } } },
  /* the outcome text follows the choices you made earlier */
  function storyOutcomeText(st, job, f, res){ if(job.kind==='story' && CRIME_IDS.has(job.story) && !res.crash){ const o=st.last&&st.last.out; const m=CRIME.find(x=>x.id===job.story); const mm=dynM(st,m); const outs=job.out||mm.out;
    const tone=toneOf(res); if(o && outs && outs[tone]) o.story=outs[tone]; } },
  /* a mid-flight choice is echoed in the next chapter only */
  function clearEcho(st, job, f, res){ const c=crime(st); if(job.kind==='story' && CRIME_IDS.has(job.story) && !res.crash && c.echo && c.echo.from!==job.story) c.echo=null; },
  /* failing a chapter has consequences, and you fly it again */
  function failedChapter(st, job, f, res){ if(job.kind==='story' && CRIME_IDS.has(job.story)){ const c=crime(st); const o=st.last&&st.last.out;
    if(res.crash){ delete st.story.done[job.story]; if(c.on){ crBump(c,'heat',8); crBump(c,'power',-5); } if(o) o.notes.unshift('The chapter failed. You can fly it again from the Main story page.'); st.last.failed=true; }
    else if(res.grade==='D'||res.grade==='F'){ if(c.on){ crBump(c,'heat',4); } st.last.sloppy=true; } save(); } },
  /* network runs flown low or with the transponder off */
  function lowAndDark(st, job, f, res, was){ const T=was.track; const o=st.last&&st.last.out; if(!o||res.crash||!job.network) return;
    if(job.lowLevel && T && T.air>120){ const frac=T.low/T.air; if(frac>=0.6){ const b=Math.round(job.pay*0.25/10)*10; txn(st,b,'Network','Under the radar bonus'); o.notes.push(`Under the radar: ${Math.round(frac*100)}% of the flight below 1,000 ft. Bonus ${money(b)}.`); } else o.notes.push(`Only ${Math.round(frac*100)}% of the flight was below 1,000 ft. No radar bonus.`); }
    if(T && T.xpdrSeen && T.dark>T.air*0.5){ crBump(crime(st),'heat',-3); o.notes.push('You flew most of it with the transponder in standby. Heat −3.'); }
    if(job.hot){ crBump(crime(st),'heat',3); } },
  /* a search or a bust makes the airport hot for a few days */
  function hotAirport(st, job){ const o=st.last&&st.last.out; if(o && o.notes.some(n=>/^Customs searched|^BUSTED/.test(n))){ const c=crime(st); c.hot=c.hot||{}; c.hot[job.to]=st.day; o.notes.push(`${job.to} is a hot airport for the next few days: more pay, more Heat.`); } },
  /* network money is dirty: it has to be laundered before you can spend it */
  function dirtyCash(st, job, f, res, was){ if(job.network && !res.crash){ const gained=st.cash-was.cash; if(gained>0){ const c=crime(st); c.dirty=(c.dirty||0)+gained; st.cash-=gained; const o=st.last&&st.last.out; if(o) o.notes.unshift(`${money(gained)} is dirty cash. Launder it before you can spend it.`); save(); } } },
  /* crew perks: the loaders take 2 Heat off a network run; Dez halves a payoff */
  function crewPerks(st, job, f, res, was){ const c=crime(st); if(job.network && crewHas(st,'loaders') && c.heat>was.heat) crBump(c,'heat',-2);
    const o=st.last&&st.last.out; if(crewHas(st,'dez') && o){ const p=fin(st).ledger.slice(0,6).find(x=>x.c==='Payoffs' && x.a<0); if(p && !p.halved){ p.halved=1; txn(st,Math.round(-p.a/2),'Payoffs','Dez knew a guy (half back)'); o.notes.push('Dez knew a guy: half the payoff came back.'); } } },
  /* the result screen shows what changed */
  function powerHeatDelta(st, job, f, res, was){ const c=crime(st); st.last.delta={power:c.power-was.power, heat:c.heat-was.heat}; },
  function achievements(st, job, f, res, was){ const o=st.last&&st.last.out; if(o && o.notes.some(n=>/^Under the radar:/.test(n))) crime(st).radar=1; checkAch(st); const fresh=ACH.filter(a=>st.ach&&st.ach[a.id]&&!was.ach.has(a.id)); fresh.forEach((a,i)=>setTimeout(()=>achPop(a), 1200+i*2600)); },
  /* while the feds are watching, legit work cools Heat faster; a bust closes the airport to you */
  function fedsAndBans(st, job, f, res){ const c=crime(st); if(!c.on||res.crash) return; if(!job.network && job.kind==='gen' && fedsWatching(st)) crBump(c,'heat',-2); const o=st.last&&st.last.out; if(o && o.notes.some(n=>/^BUSTED/.test(n))){ c.ban=c.ban||{}; c.ban[job.to]=st.day; o.notes.push(`${job.to} is closed to you for 3 days.`); } },
  /* New Game+: Heat rises half again as fast */
  function newGamePlusHeat(st, job, f, res, was){ const c=crime(st); if(c.ng && c.heat>was.heat) crBump(c,'heat',Math.round((c.heat-was.heat)*0.5)); },
];

function applyResult(st, job, f, res){
  S.fmMenu=false; S.openJob=null;   // flight mode resets, so the next flight starts clean
  const c=crime(st);
  const was = { power:c.power, heat:c.heat, cash:st.cash, ach:new Set(Object.keys(st.ach||{})), track:st.active&&st.active.track, reputation:null };
  setupWarnedOutcome(st, job);
  easeCheckride(job, f, res);
  let out;
  if(job.practice) out = practiceResult(st, job, f, res);
  else {
    judgeBonusObjective(job, f);
    was.reputation = st.reputation;
    const act=st.active; if(job.scen && f.auto && !f.scen && act && act.scenPlan) f.scen = scenVerdict(job, f, act.scenPlan);
    const rec = st.active ? simRecFor(st.active) : null;
    out = settleFlight(st, job, f, res);
    if(rec && st.last){ st.last.replay = { track:(rec.track||[]).slice(-300), approach: rec.approach||null, td: rec.touchdown||null }; }
  }
  for(const step of AFTER_RESULT){ try{ step(st, job, f, res, was); }catch(_){} }
  return out;
}

/* ---------- extras after a flight ---------- */

/* Wear on the aircraft you flew (not company aircraft). */
function wearAirframe(st, job, f, res, out){
  const A=airframe(st, job.ac); const t=(job._cab&&job._cab.tally)||{}; const why=[];
  let dmg = 1;
  if(res.crash){ dmg+=60; why.push('accident'); }
  else if(f.landing==='hard'){ dmg+=12; why.push('hard landing'); } else if(f.landing==='firm'){ dmg+=3; }
  if(f.simBounces>1){ dmg+=3*(f.simBounces-1); why.push('bounced landing'); }
  if(f.simG && f.simG>1.8){ dmg+=8; why.push(`${f.simG} G touchdown`); }
  if(t.flapOver){ dmg+=8*t.flapOver; why.push('flap overspeed'); } if(t.flapDmg){ dmg+=20; why.push('flap damage'); }
  if(t.overspeed){ dmg+=6*t.overspeed; why.push('overspeed'); } if(t.gearOver){ dmg+=8; why.push('gear overspeed'); }
  if(f.landing==='butter' && !res.crash) dmg=Math.max(0,dmg-1);
  if(!res.crash) dmg=Math.min(dmg,12);
  A.h = Math.max(0, A.h - dmg); A.log.unshift({day:st.day, d:dmg, why:why.join(', ')||'normal wear'}); A.log=A.log.slice(0,10);
  if(dmg>=10 && !job.lend){ const cost=Math.round(dmg*18/10)*10; txn(st,-cost,'Accidents & fines',`Damage deductible: ${AC[job.ac].n}`); out.costs=(out.costs||0)+cost; out.notes.push(`Dez inspected the ${AC[job.ac].n}: ${why.join(', ')}. Your damage deductible is ${money(cost)}.`); }
  out.notes.push(`${AC[job.ac].n} airframe health: ${A.h}%${dmg>1?` (−${dmg})`:''}.`);
  if(A.h < 25){ A.grounded = st.day + (A.h<15?3:2); out.notes.push(`It's grounded for repairs until day ${A.grounded}. Dez is not happy.`); addJournal(st, `${AC[job.ac].n} grounded`, `Dez takes one look and reaches for his toolbox. "This one sits until I say so."`, ['dez'], 'flight'); }
}
/* One flight never costs more than 12% health (unless you crash), and an aircraft at 25%+ can fly. */
function capWear(st, job, res, out, before){
  try{ const A=st.airframes&&st.airframes[job.ac]; if(A && !res.crash){ const lost=before-A.h; if(lost>12){ A.h=before-12; if(A.log[0]) A.log[0].d=12; } if(A.h>=25) A.grounded=0; out.notes=out.notes.map(n=>/airframe health:/.test(n)?n.replace(/\d+%( \(−\d+\))?/, `${A.h}%${before-A.h>1?` (−${before-A.h})`:''}`):n); } }catch(_){}
}
/* Weekly challenges and personal records (not after a crash). */
function weeklyAndRecords(st, job, f, res, out){
  const W=weeklyState(st); const to=st.log[0]?st.log[0].to:job.to; const c={st,job,f,res,out,to,fpm:f.verified?f.simFpm:null};
  for(const ch of weekPicks(W.key)){ if(W.done[ch.id]) continue;
    if(ch.set){ W.sets[ch.id]=W.sets[ch.id]||[]; const k=ch.key(c); if(k && !W.sets[ch.id].includes(k)) W.sets[ch.id].push(k); W.prog[ch.id]=W.sets[ch.id].length; }
    else if(ch.test(c)) W.prog[ch.id]=(W.prog[ch.id]||0)+1;
    if((W.prog[ch.id]||0)>=ch.goal){ W.done[ch.id]=true; txn(st, ch.cash, 'Gifts & windfalls', `Weekly challenge: ${ch.n}`); st.reputation=clamp(st.reputation+2,0,100); out.pay+=ch.cash; out.notes.push(`Weekly challenge complete: ${ch.n}! +${money(ch.cash)}, reputation +2.`); }
  }
  if(!W.champ && weekPicks(W.key).every(ch=>W.done[ch.id])){ W.champ=true; txn(st, 1000, 'Gifts & windfalls', 'Weekly champion'); out.pay+=1000; out.notes.push(`All three weekly challenges done. Weekly champion bonus: ${money(1000)}.`); st.weeksWon=(st.weeksWon||0)+1; }
  const R = st.records = st.records || {};
  const nm = plan(job).dist;
  if(f.verified && (R.fpm==null || f.simFpm < R.fpm.v)) { R.fpm={v:f.simFpm, at:`${job.from}→${to}`, day:st.day}; out.notes.push(`New personal record: softest landing, ${f.simFpm} fpm.`); }
  if(!job.local && (R.long==null || nm > R.long.v)) R.long={v:nm, at:`${job.from}→${to}`, day:st.day};
  if(R.score==null || res.score > R.score.v) R.score={v:res.score, at:`${job.from}→${to}`, day:st.day};
  if(job.pax && typeof job.comfort==='number' && (R.comfort==null || job.comfort > R.comfort.v)) R.comfort={v:job.comfort, at:`${job.from}→${to}`, day:st.day};
  R.streak = res.grade==='A' ? (R.streak||0)+1 : 0; if(!R.bestStreak || R.streak > R.bestStreak) R.bestStreak = R.streak;
}

function afterFlight(st, job, f, res, out){
  const s=st.stats; const landedAt = f.landedAt || job.to;
  const cabin = job._cab;
  const healthBefore = st.airframes && st.airframes[job.ac] ? st.airframes[job.ac].h : 100;
  // counters
  st.landedAt = st.landedAt || {}; if(!res.crash){ st.landedAt[landedAt] = (st.landedAt[landedAt]||0)+1; }
  if(isNight(job.dep)) s.night=(s.night||0)+1;
  if(job.wx.ifr) s.ifr=(s.ifr||0)+1;
  if(!job.local && ZONE(AP[job.from].c)!==ZONE(AP[landedAt].c)) s.intl=(s.intl||0)+1;
  if(AP[landedAt].water && !res.crash) s.water=(s.water||0)+1;
  if(job.arch==='relief' || job.story==='HR1' || job.story==='HR2') s.relief=(s.relief||0)+1;
  if(job.festival) s.festival=(s.festival||0)+1;
  s.aStreak = res.grade==='A' ? (s.aStreak||0)+1 : 0;
  // bonus objective
  if(job.bonus && !res.crash){
    let met = !!f.bonus;
    if(job.bonus.auto==='fpm' && f.verified) met = f.simFpm < 150;
    if(job.bonus.auto==='fpm' && !f.verified) met = f.landing==='butter' || (f.landing==='smooth' && !!f.bonus);
    if(job.bonus.auto==='block') met = f.block <= plan(job).est*1.1 + 2;
    out.bonusMet = met;
    if(met){ const amt = job.company ? Math.round(job.bonus.amt*2.6) : job.bonus.amt; txn(st, amt, 'Tips & bonuses', 'Bonus objective'); out.pay += amt; s.bonus=(s.bonus||0)+1; out.notes.push(`Bonus objective met: ${job.bonus.text.replace(/\.$/,'')}. +${money(amt)}.`); }
    else out.notes.push(`Bonus objective missed: ${job.bonus.text.replace(/\.$/,'')}.`);
  }
  // review
  const rv = makeReview(st, job, f, res);
  if(rv){ st.reviews = st.reviews || []; st.reviews.unshift(rv); st.reviews = st.reviews.slice(0,60); out.review = rv; }
  if(job.mystery) s.mystery=(s.mystery||0)+1;
  surpriseAfter(st, job, f, res, out);
  finAfterFlight(st, job, f, res, out);
  out.ach = checkAch(st);
  out.rank = rankOf(st).name;
  // Starling charter clients remember good flights
  if(job.arch==='starling' && !res.crash){ st.rep.vivienne = clamp((st.rep.vivienne||10) + ({A:3,B:2,C:1,D:0,F:-2}[res.grade]||0), 0, 100); if(res.grade==='A' || res.grade==='B') st.rep.abe = clamp((st.rep.abe||10)+1,0,100); }
  // passenger comfort
  if(job.pax && typeof job.comfort==='number' && !res.crash){
    out.notes.push(`Passenger comfort: ${job.comfort}/100.`);
    if(job.comfort>=90 && !job.company){ const tip=Math.max(20, Math.round(job.pay*0.08/10)*10); txn(st, tip, 'Tips & bonuses', 'Comfort bonus'); out.pay += tip; out.notes.push(`The passengers loved the ride: ${money(tip)} comfort bonus.`); }
    else if(job.comfort<50){ st.reputation = clamp(st.reputation-2,0,100); out.notes.push(`A rough ride. Word gets around: reputation −2.`); }
  }
  // the instructor's summary
  { const line = coachSummary(job, cabin); if(line) out.notes.push(line); }
  // flying in real MSFS weather pays a bonus
  { const W=job._wx; if(W && !res.crash && !job.company){ const rough = W.maxWind>=25 || W.minVis<3 || W.cloud;
      if(rough){ const b=Math.max(25, Math.round(job.pay*0.15/10)*10); txn(st, b, 'Tips & bonuses', 'Weather bonus'); out.pay += b; out.notes.push(`You flew real MSFS weather (${W.maxWind} kt max wind${W.minVis<3?`, ${W.minVis} sm visibility`:''}${W.cloud?', in cloud':''}): ${money(b)} weather bonus.`); } }
    setTimeout(()=>{ maybeCall(st, 0.22); },0); }
  if(!res.crash) weeklyAndRecords(st, job, f, res, out);
  // difficulty
  if(diff()==='expert' && !res.crash && job.kind!=='check' && !job.company){ const b=Math.round(out.pay*0.15/10)*10; if(b>0){ txn(st,b,'Tips & bonuses','Expert pay'); out.pay+=b; out.notes.push(`Expert difficulty: +${money(b)} (15%).`); } }
  if(diff()==='casual' && job.comfort!=null && job.comfort<50) st.reputation=clamp(st.reputation+2,0,100); // undo the rough-ride penalty
  // urgent jobs: the 2× rate needs wheels up inside the window
  if(job.realtime && job.wheelsUpBy && !res.crash){ const t = job._toAt || null;
    if(!t || t > job.wheelsUpBy){ const cut=Math.round(out.pay/2/10)*10; txn(st,-cut,'Flight pay','Missed urgent window'); out.pay-=cut; out.notes.push(t?`Wheels up ${Math.round((t-job.wheelsUpBy)/60000)} min late: the 2× urgent rate became standard pay.`:`MSFS didn't record a takeoff, so the urgent 2× rate couldn't be confirmed. Paid at the standard rate.`); }
    else out.notes.push(`Wheels up with ${Math.round((job.wheelsUpBy-t)/60000)} min to spare. Full 2× urgent pay.`); }
  if(!job.company) wearAirframe(st, job, f, res, out);
  // each passenger's verdict, and their tips
  { const M=job.manifest; if(M && !res.crash){
      const t=(job._cab&&job._cab.tally)||{}; const v=M.map(p=>Object.assign({p}, paxVerdict(p,job,f,res,t))); out.manifest=v;
      const tips = v.reduce((sum,x)=>sum + (x.s===5 ? (x.p.trait==='vip'?60:20) : 0), 0);
      if(tips>0 && !job.company){ txn(st,tips,'Tips & bonuses','Passenger tips'); out.pay+=tips; out.notes.push(`Passenger tips: ${money(tips)}.`); } } }
  // the weekly landing league
  if(st.log[0] && !st.log[0].at) st.log[0].at=Date.now();
  { const rows=leagueRows(st); const i=rows.findIndex(x=>x.me); if(i===0 && f.verified && rows.length>1) out.notes.push(`You're top of this week's landing league, ahead of ${rows[1].n}.`); else if(i>0 && f.verified) out.notes.push(`Landing league: you're #${i+1} this week. ${rows[0].n} leads with ${rows[0].fpm} fpm.`); }
  capWear(st, job, res, out, healthBefore);
}

/* ---------- a new day ---------- */

function rest(st){
  const cashBefore = st.cash;
  backupNow(st);
  st.day += 1; st.clock = 420; st.duty = 0; st.jobsKey = '';
  const net = companyTick(st);
  finDaily(st); newDayBrief(st); checkAch(st);
  st.call=null; maybeCall(st, 0.35);
  // aircraft are repaired overnight: 12% a day, 24% while grounded; anything at 25%+ can fly again
  for(const id in (st.airframes||{})){ const A=st.airframes[id]; A.h=Math.min(100, A.h + (isGrounded(st,id)?24:12)); if(A.h>=25) A.grounded=0; }
  // Heat: Boss rank cools it; hot airports cool off after 3 days
  try{ const c=crime(st); if(c.power>=85) crBump(c,'heat',-2); for(const k in (c.hot||{})) if(st.day-c.hot[k]>3) delete c.hot[k]; }catch(_){}
  // fleet upkeep and crew wages; a safehouse cools Heat
  try{ const c=crime(st); const L=dailyCosts(st); const tot=L.reduce((s,x)=>s+x[1],0); if(tot){ txn(st,-tot,'Operation','Fleet upkeep and crew wages'); setTimeout(()=>toast(`Daily costs: ${money(tot)} for your fleet and crew.`),400); }
    const lv=safeLevel(st); if(lv>=0) crBump(c,'heat',-(lv+1)); }catch(_){}
  // lying low while the feds watch cools Heat faster
  try{ if(fedsWatching(st)) crBump(crime(st),'heat',-4); }catch(_){}
  // Heat cools by 1 every day on its own
  try{ const c=crime(st); if(c.on) crBump(c,'heat',-1); }catch(_){}
  // daily costs never push cash below zero: what you can't pay costs Heat instead
  try{ if(st.cash<0 && cashBefore>=0){ const short=-st.cash; txn(st, short, 'Operation', 'Costs you couldn\'t cover (owed to Castillo\'s people)'); const c=crime(st); if(c.on) crBump(c,'heat',2); setTimeout(()=>toast(`You couldn't cover ${money(short)} of today's costs. People talk: Heat +2.`), 600); } }catch(_){}
  return net;
}

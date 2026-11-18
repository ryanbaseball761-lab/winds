/* ===================== THINGS THAT HAPPEN IN THE AIR (0.68) =====================
   All of these need MSFS live; without it nothing fires and nothing is lost.
   - ATC instructions on ordinary flights: a heading for traffic, a new altitude. Fly them.
   - Failures: an oil pressure warning or an electrical problem. Get it on the ground in time.
   - Intercepts: on a network run while you're hot, the Coast Guard comes up alongside.
   - Fuel lies: on some of Castillo's flights the fuel load is short. Check the slip before you go.
   - Contraband weight: what you carry for Castillo weighs something, and you're told what.
   - Night runs are checked against the sim's own clock.
   - Approaches are graded: stable by 500 ft, or not.
   - A customs search plays out as a short scene. */

/* ---------- new order types: heading, altitude, land within N minutes ---------- */
/* judgeOrder (flight-orders.js) hands these three kinds here */
function judgeOrderMore(a, o, s){
  const now=Date.now(), el=(now-o.t0)/1000, rec=simRecFor(a), landed=!!(rec && rec.touchdown && rec.touchdown.t>o.t0) || s.motion.onGround;
  const hold=(cond, need)=>{ if(cond){ o.okSince=o.okSince||now; if((now-o.okSince)/1000>=need) return 'ok'; } else o.okSince=null; return null; };
  if(o.k==='heading'){ if(landed) return 'fail'; const d=Math.abs(((s.position.hdg-o.hdg+540)%360)-180); const r=hold(d<=(o.tol||15), o.sec||90); if(r) return r; return (!o.okSince && el>(o.within||75)) || el>ORDER_LIMIT_SEC ? 'fail' : null; }
  if(o.k==='altitude'){ if(landed) return 'fail'; const d=Math.abs((s.position.altFt||0)-o.alt); const r=hold(d<=(o.tol||200), o.sec||45); if(r) return r; return (!o.okSince && el>(o.within||180)) || el>ORDER_LIMIT_SEC ? 'fail' : null; }
  if(o.k==='landwithin'){ if(landed) return el/60<=o.min ? 'ok' : 'fail'; return el/60>o.min+0.5 ? 'fail' : null; }
  return null; }
/* the live readout on the order chip for those kinds (orderChipHTML calls this) */
function orderChipExtra(o){ if(o.state!=='active') return '';
  let extra=''; const s=S.sim; if(o.k==='heading' && s&&s.position) extra=` · now ${String(Math.round(s.position.hdg)).padStart(3,'0')}°`; if(o.k==='altitude' && s&&s.position) extra=` · now ${Math.round(s.position.altFt||0).toLocaleString()} ft`;
  if(o.k==='landwithin'){ const left=Math.max(0, Math.round(o.min*60-(Date.now()-o.t0)/1000)); extra=` · ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')} left`; }
  return extra; }

/* ---------- what each flight might throw at you ---------- */
function fevHash(id){ let h=2166136261; for(const ch of String(id)) { h^=ch.charCodeAt(0); h=Math.imul(h,16777619)>>>0; } return h/4294967296; }
function fevPlan(a){ if(a.fev) return a.fev; const j=a.job, c=crime(S.st), r=fevHash(j.id+'|fev'), d=diff();
  let type=null;
  if(j.kind==='gen' && !j.practice){
    const failP = d==='casual'?0 : d==='expert'?0.12 : 0.05;
    if(j.network && c.on && c.heat>=50 && r<0.3) type='intercept';
    else if(r<failP) type='failure';
    else if(r<failP+0.35) type = fevHash(j.id+'|atc')<0.5 ? 'atc-hdg' : 'atc-alt';
  }
  a.fev={type, done:false}; return a.fev; }

function callsign(){ const st=S.st; const co=st.company&&st.company.name ? st.company.name.split(' ')[0] : 'Coral Wing'; const n=String((st.pilot&&st.pilot.name||'X').length*7+21); return `${co} ${n}`; }
const R10=x=>Math.round(x/10)*10;

function fevFire(a){ const s=S.sim, f=a.fev, cs=callsign(); f.done=true; save();
  if(f.type==='atc-hdg'){ const turn=fevHash(a.job.id+'|lr')<0.5?-1:1; const hdg=((R10(s.position.hdg)+turn*40)%360+360)%360||360; const h3=String(hdg).padStart(3,'0');
    showBeat(a,{who:'radio', text:`${cs}, turn ${turn<0?'left':'right'} heading ${h3}, vectors for traffic. Maintain it for one and a half minutes.`}, 'atc');
    startOrder(a,{k:'heading', hdg, tol:15, sec:90, within:75, label:`ATC: fly heading ${h3}`, atc:true, ok:{text:`${cs}, traffic no longer a factor, resume own navigation. Thanks for the help.`}, fail:{text:`${cs}, I said heading ${h3}. Traffic passed a mile off your nose.`}, who:'radio'}); }
  else if(f.type==='atc-alt'){ const alt0=s.position.altFt||0; const up = alt0<8000; const alt=Math.round((alt0+(up?1000:-1000))/500)*500; const fl=alt>=18000?`flight level ${Math.round(alt/100)}`:`${alt.toLocaleString()} feet`;
    showBeat(a,{who:'radio', text:`${cs}, ${up?'climb':'descend'} and maintain ${fl}, traffic at your altitude.`}, 'atc');
    startOrder(a,{k:'altitude', alt, tol:200, sec:45, within:180, label:`ATC: ${up?'climb':'descend'} to ${alt.toLocaleString()} ft`, atc:true, ok:{text:`${cs}, thanks, resume own navigation.`}, fail:{text:`${cs}, you're not at the altitude I gave you. Say intentions.`}, who:'radio'}); }
  else if(f.type==='failure'){ const kind=fevHash(a.job.id+'|fk')<0.5?'oil':'elec';
    const text = kind==='oil' ? `Oil pressure is in the yellow and falling. You have maybe twenty minutes of engine left.|Land somewhere. Anywhere with a runway.` : `The alternator light comes on. Battery only from here: you have about twenty minutes of electrics.|Find a runway.`;
    showBeat(a,{who:'self', text}, 'fail');
    startOrder(a,{k:'landwithin', min:20, label:'Land within 20 minutes', fail2:kind, ok:{text: kind==='oil'?`The mechanic finds a cracked oil line. "Another ten minutes and you'd have been swimming."`:`On the ground with the battery at nine volts. The mechanic says it was the regulator.`}, fail:{text:`You stretched it. The engine is worse for it, and so is the bill.`}}); }
  else if(f.type==='intercept'){
    showBeat(a,{who:'radio', timed:30, timedDefault:0, text:`${callsign()}, this is the U.S. Coast Guard, off your left wing. Reduce speed and maintain your heading.|A white HC-144 is sitting off your wing.`, opts:[
      {t:`Comply`, reply:`You pull the power back and keep it straight.`, order:{k:'slow', pct:0.8, sec:120, within:60, label:'Coast Guard: slow down and hold your heading', ok:{text:`They photograph your tail, take their time, and peel away. They'll remember you.`, heat:3}, fail:{text:`You didn't slow down. They follow you all the way to the ground.`, heat:9}}},
      {t:`Run for it`, reply:`Full power. Nose up.`, order:{k:'climb', by:3000, sec:120, label:'Climb 3,000 ft and lose them', ok:{text:`Into the cloud tops and gone. They never got your registration.`, heat:2, power:2}, fail:{text:`A turboprop full of radar beat you. They have your tail number now.`, heat:12}}}]}, 'icpt'); }

  if(a.order && a.order.atc){ setTimeout(()=>toast(`You: "${a.order.label.replace(/^ATC: /,'').replace(/^fly heading/,'Heading')}, ${cs}."`), 2500); } }

/* fires once, in cruise, when nothing else is going on */
SIM_TICK.push(function flightEvents(){ const a=S.st&&S.st.active; if(!a || !a.started || S.simState!=='live') return; const s=S.sim; if(!s||!s.motion||!s.position) return;
  const rec=s.recorder; if(rec && rec.takeoff && a.toMin==null){ a.toMin=simMinutes(); }
  if(a.job.fuelLie && !a.fuelChecked && !a.fuelLieSaid && rec && rec.takeoff && (Date.now()-rec.takeoff.t)>90000){ a.fuelLieSaid=1; save(); showBeat(a,{who:'self', text:`The fuel gauges read lower than the slip said. A lot lower.|Somebody shorted your fuel. Plan for it.`}, 'fuel'); return; }
  const f=fevPlan(a); if(!f.type || f.done) return; if(a.order && a.order.state==='active') return;
  if(f.type==='intercept' && (!a.cgCall || Date.now()-a.cgCall<60000)) return;   // the radio warning comes first, then the HC-144 shows up if(document.querySelector('.beat, .cut')) return;
  if(s.motion.onGround || (s.position.aglFt||0)<1500 || !rec || !rec.takeoff || (Date.now()-rec.takeoff.t)<4*60000) return;
  try{ if(window.speechSynthesis && speechSynthesis.speaking) return; }catch(_){}
  const ph=beatPhase(a); if(!ph || !ph.cruise || ph.descent) return;
  fevFire(a); });

/* ---------- Castillo's fuel lies and the weight of what you carry ---------- */
const STORY_FUEL_LIE = new Set(['CR6','CR8','CR10','CRM','CR11','CRB']);
GEN_JOB_STEPS.push(function contrabandWeight(st, L){ if(!L) return; for(const j of L){ if(j.network && !j.contraband && AC[j.ac]){ j.contraband=Math.round(Math.min(1400, AC[j.ac].useful*0.22)/10)*10; try{ const p=plan(j); const room=Math.round((AC[j.ac].useful-p.total-30)/10)*10; j.contraband=Math.max(0,Math.min(j.contraband,room)); if(!j.contraband) delete j.contraband; }catch(_){} } if(j.network && j.night==null) j.night = j.dep>=1170 || j.dep<330; } return L; });
/* contraband weight and the short-fuel trick on story flights (storyJob in jobs.js calls this) */
function storyJobExtras(st, j){
  if(crime(st).on && AC[j.ac]){ j.contraband=Math.round(Math.min(2000, AC[j.ac].useful*0.25)/10)*10; try{ const p=plan(j); const room=Math.round((AC[j.ac].useful-p.total-30)/10)*10; j.contraband=Math.max(0,Math.min(j.contraband,room)); if(!j.contraband) delete j.contraband; }catch(_){} }
  if(STORY_FUEL_LIE.has(j.story) && fevHash(String(st.pilot&&st.pilot.name)+j.story)<0.5) j.fuelLie=true;
}
/* the fuel truck shorts you on some story flights (loadIntoSim in 061-core.js calls this first) */
async function loadFuelLie(job){ const a=S.st&&S.st.active;
  if(a && job.fuelLie && !a.fuelChecked && S.mcp){ const p=plan(job); const gal=Math.ceil(p.gal*0.68); try{ const r=await S.mcp.callTool(SIM_SERVER,'load_aircraft',{fuelGal:gal},{cache:false}); let o=r.payload; if(typeof o==='string'){ try{o=JSON.parse(o);}catch(_){} } toast(o&&o.ok?`The fuel truck has been and gone. ${o.fuel!=null?o.fuel+' gal':''} on board, says the slip.`:'Couldn\'t load fuel.'); }catch(_){ toast('Couldn\'t reach MSFS to load fuel.'); } setTimeout(()=>simPoll(true),800); renderPreflight(); return true; }
  return false; }

/* ---------- after the flight ---------- */
function approachVerdict(R){ const A=R&&R.approach; if(!A || A.length<20) return null; const low=A.filter(x=>x[1]<=500 && x[1]>20); if(low.length<8) return null;
  const speeds=low.map(x=>x[2]).sort((a,b)=>a-b); const med=speeds[Math.floor(speeds.length/2)];
  const bad=low.filter(x=> x[3]<-1100 || x[3]>-150 && x[1]>80 || Math.abs(x[2]-med)>12 ).length; const pct=Math.round(100*(1-bad/low.length));
  return {pct, stable:pct>=80, med:Math.round(med)}; }
AFTER_RESULT.push(function flightAftermath(st, job, f, res){ if(job.practice) return; const a=S._lastActive; const o=st.last&&st.last.out; if(!o) return; const c=crime(st);
  // ATC and failures
  if(a && a.order && a.order.label && /^Coast Guard|^Climb 3,000 ft and lose/.test(a.order.label)) o.notes.push(a.order.state==='ok' ? `Coast Guard intercept: ${a.order.label.startsWith('Coast')?'you complied, and they let you go':'you outran them'}.` : `Coast Guard intercept: it didn't go your way.`);
  if(a && a.order && a.order.atc){ if(a.order.state==='ok'){ st.reputation=Math.min(100,st.reputation+1); o.notes.push('You followed ATC to the letter. Reputation +1.'); } else if(a.order.state==='fail'){ o.notes.push('ATC filed a note about you not following instructions.'); } }
  if(a && a.order && a.order.k==='landwithin'){ if(a.order.state==='ok'){ const b=R10(job.pay*0.3); txn(st,b,'Tips & bonuses','Handled an in-flight failure'); o.pay+=b; o.notes.push(`You handled the failure and got her down in time: ${money(b)} from the owner, who'd rather pay you than an insurer.`); }
    else if(a.order.state==='fail'){ const cost=Math.max(800, R10(job.pay*0.5)); txn(st,-cost,'Repairs','Engine damage after a failure'); o.costs+=cost; o.notes.push(`You pushed a sick airplane too far. Repairs: ${money(cost)}.`); } }
  // fuel
  if(job.fuelLie){ if(a && a.fuelChecked){ if(c.on) crBump(c,'power',1); o.notes.push(`You caught the short fuel load before engine start. Castillo's man swore it was a mistake. Power +1.`); }
    else o.notes.push(`Someone shorted your fuel and you flew it anyway. Next time, read the slip.`); }
  // night
  if(job.network && job.night && a && a.toMin!=null){ const m=a.toMin; const dark = m>=1170 || m<330; if(dark){ crBump(c,'heat',-2); o.notes.push('You flew it in the dark like you were told. Heat −2.'); } else { crBump(c,'heat',4); o.notes.push('A night run, flown in broad daylight. Anyone could have seen you. Heat +4.'); } }
  // approach
  const R=st.last.replay; const v=approachVerdict(R); if(v && !res.crash){ st.last.approachV=v; if(v.stable){ o.notes.push(`Stable approach: ${v.pct}% of the last 500 ft inside the limits at about ${v.med} kt.`); if(o.score!=null) o.score=Math.min(100,o.score+2); }
    else o.notes.push(`Unstable approach: only ${v.pct}% of the last 500 ft inside the limits. Sink under 1,000 fpm, speed within 10 kt.`); }
});

/* ---------- a customs search plays out as a scene ---------- */
AFTER_RENDER.push(function customsScene(){ const st=S.st, L=st&&st.last; if(!S.showResult || !L || !L.out || document.querySelector('.cut')) return; const key=(L.job&&L.job.id)+'|cs'; st._csSeen=st._csSeen||{}; if(st._csSeen[key]) return; st._csDay=st._csDay||{}; const dayK=L.job.to+'|'+st.day;
  const n=L.out.notes||[]; const searched=n.find(x=>/^Customs searched/.test(x)), waved=n.find(x=>/^Customs came out to the plane/.test(x)), busted=n.find(x=>/^BUSTED/.test(x)); if(!searched && !waved && !busted) return;
  st._csSeen[key]=1; const ks=Object.keys(st._csSeen); if(ks.length>30) delete st._csSeen[ks[0]]; if(st._csDay[dayK]){ save(); return; } st._csDay[dayK]=1; save(); const to=L.job.to;
  const shots = busted ? [[`Ramp, ${to}`,'radio',`${callsign()}, shut down where you are. Do not taxi.`],[`Ramp, ${to}`,'self',`Four cars. Blue lights. Someone already has the cargo door open.`],[`Ramp, ${to}`,'self',`A dog finds the panel behind the seats in under a minute.`]]
    : searched ? [[`Ramp, ${to}`,'radio',`${callsign()}, customs requests you hold position after landing.`],[`Ramp, ${to}`,'self',`Two officers with a flashlight and a lot of time. One of them taps the cargo floor with his knuckles.`],[`Ramp, ${to}`,'self',`A phone call later, they're gone. Your people paid. It won't be cheap.`]]
    : [[[`Ramp, ${to}`,'self',`An officer walks out to the plane at ${to}, clipboard first.`],[`Ramp, ${to}`,'self',`He reads every line of the paperwork. Then he looks at you for a long time.`],[`Ramp, ${to}`,'self',`"Welcome back," he says, and walks away.`]],
       [[`Ramp, ${to}`,'self',`Customs at ${to} sends the young one this time. He's nervous. So are you.`],[`Ramp, ${to}`,'self',`He opens the cargo door, looks for exactly two seconds, and closes it again.`],[`Ramp, ${to}`,'self',`Someone already had a word with him.`]],
       [[`Ramp, ${to}`,'self',`A customs van parks nose to nose with your plane at ${to}.`],[`Ramp, ${to}`,'self',`The officer inside finishes his sandwich, waves, and drives away.`]]][Math.floor(fevHash(key)*3)];
  setTimeout(()=>{ try{ const night=st.clock>=1110||st.clock<390; cutscene({shots, art:(typeof SCENES!=='undefined'&&SCENES.ramp)?(night&&SCENES.cockpit?SCENES.cockpit():SCENES.ramp()):'', replay:true}); }catch(_){} }, 1500); });

/* beat options are equal choices too */
(function(){ const s=document.createElement('style'); s.textContent=`html.ckp .beat .bt-o .btn{background:transparent!important;border-color:var(--line-2)!important;color:var(--ink)!important}html.ckp .beat .bt-o .btn:hover{border-color:var(--amb)!important;color:var(--amb)!important}`; document.head.appendChild(s); })();

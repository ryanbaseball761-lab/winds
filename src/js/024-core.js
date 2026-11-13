/* ===================== FLIGHT ACADEMY ===================== */
const SETUP_172 = `Free flight in MSFS: Cessna 172 Skyhawk G1000 at TNCM (Princess Juliana), runway 10, clear skies, light wind.`;
const hold = (m, key, cond, sec) => { const now=Date.now(); if(!cond){ m[key]=0; return false; } if(!m[key]) m[key]=now; return now-m[key] >= sec*1000; };
const LESSONS = [
 {id:'L1', n:`Set up your controls`, lvl:'Ground school', min:10, icon:'🎮',
  why:`Most "the plane has a mind of its own" problems are controller setup: a stick that isn't centered, two devices fighting over one axis, or no dead zone. Fixing this first makes every other lesson easier.`,
  setup:`MSFS main menu → Settings → Controls.`,
  steps:[
   {t:`Pick your joystick in the device list and check each axis moves the right control: pitch, roll, throttle, and rudder (twist or pedals).`},
   {t:`Open Sensitivity. Let go of the stick: the roll and pitch bars should sit dead center. If they don't, add a 5–10% dead zone.`, check:(s,x)=> x && Math.abs(x.controls.yokeX)<0.05 && Math.abs(x.controls.yokeY)<0.05 && s.motion.onGround, live:`Stick reads centered`},
   {t:`Unplug or unbind any controller you don't use (an old gamepad can quietly fight your stick).`},
   {t:`Learn the keys you'll use most: flaps F6/F7 (one notch up/down), throttle F2/F3, brakes "." and parking brake Ctrl + ".", elevator trim Num 7 / Num 1.`},
   {t:`Assistance: for learning, turn auto-rudder ON and leave "aircraft damage" ON so mistakes teach you something.`}],
  tips:[`Keys listed are MSFS defaults; yours may differ. Search any action by name in the Controls page.`],
  real:`Real pilots do a "controls free and correct" check before every takeoff: full movement each way, watching the control surfaces move the right direction.`},
 {id:'L2', n:`Engine start and taxi`, lvl:'Beginner', min:10, icon:'🔑', setup:`Same as before, but start "cold and dark" at a parking spot if you want the full experience.`,
  why:`Taxiing is where the flight starts. Too fast and you can't stop; ride the brakes and you'll wear them out.`,
  steps:[
   {t:`Start the engine. Use the checklist on the in-sim tablet, or Ctrl + E for auto-start.`, check:s=>s.systems && s.systems.engineRunning, live:`Engine running`},
   {t:`Release the parking brake (Ctrl + ".").`, check:s=>s.systems && s.systems.engineRunning && !s.systems.parkingBrake, live:`Brake released`},
   {t:`Taxi at a brisk walking pace, 5–15 knots, for 20 seconds. Steer with the rudder.`, check:(s,x,m)=>hold(m,'tx', s.motion.onGround && s.motion.gs>=4 && s.motion.gs<=18, 20), live:`Taxi speed held`},
   {t:`Stop and set the parking brake.`, check:s=>s.motion.onGround && s.motion.gs<1 && s.systems && s.systems.parkingBrake, live:`Stopped, brake set`}],
  tips:[`If the plane keeps turning, check the rudder axis isn't drifting, and use small, early inputs.`,`Over 15 knots in a 172 on the ground is too fast.`],
  real:`Student pilots usually do their first engine start on lesson one. Real airports have taxiway signs (yellow for direction, red for "hold short"), and you need a clearance to cross a runway.`},
 {id:'L3', n:`Your first takeoff`, lvl:'Beginner', min:10, icon:'🛫', setup:SETUP_172,
  why:`A good takeoff is smooth and boring: full power, straight down the centerline, lift off at the right speed, climb at the best rate.`,
  steps:[
   {t:`Line up on the centerline. Full throttle (F4), and keep it straight with the rudder.`, check:s=>s.motion.onGround && s.motion.ias>20, live:`Rolling`},
   {t:`At about 55 knots, gently pull back to lift off (that's "rotate").`, check:s=>!s.motion.onGround && s.motion.ias>=45, live:`Airborne`},
   {t:`Climb at about 74 knots (best rate of climb, "Vy") for 30 seconds. Use pitch to control speed.`, check:(s,x,m)=>hold(m,'vy', !s.motion.onGround && s.motion.ias>=66 && s.motion.ias<=84 && s.motion.vsFpm>200, 30), live:`Holding Vy`},
   {t:`Keep climbing through 1,500 feet above the ground.`, check:s=>!s.motion.onGround && s.position.aglFt>1500, live:`Above 1,500 ft`}],
  tips:[`Pitch controls speed, power controls climb. Too fast? Raise the nose a little. Too slow? Lower it.`,`The 172 wants to pull left on takeoff. A little right rudder keeps it straight (auto-rudder does this for you).`],
  real:`In a real 172 you'd feel the plane "get light" near 50 knots. Most instructors let students fly their first takeoff with hands hovering nearby.`},
 {id:'L4', n:`Straight, level and trimmed`, lvl:'Beginner', min:10, icon:'⚖️', setup:`Airborne at 2,500–3,500 ft, cruise power (about 2,300 RPM in the 172).`,
  why:`Trim takes the pressure off the controls so the plane flies itself. If you're constantly pushing or pulling, you're working too hard.`,
  steps:[
   {t:`Level off: vertical speed near zero.`, check:s=>!s.motion.onGround && Math.abs(s.motion.vsFpm)<200 && s.position.aglFt>1000, live:`Level`},
   {t:`Trim the nose (Num 7 nose down, Num 1 nose up) until you can let go and it stays level.`},
   {t:`Hold your altitude within 100 feet for 60 seconds.`, check:(s,x,m)=>{ const alt=s.position.altFt; if(m.ref==null || Math.abs(alt-m.ref)>100){ m.ref=alt; m.lv=0; } return !s.motion.onGround && hold(m,'lv', true, 60); }, live:`Altitude held`}],
  tips:[`Make a change, wait a few seconds, then trim again. Trim chases the attitude you set; it isn't a steering wheel.`],
  real:`"Attitude, power, trim" is drilled into every student pilot. It works in a Cessna and in a 747.`},
 {id:'L5', n:`Turns without losing altitude`, lvl:'Beginner', min:10, icon:'🔄', setup:`Airborne at 3,000 ft, level and trimmed.`,
  why:`In a turn, part of the wing's lift tilts sideways, so the nose wants to drop. A little back pressure keeps you level.`,
  steps:[
   {t:`Roll into a 20–30° bank and hold it for 10 seconds.`, check:(s,x,m)=>x && hold(m,'bk', Math.abs(x.attitude.bank)>=18 && Math.abs(x.attitude.bank)<=32, 10), live:`Bank held`},
   {t:`Fly a full 360° turn while holding altitude within 150 ft.`, check:(s,x,m)=>{ if(!x) return false; const h=s.position.hdg, a=s.position.altFt; if(m.h==null){ m.h=h; m.a0=a; m.turn=0; return false; } let d=h-m.h; if(d>180) d-=360; if(d<-180) d+=360; m.h=h; if(Math.abs(a-m.a0)>150){ m.turn=0; m.a0=a; } if(Math.abs(x.attitude.bank)>10) m.turn+=Math.abs(d); return m.turn>=330; }, live:`360° complete`},
   {t:`Roll out on your original heading.`}],
  tips:[`Look outside at the horizon, not just the instruments. The nose should stay at the same spot on the horizon.`],
  real:`Steep turns (45° of bank) are part of the private pilot checkride. Trade Winds' Commercial checkride asks for them too.`},
 {id:'L6', n:`Mixture: what the co-pilot keeps telling you`, lvl:'Beginner', min:8, icon:'⛽', setup:`Airborne in the 172 at 3,000 ft or higher, cruise power.`,
  why:`Air gets thinner as you climb. The mixture knob (the red one) sets how much fuel goes in with that air. Too rich at altitude and the engine loses power, which is exactly what that "Incorrect fuel mixture" warning means.`,
  steps:[
   {t:`Climb above 3,000 ft.`, check:s=>!s.motion.onGround && s.position.altFt>3000, live:`Above 3,000 ft`},
   {t:`Lean slowly (H key, or drag the red knob out) and watch the RPM rise.`},
   {t:`When RPM peaks and starts to drop, push it back in a little, just rich of peak. That's best power.`},
   {t:`Before you descend to land, push the mixture back to full rich.`}],
  tips:[`Below about 3,000 ft on a hot island day, full rich is fine in a 172.`,`Leaning saves fuel and keeps spark plugs clean in real engines.`],
  real:`Real pilots lean on almost every flight. Forgetting to go full rich before landing is a classic mistake: the engine can stumble when you add power for a go-around.`},
 {id:'L7', n:`Flaps and speed limits`, lvl:'Intermediate', min:10, icon:'🪶', setup:SETUP_172 + ` Climb to 3,000 ft first.`,
  why:`Flaps let you fly slower and descend steeper, but they have speed limits. Lower them too fast and you can damage them, and a damaged flap on one side will roll you over. This is the lesson that fixes that.`,
  steps:[
   {t:`Slow below 110 knots: the top of the white arc on the airspeed tape.`, check:s=>!s.motion.onGround && s.motion.ias<110, live:`Below 110 kt`},
   {t:`Lower the first notch of flaps (F7).`, check:(s,x)=>x && x.flaps.handle>=1 && !x.flaps.overspeed, live:`Flaps 10°`},
   {t:`Slow below 85 knots, then add more flaps.`, check:(s,x)=>x && x.flaps.handle>=2 && s.motion.ias<85 && !x.flaps.overspeed, live:`Flaps 20°+ at safe speed`},
   {t:`Add power, speed up, and retract the flaps one notch at a time (F6).`, check:(s,x)=>x && x.flaps.handle===0 && s.motion.ias>70, live:`Flaps up`}],
  tips:[`The white arc on the airspeed tape is the flap range. Stay inside it with any flaps out.`,`In the Vision Jet the limits are higher: about 190 knots for the first notch and 150 for full. Check the airspeed tape in any plane.`],
  real:`Every airplane's flap speeds are printed in its handbook. Pilots call them "Vfe," and they're often written on a placard in the cockpit.`},
 {id:'L8', n:`Slow flight and stalls`, lvl:'Intermediate', min:12, icon:'⚠️', setup:SETUP_172 + ` Climb to at least 3,500 ft, over water.`,
  why:`A stall isn't the engine stopping. It's the wing running out of lift because the angle is too steep. Knowing what one feels like, and how to recover, is the most important safety skill in flying.`,
  steps:[
   {t:`Reduce power and slow to about 55 knots while holding altitude.`, check:(s)=>!s.motion.onGround && s.motion.ias<60 && Math.abs(s.motion.vsFpm)<400 && s.position.aglFt>1500, live:`Slow flight`},
   {t:`Power to idle and keep raising the nose gently until the stall horn sounds.`, check:(s,x,m)=>{ if(x && x.warnings.stall) m.stalled=true; return !!m.stalled; }, live:`Stall warning`},
   {t:`Recover: lower the nose, full power, wings level, then climb away.`, check:(s,x,m)=>m.stalled && s.motion.ias>65 && s.motion.vsFpm>0, live:`Recovered`}],
  tips:[`The first move is always to lower the nose. Pulling back makes a stall worse.`,`Keep the wings level with rudder, not big aileron inputs, near a stall.`],
  real:`Student pilots practice stalls early, with an instructor, at a safe altitude. It sounds scary; most students find it's not.`},
 {id:'L9', n:`Fly the traffic pattern`, lvl:'Intermediate', min:15, icon:'⬜', setup:SETUP_172 + ` Anguilla (TQPF) or St. Eustatius (TNCE) are quieter if you prefer.`,
  why:`The pattern is a rectangle around the runway that every pilot flies the same way, so everyone knows where everyone else is. It's how you practice landings.`,
  steps:[
   {t:`Take off and climb straight ahead.`, check:(s,x,m)=>{ if(s.motion.onGround && m.p0==null) m.p0={lat:s.position.lat,lon:s.position.lon}; return !s.motion.onGround && m.p0!=null; }, live:`Airborne`},
   {t:`Turn crosswind, then downwind, at about 1,000 ft above the runway. Hold it for 20 seconds.`, check:(s,x,m)=>hold(m,'dw', !s.motion.onGround && s.position.aglFt>800 && s.position.aglFt<1300, 20), live:`Pattern altitude`},
   {t:`Turn base, then final, and land on the same runway.`, check:(s,x,m)=>{ if(!s.motion.onGround) m.wasAir=true; return m.wasAir && s.motion.onGround && m.p0 && distNm({lat:s.position.lat,lon:s.position.lon}, m.p0) < 3; }, live:`Landed back`}],
  tips:[`Abeam the numbers on downwind: carb heat (in a 172), power back, first notch of flaps.`,`Turn base when the runway is about 45° behind your shoulder.`],
  real:`Students fly dozens of patterns ("touch and goes") before their first solo, which usually comes after 10–20 hours.`},
 {id:'L10', n:`The landing`, lvl:'Intermediate', min:15, icon:'🛬', setup:`MSFS: start "on approach" to TNCM runway 10 (pick the airport, then "Approach") in the 172.`,
  why:`Good landings come from good approaches. Get stable early (on speed, on glidepath, configured) and the landing almost takes care of itself.`,
  steps:[
   {t:`Below 600 ft: 60–75 knots, descending 300–800 fpm, for 10 seconds. That's a stable approach.`, check:(s,x,m)=>hold(m,'st', !s.motion.onGround && s.position.aglFt<600 && s.position.aglFt>80 && s.motion.ias>=58 && s.motion.ias<=78 && s.motion.vsFpm<-250 && s.motion.vsFpm>-850, 10), live:`Stable approach`},
   {t:`Over the runway: power to idle and gently raise the nose (the flare). Let it settle.`},
   {t:`Touch down softer than 200 fpm.`, check:(s,x,m)=>{ const r=s.recorder; return !!(m.recId && r && r.id===m.recId && r.touchdown && r.touchdown.fpm<200); }, live:`Soft touchdown`, needRec:true}],
  tips:[`Look at the far end of the runway during the flare, not the ground right in front of you.`,`If it doesn't feel right, go around: full power, climb, try again. Real pilots do.`],
  real:`Landings are what pilots talk about at the bar. Even airline captains judge their day by them.`},
 {id:'L11', n:`Crosswind landing`, lvl:'Advanced', min:15, icon:'🌬️', setup:`Same approach as before, but set MSFS weather to a 10–15 knot wind from 040° (across runway 10).`,
  why:`The trade winds don't always blow straight down the runway. Crosswind technique is what separates OK island pilots from good ones.`,
  steps:[
   {t:`Set at least 10 knots of wind in MSFS weather.`, check:(s,x)=>x && x.weather.windKt>=10, live:`Windy enough`},
   {t:`On final, point the nose into the wind (crab) so your track stays lined up with the runway.`},
   {t:`Just before touchdown, use rudder to line the nose up and lower the upwind wing to stop drifting.`},
   {t:`Touch down under 300 fpm on the upwind wheel first.`, check:(s,x,m)=>{ const r=s.recorder; return !!(m.recId && r && r.id===m.recId && r.touchdown && r.touchdown.fpm<300); }, live:`Crosswind landing`, needRec:true}],
  tips:[`Turn auto-rudder off for this one: you need your feet.`,`Keep holding the aileron into the wind as you slow down on the runway.`],
  real:`Every aircraft has a "demonstrated crosswind" number. In the 172 it's about 15 knots.`},
 {id:'L12', n:`Autopilot basics`, lvl:'Advanced', min:8, icon:'🤖', setup:`Airborne at 3,000 ft, level, in the 172 G1000 or the Vision Jet.`,
  why:`Autopilot is a tool for managing workload, not a replacement for flying. Knowing what mode it's in is the whole game.`,
  steps:[
   {t:`Engage the autopilot (Z, or the AP button on the panel).`, check:(s,x)=>x && x.autopilot, live:`Autopilot on`},
   {t:`Select heading mode (HDG) and turn the heading bug. Watch the plane follow.`},
   {t:`Let it fly for 60 seconds, then disconnect and hand-fly.`, check:(s,x,m)=>hold(m,'ap', x && x.autopilot, 60), live:`AP flew 60 s`}],
  tips:[`Read the mode annunciations at the top of the screen. Pilots say them out loud: "Heading, altitude hold."`],
  real:`Airline pilots usually hand-fly the takeoff and often the landing. The autopilot does the hours in between.`},
 {id:'L13', n:`Talking to ATC in MSFS`, lvl:'Advanced', min:10, icon:'🎧', setup:`Any flight from a towered airport, like TNCM.`,
  why:`MSFS's built-in ATC teaches the rhythm of real radio calls. Even with it turned off, knowing the phrases makes airports less scary.`,
  steps:[
   {t:`Open the ATC panel from the toolbar at the top of the screen.`},
   {t:`Request taxi clearance and read it back. The sim moves your radio frequencies for you if you let it.`},
   {t:`Before takeoff, contact the tower: "ready for departure." After landing, contact ground for taxi to parking.`},
   {t:`Try one flight with VATSIM or PilotEdge later: real people play the controllers.`}],
  tips:[`Keep calls short: who you're calling, who you are, where you are, what you want.`],
  real:`Radio work is a skill of its own. Most students say it's harder than flying for the first few weeks.`},
 {id:'L14', n:`From sim to sky: becoming a pilot`, lvl:'Real world', min:5, icon:'✈️', setup:`No sim needed.`,
  why:`Everything you just practiced is real. If any part of this made you want to fly for real, here's how people actually start.`,
  steps:[
   {t:`Book a discovery flight at a local flight school. Many schools offer an introductory lesson, and you'll usually fly the plane yourself.`},
   {t:`In the US you need a student pilot certificate and a medical certificate (usually third class for private pilots) before you solo.`},
   {t:`The private pilot license requires at least 40 hours of flight time under FAA Part 61; most people take longer. Europe's EASA PPL minimum is 45 hours.`},
   {t:`You'll pass a written knowledge test and a checkride (a flight test with an examiner). Then you can carry passengers.`}],
  tips:[`Sim time doesn't count toward a license, but sim pilots usually learn faster: you already know the panel and the procedures.`,`Costs and rules vary by country and school. Ask a local school for its numbers.`],
  real:`You can solo at 16 and earn a private license at 17 in the US. Plenty of airline pilots started exactly where you are: at home, in a sim.`}
];
VIEWS.push(['academy','Academy']); NAV_GROUPS.push(['academy']); NAV_GROUP_NAMES.push('Learn');
NAV_ICON.academy = `<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6"/>`;
VIEW_META.academy = ['Flight Academy','Learn to fly in MSFS, one skill at a time'];
function acad(st){ st.academy = st.academy || {cur:null, step:0, done:{}, mem:{}}; return st.academy; }
const ACAD_MEM = {}; // live-only timers
function academyTick(){
  const st=S.st; if(!st) return; const A=acad(st); if(!A.cur) return; const L=LESSONS.find(l=>l.id===A.cur); if(!L) return;
  const s=S.sim; if(!s || S.simState!=='live' || !s.motion) return; const x=s.ext||null; const m=ACAD_MEM[L.id]=ACAD_MEM[L.id]||{}; m.recId = A.recId;
  const step=L.steps[A.step]; if(!step || !step.check) return;
  let ok=false; try{ ok=!!step.check(s,x,m); }catch(e){ ok=false; }
  if(ok){ advance(st, L, 'live'); }
}
function advance(st, L, how){
  const A=acad(st); A.step++; if(how==='live'){ toast(`✓ ${L.steps[A.step-1].live || 'Step complete'}`); try{ if(window.speechSynthesis && voiceOn()){ const u=new SpeechSynthesisUtterance(L.steps[A.step]? 'Nice. Next: '+L.steps[A.step].t.split('.')[0] : 'Lesson complete. Well flown.'); u.volume=voiceVol(); speechSynthesis.speak(u); } }catch(_){} }
  if(A.step>=L.steps.length){ if(!A.done[L.id]){ A.done[L.id]=true; txn(st,150,'Licenses & training',`Academy: ${L.n}`); addJournal(st,`Academy: ${L.n}`,`Lesson complete. Abe signs the training record without looking up from his crossword.`,['abe'],'milestone');
      if(LESSONS.every(l=>A.done[l.id])) addJournal(st,`Flight Academy graduate`,`Every lesson complete. Mari pins a pair of wings on your shirt. "Now go fly something real someday," she says.`,['mari','abe'],'milestone'); }
    A.cur=null; A.step=0; toast(`Lesson complete: ${L.n}. +$150`); }
  save(); S.keepScroll=true; if(S.view==='academy') render();
}
async function startLesson(id){
  const st=S.st; const A=acad(st); A.cur=id; A.step=0; A.recId=null; ACAD_MEM[id]={}; save();
  const L=LESSONS.find(l=>l.id===id);
  if(L.steps.some(s=>s.needRec) && S.mcp && S.simState!=='nobridge' && !st.active){ try{ const r=await S.mcp.callTool(SIM_SERVER,'flight_recorder_reset',{label:'Academy: '+L.n},{cache:false}); let p=r.payload; if(typeof p==='string'){ try{p=JSON.parse(p);}catch(_){} } if(p&&p.recorderId){ A.recId=p.recorderId; save(); } }catch(_){} }
  S.keepScroll=false; render(); window.scrollTo(0,0);
}
function academyView(){
  const st=S.st; const A=acad(st); const done=LESSONS.filter(l=>A.done[l.id]).length; const live=S.simState==='live';
  const L = A.cur ? LESSONS.find(l=>l.id===A.cur) : null;
  const lessonPanel = L ? `<section class="panel stack lesson">
      <div class="row between"><div><p class="label">${esc(L.lvl)} · about ${L.min} min</p><h2>${L.icon} ${esc(L.n)}</h2></div><div class="row"><span class="chip ${live?'sea':''}">${live?'● MSFS live: steps check themselves':'Sim offline: tick steps yourself'}</span><button class="btn sm ghost" data-act="ac-stop">Leave lesson</button></div></div>
      <p class="brief">${esc(L.why)}</p>
      <div class="ac-setup"><b>Set up in MSFS</b><span>${esc(L.setup)}</span></div>
      <ol class="ac-steps">${L.steps.map((s,i)=>{ const state = i<A.step?'done':i===A.step?'now':''; return `<li class="${state}"><span class="n">${i<A.step?'✓':i+1}</span><div><p>${esc(s.t)}</p>${i===A.step?`<div class="row" style="margin-top:8px">${s.check&&live?`<span class="chip sea">Watching MSFS…</span>`:''}<button class="btn sm ${s.check&&live?'ghost':'primary'}" data-act="ac-next">${s.check&&live?'Skip':'Done'}</button></div>`:''}</div></li>`; }).join('')}</ol>
      <div class="grid-tips"><div><p class="label">Tips</p><ul class="tight small">${L.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div><div class="ac-real"><p class="label">In a real airplane</p><p class="small">${esc(L.real)}</p></div></div>
    </section>` : '';
  return `<main class="wrap stack fade">
    <section class="ac-hero"><div><p class="label" style="color:inherit;opacity:.8">Flight Academy</p><h1>Learn to fly, one skill at a time</h1><p>Short lessons you fly in MSFS while Trade Winds watches and coaches. With the sim connected, each step ticks itself off when you actually do it. Every lesson pays $150 toward your career.</p></div>
      <div class="ac-prog"><b>${done}/${LESSONS.length}</b><span>lessons complete</span><div class="meter"><i style="width:${done/LESSONS.length*100}%"></i></div></div></section>
    ${lessonPanel}
    <div class="ac-grid">${LESSONS.map((l,i)=>`<article class="ac-card ${A.done[l.id]?'done':''} ${A.cur===l.id?'cur':''}"><div class="ac-ic">${l.icon}</div><div style="min-width:0"><p class="label">Lesson ${i+1} · ${esc(l.lvl)}</p><h3>${esc(l.n)}</h3><p class="small muted">${esc(l.why.split('. ')[0].replace(/\.$/,''))}.</p><div class="row" style="margin-top:8px">${A.done[l.id]?'<span class="chip good">✓ Complete</span>':''}<span class="chip">${l.min} min</span><button class="btn sm ${A.cur===l.id?'':'primary'}" data-act="ac-start" data-id="${l.id}">${A.cur===l.id?'In progress':A.done[l.id]?'Fly again':'Start'}</button></div></div></article>`).join('')}</div>
  </main>`;
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="ac-start"],[data-act="ac-next"],[data-act="ac-stop"]'); if(!b || !S.st) return; const A=acad(S.st);
  if(b.dataset.act==='ac-start'){ startLesson(b.dataset.id); return; }
  if(b.dataset.act==='ac-stop'){ A.cur=null; A.step=0; save(); render(); return; }
  if(b.dataset.act==='ac-next' && A.cur){ advance(S.st, LESSONS.find(l=>l.id===A.cur), 'manual'); }
});

/* ===================== 1. A CHARACTER IN YOUR EAR: live coaching from real sim data ===================== */
const COACH_PILOTS = ['mari','abe','wilkins','dez','devries','marchetti','calloway','celeste'];
function shortName(k){ const n=CAST[k].n; const nick=n.match(/"([^"]+)"/); if(nick) return nick[1]; return n.replace(/^(Captain|Capitaine|Inspector|Examiner|Dr\.)\s+/,'').split(' ')[0]; }
function coachFor(job){
  if(job.lend) return 'abe';
  const c = (job.chars||[]).find(k=>COACH_PILOTS.includes(k) && CAST[k]);
  return c || 'mari';
}
function vappOf(acId){ const v=(AC[acId]&&AC[acId].v)||''; const m=v.match(/(?:Approach|Vref|Vapp)\s*~?\s*(\d+)/i); return m?Number(m[1]):null; }
const COACH = {
  flapOver:[`Too fast for flaps! Bring them back up and slow down first. That's exactly how flaps get torn off.`,`Flaps out at this speed? Up, now. Slow down, then try again.`],
  flapDmg:[`You've damaged a flap. Expect it to roll. Hold opposite aileron, keep the speed up a little and get it on the ground.`],
  flapSplit:[`Split flaps! One side isn't matching the other. Put the flaps back to where they match and hold opposite aileron.`],
  gearOver:[`Gear out above its speed limit. Slow down before you drop the wheels.`],
  gearUp:[`Gear! You're low and descending with the wheels up. Three green before you land.`],
  stall:[`Stall horn! Nose down, power up. Fly the airplane.`,`That's the stall warning. Lower the nose and add power. Now.`],
  overspeed:[`Overspeed! Power back and raise the nose gently.`],
  bank:[`Easy on the bank. Past 45° the passengers start praying.`,`That's a steep turn. Shallow it out, nobody's paying for aerobatics.`],
  sink:[`Sink rate! Too steep this low. If it's not stable by 500 ft, go around.`,`You're coming down like an elevator. Reduce the descent or go around.`],
  fast:[`You're fast on final. Target {v} knots. Power back.`,`Too much speed for this runway. Get it down to {v} or go around.`],
  slow:[`Watch your speed. You're well below {v} on final.`],
  noLight:[`Landing light on for takeoff, please. Island traffic loves a light they can see.`],
  stickOff:[`Before you go: your stick is reading {p}% roll input while you're parked. That'll pull you sideways all flight. Recalibrate it or add a dead zone in MSFS controls.`],
  rollNoInput:[`You're banking {b}° with the stick centered. Check your aileron trim and flaps; something is pulling you over.`],
  goodTakeoff:[`Nice rotation. Positive rate, now climb at Vy.`,`Clean departure. Keep it coordinated.`],
  stableApp:[`Stable approach. On speed, nice and steady. Keep it there.`],
  butter:[`Now THAT is how you land an airplane.`,`Greaser. I'm telling everyone.`]
};
function coachSummary(job, C){
  if(!C || !C.tally) return null; const t=C.tally; const bad=['flapOver','flapDmg','flapSplit','gearOver','gearUp','stall','overspeed','bank','sink','fast','slow'];
  const lbl={flapOver:'flap overspeed',flapDmg:'flap damage',flapSplit:'split flaps',gearOver:'gear overspeed',gearUp:'gear-up warning',stall:'stall warning',overspeed:'overspeed',bank:'steep bank',sink:'sink rate on final',fast:'fast on final',slow:'slow on final'};
  const items = bad.filter(k=>t[k]).map(k=>`${t[k]>1?t[k]+'× ':''}${lbl[k]}`);
  const who = shortName(coachFor(job));
  return items.length ? `${who}'s notes: ${items.join(', ')}.` : (t.stableApp ? `${who}'s notes: clean flight, stable approach. Keep flying like that.` : null);
}
/* hook into the live loop */
function calloutHTML(){ const a=S.st&&S.st.active; const c=a&&a.cab&&a.cab.callout; if(!c || Date.now()-c.t > 20000) return ''; return `<div class="callout"><span class="who">${esc(c.who)}</span><p>${esc(c.text)}</p></div>`; }
function cabinInner(){
  const a=S.st && S.st.active; if(!a) return '';
  const C=a.cab; const pax=a.job.pax>0; const live=S.simState==='live'; const coach=shortName(coachFor(a.job));
  const meter = pax ? `<div class="row between small"><span>Passenger comfort</span><b class="mono">${C?Math.round(C.comfort):100}/100</b></div><div class="meter ${C&&C.comfort<50?'bad':C&&C.comfort<80?'warn':''}"><i style="width:${C?C.comfort:100}%"></i></div>` : '';
  const feed = C && C.log.length ? `<ol class="feed">${C.log.slice(0,4).map(m=>`<li class="${m.kind||''}"><span class="who">${esc(m.who)}</span><span>${esc(m.text)}</span><time class="mono">${new Date(m.t).toTimeString().slice(0,5)}</time></li>`).join('')}</ol>`
    : `<p class="small muted">${live ? `${esc(coach)} is listening on the radio. Passengers, ATC and ${esc(coach)} react here as you taxi, take off, hit turbulence and land.` : `Connect the MSFS Bridge and the cabin comes alive: ${esc(coach)} coaches you live, and passengers and ATC react to what you actually do.`}</p>`;
  const voice = window.speechSynthesis ? `<button class="btn sm ghost voice-btn" data-act="sfx-toggle">${sfxOn()?'🎧 Sounds':'🎧 Off'}</button><button class="btn sm ghost voice-btn" data-act="voice">${voiceOn()?'🔊 Voices on':'🔇 Voices off'}</button>` : '';
  return `<div class="row between"><h3>Cabin &amp; radio</h3>${voice}<span class="chip ${live?'sea':''}">${live?'● Live':'Offline'}</span></div><p class="tiny muted">${esc(coach)} is riding along today.</p>${liveWxLine()}${meter}${feed}${pax?`<p class="tiny muted">Smooth flying keeps passengers happy. 90+ comfort earns a bonus tip.</p>`:''}`;
}
/* keep a reference to the cabin on the job so the debrief can read it after the flight closes */

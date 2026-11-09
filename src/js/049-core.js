/* ===================== PRO: in-sim panel setup, premium voices, copilot callouts, guided first flight, weekend events, Coast Watch ===================== */
function proPrefs(){ const st=S.st||{}; st.pro = st.pro || {copilot:true}; return st.pro; }

/* ---- 1. in-sim toolbar panel ---- */
function panelSetupHTML(){ if(!(window.twNative && twNative.panelSetup)) return '';
  return `<section class="panel stack"><div class="row between"><div><p class="label">MSFS toolbar</p><h3>Trade Winds inside the sim</h3></div><button class="btn sm primary" data-act="panel-setup">Set up the in-sim panel</button></div><p class="small muted">Adds a Trade Winds button to the MSFS toolbar: your job, checklist (tap to tick), live numbers, cabin feed, copilot calls and sealed orders, without alt-tabbing. One-time setup needs the free MSFS SDK; the folder that opens has a one-click installer and instructions.</p></section>`; }
document.addEventListener('click', async e=>{ if(!e.target.closest('[data-act="panel-setup"]')) return; const d=await twNative.panelSetup(); toast(d?'Opened the panel folder. Double-click build-and-install.bat.':'Couldn\'t prepare the panel files.'); });

/* ---- 2. premium voices: OpenAI TTS through the app, with Windows voices as the fallback ---- */
const PV = { on:false, q:[], cur:null, busy:false, warned:false };
const PV_F = ['coral','nova','shimmer','sage'], PV_M = ['ash','echo','onyx','fable','ballad'];
function pvFemale(v){ return !!(v && /zira|aria|jenny|hazel|susan|eva|female|libby|sonia|clara|natasha|catherine|linda|heera|michelle|emma|ava|samantha|karen|moira|tessa/i.test(v.name||'')); }
function pvVoiceFor(u){ const key=((u.voice&&u.voice.name)||'')+'|'+u.pitch+'|'+u.rate; let h=0; for(const c of key) h=(h*31+c.charCodeAt(0))>>>0; const L=pvFemale(u.voice)?PV_F:PV_M; return L[h%L.length]; }
function pvInstr(text){ if(/cleared|runway|contact|squawk|traffic|tower|approach/i.test(text)) return 'Calm air traffic controller on a radio frequency: clipped, efficient, neutral.'; if(/sealed orders/i.test(text)) return 'Serious dispatcher reading new orders over the radio.'; return 'Warm Caribbean-based pilot character speaking naturally in the cockpit, conversational, not theatrical.'; }
(function hookSpeech(){ if(!window.speechSynthesis || !window.twNative || !twNative.tts) return; const SS=window.speechSynthesis; const origSpeak=SS.speak.bind(SS), origCancel=SS.cancel.bind(SS);
  try{ twNative.ttsKeyHas().then(h=>{ PV.on = !!h && (localStorage.getItem('tw.pv')!=='off'); }); }catch(_){}
  async function next(){ if(PV.busy) return; const u=PV.q.shift(); if(!u) return; PV.busy=true;
    try{ const r=await twNative.tts(u.text, pvVoiceFor(u), pvInstr(u.text)); if(!r || r.error){ if(!PV.warned){ PV.warned=true; toast(r&&r.error==='bad_key'?'Premium voices: the OpenAI key was rejected. Using Windows voices.':'Premium voices unavailable right now. Using Windows voices.'); } PV.busy=false; origSpeak(u); return next(); }
      const au=new Audio('data:audio/mpeg;base64,'+r.audio); au.volume=Math.max(0,Math.min(1,u.volume==null?1:u.volume)); PV.cur=au;
      au.onended=au.onerror=()=>{ PV.cur=null; PV.busy=false; try{ u.onend && u.onend(); }catch(_){} next(); }; await au.play(); }
    catch(_){ PV.cur=null; PV.busy=false; origSpeak(u); next(); } }
  SS.speak = function(u){ if(!PV.on) return origSpeak(u); PV.q.push(u); if(PV.q.length>4) PV.q.splice(0, PV.q.length-4); next(); };
  SS.cancel = function(){ PV.q.length=0; if(PV.cur){ try{ PV.cur.pause(); }catch(_){} PV.cur=null; PV.busy=false; } origCancel(); };
  try{ Object.defineProperty(SS,'speaking',{configurable:true, get(){ return PV.busy || PV.q.length>0 || Object.getPrototypeOf(SS).__lookupGetter__('speaking').call(SS); }}); }catch(_){} })();
function premiumVoiceHTML(){ if(!(window.twNative && twNative.tts)) return `<p class="small muted">Premium voices are available in the Trade Winds app for Windows.</p>`;
  return `<div class="stack" style="gap:8px"><p class="label">Premium voices</p><p class="small muted">Natural AI voices for every character, the copilot and ATC, using your own OpenAI API key (create one at platform.openai.com). Lines are cached on your PC, so repeats are free; a typical flight costs about a cent. Your key stays on this PC, encrypted.</p>
    <div class="row"><input id="pv-key" type="password" placeholder="${PV.on?'Key saved. Paste a new one to replace it':'sk-...'}" style="max-width:320px"><button class="btn sm primary" data-act="pv-save">Save key</button>${PV.on?'<button class="btn sm" data-act="pv-test">▶ Test</button><button class="btn sm ghost" data-act="pv-clear">Remove key</button>':''}</div></div>`; }
document.addEventListener('click', async e=>{ const b=e.target.closest('[data-act="pv-save"],[data-act="pv-test"],[data-act="pv-clear"]'); if(!b || !window.twNative) return;
  if(b.dataset.act==='pv-save'){ const k=(document.getElementById('pv-key')||{}).value||''; if(!/^sk-/.test(k.trim())){ toast('That doesn\'t look like an OpenAI key (it starts with sk-).'); return; } await twNative.ttsKeySet(k.trim()); PV.on=true; PV.warned=false; try{ localStorage.setItem('tw.pv','on'); }catch(_){} toast('Premium voices saved.'); S.keepScroll=true; render(); }
  else if(b.dataset.act==='pv-clear'){ await twNative.ttsKeySet(''); PV.on=false; toast('Key removed. Using Windows voices.'); S.keepScroll=true; render(); }
  else { const u=new SpeechSynthesisUtterance(`This is Mari. Welcome aboard, Rookie. Flaps up, and let's go find some trade winds.`); const v=pickVoice(true,0); if(v) u.voice=v; u.volume=voiceVol(); speechSynthesis.speak(u); } });

/* ---- 3. copilot callouts from live sim data ---- */
function vrOf(acId){ const m=String(AC[acId]&&AC[acId].v||'').match(/(?:Vr|Lift-off)\s*~?(\d+)/); return m?Number(m[1]):55; }
const CP = { id:null, said:{}, lastAgl:null, lastT:0 };
function copilotSay(text, key){ if(CP.said[key]) return; CP.said[key]=1; S.copilotLast={text, t:Date.now()}; const a=S.st&&S.st.active; if(a && a.cab && a.cab.log){ const t=Date.now(); a.cab.log.unshift({t, who:'Copilot', text, kind:'copilot'}); a.cab.log=a.cab.log.slice(0,14); try{ VQ.lastT=Math.max(VQ.lastT,t); }catch(_){} }
  if(!(typeof voiceOn==='function' && voiceOn()) || !window.speechSynthesis) return; try{ const u=new SpeechSynthesisUtterance(text); const v=pickVoice(false,2)||pickVoice(false,0); if(v) u.voice=v; u.rate=1.08; u.pitch=0.95; u.volume=voiceVol(); speechSynthesis.speak(u); }catch(_){} }
function copilotTick(){ const a=S.st&&S.st.active, s=S.sim; if(!a || !a.started || proPrefs().copilot===false || S.simState!=='live' || !s || !s.motion || !s.position) return;
  if(CP.id!==a.job.id){ CP.id=a.job.id; CP.said={}; CP.lastAgl=null; }
  const m=s.motion, p=s.position, vr=vrOf(a.job.ac), rec=s.recorder||{}; const airborne=!m.onGround;
  if(m.onGround && !rec.takeoff && s.systems && s.systems.engineRunning){ if(m.ias>=30 && m.ias<vr-5) copilotSay('Airspeed alive.','alive'); if(m.ias>=vr) copilotSay('Rotate.','rotate'); }
  if(airborne && m.vsFpm>300 && p.aglFt<600 && CP.said.rotate) copilotSay('Positive rate.','posrate');
  const dest = a.job.local?AP[a.job.from]:AP[a.job.to]; const togo=distNm({lat:p.lat,lon:p.lon},dest);
  if(airborne && rec.takeoff && (togo<10 || (a.job.local && m.vsFpm<-200)) && m.vsFpm<-100){
    const agl=p.aglFt, prev=CP.lastAgl; const cross=h=>prev!=null && prev>h && agl<=h;
    if(cross(1000)) copilotSay('One thousand.','1000');
    if(cross(500)){ const ext=s.ext||{}; const gearOk = !(ext.gear&&ext.gear.retractable) || ext.gear.down; copilotSay(m.vsFpm<-1000 ? 'Five hundred. Sink rate!' : !gearOk ? 'Five hundred. Check gear!' : 'Five hundred, stable.','500'); }
    if(cross(100)) copilotSay('One hundred.','100'); if(cross(50)) copilotSay('Fifty.','50'); if(cross(30)) copilotSay('Thirty.','30'); if(cross(10)) copilotSay('Ten.','10');
  }
  if(m.onGround && rec.touchdown && !CP.said.td){ CP.said.td=1; const fpm=rec.touchdown.fpm; copilotSay(fpm<100?`Beautiful. ${fpm} feet per minute.`:fpm<250?`Nice landing.`:`Firm one. ${fpm} feet per minute.`,'tdcall'); }
  CP.lastAgl = p.aglFt;
  // poll faster close to the ground so the low callouts land on time
  const low = airborne && p.aglFt<400 && m.vsFpm<-50; clearTimeout(CP.fast); if(low) CP.fast=setTimeout(()=>{ try{ simPoll(true); }catch(_){} }, 500); }
const _cpSim = renderSimBits;
renderSimBits = function(){ _cpSim(); try{ copilotTick(); }catch(_){} };

/* ---- 4. guided first flight ---- */
const GUIDE = [
  {k:'load', t:'Load into MSFS', d:'Free flight at the departure airport, parked, engine off. Pick the aircraft on your boarding pass.', ok:(a,s)=>s && s.position && distNm({lat:s.position.lat,lon:s.position.lon},AP[a.job.from])<3},
  {k:'start', t:'Start the engine', d:'Work through the cockpit checklist, then start up. Ctrl+E auto-starts if you need it.', ok:(a,s)=>s && s.systems && s.systems.engineRunning},
  {k:'taxi', t:'Taxi to the runway', d:'Brakes off, a little power, under 15 knots. Follow the taxi lines.', ok:(a,s)=>s && s.motion && (s.motion.gs>3 || !s.motion.onGround)},
  {k:'takeoff', t:'Take off', d:'Full power, keep it straight with the rudder, and gently lift off at the rotate speed.', ok:(a,s)=>s && s.motion && !s.motion.onGround},
  {k:'climb', t:'Climb and head for the destination', d:'Climb to about 2,500 ft and point the nose at the destination on your map.', ok:(a,s)=>s && s.position && s.position.altFt>1800},
  {k:'land', t:'Approach and land', d:'Slow down early, flaps out, aim at the runway numbers, and flare just above the runway.', ok:(a,s)=>s && s.recorder && s.recorder.touchdown},
  {k:'park', t:'Park and shut down', d:'Taxi clear, set the parking brake, engine off. Trade Winds logs the flight for you.', ok:(a,s)=>s && s.recorder && s.recorder.blockIn}
];
function guideHTML(a){ const s=S.simState==='live'?S.sim:null; const G=a.guide=a.guide||{done:{}}; let cur=-1;
  GUIDE.forEach((g,i)=>{ if(!G.done[g.k] && s && g.ok(a,s)) G.done[g.k]=1; if(cur<0 && !G.done[g.k]) cur=i; });
  return `<section class="panel stack guide"><div class="row between"><div><p class="label">Your first flight</p><h3>Step ${Math.max(1,cur+1)} of ${GUIDE.length}: ${esc((GUIDE[cur]||GUIDE[GUIDE.length-1]).t)}</h3></div><button class="btn sm ghost" data-act="guide-hide">Hide guide</button></div>
    <ol class="guide-steps">${GUIDE.map((g,i)=>`<li class="${G.done[g.k]?'done':i===cur?'cur':''}"><b>${esc(g.t)}</b>${i===cur?`<span class="small">${esc(g.d)}</span>${!s?`<button class="btn xs" data-act="guide-next" data-k="${g.k}">Done</button>`:''}`:''}</li>`).join('')}</ol>
    ${!s?'<p class="tiny muted">MSFS isn\'t connected, so tick each step yourself.</p>':''}</section>`; }
function guideActive(){ const st=S.st, a=st&&st.active; return !!(a && st.flights<1 && !proPrefs().noGuide); }
const _gdFlight = flightView;
flightView = function(){ const h=_gdFlight(); if(!guideActive() || S.showResult || S.debrief) return h; const g=guideHTML(S.st.active); return h.replace(/(<main class="wrap[^>]*>[\s\S]*?<\/section>)/, (m)=>m+g); };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="guide-next"],[data-act="guide-hide"]'); if(!b||!S.st) return; if(b.dataset.act==='guide-hide'){ proPrefs().noGuide=true; } else { const a=S.st.active; if(a){ a.guide=a.guide||{done:{}}; a.guide.done[b.dataset.k]=1; } } save(); S.keepScroll=true; render(); });
const _gdSim = renderSimBits;
renderSimBits = function(){ _gdSim(); try{ if(guideActive() && S.view==='flight'){ const a=S.st.active; const before=JSON.stringify(a.guide||{}); guideHTML(a); if(JSON.stringify(a.guide)!==before){ S.keepScroll=true; render(); } } }catch(_){} };

/* ---- 5. weekend events ---- */
const WEEKEND = [
  {id:'flyin', n:'Anguilla Fly-In', ap:'TQPF', d:'Pilots from across the islands park wingtip to wingtip on the ramp. Barbecue, bad jokes and a spot-landing contest.'},
  {id:'regatta', n:'Antigua Sailing Week', ap:'TAPA', d:'Hundreds of yachts, thousands of sailors, and every one of them needs to get to English Harbour.'},
  {id:'jazz', n:'St Lucia Jazz Weekend', ap:'TLPL', d:'Musicians, fans and a lot of instrument cases. Charters into Hewanorra are booked solid.'},
  {id:'bonefish', n:'Bahamas Bonefish Classic', ap:'MYAM', d:'Anglers from Florida want the flats at dawn. Rods are long; tempers are short.'},
  {id:'carnival', n:'Carnival in Trinidad', ap:'TTPP', d:'Costumes, steel pans and the biggest party in the Caribbean. Everyone is flying to Port of Spain.'},
  {id:'airshow', n:'San Juan Air Show', ap:'TJSJ', d:'Warbirds, aerobatic teams and a crowd on the beach. Spectators and performers both need lifts.'},
  {id:'reggae', n:'Reggae Sumfest weekend', ap:'MKJS', d:'Montego Bay fills up for three nights of music. Every seat into Sangster is gold.'}
].filter(e=>AP[e.ap]);
function weekendEvent(st){ const d=dateOf(st.day); const wd=d.getUTCDay(); if(wd!==5 && wd!==6 && wd!==0) return null; const sat = wd===0 ? st.day-1 : wd===5 ? st.day+1 : st.day; const wk=Math.floor(sat/7); return WEEKEND[wk % WEEKEND.length]; }
const _weGen = genJobs;
genJobs = function(st){ const L=_weGen(st); const ev=weekendEvent(st); if(!ev || st.loc===ev.ap) return L;
  for(const j of L){ if(j.to===ev.ap && !j.local){ j.pay=Math.round(j.pay*1.35/10)*10; j.event=ev.n; } }
  let tries=0; while(L.filter(j=>j.to===ev.ap).length<2 && tries<25){ tries++; const arch=pick(ARCH.filter(a=>archOk(st,a) && !a.local && !a.airline)); const j=makeJob(st, arch, false); if(j && apOk(st, ev.ap, j.ac) && distNm(AP[st.loc],AP[ev.ap]) < AC[j.ac].range*0.8){ j.to=ev.ap; const p=plan(j); if(p.over>0||!p.range) continue; j.pay=Math.round(payFor(st,j)*1.35/10)*10; j.est=p.est; j.event=ev.n; j.title=`${ev.n}: ${j.title.replace(/ to .*$/,'')} to ${AP[ev.ap].isl}`; L.push(j); } }
  return L; };
function weekendBanner(st){ const ev=weekendEvent(st); if(!ev) return ''; return `<section class="panel weekend"><div class="row between"><div><p class="label">This weekend · ${esc(AP[ev.ap].isl)}</p><h3>${esc(ev.n)}</h3></div><span class="chip good">+35% pay to ${esc(ev.ap)}</span></div><p class="small">${esc(ev.d)}</p></section>`; }
const _weBoard = boardView;
boardView = function(){ const h=_weBoard(); if(S.view!=='board' || !S.st) return h; const b=weekendBanner(S.st); return b ? h.replace(/(<section><div class="section-title"><h2>Jobs at)/, b+'$1') : h; };
const _weStrip = stripHTML;
stripHTML = function(st, job, opts){ const h=_weStrip(st, job, opts); return job.event ? h.replace('<article class="jcard', `<article data-event="1" class="jcard event`) : h; };

/* ---- 6. new side story: Coast Watch ---- */
CAST.ortiz = {n:`Lt. Daniela Ortiz`, col:'#c2410c', role:`US Coast Guard, Air Station Borinquen`, bio:`Flew Jayhawks with Mari a lifetime ago. Calm on the radio, terrifying in a debrief.`};
PORTRAIT.ortiz = {skin:'#a8714a', hair:'#1e130d', style:'bun', top:'pilot', topC:'#e9edf2', acc:[], stripes:2};
ARC_META['Coast Watch'] = {n:4.7, tag:`Mari's old Coast Guard crew needs a civilian pilot who can fly a search pattern.`, col:'#c2410c'};
STORY.push(
 {id:'CG1',arc:`Coast Watch`,title:`Overdue`,chars:['ortiz','mari'],req:{after:'CW4',ratings:['COMM'],hours:6},from:'TNCM',to:'TNCM',local:true,ac:['C172','DA40','G36','C208'],pax:1,cargo:20,cargoLabel:`binoculars, a flare kit and a thermos`,time:'day',dep:540,wx:'trades',
  brief:[`A fishing boat out of Simpson Bay is six hours overdue, and the Coast Guard helicopter is tied up on a medevac near Vieques. Lt. Daniela Ortiz calls Mari, Mari calls you. "You fly the pattern," Mari says. "Ortiz's spotter looks out the window."`,`Ortiz gives you a datum point five miles south of the island and an expanding square: two-mile legs, growing each time, at 1,000 ft and slow flight. Find the boat, circle, and report the position.`],
  teach:[`An expanding square search turns 90° at the end of every leg and adds a leg length every two turns. Use a timer, not guesswork.`,`Slow flight at low altitude over water: keep the speed well above the stall, use a little flap, and never let the horizon fool you.`],
  out:{good:`The spotter sees an orange shirt waving on the third leg. You circle at 1,000 ft until the rescue boat arrives. Four fishermen, sunburned and very happy.`,ok:`The pattern is a bit ragged, but you find them. Ortiz says, "Messy, but you found them. That's what counts today."`,bad:`You find the boat late, after the spotter loses count of the legs twice. Everyone's fine. Ortiz's debrief is not.`},rep:{mari:3}},
 {id:'CG2',arc:`Coast Watch`,title:`Night Medevac`,chars:['ortiz'],req:{after:'CG1',ratings:['IR']},from:'TNCM',to:'TJSJ',ac:['G36','DA62','C208','PC12','KA350'],pax:3,cargo:120,cargoLabel:`a stretcher, a nurse and a very worried husband`,time:'night',dep:1290,wx:'showers',
  brief:[`A tourist on Sint Maarten has a suspected appendix rupture, and the hospital wants her in San Juan tonight. The Coast Guard asked for a civilian medevac, and Ortiz gave them your name.`,`It's night, there are showers along the route, and a nurse will be working in the back. Smooth is the whole job.`],
  teach:[`On a medevac, cabin altitude and turbulence both matter. Ask for a smooth altitude and deviate around cells early, not late.`,`San Juan at night: expect vectors to the ILS 08 and a busy frequency. Have the approach briefed before you leave cruise.`],
  out:{good:`The ambulance meets you on the ramp. The nurse tells Ortiz you flew it "like a hospital bed with wings."`,ok:`A couple of bumps, but the patient arrives stable. The husband shakes your hand for a long time.`,bad:`A rough ride through the showers. The patient makes it, but the nurse spends the whole flight bracing.`},rep:{mari:2}},
 {id:'CG3',arc:`Coast Watch`,title:`Borinquen`,chars:['ortiz','mari'],req:{after:'CG2',ratings:['TURB']},from:'TJSJ',to:'TJBQ',ac:['C208','DHC6','KA350','PC12'],pax:6,cargo:300,cargoLabel:`rescue swimmer gear and a cake for the air station`,time:'day',dep:600,wx:'trades',
  brief:[`Ortiz invites Coral Wing to Air Station Borinquen for the crew's change-of-command. She asks you to fly in the rescue swimmers whose helicopter is down for maintenance, and Mari comes along "to make sure Ortiz behaves."`,`Rafael Hernández airport at Aguadilla has an 11,700 ft runway built for B-52s. It's the easiest runway you'll ever see and the hardest crowd: a ramp full of Coast Guard pilots watching your landing.`],
  teach:[`On a very long runway it's tempting to land long. Don't. Pick the aiming point and put it there, because everyone watching will notice.`,`The northwest corner of Puerto Rico catches the full trades off the Atlantic. Expect a gusty crosswind from the right.`],
  out:{good:`The ramp gives you a round of applause, which Ortiz says has never happened for a civilian. Mari pretends not to be proud.`,ok:`A tidy arrival. The rescue swimmers carry the cake off first, and the crew is very clear about their priorities.`,bad:`A long float down the runway, with a hundred Coast Guard pilots watching. They will remember. Ortiz laughs until she cries.`},rep:{mari:3}},
 {id:'CG4',arc:`Coast Watch`,title:`The Long Search`,chars:['ortiz'],req:{after:'CG3',hours:25},from:'TJBQ',to:'MYIG',ac:['PC12','KA350','C208','TBM'],pax:3,cargo:200,cargoLabel:`survival gear, spotters and a satellite phone`,time:'day',dep:450,wx:'wave',
  brief:[`A sailboat with a family of four hit its emergency beacon north of Hispaniola, then went silent. The Coast Guard's aircraft are spread across three searches, and Ortiz needs a long-range spotter platform with endurance.`,`You'll fly the trackline northwest along the boat's planned route to Great Inagua, with two spotters at the windows. A tropical wave is moving through. Plan your fuel like your life depends on it, because out there it does.`],
  teach:[`Long overwater legs: brief your ditching plan, wear the life vests, and know the nearest airport at every point of the flight.`,`Search at an altitude where spotters can see detail (1,000–1,500 ft), but climb for fuel efficiency on the transit legs.`],
  out:{good:`Two hours into the trackline a spotter sees a flash of a mirror. The family is on a life raft, dehydrated but alive. Ortiz says, quietly, "Mari was right about you."`,ok:`You find the raft on the second pass, and a cutter is there by sundown. Ortiz writes Coral Wing a letter of thanks.`,bad:`It's a long, tense day, but a Coast Guard jet finds the raft first using your search reports. Everyone's safe. Ortiz says your notes helped.`},rep:{mari:4},reward:{bonus:3000,note:`The Coast Guard pays for the fuel, and the sailboat's family sends a box of Bahamian rum cake every Christmas.`}}
);

/* ---- settings: voices, copilot, in-sim panel ---- */
const _proHangar = hangarView;
hangarView = function(){ const h=_proHangar(); const P=proPrefs();
  const sec = `<section class="panel stack"><h3>Voices &amp; copilot</h3><label class="row"><input type="checkbox" data-act="pro-flag" data-k="copilot" ${P.copilot!==false?'checked':''}> Copilot callouts: "Airspeed alive", "Rotate", "Positive rate", and 1000 / 500 / 100 / 50 / 30 / 10 on landing</label>${premiumVoiceHTML()}</section>${panelSetupHTML()}`;
  return h.replace(/(<section class="panel stack" id="settings">[\s\S]*?<\/section>)/, '$1'+sec); };
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="pro-flag"]'); if(!b||!S.st) return; proPrefs()[b.dataset.k]=b.checked; save(); });
const _proCockpit = cockpitView;
cockpitView = function(){ const h=_proCockpit(); const p=panelSetupHTML(); return p ? h.replace(/<\/main>\s*$/, p+'</main>') : h; };

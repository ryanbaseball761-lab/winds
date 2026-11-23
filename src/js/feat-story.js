/* ===================== STORY, ROUND 2 (0.70) =====================
   - Consequences you can see: later chapters mention what you did earlier, on the Story page and the flight banner.
   - Timed choices: some in-flight decisions have a clock. Wait too long and the default happens.
   - Two quieter endings: walk away clean, or go home with the people who stuck by you.
   - Chapter cards: save a picture of every chapter you finish.
   - Halcón: Medina's pilot. He races you, taunts you, and ends up wherever your races put him.
   - Reyes's interview: a sit-down where your answers have to match what she can prove.
   - A secret chapter for players who did right by the boy and by Dez.
   - New Game+: someone else is the leak.
   - More epilogue lines: everyone you met gets a "years later". */

/* ---------- 1. consequences you can see ---------- */
const ECHO_LINES = {
  CR7:  f=>f.boy ? `There's a crayon drawing of an airplane taped inside your cockpit. The boy's mother sent it to the hangar.` : null,
  CR8:  f=>f.patient ? `Arnaud's daughter left a voicemail thanking you. You haven't listened to all of it.` : null,
  CR10: f=>f.defied ? `Castillo's driver doesn't open the car door for you anymore.` : f.boy ? `Castillo hasn't mentioned the stop in Tortola. He doesn't need to.` : null,
  CR12: f=>f.ticoRan ? `Tico's locker at the hangar is empty. Someone scratched "thank u" inside the door.` : null,
  CR13: f=>f.dezFree ? `Dez is back at the workbench. Thinner. Quieter.` : f.dezJail ? `Dez's toolbox is still where he left it. Nobody touches it.` : null,
  CR15: f=>f.hartwellSafe ? `A crate of champagne arrives for the new airline. The card just says "L.H."` : null,
  CR16: f=>f.medinaAlly ? `Two of Medina's men are standing on your ramp. They say they're "helping".` : f.medinaBurned ? `Somebody shot out the windows of the Caribe Cargo office. Nobody saw anything.` : null,
  CRB:  f=>f.mari ? `Mari runs dispatch now. There's a photo of the old Coral Wing Cessna on her desk.` : null,
  CRT:  f=>f.informant ? `Reyes's people have been in Cancún for two days. You can tell.` : null,
  CR17: f=>f.ledgers ? `Hartwell's ledgers are in a safe deposit box with your name on it.` : f.informant ? `Reyes has a team in Miami. She texted you their names, which is either trust or a threat.` : null,
};
function echoFor(st, id){ const fn=ECHO_LINES[id]; if(!fn) return null; try{ return fn(flagsOf(st)); }catch(_){ return null; } }
AFTER_RENDER.push(function echoLines(){ const st=S.st; if(!st) return; let id=null, host=null;
  if(S.view==='story'){ const nx=storyAvailable(st).filter(m=>CRIME_IDS.has(m.id))[0]; id=nx&&nx.id; host=document.querySelector('.story-card .sc-hook'); }
  else if(S.view==='flight' && st.active && st.active.job.kind==='story' && !S.showResult){ id=st.active.job.story; host=document.querySelector('.chapter-hero h1, .chapter-hero h2'); }
  if(!id || !host || host.parentElement.querySelector('.echo')) return; const t=echoFor(st,id); if(!t) return; host.insertAdjacentHTML('afterend', `<p class="echo">${esc(t)}</p>`); });

/* ---------- 3. timed choices ---------- */
const TIMED_SEC = 30;
(function(){ for(const id of ['CR2','CR3','CRM','CR16','CR8']){ (BEATS[id]||[]).forEach(b=>{ if(b && typeof b==='object' && !Array.isArray(b) && b.opts){ b.timed=TIMED_SEC; if(b.timedDefault==null) b.timedDefault=b.opts.length-1; } }); } })();
/* the 30-second clock on timed choices (showBeat in 086-core.js calls this) */
function beatTimer(b){ if(b && b.timed && b.opts){ const d=document.querySelector('.beat'); const o=d&&d.querySelector('.bt-o'); if(o){ o.insertAdjacentHTML('beforebegin',`<div class="bt-timer" aria-hidden="true"><i style="animation-duration:${b.timed}s"></i></div>`);
    /* the clock only runs while you can see it: alt-tab into MSFS and it waits for you */
    let left=b.timed*1000, lastT=Date.now(); const bar=d.querySelector('.bt-timer i'); if(bar) bar.style.animation='none';
    const t=setInterval(()=>{ const now=Date.now(); if(!document.hidden) left-=now-lastT; lastT=now; if(bar) bar.style.width=Math.max(0,left/(b.timed*1000)*100)+'%';
      if(!d.isConnected || !d.querySelector('.bt-o')){ clearInterval(t); return; }
      if(left<=0){ clearInterval(t); const btn=d.querySelectorAll('.bt-o [data-act="beat-opt"]')[b.timedDefault]; if(btn){ toast(`You took too long. You went with "${btn.textContent.replace(/^\d\s*/,'').trim()}".`); btn.click(); } } }, 250);
    d.addEventListener('click', e=>{ if(e.target.closest('[data-act="beat-opt"]')){ clearInterval(t); const tm=d.querySelector('.bt-timer'); if(tm) tm.remove(); } }); } } }

/* ---------- 4. two quieter endings ---------- */
(function(){ const m=CRIME.find(x=>x.id==='CR17'); if(!m||!m.choice) return;
  if(!m.choice.opts.some(o=>o.ending==='walk')) m.choice.opts.push(
    {t:`Walk away clean`, out:`You taxi to the cargo terminal, sign the 747 over to the leasing company that actually owns it, and leave Castillo sitting in the jump seat. You walk out through the terminal like any other crew. Nobody stops you. Nobody ever finds a reason to.`, heat:-40, power:-30, ending:'walk'},
    {t:`Go home`, out:`You switch off the engines, hand Castillo his bag, and tell him you're done. Outside the fence, someone is waiting with Dez's old truck. Three weeks later you're flying the 7 a.m. mail run to Anguilla again, on a trainee's wage. It's the best job you've ever had.`, heat:-20, power:-50, ending:'home'});
  if(typeof ENDING_REQ!=='undefined'){ ENDING_REQ.walk=c=>c.heat<40 ? null : `Needs Heat under 40 (you have ${c.heat})`; ENDING_REQ.home=c=>(c.flags.mari||c.flags.dezFree) ? null : `Nobody's waiting for you`; } })();


if(typeof ENDING_TITLE!=='undefined'){ ENDING_TITLE.walk='Walk Away'; ENDING_TITLE.home='Coming Home'; }

/* more "years later" lines; epilogue() (073-core.js) calls this */
function epilogueExtra(st, L){ const c=crime(st), f=flagsOf(st), w=st.w||{};
  if(c.ending==='walk') L.push(`Castillo was arrested two years later for something else entirely. Your name never came up.`, `You still fly. Mostly sunsets over Saba, for honeymooners who think you're just a pilot.`);
  if(c.ending==='home') L.push(`Coral Wing Air has two Cessnas now and a third on order. Mari says it's your fault.`, `Castillo sent one message, the day you quit: "A waste." You had it framed.`);
  // Halcón
  const hw=(w.halcon&&w.halcon.w)||0, hl=(w.halcon&&w.halcon.l)||0; if(hw+hl>0) L.push(hw>hl ? `Halcón flies for an air ambulance company in Colombia now. He still says he let you win.` : `Halcón got Medina's best routes. He sends you a photo of every new airplane.`);
  // the islands and your businesses
  const best=Object.entries(w.isl||{}).sort((a,b)=>b[1]-a[1])[0]; if(best && best[1]>=20) L.push(`On ${best[0]}, they still tell stories about the pilot who always landed soft.`);
  if(w.props && w.props.bar) L.push(`The beach bar on Anguilla is still open. Dez still drinks for free.`);
  if(f.reyesTalked && c.ending!=='witness') L.push(`Reyes kept your interview tape. She has never played it for anyone.`);
  }


/* ---------- 5. chapter cards ---------- */
try{ document.fonts && document.fonts.load('600 84px "IBM Plex Sans Condensed"'); }catch(_){}
function drawChapterCard(st){ const L=st.last, j=L.job, o=L.out; const cv=document.createElement('canvas'); cv.width=1200; cv.height=630; const g=cv.getContext('2d');
  g.fillStyle='#0a0c0e'; g.fillRect(0,0,1200,630); g.strokeStyle='#f0a53a'; g.lineWidth=4; g.beginPath(); g.moveTo(0,2); g.lineTo(1200,2); g.stroke();
  for(let i=0;i<9000;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.03})`; g.fillRect(Math.random()*1200,Math.random()*630,1,1); }
  const m=STORY.find(x=>x.id===j.story)||{}; const n=mainChapters().findIndex(x=>x.id===j.story)+1;
  g.fillStyle='#8f989f'; g.font='500 26px "IBM Plex Sans",sans-serif'; g.fillText(`Trade Winds · Chapter ${n||''}`, 60, 90);
  g.fillStyle='#e8eaec'; g.font='600 84px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; g.fillText(m.title||j.title, 60, 190);
  g.fillStyle='#f0a53a'; g.font='500 40px "IBM Plex Mono",monospace'; g.fillText(`${j.from} → ${j.local?j.from:j.to}`, 60, 260);
  g.fillStyle='#e8eaec'; g.font='600 150px "IBM Plex Sans Condensed",sans-serif'; g.fillText(o.grade||L.res.grade||'', 1000, 220);
  const ch=crime(st).choice&&crime(st).choice[j.story]; const cm=CRIME.find(x=>x.id===j.story); const picked=(cm&&cm.choice&&ch!=null)?cm.choice.opts[ch].t:null;
  g.fillStyle='#cfd4d8'; g.font='400 32px "IBM Plex Sans",sans-serif'; const story=String(o.story||m.recap||'').replace(/\s+/g,' ');
  const wrap=(t,x,y,w,lh,max)=>{ const words=t.split(' '); let line='', n=0; for(const wd of words){ const tt=line?line+' '+wd:wd; if(g.measureText(tt).width>w){ g.fillText(line,x,y); y+=lh; line=wd; if(++n>=max-1){ line+='…'; break; } } else line=tt; } g.fillText(line,x,y); return y; };
  let y=wrap(story, 60, 350, 1080, 46, 4);
  if(picked){ g.fillStyle='#8f989f'; g.font='500 26px "IBM Plex Sans",sans-serif'; g.fillText('You chose', 60, y+70); g.fillStyle='#f0a53a'; g.font='600 34px "IBM Plex Sans",sans-serif'; g.fillText(picked, 60, y+112); }
  g.fillStyle='#5d666d'; g.font='400 22px "IBM Plex Mono",monospace'; g.fillText(`${st.pilot.name} · day ${st.day}`, 60, 600); return cv; }
AFTER_RENDER.push(function chapterCardButton(){ const st=S.st, L=st&&st.last; if(!S.showResult || !L || !L.job || L.job.kind!=='story' || L.res.crash) return; const main=document.querySelector('main'); if(!main || main.querySelector('.ch-card')) return;
  const d=document.createElement('section'); d.className='panel row between ch-card'; d.innerHTML=`<div><p class="label">Chapter card</p><p class="small muted">A picture of this chapter: route, grade and what you chose.</p></div><button class="btn sm" data-act="ch-card">Save image</button>`;
  const anchor=main.querySelector('.beta-fb')||main.lastElementChild; anchor.after(d); });
document.addEventListener('click', async e=>{ const b=e.target.closest('[data-act="ch-card"]'); if(!b||!S.st||!S.st.last) return; const blob=await new Promise(r=>drawChapterCard(S.st).toBlob(r,'image/png'));
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`trade-winds-${S.st.last.job.story}.png`; document.body.appendChild(a); a.click(); a.remove(); toast('Chapter card saved.'); }catch(_){ toast('Saving isn\'t available in this view.'); } });

/* ---------- 6. Halcón, Medina's pilot ---------- */
function halcon(){ const w=twW(); w.halcon=w.halcon||{w:0,l:0}; return w.halcon; }
GEN_JOB_STEPS.push(function halconRace(st, L){ if(!L) return; const c=crime(st); if(!c.on || !st.story.done.CRM || st.story.done.CRT) return L;
  const j=L.find(x=>x.network && !x.local && x.est>=20); if(j && fevHash(j.id+'|hal')<0.35){ j.rival=true; j.title=`Race Halcón: ${j.title}`; j.pay=Math.round(j.pay*1.2/10)*10; } return L; });
SIM_TICK.push(function halconTick(){ const a=S.st&&S.st.active; if(!a || !a.job.rival || a.halconSaid || S.simState!=='live') return; if(a.order && a.order.state==='active') return; const s=S.sim; const rec=s&&s.recorder; if(!rec||!rec.takeoff) return; if(document.querySelector('.beat')) return;
  a.halconSaid=1; const min=Math.max(12, Math.round((a.job.est||30)*0.95)); save();
  showBeat(a,{who:'radio', text:`Hola, amigo. Halcón here, two minutes behind you. Same destination. Loser buys the drinks.|Medina's pilot. He's not joking about the race.`}, 'hal');
  startOrder(a,{k:'landwithin', min, label:`Beat Halcón: land within ${min} min`, race:true, ok:{text:`You're shut down before Halcón even calls final. He buys the drinks. Medina hears about it.`, power:3}, fail:{text:`Halcón is already on the ramp, leaning on his wing, when you taxi in.`, power:-2}}); });
AFTER_RESULT.push(function halconResult(st, job){ if(!job.rival) return; const a=S._lastActive; const o=a&&a.order; if(!o||!o.race) return; const h=halcon(); if(o.state==='ok') h.w++; else h.l++; });
const HALCON_MSGS = [
  {id:'hal1', from:'unknown', fromName:'Halcón', need:['CRM'], not:['CRT'], crime:true, text:`So you're Castillo's famous pilot. You fly like an old man. Next time, we race.`},
  {id:'hal2', from:'unknown', fromName:'Halcón', need:['CRT'], crime:true, gate:()=>halcon().w>halcon().l, text:`Medina fired me. Because of you, amigo. If you ever need a pilot who's fast, I'm free now.`},
  {id:'hal3', from:'unknown', fromName:'Halcón', need:['CRT'], crime:true, gate:()=>halcon().w<=halcon().l, text:`Medina gave me your routes. No hard feelings. Actually, a few.`},
];
HALCON_MSGS.forEach(m=>PHONE_POOL.push(m));

/* ---------- 7. Reyes's interview ---------- */
function interviewQs(st){ const d=st.story.done; const qs=[];
  qs.push({q:`Were you in Punta Cana the night of the storm, when nothing else was flying?`, has:!!d.CR8, a:[[`Yes. It was a charter.`,'truth'],[`No. I was grounded that week.`,'lie'],[`I'd like a lawyer for that one.`,'silent']]});
  qs.push({q:`Who owns the Vision Jet you fly?`, has:!!d.CR5, a:[[`Lionel Hartwell's foundation.`,'truth'],[`I just fly it. I don't ask.`,'silent'],[`My employer. A charter company.`,'lie']]});
  qs.push({q:`Have you ever carried cash for Mateo Castillo?`, has:(crime(st).heat||0)>=50, a:[[`Yes.`,'truth'],[`I don't know anyone called Castillo.`,'lie'],[`Next question.`,'silent']]});
  return qs; }
function interviewHTML(st){ const w=twW(), iv=w.iv; const qs=interviewQs(st); if(iv.i>=qs.length){ const r=iv.res; const sum = r.lie>0&&r.caught>0 ? `"You lied to me ${r.caught===1?'once':r.caught+' times'}, and I could prove it. That goes in the file."` : r.truth===qs.length ? `"Thank you. That was either very brave or very stupid. Maybe both."` : `"We'll talk again."`;
    return `<p class="ph-in">${esc(sum)}</p><p class="small muted">Heat ${r.heat>=0?'+':''}${r.heat}. She closes the folder and lets you go.</p><button class="btn sm" data-act="w-close">Leave</button>`; }
  const q=qs[iv.i]; return `<p class="small muted">Question ${iv.i+1} of ${qs.length}. A metal table, a fan that doesn't work, and Agent Reyes with a thick folder.</p><p class="ph-in">"${esc(q.q)}"</p><div class="ph-opts" style="flex-direction:column;align-items:stretch">${q.a.map((x,i)=>`<button class="btn sm" data-act="iv-ans" data-i="${i}">${esc(x[0])}</button>`).join('')}</div>`; }
function interviewAnswer(i){ const st=S.st, w=twW(), iv=w.iv; const q=interviewQs(st)[iv.i]; const kind=q.a[i][1]; const c=crime(st); let dh=0;
  if(kind==='truth'){ dh=2; iv.res.truth++; wRep('reyes',3); } else if(kind==='lie'){ iv.res.lie++; if(q.has){ dh=6; iv.res.caught++; wRep('reyes',-4); } else dh=-2; } else { dh=1; }
  crBump(c,'heat',dh); iv.res.heat+=dh; iv.i++; if(iv.i>=interviewQs(st).length){ c.flags.interviewed=1; if(iv.res.truth===interviewQs(st).length) c.flags.reyesTalked=1; } save(); }
DAY_HOOKS.push(st=>{ const c=crime(st); if(c.on && st.story.done.CR9 && !c.flags.interviewed && !twW().ivDue && c.heat>=40){ twW().ivDue=st.day; phonePush({from:'reyes', text:`You'll come in and talk to me today. Voluntarily. That's the nice version.`}); } });
AFTER_RENDER.push(function interviewOpen(){ const st=S.st; if(!st||S.view!=='story'||document.querySelector('.tw-sheet,.cut')) return; const w=twW(); const c=crime(st); if(!w.ivDue || c.flags.interviewed || w.ivOpened===st.day) return;
  w.ivOpened=st.day; w.iv=w.iv||{i:0,res:{truth:0,lie:0,caught:0,heat:0}}; save(); setTimeout(()=>twSheet('Interview: Agent Reyes', interviewHTML(st), 'wide'), 600); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="iv-ans"]'); if(!b||!S.st) return; interviewAnswer(+b.dataset.i); twSheetBody(interviewHTML(S.st)); render(); });

/* ---------- 8. the secret chapter ---------- */
ARC_META['Epilogue'] = {n:9, tag:`One more flight, for the ones who earned it.`, col:'#8a7a4a'};
STORY.push({id:'SX1',arc:'Epilogue',title:`The First Box`,chars:['dez'],req:{after:'CR17'},from:'TNCM',to:'TQPF',ac:['C172','DA40','G36'],pax:1,cargo:40,cargoLabel:`a wooden box with Dez's handwriting on the lid`,time:'dawn',dep:390,wx:'calm',
  hook:`Dez finally tells you what was in the first box.`,
  recap:`You flew Dez's first box back to Anguilla, and he told you what was in it.`,
  brief:[`Dez is waiting at the old Coral Wing hangar with the same box you flew to Anguilla on your very first day. Same handwriting on the lid. "I owe you a story, rookie," he says. "And a flight. Same route."`,`Halfway across, he opens it. Inside: a logbook, a set of wings, and a photo of a younger Dez in a pilot's uniform. "I lost my license for flying for a man like Castillo. I wanted to see if you'd make it out. You did."`],
  teach:[`Same Cessna, same ten minutes, same runway. Fly it like it's your first day, because for Dez it sort of is.`],
  out:{good:`Dez pins his old wings on your shirt on the ramp at Anguilla. Neither of you says anything for a while.`,ok:`Dez leaves the box on your seat. The logbook's last entry is dated twenty years ago. There's space for one more.`,bad:`A bumpy landing. Dez laughs harder than you've ever heard him laugh. "Some things never change."`},rep:{dez:10}});

AFTER_RENDER.push(function secretChapter(){ const st=S.st; if(S.view!=='story'||!st) return; const main=document.querySelector('main'); if(!main||main.querySelector('.sx1')) return; const av=storyAvailable(st); const m=av.find(x=>x.id==='SX1'); if(!m) return;
  const d=document.createElement('section'); d.className='panel sx1'; d.innerHTML=`<p class="label">One more flight</p><h3>${esc(m.title)}</h3><p class="small muted">${esc(m.hook)}</p><div class="row" style="margin-top:8px">${chapterAction(st,m,new Set(av.map(x=>x.id)),true)}</div>`;
  const hero=main.querySelector('.story-card'); if(hero) hero.after(d); else main.prepend(d); });
PHONE_POOL.push({id:'sx1', from:'dez', need:['CR17'], gate:f=>f.boy&&f.dezFree, text:`rookie. come by the old hangar tomorrow. bring the cessna. i owe u a story`});

/* ---------- 9. New Game+: a different leak ---------- */
const NG_TWIST = {
  CR11: `Castillo is sure it's Tico. This time, you're not. Tico's phone has no calls you can't explain. Someone else's does.`,
  CR12: `Dez didn't talk last time. This time you wonder whether the leak was ever in the hangar at all.`,
  CRB:  `Somebody in Castillo's own office has been on Reyes's payroll for a year. You can tell by who isn't worried.`,
};

PHONE_POOL.push({id:'ng1', from:'reyes', need:['CR11'], crime:true, gate:()=>!!(S.st&&crime(S.st).ng), text:`Off the record: it was never the kid. Your leak sits a lot closer to Castillo than to you.`});

(function(){ const s=document.createElement('style'); s.textContent=`
.echo{margin:-8px 0 18px!important;font-size:14.5px;color:#c9b98a;border-left:2px solid #6b5a2e;padding-left:10px;max-width:620px}
.chapter-hero .echo{margin:6px 0 10px!important}
.bt-timer{height:3px;background:var(--line-2);margin:8px 0 2px;overflow:hidden}.bt-timer i{display:block;height:100%;background:var(--amb);animation:btT linear forwards}@keyframes btT{from{width:100%}to{width:0}}
.sx1{border-left:2px solid #8a7a4a!important}
`; document.head.appendChild(s); })();

/* ===================== ROUND 2: choices with three ways out, and consequences that come back =====================
   Seven chapters get a third option. Each sets a flag that a later chapter remembers (ECHO_LINES),
   and the endings now depend on what you did along the way, not on one number. */
(function(){
  const add=(id,opt)=>{ const m=CRIME.find(x=>x.id===id); if(!m||!m.choice) return; if(!m.choice.opts.some(o=>o.flag===opt.flag)) m.choice.opts.push(opt); };
  const flagOn=(id,i,flag)=>{ const m=CRIME.find(x=>x.id===id); if(m&&m.choice&&m.choice.opts[i]&&!m.choice.opts[i].flag) m.choice.opts[i].flag=flag; };
  flagOn('CR2',1,'skim');   // the bundle you kept is the start of a stash
  add('CR2',{t:`Call Dez before you hand it over`, flag:'askedDez', power:2, out:`Dez picks up on the first ring. "Don't count it, don't open it, don't call me on this phone." The broker watches you hang up and smiles like he's learned something about you.`});
  add('CR4',{t:`Turn the envelope down, politely`, flag:'politeNo', power:2, heat:2, out:`Castillo slides the envelope back into his jacket without a flicker. "A careful man. Careful men live longer." He pays for lunch anyway. You get the feeling you've been measured.`});
  add('CR6',{t:`Drive them to the clinic yourself`, flag:'clinic', power:2, heat:8, out:`You leave the plane with the door open and drive the truck yourself. The nurse at the clinic doesn't ask how they got hurt. She does write down the registration on your flight bag.`});
  add('CR9',{t:`Lie to her, then warn Castillo`, flag:'warned', power:10, heat:12, out:`You tell Reyes you'll think about it. Ten minutes later you're calling Castillo from the pay phone at the marina. He's quiet for a long time. "Thank you," he says, which is somehow worse.`});
  add('CR11',{t:`Fly him somewhere else and tell no one`, flag:'ticoHidden', power:-10, heat:12, out:`You file for Grand Cayman and land on Cayman Brac. Tico walks into the dark with your last two hundred dollars. When Castillo calls, you tell him the man ran at the fuel stop.`});
  add('CR13',{t:`Ask her to run the books, not the flying`, flag:'mariBooks', power:4, out:`Mari thinks about it for a whole leg. "Somebody has to make this look legitimate," she says. "And somebody has to keep you out of the paperwork."`});
  add('CR15',{t:`Split it 50/50 and take three of his pilots`, flag:'castilloPilots', power:6, heat:4, out:`Castillo raises an eyebrow, then laughs. "Half. And you train three of my boys to fly like you." It sounds generous. It also means three of his people on your ramp.`});

  const more = {
    CR3:  f=>f.askedDez ? `Dez says the broker called him about you. "He said you're careful. In his line of work, that's a compliment."` : f.skim ? `The bundle you kept is in a coffee can behind the water heater. You check on it more than you'd like.` : null,
    CR5:  f=>f.politeNo ? `Castillo's people still don't use your first name.` : null,
    CR9:  f=>f.clinic ? `Reyes has the clinic nurse's notes in her file. She mentions your flight bag once, casually.` : null,
    CR12: f=>f.ticoHidden ? `A postcard from Cayman Brac arrives at the hangar. No name. Just a child's drawing of an airplane.` : null,
    CR14: f=>f.warned ? `Castillo sends a car to the hangar every morning now. "For your safety," the driver says.` : null,
    CR16: f=>f.castilloPilots ? `Castillo's three pilots are good. Too good. One of them asks a lot of questions about your routes.` : null,
    CR17: f=>f.mariBooks ? `Mari keeps two sets of books. Only one of them is in the office.` : null,
  };
  for(const k in more){ const old=ECHO_LINES[k]; ECHO_LINES[k] = old ? (f=>old(f)||more[k](f)) : more[k]; }

  /* endings: each one needs something you did earlier; if nothing qualifies, you can always vanish */
  if(typeof ENDING_REQ!=='undefined'){
    const F=c=>c.flags||{};
    const others=c=>['kingpin','witness','walk','home'].some(k=>!ENDING_REQ[k](c));
    ENDING_REQ.kingpin=c=> c.power<50 ? `Needs Power 50+ (you have ${c.power})` : (F(c).defied||F(c).war||F(c).medinaAlly||F(c).warned||F(c).castilloPilots) ? null : `Nobody would follow you. You never stood up to Castillo or made allies of your own`;
    ENDING_REQ.ghost=c=> (F(c).skim||F(c).medinaDeal||F(c).ticoHidden||F(c).politeNo||!others(c)) ? null : `You'd need money nobody knows about, or to know how to disappear someone`;
    ENDING_REQ.walk=c=> F(c).war ? `You can't walk away from a war you started` : c.heat<40 ? null : `Needs Heat under 40 (you have ${c.heat})`;
    ENDING_REQ.home=c=> (F(c).mari||F(c).mariBooks||F(c).dezFree) ? null : `Nobody's waiting for you`;
  }
})();

/* ===================== the calendar matters: Castillo's jobs have a deadline =====================
   Once you work for Castillo (after chapter 4), each of his chapters is due three days after it opens.
   Late costs Power and gets you a text. The story page shows the date. */
function chDue(st, m){ const c=crime(st); if(!c.on || !st.story.done.CR4 || !CRIME_IDS.has(m.id) || st.story.done[m.id] || m.id==='CR17') return null;
  c.due=c.due||{}; if(c.due[m.id]==null){ const avail=storyAvailable(st).some(x=>x.id===m.id); if(!avail) return null; c.due[m.id]=st.day+3; save(); } return c.due[m.id]; }
DAY_HOOKS.push(function lateChapters(st){ const c=crime(st); if(!c.on || !c.due) return; c.late=c.late||{};
  for(const id in c.due){ if(!st.story.done[id] && !c.late[id] && st.day>c.due[id]){ c.late[id]=1; crBump(c,'power',-4); const m=CRIME.find(x=>x.id===id);
    phonePush({from:'castillo', text:`I asked for "${m?m.title:'it'}" by day ${c.due[id]}. I don't like asking twice.`}); } } });
AFTER_RENDER.push(function dueChip(){ if(S.view!=='story' || !S.st) return; const main=document.querySelector('main'); if(!main || main.querySelector('.ch-due')) return;
  const MC=mainChapters(); const next=MC.find(m=>!S.st.story.done[m.id]); if(!next) return; const due=chDue(S.st,next); if(due==null) return;
  const h=main.querySelector('h1, .sh-title, h2'); if(!h) return; const left=due-S.st.day;
  h.insertAdjacentHTML('afterend', `<p class="ch-due small" style="margin:6px 0 0;color:${left<=0?'var(--bad,#d0643a)':'var(--amb)'}">${left<0?`Late: Castillo wanted this by day ${due}`:left===0?`Castillo expects this today`:`Castillo expects this by day ${due} (${left} day${left>1?'s':''})`}</p>`); });

/* ===================== a reaction after every choice =====================
   Instead of a stats card, someone answers you: one line, with their face. The numbers stay small underneath. */
const REACT = {
  CR2:  [['dez',`Good. You didn't count it, right? Right.`],['dez',`Broker says the count was light. I told him you're new. Don't make me say it twice.`],['dez',`Next time just fly. Phones are for people who want to get caught.`]],
  CR4:  [['castillo',`Spend some of it. A pilot who looks poor makes people nervous.`],['castillo',`Five percent. Earn it, and we'll talk about ten.`],['castillo',`You'll come back for it. Everyone does.`]],
  CR6:  [['dez',`You did the right thing. That's what scares me.`],['castillo',`Clean. Quiet. Thank you.`],['mari',`Why is there blood on your flight bag? No. Don't answer that.`]],
  CR9:  [['reyes',`Smart. Now act normal. Normal is the hardest part.`],['reyes',`Lawyers are expensive. So is prison. Think about the rate.`],['castillo',`I won't forget this. Neither will she.`]],
  CRM:  [['medina',`Loyal. How old-fashioned.`],['medina',`Two doors. Just remember which one locks.`]],
  CR11: [['castillo',`My driver says Tico ran fast. For a man with a limp.`],['castillo',`Loyalty. It's the only currency I trust.`],['castillo',`Jumped at the fuel stop. Of course he did.`]],
  CR12: [['dez',`I'll pay you back. Every cent. Maybe not in cash.`],['dez',`Tell Mari I'm sorry. Not you. Her.`]],
  CR13: [['mari',`Partners. God help us both.`],['mari',`Look after the Cessna. It deserves better than you.`],['mari',`Two sets of books. I'll need a bigger desk.`]],
  CR14: [['castillo',`Leverage. You're learning.`],['reyes',`This is enough to start. Not enough to finish.`]],
  CR15: [['castillo',`Seventy is generous. I'm in a generous mood.`],['castillo',`Yours. Say that again. Slowly.`],['castillo',`They'll learn fast. They always do.`]],
  CRB:  [['castillo',`Then we'll see whose people are better.`],['castillo',`Good. We'll both pretend.`]],
  CRT:  [['medina',`Partners, then. Don't make me regret it.`],['reyes',`Medina's routes. You just made a very dangerous friend. Me.`]],
};
function reactShot(m, i, fx){ const r=(REACT[m.id]||[])[i]; if(!r || !CAST[r[0]]) return null; return [CAST[r[0]].n, r[0], r[1]+(fx?`\n${fx}`:'')]; }

/* recap lines ("Previously on") for the third options */
(function(){ if(typeof CHOICE_RECAP==='undefined') return; const put=(id,t)=>{ CHOICE_RECAP[id]=CHOICE_RECAP[id]||[]; CHOICE_RECAP[id][2]=t; };
  put('CR2',`You called Dez before handing it over.`); put('CR4',`You turned Castillo's envelope down.`); put('CR6',`You drove the injured men to the clinic yourself.`);
  put('CR9',`You lied to Reyes and warned Castillo.`); put('CR11',`You hid Tico on Cayman Brac and lied to Castillo.`); put('CR13',`Mari runs the books now, not the flying.`);
  put('CR15',`You split it 50/50 and took on three of Castillo's pilots.`); })();

/* ===================== after the story: challenges, and a harder New Game+ ===================== */
function postGameChallenges(st){ const R=st.records||{}, v=st.visited||{};
  return [
    ['Ten in a row', `Ten A grades in a row`, Math.min(10,R.bestStreak||0), 10],
    ['Every short strip', `Land at all ${BUSH_STRIPS.length} bush strips, Saba to Placencia`, BUSH_STRIPS.filter(k=>v[k]).length, BUSH_STRIPS.length],
    ['Island collector', `Land at 60 different airports`, Math.min(60,Object.keys(v).length), 60],
    ['Hundred hours', `Log 100 hours in the Caribbean`, Math.min(100,Math.floor((st.minutes||0)/60)), 100]]; }
function challengesHTML(st){ if(!crime(st).ending) return ''; return `<section class="panel pg-ch"><p class="label">After the story</p><h3>Challenges</h3><ul class="ls-list">${postGameChallenges(st).map(c=>`<li class="${c[2]>=c[3]?'ok':''}"><b>${esc(c[0])}</b><span>${esc(c[1])} · <span class="mono">${c[2]} / ${c[3]}</span></span></li>`).join('')}</ul></section>`; }
AFTER_RENDER.push(function pgChallenges(){ if(S.view!=='story'||!S.st) return; const main=document.querySelector('main'), ng=main&&main.querySelector('.ngp'); if(!ng || main.querySelector('.pg-ch')) return; ng.insertAdjacentHTML('afterend', challengesHTML(S.st));
  if(!ng.querySelector('.ng-hard')) ng.querySelector('[data-act="ng-start"]').insertAdjacentHTML('beforebegin', `<label class="check ng-hard" style="margin:10px 0"><input type="checkbox" id="ng-hard" ${S.st.ui&&S.st.ui.ngHard?'checked':''}> Hard rules: customs start searching at Heat 45, Heat never drops below 20, and pay is 15% lower</label>`); });
document.addEventListener('change', e=>{ if(e.target.id!=='ng-hard'||!S.st) return; S.st.ui=S.st.ui||{}; S.st.ui.ngHard=e.target.checked; save(); });
/* the New Game+ button carries the hard rules into the new round */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="ng-start"]'); if(!b||!S.st||!b.dataset.ok) return; setTimeout(()=>{ const c=crime(S.st); if(c.ng && S.st.ui && S.st.ui.ngHard){ c.hard=1; save(); } },0); }, true);
DAY_HOOKS.push(function hardFloor(st){ const c=crime(st); if(c.hard && c.on && (c.heat||0)<20) c.heat=20; });

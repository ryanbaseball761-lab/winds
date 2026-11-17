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
const TIMED_SEC = 20;
(function(){ for(const id of ['CR2','CR3','CRM','CR16','CR8']){ (BEATS[id]||[]).forEach(b=>{ if(b && typeof b==='object' && !Array.isArray(b) && b.opts){ b.timed=TIMED_SEC; if(b.timedDefault==null) b.timedDefault=b.opts.length-1; } }); } })();
(function(){ const base=showBeat; showBeat=function(a,b,idx){ const r=base.apply(this, arguments); if(b && b.timed && b.opts){ const d=document.querySelector('.beat'); const o=d&&d.querySelector('.bt-o'); if(o){ o.insertAdjacentHTML('beforebegin',`<div class="bt-timer" aria-hidden="true"><i style="animation-duration:${b.timed}s"></i></div>`);
    const t=setTimeout(()=>{ if(d.isConnected && d.querySelector('.bt-o')){ const btn=d.querySelectorAll('.bt-o [data-act="beat-opt"]')[b.timedDefault]; if(btn){ toast('You waited too long. The moment decided for you.'); btn.click(); } } }, b.timed*1000);
    d.addEventListener('click', e=>{ if(e.target.closest('[data-act="beat-opt"]')){ clearTimeout(t); const tm=d.querySelector('.bt-timer'); if(tm) tm.remove(); } }); } } return r; }; })();

/* ---------- 4. two quieter endings ---------- */
(function(){ const m=CRIME.find(x=>x.id==='CR17'); if(!m||!m.choice) return;
  if(!m.choice.opts.some(o=>o.ending==='walk')) m.choice.opts.push(
    {t:`Walk away clean`, out:`You taxi to the cargo terminal, sign the 747 over to the leasing company that actually owns it, and leave Castillo sitting in the jump seat. You walk out through the terminal like any other crew. Nobody stops you. Nobody ever finds a reason to.`, heat:-40, power:-30, ending:'walk'},
    {t:`Go home`, out:`You switch off the engines, hand Castillo his bag, and tell him you're done. Outside the fence, someone is waiting with Dez's old truck. Three weeks later you're flying the 7 a.m. mail run to Anguilla again, on a trainee's wage. It's the best job you've ever had.`, heat:-20, power:-50, ending:'home'});
  if(typeof ENDING_REQ!=='undefined'){ ENDING_REQ.walk=c=>c.heat<40 ? null : `Needs Heat under 40 (you have ${c.heat})`; ENDING_REQ.home=c=>(c.flags.mari||c.flags.dezFree) ? null : `Nobody's waiting for you`; } })();
const END_NAMES={kingpin:'Kingpin',witness:'Witness',ghost:'Ghost',walk:'Walk Away',home:'Coming Home'};
(function(){ const base=crimeRank; crimeRank=function(c){ if(c.ending==='walk') return 'Retired'; if(c.ending==='home') return 'Line pilot'; return base.apply(this, arguments); }; })();
(function(){ const base=storyRole; storyRole=function(st){ const c=crime(st); if(c.ending==='walk') return 'Out of the business'; if(c.ending==='home') return 'Coral Wing Air, again'; return base.apply(this, arguments); }; })();
if(typeof ENDING_TITLE!=='undefined'){ ENDING_TITLE.walk='Walk Away'; ENDING_TITLE.home='Coming Home'; }
(function(){ const base=ngHTML; ngHTML=function(st){ let h=base.apply(this, arguments); const c=crime(st); if(!h) return h; const seen=Object.keys(c.endingsSeen||{}).concat([c.ending]); const left=['walk','home'].filter(x=>!seen.includes(x)).map(x=>END_NAMES[x]);
  if(left.length) h=h.replace(/You've seen every ending\.|Endings you haven't seen: ([^.]*)\./, (m0,g)=>`Endings you haven't seen: ${[g].filter(Boolean).concat(left).join(', ')}.`); return h; }; })();
/* the end card in the closing scene, for the new endings */
(function(){ const base=epilogue; epilogue=function(st){ const L=base.apply(this, arguments); const c=crime(st), f=flagsOf(st), w=st.w||{};
  if(c.ending==='walk') L.push(`Castillo was arrested two years later for something else entirely. Your name never came up.`, `You still fly. Mostly sunsets over Saba, for honeymooners who think you're just a pilot.`);
  if(c.ending==='home') L.push(`Coral Wing Air has two Cessnas now and a third on order. Mari says it's your fault.`, `Castillo sent one message, the day you quit: "A waste." You had it framed.`);
  // Halcón
  const hw=(w.halcon&&w.halcon.w)||0, hl=(w.halcon&&w.halcon.l)||0; if(hw+hl>0) L.push(hw>hl ? `Halcón flies for an air ambulance company in Colombia now. He still says he let you win.` : `Halcón got Medina's best routes. He sends you a photo of every new airplane.`);
  // the islands and your businesses
  const best=Object.entries(w.isl||{}).sort((a,b)=>b[1]-a[1])[0]; if(best && best[1]>=20) L.push(`On ${best[0]}, they still tell stories about the pilot who always landed soft.`);
  if(w.props && w.props.bar) L.push(`The beach bar on Anguilla is still open. Dez still drinks for free.`);
  if(f.reyesTalked && c.ending!=='witness') L.push(`Reyes kept your interview tape. She has never played it for anyone.`);
  return L; }; })();
/* patch the hard-coded ending names */
(function(){ const s=document.createElement('style'); s.textContent=''; document.head.appendChild(s); })();

/* ---------- 5. chapter cards ---------- */
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
SIM_TICK.push(function halconTick(){ const a=S.st&&S.st.active; if(!a || !a.job.rival || a.halconSaid || S.simState!=='live') return; const s=S.sim; const rec=s&&s.recorder; if(!rec||!rec.takeoff) return; if(document.querySelector('.beat')) return;
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
(function(){ const base=phonePush; phonePush=function(m){ const p=PHONE_POOL.find(x=>x.id===m.pid); if(p&&p.fromName&&!m.fromName) m.fromName=p.fromName; return base.apply(this, arguments); }; })();

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
(function(){ const base=storyAvailable; storyAvailable=function(st){ const L=base.apply(this, arguments); const f=flagsOf(st); const c=crime(st); return L.filter(m=> m.id!=='SX1' || (!!c.ending && f.boy && f.dezFree)); }; })();
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
(function(){ const base=dynM; dynM=function(st, m){ const r=base.apply(this, arguments); const c=crime(st); if(c.ng && NG_TWIST[m.id] && r && Array.isArray(r.brief)) return Object.assign({}, r, {brief:[NG_TWIST[m.id]].concat(r.brief)}); return r; }; })();
PHONE_POOL.push({id:'ng1', from:'reyes', need:['CR11'], crime:true, gate:()=>!!(S.st&&crime(S.st).ng), text:`Off the record: it was never the kid. Your leak sits a lot closer to Castillo than to you.`});

(function(){ const s=document.createElement('style'); s.textContent=`
.echo{margin:-8px 0 18px!important;font-size:14.5px;color:#c9b98a;border-left:2px solid #6b5a2e;padding-left:10px;max-width:620px}
.chapter-hero .echo{margin:6px 0 10px!important}
.bt-timer{height:3px;background:var(--line-2);margin:8px 0 2px;overflow:hidden}.bt-timer i{display:block;height:100%;background:var(--amb);animation:btT linear forwards}@keyframes btT{from{width:100%}to{width:0}}
.sx1{border-left:2px solid #8a7a4a!important}
`; document.head.appendChild(s); })();

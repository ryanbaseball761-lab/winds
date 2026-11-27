/* =====================================================================
   ROUND 4 (0.89)
   1 backstories · 2 story side jobs · 3 Halcón from Act 1 · 4 forecast and storm pay · 5 long legs
   6 night runs · 7 investments · 8 logbook filters · 9 later echoes · 10 everyday texts · 11 money tour
   12 seized-load scene · 13 airport favourites · 14 title details · 15 keyboard · 16 ambience by page
   17 phone: people vs business · 18 next achievements · 19 epilogue for everyone
   ===================================================================== */
function r4(){ const w=twW(); w.r4=w.r4||{fav:{}, inv:{}}; w.r4.fav=w.r4.fav||{}; w.r4.inv=w.r4.inv||{}; return w.r4; }
function invOwned(k){ return !!(S.st && r4().inv[k]); }

/* ---- 1. backstories ---- */
const BACKSTORY = {
  school:{n:'Fresh out of flight school', d:'The usual start: $1,200, 62 hours and a lot to prove.', fx:st=>{}},
  bush:{n:'Bush pilot from Guyana', d:'Less money ($600), but 5 hours already flown here and the islanders trust you sooner.', fx:st=>{ st.cash=600; st.minutes+=300; st.flights+=2; st.reputation=26; }},
  airline:{n:'Let go by an airline', d:'Savings of $4,000, but your name is mud: reputation starts at 12.', fx:st=>{ st.cash=4000; st.reputation=12; }},
  local:{n:'Island kid, back home', d:'$800 and family on every island: Mari and Dez like you from day one.', fx:st=>{ st.cash=800; st.rep.mari=(st.rep.mari||10)+15; st.rep.dez=(st.rep.dez||10)+15; st.reputation=24; ['TFFG','TNCS','TQPF'].forEach(k=>{ if(AP[k]) st.visited[k]=true; }); }},
};
const BACKSTORY_LINE = { bush:`Six years of dirt strips in the Rupununi. The Caribbean feels like a holiday.`, airline:`The airline let you go after one bad night in Miami. Nobody here asks about it. Yet.`, local:`You grew up watching the planes at Princess Juliana from the beach. Now you're flying them.` };
function backstoryField(){ return `<fieldset class="field setup-back"><legend>Your story so far</legend><div class="diff">${Object.keys(BACKSTORY).map(k=>`<label><input type="radio" name="pback" value="${k}" ${k==='school'?'checked':''}> ${BACKSTORY[k].n}</label>`).join('')}</div><p class="small muted setup-back-d" style="margin:8px 0 0">${esc(BACKSTORY.school.d)}</p></fieldset>`; }
function applyBackstory(st, k){ const b=BACKSTORY[k]; if(!b || k==='school') return; b.fx(st); st.backstory=k; if(BACKSTORY_LINE[k] && st.journal[0]) st.journal[0].text += ' ' + BACKSTORY_LINE[k]; }
document.addEventListener('change', e=>{ if(e.target.name!=='pback') return; const d=document.querySelector('.setup-back-d'); if(d) d.textContent=(BACKSTORY[e.target.value]||{}).d||''; });

/* ---- 2. story side jobs: while a rating blocks the next chapter, the cast finds you work that builds hours ---- */
const SIDE_GIVER = n=> n<6 ? ['mari','Mari'] : n<12 ? ['vivienne','Vivienne'] : ['medina','Medina'];
GEN_JOB_STEPS.push(function sideJobs(st, L){ if(!L) return; const MC=mainChapters(); const next=MC.find(m=>!st.story.done[m.id]); if(!next) return L;
  const need=storyRatingNeed(st,next); if(!need) return L; const [k,nm]=SIDE_GIVER(MC.indexOf(next)); const archs=ARCH.filter(a=>!a.airline && (typeof archOk!=='function' || archOk(st,a)));
  let n=0; for(let t=0;t<8 && n<2;t++){ const j=makeJob(st, pick(archs), false); if(!j || j.network || !j.title) continue; j.side=need; j.sideBy=k; j.pay=Math.round(j.pay*1.3/10)*10; j.title=`${nm}: ${j.title}`;
    j.paras=[`${nm} found you this one. "You need hours for your ${(RATINGS[need]||{}).n||need}. This pays better than most, and I told them you're good."`].concat(j.paras||[]); L.unshift(j); n++; }
  return L; });
AFTER_RESULT.push(function sideJobDone(st, job, f, res){ if(!job.side || res.crash) return; const o=st.last&&st.last.out; if(st.rep&&job.sideBy) st.rep[job.sideBy]=Math.min(100,(st.rep[job.sideBy]||0)+2); const r=RATINGS[job.side]; if(o&&r){ const h=((r.req&&r.req.hours)||0)-st.minutes/60; o.notes.push(h>0?`${PH_WHO[job.sideBy]||'They'} will hear it went well. ${h.toFixed(1)} more hours to your ${r.n}.`:`That's the hours done for your ${r.n}. Book the checkride on the Pilot page.`); } });

/* ---- 3. Halcón shows up early: he takes the best network run some days ---- */
PH_WHO.halcon='Halcón';
const HALCON_TEXTS=[`Saw your load at the ramp. Took it. Medina says faster pilot gets the work. 🦅`,`You're slow, Coral Wing. I flew your run before you finished breakfast.`,`Nothing personal. The Falcon just gets there first.`,`They gave me your route again. Maybe fly at night, like a real pilot.`];
GEN_JOB_STEPS.push(function halconEarly(st, L){ if(!L) return; const c=crime(st); if(!c.on || !st.story.done.CR3 || st.story.done.CRM) return L; const R=r4();
  if(R.halDay===st.day){ return R.halKey ? L.filter(j=>(j.from+j.to+j.title)!==R.halKey) : L; }
  R.halDay=st.day; R.halKey=null; const net=L.filter(j=>j.network); if(!net.length || Math.random()>0.22) return L;
  const best=net.reduce((a,b)=>b.pay>a.pay?b:a); R.halKey=best.from+best.to+best.title; R.halN=(R.halN||0)+1;
  setTimeout(()=>{ try{ phonePush({from:'halcon', fromName:'Halcón', text:HALCON_TEXTS[(R.halN-1)%HALCON_TEXTS.length]}); }catch(_){} },400);
  return L.filter(j=>j!==best); });

/* ---- 4. forecast: some days a storm rolls through; legit jobs pay storm money ---- */
function stormOn(day){ const id=(S.st&&S.st.cid)||(S.st&&S.st.created)||''; return (hashStr('storm'+id+day)%6)===0 && day>2; }
GEN_JOB_STEPS.push(function stormPay(st, L){ if(!L || !stormOn(st.day)) return L; for(const j of L){ if(j.network || j.kind==='story' || j.storm) continue; j.storm=1; j.pay=Math.round(j.pay*1.25/10)*10; } return L; });
function forecastHTML(st){ const t=stormOn(st.day), m=stormOn(st.day+1);
  return `<p class="r4-fc small ${t?'warn':''}" style="margin:0 0 10px"><b>Forecast.</b> ${t?'Storms over the islands today. Legit jobs pay 25% storm money, or sleep it off. ':'Today: trade winds, scattered cloud. '}${m?'Tomorrow: storms coming.':'Tomorrow: fair.'}</p>`; }

/* ---- 5. long legs: near the edge of the plane's range, the briefing names a fuel stop on the way ---- */
GEN_JOB_STEPS.push(function longLegs(st, L){ if(!L) return; for(const j of L){ const a=AC[j.ac]; if(!a || j.local || j.fuelStop || !AP[j.from] || !AP[j.to]) continue; const d=distNm(AP[j.from],AP[j.to]); if(d < a.range*0.6) continue;
    const mid={lat:(AP[j.from].lat+AP[j.to].lat)/2, lon:(AP[j.from].lon+AP[j.to].lon)/2}; const c=Object.keys(AP).filter(k=>k!==j.from&&k!==j.to&&!AP[k].water&&longestRwy(AP[k])>=a.rwy).map(k=>({k,d:distNm(mid,AP[k])})).sort((x,y)=>x.d-y.d)[0];
    if(!c) continue; j.fuelStop=c.k; j.pay=Math.round(j.pay*1.1/10)*10; j.paras=(j.paras||[]).concat([`It's a long leg for the ${a.n}: ${Math.round(d)} of its ${a.range} nm. Carry full fuel and reserves, and know that ${AP[c.k].isl} (${c.k}) is on the way if you need it.`]); }
  return L; });

/* ---- 6. night runs: customs is thinner after dark ---- */
function nightEdge(job){ return job && job.network && typeof isNight==='function' && isNight(job.dep) ? 8 : 0; }

/* ---- 7. investments: something to spend money on ---- */
const INVEST = [
  {k:'hangar', n:'Your own hangar', cost:40000, d:'Planes you own cost 40% less to keep.'},
  {k:'maint', n:'Maintenance contract', cost:25000, d:'All fleet upkeep 25% lower.'},
  {k:'office', n:'Booking office in Philipsburg', cost:60000, d:'Legit jobs out of St. Martin pay 10% more.'},
  {k:'buyout', n:'Buy out Castillo', cost:750000, d:'After the story: buy the whole network and shut it down. Your name, finally clean.', gate:st=>mainChapters().every(m=>st.story.done[m.id])},
];
(function(){ if(typeof ownUpkeep==='function'){ const o=ownUpkeep; ownUpkeep=function(k){ const v=o(k); return invOwned('hangar')?Math.round(v*0.6):v; }; }
  const dc=dailyCosts; dailyCosts=function(st){ const L=dc(st); return invOwned('maint') ? L.map(x=>/upkeep/i.test(x[0])?[x[0],Math.round(x[1]*0.75)].concat(x.slice(2)):x) : L; }; })();
GEN_JOB_STEPS.push(function officePay(st, L){ if(!L || !invOwned('office')) return L; for(const j of L){ if(!j.network && j.kind!=='story' && j.from==='TNCM' && !j.office){ j.office=1; j.pay=Math.round(j.pay*1.1/10)*10; } } return L; });
function investHTML(st){ const R=r4(); return `<section class="panel r4-inv"><div class="section-title"><h2>Investments</h2><span class="small muted">One-time buys that pay you back</span></div><ul class="cs-list" style="list-style:none;padding:0;margin:0">${INVEST.filter(x=>!x.gate||x.gate(st)||R.inv[x.k]).map(x=>`<li class="row between" style="gap:12px;padding:10px 0;border-top:1px solid var(--line)"><div><b>${esc(x.n)}</b><p class="small muted" style="margin:2px 0 0">${esc(x.d)}</p></div>${R.inv[x.k]?'<span class="chip sea">Owned</span>':`<button class="btn sm ${st.cash>=x.cost?'primary':''}" data-act="inv-buy" data-k="${x.k}" ${st.cash<x.cost?'disabled':''}>Buy · ${money(x.cost)}</button>`}</li>`).join('')}</ul></section>`; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="inv-buy"]'); if(!b||!S.st) return; const x=INVEST.find(i=>i.k===b.dataset.k); const st=S.st; if(!x||r4().inv[x.k]||st.cash<x.cost) return;
  txn(st,-x.cost,'Investments',x.n); r4().inv[x.k]=st.day; st.jobsKey=''; addJournal(st, x.k==='buyout'?'You bought out Castillo':`Bought: ${x.n}`, x.k==='buyout'?`Every route, every hangar, every pilot. You signed it all over to a holding company and shut it down the same afternoon.`:x.d, x.k==='buyout'?['castillo']:[], 'milestone');
  save(); render(); toast(x.k==='buyout'?'Castillo\'s network is yours. And now it\'s gone.':`${x.n}: done.`); });
ACH.push({id:'r4_buyout', n:'Hostile Takeover', d:'Buy out Castillo after the story.', t:s=>!!(s.w&&s.w.r4&&s.w.r4.inv&&s.w.r4.inv.buyout)});
ACH.push({id:'r4_invest', n:'Landlord', d:'Own every investment.', t:s=>!!(s.w&&s.w.r4&&s.w.r4.inv&&['hangar','maint','office'].every(k=>s.w.r4.inv[k]))});

/* ---- 8. logbook: filters and totals ---- */
logView=function(){ const st=S.st; if(!st.log.length) return `<main class="wrap"><div class="empty fade"><h3>Your logbook is empty</h3><p>Fly your first job and it'll show up here.</p></div></main>`;
  const F=S.logF||{kind:'all',ac:''}; const acs=[...new Set(st.log.map(l=>l.ac))].filter(k=>AC[k]);
  const L=st.log.filter(l=>(F.kind==='all'||(F.kind==='net'?l.net:F.kind==='story'?l.story:!l.net)) && (!F.ac||l.ac===F.ac));
  const earned=L.reduce((s,l)=>s+(l.pay||0),0), mins=L.reduce((s,l)=>s+(l.min||0),0), gA=L.filter(l=>l.grade==='A').length;
  const opt=(v,t)=>`<option value="${v}" ${F.kind===v?'selected':''}>${t}</option>`;
  return `<main class="wrap stack fade"><section class="panel"><div class="section-title"><h2>Logbook</h2><span class="small muted">${L.length} of ${st.log.length} flights</span></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px"><select data-act="log-kind" aria-label="Which flights">${opt('all','All flights')}${opt('clean','Legit work')}${opt('net','Network runs')}${opt('story','Story chapters')}</select><select data-act="log-ac" aria-label="Aircraft"><option value="">Every aircraft</option>${acs.map(k=>`<option value="${k}" ${F.ac===k?'selected':''}>${esc(AC[k].n)}</option>`).join('')}</select></div>
    <div class="ro-strip"><div><small>Flights</small><b class="mono">${L.length}</b></div><div><small>Time</small><b class="mono">${fmtH(mins)}</b></div><div><small>Earned</small><b class="mono">${money(earned)}</b></div><div><small>A grades</small><b class="mono">${L.length?Math.round(gA/L.length*100):0}%</b></div></div>
    ${L.length?`<div class="scroll-x" tabindex="0"><table><thead><tr><th>Day</th><th>Route</th><th>Aircraft</th><th>Flight</th><th class="num">Block</th><th>Landing</th><th>Grade</th><th class="num">Net pay</th></tr></thead>
    <tbody>${L.map(l=>`<tr><td class="mono">${l.day} · ${hhmm(l.dep)}</td><td class="mono">${esc(l.from)} → ${esc(l.to)}</td><td>${esc(AC[l.ac]?.n||l.ac)}</td><td>${esc(l.title)}${l.net?' <span class="chip warn">Network</span>':''}</td><td class="num">${durTxt(l.min)}</td><td>${esc((LANDING[l.landing]?.n||'').split(' (')[0])}</td><td><b>${l.grade}</b>${l.verified?' <span class="chip sea" title="Recorded by MSFS">MSFS</span>':''}</td><td class="num">${money(l.pay)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">No flights match.</p>'}</section></main>`; };
document.addEventListener('change', e=>{ const a=e.target.dataset&&e.target.dataset.act; if(a!=='log-kind'&&a!=='log-ac') return; S.logF=Object.assign({kind:'all',ac:''},S.logF||{}); S.logF[a==='log-kind'?'kind':'ac']=e.target.value; render(); });
AFTER_RESULT.push(function logStoryTag(st, job){ if(job.kind==='story' && st.log[0]) st.log[0].story=1; });

/* ---- 9. choices come back two or three chapters later ---- */
(function(){ const more={
  CR6: f=>f.askedDez ? `Dez has started leaving the hangar office unlocked for you. He's never said why.` : f.skim ? `Castillo's accountant asks you to count the cash twice in front of him. He watches your hands.` : null,
  CR8: f=>f.politeNo ? `The envelope you turned down comes up again. "Still too polite for money?" Castillo asks. He's smiling. It isn't friendly.` : null,
  CR10:f=>f.skim ? `Somebody has been checking the weights on your loads against the manifests. Dez says it wasn't him.` : null,
  CR12:f=>f.clinic ? `The clinic in Montserrat named its new supply room after "the pilot". The nurse won't tell anyone who that is.` : null,
  CR13:f=>f.oxygen ? `You still carry two oxygen bottles on every flight. Mari has stopped asking why.` : null,
  CR15:f=>f.ticoHidden ? `Medina asks, very casually, if you've heard from Tico. You say no. He writes something down.` : null,
  CR16:f=>f.politeNo&&f.askedDez ? `Reyes says the people who stayed polite and careful are the ones who are still alive. She means you.` : null,
  CRT: f=>f.mariBooks ? `Mari slides a ledger across the table. "Everything you ever earned, clean and dirty. In case you need it."` : f.warned ? `Castillo's car isn't outside this morning. That's worse.` : null,
  CR17:f=>f.castilloPilots ? `Two of Castillo's old pilots are waiting at the hangar. They want to know whose side you're on.` : null,
}; for(const k in more){ const old=ECHO_LINES[k]; ECHO_LINES[k] = old ? (f=>old(f)||more[k](f)) : more[k]; } })();

/* ---- 10. everyday texts between chapters ---- */
const R4_TXT=[
  ['r4m1','mari',['CW1'],['CR3'],`Dez fixed the coffee machine. It now makes tea. Nobody knows how.`,[`Amazing`,`😂`],[`Leave it, it's better`,`Agreed. Don't tell Dez.`]],
  ['r4d1','dez',['CR2'],['CR5'],`rookie you left your sunglasses in the cessna again. third pair. im keeping them`,[`Fair`,`👍`],[`Give them back!`,`come get them`]],
  ['r4m2','mari',['CR3'],['CR6'],`Rain tomorrow, they say. Fly the morning or don't fly at all.`,[`Morning it is`,`Good.`],[`I like the rain`,`You would.`]],
  ['r4t1','tico',['CR5'],['CR9'],`I landed the Bonanza at Saba today. SABA!! I'm shaking`,[`Proud of you`,`🙏 couldn't have done it without you`],[`Show-off`,`ha. jealous`]],
  ['r4v1','vivienne',['CR6'],['CR10'],`Champagne on the jet next time, or is that unprofessional? Asking for myself.`,[`Unprofessional`,`Boring. Fine.`],[`After we land`,`That's the spirit.`]],
  ['r4dz2','dez',['CR7'],['CR11'],`mari's been quiet. buy her lunch or something. not from me`,[`I'll do it`,`good`],[`Why me?`,`because she likes you better. obviously`]],
  ['r4r1','reyes',['CR8'],['CR12'],`Saw your plane at Anguilla. Nice landing. I'm not following you, it's a small island.`,[`Sure`,`Fly safe.`],[`Thanks?`,`You're welcome.`]],
  ['r4t2','tico',['CR9'],['CR11'],`can I ask you something about Medina? not on the phone. never mind`,[`Call me`,`later. its fine`],[`Be careful`,`always`]],
  ['r4m3','mari',['CR10'],['CR14'],`Found your first logbook entry from Coral Wing. 0.9 hours. You were so nervous.`,[`I wasn't!`,`You checked the fuel four times.`],[`Still am`,`Good. Stay that way.`]],
  ['r4me1','medina',['CRM'],['CR13'],`My niece wants to be a pilot. I told her to ask you. Be nice.`,[`Happy to`,`Good.`],[`Tell her to go to school`,`Ha. She will.`]],
  ['r4dz3','dez',['CR12'],['CR15'],`hangar roof leaks over your parking spot. coincidence`,[`Fix it`,`fix it yourself rookie`],[`😂`,`😎`]],
  ['r4v2','vivienne',['CR13'],['CR16'],`I sold the Florida house. Islands are home now. Don't make me regret it.`,[`You won't`,`Promise?`],[`Too late`,`Rude. Accurate.`]],
  ['r4m4','mari',['CR15'],['CRT'],`Whatever happens, the Cessna still has your seat set. Nobody touches it.`,[`Thank you`,`❤️`],[`Keep it that way`,`I will.`]],
];
R4_TXT.forEach(([id,from,need,not,text,a,b])=>PHONE_POOL.push({id, from, need, not, text, opts:[{t:a[0],reply:a[1],rep:{[from]:2}},{t:b[0],reply:b[1],rep:{[from]:1}}]}));

/* ---- 11. a one-time tour of the Money page ---- */
AFTER_RENDER.push(function moneyTour(){ const st=S.st; if(!st || S.view!=='money') return; st.ui=st.ui||{}; if(st.ui.moneyTour) return; st.ui.moneyTour=1; save();
  const step=(n,t,d)=>`<li style="margin:0 0 12px"><b>${n}. ${t}</b><p class="small muted" style="margin:2px 0 0">${d}</p></li>`;
  twSheet('How money works', `<ol style="list-style:none;padding:0;margin:0">${step(1,'Clean money','What you earn from legit jobs. Banks, fuel and the bills are paid from here.')}${step(2,'Dirty money','Network pay. You can\'t spend it openly: big buys with it raise Heat.')}${step(3,'Cleaning it','Run dirty money through a business to make it clean. It costs a cut and takes days.')}${step(4,'Daily costs','Upkeep for your planes and crew comes out every morning. Investments, lower down, cut it.')}</ol><button class="btn primary" data-act="sheet-close" onclick="twSheetClose()">Got it</button>`); });

/* ---- 12. a short scene when a load is seized ---- */
AFTER_RESULT.push(function seizedScene(st, job){ const o=st.last&&st.last.out; if(!o||!job.network) return; if(!o.notes.some(n=>/They found the load/.test(n))) return; const to=job.to, isl=(AP[to]||{}).isl||to;
  setTimeout(()=>{ try{ cutscene({col:'#a8432f', art:(typeof nightRampArt==='function'?nightRampArt(job.ac,false):''), shots:[{card:true,kicker:'Seized',title:`Customs at ${isl}`,auto:1800},[`Ramp · ${to}`, null, `Flashlights in the cabin. A dog in the cargo hold. Somebody pulls the panel behind the seats and goes quiet.`],[`Phone`, 'castillo', `You lost my load. I don't care why. Fly cleaner, or fly for someone else.`]], onEnd:()=>{} }); }catch(_){} }, 900); });

/* ---- 13. airport favourites and nearest first ---- */
function apSortKey(st,k){ return (r4().fav[k]?-1e6:0) + distNm(AP[st.loc],AP[k]); }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="ap-fav"]'); if(!b||!S.st) return; const sel=document.getElementById('travel-to'); const k=(sel&&sel.value)||b.dataset.k; if(!k) return; const F=r4().fav; if(F[k]) delete F[k]; else F[k]=1; S.travelTo=k; save(); render(); toast(F[k]?`${AP[k].isl} is a favourite.`:`Removed ${AP[k].isl} from favourites.`); });

/* ---- 14. title screen: your plane and where you are ---- */
function titleWhere(st){ if(!st||!AP[st.loc]) return ''; const l=st.log&&st.log[0]; return ` · ${esc(AP[st.loc].isl.replace(/\s*\(.*\)/,''))}${l&&AC[l.ac]?` · ${esc(AC[l.ac].n)}`:''}`; }

/* ---- 15. every clickable thing works from the keyboard ---- */
AFTER_RENDER.push(function kbReach(){ document.querySelectorAll('[data-act]:not(button):not(a):not(input):not(select):not(textarea):not(option):not(label):not(form):not([tabindex])').forEach(el=>{ el.tabIndex=0; if(!el.getAttribute('role')) el.setAttribute('role','button'); }); });
document.addEventListener('keydown', e=>{ if(e.key!=='Enter' && e.key!==' ') return; const el=e.target; if(!el || !el.matches || !el.matches('[role="button"][data-act]:not(button)')) return; e.preventDefault(); el.click(); });

/* ---- 16. ambience changes with the page: hangar is low and roomy, story pages are surf, the board is the ramp ---- */
const AMB_TUNE={hangar:[260,0.06], story:[900,0.035], board:[500,0.05], pilot:[420,0.04], profile:[420,0.04], money:[380,0.035]};
AFTER_RENDER.push(function ambTune(){ if(typeof TW_AMB==='undefined' || !TW_AMB.g) return; const t=AMB_TUNE[S.view]; if(!t) return; try{ const c=TW_AMB.g.context, now=c.currentTime; if(TW_AMB.f) TW_AMB.f.frequency.setTargetAtTime(t[0],now,0.6); TW_AMB.g.gain.setTargetAtTime(t[1],now,0.6); }catch(_){} });

/* ---- 17. phone: people and business in separate inboxes ---- */
const PH_BIZ=new Set(['bank','contact','unknown','halcon']);
function phoneBiz(m){ return PH_BIZ.has(m.from) || !!m.biz; }

/* ---- 18. the next achievements, on the Pilot page ---- */
AFTER_RENDER.push(function nextAch(){ const st=S.st; if(!st || S.view!=='pilot' || document.querySelector('.r4-ach')) return; const main=document.querySelector('main'); if(!main) return; st.ach=st.ach||{};
  const L=ACH.filter(a=>!st.ach[a.id] && !a.secret).slice(0,3); if(!L.length) return; const got=ACH.filter(a=>st.ach[a.id]).length;
  const html=`<section class="panel r4-ach"><div class="section-title"><h2>Next achievements</h2><span class="small muted">${got} of ${ACH.length} earned</span></div><ul class="cs-list" style="list-style:none;padding:0;margin:0">${L.map(a=>`<li style="padding:8px 0;border-top:1px solid var(--line)"><b>${esc(a.n)}</b> <span class="small muted">${esc(a.d)}</span></li>`).join('')}</ul></section>`;
  const first=main.querySelector('section.panel'); if(first) first.insertAdjacentHTML('afterend', html); else main.insertAdjacentHTML('beforeend', html); });

/* ---- 19. the epilogue says where everyone ended up ---- */
(function(){ const o=epilogueExtra; epilogueExtra=function(st, L){ const r=o(st,L); const out=Array.isArray(r)?r:L; const f=flagsOf(st), end=crime(st).ending; const has=n=>out.some(x=>x.includes(n));
  if(!has('Reyes')) out.push(end==='walk'||end==='ghost' ? `Reyes closed her file on you without a word. She keeps a copy at home.` : `Reyes made deputy director. She still has your photo on a whiteboard, with a question mark.`);
  if(!has('Vivienne')) out.push(`Vivienne flies the Starling II herself now. She calls when she needs a second pilot, and sometimes when she doesn't.`);
  if(!has('Dez')&&!f.dezJail) out.push(`Dez never left the hangar. Someone has to keep the coffee machine making tea.`);
  if(!has('Medina')) out.push(end==='kingpin' ? `Medina works for you now. Neither of you says it out loud.` : `Medina moved to Panama. He sends a bottle of rum every Christmas, with no card.`);
  if(!has('Castillo')) out.push(r4().inv.buyout ? `You bought Castillo out and shut it all down. He lives in Miami and plays golf badly.` : end==='kingpin' ? `Castillo is a name people use to scare new pilots now. Nobody has seen him in years.` : `Castillo is in a federal prison in Florida. He still gets letters from people who owe him.`);
  if(st.backstory==='airline') out.push(`The airline that let you go offered you a job. You said no, politely.`);
  return r; }; })();

/* where the forecast and investments show up */
AFTER_RENDER.push(function r4Panels(){ const st=S.st; if(!st) return;
  if(S.view==='board' && !document.querySelector('.r4-fc')){ const h=document.querySelector('.b2-head'); if(h) h.insertAdjacentHTML('beforebegin', forecastHTML(st)); }
  if(S.view==='money' && !document.querySelector('.r4-inv')){ const m=document.querySelector('main'); if(m) m.insertAdjacentHTML('beforeend', investHTML(st)); } });

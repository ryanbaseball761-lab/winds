/* ===================== THE WORLD BETWEEN FLIGHTS (0.68) =====================
   Things that happen while you're on the ground:
   - Phone: texts from the cast between chapters; some want an answer, and the answer counts.
   - Islands: every island remembers how you behave there. Good work pays better; trouble gets you watched.
   - Market: a week-long event somewhere in the islands (a storm, a crackdown, a festival) changes the work.
   - Contacts: one fixer per island who sends you their own jobs once you're known there.
   - Bribes: pay a customs officer to look the other way at one airport. It works, until he gets caught.
   - Castillo's loan: fast money with a due date, and he collects.
   - Properties: a bar, a dive shop, a hangar office, a villa. Income, a front for dirty cash, and a better life.
   - Aircraft history: every plane keeps a logbook and can have a name.
   - First officer personality: the one you hire has habits.
   Shared helpers live at the top: twSheet() opens a panel over the page. */

/* ---------- small shared helpers ---------- */
function twW(){ const st=S.st; st.w=st.w||{}; const w=st.w; w.phone=w.phone||{msgs:[],seen:{}}; w.isl=w.isl||{}; w.contacts=w.contacts||{}; w.bribes=w.bribes||{}; w.props=w.props||{}; w.ac=w.ac||{}; return w; }
function wDone(id){ const st=S.st; return !!(st && st.story && st.story.done && st.story.done[id]); }
function wFlags(){ return (S.st && crime(S.st).flags) || {}; }
function wRep(k,v){ const st=S.st; if(!st.rep) st.rep={}; st.rep[k]=clamp((st.rep[k]||10)+v,0,100); }
function wSeed(n){ const st=S.st; return rng(hashStr(`${st.day}|${n||0}|${st.pilot&&st.pilot.name||''}|tw`)); }
function islOf(code){ return (AP[code] && AP[code].isl) || code; }

/* a panel that opens over the page (Esc or the button closes it) */
let twSheetOpener=null;
function twSheet(title, body, cls){ const op=document.activeElement; twSheetClose(); twSheetOpener=op; const d=document.createElement('div'); d.className='tw-sheet-bg'; d.innerHTML=`<div class="tw-sheet ${cls||''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button class="btn sm ghost" data-act="w-close" aria-label="Close">Close</button></header><div class="tw-sheet-body">${body}</div></div>`;
  document.body.appendChild(d); S._sheet={title,cls}; const f=d.querySelector('button:not([data-act="w-close"]),input,select'); (f||d.querySelector('button')).focus(); }
function twSheetClose(){ const had=!!document.querySelector('.tw-sheet-bg'); document.querySelectorAll('.tw-sheet-bg').forEach(e=>e.remove()); S._sheet=null; if(had && twSheetOpener && twSheetOpener.isConnected){ try{ twSheetOpener.focus(); }catch(_){} } twSheetOpener=null; }
document.addEventListener('keydown', e=>{ if(e.key!=='Tab') return; const d=document.querySelector('.tw-sheet'); if(!d) return; const f=[...d.querySelectorAll('button,input,select,a[href],textarea')].filter(x=>!x.disabled&&x.offsetParent); if(!f.length) return;
  const first=f[0], last=f[f.length-1]; if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } });
function twSheetBody(html){ const b=document.querySelector('.tw-sheet-body'); if(b) b.innerHTML=html; }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && document.querySelector('.tw-sheet-bg')){ twSheetClose(); } });
document.addEventListener('click', e=>{ if(e.target.classList && e.target.classList.contains('tw-sheet-bg')) twSheetClose(); });

/* day and flight hooks for the modules that come after this one */
const DAY_HOOKS = [];

/* =====================================================================
   PHONE
   ===================================================================== */
const PH_WHO = { dez:'Dez', mari:'Mari', castillo:'Castillo', tico:'Tico', reyes:'Reyes', hartwell:'Hartwell', medina:'Medina', unknown:'Unknown number', bank:'Island Credit Union', contact:'' };

/* need: chapters that must be done; not: chapters that must NOT be done yet; crime: only once Castillo's work started */
const PHONE_POOL = [
  {id:'d1', from:'dez', need:['CW1'], not:['CR3'], text:`you did good today rookie. dont tell mari about the box ok. shes got enough on her plate`,
    opts:[{t:`Won't say a word`, reply:`👍 good man`, rep:{dez:3}}, {t:`What was in it, Dez?`, reply:`parts. just parts. go to sleep`, rep:{dez:-1}, flag:'askedBox'}]},
  {id:'m1', from:'mari', need:['CW1'], not:['CR4'], text:`Fuel bill came in. Can you take the 7am mail run tomorrow? I can't pay overtime but I'll buy lunch.`,
    opts:[{t:`I'll take it`, reply:`You're a lifesaver.`, rep:{mari:3}}, {t:`Can't, sorry`, reply:`Ok. I'll ask Dez to do it. Again.`, rep:{mari:-1}}]},
  {id:'d2', from:'dez', need:['CR2'], not:['CR4'], text:`my friend says ur the calmest pilot hes had. thats worth money in this business`},
  {id:'m2', from:'mari', need:['CR3'], not:['CR5'], text:`Customs called the office asking about your Anguilla flights. I told them you're new. Are you ok?`,
    opts:[{t:`I'm fine. Just paperwork`, reply:`Ok. Just be careful who you fly for.`, rep:{mari:-1}}, {t:`I'll tell you later`, reply:`I'm holding you to that.`, rep:{mari:2}, flag:'promisedMari'}]},
  {id:'c1', from:'castillo', need:['CR4'], not:['CR6'], text:`A good dinner should be followed by a good flight. Expect a call.`},
  {id:'h1', from:'hartwell', need:['CR5'], not:['CR8'], text:`Do look after the Vision Jet. She's the only thing in my life that does exactly what she's told. — L.H.`},
  {id:'r0', from:'unknown', need:['CR7'], not:['CR9'], text:`Nice landing in Tortola. We should talk sometime.`,
    opts:[{t:`Who is this?`, reply:`Someone who reads flight plans.`}, {t:`(Delete it)`, reply:null}]},
  {id:'t1', from:'tico', need:['CR8'], not:['CR11'], text:`boss i watched 4 hours of landing videos on youtube last night. ask me anything. ANYTHING`,
    opts:[{t:`What's a flare?`, reply:`when u pull back right before the ground!!! see i know stuff`, rep:{tico:3}}, {t:`Go to sleep, Tico`, reply:`ok boss 😴`, rep:{tico:1}}]},
  {id:'r1', from:'reyes', need:['CR9'], not:['CR12'], crime:true, text:`Saw your plane in Punta Cana. Pretty weather for it.`,
    opts:[{t:`Just a charter`, reply:`Sure.`, heat:1}, {t:`(Don't answer)`, reply:null}]},
  {id:'c2', from:'castillo', need:['CR10'], not:['CR12'], crime:true, text:`The boy loads too slowly. Make him faster or I'll find someone who is.`,
    opts:[{t:`I'll talk to him`, reply:`Do.`, rep:{castillo:2}}, {t:`He's fine. Leave him alone`, reply:`Careful.`, rep:{castillo:-3, tico:3}, power:-1}]},
  {id:'t2', from:'tico', need:['CR10'], not:['CR11'], text:`told my mom i work with planes now. she cried. good crying`},
  {id:'d3', from:'dez', need:['CR10'], not:['CR12'], text:`rookie. that jet. those men. you sure about all this?`,
    opts:[{t:`I'm sure`, reply:`ok. ok. just checking`, rep:{dez:-1}}, {t:`No`, reply:`me neither. lets get a beer sometime and not talk about it`, rep:{dez:3}}]},
  {id:'me1', from:'medina', need:['CRM'], not:['CR11'], crime:true, text:`You fly well for a man who works for a snake. My door is always open.`,
    opts:[{t:`Not interested`, reply:`Everybody is interested eventually.`, rep:{medina:-2, castillo:1}}, {t:`What's the offer?`, reply:`When you're ready, you'll know.`, rep:{medina:3}, heat:2, flag:'medinaCurious'}]},
  {id:'m3', from:'mari', need:['CR12'], not:['CR13'], text:`They took Dez. I don't understand any of this. Please call me.`,
    opts:[{t:`I'm coming over`, reply:`Thank you.`, rep:{mari:4}}, {t:`I can't talk right now`, reply:`...`, rep:{mari:-3}}]},
  {id:'r2', from:'reyes', need:['CR12'], not:['CR14'], crime:true, text:`Dez still isn't talking. Loyalty like that should go both ways.`},
  {id:'h2', from:'hartwell', need:['CR13'], not:['CR14'], text:`Might I borrow you and an airliner next week? I have some papers that need a quiet trip.`},
  {id:'c3', from:'castillo', need:['CR15'], not:['CRB'], crime:true, text:`Congratulations on the airline. I mean it. Half of it is mine, of course.`,
    opts:[{t:`We'll talk`, reply:`We will.`}, {t:`It's mine`, reply:`Enjoy it while it is.`, rep:{castillo:-4}, heat:2}]},
  {id:'t3', from:'tico', need:['CR11'], text:`im ok boss. new number. dont look for me. thank u`, gate:f=>f.ticoRan},
  {id:'d4', from:'dez', need:['CR12'], text:`out. lawyer says i owe u. i say we're even. beer friday`, gate:f=>f.dezFree},
  {id:'m4', from:'mari', need:['CR16'], text:`Saw the 747 leave from the office window. Couldn't decide if I was proud or terrified. Both, I think.`},
  {id:'b1', from:'bank', need:[], text:`Island Credit Union: your account is now active. Savings pay 4.5% APY. Reply STOP to opt out.`},
];

function phoneEligible(p){ const st=S.st, w=twW(); if(w.phone.seen[p.id]) return false; const c=crime(st);
  if(p.crime && !c.on) return false; if((p.need||[]).some(id=>!wDone(id))) return false; if((p.not||[]).some(id=>wDone(id))) return false; if(p.gate && !p.gate(wFlags())) return false; return true; }
/* a new text: the sender's display name comes from the pool; someone you've upset drops the friendly emoji */
function phonePush(m){ const w=twW(); const p=m.pid&&PHONE_POOL.find(x=>x.id===m.pid); if(p&&p.fromName&&!m.fromName) m.fromName=p.fromName;
  const r=S.st.rep&&S.st.rep[m.from]; if(r!=null && r<25 && typeof m.text==='string') m.text=m.text.replace(/\s*[👍😴🙏❤️😂]+/g,'');
  m.id=m.id||('x'+Date.now().toString(36)+Math.floor(Math.random()*999)); m.day=S.st.day; m.t=S.st.clock; m.read=false;
  w.phone.msgs.unshift(m); w.phone.seen[m.pid||m.id]=1; if(w.phone.msgs.length>60) w.phone.msgs.length=60; phoneBadge(); try{ twSfx && twSfx('buzz'); }catch(_){} }
function phoneDeliver(max){ const st=S.st; if(!st) return 0; const L=PHONE_POOL.filter(phoneEligible); let n=0;
  for(const p of L){ if(n>=max) break; phonePush({pid:p.id, from:p.from, text:p.text, opts:p.opts?p.opts.map((o,i)=>({i,t:o.t})):null}); n++; }
  if(n) save(); return n; }
function phoneNeedsAnswer(m){ return m.ans==null && !!(PHONE_POOL.find(p=>p.id===m.pid)||{}).opts; }
function phoneUnread(){ if(!S.st) return 0; return twW().phone.msgs.filter(m=>!m.read || phoneNeedsAnswer(m)).length; }
function notifUnread(){ return Math.max(0, (S.notifs||[]).length-(S.notifSeen||0)); }
/* one badge on the phone: unread texts plus new notifications */
function phoneBadge(){ const n=phoneUnread()+notifUnread(); document.querySelectorAll('.cb-phone b').forEach(b=>{ b.textContent=n>9?'9+':n; b.style.display=n?'':'none'; }); }
function phoneAnswer(id, i){ const w=twW(); const m=w.phone.msgs.find(x=>x.id===id); if(!m || m.ans!=null) return; const p=PHONE_POOL.find(x=>x.id===m.pid); const o=(p&&p.opts&&p.opts[i]) || (m.optsFull&&m.optsFull[i]); if(!o) return;
  m.ans=i; m.ansT=o.t; m.reply=o.reply; m.read=true; const c=crime(S.st);
  for(const k in (o.rep||{})) wRep(k,o.rep[k]); if(o.heat && c.on) crBump(c,'heat',o.heat); if(o.power && c.on) crBump(c,'power',o.power); if(o.flag) c.flags[o.flag]=1; if(o.cash) txn(S.st,o.cash,'Gifts & windfalls',PH_WHO[m.from]||'Phone');
  if(o.run){ try{ o.run(); }catch(_){} }
  w.stats=w.stats||{atc:0,ph:0,fuel:0}; w.stats.ph++; save(); phoneBadge(); }
/* the phone has two tabs: texts (the ones waiting for an answer first) and the game's notifications */
function phoneHTML(tab){ tab=tab||S._phTab||'msgs'; S._phTab=tab; const w=twW(); const nN=notifUnread(), nM=phoneUnread();
  const tabs=`<div class="ph-tabs" role="tablist"><button role="tab" aria-selected="${tab==='msgs'}" class="${tab==='msgs'?'on':''}" data-act="ph-tab" data-v="msgs">Messages${nM?` <i>${nM}</i>`:''}</button><button role="tab" aria-selected="${tab==='notifs'}" class="${tab==='notifs'?'on':''}" data-act="ph-tab" data-v="notifs">Notifications${nN?` <i>${nN}</i>`:''}</button></div>`;
  if(tab==='notifs'){ const L=S.notifs||[]; return tabs + (L.length ? `<div class="row between ph-top"><span class="small muted">This session</span><button class="btn sm ghost" data-act="ph-clear">Clear</button></div><ul class="ph-notifs">${L.map(n=>`<li><small class="mono">${new Date(n.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small><span>${esc(n.m)}</span></li>`).join('')}</ul>` : `<p class="muted">Nothing yet this session.</p>`); }
  const all=w.phone.msgs; if(!all.length) return tabs+`<p class="muted">No messages. Quiet days are allowed.</p>`;
  const L=all.filter(phoneNeedsAnswer).concat(all.filter(m=>!phoneNeedsAnswer(m))); const n=all.filter(m=>!m.read).length;
  return tabs+`<div class="row between ph-top"><span class="small muted">${all.length} message${all.length>1?'s':''}${n?`, ${n} new`:''}</span>${n?`<button class="btn sm ghost" data-act="ph-allread">Mark all read</button>`:''}</div>
  <ol class="ph-list">${L.map(m=>{ const who=m.fromName||PH_WHO[m.from]||m.from; const p=PHONE_POOL.find(x=>x.id===m.pid); const opts=(p&&p.opts)||m.optsFull;
    return `<li class="ph-msg ${m.read?'':'new'}"><div class="ph-h"><b>${esc(who)}</b><small class="mono">Day ${m.day} · ${hhmm(m.t)}</small></div><p class="ph-in">${esc(m.text)}</p>
      ${m.ans!=null?`<p class="ph-out">${esc(m.ansT)}</p>${m.reply?`<p class="ph-in">${esc(m.reply)}</p>`:''}`:
        opts?`<div class="ph-opts">${opts.map((o,i)=>`<button class="btn sm" data-act="w-ph-ans" data-id="${m.id}" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`:''}</li>`; }).join('')}</ol>`; }
function openPhone(tab){ const w=twW(); twSheet('Phone', phoneHTML(tab), 'ph-sheet'); if((tab||S._phTab)==='notifs') S.notifSeen=(S.notifs||[]).length; w.phone.msgs.forEach(m=>{ if(!phoneNeedsAnswer(m)) m.read=true; }); save(); phoneBadge(); }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="ph-tab"],[data-act="ph-allread"],[data-act="ph-clear"]'); if(!b||!S.st) return; const a=b.dataset.act;
  if(a==='ph-tab'){ if(b.dataset.v==='notifs') S.notifSeen=(S.notifs||[]).length; twSheetBody(phoneHTML(b.dataset.v)); }
  else if(a==='ph-allread'){ twW().phone.msgs.forEach(m=>{ if(!phoneNeedsAnswer(m)) m.read=true; }); save(); twSheetBody(phoneHTML()); }
  else if(a==='ph-clear'){ S.notifs=[]; S.notifSeen=0; twSheetBody(phoneHTML('notifs')); }
  phoneBadge(); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  if(a==='w-close'){ twSheetClose(); }
  else if(a==='w-phone'){ openPhone(); }
  else if(a==='bell'){ openPhone('notifs'); }
  else if(a==='w-ph-ans'){ phoneAnswer(b.dataset.id, +b.dataset.i); const m=twW().phone.msgs.find(x=>x.id===b.dataset.id); if(m) m.read=true; save(); twSheetBody(phoneHTML()); phoneBadge(); } });
DAY_HOOKS.push(st=>{ phoneDeliver(1); });

/* =====================================================================
   ISLANDS
   ===================================================================== */
function islRep(isl){ return twW().isl[isl]||0; }
function islBump(isl, v){ const w=twW(); w.isl[isl]=clamp((w.isl[isl]||0)+v,-50,50); }
function islWord(v){ return v>=30?'Welcomed':v>=12?'Liked':v>-12?'Known':v>-30?'Watched':'Unwelcome'; }
/* pay to an island moves with how it sees you: up to +10% when welcomed, -10% when unwelcome */
function islPayMul(code){ return 1 + clamp(islRep(islOf(code))/500, -0.1, 0.1); }

/* =====================================================================
   MARKET EVENTS (one at a time, about a week each)
   ===================================================================== */
const MKT = [
  {id:'storm', n:'Tropical storm', reg:['LEE','WIN','VIR'], cats:['cargo'], mul:1.6, txt:r=>`A tropical storm hit ${r}. Relief and cargo flights there pay 60% more this week.`, from:'mari'},
  {id:'crack', n:'Customs crackdown', isl:true, mul:1, heat:6, txt:i=>`Customs is cracking down in ${i} this week. Network runs there add 6 more Heat.`, from:'dez', crime:true},
  {id:'fest', n:'Film festival', isl:true, cats:['vip','pax'], mul:1.4, txt:i=>`Film festival in ${i}. Charters going there pay 40% more.`, from:'hartwell'},
  {id:'regatta', n:'Regatta week', isl:true, cats:['pax'], mul:1.3, txt:i=>`Regatta week in ${i}: sailors everywhere and every seat sold. Passenger flights there pay 30% more.`, from:'mari'},
  {id:'fuel', n:'Fuel strike', isl:true, cats:null, mul:1.25, txt:i=>`Fuel workers are on strike in ${i}. Anyone who flies there anyway gets paid 25% more.`, from:'dez'},
  {id:'cruise', n:'Cruise ship stranded', isl:true, cats:['pax'], mul:1.5, txt:i=>`A cruise ship broke down off ${i}. Six hundred tourists need flights home. Passenger work there pays 50% more.`, from:'mari'},
];
function mktNow(){ const w=twW(); return (w.mkt && w.mkt.until>=S.st.day) ? w.mkt : null; }
function mktRoll(st){ const w=twW(); if(mktNow()) return; if(w.mktNext && st.day<w.mktNext) return; const r=wSeed(11); if(r()<0.5){ w.mktNext=st.day+2; return; }
  const c=crime(st); const pool=MKT.filter(m=>!m.crime||c.on); const m=pool[Math.floor(r()*pool.length)];
  const islands=[...new Set(Object.keys(AP).filter(k=>AP[k].r && ['LEE','WIN','VIR','ABC','GA'].includes(AP[k].r)).map(k=>AP[k].isl))].filter(Boolean);
  const isl=islands[Math.floor(r()*islands.length)]||'Antigua';
  const reg=m.reg ? m.reg[Math.floor(r()*m.reg.length)] : null;   // storms hit any of their regions, not always the first
  const regName={LEE:'the Leeward Islands',WIN:'the Windward Islands',VIR:'the Virgin Islands'}[reg||'']||'';
  w.mkt={id:m.id, isl:m.isl?isl:null, reg, until:st.day+6, text:m.txt(m.isl?String(isl).replace(/\s*\(.*?\)/,''):regName)}; w.mktNext=st.day+9;
  phonePush({from:m.from, text:w.mkt.text}); }
function mktHit(job){ const e=mktNow(); if(!e) return null; const m=MKT.find(x=>x.id===e.id); const ap=AP[job.to]; if(!ap||!m) return null;
  const where = e.isl ? ap.isl===e.isl : ap.r===e.reg; if(!where) return null; if(m.cats && !m.cats.includes(job.cat) && !(m.cats.includes('vip')&&job.vip)) return null; return m; }
DAY_HOOKS.push(mktRoll);

/* =====================================================================
   CONTACTS (one fixer per island)
   ===================================================================== */
const CONTACTS = [
  {id:'lou', n:'Lou Baptiste', ap:'TQPF', role:'runs the fuel truck at Anguilla', arch:['catch','divers','aog'], line:`"Lou says you're good people. Here's one he trusts you with."`},
  {id:'abigail', n:'Sister Abigail', ap:'TAPA', role:'runs the clinic supply room in Antigua', arch:['medical','doctor','vet'], line:`"Sister Abigail asked for you by name."`},
  {id:'kiko', n:'Kiko Ramos', ap:'TJSJ', role:'a freight broker in San Juan who pays on time', arch:['aog','mail','radio'], line:`"Kiko had a load nobody else wanted. You're not nobody."`},
  {id:'oona', n:'Oona Hodge', ap:'TFFJ', role:'books the St. Barth villas', arch:['vip_celeb','vip_ceo','honeymoon','proposal'], line:`"Oona needs someone discreet. That's you."`},
  {id:'pere', n:'Père Léon', ap:'TFFR', role:'a priest in Guadeloupe who knows every family on every island', arch:['priest','school','wedding'], line:`"Père Léon sends his blessing and a job."`},
  {id:'vic', n:'Victor Lake', ap:'TNCM', role:'a dispatcher at Princess Juliana who hears everything', arch:['missed_ship','lost','mainland'], line:`"Vic slid this one across the counter before it hit the board."`},
];
function contactLevel(id){ return twW().contacts[id]||0; }
function contactsMet(){ return CONTACTS.filter(k=>islRep(islOf(k.ap))>=8 || contactLevel(k.id)>0); }
/* a contact's job: paid 25% over the board, and the contact likes you more each time */
function contactJob(st, k){ const archs=ARCH.filter(a=>k.arch.includes(a.id) && archOk(st,a)); if(!archs.length) return null;
  for(let t=0;t<6;t++){ const j=makeJob(st, pick(archs), false); if(j){ j.contact=k.id; j.pay=Math.round(j.pay*1.25/10)*10; j.title=`${k.n.split(' ')[0]}: ${j.title}`; j.paras=[k.line].concat(j.paras||[]); return j; } } return null; }

/* =====================================================================
   BRIBES
   ===================================================================== */
const BRIBE_DAYS=7;
function bribeCost(code){ const h=crime(S.st).heat||0; return Math.round((2500 + h*60)/100)*100; }
function bribeActive(code){ const b=twW().bribes[code]; return b && b.until>=S.st.day; }
/* called first thing by the customs step (game-flow.js): true when your man handled it */
function bribeCustoms(st, job, res){ const c=crime(st); const o=st.last&&st.last.out;
    if(c.on && !res.crash && (job.network||job.kind==='story') && bribeActive(job.to) && c.heat>=60){
      const b=twW().bribes[job.to]; b.used=(b.used||0)+1;
      if(Math.random()<0.1*b.used){ delete twW().bribes[job.to]; crBump(c,'heat',15); islBump(islOf(job.to),-15); if(o) o.notes.push(`Your man in customs at ${job.to} got caught taking money. He gave them your name. Heat +15.`);
        phonePush({from:'reyes', text:`A customs officer in ${islOf(job.to)} just told us a very interesting story about you.`}); return true; }
      if(job.network){ crBump(c,'heat',12); crBump(c,'power',1); }
      if(o) o.notes.push(`Customs came out to the plane at ${job.to}. Your man looked at the paperwork, then at you, and waved you through.`); return true; }
    return false; }

/* =====================================================================
   CASTILLO'S LOAN
   ===================================================================== */
function loanNow(){ return twW().loan||null; }
function loanTake(amt){ const w=twW(); if(w.loan) return; w.loan={amt, owe:Math.round(amt*1.2), due:S.st.day+14, warned:0}; txn(S.st, amt, 'Gifts & windfalls', 'Loan from Castillo');
  phonePush({from:'castillo', text:`${money(Math.round(amt*1.2))} in two weeks. I'm generous, not patient.`}); save(); }
function loanRepay(){ const w=twW(), L=w.loan; if(!L || S.st.cash<L.owe) return false; txn(S.st, -L.owe, 'Owed to Castillo', 'Loan repaid'); w.loan=null; wRep('castillo',2); phonePush({from:'castillo', text:`Paid in full. You see? We understand each other.`}); save(); return true; }
DAY_HOOKS.push(st=>{ const w=twW(), L=w.loan; if(!L) return; const left=L.due-st.day; const c=crime(st);
  if(left===3 && L.warned<1){ L.warned=1; phonePush({from:'castillo', text:`Three days. ${money(L.owe)}.`}); }
  if(left===0 && L.warned<2){ L.warned=2; phonePush({from:'unknown', fromName:'Unknown number', text:`Mr. Castillo asked us to remind you. Nicely, this time.`}); }
  if(left<0){ const take=Math.min(Math.max(st.cash,0), Math.round(L.owe*1.5)); if(take>0) txn(st,-take,'Owed to Castillo','Castillo\'s collector'); w.loan=null;
    if(c.on){ crBump(c,'power',-10); crBump(c,'heat',3); } wRep('castillo',-6);
    phonePush({from:'unknown', fromName:'Unknown number', text:`We took ${money(take)} from your account. Mr. Castillo considers the matter closed. Your hangar door has a new dent.`});
    st._loanCollected=st.day; } });

/* =====================================================================
   PROPERTIES (some are fronts that clean dirty cash)
   ===================================================================== */
const PROPS = [
  {id:'office', n:'Hangar office', price:18000, inc:60, launder:0, home:'A desk, a kettle and a window onto the ramp.', note:'Your own desk at the airport. +1 reputation a week.'},
  {id:'dive', n:'Dive shop on Saba', price:45000, inc:180, launder:3000, front:true, home:'Wetsuits drying on the rail outside.', note:'Pays a little. Washes up to $3,000 of dirty cash a day, for 8%.'},
  {id:'bar', n:'Beach bar, Anguilla', price:90000, inc:320, launder:7000, front:true, home:'Your bar. Dez drinks there for free, which costs you more than you think.', note:'Washes up to $7,000 a day, for 8%. Busy bars draw a little attention.'},
  {id:'desk', n:'Charter desk at Juliana', price:140000, inc:520, launder:0, home:'Your name on a desk in the terminal, between a car rental and a rum shop.', note:'Steady income, and island work pays a little more: +1 reputation every week.'},
  {id:'fbo', n:'FBO lounge, St. Barth', price:250000, inc:900, launder:20000, front:true, home:'Leather sofas, espresso, a guestbook full of famous names.', note:'Real money, and washes up to $20,000 a day, for 8%.'},
];
function propOwned(id){ return !!twW().props[id]; }
function propBuy(id){ const p=PROPS.find(x=>x.id===id); if(!p || propOwned(id) || S.st.cash<p.price) return false; txn(S.st,-p.price,'Property',p.n); twW().props[id]={since:S.st.day}; save(); return true; }
DAY_HOOKS.push(st=>{ const w=twW(); const c=crime(st); let inc=0, washed=0, fee=0;
  for(const p of PROPS){ if(!w.props[p.id]) continue; inc+=p.inc;
    if(p.front && c.dirty>0){ const amt=Math.min(c.dirty, p.launder); const f=Math.round(amt*0.08); c.dirty-=amt; washed+=amt-f; fee+=f; if(p.id==='bar' && amt>3000) crBump(c,'heat',1); } }
  if(inc) txn(st, inc, 'Property income', 'From your businesses'); if(washed) { txn(st, washed, 'Laundered', 'Through your businesses'); c.laundered=(c.laundered||0)+washed; }
  if((w.props.office||w.props.desk) && st.day%7===0) st.reputation=Math.min(100,st.reputation+1);
  w.wk=w.wk||{inc:0,washed:0}; w.wk.inc+=inc; w.wk.washed+=washed;
  if(st.day%7===0 && (w.wk.inc||w.wk.washed)){ phonePush({from:'bank', text:`Island Credit Union weekly summary: your businesses earned ${money(w.wk.inc)}${w.wk.washed?` and deposited ${money(w.wk.washed)} in "takings"`:''}.`}); w.wk={inc:0,washed:0}; } });

/* =====================================================================
   AIRCRAFT HISTORY (and names)
   ===================================================================== */
function acHist(id){ const w=twW(); w.ac[id]=w.ac[id]||{f:0,m:0,best:null,hard:0,nick:''}; return w.ac[id]; }
function acName(id){ const h=twW().ac[id]; return (h&&h.nick) ? `"${h.nick}"` : ''; }

/* =====================================================================
   FIRST OFFICER PERSONALITY
   ===================================================================== */
const FO_TRAITS = [
  {id:'ace', n:'Steady hands', d:'A good stick. Your landings score a little higher with them aboard.'},
  {id:'chatty', n:'Talks too much', d:'Great company. Mentions your flights to the wrong people: +1 Heat on network runs.'},
  {id:'sticky', n:'Light fingers', d:'Sometimes a bag comes back lighter. Network runs lose 5% one time in ten.'},
  {id:'saint', n:'By the book', d:'Hates the network work. Legit flights cool 1 extra Heat.'},
];
function foTrait(){ const w=twW(); if(!crewHas(S.st,'fo')) return null; if(!w.fo) w.fo=FO_TRAITS[Math.floor(wSeed(3)()*FO_TRAITS.length)].id; return FO_TRAITS.find(t=>t.id===w.fo); }

/* =====================================================================
   AFTER EACH FLIGHT
   ===================================================================== */
AFTER_RESULT.push(function worldAfterFlight(st, job, f, res, was){ if(job.practice) return; const o=st.last&&st.last.out; const c=crime(st); const isl=islOf(job.to);
  // islands
  if(res.crash) islBump(isl,-6);
  else { const g=res.grade; islBump(isl, g==='A'?3:g==='B'?2:g==='C'?1:g==='F'?-2:0); if(job.network) islBump(isl,-4);
    if(o && o.notes.some(n=>/^Customs searched|^BUSTED/.test(n))) islBump(isl,-12); }
  const v=islRep(isl), before=v-(res.crash?-6:0); if(o && Math.abs(v)>=12 && !st._islSaid?.[isl]){ st._islSaid=st._islSaid||{}; st._islSaid[isl]=1; o.notes.push(v>0?`${isl} knows you now. Work there pays a little better.`:`People in ${isl} have started watching you. Work there pays less.`); }
  // contacts
  if(job.contact){ const w=twW(); w.contacts[job.contact]=(w.contacts[job.contact]||0)+1; const k=CONTACTS.find(x=>x.id===job.contact); if(k && o) o.notes.push(`${k.n} will remember this.`); }
  // the market
  const m=mktHit(job); if(m && m.heat && job.network && c.on){ crBump(c,'heat',m.heat); if(o) o.notes.push(`Customs crackdown in ${isl}: Heat +${m.heat}.`); }
  // aircraft history
  if(job.ac && !res.crash){ const h=acHist(job.ac); h.f++; h.m+=Math.round(res.block||job.est||0); const fpm=f&&f.simFpm; if(fpm!=null){ if(h.best==null||fpm<h.best) h.best=fpm; if(fpm>600) h.hard++; } }
  // first officer
  const t=foTrait(); if(t && o){ if(t.id==='chatty' && job.network && c.on){ crBump(c,'heat',1); }
    if(t.id==='sticky' && job.network && Math.random()<0.1){ const cut=Math.round(job.pay*0.05); c.dirty=Math.max(0,(c.dirty||0)-cut); o.notes.push(`Your first officer's bag looked heavier than his luggage allowance. ${money(cut)} is missing.`); }
    if(t.id==='saint' && job.kind==='gen' && !job.network && c.on) crBump(c,'heat',-1); }
  // a story chapter might prompt a text or two
  if(job.kind==='story') setTimeout(()=>{ const before=twW().phone.msgs.length; if(phoneDeliver(2)){ const who=[...new Set(twW().phone.msgs.slice(0,twW().phone.msgs.length-before).map(m=>m.fromName||PH_WHO[m.from]))]; toast(`Your phone buzzes: ${who.join(' and ')}.`); } }, 4000);
});

/* jobs: island pay, market events and contact work */
GEN_JOB_STEPS.push(function worldJobs(st, L){ if(!L) return;
  for(const j of L){ if(j.kind!=='gen') continue; const mul=islPayMul(j.to); const m=mktHit(j); let p=j.pay*mul*(m?m.mul:1); if(m){ j.mkt=m.n; } j.pay=Math.round(p/10)*10; }
  const k=CONTACTS.find(x=>x.ap===st.loc); if(k && (islRep(islOf(k.ap))>=8 || contactLevel(k.id)>0)){ const j=contactJob(st,k); if(j) L.unshift(j); }
  return L; });
/* the ace first officer helps the landing score a little */
(function(){ const i=AFTER_RESULT.findIndex(f=>f.name==='worldAfterFlight'); AFTER_RESULT.splice(Math.max(0,i),0,function foAce(st,job,f,res){ const t=foTrait(); const o=st.last&&st.last.out; if(t&&t.id==='ace'&&o&&typeof o.score==='number'&&!res.crash){ o.score=Math.min(100,o.score+3); o.notes.push('Your first officer called the flare perfectly. Score +3.'); } }); })();

/* =====================================================================
   WHERE IT SHOWS UP
   ===================================================================== */
/* the phone button is part of the top bar (chrome.js); refresh its badge after every render */
AFTER_RENDER.push(function phoneButton(){ phoneBadge(); });

/* the job board: the week's event and a contact tag on their jobs */
AFTER_RENDER.push(function boardWorld(){ if(S.view!=='board' || !S.st) return; const main=document.querySelector('main'); if(!main || main.querySelector('.w-mkt')) return;
  const wk=weekCardHTML(S.st); const list=main.querySelector('.jlist'); if(wk && list){ const d=document.createElement('div'); d.innerHTML=wk; list.parentElement.insertBefore(d.firstElementChild, list.previousElementSibling||list); }
  S.st.jobs && S.st.jobs.forEach(j=>{ if(!j.contact && !j.mkt) return; const r=main.querySelector(`.jrow [data-id="${j.id}"] .jr-t small`); if(r && !r.dataset.w){ r.dataset.w=1; r.textContent += j.contact?` · ${CONTACTS.find(k=>k.id===j.contact).n}`:` · ${j.mkt}`; } }); });

/* Profile: islands and contacts */
function islandsHTML(){ const w=twW(); const L=Object.entries(w.isl).filter(([,v])=>v!==0).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,8).sort((a,b)=>b[1]-a[1]);
  const met=contactsMet();
  return `<section class="panel w-isl"><div class="section-title"><h2>Islands</h2></div>
    ${L.length?`<table class="w-tab"><tbody>${L.map(([k,v])=>`<tr><td>${esc(k)}</td><td><span class="w-bar"><i style="left:50%;width:${Math.abs(v)}%;${v<0?'transform:translateX(-100%);background:var(--bad)':''}"></i></span></td><td class="mono">${v>0?'+':''}${v}</td><td class="muted">${islWord(v)}</td></tr>`).join('')}</tbody></table>`:`<p class="muted">Nobody knows you anywhere yet.</p>`}
    <h3 style="margin-top:18px">Contacts</h3>
    ${met.length?`<ul class="w-contacts">${met.map(k=>`<li><b>${esc(k.n)}</b> <span class="muted">${esc(k.role)}. ${esc(islOf(k.ap))} (${k.ap}).</span> ${contactLevel(k.id)?`<span class="chip">${contactLevel(k.id)} job${contactLevel(k.id)>1?'s':''}</span>`:''}</li>`).join('')}</ul>`:`<p class="muted">Be good to an island and someone there will start sending you work.</p>`}</section>`; }

/* what your money is for: the next aircraft of your own, as a savings bar (a 20% down payment buys it through your airline) */
function ownUpkeep(k){ return Math.max(40, Math.round(AC[k].price*0.0003/10)*10); }
function goalHTML(st){ st.owned=st.owned||{}; const mine=Object.keys(st.owned).filter(k=>AC[k]);
  const L=Object.keys(AC).filter(k=>AC[k].price && canFly(st,k) && !st.owned[k]).sort((a,b)=>AC[a].price-AC[b].price);
  const k=L[0];   // the cheapest plane you're rated for and don't own yet
  const own = mine.length?`<div class="w-own">${mine.map(x=>`<div class="row between"><span><b>${esc(AC[x].n)}</b> <span class="small muted">yours since day ${st.owned[x].since} · ${money(ownUpkeep(x))}/day</span></span><button class="btn ghost sm" data-act="own-sell" data-id="${x}">Sell for ${money(Math.round(AC[x].price*0.8))}</button></div>`).join('')}</div>`:'';
  if(!k) return own?`<section class="panel w-goal"><div class="section-title"><h2>Your aircraft</h2></div>${own}</section>`:'';
  const price=AC[k].price, pct=Math.min(100, Math.round(st.cash/price*100));
  return `<section class="panel w-goal"><div class="section-title"><h2>${mine.length?'Your aircraft':'Saving for your own aircraft'}</h2><span class="small muted">Jobs flown in a plane you own pay 20% more</span></div>${own}
    <div class="row between" style="gap:16px;flex-wrap:wrap;margin-top:${own?'12px':'0'}"><div><b style="font-size:20px">${esc(AC[k].n)}</b><p class="small muted" style="margin:2px 0 0">${money(price)} · upkeep ${money(ownUpkeep(k))} a day</p></div>
    ${st.cash>=price?`<button class="btn primary" data-act="own-buy" data-id="${k}">Buy it</button>`:`<span class="mono">${pct}%</span>`}</div>
    <div class="meter" style="margin-top:12px"><i style="width:${pct}%"></i></div>
    ${pct<100?`<p class="small muted" style="margin:8px 0 0">${money(price-st.cash)} to go.${st.company?' Your airline can also buy it with 20% down.':''}</p>`:''}</section>`; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="own-buy"],[data-act="own-sell"]'); if(!b||!S.st) return; const st=S.st, k=b.dataset.id; if(!AC[k]) return; st.owned=st.owned||{};
  if(b.dataset.act==='own-buy'){ if(st.cash<AC[k].price || st.owned[k]) return; txn(st,-AC[k].price,'Aircraft purchases',`Your own ${AC[k].n}`); st.owned[k]={since:st.day}; toast(`She's yours: ${AC[k].n}. Jobs in her pay 20% more.`); }
  else { if(!st.owned[k]) return; txn(st,Math.round(AC[k].price*0.8),'Aircraft sales',`Sold your ${AC[k].n}`); delete st.owned[k]; toast(`Sold your ${AC[k].n}.`); }
  save(); S.keepScroll=true; render(); });
/* Money: property (home, safehouses, businesses), the loan, bribes */
function moneyWorldHTML(){ const st=S.st, w=twW(), c=crime(st), L=loanNow();
  /* one Property list: where you live (rented), safehouses (bought in order, crime story only), and businesses */
  const F=fin(st), H=HOUSING[F.housing]||HOUSING.bunk, lv=safeLevel(st);
  const safeBuy=(s,i)=> i<=lv ? '<span class="chip good">Yours</span>'
    : i>lv+1 ? `<span class="small muted">Buy the one above first</span>`
    : `<button class="btn sm" data-act="buy-safe" data-v="${s.id}" ${st.cash<s.cost?`disabled title="You need ${money(s.cost-st.cash)} more"`:''}>Buy</button>${st.cash<s.cost?short(s.cost):''}`;
  const short=n=>`<span class="small muted" style="display:block">${money(n-st.cash)} short</span>`;
  const grp=(t,cls)=>`<tr class="w-pgroup${cls?' '+cls:''}"><th colspan="3">${t}</th></tr>`;
  const home=grp('Where you live')+`<tr><td><b>${esc(H.n)}</b><br><span class="small muted">${esc(H.blurb)}</span></td><td class="mono">${money(H.rent)}/day</td><td><select id="fin-house" aria-label="Move house">${Object.entries(HOUSING).map(([k,h])=>`<option value="${k}" ${k===F.housing?'selected':''}>${esc(h.n)} · ${money(h.rent)}/day${h.rep?` · +${h.rep} rep/week`:''}</option>`).join('')}</select></td></tr>`;
  const safe=c.on ? grp('Safehouses')+SAFEHOUSES.map((s,i)=>`<tr><td><b>${esc(s.n)}</b><br><span class="small muted">${esc(s.perk)}</span></td><td class="mono">${money(s.cost)}</td><td>${safeBuy(s,i)}</td></tr>`).join('') : '';
  const biz=grp('Businesses','w-biz')+PROPS.map(p=>`<tr class="w-biz"><td><b>${esc(p.n)}</b><br><span class="small muted">${esc(p.note)}</span></td><td class="mono">${money(p.price)}</td><td>${propOwned(p.id)?`<span class="chip good">Yours</span> <button class="btn sm ghost" data-act="w-sell" data-id="${p.id}" title="Sell for ${money(Math.round(p.price*0.6))}">Sell</button>`:`<button class="btn sm" data-act="w-buy" data-id="${p.id}" ${st.cash<p.price?`disabled title="You need ${money(p.price-st.cash)} more"`:''}>Buy</button>${st.cash<p.price?short(p.price):''}`}</td></tr>`).join('');
  const props=`<section class="panel w-props"><div class="section-title"><h2>Property</h2></div><table class="w-tab"><tbody>${home}${safe}${biz}</tbody></table></section>`;
  const loan = c.on ? `<section class="panel w-loan"><div class="section-title"><h2>Castillo's money</h2></div>${L?`<p>You owe <b class="mono">${money(L.owe)}</b> by day ${L.due} (${Math.max(0,L.due-st.day)} days).</p><button class="btn sm" data-act="w-repay" ${st.cash<L.owe?'disabled':''}>Pay him back</button>`:`<p class="muted">Castillo lends at 20% for two weeks. Late, and he sends someone.</p><div class="row" style="gap:8px;flex-wrap:wrap">${[10000,25000,50000].map(a=>`<button class="btn sm" data-act="w-loan" data-a="${a}">Borrow ${money(a)}</button>`).join('')}</div>`}</section>` : '';
  const here=st.loc; const br = c.on ? `<section class="panel w-bribe"><div class="section-title"><h2>Customs at ${esc(here)}</h2></div>${bribeActive(here)?`<p>Your man at ${esc(here)} is looking the other way until day ${w.bribes[here].until}.</p>`:`<p class="muted">For ${money(bribeCost(here))}, an officer here waves you through for a week, even when you're hot. Every time he does, the chance he gets caught goes up.</p><button class="btn sm" data-act="w-bribe" ${st.cash<bribeCost(here)?'disabled':''}>Pay him · ${money(bribeCost(here))}</button>`}</section>` : '';
  return goalHTML(st)+props+loan+br; }

/* Hangar: aircraft logbooks */
function acHistHTML(){ const w=twW(); const ids=Object.keys(w.ac).filter(k=>AC[k]); if(!ids.length) return '';
  return `<details class="panel w-achist"><summary class="section-title" style="cursor:pointer"><h2>Aircraft logbooks</h2><span class="small muted">${ids.length} aircraft · name them, see their records</span></summary><table class="w-tab"><thead><tr><th>Aircraft</th><th>Name</th><th>Flights</th><th>Hours</th><th>Softest</th><th>Hard landings</th></tr></thead><tbody>${ids.sort((a,b)=>w.ac[b].f-w.ac[a].f).map(k=>{ const h=w.ac[k]; return `<tr><td>${esc(AC[k].n)}</td><td><input class="w-nick" data-id="${k}" value="${esc(h.nick||'')}" maxlength="24" placeholder="Give her a name" aria-label="Name for ${esc(AC[k].n)}"></td><td class="mono" data-l="Flights">${h.f}</td><td class="mono" data-l="Hours">${(h.m/60).toFixed(1)}</td><td class="mono" data-l="Softest">${h.best!=null?Math.round(h.best)+' fpm':'–'}</td><td class="mono" data-l="Hard landings">${h.hard}</td></tr>`; }).join('')}</tbody></table></details>`; }
function foHTML(){ const t=foTrait(); if(!t) return ''; return `<section class="panel"><p class="label">Your first officer</p><h3>${esc(t.n)}</h3><p class="small muted">${esc(t.d)}</p></section>`; }

AFTER_RENDER.push(function worldPanels(){ if(!S.st) return; const main=document.querySelector('main'); if(!main || main.querySelector('.w-added')) return;
  let html=''; if(S.view==='profile') html=islandsHTML()+foHTML(); else if(S.view==='money') html=moneyWorldHTML(); else if(S.view==='hangar') html=acHistHTML();
  if(!html) return; const d=document.createElement('div'); d.className='w-added stack'; d.innerHTML=html;
  // on the Money page the things you act on (property, insurance, the loan, customs) go above the records
  let at=null; if(S.view==='money'){ const h=[...main.querySelectorAll('h2')].find(x=>x.textContent.trim()==='Income statement'); at=h&&h.closest('section'); while(at && at.parentElement && at.parentElement!==main && at.parentElement.children.length===1) at=at.parentElement; if(at && at.parentElement && at.parentElement.classList.contains('grid-2')) at=at.parentElement; }
  if(at && at.parentElement) at.parentElement.insertBefore(d, at); else main.appendChild(d); });

document.addEventListener('click', e=>{ const b=e.target.closest('[data-act]'); if(!b||!S.st) return; const a=b.dataset.act;
  if(a==='w-buy'){ if(propBuy(b.dataset.id)){ const p=PROPS.find(x=>x.id===b.dataset.id); toast(`${p.n} is yours.`); S.keepScroll=true; render(); } }
  else if(a==='w-loan'){ loanTake(+b.dataset.a); toast(`${money(+b.dataset.a)} from Castillo. Two weeks.`); S.keepScroll=true; render(); }
  else if(a==='w-repay'){ if(loanRepay()){ toast('Castillo is paid.'); S.keepScroll=true; render(); } }
  else if(a==='w-bribe'){ const here=S.st.loc, cost=bribeCost(here); if(S.st.cash>=cost){ txn(S.st,-cost,'Payoffs',`Customs officer, ${here}`); twW().bribes[here]={until:S.st.day+BRIBE_DAYS, used:0}; save(); toast(`Paid. ${here} customs won't look too closely for a week.`); S.keepScroll=true; render(); } } });
document.addEventListener('change', e=>{ const i=e.target.closest('.w-nick'); if(!i||!S.st) return; acHist(i.dataset.id).nick=i.value.trim().slice(0,24); save(); toast(i.value.trim()?`She's "${i.value.trim()}" now.`:'Name removed.'); });

(function(){ const s=document.createElement('style'); s.textContent=`
.tw-sheet-bg{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.6);display:flex;justify-content:flex-end}
.tw-sheet{width:min(460px,100%);height:100%;background:var(--surface);border-left:1px solid var(--line-2);display:flex;flex-direction:column;animation:twIn .18s ease-out}
.tw-sheet.wide{width:min(900px,100%)}
@keyframes twIn{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
.tw-sheet header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line)}
.tw-sheet header h2{font-size:20px;margin:0}
.tw-sheet-body{overflow:auto;padding:16px 18px 40px;flex:1}
.ph-list{list-style:none;margin:0;padding:0}
.ph-tabs{display:flex;border-bottom:1px solid var(--line);margin:-4px 0 10px}.ph-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--muted);font:600 14px var(--f-body);padding:8px 14px;cursor:pointer;margin-bottom:-1px}.ph-tabs button.on{color:var(--ink);border-bottom-color:var(--amb)}.ph-tabs i{font-style:normal;font:600 11px var(--f-mono);background:var(--amb);color:var(--amb-ink);padding:1px 5px;margin-left:4px}
.ph-top{padding:4px 0 10px;border-bottom:1px solid var(--line)}
.ph-notifs{list-style:none;padding:0;margin:0}.ph-notifs li{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}.ph-notifs small{color:var(--dim);flex:none;padding-top:2px}
.ph-msg{padding:14px 0;border-bottom:1px solid var(--line)}
.ph-msg.new .ph-h b::after{content:"";display:inline-block;width:7px;height:7px;background:var(--amb);margin-left:8px;vertical-align:middle;border-radius:50%!important}
.ph-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}.ph-h small{color:var(--dim)}
.ph-in,.ph-out{margin:6px 0;padding:9px 12px;max-width:88%;font-size:14.5px;line-height:1.4}
.ph-in{background:var(--surface-3);border:1px solid var(--line)}
.ph-out{background:var(--amb-soft);border:1px solid rgba(240,165,58,.35);margin-left:auto}
.ph-opts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.w-tab{width:100%;border-collapse:collapse;font-size:14px}.w-tab td,.w-tab td span{white-space:normal!important}.w-tab td,.w-tab th{padding:9px 10px 9px 0;border-top:1px solid var(--line);text-align:left;vertical-align:middle}.w-tab th{font-weight:500;color:var(--muted);font-size:12.5px;border-top:0}
.w-bar{position:relative;display:block;width:160px;height:4px;background:var(--line)}.w-bar i{position:absolute;top:0;height:100%;background:var(--good);max-width:50%}
.w-contacts{list-style:none;padding:0;margin:8px 0 0}.w-contacts li{padding:8px 0;border-top:1px solid var(--line)}
.w-nick{height:32px!important;padding:0 8px!important;font-size:13.5px!important;width:170px}
.w-mkt{border-left:2px solid var(--amb)!important}
.cb-phone b{position:absolute;top:10px;right:8px;min-width:15px;height:15px;padding:0 3px;background:var(--amb);color:var(--amb-ink);font:600 9.5px/15px var(--f-mono);text-align:center}
.w-props .w-pgroup th{text-align:left;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:16px 0 6px;border-bottom:1px solid var(--line)}.w-props .w-pgroup:first-child th{padding-top:0}.w-props select{max-width:100%}.w-props .w-pgroup th{width:100%;box-sizing:border-box}
@media (max-width:700px){ .w-bar{width:70px} .w-tab{font-size:13px} .w-props .w-tab,.w-props .w-tab tbody,.w-props .w-tab tr,.w-props .w-tab td,.w-achist .w-tab,.w-achist .w-tab tbody,.w-achist .w-tab tr,.w-achist .w-tab td{display:block;width:auto} .w-achist thead{display:none} .w-props tr,.w-achist tr{border-top:1px solid var(--line);padding:10px 0} .w-props td,.w-achist td{border:0!important;padding:3px 0!important} .w-achist td[data-l]{display:inline-block;margin-right:14px} .w-achist td[data-l]::before{content:attr(data-l) ' ';color:var(--muted);font-family:var(--f-body)} .w-nick{width:100%!important} }
`; document.head.appendChild(s); })();

/* ===================== Heat with teeth: investigations =====================
   At Heat 70+, each morning there's a chance investigators stake out the airport you use most for network runs.
   For five days, network runs there disappear from the board and any run that lands there anyway is searched. */
function invNow(st){ const w=(st||S.st).w||{}; return (w.inv && w.inv.until>=(st||S.st).day) ? w.inv : null; }
function invRoll(st){ const c=crime(st); if(!c.on || invNow(st)) return; if((c.heat||0)<70 || Math.random()>0.3) return;
  const n={}; (st.log||[]).slice(0,40).forEach(l=>{ if(l.net && l.to) n[l.to]=(n[l.to]||0)+1; });
  const ap=Object.keys(n).sort((a,b)=>n[b]-n[a])[0] || st.loc; if(!AP[ap]) return;
  const w=twW(); w.inv={ap, until:st.day+5, from:st.day};
  phonePush({from:'dez', text:`stay away from ${AP[ap].isl||ap} for a few days. feds are sitting on the ramp. i mean it`}); }
DAY_HOOKS.push(invRoll);
GEN_JOB_STEPS.push(function invJobs(st, L){ if(!L) return; const v=invNow(st); if(!v) return L; return L.filter(j=>!(j.network && (j.to===v.ap || j.from===v.ap))); });
  const d=document.createElement('section'); d.className='panel w-inv'; d.style.borderLeft='3px solid var(--bad,#d0643a)';

/* ===================== bush runs =====================
   Short strips (under 3,300 ft) in a STOL or bush plane: Saba, Barbuda, Montserrat, Anegada, Union Island and more.
   A Bush tag on the board, a little more pay, and a short-field bonus for a good landing. */
const BUSH_STRIPS = ['TNCS','TAPH','TRPG','TFFJ','TVSU','TGPZ','TJCP','TUPA','TUPW','TVSM','MWCL','MYES','MZPL','TDCF'];
const BUSH_RUNS = {
  TAPH:{t:`Generator parts for Codrington`, c:`Barbuda Council`, p:`The town's backup generator died in the last storm.`},
  TRPG:{t:`Batteries for the volcano observatory`, c:`Montserrat Volcano Observatory`, p:`The seismographs on the hill run on these. The volcano doesn't wait.`},
  TUPA:{t:`Ice and lobster traps for Anegada`, c:`Setting Point fishermen`, p:`Anegada is flat, low and easy to miss. Look for the reef first.`},
  TNCS:{t:`Mail and medicine for Saba`, c:`Saba Cares`, p:`The ferry is cancelled again. You're the only way in today.`},
  TVSU:{t:`Spare sails for the kite school`, c:`Clifton Kite Club`, p:`The approach is over the hill and the wind is always strong.`},
  TGPZ:{t:`School books for Carriacou`, c:`Hillsborough Secondary`, p:`The strip runs right across the island's main road. Watch for traffic lights.`},
};
function bushJob(st){ const acs=eligibleAircraft(st).filter(k=>['stol','bush'].includes(AC[k].cls)); if(!acs.length) return null; const acId=acs[Math.floor(Math.random()*acs.length)], a=AC[acId];
  const dests=BUSH_STRIPS.filter(k=>k!==st.loc && AP[k] && apOk(st,k,acId) && distNm(AP[st.loc],AP[k])<=Math.min(160,(a.range||300)*0.75)); if(!dests.length) return null;
  const to=dests[Math.floor(Math.random()*dests.length)], len=Math.max(...AP[to].rw.map(r=>r[1])), R=BUSH_RUNS[to]||{t:`Supplies for ${AP[to].isl}`, c:`${AP[to].isl} general store`, p:`Whatever the ferry couldn't take this week.`};
  const dep=Math.round((st.clock+20+Math.floor(Math.random()*180))/5)*5;
  const job={ id:uid(), kind:'gen', arch:'bush', label:'Bush run', cat:'cargo', bush:true, from:st.loc, to, local:false, tourNm:0, ac:acId, pax:0, cargo:200+Math.floor(Math.random()*5)*60, dep:Math.max(dep, isNight(dep)?st.clock+20:dep), wx:genWx(st,to,null,dep), urgent:false, vip:false, airline:false, company:false };
  let p=plan(job); if(p.over>0){ job.cargo=Math.max(60, job.cargo-p.over-20); p=plan(job); } if(p.over>0 || !p.range) return null;
  job.title=R.t; job.client=R.c; job.paras=[R.p, `${AP[to].n} has ${len.toLocaleString()} ft of runway. Touch down in the first third and you'll stop with room to spare.`];
  job.pay=Math.round(payFor(st,job)*1.3/10)*10; job.est=p.est; return job; }
GEN_JOB_STEPS.push(function bushJobs(st, L){ if(!L) return; if(L.some(j=>j.bush)) return L; const out=L.slice(); for(let i=0;i<2;i++){ const j=bushJob(st); if(j && !out.some(x=>x.to===j.to && x.bush)) out.push(j); } return out; });
AFTER_RESULT.push(function bushBonus(st, job, f, res){ if(!job.bush || res.crash) return; const o=st.last&&st.last.out; if(!o) return; const A=f&&f.tda;
  const good = A ? (A.zone==='aim'||A.zone==='zone') : (res.grade==='A'||res.grade==='B');
  if(good){ const b=Math.max(50, Math.round(job.pay*0.2/10)*10); txn(st,b,'Tips & bonuses','Short-field landing'); o.pay+=b; o.notes.push(`Short-field landing at ${job.to}: ${money(b)} bonus.`); } });

/* one "This week" card: the market event, an investigation, and Castillo's deadline, together */
function weekCardHTML(st){ const L=[]; const e=mktNow(); if(e) L.push(`<li><b>Market</b><span>${esc(e.text)} Until day ${e.until}.</span></li>`);
  const v=typeof invNow==='function'?invNow(st):null; if(v) L.push(`<li class="bad"><b>Investigation</b><span>Federal agents are watching ${esc(AP[v.ap].n)} (${v.ap}) until day ${v.until}. No network runs there, and any run that lands there is searched.</span></li>`);
  const next=mainChapters().find(m=>!st.story.done[m.id]); const due=next&&typeof chDue==='function'?chDue(st,next):null; if(due!=null){ const left=due-st.day; L.push(`<li class="${left<=0?'bad':''}"><b>Castillo</b><span>${esc(next.title)}: ${left<0?`late, he wanted it by day ${due}`:left===0?'due today':`due by day ${due} (${left} day${left>1?'s':''})`}.</span></li>`); }
  return L.length?`<section class="panel w-mkt w-week"><p class="label">This week</p><ul class="ls-list">${L.join('')}</ul></section>`:''; }

/* ===================== the regulars have stories =====================
   Each contact tells you a little more after your 1st, 3rd and 5th job for them. The fifth comes with a thank-you. */
const CONTACT_STORY = {
  lou:    [`lou here. my daughter wants to fly. i told her to ask you, not me`, `lou again. took my girl up to the fence to watch you land. she counted your bounces. zero. she was very serious about it`, `Lou: my daughter starts flight school in Antigua in September. you did that. fuel's on me this month`],
  abigail:[`Sister Abigail: The clinic's freezer runs on hope and a generator. Your flights keep the insulin cold. Thank you.`, `Sister Abigail: A boy you flew medicine for came by to say thank you. He is nine and wants to be you. I told him to aim higher.`, `Sister Abigail: The church took up a collection for you. Please don't refuse it. We'd only spend it on candles.`],
  kiko:   [`kiko: paid you same day. you'll find i'm the only broker in san juan who does that`, `kiko: the other pilots on my list are slow, drunk or both. you're neither. keep it that way`, `kiko: put you on my A list. better loads, better pay, and a bonus for putting up with me`],
  oona:   [`Oona: A client asked who flew her. I said a professional. She said "that's rare". It is.`, `Oona: Don't repeat this, but the man you flew Tuesday owns half a football club. He liked your landing more than the villa.`, `Oona: The villa owners pooled a tip for "the pilot who never talks". Here it is. Keep not talking.`],
  pere:   [`Père Léon: Every family on Marie-Galante now knows your name. Be careful with that.`, `Père Léon: The wedding you flew the cake for? The bride's grandmother wants to meet you. I said you were busy. She said, so is God.`, `Père Léon: The parish wanted to thank you. It isn't much, and it comes with prayers you didn't ask for.`],
  vic:    [`vic at juliana dispatch. i hear everything on this ramp. you're starting to come up in conversations. good ones, mostly`, `vic: a guy in a linen suit asked who flies for Coral Wing. i said nobody special. you owe me`, `vic: dispatch put money together for the pilot who never misses a slot. that's you. don't tell the other guys`],
};
AFTER_RESULT.push(function contactStory(st, job){ if(!job.contact) return; const lv=(twW().contacts[job.contact]||0), lines=CONTACT_STORY[job.contact]; if(!lines) return;
  const idx = lv===1?0 : lv===3?1 : lv===5?2 : -1; if(idx<0) return; const k=CONTACTS.find(x=>x.id===job.contact);
  setTimeout(()=>{ phonePush({from:'contact', fromName:k.n, text:lines[idx]}); if(idx===2){ const gift=1500; txn(st,gift,'Gifts & windfalls',`A thank-you from ${k.n}`); save(); } }, 2500); });

/* ===================== the cast notices how you fly =====================
   After some flights (at most one a day), Mari or Dez texts about that landing, that airport, that weather. */
AFTER_RESULT.push(function reactText(st, job, f, res){ if(!res || job.kind==='check') return; const w=twW(); if(w._rtDay===st.day || Math.random()>0.45) return;
  const fpm=f&&f.simFpm, ap=AP[(f&&f.landedAt)||job.to]||{}, isl=ap.isl||job.to, first=!st.visited||st.visited[job.to]===1, crime_=crime(st).on, story=job.kind==='story';
  let m=null;
  if(res.crash) m={from:'dez', text:`heard about ${isl}. you ok? the plane isn't. call me when you can`};
  else if(fpm!=null && fpm<90) m={from:'mari', text:`Tower at ${job.to} says you put it on at ${fpm} fpm. Don't let it go to your head. (Nice.)`};
  else if(fpm!=null && fpm>450) m={from:'dez', text:`${fpm} fpm into ${isl}?? i'm going to be checking that gear all night`};
  else if(res.grade==='A' && story && crime_) m={from:'castillo', text:`Clean work at ${isl}. I notice clean work.`};
  else if(first && ap.n) m={from:'mari', text:`First time into ${ap.n}? Tell me how it was. Some of those approaches look easier on the chart.`};
  else if(job.wx && /storm|rain|squall/i.test(JSON.stringify(job.wx))) m={from:'dez', text:`flying in that weather to ${isl}. you're braver than me. or dumber. can't decide`};
  else if(res.grade==='D'||res.grade==='F') m={from:'mari', text:`That one to ${isl} wasn't your best. Happens to everyone. Once.`};
  if(!m) return; w._rtDay=st.day; setTimeout(()=>phonePush(m), 4000); });

/* ===================== FOCUS (0.75) =====================
   The game introduces one system at a time instead of showing everything on day one.
   Each system appears when it starts to matter, usually with a text from someone explaining it in a sentence.
     phone ............ after the first text arrives
     home strip ....... after 3 flights
     market events .... after 5 flights
     insurance ........ after 5 flights, or once you own an aircraft
     islands panel .... after 3 flights
     properties ....... once you have $15,000 (or own one)
     Castillo's loan .. after chapter 4 (The Offer)
     bribes ........... once Heat reaches 40
     case board ....... after chapter 4 */

function unlocked(k){ const st=S.st; if(!st) return false; const c=crime(st), w=st.w||{}, d=st.story.done||{}, n=st.flights||0;
  switch(k){
    case 'phone': return !!(w.phone && w.phone.msgs.length);
    case 'home': return n>=3;
    case 'market': return n>=5;
    case 'insurance': return n>=5 || Object.keys(st.hangar||{}).length>0 || !!w.ins;
    case 'islands': return n>=3;
    case 'props': return st.cash>=15000 || Object.keys(w.props||{}).length>0 || !!(w.seenUnlock&&w.seenUnlock.props);
    case 'loan': return c.on && !!d.CR4;
    case 'bribe': return c.on && ((c.heat||0)>=40 || Object.keys(w.bribes||{}).length>0 || !!(w.seenUnlock&&w.seenUnlock.bribe));
    case 'caseboard': return c.on && !!d.CR4;
  } return true; }

/* the text that introduces each system, once */
const UNLOCK_TEXT = {
  props: st=> crime(st).on ? {from:'dez', text:`dive shop on saba is for sale. nice little earner. good for washing money too, if u know what i mean. money page`} : {from:'mari', text:`The office next to ours is for rent. You've got the money now. Have a look on the Money page.`},
  insurance: ()=>({from:'mari', text:`Please tell me you've got hull insurance. Money page. I'm not asking twice.`}),
  bribe: ()=>({from:'dez', text:`heat's getting up there rookie. i know a customs guy at most of these airports. money page. careful tho`}),
  loan: ()=>({from:'castillo', text:`If you ever need money quickly, ask me. I'm a reasonable lender. Mostly.`}),
  market: ()=>({from:'mari', text:`Keep an eye on the board. Every week something happens somewhere, and somebody pays extra for it.`}),
};
function unlockCheck(){ const st=S.st; if(!st) return; const w=twW(); w.seenUnlock=w.seenUnlock||{};
  for(const k in UNLOCK_TEXT){ if(!w.seenUnlock[k] && unlocked(k)){ w.seenUnlock[k]=st.day; const m=UNLOCK_TEXT[k](st); if(m) phonePush(m); } } }
DAY_HOOKS.push(unlockCheck);
AFTER_RESULT.push(function unlockAfterFlight(){ setTimeout(unlockCheck, 500); });

/* market events wait until you've flown a bit */
(function(){ const i=DAY_HOOKS.indexOf(mktRoll); if(i>=0) DAY_HOOKS[i]=function(st){ if(unlocked('market')) mktRoll(st); }; })();

/* take away what isn't unlocked yet */
AFTER_RENDER.push(function focusGate(){ if(!S.st) return; const hide=(sel)=>document.querySelectorAll(sel).forEach(e=>e.remove());
  if(!unlocked('phone')) hide('.cb-phone');
  if(!unlocked('home')) hide('.home-strip');
  if(!unlocked('caseboard')) hide('.case-board');
  if(!unlocked('islands')) hide('.w-isl');
  if(!unlocked('props')) hide('.w-props');
  if(!unlocked('loan')) hide('.w-loan');
  if(!unlocked('bribe')) hide('.w-bribe');
  if(!unlocked('insurance')) hide('.w-ins'); });

/* the story timeline shows the last three chapters (and their act heading) until you ask for all of them */
AFTER_RENDER.push(function clipTimeline(){ const ol=document.querySelector('.sh-time.clip'); if(!ol) return; const items=[...ol.children]; const ch=items.filter(e=>!e.classList.contains('sh-act-h')); const keep=new Set(ch.slice(-3));
  let headKeep=null; items.forEach(e=>{ if(e.classList.contains('sh-act-h')){ headKeep=e; e.classList.add('cl-h'); } else if(keep.has(e)){ e.classList.remove('cl-h'); if(headKeep) headKeep.classList.remove('cl-h'); } else e.classList.add('cl-h'); }); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="sh-more"]'); if(!b) return; const ol=b.previousElementSibling; if(ol){ ol.classList.toggle('clip'); b.textContent = ol.classList.contains('clip') ? b.textContent.replace('Show fewer','Show all') : 'Show fewer'; if(ol.classList.contains('clip')) b.textContent=`Show all ${ol.querySelectorAll('li').length} chapters`; } });

(function(){ const s=document.createElement('style'); s.textContent=`
.sh-time.clip>li.cl-h{display:none}
.sh-more{margin-top:6px}
.sh-acts-d>summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:12px}.sh-acts-d>summary::-webkit-details-marker{display:none}
.sh-acts-d>summary h3{margin:0}.sh-acts-d>summary::after{content:"Show";margin-left:auto;font-size:13px;color:var(--muted);border:1px solid var(--line-2);padding:3px 10px}
.sh-acts-d[open]>summary::after{content:"Hide"}.sh-acts-d[open] .sh-acts{margin-top:14px}
`; document.head.appendChild(s); })();

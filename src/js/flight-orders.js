/* ===================== FLIGHT ORDERS =====================
   Some mid-flight story choices are things you actually have to fly: climb away from a shadowing jet, stay under
   radar, slow down, hold, a steep turn for Castillo, a low pass for the Medinas. Picking one starts an order;
   the live MSFS data decides whether you did it, and the story reacts either way.

   An order on a beat option:  order:{k, label, …limits, ok:{text, power, heat, cash, flag}, fail:{…}}
     k:'climb'      gain `by` feet within `sec` seconds
     k:'lowlevel'   stay below `agl` ft above ground for `sec` seconds (you get `within` seconds to get down there)
     k:'slow'       fly below `pct` of your speed when you chose, for `sec` seconds (start within `within`)
     k:'steepturn'  bank at least `bank` degrees and turn through `deg` degrees within `within` seconds
     k:'lowpass'    pass within `nm` of the destination below `agl` ft, still airborne, before you land
     k:'airborne'   stay airborne at least `min` more minutes before touchdown
   Without MSFS live, orders can't be checked, so they're skipped quietly (no reward, no penalty). */

const ORDER_LIMIT_SEC = 600;   // an order that's neither done nor failed after this long counts as failed

function orderSim(){ const s=S.sim; if(S.simState!=='live' || !s || !s.motion || !s.position) return null; return s; }

function startOrder(a, ord){ const s=orderSim(); if(!s){ return; }
  a.order = Object.assign({}, ord, { t0:Date.now(), alt0:s.position.altFt||0, gs0:s.motion.ias||s.motion.gs||0, hdgLast:s.position.hdg, turned:0, okSince:null, state:'active' });
  save(); renderOrderChip(); }

/* evaluate the order against the latest sim data: 'ok', 'fail' or null (still going) */
function judgeOrder(a){ const o=a.order, s=orderSim(); if(!o || o.state!=='active' || !s) return null;
  const now=Date.now(), el=(now-o.t0)/1000, rec=simRecFor(a), landed=!!(rec && rec.touchdown && rec.touchdown.t>o.t0) || s.motion.onGround;
  const agl=s.position.aglFt||0, alt=s.position.altFt||0, spd=s.motion.ias||s.motion.gs||0;
  const hold=(cond, need)=>{ if(cond){ o.okSince=o.okSince||now; if((now-o.okSince)/1000>=need) return 'ok'; } else o.okSince=null; return null; };
  switch(o.k){
    case 'climb': if(alt-o.alt0>=o.by) return 'ok'; return el>o.sec||landed ? 'fail' : null;
    case 'lowlevel': { if(landed) return 'fail'; const r=hold(agl<o.agl && !s.motion.onGround, o.sec); if(r) return r; return (!o.okSince && el>(o.within||120)) ? 'fail' : null; }
    case 'slow': { if(landed) return 'fail'; const r=hold(spd<o.gs0*(o.pct||0.8), o.sec); if(r) return r; return (!o.okSince && el>(o.within||120)) ? 'fail' : null; }
    case 'steepturn': { const bank=Math.abs((s.ext&&s.ext.attitude&&s.ext.attitude.bank)||0); const h=s.position.hdg;
      if(h!=null && o.hdgLast!=null){ let d=((h-o.hdgLast+540)%360)-180; if(bank>=o.bank) o.turned+=Math.abs(d); } o.hdgLast=h;
      if(o.turned>=(o.deg||330)) return 'ok'; return el>(o.within||180)||landed ? 'fail' : null; }
    case 'lowpass': { const to=AP[a.job.local?a.job.from:a.job.to]; const d=to?distNm({lat:s.position.lat,lon:s.position.lon},to):99;
      if(!s.motion.onGround && d<=o.nm && agl<o.agl) return 'ok'; return landed ? 'fail' : null; }
    case 'airborne': if(landed) return el/60>=o.min ? 'ok' : 'fail'; return null;
  }
  return el>ORDER_LIMIT_SEC ? 'fail' : null; }

function finishOrder(a, result){ const o=a.order; o.state=result; const out=o[result]||{}; const c=crime();
  if(out.flag) c.flags[out.flag]=1; if(out.heat) crBump(c,'heat',out.heat); if(out.power) crBump(c,'power',out.power); if(out.cash) txn(S.st,out.cash,'Story',a.job.title);
  a.orders=(a.orders||[]).concat([{label:o.label, result}]); save();
  if(out.text){ try{ showBeatBase(a, {who:o.who||'self', text:out.text}, 'order'); }catch(_){ toast(out.text); } }
  toast(`${result==='ok'?'Done':'Missed'}: ${o.label}${out.power?` · Power ${out.power>0?'+':''}${out.power}`:''}${out.heat?` · Heat ${out.heat>0?'+':''}${out.heat}`:''}`);
  renderOrderChip(); }

/* runs on every MSFS update (see SIM_TICK in sim-live.js) */
function orderTick(){ const a=S.st&&S.st.active; if(!a || !a.order || a.order.state!=='active') return; const r=judgeOrder(a); if(r) finishOrder(a, r); else renderOrderChip(); }

/* the order on the flight display: what to do and how it's going */
function orderChipHTML(a){ const o=a&&a.order; if(!o) return ''; const el=Math.round((Date.now()-o.t0)/1000);
  const left = o.k==='climb'?o.sec-el : o.k==='steepturn'?(o.within||180)-el : (o.k==='lowlevel'||o.k==='slow') ? (o.okSince ? o.sec-Math.round((Date.now()-o.okSince)/1000) : (o.within||120)-el) : null;
  const prog = o.k==='steepturn' ? ` · ${Math.min(o.deg||330,Math.round(o.turned))}°/${o.deg||330}°` : o.k==='climb' ? ` · +${Math.max(0,Math.round(((S.sim&&S.sim.position&&S.sim.position.altFt)||o.alt0)-o.alt0)).toLocaleString()} ft` : o.k==='airborne' ? ` · ${Math.floor(el/60)} of ${o.min} min` : '';
  const st = o.state==='ok'?'done':o.state==='fail'?'missed':'';
  return `<div class="fo-chip ${st}" role="status"><b>${o.state==='active'?'Order':o.state==='ok'?'Done':'Missed'}</b><span>${esc(o.label)}${o.state==='active'?prog:''}</span>${o.state==='active'&&left!=null?`<i class="mono">${Math.max(0,left)}s</i>`:''}</div>`; }
function renderOrderChip(){ document.querySelectorAll('.fo-host').forEach(el=>{ el.innerHTML=orderChipHTML(S.st&&S.st.active); }); }

(function(){ const s=document.createElement('style'); s.textContent=`
.fo-host:empty{display:none}.fo-host{margin:8px 0}
.fo-chip{display:flex;align-items:center;gap:10px;border:1px solid #6b4e1a;background:rgba(224,178,74,.1);border-radius:12px;padding:10px 14px;font-size:14px}
.fo-chip b{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#e0b24a}.fo-chip span{flex:1}.fo-chip i{font-style:normal;color:#e0b24a}
.fo-chip.done{border-color:#2f5a2a;background:rgba(124,191,111,.1)}.fo-chip.done b{color:#7cbf6f}.fo-chip.missed{border-color:#6b2a20;background:rgba(229,83,61,.1)}.fo-chip.missed b{color:#e5533d}`; document.head.appendChild(s); })();

/* ---- the orders in the story ---- */
(function(){
  const opt=(id,i)=>{ const b=(BEATS[id]||[]).find(x=>x && x.opts); return b && b.opts[i]; };
  const set=(id,i,o)=>{ const x=opt(id,i); if(!x) return; delete x.power; delete x.heat; delete x.cash; Object.assign(x,o); };
  set('CRM',0,{reply:`Power up. Climb, now.`, order:{k:'climb', by:3000, sec:150, label:'Climb 3,000 ft before they close in', ok:{text:`The dark jet can't keep up. It peels off toward the coast.`, power:3}, fail:{text:`They sit on your wing all the way down. Somebody was taking photos.`, heat:4}}});
  set('CR8',1,{reply:`You tell Castillo you're holding. He says nothing, which is worse.`, order:{k:'airborne', min:15, label:'Hold at least 15 minutes before you land', ok:{text:`The cell drifts off. Late, but every bag is dry.`, power:-1}, fail:{text:`You landed in the tail of the storm. Two bags are soaked through.`, cash:-1500}}});
  set('CRT',0,{reply:`"Show them," Medina says.`, order:{k:'lowpass', agl:300, nm:3, label:'Low pass under 300 ft within 3 nm of the field', ok:{text:`Four engines at two hundred feet. Every phone at the table is pointed at you.`, power:6, heat:4}, fail:{text:`You never got low enough. Medina's men are laughing at the table.`, power:-2}}});
  set('CR16',1,{reply:`You switch the radio off and push the nose down.`, order:{k:'lowlevel', agl:1000, sec:180, within:240, label:'Go dark: under 1,000 ft for 3 minutes', ok:{text:`Down in the radar clutter. The Coast Guard loses you over the water.`, heat:3, power:4}, fail:{text:`They tracked you all the way in.`, heat:10}}});
  // beats play in list order, so a new one goes before the first beat of a later phase
  const PH={climb:0,cruise:1,descent:2,final:3};
  const add=(id,b)=>{ const L=(BEATS[id]=BEATS[id]||[]); const i=L.findIndex(x=>{ const at=Array.isArray(x)?x[0]:(x&&typeof x==='object')?x.at:null; return at && PH[at]>PH[b.at]; }); if(i<0) L.push(b); else L.splice(i,0,b); };
  add('CR2',{at:'cruise',who:'radio',text:`Coast Guard Dash 8, low level, crossing west of Saba.|It's heading straight across your track.`,opts:[
    {t:'Drop low and stay quiet',reply:`You ease the nose down toward the water.`, order:{k:'lowlevel', agl:1000, sec:120, within:240, label:'Stay under 1,000 ft for 2 minutes', ok:{text:`The Dash 8 passes high and never looks your way.`, heat:-2}, fail:{text:`You hesitated. The Dash 8 banks toward you for a closer look, then carries on.`, heat:3}}},
    {t:'Hold altitude and wave',reply:`Just another island hopper. The Dash 8 rocks its wings and carries on.`, heat:2}]});
  add('CR3',{at:'cruise',who:'dez',text:`Slow down, rookie. Customs changes shift at four. Land after that and the new guy waves us through.`,opts:[
    {t:'Pull the power back',reply:`You bring the power back and watch the clock.`, order:{k:'slow', pct:0.8, sec:180, within:120, label:'Fly 20% slower for 3 minutes', ok:{text:`You land at five past four. The new officer barely looks up.`, heat:-3}, fail:{text:`You land at ten to four. The old officer is still on, and he remembers your face.`, heat:2}}},
    {t:'Land on time',reply:`"Your call," Dez says. He doesn't sound happy.`, heat:2}]});
  add('CR4',{at:'cruise',who:'castillo',text:`Show me what my money buys. A steep turn. Forty-five degrees of bank, all the way around.`,opts:[
    {t:'Roll into a steep turn',reply:`You roll in and pull.`, order:{k:'steepturn', bank:40, deg:330, within:180, label:'Steep turn: 40° of bank, all the way around', ok:{text:`You roll out on your heading. Castillo nods once. "Good."`, power:4}, fail:{text:`Castillo watches you wobble through it and says nothing.`, power:-1}}},
    {t:'"Not with passengers, sir."',reply:`Castillo smiles. "Careful. I like that."`, power:1}]});
})();

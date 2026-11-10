/* ===================== SEALED ORDERS OPEN THEMSELVES + SMARTER DIVERSIONS + COLORS + SIM RATE ===================== */
/* ---- colors: Starling is orange, main story is green ---- */
const COL_MAIN = '#1f9d55', COL_STARLING = '#e8782a';
Object.keys(ARC_META).forEach(k=>{ if(ARC_META[k].main) ARC_META[k].col = COL_MAIN; });
if(ARC_META.Starling) ARC_META.Starling.col = COL_STARLING;
function jobKind(job){
  const arc = job.kind==='story' ? (STORY.find(m=>m.id===job.story)||{}).arc : null;
  if(job.kind==='story') return {k:'story', t:job.label, c: arc==='Starling' ? COL_STARLING : (ARC_META[arc]&&ARC_META[arc].main) ? COL_MAIN : (ARC_META[arc]&&ARC_META[arc].col) || COL_MAIN};
  if(job.kind==='check') return {k:'check', t:job.label||'Checkride', c:'var(--violet)'};
  if(job.lend) return {k:'lend', t:job.label, c:COL_STARLING};
  if(job.company) return {k:'company', t:job.label, c:'var(--sky)'};
  if(job.urgent) return {k:'urgent', t:job.label, c:'var(--bad)'};
  if(job.vip) return {k:'vip', t:job.label, c:'#c0507a'};
  if(job.cat==='cargo') return {k:'cargo', t:job.label, c:'var(--sky)'};
  return {k:'pax', t:job.label, c:'#c98a1a'};
}

/* ---- when each kind of sealed order opens ---- */
const SCEN_TRIGGER = { rough_engine:'mid', pax_medical:'mid', electrical:'mid', vip_change:'mid', calloway_mayday:'mid', runway_closed:'arrive', runway_short:'arrive', squall:'insight', bird_strike:'to1000', door_pop:'to500', engine_fail_twin:'to500', pressurization:'cruise' };
const TRIG_LABEL = { mid:'about halfway', arrive:'about 15 minutes before arrival', insight:'when the destination is in sight', to1000:'passing 1,000 ft after takeoff', to500:'passing 500 ft after takeoff', cruise:'once you level off in cruise' };
function trigReached(a){
  const job=a.job, kind=SCEN_TRIGGER[job.scen]||'mid'; const s=S.sim, live=S.simState==='live'&&s&&s.motion&&s.position; const rec=simRecFor(a);
  if(live && rec && rec.takeoff){
    const pos={lat:s.position.lat,lon:s.position.lon}; const dest=job.local?AP[job.from]:AP[job.to]; const total=job.local?(job.tourNm||40):distNm(AP[job.from],dest); const togo=job.local?null:distNm(pos,dest); const air=!s.motion.onGround;
    if(!air) return false;
    if(kind==='to1000') return s.position.aglFt>1000; if(kind==='to500') return s.position.aglFt>500;
    if(kind==='cruise') return s.position.aglFt>3000 && Math.abs(s.motion.vsFpm)<300 && (Date.now()-rec.takeoff.t)>120000;
    if(kind==='insight') return togo!=null ? togo<10 : (Date.now()-rec.takeoff.t)/60000 > plan(job).est*0.7;
    if(kind==='arrive') return togo!=null ? (togo/Math.max(s.motion.gs,60)*60 <= 15 || togo<25) && togo < total*0.75 : (Date.now()-rec.takeoff.t)/60000 > plan(job).est*0.6;
    return togo!=null ? togo <= total*0.5 : (Date.now()-rec.takeoff.t)/60000 > plan(job).est*0.45;
  }
  if(!live && a.started){ const m=(Date.now()-a.started)/60000, est=plan(job).est; const at={to1000:0.12, to500:0.1, cruise:0.3, mid:0.5, arrive:Math.max(0.55, 1-15/Math.max(est,20)), insight:0.8}[kind]; return m >= est*at; }
  return false;
}
/* ---- a diversion that actually makes sense from where you are ---- */
function divertOptions(job, pos, maxNm){ const dest=AP[job.to];
  return Object.keys(AP).filter(k=>{ const ap=AP[k]; if(ap.water || k===job.to) return false; if(!apOk(S.st,k,job.ac)) return false; const d=distNm(pos,ap); return d<=maxNm && distNm(dest,ap) >= 15; }).map(k=>({k, d:distNm(pos,AP[k]), rw:longestRwy(AP[k])})).sort((a,b)=>a.d-b.d); }
const VIP_REASONS = [`Their yacht has just moved to {isl}, and they'd like to meet it there.`,`The meeting has been moved to {isl}. "Can we just go there instead?"`,`A friend's party on {isl} turns out to be tonight, not next week.`,`Their hotel overbooked. The only room left is on {isl}.`];
function scenarioPlan(a){
  const job=a.job, sc=SCEN[job.scen], s=S.sim; const pos = s&&s.position ? {lat:s.position.lat,lon:s.position.lon} : AP[job.from]; const dest=AP[job.to];
  const toDest = job.local ? distNm(pos,AP[job.from]) : distNm(pos,dest); const base={title:sc.n, text:sc.text, sim:sc.sim, target:job.local?job.from:job.to, divert:false};
  if(job.scen==='vip_change' && !job.local){ const o=divertOptions(job,pos,90).filter(x=>x.k!==job.from && x.d>=12); if(!o.length) return Object.assign(base,{text:`Your passenger asks about changing destination, then changes their mind. "No, keep going. Sorry."`, sim:`Continue to ${job.to} as planned.`});
    const t=o[Math.min(o.length-1, Math.floor(Math.random()*Math.min(3,o.length)))]; const isl=AP[t.k].isl.replace(/\s*\(.*\)/,'');
    return Object.assign(base,{text:pick(VIP_REASONS).replace('{isl}',isl), sim:`Divert to ${AP[t.k].n} (${t.k}), ${Math.round(t.d)} nm from here. Replan: heading, fuel, runway ${rwyAnalysis(t.k,job.wx,job.ac).rw}, and customs if it's another country.`, target:t.k, divert:true}); }
  if(job.scen==='pax_medical' || job.scen==='electrical' || job.scen==='rough_engine'){
    const o=divertOptions(job,pos,job.scen==='pax_medical'?70:40).filter(x=> job.scen!=='pax_medical' || x.rw>=5000);
    const best=o[0]; const goDest = !best || toDest <= best.d + 5;
    if(goDest) return Object.assign(base,{sim: job.scen==='pax_medical' ? `${job.local?job.from:job.to} is still your closest hospital. Continue there: declare PAN-PAN, ask for priority and an ambulance to meet you.` : job.scen==='electrical' ? `Your destination is the nearest suitable airport. Shed electrical load and continue to ${job.local?job.from:job.to}.` : `Reduce power to about 65% and continue to ${job.local?job.from:job.to}, the nearest suitable airport. Declare PAN-PAN.`});
    return Object.assign(base,{sim: job.scen==='pax_medical' ? `Divert to ${AP[best.k].n} (${best.k}) on ${AP[best.k].isl}, ${Math.round(best.d)} nm away: it has the nearest hospital. Declare PAN-PAN and ask for an ambulance.` : `Divert to ${AP[best.k].n} (${best.k}), ${Math.round(best.d)} nm away. ${job.scen==='electrical'?'Shed electrical load first.':'Reduce power to about 65% and declare PAN-PAN.'}`, target:best.k, divert:true}); }
  if(job.scen==='runway_closed'){ const o=divertOptions(job,pos,60); return Object.assign(base,{sim:`Hold near ${job.to} for about 20 minutes if fuel allows.${o[0]?` If not, your alternate is ${AP[o[0].k].n} (${o[0].k}), ${Math.round(o[0].d)} nm away.`:''}`, alt:o[0]?o[0].k:null}); }
  return base;
}
function openOrders(a, how){
  if(a.opened) return; a.opened=true; a.scenAt=Date.now(); a.scenPlan=scenarioPlan(a); save();
  S.ordersPop=true; toast(`Sealed orders: ${a.scenPlan.title}`);
  try{ if(typeof crackle==='function') crackle(0.25,0.3); if(window.speechSynthesis && voiceOn()){ const u=new SpeechSynthesisUtterance(`Sealed orders. ${a.scenPlan.text} ${a.scenPlan.sim}`); u.volume=voiceVol(); const v=pickVoice(false,1); if(v) u.voice=v; speechSynthesis.cancel(); speechSynthesis.speak(u); } }catch(_){}
  try{ if('Notification' in window && Notification.permission==='granted') new Notification('Trade Winds: sealed orders', {body:a.scenPlan.text}); }catch(_){}
  S.keepScroll=true; render();
}
function ordersHTML(a, pop){ const P=a.scenPlan; if(!P) return '';
  return `<section class="orders ${pop?'pop':''}"><p class="label">Sealed orders · opened ${TRIG_LABEL[SCEN_TRIGGER[a.job.scen]||'mid']}</p><h3>${esc(P.title)}</h3><p>${esc(P.text)}</p><p class="small"><b>What to do:</b> ${esc(P.sim)}</p>${P.divert?`<p class="small"><b>New destination:</b> <span class="mono">${esc(P.target)}</span> · ${esc(AP[P.target].n)}</p>`:''}${pop?`<button class="btn sm" data-act="orders-ok">Got it</button>`:''}</section>`; }
/* live check */
const _orRender = renderSimBits;
renderSimBits = function(){ _orRender(); const a=S.st&&S.st.active; if(a && a.job.scen && !a.opened && a.started && trigReached(a)) openOrders(a,'live'); };
setInterval(()=>{ const a=S.st&&S.st.active; if(a && a.job.scen && !a.opened && a.started && S.simState!=='live' && trigReached(a)) openOrders(a,'timer'); }, 20000);
/* no more "open" button: show when they'll open, and the orders once they do */
const _orFlight = flightView;
flightView = function(){ let h=_orFlight(); const a=S.st&&S.st.active; if(!a || !a.job.scen) return h;
  h = h.replace(/<section class="sealed">[\s\S]*?<\/section>/, `<section class="sealed"><p class="label">Sealed orders</p><h3 style="margin:4px 0 6px">They'll open on their own</h3><p class="small">Something will happen on this flight ${TRIG_LABEL[SCEN_TRIGGER[a.job.scen]||'mid']}. The orders pop up automatically, and you'll be graded on how you handle it.</p></section>`);
  if(a.scenPlan) h = h.replace(/<section class="opened">[\s\S]*?<\/section>/, ordersHTML(a,false));
  return h; };
const _orInflight = inflightView;
inflightView = function(){ const a=S.st.active; let h=_orInflight(); if(a.job.scen && a.opened && a.scenPlan) h=h.replace('<section class="panel stack if-live"', ordersHTML(a,!!S.ordersPop)+'<section class="panel stack if-live"');
  else if(a.job.scen) h=h.replace('<section class="panel stack if-live"', `<div class="notice small">📩 Sealed orders aboard. They open automatically ${TRIG_LABEL[SCEN_TRIGGER[a.job.scen]||'mid']}.</div><section class="panel stack if-live"`); return h; };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="orders-ok"]')){ S.ordersPop=false; S.keepScroll=true; render(); } });
/* flights with sealed orders log themselves too, graded on what you actually did */
var autoReady; /* defined in full below (060-core.js) */
/* applyResult's own divert check should accept the planned diversion */

/* ---- sim rate ---- */
function simRateNow(){ const x=S.sim&&S.sim.ext; return x && x.simRate ? x.simRate : 1; }
const _orLive = ifLiveHTML;
ifLiveHTML = function(){ const h=_orLive(); const r=simRateNow(); return r!==1 ? h.replace('<div class="if-phase">', `<div class="notice small">⏩ Sim rate ${r}×. That's fine: flight time, fuel and pay are all counted in simulated time.</div><div class="if-phase">`) : h; };
/* block timer follows simulated time when MSFS is connected */
setInterval(()=>{ const t=document.getElementById('if-timer'); const a=S.st&&S.st.active; if(!t||!a) return; const rec=simRecFor(a); if(rec && rec.blockMinutes!=null) t.textContent=durTxt(rec.blockMinutes); }, 3000);

/* ===================== URGENT DISPATCH: real-time 2× jobs ===================== */
const URG_ACCEPT_MIN = 5;   // minutes to say yes
const URG_TAKEOFF_MIN = 15; // minutes from yes to wheels up
const URG_REASONS = [
  {arch:'medical', t:`Medical: blood units needed at {to}`, d:`The hospital at {to} is down to its last units. Wheels up in 15 minutes and Coral Wing pays double.`},
  {arch:'aog', t:`AOG: airliner stuck at {to}`, d:`An airliner with 180 passengers is stuck at {to} waiting for a part. The airline pays double if you're airborne in 15 minutes.`},
  {arch:'missed_ship', t:`Cruise passengers stranded`, d:`Two passengers missed their ship. It sails from {to} soon. Double pay if you're off the ground in 15 minutes.`},
  {arch:'vip_ceo', t:`Executive needs {to} now`, d:`A CEO's meeting moved up. They'll pay double for a pilot who's rolling in 15 minutes.`},
  {arch:'catch', t:`Fresh catch, short shelf life`, d:`A restaurant at {to} needs the morning catch before lunch service. Double pay for a fast departure.`}
];
var urgentOn; /* defined in full below (055-core.js) */
function notifyUrgent(job){
  const body = `${job.from} → ${job.to} · ${money(job.pay)} (2× pay) · accept in ${URG_ACCEPT_MIN} min, wheels up within ${URG_TAKEOFF_MIN}`;
  toast(`URGENT: ${job.title}`);
  try{ if('Notification' in window){ const go2=()=>{ try{ const n=new Notification('Trade Winds: urgent flight', {body, silent:false}); n.onclick=()=>{ try{ window.focus(); }catch(_){} }; }catch(_){} };
    if(Notification.permission==='granted') go2(); else if(Notification.permission!=='denied') Notification.requestPermission().then(p=>{ if(p==='granted') go2(); }); } }catch(_){}
  try{ if(window.speechSynthesis && typeof voiceOn==='function' && voiceOn()){ const u=new SpeechSynthesisUtterance(`Urgent flight. ${job.title}. Double pay.`); u.volume=voiceVol(); speechSynthesis.speak(u); } }catch(_){}
}
function mmss(ms){ ms=Math.max(0,ms); const m=Math.floor(ms/60000), s=Math.floor(ms%60000/1000); return `${m}:${String(s).padStart(2,'0')}`; }
function urgentBanner(){
  const st=S.st; if(!st) return '';
  if(st.urgent && !st.active){ const u=st.urgent; const left=u.expires-Date.now(); if(left<=0){ st.urgent=null; save(); return ''; } const j=u.job;
    return `<div class="urgent"><span class="urg-pulse"></span><div style="min-width:0"><b>URGENT · 2× PAY</b><span>${esc(j.title)} · ${esc(j.from)} → ${esc(j.to)} · ${esc(AC[j.ac].n)} · <b>${money(j.pay)}</b></span><span class="tiny">Wheels up within ${URG_TAKEOFF_MIN} min of accepting. Offer expires in <b class="urg-count" data-until="${u.expires}">${mmss(left)}</b></span></div><div class="row"><button class="btn action sm" data-act="urg-yes">Take it</button><button class="btn sm ghost" data-act="urg-no">Pass</button></div></div>`; }
  const a=st.active; if(a && a.job.realtime && a.job.wheelsUpBy && !a.job._toAt){ const left=a.job.wheelsUpBy-Date.now();
    return `<div class="urgent ${left<0?'late':''}"><span class="urg-pulse"></span><div><b>${left<0?'LATE: standard pay only':'WHEELS UP IN'}</b><span class="mono big-count urg-count" data-until="${a.job.wheelsUpBy}">${mmss(left)}</span></div><button class="btn sm" data-act="nav" data-v="flight">Open flight</button></div>`; }
  return '';
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="urg-yes"],[data-act="urg-no"],[data-act="urg-toggle"]'); if(!b || !S.st) return; const st=S.st;
  if(b.dataset.act==='urg-toggle'){ const on=!urgentOn(); try{ localStorage.setItem('tw.urgent', on?'on':'off'); }catch(_){} toast(on?'Urgent dispatch calls on.':'Urgent dispatch calls off.'); render(); return; }
  if(b.dataset.act==='urg-no'){ st.urgent=null; save(); render(); return; }
  if(!st.urgent || st.active) return; const j=st.urgent.job; j.wheelsUpBy=Date.now()+URG_TAKEOFF_MIN*60000; j.dep=st.clock+5;
  st.active={job:j, accepted:Date.now()}; st.urgent=null; save(); S.debrief=false; S.showResult=false; go('flight');
});
/* record when the wheels actually left the ground */
/* live countdowns + random dispatch calls while you're idle */
setInterval(()=>{
  document.querySelectorAll('.urg-count').forEach(el=>{ el.textContent = mmss(Number(el.dataset.until)-Date.now()); });
  const st=S.st; if(!st) return;
  if(st.urgent && st.urgent.expires < Date.now()){ st.urgent=null; save(); render(); }
}, 1000);
setInterval(()=>{ const st=S.st; if(!st || st.active || st.urgent || document.hidden && !window.TW_STANDALONE) return; if(Math.random() < 1/18) spawnUrgent(false); }, 60000); // about one every 18 idle minutes
const _urHangar = hangarView;
hangarView = function(){ return _urHangar().replace('<main class="wrap stack fade">', `<main class="wrap stack fade"><section class="panel row between"><div><h3>Urgent dispatch calls</h3><p class="small muted">Real-time 2× pay jobs pop up while the game is open. You get ${URG_ACCEPT_MIN} minutes to accept and ${URG_TAKEOFF_MIN} to get wheels up.</p></div><div class="row"><button class="btn sm" data-act="urg-toggle">${urgentOn()?'Turn off':'Turn on'}</button><button class="btn sm ghost" data-act="urg-test">Send one now</button></div></section>`); };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="urg-test"]')){ if(S.st && S.st.active){ toast('Finish your current flight first.'); return; } if(!spawnUrgent(true)) toast('No urgent work available from here right now.'); } });

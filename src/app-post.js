/* Standalone tweaks applied after the game script loads */
(function(){
  if(!window.TW_STANDALONE) return;
  simHangarHTML = function(){ const live = S.simState==='live';
    return `<div class="stack"><div class="row between"><h3>MSFS connection</h3><span class="chip ${live?'sea':''}">${live?'● Connected':'Waiting for MSFS'}</span></div><p class="small muted">Built in. Start Microsoft Flight Simulator 2024 and load into a flight; Trade Winds connects automatically. Nothing to install or configure.</p></div>`; };
  try{ render(); }catch(e){}
})();
(function(){ if(!window.TW_STANDALONE) return;
  const _ci = cabinInner; cabinInner = function(){ return (_ci()||'').replace('Connect the MSFS Bridge and the cabin comes alive','Start MSFS and the cabin comes alive'); };
  const _sp = simPanelHTML; simPanelHTML = function(){ return (_sp()||'').replace(/Connect the MSFS Bridge[^<]*/,'Start MSFS 2024 and load into a flight. Trade Winds connects automatically and records your takeoff, touchdown rate, fuel and block time.'); };
  try{ render(); }catch(e){}
})();
/* Career file in Documents\Trade Winds\career.json: survives app updates, reinstalls and new folders */
(function(){ if(!window.TW_STANDALONE || !window.twNative || !twNative.writeSave) return;
  let t=null; const _save = save;
  save = function(){ const r=_save.apply(this, arguments); clearTimeout(t); t=setTimeout(()=>{ try{ if(S.st) twNative.writeSave(JSON.stringify(S.st)); }catch(e){} }, 800); return r; };
  twNative.readSave().then(txt=>{ if(!txt) { if(S.st) save(); return; } let o=null; try{ o=JSON.parse(txt); }catch(e){ return; }
    if(o && o.pilot && (!S.st || (o.savedAt||0) > (S.st.savedAt||0))){ S.st = migrate(o); try{ localStorage.setItem(KEY, JSON.stringify(S.st)); }catch(e){} render(); }
    else if(S.st) save(); }).catch(()=>{});
})();
/* phone companion: push cockpit state, accept checklist ticks, show the QR code on the Cockpit tab */
(function(){ if(!window.TW_STANDALONE || !twNative.pushState) return;
  function snap(){ const st=S.st; const a=st&&st.active; if(!a){ const sa=st&&typeof storyAvailable==='function'?storyAvailable(st):[]; return st?{next: sa[0]?sa[0].title:null}:{}; }
    const ph=cockpitPhases(st,a.job); a.ck=a.ck||{p:0,done:{}}; const s=S.sim; const live = S.simState==='live' && s && s.motion ? s : null;
    const dest = a.job.local?AP[a.job.from]:AP[a.job.to];
    return { job:{title:a.job.title, from:a.job.from, to:a.job.local?a.job.from:a.job.to, ac:AC[a.job.ac].n}, cur:a.ck.p||0,
      phases: ph.map((p,i)=>({n:p.n, items:p.items, done:p.items.map((_,j)=>!!a.ck.done[i+'-'+j]), all:p.items.every((_,j)=>a.ck.done[i+'-'+j])})),
      live: live ? {ias:live.motion.ias, alt:live.position.altFt, vs:live.motion.vsFpm, togo:Math.round(distNm({lat:live.position.lat,lon:live.position.lon},dest))} : null,
      comfort: a.job.pax && a.cab ? Math.round(a.cab.comfort) : null, feed: a.cab ? a.cab.log.slice(0,6).map(m=>({who:m.who,text:m.text})) : [],
      callout: (S.copilotLast && Date.now()-S.copilotLast.t<8000) ? {who:'Copilot', text:S.copilotLast.text} : (a.cab && a.cab.callout && Date.now()-a.cab.callout.t<20000 ? a.cab.callout : null),
      phase: (()=>{ try{ return a.started ? flightPhase(a).n : 'Before departure'; }catch(e){ return null; } })(),
      orders: a.opened && a.scenPlan ? {title:a.scenPlan.title, text:a.scenPlan.text, sim:a.scenPlan.sim} : null }; }
  setInterval(()=>{ try{ twNative.pushState(JSON.stringify(snap())); }catch(e){} }, 1500);
  twNative.onCompanionCk(k=>{ const a=S.st&&S.st.active; if(!a) return; a.ck=a.ck||{p:0,done:{}}; a.ck.done[k]=!a.ck.done[k]; if(k.startsWith('4-') && !a.started){ a.started=Date.now(); simArm(); } save(); S.keepScroll=true; render(); });
  let info=null; twNative.companionInfo().then(i=>{ info=i; });
  const _ck = cockpitView; cockpitView = function(){ const h=_ck(); if(!info) return h; return h.replace(/<\/main>\s*$/, `<section class="panel row companion"><img src="${info.qr||''}" alt="QR code for the phone cockpit" width="120" height="120"><div><h3>Cockpit on your phone</h3><p class="small muted">Scan with your phone on the same Wi-Fi, or open <b class="mono">${esc(info.url)}</b>. Checklist, live instruments and the cabin feed, beside your sim. If Windows asks about network access, allow it on private networks.</p><details class="tiny"><summary>Phone can't connect?</summary><ol class="tight"><li>Phone and PC must be on the same Wi-Fi (not guest Wi-Fi, not mobile data).</li><li>Windows Settings → Network &amp; internet → your Wi-Fi → set the network profile to <b>Private</b>.</li><li>Windows Security → Firewall &amp; network protection → Allow an app through firewall → tick <b>Trade Winds</b> for Private.</li><li>Some routers block devices from talking to each other (AP or client isolation). Turn that off, or use your phone's hotspot for the PC.</li></ol></details></div></section></main>`); };
})();

/* game update downloaded in the background: offer a quick reload */
(function(){ if(!window.twNative || !twNative.onGameUpdated) return; twNative.onGameUpdated(v=>{ try{ save(); }catch(_){} const d=document.createElement('div'); d.className='upd-bar'; d.innerHTML=`<b>Trade Winds ${v} is ready.</b> <span>Your career is saved.</span><button class="btn sm primary">Reload now</button>`; d.querySelector('button').onclick=()=>{ try{ save(); }catch(_){} twNative.restartGame(); }; document.body.appendChild(d); }); })();

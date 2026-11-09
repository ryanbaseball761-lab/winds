/* ===================== BIG DISPLAY (second screen / across the room) ===================== */
function bigInner(){
  const a=S.st&&S.st.active; if(!a) return `<p class="big-empty">No flight in progress.</p>`;
  const s=S.sim, live=S.simState==='live'&&s&&s.motion; const ph=flightPhase(a); const pr=ifProgress(a);
  const c=a.cab&&a.cab.callout&&Date.now()-a.cab.callout.t<20000?a.cab.callout:null;
  const T=(l,v,u,cls='')=>`<div class="bt ${cls}"><span>${l}</span><b>${v}</b><small>${u}</small></div>`;
  const eta = live && !s.motion.onGround && pr.togo!=null ? Math.round(pr.togo/Math.max(s.motion.gs,1)*60) : null;
  return `<div class="big-top"><span>${esc(a.job.from)} → ${esc(a.job.local?a.job.from:a.job.to)} · ${esc(AC[a.job.ac].n)}</span><span class="big-ph">${esc(ph.n)}</span></div>
    ${c?`<div class="big-call">${esc(c.who)}: ${esc(c.text)}</div>`:''}
    <div class="big-grid">${live? T('IAS',s.motion.ias,'kt')+T('ALT',(s.position.altFt||0).toLocaleString(),'ft')+T('V/S',(s.motion.vsFpm>0?'+':'')+s.motion.vsFpm,'fpm',s.motion.vsFpm<-1000?'warn':'')+T('HDG',String(s.position.hdg||0).padStart(3,'0')+'°','')+T('TO GO',pr.togo!=null?Math.round(pr.togo):'—','nm')+T('ETA',eta!=null?eta:'—','min')
      : `<p class="big-empty">Waiting for MSFS…</p>`}</div>
    <div class="big-bar"><i style="width:${pr.pct==null?0:pr.pct.toFixed(1)}%"></i></div>
    <p class="big-hint">Press Esc or tap anywhere to close</p>`;
}
function openBig(){ let el=document.getElementById('bigmode'); if(!el){ el=document.createElement('div'); el.id='bigmode'; el.className='bigmode'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Big instrument display'); document.body.appendChild(el); el.addEventListener('click',closeBig); }
  el.innerHTML=bigInner(); try{ if(el.requestFullscreen) el.requestFullscreen().catch(()=>{}); }catch(_){} S.big=true; }
function closeBig(){ const el=document.getElementById('bigmode'); if(el) el.remove(); S.big=false; try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(_){} }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && S.big) closeBig(); });
document.addEventListener('fullscreenchange', ()=>{ if(!document.fullscreenElement && S.big){ /* stay open as an overlay */ } });
const _bgRender = renderSimBits;
renderSimBits = function(){ _bgRender(); if(S.big){ const el=document.getElementById('bigmode'); if(el) el.innerHTML=bigInner(); } };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="big-open"]')){ e.stopPropagation(); openBig(); } });
const _bgInflight = inflightView;
inflightView = function(){ return _bgInflight().replace('<button class="btn sm ghost" data-act="if-brief">Briefing</button>', '<button class="btn sm ghost" data-act="big-open">⛶ Big display</button><button class="btn sm ghost" data-act="if-brief">Briefing</button>'); };

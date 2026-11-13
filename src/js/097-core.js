/* ===================== 20 SMALL FIXES AND UPGRADES ===================== */

/* 1. the ticket names the right operator as the story moves on */
function carrierFor(st, job){ const c=crime(st); if(job.network) return 'Unlisted charter'; if(job.kind==='story' && CRIME_IDS.has(job.story)){ if(st.story.done.CR15 || job.story==='CR15') return 'Caribe Cargo'; if(c.on || ['CR5','CR6','CR7','CR8','CR9','CR10'].includes(job.story)) return 'Castillo Logistics'; } if(job.kind==='check') return 'Flight examination'; return null; }


/* 3. "Previously on" only when you've been away for a while (3+ hours) */
(function(){ const _p=playRecapNow; playRecapNow=function(){ let last=0; try{ last=Number(localStorage.getItem('tw.lastSeen')||0); }catch(_){} if(Date.now()-last < 3*3600000) return; return _p(); }; setInterval(()=>{ try{ localStorage.setItem('tw.lastSeen', String(Date.now())); }catch(_){} }, 60000); window.addEventListener('beforeunload', ()=>{ try{ localStorage.setItem('tw.lastSeen', String(Date.now())); }catch(_){} }); })();


/* 5 + 6. keys: number shortcuts don't fire behind the title screen or a popup; Esc closes popups and the open job */
window.addEventListener('keydown', e=>{ if(document.querySelector('.title-screen,.cmd') && /^[1-5f/]$/i.test(e.key) && !/INPUT/.test(e.target.tagName)){ e.stopImmediatePropagation(); }
  if(e.key==='Escape'){ const np=document.querySelector('.notif-pane'); if(np){ np.remove(); return; } if(S.openJob && !document.querySelector('.cut,.cmd')){ S.openJob=null; S.keepScroll=true; render(); } } }, true);










/* 17. laundering: the cheapest option is highlighted */
function launderHTML(st){ const h=launderHTMLBase(st); if(!h) return h; const L=launderOpts(st); const best=L.slice().sort((a,b)=>a.fee-b.fee)[0]; return best ? h.replace(`<button class="btn sm" data-act="launder" data-v="${best.id}">`, `<button class="btn sm primary" data-act="launder" data-v="${best.id}">`) : h; }


/* 19. a backup every 30 minutes of play, too */
setInterval(()=>{ try{ if(S.st && !(S.st.active&&S.st.active.started)) backupLabeled(S.st, `Autosave · ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`); }catch(_){} }, 30*60000);


(function(){ const s=document.createElement('style'); s.textContent=`
.jr-p small.dirty{display:block;font-size:10px;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:#e5533d}
.cut-prog{position:absolute;left:8vw;bottom:calc(11vh + 22px);z-index:4;display:flex;gap:4px}.cut-prog i{width:14px;height:3px;border-radius:2px;background:rgba(255,255,255,.18)}.cut-prog i.on{background:var(--arc)}
.heat-warn{padding:12px 16px;border:1px solid #6b2a20;border-left:4px solid #e5533d;border-radius:12px;background:rgba(194,58,43,.08);font-size:14px}
.dirty-chip{display:inline-grid;line-height:1.1;text-align:left;border:1px solid #6b2a20;background:rgba(194,58,43,.08);color:var(--ink);border-radius:10px;padding:4px 10px;cursor:pointer}.dirty-chip span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#e5533d}.dirty-chip b{font-family:var(--f-mono);font-size:13px}
.fc-ac small.mono{color:#e0b24a}`; document.head.appendChild(s); })();

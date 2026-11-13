/* ===================== 20 MORE FIXES ===================== */


/* 2. Pilot tabs include Profile and Logbook, so they're easy to find */

document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="open-settings"]')) return; S.hangarTab='settings'; go('hangar'); });






/* 9. Skip on a decision explains why it doesn't skip */
document.addEventListener('click', e=>{ const s=e.target.closest('.cut-skip'); if(!s) return; const c=s.closest('.cut'); if(c && c.classList.contains('choosing')){ s.textContent="Decisions can't be skipped"; setTimeout(()=>{ s.textContent='Skip'; }, 1800); } }, true);



/* 12. the sidebar says where your career is really saved */
function syncText(){ if(window.twNative) return 'Saved to Documents\\Trade Winds'; return syncTextBase(); }




/* 17. M shows or hides the menu in flight mode */
document.addEventListener('keydown', e=>{ if(e.key.toLowerCase()!=='m' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.ctrlKey||e.metaKey||e.altKey) return; if(document.body.classList.contains('flying') || S.fmMenu){ S.fmMenu=!S.fmMenu; S.keepScroll=true; render(); } });




(function(){ const s=document.createElement('style'); s.textContent=`.launder-mini{gap:12px}.launder-mini .btn{margin-left:auto}`; document.head.appendChild(s); })();


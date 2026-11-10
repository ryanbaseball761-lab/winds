/* ===================== STABILITY: crash screen, automatic backups ===================== */
let _stFails = 0;
document.addEventListener('click', e=>{
  if(e.target.closest('[data-act="st-home"]')){ _stFails=0; S.view='board'; S.debrief=false; S.showResult=false; render(); }
  if(e.target.closest('[data-act="st-restore"]')){ const b=latestBackup(); if(b){ S.st=migrate(b); save(); _stFails=0; S.view='board'; render(); toast('Restored your last backup.'); } else toast('No backup yet.'); }
});
/* a rolling backup each in-game day (3 kept) */
function latestBackup(){ try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); return a.length?a[a.length-1].st:null; }catch(e){ return null; } }
function backupNow(st){ try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); a.push({at:Date.now(), day:st.day, st:JSON.parse(JSON.stringify(st))}); while(a.length>7) a.shift(); localStorage.setItem('tw.backups', JSON.stringify(a)); }catch(e){ /* storage full: skip */ } }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="st-restore-i"]'); if(!b) return; try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); const x=a[Number(b.dataset.i)]; if(x){ backupNow(S.st); S.st=migrate(x.st); save(); render(); toast(`Restored day ${x.day}. Your previous state was backed up too.`); } }catch(_){} });

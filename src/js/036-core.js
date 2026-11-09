/* ===================== STABILITY: crash screen, automatic backups ===================== */
let _stFails = 0;
document.addEventListener('click', e=>{
  if(e.target.closest('[data-act="st-home"]')){ _stFails=0; S.view='board'; S.debrief=false; S.showResult=false; render(); }
  if(e.target.closest('[data-act="st-restore"]')){ const b=latestBackup(); if(b){ S.st=migrate(b); save(); _stFails=0; S.view='board'; render(); toast('Restored your last backup.'); } else toast('No backup yet.'); }
});
/* a rolling backup each in-game day (3 kept) */
function latestBackup(){ try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); return a.length?a[a.length-1].st:null; }catch(e){ return null; } }
function backupNow(st){ try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); a.push({at:Date.now(), day:st.day, st:JSON.parse(JSON.stringify(st))}); while(a.length>7) a.shift(); localStorage.setItem('tw.backups', JSON.stringify(a)); }catch(e){ /* storage full: skip */ } }
const _stRest = rest;
rest = function(st){ backupNow(st); return _stRest(st); };
const _stHangar = hangarView;
hangarView = function(){ let backs=[]; try{ backs=JSON.parse(localStorage.getItem('tw.backups')||'[]'); }catch(_){}
  return _stHangar().replace(/<\/main>\s*$/, `<section class="panel stack" style="max-width:760px"><h3>Backups</h3><p class="small muted">Trade Winds keeps your last ${backs.length||3} days automatically${window.TW_STANDALONE?', plus a career file in Documents\\Trade Winds':''}.</p>${backs.length?`<div class="row">${backs.map((b,i)=>`<button class="btn sm" data-act="st-restore-i" data-i="${i}">Day ${b.day} · ${new Date(b.at).toLocaleString()}</button>`).join('')}</div>`:'<p class="small">The first backup is made when you rest.</p>'}</section></main>`); };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="st-restore-i"]'); if(!b) return; try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); const x=a[Number(b.dataset.i)]; if(x){ backupNow(S.st); S.st=migrate(x.st); save(); render(); toast(`Restored day ${x.day}. Your previous state was backed up too.`); } }catch(_){} });

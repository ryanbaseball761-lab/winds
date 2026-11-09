/* ===================== STABILITY: crash screen, automatic backups ===================== */
const _stRender = render;
let _stFails = 0;
render = function(){
  try{ _stRender(); _stFails=0; }
  catch(e){ _stFails++; try{ logErr(`render(${S.view}): ${e && e.message}`); }catch(_){}
    const app=document.getElementById('app'); if(!app) return;
    if(_stFails<2 && S.view!=='board'){ S.view='board'; S.debrief=false; S.showResult=false; S.confirm=null; try{ _stRender(); toast('Something went wrong on that screen, so you\'re back on the job board. A report was saved.'); return; }catch(_){ } }
    app.innerHTML = `<main class="wrap"><div class="panel stack" style="max-width:640px;margin:60px auto;text-align:center"><h2>Turbulence in the code</h2><p>Trade Winds hit an error drawing this screen. Your career is saved.</p><p class="tiny muted mono">${esc(String(e&&e.message||e).slice(0,200))}</p><div class="row" style="justify-content:center"><button class="btn primary" data-act="st-home">Back to the job board</button><button class="btn" data-act="st-restore">Restore last backup</button></div></div></main>`;
  }
};
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

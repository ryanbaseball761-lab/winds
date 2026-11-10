/* ===================== A. STABILITY: labelled backups before every chapter, error reports, safe recovery ===================== */
function backupLabeled(st, label){ try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); a.push({at:Date.now(), day:st.day, label, st:JSON.parse(JSON.stringify(st))}); while(a.length>12) a.shift(); localStorage.setItem('tw.backups', JSON.stringify(a)); }catch(_){
  try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); while(a.length>4) a.shift(); localStorage.setItem('tw.backups', JSON.stringify(a)); }catch(__){} } }
/* before starting any story chapter or checkride, and before New Game+ */
window.addEventListener('click', e=>{ const b=e.target.closest('[data-act="accept-story"],[data-act="story-go"],[data-act="book-check"]'); if(!b||!S.st||S._proPass) return; let label='';
  if(b.dataset.id){ const m=STORY.find(x=>x.id===b.dataset.id); const MC=mainChapters(); label = m ? (MC.includes(m)?`Before chapter ${MC.indexOf(m)+1}: ${m.title}`:`Before ${m.title}`) : 'Before a chapter'; } else if(b.dataset.r) label=`Before the ${RATINGS[b.dataset.r].n} checkride`;
  const last=S._bkT||0; if(Date.now()-last>20000){ S._bkT=Date.now(); backupLabeled(S.st, label); } }, true);
/* a better backup list in Settings */
function backupsHTML(){ let a=[]; try{ a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); }catch(_){}
  return `<section class="panel bk-list"><p class="label">Backups</p><h3>Go back to an earlier point</h3><p class="small muted">Made automatically before every chapter, every checkride and every new day. The last 12 are kept.</p>
    ${a.length?`<ul>${a.map((b,i)=>({b,i})).reverse().map(({b,i})=>`<li><div><b>${esc(b.label||`Day ${b.day}`)}</b><span>${new Date(b.at).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} · ${money(b.st&&b.st.cash||0)} · ${b.st&&b.st.story?Object.keys(b.st.story.done||{}).filter(k=>CRIME_IDS.has(k)).length:0} chapters</span></div><button class="btn sm" data-act="bk-restore" data-i="${i}">Restore</button></li>`).join('')}</ul>`:'<p class="small">No backups yet.</p>'}</section>`; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="bk-restore"]'); if(!b) return; if(!b.dataset.ok){ b.dataset.ok=1; b.textContent='Click again to restore'; b.classList.add('action'); return; }
  try{ const a=JSON.parse(localStorage.getItem('tw.backups')||'[]'); const x=a[Number(b.dataset.i)]; if(!x) return; backupLabeled(S.st,'Before restoring a backup'); S.st=migrate(x.st); S.st.savedAt=Date.now(); save(); S.view='story'; S.showResult=false; render(); toast(`Restored: ${x.label||'backup'}.`); }catch(_){ toast('That backup could not be restored.'); } });
/* errors also go into a report file you can send me */
(function(){ const _le=logErr; logErr=function(msg){ _le(msg); try{ if(window.twNative&&twNative.flightLog){ const now=Date.now(); if(now-(S._errT||0)>60000){ S._errT=now; twNative.flightLog(`error-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`, buildReport(String(msg))); } } }catch(_){} }; })();


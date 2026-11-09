/* ===================== THEME SWITCH & CAREER FILES ===================== */
function themePref(){ try{ return localStorage.getItem('tw.theme') || (window.TW_STANDALONE ? 'dark' : 'auto'); }catch(e){ return window.TW_STANDALONE ? 'dark' : 'auto'; } }
function applyTheme(){ const p=themePref(); const r=document.documentElement; if(p==='auto') delete r.dataset.theme; else r.dataset.theme=p; }
applyTheme();
const THEME_LBL = {auto:'Theme: auto', dark:'Theme: dark', light:'Theme: light'};
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="theme"],[data-act="export-file"],[data-act="import-file"]'); if(!b) return;
  if(b.dataset.act==='theme'){ const order=['dark','light','auto']; const n=order[(order.indexOf(themePref())+1)%3]; try{ localStorage.setItem('tw.theme', n); }catch(_){} applyTheme(); if(S.st) render(); return; }
  if(b.dataset.act==='export-file'){ exportCareer(); return; }
  if(b.dataset.act==='import-file'){ importCareer(); return; }
});
async function exportCareer(){
  if(!S.st) return; const text = JSON.stringify(S.st);
  try{ const dl = window.claude && await claude.use('downloads'); if(dl){ await dl.save({filename:'TradeWinds-save.json', data:text}); toast('Career file saved. Open it in the Trade Winds app to continue there.'); return; } }catch(err){ if(err && err.code==='declined') return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download='TradeWinds-save.json'; document.body.appendChild(a); a.click(); a.remove(); }catch(_){ toast('Saving isn\'t available here. Use Copy instead.'); }
}
function loadCareerText(text, how){
  try{ const obj=JSON.parse(text); if(!obj || !obj.pilot || !obj.ratings) throw 0; S.st=migrate(obj); S.st.tourDone=true; save(); toast(`Career restored${how?' '+how:''}: ${S.st.pilot.name}, ${fmtH(S.st.minutes)} logged.`); go('board'); return true; }
  catch(_){ toast('That file isn\'t a Trade Winds career.'); return false; }
}
async function importCareer(){
  if(window.twNative && twNative.openSave){ const t = await twNative.openSave(); if(t) loadCareerText(t); return; }
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return; f.text().then(t=>loadCareerText(t)); }; inp.click();
}
const _thHangar = hangarView;
hangarView = function(){ return _thHangar().replace('<button class="btn sm" data-act="copy-save">Copy</button>', '<button class="btn sm primary" data-act="export-file">Export career file</button><button class="btn sm" data-act="import-file">Import career file</button><button class="btn sm" data-act="copy-save">Copy</button>'); };
const _thSetup = setupView;
setupView = function(){ return _thSetup().replace('</form>', '</form><div class="import-row"><span class="small muted">Already flying Trade Winds somewhere else?</span><button class="btn sm" type="button" data-act="import-file">Import career file</button></div>'); };
/* the desktop app picks up TradeWinds-save.json from Downloads automatically on first launch */
(async function(){ if(!window.twNative || !twNative.autoSave) return; try{ if(S.st && S.st.flights>0) return; const t = await twNative.autoSave(); if(!t) return; let o=null; try{ o=JSON.parse(t); }catch(_){ return; } if(!S.st || (S.st.flights===0 && o.flights>0)) loadCareerText(t, 'from your Downloads folder'); }catch(_){} })();

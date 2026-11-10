/* ===================== B3. NEW GAME+ ===================== */
function ngHTML(st){ const c=crime(st); if(!c.ending) return ''; const seen=Object.keys(c.endingsSeen||{}).concat([c.ending]); const left=['kingpin','witness','ghost'].filter(x=>!seen.includes(x));
  return `<section class="panel ngp"><p class="label">New Game+</p><h3>Play the story again${c.ng?` (round ${c.ng+2})`:''}</h3><p class="small">Keep your licences, hours, achievements and aircraft. The story starts over with <b>bigger network pay (+50%)</b> and <b>Heat that builds 50% faster</b>.${left.length?` Endings you haven't seen: ${left.map(x=>({kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'})[x]).join(', ')}.`:' You\'ve seen every ending.'}</p><button class="btn action" data-act="ng-start">Start New Game+</button></section>`; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="ng-start"]'); if(!b||!S.st) return; if(!b.dataset.ok){ b.dataset.ok=1; b.textContent='Click again to start over'; return; }
  const st=S.st; backupLabeled(st,'Before New Game+'); const c=crime(st); const seen=Object.assign({}, c.endingsSeen||{}); if(c.ending) seen[c.ending]=1; const ng=(c.ng||0)+1;
  CRIME.forEach(m=>{ delete st.story.done[m.id]; }); st.crime={power:0,heat:0,con:0,on:false,flags:{},choice:{},ng,endingsSeen:seen}; st.cash=Math.round(st.cash*0.25); st.active=null; st.loc='TNCM'; save();
  cutscene({col:'#c8962a', art:SCENES.hangar(), shots:[{card:true,kicker:`New Game+ · round ${ng+1}`,title:'Back to the Cessna',sub:'<p>Same islands. Same people. Different choices.</p>'}], onEnd:()=>{ S.view='story'; render(); }}); });
(function(){ const _sv=storyView; storyView=function(){ const h=_sv(); const n=ngHTML(S.st); return n ? h.replace(/(<main[^>]*>(?:<div class="subtabs">[\s\S]*?<\/div>)?)/, '$1'+n) : h; }; })();
(function(){ const _g=genJobs; genJobs=function(st){ const L=_g(st); try{ if(crime(st).ng) L.forEach(j=>{ if(j.network) j.pay=Math.round(j.pay*1.5/10)*10; }); }catch(_){} return L; }; })();

(function(){ const s=document.createElement('style'); s.textContent=`
.bk-list ul{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:2px}.bk-list li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}.bk-list li span{display:block;font-size:12px;color:var(--muted)}
.op-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:24px;margin-top:6px}.op-grid h3 .mono{color:#e5533d;margin-left:8px}@media (max-width:900px){.op-grid{grid-template-columns:1fr}}
.feds{border-left:4px solid #e5533d;background:linear-gradient(90deg,rgba(194,58,43,.12),transparent)}.feds .label{color:#e5533d}
.ngp{border-left:4px solid #c8962a}`; document.head.appendChild(s); })();

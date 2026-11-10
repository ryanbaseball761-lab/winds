/* ===================== 20 MORE FIXES ===================== */

/* 1. BUG: Butter Cup, Academy and Profile were showing the job board (they route through boardView) */
(function(){ const _b=boardView; boardView=function(){ if(S.view==='cup') return cupView(); if(S.view==='academy') return academyView(); if(S.view==='profile') return profileView(); return _b(); }; })();

/* 2. Pilot tabs include Profile and Logbook, so they're easy to find */
try{ const g=NAV5.find(x=>x.v==='pilot'); g.tabs=[['pilot','Licences'],['profile','Profile'],['log','Logbook'],['money','Money'],['cup','Butter Cup'],['academy','Academy']]; }catch(_){}

document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="open-settings"]')) return; S.hangarTab='settings'; go('hangar'); });

/* 4. command bar: search story chapters and achievements too */
(function(){ const _ci=cmdItems; cmdItems=function(){ const L=_ci(); try{ const st=S.st; const MC=mainChapters(); MC.forEach((m,i)=>{ if(st.story.done[m.id]) L.push({n:`Chapter ${i+1}: ${m.title}`, k:'Story · replay the opening', run:()=>{ go('story'); setTimeout(()=>playPrologue(m,()=>{}),200); }}); }); ACH.forEach(a=>L.push({n:`${a.n}`, k:st.ach&&st.ach[a.id]?'Achievement · unlocked':'Achievement · '+a.d, run:()=>go('profile')})); }catch(_){} return L; }; })();

/* 5. laundering through Dez stops if Dez is in prison; a money changer takes his place */
(function(){ const _lo=launderOpts; launderOpts=function(st){ let L=_lo(st); const f=crime(st).flags; if(f.dezJail) L=L.map(o=>o.id==='dez'?{id:'changer',n:'A money changer in Philipsburg',fee:0.3,heat:4}:o); return L; }; })();




/* 9. Skip on a decision explains why it doesn't skip */
document.addEventListener('click', e=>{ const s=e.target.closest('.cut-skip'); if(!s) return; const c=s.closest('.cut'); if(c && c.classList.contains('choosing')){ s.textContent="Decisions can't be skipped"; setTimeout(()=>{ s.textContent='Skip'; }, 1800); } }, true);

/* 10. safehouses you can't buy yet say what's needed */
(function(){ const _o=operationHTML; operationHTML=function(st){ return _o(st).replace(/<span class="small muted">(\$[\d,]+)<\/span><\/div>/g, '<span class="small muted">$1 · buy the one above first</span></div>'); }; })();

/* 11. network runs read like it */
(function(){ const _jr=jobRow; jobRow=function(st,j){ const h=_jr(st,j); return j.network ? h.replace(/(<button[^>]*data-act="accept"[^>]*>)\s*Accept/, '$1Take the run') : h; }; })();

/* 12. the sidebar says where your career is really saved */
(function(){ const _st=syncText; syncText=function(){ if(window.twNative) return 'Saved to Documents\\Trade Winds'; return _st(); }; })();

/* 13. the map opens on the airport you searched for, highlighted */
(function(){ const _mv=mapView; mapView=function(){ const h=_mv(); if(!S.mapSel||!AP[S.mapSel]) return h; try{ const v=MAPV[S.mapZoom||'east']; const a=AP[S.mapSel]; if(a.lon<v.lon[0]||a.lon>v.lon[1]||a.lat<v.lat[0]||a.lat>v.lat[1]){ const k=Object.keys(MAPV).find(z=>a.lon>=MAPV[z].lon[0]&&a.lon<=MAPV[z].lon[1]&&a.lat>=MAPV[z].lat[0]&&a.lat<=MAPV[z].lat[1]); if(k && k!==S.mapZoom){ S.mapZoom=k; return _mv(); } } }catch(_){} return h; }; })();

/* 14. Jobs page: dirty cash is one compact line (the full panel lives on Money) */
(function(){ const _b=boardView; boardView=function(){ const h=_b(); if(S.view!=='board') return h; return h.replace(/<section class="panel launder">[\s\S]*?<\/section>/, ()=>{ const c=crime(); return `<div class="b2-note launder-mini"><b>Dirty cash ${money(c.dirty||0)}</b><span class="small muted">Launder it before you can spend it.</span><button class="btn sm" data-act="nav" data-v="money">Launder</button></div>`; }); }; })();

/* 15. achievements wait until a cutscene has finished before popping up */
(function(){ const _ap=achPop; achPop=function(a){ if(document.querySelector('.cut')){ setTimeout(()=>achPop(a), 1500); return; } return _ap(a); }; })();

/* 16. the same for normal pop-ups: they queue during cutscenes instead of hiding behind them */
(function(){ const _t=toast; const Q=[]; toast=function(msg){ if(document.querySelector('.cut,.title-screen') && !S._cabMute){ Q.push(msg); return; } return _t.apply(this, arguments); }; setInterval(()=>{ if(Q.length && !document.querySelector('.cut,.title-screen')) _t(Q.shift()); }, 1200); })();

/* 17. M shows or hides the menu in flight mode */
document.addEventListener('keydown', e=>{ if(e.key.toLowerCase()!=='m' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.ctrlKey||e.metaKey||e.altKey) return; if(document.body.classList.contains('flying') || S.fmMenu){ S.fmMenu=!S.fmMenu; S.keepScroll=true; render(); } });




(function(){ const s=document.createElement('style'); s.textContent=`.launder-mini{gap:12px}.launder-mini .btn{margin-left:auto}`; document.head.appendChild(s); })();

/* + profile numbers: story progress counts the current story, and impossible touchdown readings are left out of the average */
(function(){ const _pv=profileView; profileView=function(){ const h=_pv(); try{ const st=S.st; const t=tpl(h); const MC=mainChapters(); const done=MC.filter(m=>st.story.done[m.id]).length; const good=(st.log||[]).map(x=>x.fpm).filter(v=>v>0&&v<1500); const avg=good.length?Math.round(good.reduce((a,b)=>a+b,0)/good.length):null;
  t.content.querySelectorAll('*').forEach(el=>{ if(el.children.length) return; const x=el.textContent.trim(); const box=el.parentElement; if(!box) return;
    if(/^story$/i.test(x)){ const v=[...box.querySelectorAll('*')].find(e=>!e.children.length && /\d+\s*\/\s*\d+/.test(e.textContent)); if(v) v.textContent=`${done}/${MC.length}`; else { const v2=[...box.childNodes].find(n=>n.nodeType===3 && /\d+\/\d+/.test(n.nodeValue)); if(v2) v2.nodeValue=v2.nodeValue.replace(/\d+\/\d+/, `${done}/${MC.length}`); } }
    if(/^avg touchdown$/i.test(x) && avg!=null){ const v=[...box.querySelectorAll('*')].find(e=>e!==el && !e.children.length && /^\d+$/.test(e.textContent.trim())); if(v) v.textContent=String(avg); } });
  return t.innerHTML; }catch(_){ return h; } }; })();

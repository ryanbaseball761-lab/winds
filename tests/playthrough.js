// Plays a fresh career through all 20 chapters with clicks only (test-skip flights), and reports duplicate or stacked
// cutscenes, repeated toasts, broken text, overflow and script errors. Usage: node tests/playthrough.js [choice index]  (W=400 for phone)
// Plays a fresh career through the whole story using only clicks, logging every cutscene and problem.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.env.W||1300),height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.goto('file://'+process.cwd()+'/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(1500);
const log=await p.evaluate(async(PICK)=>{ const W=ms=>new Promise(r=>setTimeout(r,ms)); const L=[]; const cuts=[]; const seenToasts={};
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.classList&&n.classList.contains('cut')) cuts.push({t:Date.now(), sig:(n.dataset.sig||'').slice(0,70), view:S.view, stacked:document.querySelectorAll('.cut').length}); }))).observe(document.body,{childList:true});
  const calls=[]; const _c=window.cutscene; window.cutscene=function(o){ calls.push({sig:cutSig(o.shots).slice(0,60), shown:false, view:S.view, t:Date.now()}); const before=document.querySelectorAll('.cut').length; const r=_c.apply(this,arguments); if(document.querySelectorAll('.cut').length>before) calls[calls.length-1].shown=true; return r; };
  const _t=window.toast; window.toast=function(m){ seenToasts[m]=(seenToasts[m]||0)+1; return _t.apply(this,arguments); };
  const clickCuts=async()=>{ for(let k=0;k<300;k++){ const c=document.querySelector('.cut'); if(!c) { await W(80); if(!document.querySelector('.cut')) return; continue; } const o=c.querySelectorAll('.cut-opt:not([disabled])'); if(o.length){ o[PICK%o.length].click(); await W(60); continue; } c.click(); await W(40); } };
  const q=s=>document.querySelector(s);
  // start screen
  await W(500); const nm=q('#pname'); if(nm){ nm.value='Bot'; nm.dispatchEvent(new Event('input',{bubbles:true})); }
  const startBtn=[...document.querySelectorAll('button')].find(b=>/Start the story/.test(b.textContent)); if(startBtn) startBtn.click(); await W(800); await clickCuts();
  uiP().testSkip=true; save();
  const fly=q('[data-act="wiz-fly"]'); if(fly){ fly.click(); await W(500); await clickCuts(); }
  const issues=[]; const check=(where)=>{ const t=(document.querySelector('main')||{}).innerText||''; const m=t.match(/.{0,30}(undefined|NaN|\[object Object\]|null ·|· null).{0,20}/); if(m) issues.push(where+': '+m[0].replace(/\s+/g,' '));
    if(document.documentElement.scrollWidth>innerWidth+2) issues.push(where+': page wider than window');
    if(document.querySelectorAll('.cut').length>1) issues.push(where+': two cutscenes stacked');
    const tc=document.querySelectorAll('#toasts > *').length; if(tc>3) issues.push(where+': '+tc+' toasts on screen'); };
  for(let step=0; step<80; step++){
    const st=S.st; check('step '+step+' '+S.view+(st.active?' '+st.active.job.title:'')); const c=crime(st); if(c.ending) { L.push('ENDING '+c.ending); break; }
    await clickCuts();
    if(st.active){ S.view='flight'; render(); await W(100); const sk=q('[data-act="test-skip"]'); if(!sk){ L.push('no skip button at '+st.active.job.title+' started='+!!st.active.started); const sf=q('[data-act="start-flight"],[data-act="start"]'); if(sf){ sf.click(); await W(200); continue; } break; } sk.click(); await W(400); await clickCuts();
      const ch=document.querySelectorAll('.choice [data-act="crime-choose"]'); if(ch.length){ ch[PICK%ch.length].click(); await W(300); await clickCuts(); }
      continue; }
    // not in a flight: use the main button of the story
    S.view='story'; render(); await W(100);
    const go=q('.panel [data-act="story-go"], .panel [data-act="accept-story"]'); if(go){ go.click(); await W(500); await clickCuts(); continue; }
    const bk=q('[data-act="book-check"]'); if(bk){ bk.click(); await W(300); await clickCuts(); continue; }
    const pa=[...document.querySelectorAll('main button')].find(b=>/Play chapter|Book|checkride/i.test(b.textContent)); if(pa){ L.push('main button: '+pa.textContent.trim()+' ['+pa.dataset.act+(pa.dataset.v?':'+pa.dataset.v:'')+']'); pa.click(); await W(400); await clickCuts();
      if(!S.st.active){ const bk2=q('[data-act="book-check"]'); if(bk2){ L.push('  then '+bk2.textContent.trim()+' on '+S.view); bk2.click(); await W(400); await clickCuts(); } else { L.push('  landed on '+S.view+': '+(q('main')||{}).innerText.slice(0,160).replace(/\s+/g,' ')); break; } }
      continue; }
    L.push('stuck: '+(q('main')||{}).innerText.slice(0,200).replace(/\s+/g,' ')); break; }
  // duplicates
  const bySig={}; cuts.forEach(c=>{ (bySig[c.sig]=bySig[c.sig]||[]).push(c); });
  const dups=Object.entries(bySig).filter(([k,v])=>v.length>1).map(([k,v])=>k+' ×'+v.length);
  const stacked=cuts.filter(c=>c.stacked>1).length;
  const toastDup=Object.entries(seenToasts).filter(([k,v])=>v>2).map(([k,v])=>k.slice(0,60)+' ×'+v);
  const ignored=calls.filter(c=>!c.shown).map(c=>c.sig+' @'+c.view); return {issues:[...new Set(issues)].slice(0,30), ignored, steps:L, cuts:cuts.length, chapters:mainChapters().filter(m=>S.st.story.done[m.id]).length, dups, stacked, toastDup, flights:S.st.flights}; }, Number(process.argv[2]||0));
console.log(JSON.stringify(log,null,1)); console.log('ERRORS', [...new Set(errs)].slice(0,5)); await b.close();})();

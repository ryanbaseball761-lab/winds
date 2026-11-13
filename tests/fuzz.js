// usage (from the repo root): node tests/fuzz.js
// click every visible button on every page (fresh page state per view), report script errors
const {chromium}=require('playwright'),fs=require('fs');(async()=>{const b=await chromium.launch();const FIX=fs.readFileSync('./tests/fixture-save.json','utf8');
const views=['story','board','map','pilot','profile','log','money','company','cup','academy','hangar','flight','cockpit'];const all=[];
for(const mode of ['early','mid']) for(const v of views){ const p=await b.newPage({viewport:{width:1300,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' '))); p.on('dialog',d=>d.dismiss());
  await p.goto('file://'+process.cwd()+'/index.html');await p.evaluate(s=>{localStorage.clear();localStorage.setItem('tradewinds.career.v1',s)},FIX);await p.reload();await p.waitForTimeout(1500);
  const n=await p.evaluate(async([v,mode])=>{ const W=ms=>new Promise(r=>setTimeout(r,ms)); const clean=()=>document.querySelectorAll('.cut,.title-screen,.lic-overlay').forEach(e=>e.remove()); clean(); S._title=false; const st=S.st;
    if(mode==='mid'){ for(const m of mainChapters().slice(0,12)) st.story.done[m.id]=1; const c=crime(st); c.on=true; c.heat=45; c.dirty=8000; Object.assign(st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1}); st.cash=3e6; st.company={name:'Caribe Cargo',base:'TNCM',fleet:[],ledger:[],founded:1}; }
    st.jobs=genJobs(st); if(v==='flight'||v==='cockpit'){ st.active={job:st.jobs.find(j=>!j.local)||st.jobs[0],accepted:Date.now()}; }
    S.view=v; render(); await W(100); let clicks=0; const seen=new Set();
    for(let round=0; round<3; round++){ const btns=[...document.querySelectorAll('main button:not([disabled]), main [data-act]:not(button)')].filter(x=>x.offsetParent && !seen.has(x.outerHTML));
      for(const x of btns.slice(0,40)){ const a=x.dataset.act||''; seen.add(x.outerHTML); if(/del|reset|wipe|new-career|ng-start|quit|bug-copy|export|import|open-logs|cancel-yes|co-sell/.test(a)) continue; try{ x.click(); clicks++; }catch(e){} await W(20); clean(); if(S.view!==v){ S.view=v; S.showResult=false; render(); await W(20); } } }
    return clicks; },[v,mode]);
  all.push(`${mode}/${v}: ${n} clicks${errs.length?'  ERRORS: '+[...new Set(errs)].slice(0,3).join(' | '):''}`); await p.close(); }
console.log(all.join('\n')); await b.close();})();

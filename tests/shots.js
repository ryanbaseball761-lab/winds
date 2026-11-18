// Visual audit: screenshots of every screen at desktop and phone width, plus layout checks.
// usage (from the repo root): node tests/shots.js [outdir]   (default: shots/)
// Writes PNG/JPEG screenshots and report.json (script errors, sideways overflow, clipped or tiny text).
// The clock and random numbers are frozen (tests/fakesim.js), so two runs give the same pictures.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'); const {INIT}=require('./fakesim');
const ROOT=path.join(__dirname,'..'), OUT=path.resolve(process.argv[2]||'shots'), FIX=fs.readFileSync(path.join(__dirname,'fixture-save.json'),'utf8');
fs.mkdirSync(OUT,{recursive:true});
const WIDTHS=[[1440,900,'d'],[390,844,'m']];
const STATES={
  early:`S.st.ratings=Object.assign(S.st.ratings,{PPL:1});`,
  mid:`for(const m of mainChapters().slice(0,8)) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; c.power=35; c.heat=45; c.dirty=25000; S.st.cash=60000; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1}); S.st.company={name:'Caribe Cargo',base:'TNCM',fleet:[],ledger:[],founded:1};`,
};
const VIEWS=['story','board','map','flight','cockpit','pilot','log','money','company','cup','academy','profile','hangar'];
const HTABS=['fleet','settings','msfs','save'];
// page-side layout checks
const CHECK=`(()=>{ const out={overflowX:0,wide:[],clipped:[],tiny:[]}; const W=document.documentElement.clientWidth;
  out.overflowX=Math.max(0,document.documentElement.scrollWidth-W);
  const vis=e=>{ const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'; };
  const desc=e=>{ let d=e.tagName.toLowerCase(); if(e.id) d+='#'+e.id; if(e.className&&typeof e.className==='string') d+='.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'); return d+' "'+(e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,40)+'"'; };
  for(const e of document.querySelectorAll('body *')){ if(!vis(e)) continue; const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
    if(r.right>W+2 && s.position!=='fixed' && !e.closest('[style*="overflow"],.scroll-x,table,pre,.cut')) { let inScroll=false; for(let p=e.parentElement;p;p=p.parentElement){ const ps=getComputedStyle(p); if(/auto|scroll|hidden/.test(ps.overflowX)){ inScroll=true; break; } } if(!inScroll && out.wide.length<12) out.wide.push(desc(e)+' right='+Math.round(r.right)); }
    if(e.children.length===0 && (e.textContent||'').trim()){ if(e.scrollWidth>e.clientWidth+2 && /hidden|clip/.test(s.overflowX) && s.textOverflow!=='ellipsis' && out.clipped.length<12) out.clipped.push(desc(e));
      const fs=parseFloat(s.fontSize); if(fs<11 && out.tiny.length<12) out.tiny.push(desc(e)+' '+fs+'px'); } }
  // text that barely shows against what's behind it (contrast under 2.5:1, opacity included)
  const rgb=c=>{ const m=String(c).match(/[\\d.]+/g)||[0,0,0,0]; return [+m[0],+m[1],+m[2],m[3]==null?1:+m[3]]; };
  const lum=([r,g,b])=>{ const f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
  const bgOf=e=>{ for(let p=e;p&&p.nodeType===1;p=p.parentElement){ const c=rgb(getComputedStyle(p).backgroundColor); if(c[3]>0.5) return c; if(getComputedStyle(p).backgroundImage!=='none') return null; } return [7,9,11,1]; };
  const opac=e=>{ let o=1; for(let p=e;p&&p.nodeType===1;p=p.parentElement) o*=+getComputedStyle(p).opacity; return o; };
  out.faint=[]; for(const e of document.querySelectorAll('main button, main a, main .btn, main p, main span, main b, main small, main td, main dd, main dt, main h1, main h2, main h3, main h4, header button, header span')){ if(out.faint.length>=10||!vis(e)) continue; const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!own) continue;
    const bg=bgOf(e); if(!bg) continue; const s=getComputedStyle(e); const fg=rgb(s.color); const a=fg[3]*opac(e); const mix=[0,1,2].map(i=>fg[i]*a+bg[i]*(1-a)); const L1=lum(mix),L2=lum(bg); const cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    if(cr<2.5) out.faint.push(desc(e)+' contrast='+cr.toFixed(2)+(e.disabled?' (disabled)':'')); }
  out.disabled=[...document.querySelectorAll('button:disabled')].filter(vis).slice(0,6).map(e=>{ const s=getComputedStyle(e); return desc(e)+' color='+s.color+' fill='+s.webkitTextFillColor+' op='+s.opacity+' fs='+s.fontSize+' bg='+s.backgroundColor; });
  return out; })()`;
(async()=>{ const b=await chromium.launch(); const report={};
 const open=async(w,h,save)=>{ const ctx=await b.newContext({viewport:{width:w,height:h},timezoneId:'America/Chicago',locale:'en-US',deviceScaleFactor:1}); await ctx.addInitScript(INIT); const p=await ctx.newPage(); p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') p._errs.push('console: '+m.text()); });
   await p.goto('file://'+ROOT+'/index.html'); await p.evaluate(s=>{ localStorage.clear(); if(s) localStorage.setItem('tradewinds.career.v1',s); },save); await p.reload(); await p.evaluate(()=>__tick(3000)); p._ctx=ctx; return p; };
 const shot=async(p,name)=>{ await p.evaluate(()=>{ __tick(1200); }); const file=path.join(OUT,name+'.jpg'); await p.screenshot({path:file,fullPage:true,type:'jpeg',quality:62,animations:'disabled',caret:'hide'}); const c=await p.evaluate(CHECK); c.errors=p._errs.splice(0); report[name]=c; };
 const clear=`document.querySelectorAll('.cut,.title-screen,.beat,.pc-wrap,.lic-overlay').forEach(e=>e.remove()); S._title=false; S._walk=false; if(S.st){ S.st.ui=S.st.ui||{}; S.st.ui.walk3=1; } S.notifs=[];`;
 for(const [w,h,tag] of WIDTHS){
  // title and new career
  let p=await open(w,h,FIX); await shot(p,`${tag}-00-title`); await p._ctx.close();
  p=await open(w,h,null); await shot(p,`${tag}-01-setup`);
  await p.evaluate(()=>{ const t=document.querySelector('[data-ts="new"],[data-ts]'); if(t){ t.click(); __tick(500); } }); await shot(p,`${tag}-02-setup-form`);
  await p.evaluate(()=>{ const n=document.getElementById('pname'); if(n){ n.value='Test Pilot'; const c=document.getElementById('pcall'); if(c) c.value='TW1'; document.getElementById('setup-form').requestSubmit(); __tick(1500); } }); await shot(p,`${tag}-03-coldopen`);
  await p.evaluate(()=>{ for(let i=0;i<6;i++){ const c=document.querySelector('.cut'); if(!c) break; (c.querySelector('.cut-stage')||c).click(); __tick(900); } }); await shot(p,`${tag}-04-coldopen-later`);
  await p.evaluate(()=>{ for(let n=0;n<300 && document.querySelector('.cut');n++){ const c=document.querySelector('.cut'); const o=c.querySelectorAll('.cut-opt:not([disabled])'); if(o.length) o[0].click(); else (c.querySelector('.cut-stage')||c).click(); __tick(900); } __tick(3000); }); await shot(p,`${tag}-05-first-home`);
  await p._ctx.close();
  // every page in two careers
  for(const [sn,setup] of Object.entries(STATES)){ p=await open(w,h,FIX);
   for(const v of VIEWS){ await p.evaluate(([clear,setup,v])=>{ new Function(clear)(); if(!window.__set){ new Function(setup)(); S.st.jobs=genJobs(S.st); window.__set=1; } if(v==='flight'||v==='cockpit'){ if(!S.st.active) S.st.active={job:S.st.jobs.find(j=>!j.local)||S.st.jobs[0],accepted:Date.now()}; } else { S.st.active=null; } S.view=v; S.showResult=false; render(); window.scrollTo(0,0); },[clear,setup,v]); await shot(p,`${tag}-${sn}-${v}`); }
   for(const t of HTABS){ await p.evaluate(([clear,t])=>{ new Function(clear)(); S.st.active=null; S.view='hangar'; S.hangarTab=t; render(); window.scrollTo(0,0); },[clear,t]); await shot(p,`${tag}-${sn}-hangar-${t}`); }
   // a finished flight: result screen
   await p.evaluate(([clear])=>{ new Function(clear)(); S.st.jobs=genJobs(S.st); S.st.active={job:S.st.jobs.find(j=>!j.local)||S.st.jobs[0],accepted:Date.now()}; S.view='flight'; S.showResult=false; render(); const k=document.querySelector('[data-act="test-skip"]'); if(k) k.click(); __tick(2500); },[clear]); await shot(p,`${tag}-${sn}-result-cut`);
   await p.evaluate(([clear])=>{ for(let n=0;n<300 && document.querySelector('.cut');n++){ const c=document.querySelector('.cut'); const o=c.querySelectorAll('.cut-opt:not([disabled])'); if(o.length) o[0].click(); else (c.querySelector('.cut-stage')||c).click(); __tick(900); } new Function(clear)(); window.scrollTo(0,0); },[clear]); await shot(p,`${tag}-${sn}-result`);
   await p._ctx.close(); }
  // a story chapter: prologue and flight orders
  p=await open(w,h,FIX); await p.evaluate(([clear])=>{ new Function(clear)(); const MC=mainChapters(); for(const m of MC.slice(0,4)) S.st.story.done[m.id]=1; const c=crime(S.st); c.on=true; S.st.cash=80000; Object.assign(S.st.ratings,{PPL:1,COMM:1,IR:1,ME:1,JET:1,ATP:1,TURB:1}); const m=MC[4]; m.ac.forEach(k=>S.st.hangar[k]=true); S.st.loc=m.from; S.view='story'; render(); },[clear]); await shot(p,`${tag}-ch5-story`);
  await p.evaluate(()=>{ const b=document.querySelector('[data-act="accept-story"],[data-act="story-go"]'); if(b){ b.click(); __tick(1500); } }); await shot(p,`${tag}-ch5-prologue`);
  await p.evaluate(()=>{ for(let n=0;n<300 && document.querySelector('.cut');n++){ const c=document.querySelector('.cut'); const o=c.querySelectorAll('.cut-opt:not([disabled])'); if(o.length) o[0].click(); else (c.querySelector('.cut-stage')||c).click(); __tick(900); } __tick(1000); window.scrollTo(0,0); }); await shot(p,`${tag}-ch5-orders`);
  await p._ctx.close(); }
 await b.close(); fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,1));
 const probs=Object.entries(report).filter(([k,r])=>r.errors.length||r.overflowX>2||r.wide.length||r.clipped.length||r.faint.length);
 console.log(probs.map(([k,r])=>`${k}: ${r.errors.length?'errors='+r.errors.slice(0,2).join(' | ')+' ':''}${r.overflowX>2?'overflowX='+r.overflowX+' ':''}${r.wide.length?'wide='+r.wide.slice(0,3).join('; ')+' ':''}${r.clipped.length?'clipped='+r.clipped.slice(0,3).join('; ')+' ':''}${r.faint.length?'faint='+r.faint.slice(0,4).join('; '):''}`).join('\n')||'no layout problems');
 console.log(Object.keys(report).length+' screens captured in '+OUT); })();

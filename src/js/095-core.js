/* ===================== A. TITLE SCREEN, COLD OPEN, PLAYER SETTINGS ===================== */
function uiP(){ const st=S.st; if(!st) return {}; st.ui=st.ui||{}; return st.ui; }
function volOf(ch){ const v=uiP().vol||{}; return (v[ch]==null?80:v[ch])/100; }

/* ---- title screen on every launch ---- */
S._title = !navigator.webdriver;
function titleHTML(){ const st=S.st; let cont=''; if(st){ const MC=mainChapters(); const next=MC.find(m=>!st.story.done[m.id]); const n=next?MC.indexOf(next)+1:MC.length; cont = next ? `Chapter ${n} · ${next.title}` : 'Story complete'; }
  return `<div class="ts-bg">${typeof SCENES!=='undefined'?SCENES.ramp():''}</div><div class="ts-rain"></div><div class="ts-shade"></div>
  <div class="ts-in"><div class="ts-logo"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="#c8962a" stroke-width="2"/><path d="M32 6 L36 28 L58 32 L36 36 L32 58 L28 36 L6 32 L28 28Z" fill="#c8962a"/></svg><div><h1>TRADE WINDS</h1><p>Every cargo has a price</p></div></div>
  <nav class="ts-menu">${st?`<button data-ts="continue" class="on"><b>Continue</b><span>${esc(st.pilot&&st.pilot.name||'')}${cont?` · ${esc(cont)}`:''}</span></button>`:''}
    <button data-ts="new"><b>New game</b><span>${st?'Start a new career (your current one is backed up)':'Start your career'}</span></button>
    ${st?'<button data-ts="settings"><b>Settings</b><span>Sound, units, cutscenes</span></button>':''}
    ${window.twNative?'<button data-ts="quit"><b>Quit</b></button>':''}</nav>
  <p class="ts-foot">v${typeof TW_VERSION!=='undefined'?TW_VERSION:''} · A story career for Microsoft Flight Simulator 2024 · Not affiliated with Microsoft or Asobo</p></div>`; }
function showTitle(){ if(document.querySelector('.title-screen')) return; const el=document.createElement('div'); el.className='title-screen'; el.innerHTML=titleHTML(); document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on'));
  try{ MUSIC && MUSIC.play('title'); }catch(_){}
  const buttons=()=>[...el.querySelectorAll('.ts-menu button:not([disabled])')]; let idx=0;
  const key=e=>{ if(!document.body.contains(el)) { document.removeEventListener('keydown',key,true); return; } const B=buttons(); if(e.key==='ArrowDown'){ idx=(idx+1)%B.length; } else if(e.key==='ArrowUp'){ idx=(idx-1+B.length)%B.length; } else if(e.key==='Enter'||e.key===' '){ e.preventDefault(); B[idx].click(); return; } else return; e.preventDefault(); B.forEach((b,i)=>b.classList.toggle('on',i===idx)); };
  document.addEventListener('keydown', key, true);
  el.addEventListener('mouseover', e=>{ const b=e.target.closest('.ts-menu button'); if(b){ buttons().forEach(x=>x.classList.toggle('on',x===b)); idx=buttons().indexOf(b); } });
  el.addEventListener('click', e=>{ const b=e.target.closest('[data-ts]'); if(!b) { try{ MUSIC&&MUSIC.play('title'); }catch(_){} return; } const a=b.dataset.ts;
    if(a==='quit'){ window.close(); return; }
    if(a==='new' && S.st && !b.dataset.ok){ b.dataset.ok=1; b.querySelector('span').textContent='Click again: your current career is backed up first'; return; }
    const close=after=>{ el.classList.remove('on'); setTimeout(()=>{ el.remove(); document.removeEventListener('keydown',key,true); S._title=false; try{ MUSIC&&MUSIC.stop(); }catch(_){} after&&after(); }, 500); };
    if(a==='continue') close(()=>{ S.view = S.st.active ? 'flight' : 'story'; render(); setTimeout(playRecapNow, 300); });
    if(a==='settings') close(()=>{ S.view='hangar'; S.hangarTab='settings'; render(); });
    if(a==='new') close(()=>{ if(S.st){ try{ backupLabeled(S.st,'Before starting a new game'); }catch(_){} } S.st=null; try{ localStorage.removeItem(KEY); }catch(_){} S.view='board'; render(); }); }); }
(function(){ let shown=false; const _r=render; render=function(){ const x=_r.apply(this, arguments); if(!shown && S._title){ shown=true; setTimeout(showTitle, 50); } return x; }; })();
function playRecapNow(){ try{ const st=S.st; if(!st || uiP().noRecap || uiP().skipCuts || !uiP().walk3) return; const MC=mainChapters(); const dn=MC.filter(m=>st.story.done[m.id]); if(!dn.length || (st.active&&st.active.started)) return;
  const next=MC.find(m=>!st.story.done[m.id]); const act=next?CRIME_ACTS.find(a=>a.arc===next.arc):CRIME_ACTS[CRIME_ACTS.length-1];
  const shots=[{card:true,kicker:'Previously on',title:'Trade Winds',auto:1600}].concat(dn.slice(-3).map(m=>[`Chapter ${MC.indexOf(m)+1} · ${m.title}`, null, m.recap||''])); if(next) shots.push({card:true,kicker:`Up next · Chapter ${MC.indexOf(next)+1}`,title:next.title,sub:`<p>${esc(next.hook||'')}</p>`});
  cutscene({shots, col:act.col, art:SCENES.office(), onEnd:()=>{}}); }catch(_){} }

/* ---- cold open for a brand-new career: a flash-forward, then "two years earlier" ---- */
function coldOpenShots(){ const st=S.st; if(!st || (st.flights||0)>0 || st.story.done.CW1) return [];
  return [{card:true,kicker:'Two years from now',title:'Miami',sub:'<p>2:14 in the morning.</p>',auto:2200},
    ['Miami cargo ramp · 2:14 AM', null, `Rain on the windshield of a Boeing 747. A hundred tons in the hold. Blue lights circling the ramp.`],
    ['Phone call', 'reyes', `We're in position. Whatever you're planning, don't.`],
    ['The jump seat', 'castillo', `You always had calm hands. That's why I picked you.`],
    {card:true,kicker:'Two years earlier',title:'Sint Maarten',sub:'<p>A fresh licence, a cheap job, and a Cessna with a cracked seat.</p>',auto:2600}]; }

/* ---- skipping cutscenes, if you'd rather just fly ---- */
(function(){ const _pp=playPrologue; playPrologue=function(m, done){ if(uiP().skipCuts){ done(); return; } return _pp(m, done); }; })();
(function(){ const _pa=playAftermath; playAftermath=function(){ if(uiP().skipCuts) return; return _pa(); }; })();

/* ---- units: imperial or metric everywhere ---- */
function toMetric(t){ return t.replace(/(\d[\d,]*(?:\.\d+)?)\s?lb\b/g,(m,n)=>`${Math.round(Number(n.replace(/,/g,''))*0.4536).toLocaleString()} kg`).replace(/(\d[\d,]*(?:\.\d+)?)\s?gal\b/g,(m,n)=>`${Math.round(Number(n.replace(/,/g,''))*3.785).toLocaleString()} L`); }
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ if(uiP().metric){ const w=document.createTreeWalker(document.getElementById('app')||document.body, NodeFilter.SHOW_TEXT); const L=[]; while(w.nextNode()) L.push(w.currentNode); L.forEach(n=>{ if(/\d\s?(lb|gal)\b/.test(n.nodeValue)) n.nodeValue=toMetric(n.nodeValue); }); } }catch(_){} return x; }; })();

/* ---- volume per channel: voices, music, effects ---- */
(function(){ const _vv=voiceVol; voiceVol=function(){ return _vv()*volOf('voice')/0.8*0.8; }; })();
(function(){ const _ac=actx; let wired=null; actx=function(){ const c=_ac(); if(!c) return c; if(wired!==c){ wired=c; try{ const real=c.destination; const fx=c.createGain(); fx.connect(real); const mus=c.createGain(); mus.connect(real); Object.defineProperty(c,'destination',{configurable:true, get(){ return fx; }}); c._real=real; c._fx=fx; c._mus=mus; }catch(_){} }
  try{ c._fx.gain.value=volOf('fx'); c._mus.gain.value=volOf('music'); }catch(_){} return c; }; })();

/* ---- settings page additions ---- */
const _tsSet = settingsHTML;
settingsHTML = function(){ const h=_tsSet(); const u=uiP(); const v=u.vol||{}; const sl=(k,n)=>`<label class="vol"><span>${n}</span><input type="range" min="0" max="100" step="5" value="${v[k]==null?80:v[k]}" data-act="vol" data-k="${k}"><b>${v[k]==null?80:v[k]}</b></label>`;
  return h.replace('<div class="set-grid">', `<div class="set-grid">
  <div><p class="label">Volume</p>${sl('voice','Voices')}${sl('music','Music')}${sl('fx','Effects')}</div>
  <div><p class="label">Units</p><div class="diff"><button class="${u.metric?'':'on'}" data-act="units" data-v="imp">Imperial (lb, gal)</button><button class="${u.metric?'on':''}" data-act="units" data-v="met">Metric (kg, L)</button></div><p class="tiny muted" style="margin-top:4px">Altitudes stay in feet and distances in nautical miles, as in aviation.</p></div>
  <div><p class="label">Cutscenes</p><label class="row"><input type="checkbox" data-act="ui-tog2" data-k="skipCuts" ${u.skipCuts?'checked':''}> Skip all cutscenes (choices still appear on the result screen)</label></div>`); };
document.addEventListener('input', e=>{ const b=e.target.closest('[data-act="vol"]'); if(!b||!S.st) return; const u=uiP(); u.vol=u.vol||{}; u.vol[b.dataset.k]=Number(b.value); const out=b.parentElement.querySelector('b'); if(out) out.textContent=b.value; try{ actx(); }catch(_){} save(); });
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="ui-tog2"]'); if(!b||!S.st) return; uiP()[b.dataset.k]=b.checked; save(); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="units"]'); if(!b||!S.st) return; uiP().metric=b.dataset.v==='met'; save(); S.keepScroll=true; render(); });

(function(){ const s=document.createElement('style'); s.textContent=`
.title-screen{position:fixed;inset:0;z-index:12000;background:#000;color:#ece6da;opacity:0;transition:opacity .6s;overflow:hidden}.title-screen.on{opacity:1}
.ts-bg{position:absolute;inset:-6%;filter:saturate(.6) brightness(1.15) contrast(1.05);animation:tsPan 40s ease-in-out infinite alternate}.ts-bg svg{width:100%;height:100%}
@keyframes tsPan{from{transform:scale(1.05) translate(0,0)}to{transform:scale(1.15) translate(-3%,1%)}}
.ts-rain{position:absolute;inset:0;background-image:repeating-linear-gradient(105deg,rgba(255,255,255,.07) 0 1px,transparent 1px 9px);background-size:200px 200px;animation:tsRain .6s linear infinite;opacity:.5}@keyframes tsRain{to{background-position:-60px 200px}}
.ts-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.45) 50%,rgba(0,0,0,.05) 100%)}
.ts-in{position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 9vw;max-width:760px}
.ts-logo{display:flex;align-items:center;gap:20px;margin-bottom:6vh}.ts-logo svg{width:64px;height:64px;flex:none}.ts-logo h1{margin:0;white-space:nowrap;font-size:clamp(40px,5.5vw,72px);letter-spacing:.14em;font-weight:800}.ts-logo p{margin:4px 0 0;font-family:var(--f-mono);font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#c8962a}
.ts-menu{display:grid;gap:6px;max-width:460px}.ts-menu button{display:grid;gap:2px;text-align:left;background:transparent;border:0;border-left:3px solid transparent;color:#cfc8bb;font:inherit;padding:12px 18px;cursor:pointer;transition:.15s}
.ts-menu button b{font-size:22px;font-weight:700}.ts-menu button span{font-size:13px;color:#8f897e}.ts-menu button.on{border-left-color:#c8962a;background:linear-gradient(90deg,rgba(200,150,42,.16),transparent);color:#fff;padding-left:24px}.ts-menu button[disabled]{opacity:.35;cursor:default}
.ts-foot{position:absolute;bottom:24px;left:9vw;font-size:12px;color:#6d685f}
.vol{display:grid;grid-template-columns:70px 1fr 34px;align-items:center;gap:10px;font-size:14px;margin:6px 0}.vol input{width:100%}.vol b{font-family:var(--f-mono);font-size:12px;color:var(--muted)}`; document.head.appendChild(s); })();

/* ===================== EVERYTHING IS A CUTSCENE: one engine for prologues, aftermaths, choices and endings ===================== */
/* shot types:
   [place, speaker|null, text]                          line or narration
   {card:true, kicker, title, sub}                      big title card
   {choice:true, q, opts:[{t, why}], pick:i=>shots}     a decision; pick() returns the shots that follow */
function cutscene(opt){ const shots=opt.shots.slice(); const col=opt.col||'#c8962a';
  const el=document.createElement('div'); el.className='cut'; el.style.setProperty('--arc', col);
  el.innerHTML=`<div class="cut-bg">${opt.art||''}</div><div class="cut-shade"></div><div class="cut-bar top"></div><div class="cut-bar bot"></div>
    <div class="cut-stage"></div><div class="cut-ctl"><span class="cut-hint">Click or press Space</span><button class="cut-skip">Skip</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on')); try{ window.cutHook && cutHook.start(el, opt); }catch(_){}
  const stage=el.querySelector('.cut-stage'); let i=-1, typing=null, full='', txt=null, waiting=false, ended=false;
  const stopVoice=()=>{ try{ speechSynthesis.cancel(); }catch(_){} };
  const say=(k,t)=>{ if(!(typeof voiceOn==='function'&&voiceOn())||!window.speechSynthesis) return; const v=PRO_VOICE[k]||[false,0.95,0.9]; try{ stopVoice(); const u=new SpeechSynthesisUtterance(String(t).replace(/"/g,'')); const vv=pickVoice(v[0], k==='castillo'||k==='medina'?1:0); if(vv) u.voice=vv; u.rate=v[1]; u.pitch=v[2]; u.volume=voiceVol(); speechSynthesis.speak(u); }catch(_){} };
  const end=()=>{ if(ended) return; ended=true; try{ window.cutHook && cutHook.end(el, opt); }catch(_){} clearInterval(typing); stopVoice(); document.removeEventListener('keydown', key, true); el.classList.remove('on'); setTimeout(()=>{ el.remove(); opt.onEnd&&opt.onEnd(); }, 600); };
  const bg=()=>{ el.querySelector('.cut-bg').style.transform=`scale(${1.06+Math.max(0,i)*0.025}) translate(${(i%2?-1:1)*1.2}%, ${Math.max(0,i)*0.35}%)`; };
  const show=()=>{ i++; waiting=false; el.classList.remove('choosing','carding'); if(i>=shots.length){ end(); return; } const s=shots[i]; bg(); try{ window.cutHook && cutHook.shot(s, el, i, opt); }catch(_){}
    if(s.card){ el.classList.add('carding'); stage.innerHTML=`<div class="cut-title"><p>${esc(s.kicker||'')}</p><h1>${esc(s.title||'')}</h1>${s.sub?`<div class="cut-sub">${s.sub}</div>`:''}</div>`; txt=null; full=''; try{ whoosh&&whoosh(); }catch(_){} if(s.auto) setTimeout(()=>{ if(shots[i]===s) show(); }, s.auto); return; }
    if(s.choice){ el.classList.add('choosing'); waiting=true; stage.innerHTML=`<p class="cut-place">Your call</p><p class="cut-text cut-q">${esc(s.q)}</p><div class="cut-opts">${s.opts.map((o,k)=>`<button class="cut-opt" data-k="${k}" ${o.why?'disabled':''}>${esc(o.t)}${o.why?`<small>${esc(o.why)}</small>`:''}</button>`).join('')}</div>`; txt=null; full=''; return; }
    const [pl,k,t]=s; stage.innerHTML=`<p class="cut-place">${esc(pl||'')}</p><div class="cut-line in">${k&&CAST[k]?`<div class="cut-who">${avatar(k)}<b>${esc(CAST[k].n)}</b></div>`:''}<p class="cut-text ${k?'':'nar'}"></p></div>`;
    txt=stage.querySelector('.cut-text'); full=k?`“${t}”`:t; let n=0; clearInterval(typing); const me=s; typing=setInterval(()=>{ n+=2; txt.textContent=full.slice(0,n); if(n>=full.length){ clearInterval(typing); if(window.cutAuto && cutAuto()){ clearTimeout(el._auto); el._auto=setTimeout(()=>{ if(shots[i]===me && !waiting) show(); }, 1800+full.length*28); } } }, 22); if(k) say(k,t); };
  const next=()=>{ if(waiting) return; if(txt && txt.textContent.length<full.length){ clearInterval(typing); txt.textContent=full; return; } show(); };
  const key=e=>{ if(e.key===' '||e.key==='Enter'||e.key==='ArrowRight'){ e.preventDefault(); e.stopPropagation(); next(); } else if(e.key==='ArrowLeft'){ e.preventDefault(); e.stopPropagation(); if(!waiting){ let j=i-1; while(j>=0 && shots[j].card) j--; if(j>=0 && !shots.slice(j,i+1).some(x=>x.choice)){ clearInterval(typing); i=j-1; show(); } } } else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); skip(); } };
  /* Skip jumps to the next decision (decisions can't be skipped), or to the end */
  const skip=()=>{ clearInterval(typing); const j=shots.findIndex((s,k)=>k>i && s.choice); if(shots[i]&&shots[i].choice) return; if(j>=0){ i=j-1; show(); } else end(); };
  document.addEventListener('keydown', key, true);
  el.addEventListener('click', e=>{ if(e.target.closest('.cut-skip')){ skip(); return; } const b=e.target.closest('.cut-opt'); if(b){ if(b.disabled) return; const s=shots[i]; const more=s.pick(Number(b.dataset.k))||[]; shots.splice(i+1, 0, ...more); waiting=false; show(); return; } next(); });
  setTimeout(show, 450); return el; }

/* the art behind a scene */
function sceneArt(code, dep, ac){ try{ return islandArt(code, dep, 1600, 900, ac); }catch(_){ return ''; } }

/* ---- prologues now run on the engine, and the first chapter of each act opens with the act card ---- */
playPrologue = function(m, done){ const st=S.st; const MC=mainChapters(); const act=CRIME_ACTS.find(a=>a.arc===m.arc)||CRIME_ACTS[0]; const ai=CRIME_ACTS.indexOf(act); const shots=[];
  const firstOfAct = MC.filter(x=>x.arc===m.arc)[0]===m;
  if(firstOfAct) shots.push({card:true, kicker:`Act ${ai+1} of ${CRIME_ACTS.length}`, title:act.arc, sub:`<p>${esc(act.tag)}</p><p class="cut-nerve"><span>Your nerve</span> ${esc(act.nerve)}</p>`});
  (proFor(m.id)||[]).forEach(s=>shots.push(s));
  shots.push({card:true, kicker:`Chapter ${MC.indexOf(m)+1} of ${MC.length}`, title:m.title, sub:`<p>${esc((CH_GOAL[m.id]||[])[0]||'')}</p>`, auto:2600});
  cutscene({shots, col:act.col, art:sceneArt(m.from, m.dep, m.ac[0]), onEnd:done}); };


/* ---- after a chapter: what happened, your decision, and what it led to, all as one scene ---- */
function fxSub(o){ const b=[]; if(o.power) b.push(`Power ${o.power>0?'+':''}${o.power>=100?'max':o.power}`); if(o.heat) b.push(`Heat ${o.heat>0?'+':''}${o.heat<=-100?'cleared':o.heat}`); if(o.cash) b.push(`${o.cash>0?'+':'−'}${money(Math.abs(o.cash))}`); return b.join(' · '); }
function splitOut(text){ return String(text||'').split(/(?<=[.!?”"])\s+(?=[A-Z"“])/).reduce((acc,s)=>{ const last=acc[acc.length-1]; if(last && (last+' '+s).length<170) acc[acc.length-1]=last+' '+s; else acc.push(s); return acc; }, []); }
function playAftermath(){ const st=S.st, L=st&&st.last; if(!L||!L.job) return; const job=L.job, m=CRIME.find(x=>x.id===job.story); if(!m) return; const c=crime(st); const MC=mainChapters(); const act=CRIME_ACTS.find(a=>a.arc===m.arc)||CRIME_ACTS[0];
  const here=AP[job.to]?AP[job.to].n:''; const shots=[];
  shots.push({card:true, kicker:`${m.title} · ${here}`, title:`Grade ${L.res.grade}`, sub:`<p>${esc(L.out.pay?`You earned ${money(L.out.pay)}`:'')}</p>`, auto:1800});
  splitOut(L.out.story).forEach(t=>shots.push([here, null, t]));
  const nextCard=()=>{ const nx=MC.find(x=>!st.story.done[x.id]); const cc=crime(st); const out=[];
    if(cc.ending){ epilogue(st).forEach(t=>out.push(['Years later', null, t])); out.push({card:true, kicker:'The end', title:{kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'}[cc.ending]||'The end', sub:`<p>Thank you for playing the main story. Side jobs and the Starling story are still out there.</p>`}); return out; }
    out.push({card:true, kicker:'Chapter complete', title:m.title, sub:`${cc.on?`<p class="cut-meters"><span>Power ${cc.power}</span><span>Heat ${cc.heat}</span><span>${esc(crimeRank(cc))}</span></p>`:''}${nx?`<p>Next: <b>${esc(nx.title)}</b> · ${esc(nx.hook||'')}</p>`:''}`}); return out; };
  if(m.choice && c.choice[m.id]==null && !L.res.crash){
    const opts=m.choice.opts.map(o=>({t:o.t, why: (m.id==='CR17' && o.ending && typeof ENDING_REQ!=='undefined') ? ENDING_REQ[o.ending](c) : null}));
    shots.push({choice:true, q:m.choice.q, opts, pick:i=>{ const btn=document.createElement('button'); btn.dataset.act='crime-choose'; btn.dataset.i=i; btn.style.display='none'; document.body.appendChild(btn); btn.click(); btn.remove();
      const o=m.choice.opts[i]; const after=splitOut(o.out).map(t=>[here, null, t]); const fx=fxSub(o); if(fx) after.push({card:true, kicker:'Your choice', title:o.t, sub:`<p>${esc(fx)}</p>`, auto:2200}); return after.concat(nextCard()); }});
  } else nextCard().forEach(s=>shots.push(s));
  cutscene({shots, col:act.col, art:sceneArt(job.to, Math.min(1439,(job.dep||600)+(job.est||60)), job.ac), onEnd:()=>{ S.keepScroll=false; render(); }}); }
/* the result screen gets a button to watch it again */
const _csRes = resultView;
resultView = function(){ const h=_csRes(); const L=S.st&&S.st.last; if(!L||!L.job||!CRIME_IDS.has(L.job.story)) return h; return h.replace(/(<main[^>]*>)/, `$1<div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="btn sm ghost" data-act="after-replay">▶ Replay scene</button></div>`); };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="after-replay"]')) playAftermath(); });

(function(){ const s=document.createElement('style'); s.textContent=`
.cut-sub{margin-top:14px;font-size:clamp(15px,1.5vw,19px);color:#d6d0c4;max-width:820px}.cut-sub p{margin:6px 0}
.cut-nerve span,.cut-meters span{font-family:var(--f-mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--arc);margin-right:10px}
.cut-meters span{display:inline-block;border:1px solid color-mix(in srgb,var(--arc) 60%,transparent);border-radius:4px;padding:3px 9px;color:#ece6da}
.cut-q{font-style:normal!important;margin-bottom:22px!important}
.cut-opts{display:grid;gap:10px;max-width:760px}
.cut-opt{text-align:left;background:rgba(15,15,18,.85);border:1px solid #3a3a40;border-left:4px solid var(--arc);color:#ece6da;border-radius:10px;padding:14px 18px;font:inherit;font-size:18px;cursor:pointer;transition:.15s}
.cut-opt:hover:not([disabled]){background:rgba(40,32,18,.95);border-color:var(--arc);transform:translateX(4px)}
.cut-opt[disabled]{opacity:.45;cursor:not-allowed}.cut-opt small{display:block;font-size:12px;color:#8f897e;margin-top:4px}
.cut.choosing .cut-stage{bottom:auto;top:18vh}.cut.choosing,.cut.carding{cursor:default}.cut.choosing .cut-hint{visibility:hidden}
.cut-title{animation:cutIn .6s ease}@keyframes cutIn{from{opacity:0;transform:translateY(12px)}}`; document.head.appendChild(s); })();

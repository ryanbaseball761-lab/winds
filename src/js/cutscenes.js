/* ===================== CUTSCENES =====================
   One engine plays every scene: prologues, aftermaths, decisions, recaps and endings.
     cutscene({shots, col, art, onEnd, rain})
   A shot is one of:
     [place, speaker|null, text]                          a line (speaker is a CAST key) or narration
     {card:true, kicker, title, sub, auto}                a title card; `auto` ms moves on by itself
     {choice:true, q, opts:[{t, why}], pick:i=>shots}     a decision; pick() returns the shots that follow
   Keys: Space/Enter/→ next, ← back a line, Esc skip (never past a decision). */

function cutAuto(){ return !!uiP().autoCut; }   // "play cutscenes automatically" in Settings

/* When a scene opens: music, rain for stormy flights, text size. */
function cutStart(el, opt){
  try{ if(opt && opt.rain) ambStart('rain', 0.05); el.dataset.scene=''; }catch(_){}
  try{ MUSIC.play('tension'); }catch(_){}
  try{ el.dataset.size=uiP().cutSize||'m'; }catch(_){}
}
/* On every shot: the backdrop and ambience follow the place, act cards get a musical sting,
   and the progress dots, speaker role, hint and Skip label are kept up to date. */
function cutShot(s, el, i, opt){
  try{ if(Array.isArray(s) && s[1]) twSpeaker(s[1]); }catch(_){}   // the voice for this speaker
  try{ const sc=sceneFor(s, opt); const bgEl=el.querySelector('.cut-bg'); if(sc && el.dataset.scene!==sc){ el.dataset.scene=sc; bgEl.classList.add('swap'); setTimeout(()=>{ bgEl.innerHTML=SCENES[sc](); bgEl.classList.remove('swap'); }, 250); }
    if(Array.isArray(s)){ const p=String(s[0]||''); if(/phone|text message/i.test(p)) ambRing(); const wantJet=sc==='ramp'||sc==='hangar'||sc==='cockpit'; const hasJet=AMB.nodes.some(n=>n.kind==='jet'); if(wantJet&&!hasJet) ambStart('jet',0.018); if(!wantJet&&hasJet) ambStop('jet'); } }catch(_){}
  try{ if(s && s.card && /^Act \d/.test(s.kicker||'')){ const c=MUSIC.ctx(); if(c){ MUSIC.voice(c,{f:N(33),t:c.currentTime+0.05,d:3,type:'sawtooth',g:0.09,lp:180,att:0.01,rel:2.6}); [57,60,64,69].forEach(n=>MUSIC.voice(c,{f:N(n),t:c.currentTime+0.05,d:3.2,type:'triangle',g:0.03,att:0.04,rel:2.6})); } } }catch(_){}
  try{ let p=el.querySelector('.cut-prog'); if(!p){ p=document.createElement('div'); p.className='cut-prog'; el.appendChild(p); } const n=opt.shots.length; p.innerHTML=Array.from({length:Math.min(n,24)},(_,k)=>`<i class="${k<=i?'on':''}"></i>`).join(''); }catch(_){}
  try{ if(Array.isArray(s) && s[1] && CAST[s[1]]) setTimeout(()=>{ const w=el.querySelector('.cut-who b'); if(w && !w.dataset.r){ w.dataset.r=1; w.insertAdjacentHTML('afterend', `<small class="cut-role">${esc(CAST[s[1]].role||'')}</small>`); } }, 0); }catch(_){}
  try{ if(i>=2) el.classList.add('hint-off'); }catch(_){}   // the "Click or press Space" hint fades after two lines
  try{ const sk=el.querySelector('.cut-skip'); const L=(opt&&opt.shots)||[]; if(sk && L.length) sk.textContent = L.slice(i+1).some(x=>x&&x.choice) ? 'Skip to decision' : (s&&s.choice ? 'Skip' : 'Skip scene'); }catch(_){}
}
function cutEnd(el, opt){ try{ ambStop(); }catch(_){} try{ MUSIC.stop(); }catch(_){} }

function cutscene(opt){
  try{ const a=S.st&&S.st.active, L=S.st&&S.st.last; const wx=(a&&a.job.wx)||(L&&L.job&&L.job.wx)||{}; if(/wave|storm|shower|rain/i.test(String(wx.k||wx.id||wx.type||wx.name||''))) opt.rain=true; }catch(_){}   // rain behind scenes on stormy flights
  const shots=opt.shots.slice(); const col=opt.col||'#c8962a';
  const el=document.createElement('div'); el.className='cut'; el.style.setProperty('--arc', col);
  el.innerHTML=`<div class="cut-bg">${opt.art||''}</div><div class="cut-shade"></div><div class="cut-bar top"></div><div class="cut-bar bot"></div>
    <div class="cut-stage"></div><div class="cut-ctl"><span class="cut-hint">Click or press Space</span><button class="cut-skip">Skip</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on')); cutStart(el, opt);
  const stage=el.querySelector('.cut-stage'); let i=-1, typing=null, full='', txt=null, waiting=false, ended=false;
  const stopVoice=()=>{ try{ speechSynthesis.cancel(); }catch(_){} };
  const say=(k,t)=>{ if(!(typeof voiceOn==='function'&&voiceOn())||!window.speechSynthesis) return; const v=PRO_VOICE[k]||[false,0.95,0.9]; try{ stopVoice(); const u=new SpeechSynthesisUtterance(String(t).replace(/"/g,'')); const vv=pickVoice(v[0], k==='castillo'||k==='medina'?1:0); if(vv) u.voice=vv; u.rate=v[1]; u.pitch=v[2]; u.volume=voiceVol(); speechSynthesis.speak(u); }catch(_){} };
  const end=()=>{ if(ended) return; ended=true; cutEnd(el, opt); clearInterval(typing); stopVoice(); document.removeEventListener('keydown', key, true); el.classList.remove('on'); setTimeout(()=>{ el.remove(); opt.onEnd&&opt.onEnd(); }, 600); };
  const bg=()=>{ el.querySelector('.cut-bg').style.transform=`scale(${1.06+Math.max(0,i)*0.025}) translate(${(i%2?-1:1)*1.2}%, ${Math.max(0,i)*0.35}%)`; };
  const show=()=>{ i++; waiting=false; el.classList.remove('choosing','carding'); if(i>=shots.length){ end(); return; } const s=shots[i]; bg(); cutShot(s, el, i, opt);
    if(s.card){ el.classList.add('carding'); stage.innerHTML=`<div class="cut-title"><p>${esc(s.kicker||'')}</p><h1>${esc(s.title||'')}</h1>${s.sub?`<div class="cut-sub">${s.sub}</div>`:''}</div>`; txt=null; full=''; try{ whoosh&&whoosh(); }catch(_){} if(s.auto) setTimeout(()=>{ if(shots[i]===s) show(); }, s.auto); return; }
    if(s.choice){ el.classList.add('choosing'); waiting=true; stage.innerHTML=`<p class="cut-place">Your call</p><p class="cut-text cut-q">${esc(s.q)}</p><div class="cut-opts">${s.opts.map((o,k)=>`<button class="cut-opt" data-k="${k}" ${o.why?'disabled':''}>${esc(o.t)}${o.why?`<small>${esc(o.why)}</small>`:''}</button>`).join('')}</div>`; txt=null; full=''; return; }
    const [pl,k,t]=s; stage.innerHTML=`<p class="cut-place">${esc(pl||'')}</p><div class="cut-line in">${k&&CAST[k]?`<div class="cut-who">${avatar(k)}<b>${esc(CAST[k].n)}</b></div>`:''}<p class="cut-text ${k?'':'nar'}"></p></div>`;
    txt=stage.querySelector('.cut-text'); full=k?`“${t}”`:t; let n=0; clearInterval(typing); const me=s; typing=setInterval(()=>{ n+=2; txt.textContent=full.slice(0,n); if(n>=full.length){ clearInterval(typing); if(cutAuto()){ clearTimeout(el._auto); el._auto=setTimeout(()=>{ if(shots[i]===me && !waiting) show(); }, 1800+full.length*28); } } }, 22); if(k) say(k,t); };
  const next=()=>{ if(waiting) return; if(txt && txt.textContent.length<full.length){ clearInterval(typing); txt.textContent=full; return; } show(); };
  const key=e=>{ if(e.key===' '||e.key==='Enter'||e.key==='ArrowRight'){ e.preventDefault(); e.stopPropagation(); next(); } else if(e.key==='ArrowLeft'){ e.preventDefault(); e.stopPropagation(); if(!waiting){ let j=i-1; while(j>=0 && shots[j].card) j--; if(j>=0 && !shots.slice(j,i+1).some(x=>x.choice)){ clearInterval(typing); i=j-1; show(); } } } else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); skip(); } };
  /* Skip jumps to the next decision (decisions can't be skipped), or to the end */
  const skip=()=>{ clearInterval(typing); const j=shots.findIndex((s,k)=>k>i && s.choice); if(shots[i]&&shots[i].choice) return; if(j>=0){ i=j-1; show(); } else end(); };
  document.addEventListener('keydown', key, true);
  el.addEventListener('click', e=>{ if(e.target.closest('.cut-skip')){ skip(); return; } const b=e.target.closest('.cut-opt'); if(b){ if(b.disabled) return; const s=shots[i]; const more=s.pick(Number(b.dataset.k))||[]; shots.splice(i+1, 0, ...more); waiting=false; show(); return; } next(); });
  setTimeout(show, 450); return el;
}

/* The art behind a scene. */
function sceneArt(code, dep, ac){ try{ return islandArt(code, dep, 1600, 900, ac); }catch(_){ return ''; } }

/* ---------- a chapter's scenes ---------- */

/* Which briefing paragraphs are read out after each prologue (by index). The rest repeat what the
   scene already showed, or would give away something that happens in flight. Chapters not listed read all. */
const PRO_BRIEF = { CW1:[1], CR2:[1], CR3:[], CR4:[0,1], CR5:[0,1], CR6:[], CR7:[], CR8:[0,1], CR9:[], CR10:[0], CRM:[0], CR11:[], CR12:[0,1], CR13:[1], CR14:[0,1], CR15:[0], CRB:[], CR16:[], CRT:[0], CR17:[1] };

/* The lines of a chapter's prologue: an echo of your last mid-flight choice, the scripted prologue
   (which can change with earlier choices), then the briefing as narration. */
function proFor(id){
  const scripted = (PRO_DYN[id] && PRO_DYN[id](crime(S.st).flags)) || PRO[id];
  let lines = scripted;
  const m=CRIME.find(x=>x.id===id);
  if(m){ const mm=(typeof dynM==='function'&&S.st)?dynM(S.st,m):m; const here=AP[m.from]?`${AP[m.from].n}`:''; const keep=PRO_BRIEF[id]; const brief=(mm.brief||[]).filter((t,i)=>!keep || keep.includes(i)); lines=(scripted||[]).concat(brief.map(t=>[here, null, t])); }
  lines = lines||[];
  const e=crime().echo; return (e && e.from!==id) ? [[`Last time`, null, e.text]].concat(lines) : lines;
}

/* Before a chapter: the act card (first chapter of an act), the prologue, then the chapter card. */
function playPrologue(m, done){
  if(uiP().skipCuts){ done(); return; }
  const MC=mainChapters(); const act=CRIME_ACTS.find(a=>a.arc===m.arc)||CRIME_ACTS[0]; const ai=CRIME_ACTS.indexOf(act); const shots=[];
  const firstOfAct = MC.filter(x=>x.arc===m.arc)[0]===m;
  if(firstOfAct) shots.push({card:true, kicker:`Act ${ai+1} of ${CRIME_ACTS.length}`, title:act.arc, sub:`<p>${esc(act.tag)}</p><p class="cut-nerve"><span>Your nerve</span> ${esc(act.nerve)}</p>`});
  (proFor(m.id)||[]).forEach(s=>shots.push(s));
  shots.push({card:true, kicker:`Chapter ${MC.indexOf(m)+1} of ${MC.length}`, title:m.title, sub:`<p>${esc((CH_GOAL[m.id]||[])[0]||'')}</p>`, auto:2600});
  cutscene({shots, col:act.col, art:sceneArt(m.from, m.dep, m.ac[0]), onEnd:done});
}

/* After a chapter: the grade, what happened, your decision if the chapter has one, and what's next. */
function playAftermath(){
  setTimeout(()=>{ try{ window.scrollTo(0,0); }catch(_){} }, 400);   // the result screen starts at the top afterwards
  if(uiP().skipCuts) return;
  const st=S.st, L=st&&st.last; if(!L||!L.job) return; const job=L.job, m=CRIME.find(x=>x.id===job.story); if(!m) return; const c=crime(st); const MC=mainChapters(); const act=CRIME_ACTS.find(a=>a.arc===m.arc)||CRIME_ACTS[0];
  /* a failed chapter: a phone call, then try again */
  if(L.failed){ const boss=c.on?'castillo':'dez'; cutscene({col:act.col, art:SCENES.ramp(), shots:[{card:true,kicker:m.title,title:'It went wrong',auto:1800},[`Phone call`, boss, boss==='castillo'?`I don't pay for wreckage. Get yourself together and do it again. Properly.`:`Rookie, what happened out there? Breathe. We'll try it again.`],{card:true,kicker:'Chapter failed',title:'Try again',sub:`<p>Power −5, Heat +8. Play the chapter again from the Main story page.</p>`}], onEnd:()=>render()}); return; }
  const here=AP[job.to]?AP[job.to].n:''; const shots=[];
  shots.push({card:true, kicker:`${m.title} · ${here}`, title:`Grade ${L.res.grade}`, sub:`<p>${esc(L.out.pay?`You earned ${money(L.out.pay)}`:'')}</p>`, auto:1800});
  splitOut(L.out.story).forEach(t=>shots.push([here, null, t]));
  const nextCard=()=>{ const nx=MC.find(x=>!st.story.done[x.id]); const cc=crime(st); const out=[];
    if(cc.ending){ epilogue(st).forEach(t=>out.push(['Years later', null, t])); out.push({card:true, kicker:'The end', title:{kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'}[cc.ending]||'The end', sub:`<p>Thank you for playing the main story. Side jobs and the Starling story are still out there.</p>`}); return out; }
    if(m.id==='CR4' && st.jetPaid) out.push([`Text message`, 'castillo', `Your jet training is paid for. ${money(st.jetPaid)} is in your account. Book the checkride. Don't make me wait.`]);
    out.push({card:true, kicker:'Chapter complete', title:m.title, sub:`${cc.on?`<p class="cut-meters"><span>Power ${cc.power}</span><span>Heat ${cc.heat}</span><span>${esc(crimeRank(cc))}</span></p>`:''}${nx?`<p>Next: <b>${esc(nx.title)}</b> · ${esc(nx.hook||'')}</p>`:''}`}); return out; };
  if(m.choice && c.choice[m.id]==null && !L.res.crash){
    const opts=m.choice.opts.map(o=>({t:o.t, why: (m.id==='CR17' && o.ending && typeof ENDING_REQ!=='undefined') ? ENDING_REQ[o.ending](c) : null}));
    shots.push({choice:true, q:m.choice.q, opts, pick:i=>{ const btn=document.createElement('button'); btn.dataset.act='crime-choose'; btn.dataset.i=i; btn.style.display='none'; document.body.appendChild(btn); btn.click(); btn.remove();
      const o=m.choice.opts[i]; const after=splitOut(o.out).map(t=>[here, null, t]); const fx=fxSub(o); if(fx) after.push({card:true, kicker:'Your choice', title:o.t, sub:`<p>${esc(fx)}</p>`, auto:2200}); return after.concat(nextCard()); }});
  } else nextCard().forEach(s=>shots.push(s));
  cutscene({shots, col:act.col, art:sceneArt(job.to, Math.min(1439,(job.dep||600)+(job.est||60)), job.ac), onEnd:()=>{ S.keepScroll=false; render(); }});
}

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

/* Never show the same scene twice in a row by accident: if the same scene is already on screen, or finished in the
   last 20 seconds, a second call is ignored (replay buttons pass opt.replay to force it). A different scene that
   arrives while one is playing waits for it to finish instead of stacking on top. */
const CUT_RECENT = {};
function cutSig(shots){ return (shots||[]).slice(0,3).map(s=>Array.isArray(s)?s[2]:s&&s.title||'').join('|').slice(0,200); }
function cutscene(opt){
  const sig=cutSig(opt.shots);
  const forced=opt.replay||S._cutReplay; S._cutReplay=false;
  if(!forced){ if([...document.querySelectorAll('.cut')].some(c=>c.dataset.sig===sig)) return; if(CUT_RECENT[sig] && Date.now()-CUT_RECENT[sig]<20000) return; }
  if(document.querySelector('.cut')){ const tries=(opt._wait||0)+1; if(tries<120){ setTimeout(()=>cutscene(Object.assign(opt,{_wait:tries})), 500); } return; }
  CUT_RECENT[sig]=Date.now();
  try{ const a=S.st&&S.st.active, L=S.st&&S.st.last; const wx=(a&&a.job.wx)||(L&&L.job&&L.job.wx)||{}; if(/wave|storm|shower|rain/i.test(String(wx.k||wx.id||wx.type||wx.name||''))) opt.rain=true; }catch(_){}   // rain behind scenes on stormy flights
  const shots=opt.shots.slice(); const col=opt.col||'#c8962a';
  const el=document.createElement('div'); el.className='cut'; el.dataset.sig=sig; el.style.setProperty('--arc', col);
  el.innerHTML=`<div class="cut-bg">${opt.art||''}</div><div class="cut-shade"></div><div class="cut-bar top"></div><div class="cut-bar bot"></div>
    <div class="cut-stage"></div><div class="cut-ctl"><span class="cut-hint">Click or press Space</span><button class="cut-skip">Skip</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on')); cutStart(el, opt);
  const stage=el.querySelector('.cut-stage'); let i=-1, typing=null, full='', txt=null, waiting=false, ended=false;
  const stopVoice=()=>{ try{ speechSynthesis.cancel(); }catch(_){} };
  const say=(k,t)=>{ if(!(typeof voiceOn==='function'&&voiceOn())||!window.speechSynthesis) return; const v=PRO_VOICE[k]||[false,0.95,0.9]; try{ stopVoice(); const u=new SpeechSynthesisUtterance(String(t).replace(/"/g,'')); const vv=pickVoice(v[0], k==='castillo'||k==='medina'?1:0); if(vv) u.voice=vv; u.rate=v[1]; u.pitch=v[2]; u.volume=voiceVol(); speechSynthesis.speak(u); }catch(_){} };
  const end=()=>{ if(ended) return; ended=true; CUT_RECENT[sig]=Date.now(); cutEnd(el, opt); clearInterval(typing); stopVoice(); document.removeEventListener('keydown', key, true); el.classList.remove('on'); setTimeout(()=>{ el.remove(); opt.onEnd&&opt.onEnd(); }, 600); };
  const bg=()=>{ el.querySelector('.cut-bg').style.transform=`scale(${1.06+Math.max(0,i)*0.025}) translate(${(i%2?-1:1)*1.2}%, ${Math.max(0,i)*0.35}%)`; };
  const show=()=>{ i++; waiting=false; el.classList.remove('choosing','carding'); if(i>=shots.length){ end(); return; } const s=shots[i]; bg(); cutShot(s, el, i, opt);
    if(s.card){ el.classList.add('carding'); stage.innerHTML=`<div class="cut-title"><p>${esc(s.kicker||'')}</p><h1>${esc(s.title||'')}</h1>${s.sub?`<div class="cut-sub">${s.sub}</div>`:''}</div>`; txt=null; full=''; try{ whoosh&&whoosh(); }catch(_){} if(s.auto) setTimeout(()=>{ if(shots[i]===s) show(); }, s.auto); return; }
    if(s.choice){ el.classList.add('choosing'); waiting=true; stage.innerHTML=`<p class="cut-place">Your call</p><p class="cut-text cut-q">${esc(s.q)}</p><div class="cut-opts">${s.opts.map((o,k)=>`<button class="cut-opt" data-k="${k}" ${o.why?'disabled':''}>${esc(o.t)}${o.why?`<small>${esc(o.why)}</small>`:''}</button>`).join('')}</div>`; txt=null; full=''; return; }
    const [pl,k,t]=s; stage.innerHTML=`<p class="cut-place">${esc(pl||'')}</p><div class="cut-line in">${k&&CAST[k]?`<div class="cut-who">${avatar(k)}<b>${esc(CAST[k].n)}</b></div>`:''}<p class="cut-text ${k?'':'nar'}"></p></div>`;
    txt=stage.querySelector('.cut-text'); full=k?`“${t}”`:t; let n=0; clearInterval(typing); const me=s, box=txt; typing=setInterval(()=>{ if(!box || !box.isConnected){ clearInterval(typing); return; } n+=2; box.textContent=full.slice(0,n); if(n>=full.length){ clearInterval(typing); if(cutAuto()){ clearTimeout(el._auto); el._auto=setTimeout(()=>{ if(shots[i]===me && !waiting) show(); }, 1800+full.length*28); } } }, 22); if(k) say(k,t); };
  const next=()=>{ if(waiting) return; if(txt && txt.textContent.length<full.length){ clearInterval(typing); txt.textContent=full; return; } show(); };
  const key=e=>{ if(e.key===' '||e.key==='Enter'||e.key==='ArrowRight'){ e.preventDefault(); e.stopPropagation(); next(); } else if(e.key==='ArrowLeft'){ e.preventDefault(); e.stopPropagation(); if(!waiting){ let j=i-1; while(j>=0 && shots[j].card) j--; if(j>=0 && !shots.slice(j,i+1).some(x=>x.choice)){ clearInterval(typing); i=j-1; show(); } } } else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); skip(); } };
  /* Skip jumps to the next decision (decisions can't be skipped), or to the end */
  const skip=()=>{ clearInterval(typing); const j=shots.findIndex((s,k)=>k>i && s.choice); if(shots[i]&&shots[i].choice) return; if(j>=0){ i=j-1; show(); } else end(); };
  document.addEventListener('keydown', key, true);
  el.addEventListener('click', e=>{ if(e.target.closest('.cut-skip')){ skip(); return; } const b=e.target.closest('.cut-opt'); if(b){ if(b.disabled) return; const s=shots[i]; if(!s || typeof s.pick!=="function") return; b.disabled=true; const more=s.pick(Number(b.dataset.k))||[]; shots.splice(i+1, 0, ...more); waiting=false; show(); return; } next(); });
  setTimeout(show, 450); return el;
}

/* The art behind a scene. */
/* the opening background: a painting when they're loaded (the one the first line calls for, else `fallback`),
   otherwise the drawn islands */
function paintedArt(shots, fallback, code, dep, ac){ if(typeof ART!=='undefined' && ART.scenes && ART.scenes[fallback]){ const first=(shots||[]).find(x=>Array.isArray(x)); const k=(first&&sceneFor(first))||fallback; if(k==='ramp') return (dep>=420 && dep<=1110) ? dayRampArt(ac, dep) : nightRampArt(ac); return SCENES[k](); }   /* daylight ramps show the day scene with your plane */ return sceneArt(code, dep, ac); }
(function(){ const c=document.createElement('style'); c.textContent='.cut-bg:has(.dayramp){filter:saturate(.75) brightness(.78) contrast(1.05)}'; document.head.appendChild(c); })();
/* a daytime ramp in the paintings' flat style, with the plane you actually flew parked on it */
function dayRampArt(acId, min){ const h=((min||600)/60)%24, late=h>=16, early=h<8.5;
  const sky = early ? ['#3b4a63','#c99a6b'] : late ? ['#3c3f5c','#d0895a'] : ['#41627a','#a9b9b8'];
  const sun = early||late ? '#f1c27d' : '#efe6c8', sx = early ? 300 : late ? 1320 : 1180, sy = early||late ? 330 : 150;
  const palm=x=>`<g transform="translate(${x} 560)" fill="#0b0f12"><path d="M0 0 C6 -60 14 -110 10 -170 L18 -170 C22 -110 16 -50 12 0Z"/><path d="M14 -170 C-20 -196 -60 -184 -78 -156 C-44 -176 -16 -176 14 -164Z"/><path d="M14 -170 C46 -202 92 -190 108 -158 C76 -180 44 -178 14 -164Z"/><path d="M14 -172 C0 -214 -34 -224 -58 -214 C-26 -212 -4 -200 14 -170Z"/><path d="M14 -172 C34 -218 70 -226 92 -212 C60 -210 36 -198 14 -170Z"/></g>`;
  return `<svg class="dayramp" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="dr1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient><linearGradient id="dr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b6c69"/><stop offset=".55" stop-color="#45474a"/><stop offset="1" stop-color="#1c1e20"/></linearGradient><radialGradient id="dr3" cx="${sx/1600}" cy="${sy/900}" r=".5"><stop offset="0" stop-color="${sun}" stop-opacity=".35"/><stop offset="1" stop-color="${sun}" stop-opacity="0"/></radialGradient></defs>
  <rect width="1600" height="900" fill="url(#dr1)"/><rect width="1600" height="900" fill="url(#dr3)"/><circle cx="${sx}" cy="${sy}" r="44" fill="${sun}" opacity=".9"/>
  <path d="M0 520 Q180 430 360 470 Q520 380 700 455 Q820 420 960 500 L960 540 L0 540Z" fill="#243039" opacity=".85"/><path d="M1000 520 Q1180 460 1330 490 Q1460 450 1600 480 L1600 540 L1000 540Z" fill="#2a3640" opacity=".7"/>
  <rect y="530" width="1600" height="40" fill="#1d3a44" opacity=".9"/>
  <path d="M1080 560 L1080 450 L1150 420 L1400 420 L1470 450 L1470 560Z" fill="#14181b"/><rect x="1150" y="470" width="250" height="90" fill="#0d1012"/><g fill="#d9a54a" opacity=".55"><rect x="1100" y="470" width="30" height="14"/><rect x="1420" y="470" width="30" height="14"/></g>
  <rect y="560" width="1600" height="340" fill="url(#dr2)"/><g stroke="#c9a54a" stroke-opacity=".5" stroke-width="6" stroke-dasharray="60 50"><line x1="0" y1="760" x2="1600" y2="700"/></g><line x1="0" y1="610" x2="1600" y2="600" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
  ${palm(140)}${palm(260)}${palm(1530)}
  <ellipse cx="790" cy="${470+6.2*30}" rx="330" ry="14" fill="#000" opacity=".45"/><g transform="translate(420 470) scale(6.2)">${acSvgInner(acId,'#0c0e10')}</g>
  <g fill="#0a0c0e"><rect x="1210" y="650" width="70" height="40" rx="4"/><circle cx="1225" cy="694" r="10"/><circle cx="1266" cy="694" r="10"/><rect x="1240" y="630" width="30" height="22"/></g></svg>`; }
function sceneArt(code, dep, ac){ try{ return islandArt(code, dep, 1600, 900, ac); }catch(_){ return ''; } }

/* ---------- a chapter's scenes ---------- */

/* What each after-flight choice adds to the chapter's recap, by option. */
const CHOICE_RECAP = {
  CR2:['You handed the money over untouched.','You kept a $10,000 bundle for yourself.'],
  CR4:['You took his $10,000 welcome envelope.','You asked for a 5% cut instead of an envelope.'],
  CR6:['You called an ambulance for the boy, against Castillo\'s orders.','You put them all in the van, the boy too.'],
  CR9:['You took Reyes\'s deal. You report to the DEA now.','You said nothing, and Castillo\'s lawyers got you out.'],
  CRM:['You turned Medina down.','You took Medina\'s $50,000 and kept both doors open.'],
  CR11:['You let Tico run.','You handed Tico over, as ordered.'],
  CR12:['You paid for Dez\'s defense, and he\'s out on bail.','You let Dez take the fall. He got eight years.'],
  CR13:['Mari is your partner now.','Mari walked away and left you Coral Wing.'],
  CR14:['You kept the ledgers.','You gave the ledgers to Reyes.'],
  CR15:['You gave Castillo 30% of the airline.','You told Castillo the airline is yours.'],
  CRB:['You went to war with Castillo.','You smiled, said nothing, and started writing everything down.'],
  CRT:['You shook Medina\'s hand.','You handed Medina\'s routes to the DEA.'] };
/* A finished chapter's recap, with what you chose. */
function recapOf(st, m){ if(!m) return ''; const i=crime(st).choice[m.id]; const add=(i!=null && CHOICE_RECAP[m.id]) ? CHOICE_RECAP[m.id][i] : ''; return [m.recap||'', add||''].filter(Boolean).join(' '); }
/* The chapter before this one, in story order. */
function prevChapter(m){ const MC=mainChapters(); const i=MC.indexOf(m); return i>0 ? MC[i-1] : null; }

/* Which briefing paragraphs are read out after each prologue (by index). The rest repeat what the
   scene already showed, or would give away something that happens in flight. Chapters not listed read all. */
const PRO_BRIEF = { CW1:[1], CR2:[1], CR3:[], CR4:[0], CR5:[0], CR6:[], CR7:[], CR8:[0], CR9:[], CR10:[0], CRM:[0], CR11:[], CR12:[0], CR13:[], CR14:[0], CR15:[0], CRB:[], CR16:[], CRT:[0], CR17:[1] };

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
  if(firstOfAct) shots.push({card:true, kicker:`Act ${ai+1} of ${CRIME_ACTS.length}`, title:act.arc, sub:`<p>${esc(act.tag)}</p><p class="cut-nerve-line">${esc(act.nerve)}</p>`});
  (proFor(m.id)||[]).forEach(s=>shots.push(s));
  shots.push({card:true, kicker:`Chapter ${MC.indexOf(m)+1} of ${MC.length}`, title:m.title, sub:`<p>${esc((CH_GOAL[m.id]||[])[0]||'')}</p>`, auto:2600});
  cutscene({shots, col:act.col, art:paintedArt(shots,'ramp',m.from, m.dep, m.ac[0]), onEnd:done});
}

/* After a chapter: the grade, what happened, your decision if the chapter has one, and what's next. */
function playAftermath(){
  setTimeout(()=>{ try{ window.scrollTo(0,0); }catch(_){} }, 400);   // the result screen starts at the top afterwards
  if(uiP().skipCuts) return;
  const st=S.st, L=st&&st.last; if(!L||!L.job) return; const job=L.job, m=CRIME.find(x=>x.id===job.story); if(!m) return; const c=crime(st); const MC=mainChapters(); const act=CRIME_ACTS.find(a=>a.arc===m.arc)||CRIME_ACTS[0];
  /* a failed chapter: a phone call, then try again */
  if(L.failed){ const boss=c.on?'castillo':'dez'; cutscene({col:act.col, art:SCENES.ramp(), shots:[{card:true,kicker:m.title,title:'It went wrong',auto:1800},[`Phone call`, boss, boss==='castillo'?`I don't pay for wreckage. Pull yourself together and do it again. Properly this time.`:`Rookie, what happened out there? Breathe. We'll try it again.`],{card:true,kicker:'Chapter failed',title:'Try again',sub:`<p>Power −5, Heat +8. Play the chapter again from the Main story page.</p>`}], onEnd:()=>render()}); return; }
  const here=AP[job.to]?AP[job.to].n:''; const shots=[];
  shots.push({card:true, kicker:`${m.title} · ${here}`, title:`Grade ${L.res.grade}`, sub:`<p>${esc(L.out.pay?`You earned ${money(L.out.pay)}`:'')}</p>`, auto:1800});
  splitOut(L.out.story).forEach(t=>shots.push([here, null, t]));
  const nextCard=()=>{ const nx=MC.find(x=>!st.story.done[x.id]); const cc=crime(st); const out=[];
    if(cc.ending){ epilogue(st).forEach(t=>out.push(['Years later', null, t])); out.push({card:true, kicker:'The end', title:{kingpin:'Kingpin',witness:'Witness',ghost:'Ghost',walk:'Walk Away',home:'Coming Home'}[cc.ending]||'The end', sub:`<p>Thank you for playing the main story. Side jobs and the Starling story are still out there.</p>`}); return out; }
    if(m.id==='CR4' && st.jetPaid) out.push([`Text message`, 'castillo', `Your jet training is taken care of. ${money(st.jetPaid)} is in your account. Book the checkride. I don't like waiting.`]);
    if(m.id==='CR4') out.push({card:true, kicker:'New: you work for Castillo', title:'Power, Heat and dirty cash', sub:`<p><b>Power</b> grows with every chapter and hard choice, and unlocks rewards.</p><p><b>Heat</b> is how close the law is. Network runs raise it, legit jobs cool it. At 60 customs starts searching your plane; at 80 the feds are watching and the story waits until you cool off. It's always shown at the top of the screen.</p><p><b>Dirty cash</b> from network runs has to be laundered on the Money page before you can spend it.</p>`});
    out.push({card:true, kicker:'Chapter complete', title:m.title, sub:`${cc.on?`<p class="cut-meters"><span>Power ${cc.power}</span><span>Heat ${cc.heat}</span><span>${esc(crimeRank(cc))}</span></p>`:''}${nx?`<p>Next: <b>${esc(nx.title)}</b> · ${esc(nx.hook||'')}</p>`:''}`}); return out; };
  if(m.choice && c.choice[m.id]==null && !L.res.crash){
    const opts=m.choice.opts.map(o=>({t:o.t, why: (m.id==='CR17' && o.ending && typeof ENDING_REQ!=='undefined') ? ENDING_REQ[o.ending](c) : null}));
    shots.push({choice:true, q:m.choice.q, opts, pick:i=>{ const btn=document.createElement('button'); btn.dataset.act='crime-choose'; btn.dataset.i=i; btn.style.display='none'; document.body.appendChild(btn); btn.click(); btn.remove();
      const o=m.choice.opts[i]; const after=splitOut(o.out).map(t=>[here, null, t]); const fx=fxSub(o); const rs=(typeof reactShot==='function')?reactShot(m,i,null):null; if(rs) after.push(rs); if(fx) after.push({card:true, kicker:'Your choice', title:o.t, sub:`<p class="small">${esc(fx)}</p>`, auto:1600}); return after.concat(nextCard()); }});
  } else nextCard().forEach(s=>shots.push(s));
  cutscene({shots, col:act.col, art:(()=>{ const arr=Math.min(1439,(job.dep||600)+(job.est||60)); return (arr>=420 && arr<=1110) ? dayRampArt(job.ac, arr) : paintedArt([], 'cockpit', job.to, arr, job.ac); })(), onEnd:()=>{ S.keepScroll=false; render(); }});
}

(function(){ const c=document.createElement('style'); c.textContent='.cut-nerve-line{font-style:italic;opacity:.75;margin-top:10px}'; document.head.appendChild(c); })();

/* a Boeing 747-8 in side profile (nose left, 400×120): the upper-deck hump, four engines, real gear */
function jumboSvg(fill, lit){ return `<g fill="${fill}">
  <path d="M6 74 C8 64 18 54 34 48 C44 40 58 35 76 34 L128 34 C142 34 152 40 166 48 L330 49 C346 49 358 52 372 56 L392 60 L392 64 L372 68 C352 74 330 82 300 86 L44 86 C24 86 10 82 6 74 Z"/>
  <path d="M316 50 L348 6 L368 6 L376 52 Z"/><path d="M336 62 L394 56 L396 62 L340 68 Z"/>
  <path d="M138 80 L222 78 L274 98 L262 101 L190 90 L140 88 Z"/>
  <rect x="146" y="86" width="40" height="14" rx="7"/><rect x="160" y="82" width="6" height="6"/><rect x="200" y="91" width="40" height="14" rx="7"/><rect x="214" y="86" width="6" height="7"/>
  <rect x="52" y="84" width="4" height="22"/><circle cx="54" cy="110" r="6"/>
  <rect x="178" y="84" width="5" height="22"/><circle cx="174" cy="110" r="7"/><circle cx="188" cy="110" r="7"/>
  <rect x="212" y="84" width="5" height="22"/><circle cx="208" cy="110" r="7"/><circle cx="222" cy="110" r="7"/></g>
  ${lit?`<g fill="${lit}" opacity=".8"><path d="M22 52 L34 49 L36 53 L24 56 Z"/>${Array.from({length:9},(_,i)=>`<rect x="${62+i*8}" y="41" width="3" height="4" rx="1"/>`).join('')}</g>`:''}`; }

/* the night ramp in the paintings' style: rain, floodlights, wet concrete, the plane you flew (a real 747 for the jumbo) */
function nightRampArt(acId, blue){ const jumbo = acId==='B748';
  const rain=Array.from({length:70},(_,i)=>{ const x=(i*97)%1600, y=(i*53)%560; return `<line x1="${x}" y1="${y}" x2="${x-14}" y2="${y+46}"/>`; }).join('');
  const mast=(x,dir)=>`<rect x="${x-3}" y="300" width="6" height="260" fill="#0a0c0e"/><rect x="${x-18}" y="292" width="36" height="10" fill="#d8c48a"/><path d="M${x-14} 302 L${x+dir*520} 760 L${x+dir*120} 780 Z" fill="#f1e2b0" opacity=".09"/>`;
  const plane = jumbo ? `<g transform="translate(330 330) scale(2.6)">${jumboSvg('#07090b','#e9c27a')}</g><ellipse cx="850" cy="622" rx="520" ry="16" fill="#000" opacity=".5"/>`
    : `<g transform="translate(470 452) scale(5.6)">${acSvgInner(acId,'#07090b')}</g><ellipse cx="800" cy="${452+5.6*30}" rx="300" ry="12" fill="#000" opacity=".5"/>`;
  const person=(x,h)=>`<g fill="#050607" transform="translate(${x} ${640-h})"><circle cx="0" cy="8" r="7"/><path d="M-10 18 Q0 13 10 18 L12 ${h*0.62} L7 ${h*0.62} L6 ${h} L1 ${h} L0 ${h*0.66} L-1 ${h} L-6 ${h} L-7 ${h*0.62} L-12 ${h*0.62} Z"/></g>`;
  return `<svg class="nightramp" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="nr1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1420"/><stop offset=".55" stop-color="#26354a"/><stop offset="1" stop-color="#3a4a60"/></linearGradient><linearGradient id="nr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4048"/><stop offset="1" stop-color="#111316"/></linearGradient><radialGradient id="nr3" cx=".82" cy=".7" r=".35"><stop offset="0" stop-color="#3a6cd6" stop-opacity="${blue?'.55':'0'}"/><stop offset="1" stop-color="#3a6cd6" stop-opacity="0"/></radialGradient></defs>
  <rect width="1600" height="900" fill="url(#nr1)"/>
  <g fill="#c89a4a">${Array.from({length:34},(_,i)=>`<circle cx="${20+i*47}" cy="548" r="2.4" opacity=".7"/>`).join('')}</g>
  <path d="M0 520 L260 520 L260 470 L420 470 L420 520 L1600 520 L1600 560 L0 560 Z" fill="#161b22"/>
  <rect y="556" width="1600" height="344" fill="url(#nr2)"/>
  ${mast(200,1)}${mast(1420,-1)}
  ${plane}
  <g fill="#f1e2b0" opacity=".08"><path d="M300 640 L1300 640 L1500 900 L100 900 Z"/></g>
  ${person(1160,62)}${person(1196,66)}${person(1228,60)}
  <rect width="1600" height="900" fill="url(#nr3)"/>
  <g stroke="#9fb2c8" stroke-opacity=".22" stroke-width="2">${rain}</g></svg>`; }
(function(){ const c=document.createElement('style'); c.textContent='.cut-bg:has(.nightramp){filter:brightness(.95) saturate(.9)}'; document.head.appendChild(c); })();
/* the old ramp painting (a jet that read as a bomber) is retired: every ramp scene is the drawn one, with the plane you're flying */
(function(){ if(typeof SCENES==='undefined') return; SCENES.ramp=()=>{ const st=S.st, j=st&&((st.active&&st.active.job)||(st.last&&st.last.job)); const ac=(j&&j.ac)||'CJ4'; const t=j?Math.min(1439,(j.dep||600)+(j.est||0)):1200;
  return (t>=420 && t<=1110 && typeof dayRampArt==='function') ? dayRampArt(ac,t) : nightRampArt(ac); }; })();

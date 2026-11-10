/* ===================== LOOK & FEEL: living sky, weather, splash, motion, reveals, toasts, sound ===================== */
function calmMotion(){ return document.documentElement.classList.contains('rm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

/* 1 + 2. living sky: the sun tracks the game clock, stars at night, drifting clouds and weather you can see */
const STARS = (()=>{ let s=[]; let seed=7; const r=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; }; for(let i=0;i<70;i++) s.push(`${Math.round(r()*1400)}px ${Math.round(r()*200)}px 0 ${r()<.15?1:0}px rgba(255,255,255,${(.35+r()*.6).toFixed(2)})`); return s.join(','); })();
function skyPos(min){ const m=((min%1440)+1440)%1440; const rise=360, set=1110; if(m<rise||m>set){ const nm=(m<rise?m+1440:m)-set; const f=nm/(1440-(set-rise)); return {night:true, x:42+34*f, y:62-Math.sin(Math.PI*f)*42}; } const f=(m-rise)/(set-rise); return {night:false, x:40+38*f, y:74-Math.sin(Math.PI*f)*52}; }
function wxFx(key){ const rain=['showers','tstorm','wave','squall'].includes(key); const clouds = key==='calm' ? 1 : ['wave','tstorm','north','showers'].includes(key) ? 5 : 3;
  let h=`<div class="fx-clouds c${clouds}" aria-hidden="true">${Array.from({length:clouds},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`;
  if(rain) h+=`<div class="fx-rain ${key==='tstorm'||key==='squall'?'heavy':''}" aria-hidden="true"></div>`;
  if(key==='dust') h+=`<div class="fx-haze" aria-hidden="true"></div>`;
  return h; }
const _flHero = todayHero;
todayHero = function(st){ let h=_flHero(st); const P=skyPos(st.clock); const wx=genLocWx(st);
  h=h.replace('<section class="today ', `<section style="--sx:${P.x.toFixed(1)}%;--sy:${P.y.toFixed(1)}%" class="today live-sky wx-${esc(wx.key||'')} ${P.night?'is-night':''} `);
  return h.replace('<div class="sun" aria-hidden="true"></div>', `<div class="stars" aria-hidden="true" style="box-shadow:${STARS}"></div><div class="sun" aria-hidden="true"></div>${wxFx(wx.key)}`); };

/* 3. splash on launch */
(function splash(){ try{ const d=document.createElement('div'); d.id='tw-splash'; d.setAttribute('aria-hidden','true');
  d.innerHTML=`<div class="sp-in">${typeof LOGO!=='undefined'?LOGO:''}<b>Trade Winds</b><span>Caribbean career for MSFS</span><div class="sp-route"><i></i><em>✈</em></div></div>`;
  document.body.appendChild(d); const t = calmMotion()?250:1300; setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(), 600); }, t); }catch(_){} })();

/* 4. view transitions */
S._lastView = null;

/* 5 + 6 + 7. result reveal: animated ring, counting numbers, celebrations, license reveal */
function countUp(el, to, ms, fmt){ if(calmMotion()){ el.textContent=fmt(to); return; } const t0=performance.now(); const step=t=>{ const k=Math.min(1,(t-t0)/ms); const e=1-Math.pow(1-k,3); el.textContent=fmt(Math.round(to*e)); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function confetti(n=140){ if(calmMotion()) return; const cv=document.createElement('canvas'); cv.className='confetti'; cv.width=innerWidth; cv.height=innerHeight; document.body.appendChild(cv); const g=cv.getContext('2d');
  const cols=['#f2b33d','#43d17f','#ff7a55','#43b8ad','#ffffff','#e8782a']; const P=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*200, y:innerHeight*0.35, vx:(Math.random()-.5)*14, vy:-Math.random()*14-4, r:Math.random()*6+3, c:cols[Math.random()*cols.length|0], a:Math.random()*6, va:(Math.random()-.5)*.3}));
  const t0=performance.now(); const step=t=>{ g.clearRect(0,0,cv.width,cv.height); for(const p of P){ p.vy+=0.35; p.vx*=0.99; p.x+=p.vx; p.y+=p.vy; p.a+=p.va; g.save(); g.translate(p.x,p.y); g.rotate(p.a); g.fillStyle=p.c; g.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); g.restore(); } if(t-t0<2600) requestAnimationFrame(step); else cv.remove(); }; requestAnimationFrame(step); }
function stamp(text, cls){ if(calmMotion()) return; const d=document.createElement('div'); d.className='fx-stamp '+(cls||''); d.textContent=text; document.body.appendChild(d); setTimeout(()=>d.remove(), 1900); }
function licenseReveal(st, out, job){ const R=RATINGS[job.rating]; if(!R) return; const ex=CAST[(job.chars||[])[0]]||{n:'Examiner'};
  const d=document.createElement('div'); d.className='lic-overlay'; d.setAttribute('role','dialog'); d.setAttribute('aria-label',`New license: ${R.n}`);
  d.innerHTML=`<div class="lic-card"><div class="lic-front"><div class="lic-top">${typeof LOGO!=='undefined'?LOGO:''}<span>Pilot certificate</span></div><p class="label">Issued to</p><h2>${esc(st.pilot.name)}</h2><div class="lic-rating"><b class="mono">${esc(R.code||job.rating)}</b><span>${esc(R.n)}</span></div><p class="small">${esc(R.unlocks||'')}</p><div class="lic-sig"><span>${esc(ex.n)}</span><small>Examiner · Day ${st.day}</small></div></div></div><button class="btn primary" data-act="lic-close">Into the logbook</button>`;
  document.body.appendChild(d); d.querySelector('[data-act="lic-close"]').focus(); chimeUp(); if(!calmMotion()) setTimeout(()=>confetti(180), 500); }
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="lic-close"]')){ const o=document.querySelector('.lic-overlay'); if(o){ o.classList.add('out'); setTimeout(()=>o.remove(),300); } } });
function afterRenderFx(){ const st=S.st; if(!st) return;
  if(S.showResult && S.view==='flight' && st.last){ const L=st.last, key=(L.out&&L.out.id||'')+'|'+(L.res&&L.res.score); const ring=document.querySelector('main .ring');
    if(S._fxDone!==key){ S._fxDone=key; if(ring) ring.classList.add('reveal');
      const lab=document.querySelector('main .panel .label'); if(lab && /score \d+\/100/.test(lab.textContent)){ const pre=lab.textContent.replace(/score \d+\/100.*/,''); const sp=document.createElement('span'); lab.textContent=pre; lab.appendChild(sp); countUp(sp, L.res.score, 1100, v=>`score ${v}/100`); }
      document.querySelectorAll('main .chip.good').forEach(c=>{ const m=c.textContent.match(/^\+\$([\d,]+)$/); if(m){ const v=Number(m[1].replace(/,/g,'')); countUp(c, v, 1200, x=>'+'+money(x)); } });
      if(L.out && L.out.pay>0) setTimeout(cashSound, 650);
      if(L.job && L.job.kind==='check' && L.out && L.out.pass) setTimeout(()=>licenseReveal(st, L.out, L.job), 700);
      else { if(L.res.grade==='A') setTimeout(()=>confetti(), 500); if(L.f && L.f.landing==='butter') setTimeout(()=>stamp('BUTTER','butter'), 350); else if(L.res.crash) setTimeout(()=>stamp('ACCIDENT','bad'), 300); } } }
}

/* 8. boarding pass: the plane flies the route arc (and sits where you are once you're airborne) */
function passPlane(){ const a=S.st&&S.st.active; let pct=null; try{ if(a && a.started && typeof ifProgress==='function'){ const p=ifProgress(a); if(p && p.pct!=null) pct=Math.max(0,Math.min(1,p.pct/100)); } }catch(_){}
  const path='M4 34 Q100 -14 196 34';
  const anim = pct!=null ? `<animateMotion dur="1.4s" fill="freeze" rotate="auto" keyPoints="0;${pct.toFixed(3)}" keyTimes="0;1" calcMode="linear" path="${path}"/>` : (calmMotion()?`<animateMotion dur="1ms" fill="freeze" rotate="auto" keyPoints="0.5;0.5" keyTimes="0;1" calcMode="linear" path="${path}"/>`:`<animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path="${path}"/>`);
  return `<div class="pass-arc" aria-hidden="true"><svg viewBox="0 -6 200 46"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5" opacity=".7"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="2.5" pathLength="1" stroke-dasharray="${pct!=null?pct.toFixed(3):0} 1"/><g>${anim}<path d="M-7 0 L5 -1.2 L7 0 L5 1.2 Z M-1 0 L-4 -6 L-2 -6 L3 0 L-2 6 L-4 6 Z M-6 0 L-8 -3 L-7 -3 L-5 0 L-7 3 L-8 3 Z" fill="currentColor"/></g></svg></div>`; }

/* 9. toasts: stacked, with an icon, slide in, and a timer bar */
function toastKind(msg){ const m=String(msg).toLowerCase(); if(/couldn|can't|cannot|not connected|fail|error|expert mode|grounded|fine/.test(m)) return 'warn'; if(/unlocked|saved|logged|loaded|matches|repaired|moved|welcome|you're now|passed|earned/.test(m)) return 'ok'; return 'info'; }
renderToast = function(){};

/* 10. UI sound: soft ticks, a whoosh on departure, a till on payday */
function softTone(freq, vol=0.05, dur=0.09, type='sine'){ try{ if(!sfxOn()) return; const c=actx(); if(!c) return; const t=c.currentTime; const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+0.02); }catch(_){} }
function whoosh(){ try{ if(!sfxOn()) return; const c=actx(); if(!c) return; const n=Math.floor(c.sampleRate*0.6), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1); const s=c.createBufferSource(); s.buffer=b; const f=c.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.2; const t=c.currentTime; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2400,t+0.5); const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.08,t+0.15); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6); s.connect(f).connect(g).connect(c.destination); s.start(t); }catch(_){} }
function cashSound(){ softTone(1318,.05,.08,'triangle'); setTimeout(()=>softTone(1760,.05,.16,'triangle'),90); }
function chimeUp(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>softTone(f,.06,.22,'triangle'), i*110)); }
document.addEventListener('click', e=>{ const b=e.target.closest('button,[data-act]'); if(!b) return; const act=b.dataset&&b.dataset.act;
  if(act==='start') whoosh(); else if(act==='nav') softTone(660,.025,.05); else if(act==='accept'||act==='accept-story') softTone(990,.04,.08,'triangle'); }, true);

/* ===================== RADIO ATMOSPHERE: squelch, cabin chimes, background ATC ===================== */
function sfxOn(){ try{ return localStorage.getItem('tw.sfx')!=='off'; }catch(e){ return true; } }
let AC_CTX=null;
function actx(){ try{ if(!AC_CTX){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; AC_CTX=new C(); } if(AC_CTX.state==='suspended') AC_CTX.resume(); return AC_CTX; }catch(e){ return null; } }
document.addEventListener('pointerdown', ()=>{ actx(); }, {once:true});
function crackle(len=0.18, vol=0.22){
  if(!sfxOn()) return; const c=actx(); if(!c) return; const n=Math.floor(c.sampleRate*len); const buf=c.createBuffer(1,n,c.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<n;i++){ const env = i<n*0.1 ? i/(n*0.1) : Math.pow(1-(i-n*0.1)/(n*0.9), 1.5); d[i]=(Math.random()*2-1)*env*(Math.random()<0.02?1.8:1); }
  const src=c.createBufferSource(); src.buffer=buf; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=0.9; const g=c.createGain(); g.gain.value=vol*voiceVol();
  src.connect(bp).connect(g).connect(c.destination); src.start();
}
function chime(double=false){
  if(!sfxOn()) return; const c=actx(); if(!c) return; const t0=c.currentTime;
  const tone=(f,t)=>{ const o=c.createOscillator(); o.type='sine'; o.frequency.value=f; const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.18*voiceVol(),t+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+1.1); o.connect(g).connect(c.destination); o.start(t); o.stop(t+1.2); };
  tone(659.25,t0); tone(523.25,t0+0.45); if(double){ tone(659.25,t0+1.1); tone(523.25,t0+1.55); }
}
/* squelch before radio voices */
const _sdSpeak = speakNew;
speakNew = function(){
  const a=S.st&&S.st.active; const log=a&&a.cab&&a.cab.log; if(log && voiceOn()){ const fresh=log.filter(m=>m.t>VQ.lastT); if(fresh.some(m=>m.who!=='Cabin' && m.who!=='Recorder')) crackle(); }
  return _sdSpeak();
};
/* cabin chimes on the big moments, and the radio murmuring in the background */
const ATC_CALLS = [`{cs}, descend and maintain four thousand.`,`{cs}, contact San Juan Center, one two four point six five.`,`{cs}, traffic two o'clock, five miles, opposite direction.`,`{cs}, turn left heading two seven zero, vectors for the I L S.`,`{cs}, climb and maintain flight level two four zero.`,`{cs}, roger, maintain V F R, report the field in sight.`,`{cs}, radar contact, altimeter three zero zero one.`,`{cs}, cleared to land runway one zero, wind zero nine zero at twelve.`];
const CALLSIGNS = [`American twelve forty`,`JetBlue four sixty one`,`Winair one zero seven`,`LIAT three two two`,`Cessna two four Kilo Tango`,`Seaborne six zero five`,`Caribbean three five two`,`Delta eight eleven`,`Cape Air nine one`,`November five Alpha Victor`];
let _sdFlags = {}, _sdNext = 0;
const _sdRender = renderSimBits;
renderSimBits = function(){ _sdRender(); const a=S.st&&S.st.active; if(!a || S.simState!=='live') return; const rec=simRecFor(a); if(!rec) return; const s=S.sim; const key=a.recId||'x'; const F=_sdFlags[key]=_sdFlags[key]||{};
  if(a.job.pax){ if(rec.takeoff && !F.to){ F.to=1; setTimeout(()=>chime(),12000); }
    if(!F.desc && rec.takeoff && s.motion && !s.motion.onGround && s.motion.vsFpm<-500 && s.position.aglFt<4000){ F.desc=1; chime(true); }
    if(rec.blockIn && !F.in){ F.in=1; chime(); } }
  const now=Date.now(); if(s.motion && !s.motion.onGround && rec.takeoff && voiceOn() && sfxOn() && window.speechSynthesis && !speechSynthesis.speaking){
    if(!_sdNext) _sdNext = now + 45000 + Math.random()*40000;
    if(now > _sdNext){ _sdNext = now + 70000 + Math.random()*80000; const t=pick(ATC_CALLS).replace('{cs}', pick(CALLSIGNS)); crackle(0.12,0.15); const u=new SpeechSynthesisUtterance(t); const v=pickVoice(false,1); if(v) u.voice=v; u.rate=1.18; u.pitch=0.9; u.volume=Math.min(1,voiceVol()*0.45); setTimeout(()=>{ try{ speechSynthesis.speak(u); }catch(_){} },150); } }
};
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="sfx-toggle"]')) return; const on=!sfxOn(); try{ localStorage.setItem('tw.sfx', on?'on':'off'); }catch(_){} if(on){ crackle(); setTimeout(()=>chime(),300); } toast(on?'Radio sounds on.':'Radio sounds off.'); render(); });
/* sound switch next to the voice switch */
const _sdCabin = cabinInner;
cabinInner = function(){ const h=_sdCabin(); return h ? h.replace('<button class="btn sm ghost voice-btn"', `<button class="btn sm ghost voice-btn" data-act="sfx-toggle">${sfxOn()?'🎧 Sounds':'🎧 Off'}</button><button class="btn sm ghost voice-btn"`) : h; };

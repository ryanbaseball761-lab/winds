/* ===================== FRESH RECORDING PER FLIGHT + SPOKEN COCKPIT ===================== */
/* Only trust a recording that belongs to this flight: armed for it, or started after it began. */
function simRecFor(active){
  const s=S.sim; if(!s || !s.recorder || !active) return null; const r=s.recorder;
  if(active.recId) return r.id===active.recId ? r : null;
  if(active.started && r.armedAt && r.armedAt >= active.started - 120000) return r;
  return null;
}
/* Arm a fresh recording as soon as a flight is booked and MSFS is live */
function autoArm(){
  const a=S.st && S.st.active; if(!a || a.recId || !S.mcp || S.simState!=='live' || S._arming) return;
  S._arming=true; Promise.resolve(simArm()).finally(()=>{ S._arming=false; });
}

/* ---- Voices ---- */
const FEMALE = ['mari','celeste','vivienne','rosa','wilkins','marchetti','okafor','amara'];
function voiceOn(){ try{ return localStorage.getItem('tw.voice')!=='off'; }catch(e){ return true; } }
function voiceVol(){ try{ return Number(localStorage.getItem('tw.vol')||'0.9'); }catch(e){ return 0.9; } }
let _voices=[];
function loadVoices(){ try{ _voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; }catch(e){ _voices=[]; } }
if(window.speechSynthesis){ loadVoices(); try{ speechSynthesis.onvoiceschanged = loadVoices; }catch(e){} }
function pickVoice(female, slot){
  const en=_voices.filter(v=>/^en/i.test(v.lang)); if(!en.length) return null;
  const f=en.filter(v=>/female|zira|aria|jenny|samantha|susan|hazel|libby|sonia|natasha|michelle|karen|moira|tessa|serena/i.test(v.name));
  const m=en.filter(v=>/male|david|mark|guy|george|ryan|daniel|alex|fred|thomas|christopher|eric|james|william/i.test(v.name) && !/female/i.test(v.name));
  const pool = female ? (f.length?f:en) : (m.length?m:en); return pool[slot % pool.length];
}
function speakerFor(who, job){
  if(/^(Ground|Radio|ATC|Approach|Tower)$/i.test(who)) return {voice:pickVoice(false,1), rate:1.12, pitch:0.85};
  if(/^Cabin$/i.test(who)) return {voice:pickVoice(true,1), rate:1.0, pitch:1.1};
  const k = Object.keys(CAST).find(x=>shortName(x)===who) || '';
  const fem = FEMALE.includes(k);
  return {voice:pickVoice(fem, fem?0:0), rate: k==='abe'?0.92:k==='dez'?1.08:1.0, pitch: k==='abe'?0.85:k==='calloway'?1.05:1.0};
}
function spokenText(m){
  if(m.who==='Recorder') return null;
  let t=m.text;
  if(m.who==='Cabin'){ const q=t.match(/"([^"]+)"/); if(!q) return null; t=q[1]; }   // passengers only say their quoted words
  t=t.replace(/^[A-Z][A-Za-z ]{0,24}:\s*/,'').replace(/"/g,'');
  return t.length>2 ? t : null;
}
const VQ = { lastT: Date.now(), busy:false };
function speakNew(){
  if(!voiceOn() || !window.speechSynthesis) return;
  const a=S.st && S.st.active; const log=a && a.cab && a.cab.log; if(!log) return;
  const fresh = log.filter(m=>m.t > VQ.lastT).sort((x,y)=>x.t-y.t); if(!fresh.length) return;
  VQ.lastT = fresh[fresh.length-1].t;
  const crit = fresh.filter(m=>m.kind==='crit'); const rank=m=>m.kind==='crit'?0:m.kind==='coach'?1:m.who==='Cabin'?3:2; const list = (crit.length ? crit : fresh.slice().sort((x,y)=>rank(x)-rank(y)).slice(0,3).sort((x,y)=>rank(y)-rank(x)));
  if(crit.length) try{ speechSynthesis.cancel(); }catch(e){}
  for(const m of list){ const t=spokenText(m); if(!t) continue; const sp=speakerFor(m.who, a.job);
    try{ const u=new SpeechSynthesisUtterance(t); if(sp.voice) u.voice=sp.voice; u.rate=sp.rate; u.pitch=sp.pitch; u.volume=voiceVol(); speechSynthesis.speak(u); }catch(e){} }
}
const _vRender = renderSimBits;
renderSimBits = function(){ autoArm(); _vRender(); try{ speakNew(); }catch(e){} };

/* voice toggle in the Cabin & radio panel */
const _vCabin = cabinInner;
cabinInner = function(){ const h=_vCabin(); if(!h) return h;
  const btn = window.speechSynthesis ? `<button class="btn sm ghost voice-btn" data-act="voice">${voiceOn()?'🔊 Voices on':'🔇 Voices off'}</button>` : '';
  return h.replace('</h3>', '</h3>'+btn); };
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="voice"]'); if(!b) return;
  const on=!voiceOn(); try{ localStorage.setItem('tw.voice', on?'on':'off'); }catch(_){}
  if(on && window.speechSynthesis){ loadVoices(); const sp=speakerFor(S.st&&S.st.active?shortName(coachFor(S.st.active.job)):'Mari'); const u=new SpeechSynthesisUtterance(`Voices on. I'll talk you through it.`); if(sp.voice) u.voice=sp.voice; u.volume=voiceVol(); speechSynthesis.speak(u); }
  else { try{ speechSynthesis.cancel(); }catch(_){} }
  document.querySelectorAll('.cabin-host').forEach(el=>{ el.innerHTML = cabinInner(); });
});
/* one-time cleanup: drop cabin chatter recorded before this fix (it may have come from an old flight) */
const _vMigrate = migrate;
migrate = function(st){ const r=_vMigrate(st); if(r && !r._cabFix){ r._cabFix=true; if(r.active && r.active.cab) delete r.active.cab; if(r.active) delete r.active.recId; } return r; };

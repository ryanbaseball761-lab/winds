/* ===================== RECORDED VOICE LINES =====================
   Story lines can be played from recorded audio instead of computer speech. Each spoken line has a stable id made
   from its words (voKey). Put recordings in art/voice/<id>.mp3 and list the ids in art/voice/index.json:
     {"lines":["v1a2b3c4d", ...]}
   The script to record is docs/voice/script.csv (node tools/voicescript.js). Lines without a recording fall back to
   speech, so recordings can arrive a few at a time. */

const VO = { lines:{}, q:[], playing:null };
function voNorm(t){ return String(t||'').toLowerCase().replace(/[“”"’']/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function voKey(t){ let h=0x811c9dc5; const s=voNorm(t); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193)>>>0; } return 'v'+h.toString(16).padStart(8,'0'); }

function voLoad(i){ if(i>=ART.bases.length) return; const base=ART.bases[i];
  fetch(base+'voice/index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject()).then(ix=>{ (ix.lines||[]).forEach(k=>{ if(!VO.lines[k]) VO.lines[k]=`${base}voice/${k}.mp3`; }); }).catch(()=>{}).finally(()=>voLoad(i+1)); }

/* play recordings one after another; anything without a recording goes to speech as before */
function voNext(){ if(VO.playing || !VO.q.length) return; const {url, u}=VO.q.shift(); const a=new Audio(url); VO.playing=a; a.volume=(typeof voiceVol==='function')?voiceVol():1;
  const done=()=>{ if(VO.playing!==a) return; VO.playing=null; try{ u.onend && u.onend({}); }catch(_){} voNext(); };
  a.onended=done; a.onerror=()=>{ VO.playing=null; try{ voSpeak(u); }catch(_){} voNext(); }; a.play().catch(a.onerror); }
let voSpeak=null;
(function hookRecorded(){ const SS=window.speechSynthesis; if(!SS) return; voSpeak=SS.speak.bind(SS); const cancel=SS.cancel.bind(SS);
  SS.speak=function(u){ const url=VO.lines[voKey(u&&u.text)]; if(!url) return voSpeak(u); VO.q.push({url,u}); if(VO.q.length>4) VO.q.splice(0,VO.q.length-4); voNext(); };
  SS.cancel=function(){ VO.q.length=0; if(VO.playing){ try{ VO.playing.pause(); }catch(_){} VO.playing=null; } return cancel(); }; })();
setTimeout(()=>voLoad(0), 1500);

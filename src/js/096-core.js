/* ===================== B. MUSIC, CHARACTER VOICES, ART PIPELINE ===================== */

/* ---- music: a small synth score, played live (no files needed) ---- */
const N = n=>440*Math.pow(2,(n-69)/12);   // MIDI note -> Hz
const MUSIC = { cur:null, timer:null, nodes:[], bus:null, rev:null,
  ctx(){ const c=typeof actx==='function'?actx():null; if(!c||!sfxOn()) return null; if(!this.bus || this.bus.context!==c){ this.bus=c.createGain(); this.bus.gain.value=0.0; this.bus.connect(c._mus||c.destination);
      const len=c.sampleRate*2.6, ir=c.createBuffer(2,len,c.sampleRate); for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4); } this.rev=c.createConvolver(); this.rev.buffer=ir; const wet=c.createGain(); wet.gain.value=0.45; this.rev.connect(wet); wet.connect(this.bus); } return c; },
  voice(c,{f,t,d,type='triangle',g=0.05,att=0.02,rel=0.6,lp=2400,dry=0.6}){ const o=c.createOscillator(), o2=c.createOscillator(), a=c.createGain(), fl=c.createBiquadFilter(); o.type=type; o2.type=type; o.frequency.value=f; o2.frequency.value=f*1.004; fl.type='lowpass'; fl.frequency.value=lp;
    o.connect(fl); o2.connect(fl); fl.connect(a); const dg=c.createGain(); dg.gain.value=dry; a.connect(dg); dg.connect(this.bus); a.connect(this.rev);
    a.gain.setValueAtTime(0,t); a.gain.linearRampToValueAtTime(g,t+att); a.gain.setValueAtTime(g,t+Math.max(att,d-rel)); a.gain.linearRampToValueAtTime(0,t+d); o.start(t); o2.start(t); o.stop(t+d+0.05); o2.stop(t+d+0.05); },
  hat(c,t,g=0.012){ const b=c.createBuffer(1,c.sampleRate*0.08,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length); const s=c.createBufferSource(); s.buffer=b; const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6000; const a=c.createGain(); a.gain.value=g; s.connect(hp); hp.connect(a); a.connect(this.bus); s.start(t); },
  /* tracks: chord progression + a sparse melody over a bass pulse, A minor, slow and smoky */
  TRACKS:{
    title:{bpm:68, bars:[[45,[57,60,64]],[41,[57,60,65]],[48,[55,60,64]],[40,[56,59,64]]], mel:[76,null,74,72,null,69,null,null, 72,null,71,69,null,67,null,null, 67,null,69,72,null,74,null,76, 71,null,null,68,null,null,null,null], hats:true},
    tension:{bpm:60, bars:[[45,[57,60,63]],[45,[57,60,63]],[46,[58,61,65]],[44,[56,59,63]]], mel:null, pulse:true},
    act:{bpm:60, bars:[[45,[57,60,64,69]]], mel:null, sting:true}
  },
  play(name){ const c=this.ctx(); if(!c) return; if(this.cur===name) return; this.stop(true); this.cur=name; const T=this.TRACKS[name]; const beat=60/T.bpm, bar=beat*4; let barI=0; let next=c.currentTime+0.1;
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setValueAtTime(this.bus.gain.value,c.currentTime); this.bus.gain.linearRampToValueAtTime(name==='tension'?0.5:0.8, c.currentTime+2);
    const sched=()=>{ while(next < c.currentTime+bar*1.2){ const [bass,ch]=T.bars[barI%T.bars.length];
        this.voice(c,{f:N(bass-12),t:next,d:bar,type:'sawtooth',g:0.05,lp:220,att:0.3,rel:0.8});
        ch.forEach(n=>this.voice(c,{f:N(n),t:next,d:bar,type:'triangle',g:0.018,att:1.2,rel:1.4,lp:1800,dry:0.4}));
        if(T.pulse) for(let k=0;k<4;k++) this.voice(c,{f:N(bass),t:next+k*beat,d:0.35,type:'sine',g:0.06,att:0.005,rel:0.3,lp:400});
        if(T.hats) for(let k=0;k<8;k++) if(k%2) this.hat(c,next+k*beat/2, k===3||k===7?0.016:0.008);
        if(T.mel){ for(let k=0;k<8;k++){ const m=T.mel[(barI%4)*8+k]; if(m) this.voice(c,{f:N(m),t:next+k*beat/2,d:beat*1.6,type:'sine',g:0.035,att:0.004,rel:beat*1.4,lp:3200,dry:0.5}); } }
        if(T.sting){ this.voice(c,{f:N(33),t:next,d:3,type:'sawtooth',g:0.08,lp:160,att:0.01,rel:2.6}); }
        next+=bar; barI++; if(T.sting && barI>=1){ setTimeout(()=>this.stop(), 3500); return; } }
      this.timer=setTimeout(sched, 500); };
    sched(); },
  stop(quick){ clearTimeout(this.timer); this.timer=null; const c=this.ctx&&this.bus&&this.bus.context; if(c&&this.bus){ this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setValueAtTime(this.bus.gain.value,c.currentTime); this.bus.gain.linearRampToValueAtTime(0, c.currentTime+(quick?0.4:1.6)); } this.cur=null; }
};
/* the title screen needs a click before browsers allow sound */
document.addEventListener('pointerdown', ()=>{ if(document.querySelector('.title-screen') && !MUSIC.cur) MUSIC.play('title'); }, true);
/* ---- character voices: each person keeps the same premium voice and acting direction ---- */
const CHAR_VOICE = {
  castillo:['onyx',`Soft-spoken Latin American businessman in his fifties. Calm, unhurried, polite, quietly menacing.`],
  reyes:['sage',`Tired, dry, stubborn female DEA agent. Low energy, sharp, no-nonsense.`],
  mari:['coral',`Warm Caribbean woman in her thirties who runs a small airline. Worried, honest, direct.`],
  dez:['ash',`Laid-back Caribbean mechanic in his forties. Joking, easygoing, a little conspiratorial.`],
  tico:['echo',`Excited, fast-talking young man of twenty-two. Eager, nervous, hopeful.`],
  medina:['ballad',`Charming, smooth Venezuelan smuggler. Friendly on the surface, dangerous underneath.`],
  hartwell:['fable',`Refined older British billionaire. Weary, regretful, measured.`],
  self:['onyx',`Inner monologue of a pilot. Quiet, close to the microphone, reflective.`],
  radio:['echo',`Radio transmission. Clipped, professional, slightly distorted cadence.`] };
const _cvVoice = pvVoiceFor, _cvInstr = pvInstr;
pvVoiceFor = function(u){ PV._char = u && u.twChar; return (u && u.twChar && CHAR_VOICE[u.twChar]) ? CHAR_VOICE[u.twChar][0] : _cvVoice(u); };
pvInstr = function(text){ const k=PV._char; PV._char=null; return (k && CHAR_VOICE[k]) ? CHAR_VOICE[k][1] : _cvInstr(text); };
/* tag the speech from cutscenes and in-flight moments with the speaker */
(function(){ const U=window.SpeechSynthesisUtterance; if(!U) return; let pending=null; window.twSpeaker=k=>{ pending=k; setTimeout(()=>{ if(pending===k) pending=null; }, 1500); };
  const SS=window.speechSynthesis; if(!SS) return; const sp=SS.speak.bind(SS); SS.speak=function(u){ if(pending){ u.twChar=pending; pending=null; } return sp(u); }; })();
function speakBeat(b){ try{ twSpeaker(b.who); }catch(_){} return speakBeatBase(b); }

/* ---- art pipeline: drop in painted portraits and scenes and they replace the drawings ---- */
const ART = { portraits:{}, scenes:{}, bases:['https://raw.githubusercontent.com/ryanbaseball761-lab/winds/main/art/'] };
/* one small index file per location lists the art that exists, e.g. {"portraits":["castillo"],"scenes":["villa"]} */
function artLoadBase(i){ if(i>=ART.bases.length) return; const base=ART.bases[i]; fetch(base+'index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject()).then(ix=>{ (ix.portraits||[]).forEach(k=>{ if(!ART.portraits[k]) ART.portraits[k]=`${base}portraits/${k}.jpg`; }); (ix.scenes||[]).forEach(k=>{ if(!ART.scenes[k]) ART.scenes[k]=`${base}scenes/${k}.jpg`; }); try{ render(); }catch(_){} }).catch(()=>{}).finally(()=>artLoad(i+1)); }
setTimeout(()=>artLoad(0), 1500);
Object.keys(SCENES).forEach(k=>{ const f=SCENES[k]; SCENES[k]=()=>ART.scenes[k] ? `<div class="art-scene" style="background-image:url('${ART.scenes[k]}')"></div>` : f(); });

(function(){ const s=document.createElement('style'); s.textContent=`
.art-av{display:inline-block;border-radius:50%;background-size:cover;background-position:center 20%;width:44px;height:44px}
.art-scene{width:100%;height:100%;background-size:cover;background-position:center}
/* portraits: a consistent noir treatment for the drawn ones */
.avatar:not(.art-av) svg{filter:saturate(.75) contrast(1.08)}.avatar{box-shadow:0 0 0 2px rgba(0,0,0,.5),0 0 0 3px rgba(200,150,42,.25)}`; document.head.appendChild(s); })();

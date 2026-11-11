/* ===================== EVERYTHING IS A CUTSCENE: one engine for prologues, aftermaths, choices and endings ===================== */
/* shot types:
   [place, speaker|null, text]                          line or narration
   {card:true, kicker, title, sub}                      big title card
   {choice:true, q, opts:[{t, why}], pick:i=>shots}     a decision; pick() returns the shots that follow */

/* the art behind a scene */



/* ---- after a chapter: what happened, your decision, and what it led to, all as one scene ---- */
function fxSub(o){ if(o.ending) return `Ending: ${({kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'})[o.ending]||o.ending}`; const b=[]; if(o.power) b.push(`Power ${o.power>0?'+':''}${o.power>=100?'max':o.power}`); if(o.heat) b.push(`Heat ${o.heat>0?'+':''}${o.heat<=-100?'cleared':o.heat}`); if(o.cash) b.push(`${o.cash>0?'+':'−'}${money(Math.abs(o.cash))}`); return b.join(' · '); }
function splitOut(text){ return String(text||'').split(/(?<=[.!?”"])\s+(?=[A-Z"“])/).reduce((acc,s)=>{ const last=acc[acc.length-1]; if(last && (last+' '+s).length<170) acc[acc.length-1]=last+' '+s; else acc.push(s); return acc; }, []); }
/* the result screen gets a button to watch it again */
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

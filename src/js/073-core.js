/* ================= 2. choices carry forward ================= */
const flagsOf = st => crime(st).flags;
const DYN = {
  CR15:f=>({chars:['castillo'].concat(f.mari?['mari']:[])}),
  CR16:f=>f.mari?{chars:['mari']}:{chars:[], out:{good:`The 747 kisses the runway at Montego Bay. Your first officer, a kid from Kingston, just shakes his head and laughs.`,ok:`Eighty tons on the ground at Montego Bay. The trucks are already lining up.`,bad:`A heavy, heavy landing, but eighty tons are on the ground at Montego Bay.`}},
  CRT:f=>({chars:['medina'].concat(f.mari?['mari']:[])}),
  CR17:f=>({chars:['castillo','reyes'].concat(f.mari?['mari']:[])}),
  CR13:f=>f.dezJail?{brief:[`Mari found the cash in hangar three. All of it. With Dez in prison, she went looking for answers herself.`,`She doesn't yell. She asks if you'll take her flying, just the two of you, over to Grand Case like when you were new. She doesn't say a word until you're on final.`]}:{}
};
function dynM(st, m){ const d=DYN[m.id]; return d ? Object.assign({}, m, d(flagsOf(st))) : m; }
(function(){ const _sj=storyJob; storyJob=function(st, m, acId){ return _sj(st, dynM(st, m), acId); }; })();
/* The Setup: if someone warned you mid-flight, you walk away with the load */
(function(){ const _ap=applyResult; applyResult=function(st, job, f, res){ if(job.story==='CRB' && flagsOf(st).warned){ job.out={good:`You park at the passenger terminal instead of the cargo ramp and walk out with a crowd of tourists. From the taxi you watch three trucks full of Medina's men circle an empty cargo ramp. Castillo sold you to them, and it didn't work.`,ok:`You park at the passenger terminal and walk out with the tourists. Three trucks of Medina's men wait on an empty cargo ramp. Castillo sold you out, and it didn't work.`,bad:`A rough landing, but you park at the passenger terminal and slip out with the tourists. Medina's men wait on an empty cargo ramp. Castillo sold you out.`}; } return _ap(st, job, f, res); }; })();

/* endings: you only get the ones you earned */
const ENDING_REQ = { kingpin:c=>c.power>=50 ? null : `Needs Power 50+ (you have ${c.power})`, witness:c=>(c.flags.informant||c.flags.ledgers||c.flags.medinaBurned) ? null : `You never gave Reyes anything`, ghost:()=>null };
(function(){ const _ch=crimeChoiceHTML; crimeChoiceHTML=function(st){ const h=_ch(st); if(!h || !st.last || st.last.job.story!=='CR17' || crime(st).choice.CR17!=null) return h; const c=crime(st); const m=CRIME.find(x=>x.id==='CR17'); const t=tpl(h);
  t.content.querySelectorAll('[data-act="crime-choose"]').forEach(b=>{ const o=m.choice.opts[Number(b.dataset.i)]; const why=o.ending && ENDING_REQ[o.ending](c); if(why){ b.disabled=true; b.title=why; b.insertAdjacentHTML('beforeend', ` <small>(${esc(why)})</small>`); } }); return t.innerHTML; }; })();
window.addEventListener('click', e=>{ const b=e.target.closest('[data-act="crime-choose"]'); if(b && b.disabled){ e.stopImmediatePropagation(); e.preventDefault(); } }, true);
function epilogue(st){ const f=flagsOf(st), L=[]; if(f.mari) L.push(`Mari runs the logistics, and she never lets anyone put a kid in the back again.`); else if(st.story.done.CR13) L.push(`Mari sends a postcard once a year from somewhere cold. It never has a return address.`);
  if(f.dezFree) L.push(`Dez runs your hangar and still calls you "rookie".`); if(f.dezJail) L.push(`Dez is still in prison. He has never said your name.`);
  if(f.ticoRan) L.push(`Tico flies crop dusters in Belize now. He wrote once, to say thank you.`); if(f.boy) L.push(`Somewhere in Tortola, a boy who once couldn't breathe is learning to swim.`); return L; }


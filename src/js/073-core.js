/* ================= 2. choices carry forward ================= */
const flagsOf = st => crime(st).flags;
const DYN = {
  CR9:f=>f.hidcase?{out:{good:`A clean landing. Two dark SUVs pull up beside the jet before the engines have spooled down. A tired-looking woman holds up a badge. "Agent Elena Reyes, DEA. Nice airplane. Whose is it?" She has photos of you in San Juan, loading bags. They take the jet apart for two hours and never find the avionics panel. Reyes doesn't need the case. She has the photos. They take you to a small room with no windows.`,ok:`Two dark SUVs pull up beside the jet before the engines have spooled down. A tired-looking woman holds up a badge. "Agent Elena Reyes, DEA. Nice airplane. Whose is it?" She has photos of you in San Juan, loading bags. They search the jet for two hours and never find the avionics panel. It doesn't matter. They take you to a small room with no windows.`,bad:`Two dark SUVs pull up beside the jet before the engines have spooled down. A tired-looking woman holds up a badge. "Agent Elena Reyes, DEA. Nice airplane. Whose is it?" She has photos of you in San Juan, loading bags. They search for two hours. The case stays hidden behind the panel, but they take you to a small room with no windows anyway.`}}:{},
  CR15:f=>({chars:['castillo'].concat(f.mari?['mari']:[])}),
  CR16:f=>f.mari?{chars:['mari']}:{chars:[], out:{good:`The 747 kisses the runway at Montego Bay. Your first officer, a kid from Kingston, just shakes his head and laughs.`,ok:`Eighty tons on the ground at Montego Bay. The trucks are already lining up.`,bad:`A heavy, heavy landing, but eighty tons are on the ground at Montego Bay.`}},
  CRT:f=>({chars:['medina'].concat(f.mari?['mari']:[])}),
  CR17:f=>({chars:['castillo','reyes'].concat(f.mari?['mari']:[])}),
  CR13:f=>f.dezJail?{brief:[`Mari found the cash in hangar three. All of it. With Dez in prison, she went looking for answers herself.`,`She doesn't yell. She asks if you'll take her flying, just the two of you, over to Grand Case like when you were new. She doesn't say a word until you're on final.`]}:{}
};
function dynM(st, m){ const d=DYN[m.id]; return d ? Object.assign({}, m, d(flagsOf(st))) : m; }

/* endings: you only get the ones you earned */
const ENDING_REQ = { kingpin:c=>c.power>=50 ? null : `Needs Power 50+ (you have ${c.power})`, witness:c=>(c.flags.informant||c.flags.ledgers||c.flags.medinaBurned||c.flags.drivecopy||c.flags.patient) ? null : `You have nothing to give Reyes`, ghost:()=>null };
function crimeChoiceHTML(st){ const h=crimeChoiceHTMLBase(st); if(!h || !st.last || st.last.job.story!=='CR17' || crime(st).choice.CR17!=null) return h; const c=crime(st); const m=CRIME.find(x=>x.id==='CR17'); const t=tpl(h);
  t.content.querySelectorAll('[data-act="crime-choose"]').forEach(b=>{ const o=m.choice.opts[Number(b.dataset.i)]; const why=o.ending && ENDING_REQ[o.ending](c); if(why){ b.disabled=true; b.title=why; b.insertAdjacentHTML('beforeend', ` <small>(${esc(why)})</small>`); } }); return t.innerHTML; }
window.addEventListener('click', e=>{ const b=e.target.closest('[data-act="crime-choose"]'); if(b && b.disabled){ e.stopImmediatePropagation(); e.preventDefault(); } }, true);
function epilogue(st){ const f=flagsOf(st), L=[]; const end=crime(st).ending;
  if(f.mari) L.push(`Mari runs the logistics, and she never lets anyone put a kid in the back again.`); else if(st.story.done.CR13) L.push(`Mari sends a postcard once a year from somewhere cold. It never has a return address.`);
  if(f.dezFree) L.push(`Dez runs your hangar and still calls you "rookie".`); if(f.dezJail) L.push(`Dez is still in prison. He has never said your name.`);
  if(f.ticoRan) L.push(`Tico flies crop dusters in Belize now. He wrote once, to say thank you.`); else if(st.story.done.CR11) L.push(f.ticoSeat?`Sometimes you still see Tico in the right seat, grinning at the sky. Then you remember the car at Grand Cayman.`:`Nobody ever found out what happened to Tico. You stopped asking.`);
  if(f.boy) L.push(`Somewhere in Tortola, a boy who once couldn't breathe is learning to swim.`); else if(f.oxygen) L.push(`You never found out what happened to the boy from Tortola. You gave him oxygen. You tell yourself that counts.`);
  if(f.hartwellSafe) L.push(`Lionel Hartwell dives the reefs off Mustique again. He keeps a seat on every one of your planes, just in case.`); else if(st.story.done.CR14) L.push(`Hartwell's foundation closed the next year. Nobody has seen him on Mustique since.`);
  if(f.medinaBurned) L.push(`Rafael Medina is in a Florida prison. He tells anyone who'll listen that it was you.`); else if(f.medinaAlly) L.push(`Medina kept his half of the Caribbean for exactly one year. Then he wanted yours.`); else if(f.medinaDeal) L.push(`Medina never asked for his fifty thousand back. He's patient like that.`);
  if(end==='kingpin') L.push(`Castillo lives in a small house in Panama now. Every Christmas he sends you a bottle of rum. You have it tested.`);
  if(end==='witness') L.push(`Castillo got thirty years. He has never sent you a single word. That worries you more than threats would.`);
  if(end==='ghost') L.push(`Castillo spent two years looking for you. Then he stopped. You're not sure which is worse.`);
  if(end==='witness') L.push(`Reyes got her promotion. She calls on your birthday, from a different number every year.`); else if(end==='kingpin' && (f.informant||f.ledgers)) L.push(`Reyes never forgave you. Her last text was one word: "Liar."`); else if(end==='kingpin') L.push(`Reyes is still out there, chasing planes. Now they're yours.`);
  if(end==='ghost' && f.drivecopy) L.push(`Arnaud's drive sits on an old phone, in a safe, in a country with no extradition treaty. Insurance.`);
  return L; }


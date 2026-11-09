/* ===================== PASSENGER MANIFEST: people with personalities ===================== */
const TRAITS = {
  nervous:{n:'Nervous flyer', i:'😬', d:'Hates bumps and steep turns. Smooth flying earns a big thank-you.'},
  photo:{n:'Photographer', i:'📷', d:'Wants gentle banks and a good view of the destination.'},
  sleeper:{n:'Sleeper', i:'😴', d:'Will be asleep before you level off. A firm landing wakes them.'},
  business:{n:'On a deadline', i:'💼', d:'Cares about one thing: getting there on time.'},
  kid:{n:'First flight (kid)', i:'🧒', d:'Thinks everything is amazing, including you.'},
  elder:{n:'Retired pilot', i:'👴', d:'Flew these islands in the 70s. Watches your every move, kindly.'},
  vip:{n:'VIP', i:'⭐', d:'Expects perfection and tips accordingly.'}
};
function makeManifest(job){
  if(!job.pax || job.pax>9 || job.airline || job.kind==='check') return null;
  const R=rng(hashStr(job.id||job.title)); const pickR=a=>a[Math.floor(R()*a.length)];
  const pool = job.vip ? ['vip','business','photo','nervous'] : job.urgent ? ['business','nervous','sleeper','kid'] : job.arch==='honeymoon' ? ['photo','sleeper','nervous'] : job.local ? ['photo','kid','elder','nervous'] : ['nervous','photo','sleeper','business','kid','elder'];
  const out=[]; for(let i=0;i<job.pax;i++){ out.push({name:`${pickR(NAMES.first)} ${pickR(NAMES.last)}`, seat:`${Math.floor(i/2)+1}${i%2?'B':'A'}`, trait:pickR(pool)}); }
  return out;
}
function manifestHTML(job){ const M=job.manifest; if(!M) return '';
  return `<section class="panel stack manifest"><div class="row between"><h3>Passenger manifest</h3><span class="small muted">${M.length} aboard</span></div><div class="mf-list">${M.map(p=>`<div class="mf"><span class="mf-ic" title="${esc(TRAITS[p.trait].n)}">${TRAITS[p.trait].i}</span><div><b>${esc(p.name)}</b><span class="tiny muted">Seat ${p.seat} · ${esc(TRAITS[p.trait].n)}</span></div></div>`).join('')}</div><p class="tiny muted">${[...new Set(M.map(p=>p.trait))].map(t=>`${TRAITS[t].i} ${esc(TRAITS[t].d)}`).join(' ')}</p></section>`; }
/* give every passenger job a manifest when it becomes active */
const _mfRenderAll = render;
render = function(){ const a=S.st&&S.st.active; if(a && a.job.manifest===undefined){ a.job.manifest = makeManifest(a.job); } return _mfRenderAll(); };
const _mfFlight = flightView;
flightView = function(){ const h=_mfFlight(); const a=S.st&&S.st.active; if(!a || !a.job.manifest || S.debrief || S.showResult) return h;
  if(a.started && !S.ifBrief) return h.replace(/(<div class="stack">)(<section class="panel stack cabin-host">)/, `$1$2`).replace('<section class="panel stack small"><h3>Quick reference</h3>', manifestHTML(a.job)+'<section class="panel stack small"><h3>Quick reference</h3>');
  return h.replace('<section class="panel stack preflight"', manifestHTML(a.job)+'<section class="panel stack preflight"'); };
/* passengers react by name */
const _mfPick = cabinPick;
cabinPick = function(k, job){ const M=job.manifest; if(M){ const has=t=>M.find(p=>p.trait===t);
  if(k==='bump' && has('nervous')) return `${has('nervous').name.split(' ')[0]} in ${has('nervous').seat} grips the armrests with both hands. "Is that normal? Tell me that's normal."`;
  if(k==='near' && has('photo')) return `"Hold it right there!" ${has('photo').name.split(' ')[0]} is shooting through the window. "That's the cover shot."`;
  if(k==='takeoff' && has('kid')) return `"WE'RE FLYING!" ${has('kid').name.split(' ')[0]} shouts from ${has('kid').seat}. Everyone laughs.`;
  if(k==='cruise' && has('elder') && Math.random()<0.6) return `"I flew a Twin Otter through here in '78," ${has('elder').name.split(' ')[0]} says. "You're doing fine. Better than I did."`;
  if(k==='cruise' && has('sleeper') && Math.random()<0.5) return `${has('sleeper').name.split(' ')[0]} is already asleep against the window.`;
  if((k==='tdF'||k==='tdH') && has('sleeper')) return `${has('sleeper').name.split(' ')[0]} wakes up with a jolt. "Are we there? Did we crash?"`;
  } return _mfPick(k, job); };
/* after the flight: what each passenger thought */
function paxVerdict(p, job, f, res, t){
  const fpm=f.verified?f.simFpm:({butter:80,smooth:150,firm:280,hard:450}[f.landing]||200); const comfort=job.comfort!=null?job.comfort:90; const late=(f.block||0) > plan(job).est*1.15+3;
  let s=4, line='Nice flight, thanks.';
  if(p.trait==='nervous'){ s = comfort>=90 && fpm<200 ? 5 : comfort<70||fpm>300 ? 2 : 3; line = s===5?`"I actually enjoyed that. I didn't think that was possible."`:s<=2?`"Never again. Well... maybe with a different pilot."`:`"I survived. That's a win."`; }
  if(p.trait==='photo'){ s = t.bank ? 3 : 5; line = s===5?`"Got the shot. You're tagged."`:`"Every photo is sideways. Love the enthusiasm though."`; }
  if(p.trait==='sleeper'){ s = fpm<200 ? 5 : 3; line = s===5?`"Slept the whole way. Perfect."`:`"Woke up on landing. Rude, but fine."`; }
  if(p.trait==='business'){ s = late ? 2 : 5; line = late?`"I missed the first ten minutes of my meeting."`:`"Early. I like you."`; }
  if(p.trait==='kid'){ s = 5; line = fpm>350?`"That bump was the BEST part!"`:`"Can we go again? Can we? Please?"`; }
  if(p.trait==='elder'){ s = res.grade==='A'?5:res.grade==='B'?4:3; line = s===5?`"Textbook. Your instructor did a good job."`:`"Not bad. Watch your speed on final, son."`; }
  if(p.trait==='vip'){ s = res.grade==='A' && comfort>=90 ? 5 : res.grade<='B' ? 4 : 2; line = s===5?`"Flawless. I'll ask for you next time."`:s===4?`"Acceptable."`:`"My assistant will be in touch."`; }
  return {s, line};
}
const _mfAfter = afterFlight;
afterFlight = function(st, job, f, res, out){
  const r=_mfAfter(st, job, f, res, out); const M=job.manifest; if(!M || res.crash) return r;
  const t=(job._cab&&job._cab.tally)||{}; const v=M.map(p=>Object.assign({p}, paxVerdict(p,job,f,res,t))); out.manifest=v;
  const tips = v.reduce((sum,x)=>sum + (x.s===5 ? (x.p.trait==='vip'?60:20) : 0), 0);
  if(tips>0 && !job.company){ txn(st,tips,'Tips & bonuses','Passenger tips'); out.pay+=tips; out.notes.push(`Passenger tips: ${money(tips)}.`); }
  return r;
};
const _mfResult = resultView;
resultView = function(){ const h=_mfResult(); const v=S.st.last&&S.st.last.out&&S.st.last.out.manifest; if(!v) return h;
  const sec=`<section class="panel stack"><p class="label">Your passengers</p><div class="mf-list">${v.map(x=>`<div class="mf"><span class="mf-ic">${TRAITS[x.p.trait].i}</span><div><b>${esc(x.p.name)}</b> <span class="stars small">${'★'.repeat(x.s)}${'☆'.repeat(5-x.s)}</span><span class="small">${esc(x.line)}</span></div></div>`).join('')}</div></section>`;
  const i=h.indexOf('<section class="panel stack share-card">'); return i>0 ? h.slice(0,i)+sec+h.slice(i) : h.replace('</main>', sec+'</main>'); };

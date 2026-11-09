/* ===================== ENGINE ===================== */
const KEY = 'tradewinds.career.v1';
const DB_DOC = 'career/main';
const DAY0 = Date.UTC(2026,5,1); // career season starts 1 June (hurricane season)
const DUTY_MAX = 600; // minutes of duty per day
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = (a,b) => a + Math.random()*(b-a);
const ri = (a,b) => Math.floor(rnd(a, b+1));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2,9);
const money = n => (n<0?'-':'') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const fmtH = min => (min/60).toFixed(1) + ' h';
const pad = n => String(n).padStart(2,'0');
const hhmm = m => { m = ((Math.round(m)%1440)+1440)%1440; return pad(Math.floor(m/60)) + ':' + pad(m%60); };
const durTxt = m => { m = Math.round(m); const h = Math.floor(m/60); return h ? `${h} h ${pad(m%60)} min` : `${m} min`; };
const toR = Math.PI/180;
function distNm(a,b){ const R=3440.065; const dLat=(b.lat-a.lat)*toR, dLon=(b.lon-a.lon)*toR; const h=Math.sin(dLat/2)**2+Math.cos(a.lat*toR)*Math.cos(b.lat*toR)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function bearing(a,b){ const y=Math.sin((b.lon-a.lon)*toR)*Math.cos(b.lat*toR); const x=Math.cos(a.lat*toR)*Math.sin(b.lat*toR)-Math.sin(a.lat*toR)*Math.cos(b.lat*toR)*Math.cos((b.lon-a.lon)*toR); return (Math.atan2(y,x)/toR+360)%360; }
function dateOf(day){ const d=new Date(DAY0+(day-1)*864e5); return d; }
function dateTxt(day){ const d=dateOf(day); return d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}); }
function monthOf(day){ return dateOf(day).getUTCMonth(); } // 0-11
function wpickArr(arr){ const tot=arr.reduce((s,a)=>s+(a.w||1),0); let r=Math.random()*tot; for(const a of arr){ r-=(a.w||1); if(r<=0) return a; } return arr[arr.length-1]; }
function longestRwy(ap){ return ap.water ? 0 : Math.max(...ap.rw.map(r=>r[1])); }
const isUS = code => /^(K|TJ|TI|P)/.test(code);

/* ---------- State ---------- */
function newState(name, call){
  const hangar = {}; Object.keys(AC).forEach(k=>hangar[k]=true);
  const rep = {}; Object.keys(CAST).forEach(k=>rep[k]=10);
  return { v:1, savedAt:Date.now(), created:Date.now(),
    pilot:{name:name||'Pilot', call:call||''},
    day:1, clock:480, duty:0, loc:'TNCM', cash:1200, minutes:0, flights:0, reputation:20,
    ratings:{PPL:true}, types:{}, visited:{TNCM:true}, cooldown:{},
    rep, hangar, jobs:[], jobsKey:'', active:null, last:null,
    log:[], journal:[{id:uid(), day:1, clock:480, title:`Arrived in St. Martin`, text:`Fresh license, 62 hours in the logbook, and a trainee job at Coral Wing Air. The trade winds are blowing and the water is every color of blue.`, chars:['mari','dez'], kind:'story'}],
    story:{done:{}, flags:{}}, voucher:0, company:null, stats:{butter:0,smooth:0,firm:0,hard:0,crash:0,nm:0,diverts:0,scen:0},
    employer:'coral' };
}
function hasRating(st,r){ return !!st.ratings[r]; }
function ratingsOk(st, list){ return (list||[]).every(r=>hasRating(st,r)); }
function allowedRegions(st){ return Object.keys(REGIONS).filter(r=>{ const u=REGIONS[r].unlock; return !u || hasRating(st,u) || (r==='LONG' && hasRating(st,'ATP')); }); }
function canFly(st, acId){ const a=AC[acId]; return a && st.hangar[acId] && ratingsOk(st, a.req); }
function eligibleAircraft(st){ return Object.keys(AC).filter(k=>canFly(st,k)); }
function apOk(st, code, acId){
  const ap=AP[code]; if(!ap) return false; const a=AC[acId];
  if(ap.water) return !!a.water && hasRating(st,'SEA');
  if(ap.q && !hasRating(st, ap.q)) return false;
  return longestRwy(ap) >= a.rwy;
}
function isNight(min){ const m=((min%1440)+1440)%1440; return m >= 1125 || m < 345; } // after 18:45 or before 05:45
function timeLabel(min){ const m=((min%1440)+1440)%1440; if(m<345||m>=1125) return 'Night'; if(m<480) return 'Dawn'; if(m>=1020) return 'Sunset'; return 'Day'; }

/* ---------- Weather ---------- */
function wxWeights(st){
  const mo = monthOf(st.day);
  if(mo>=7 && mo<=9) return {trades:30,calm:10,dust:10,showers:20,wave:15,tstorm:15};
  if(mo>=10 || mo<=2) return {trades:40,calm:15,showers:15,north:20,wave:5,tstorm:5};
  return {trades:40,calm:15,dust:20,showers:15,wave:5,tstorm:5};
}
function genWx(st, code, force, depMin){
  let key = force;
  if(!key){ const w=wxWeights(st); let tries=0; do{ const arr=Object.keys(w).map(k=>({k,w:w[k]})); key=wpickArr(arr).k; tries++; } while(WX[key].ifr && !hasRating(st,'IR') && tries<8); if(WX[key].ifr && !hasRating(st,'IR')) key='trades'; }
  const p = WX[key];
  if(key==='calm' && depMin && depMin>660){ /* calm mornings only */ }
  let dir = Math.round(rnd(p.dir[0],p.dir[1])/10)*10 % 360; if(dir===0) dir=360;
  const spd = ri(p.spd[0],p.spd[1]);
  const gust = Math.random()<p.gust ? spd + ri(5,10) : 0;
  const t = ri(p.t[0],p.t[1]);
  const td = t - ri(4,9);
  const qnh = ri(1011,1018) - (p.ifr?ri(2,5):0);
  return { key, n:p.n, cat:p.cat, ifr:!!p.ifr, desc:p.desc, dir, spd, gust, vis:p.vis, wx:p.wx||'', cl:p.cl, t, td, qnh };
}
function metar(code, wx, day, min){
  const d = dateOf(day).getUTCDate(); const zulu = (min + 240) % 1440; // islands are UTC-4
  const us = isUS(code) || AP[code].c==='BES' && false;
  const wind = (wx.spd<3 ? '00000' : pad3(wx.dir)+pad(wx.spd)+(wx.gust?'G'+pad(wx.gust):'')) + 'KT';
  const vis = us ? (wx.vis>=10?'10SM':wx.vis+'SM') : (wx.vis>=10?'9999':String(Math.min(9999,Math.round(wx.vis*1609/100)*100)).padStart(4,'0'));
  const cl = wx.cl.map(c=>c[0]+pad3(Math.round(c[1]/100))+(c[2]||'')).join(' ');
  const temps = `${tmp(wx.t)}/${tmp(wx.td)}`;
  const alt = us ? 'A'+Math.round(wx.qnh*2.953).toString().padStart(4,'0') : 'Q'+wx.qnh;
  return `${AP[code].water?'(nearest station)':code} ${pad(d)}${pad(Math.floor(zulu/60))}${pad(zulu%60)}Z ${wind} ${vis}${wx.wx?' '+wx.wx:''} ${cl} ${temps} ${alt}`.replace(/\s+/g,' ');
}
function pad3(n){ return String(Math.round(n)).padStart(3,'0'); }
function tmp(t){ return (t<0?'M':'') + pad(Math.abs(t)); }
function rwyAnalysis(code, wx, acId){
  const ap=AP[code]; if(ap.water) return { water:true, head: wx.spd, xw:0, rw:`into the wind (${pad3(wx.dir)}°)` };
  let best=null;
  for(const [des,len] of ap.rw){
    for(const end of des.split('/')){
      const hdg = parseInt(end,10)*10; const diff=(wx.dir-hdg)*toR;
      const head = wx.spd*Math.cos(diff), xw=Math.abs(wx.spd*Math.sin(diff)), gxw = wx.gust?Math.abs(wx.gust*Math.sin(diff)):0;
      if(!best || head>best.head) best={rw:end, len, hdg, head, xw, gxw};
    }
  }
  const a = acId ? AC[acId] : null;
  best.over = a ? Math.max(best.xw,best.gxw) > a.xw : false;
  return best;
}
function densityAlt(el, t, qnh){ const pa = el + (1013-qnh)*30; const isa = 15 - 2*el/1000; return Math.round(pa + 120*(t-isa)); }

/* ---------- Planning ---------- */
function plan(job){
  const a=AC[job.ac]; const from=AP[job.from], to=AP[job.to];
  const dist = job.local ? (job.tourNm||40) : distNm(from,to);
  const est = Math.round(dist/a.cruise*60 + CLS[a.cls].over + (job.local?5:0));
  const ifr = job.wx.ifr || isNight(job.dep);
  const reserveMin = ['airliner','widebody','regional'].includes(a.cls) ? 30 : (ifr ? 45 : 30);
  let altCode=null, altNm=0;
  if(!job.local){ let bestD=1e9; for(const k in AP){ if(k===job.to||AP[k].water) continue; if(longestRwy(AP[k])<a.rwy) continue; const d=distNm(to,AP[k]); if(d<bestD&&d>5){bestD=d;altCode=k;} } altNm=Math.round(bestD); }
  const altMin = altCode ? Math.round(altNm/a.cruise*60 + 8) : 0;
  const tripLb = a.burn*est/60, contLb = tripLb*0.1, resLb = a.burn*reserveMin/60, altLb = (ifr||a.cls==='airliner'||a.cls==='widebody') ? a.burn*altMin/60 : 0;
  const fuelLb = Math.round(tripLb+contLb+resLb+altLb + (a.burn*0.08));
  const density = a.fuel==='avgas'?6:6.7;
  const paxLb = (job.pax||0)*(a.cls==='airliner'||a.cls==='widebody'?185:190), bagLb=(job.pax||0)*(a.cls==='airliner'||a.cls==='widebody'?40:25)*(job.airline?1:0.6);
  const payload = Math.round(paxLb + bagLb + (job.cargo||0) + 170); // + pilot
  const total = payload + (a.fuel==='elec'?0:fuelLb);
  return { dist:Math.round(dist), hdg:job.local?null:Math.round(bearing(from,to)), est, ifr, reserveMin, altCode, altNm, altMin,
    tripLb:Math.round(tripLb), contLb:Math.round(contLb), resLb:Math.round(resLb), altLb:Math.round(altLb), fuelLb, gal:Math.round(fuelLb/density), density,
    paxLb:Math.round(paxLb), bagLb:Math.round(bagLb), payload, total, useful:a.useful, over: Math.max(0,total-a.useful), range: dist <= a.range };
}


/* ---------- Job generation ---------- */
function pickDest(st, from, acId, arch, targetNm){
  const regions = allowedRegions(st); const a=AC[acId]; const out=[];
  for(const code in AP){
    if(code===from) continue; const ap=AP[code];
    if(!regions.includes(ap.r)) continue;
    if(ap.water && !(arch.id==='dive'||arch.id==='honeymoon'||arch.id==='realestate'||arch.id==='film')) continue;
    if(!apOk(st, code, acId)) continue;
    if(arch.airline && longestRwy(ap) < 6500) continue;
    const d = distNm(AP[from], ap); if(d < 8 || d > a.range*0.8) continue;
    out.push({code, d});
  }
  if(!out.length) return null;
  out.sort((x,y)=>Math.abs(x.d-targetNm)-Math.abs(y.d-targetNm));
  return pick(out.slice(0, Math.min(4,out.length))).code;
}
function targetMinutes(){ const r=Math.random(); return r<0.12 ? ri(15,22) : r<0.82 ? ri(22,60) : ri(60,150); }
function makeJob(st, arch, fleetOnly){
  let acs = fleetOnly ? fleetTypes(st) : eligibleAircraft(st);
  acs = acs.filter(k=>arch.cls.includes(AC[k].cls) && AC[k].pax >= arch.pax[0] && (!arch.cargo || AC[k].useful > arch.cargo[0]+200));
  if(!acs.length) return null;
  const fresh = acs.filter(k=>!st.types[k]);
  let acId = (fresh.length && Math.random()<0.3) ? pick(fresh) : pick(acs);
  const a = AC[acId];
  let to = st.loc, tourNm=0;
  if(arch.local){ tourNm = ri(25,60); }
  else if(arch.id==='festival'){ const fe=festivalOn(st)[0]; if(!fe || fe.ap===st.loc || !apOk(st,fe.ap,acId) || distNm(AP[st.loc],AP[fe.ap]) > a.range*0.8) return null; to=fe.ap; }
  else {
    const tgt = Math.max(15, (targetMinutes() - CLS[a.cls].over) * a.cruise/60);
    to = pickDest(st, st.loc, acId, arch, arch.airline? Math.max(tgt, 300) : tgt); if(!to) return null;
  }
  const pax = arch.pax[1] ? ri(arch.pax[0], Math.min(arch.pax[1], a.pax)) : 0;
  let cargo = arch.cargo ? ri(arch.cargo[0], arch.cargo[1]) : 0;
  const now = st.clock; let dep = now + ri(20, 240);
  if(arch.id==='sunset'){ dep = Math.max(now+20, 1035); }
  dep = Math.round(dep/5)*5;
  const night = isNight(dep);
  if(night && !hasRating(st,'COMM')) dep = Math.max(now+20, 420); // trainees don't fly at night
  const wx = genWx(st, to, null, dep);
  const job = { id:uid(), kind:'gen', arch:arch.id, label:arch.label, cat:arch.kind, from:st.loc, to, local:!!arch.local, tourNm, ac:acId, pax, cargo, dep, wx,
    urgent:!!arch.urgent, vip:!!arch.vip, airline:!!arch.airline, company:!!fleetOnly };
  // keep payload legal: trim cargo first
  let p = plan(job); if(p.over>0){ job.cargo = Math.max(0, cargo - p.over - 20); p = plan(job); }
  if(p.over>0 || !p.range) return null;
  if(Math.random()<0.08){ const sc = scenFor(job); if(sc) job.scen = sc; }
  const ctx = { from:AP[st.loc], fromCode:st.loc, to:AP[to], toCode:to, ac:a, pax:job.pax, cargo:job.cargo };
  const s = arch.story(ctx); job.title=s.title; job.client=s.client; job.paras=s.paras;
  job.pay = payFor(st, job); job.est = p.est;
  return job;
}
function scenFor(job){
  const a=AC[job.ac]; const twin = ['twin'].includes(a.cls) || ['DHC6','KA350','DA62','GOOSE','DC3'].includes(job.ac);
  const keys = Object.keys(SCEN).filter(k=>{ const s=SCEN[k]; if(['calloway_mayday','runway_short'].includes(k)) return false; if(s.twin && !twin) return false; if(s.pax && !job.pax) return false; if(s.cls!=='*' && !s.cls.includes(a.cls)) return false; if(job.local && (s.divert && !s.returnHome)) return false; if(job.airline) return ['runway_closed','pax_medical','squall','pressurization'].includes(k); return true; });
  return keys.length ? pick(keys) : null;
}
function archOk(st, arch){
  if(arch.need && !hasRating(st, arch.need)) return false;
  if(arch.minRep && st.reputation < arch.minRep) return false;
  if(arch.region && AP[st.loc].r!==arch.region) return false;
  if(arch.season){ const mo=monthOf(st.day); if(mo<7||mo>9) return false; }
  return true;
}
function genJobs(st){
  const jobs=[]; const arcs = ARCH.filter(a=>archOk(st,a)).map(a=>({...a,w:archWeight(st,a)})).filter(a=>a.w>0);
  let tries=0;
  while(jobs.length<6 && tries<80){ tries++; const arch=wpickArr(arcs); const j=makeJob(st, arch, false); if(j && !jobs.some(x=>x.to===j.to && x.arch===j.arch)) jobs.push(j); }
  if(st.company && fleetTypes(st).length){ let t=0, n=0; while(n<3 && t<40){ t++; const arch=wpickArr(arcs); const j=makeJob(st, arch, true); if(j){ jobs.push(j); n++; } } }
  return decorateJobs(st, jobs).sort((x,y)=>x.dep-y.dep);
}
function ensureJobs(st){ const key = st.loc+'|'+st.day; if(st.jobsKey!==key){ st.jobs = genJobs(st); st.jobsKey=key; } }

/* ---------- Story & checkride jobs ---------- */
var storyAvailable; /* defined in full below (050-core.js) */

function storyJob(st, m, acId){
  const wx = genWx(st, m.to, m.wx, m.dep);
  const job = { id:'S-'+m.id, kind:'story', story:m.id, title:m.title, label:m.arc, cat: m.cargo>m.pax*190?'cargo':'pax', from:m.from, to:m.to, local:!!m.local, tourNm:m.local?45:0,
    ac:acId, pax:m.pax, cargo:m.cargo, cargoLabel:m.cargoLabel, dep:m.dep, wx, scen:m.scen||null, paras:m.brief, teachStory:m.teach, chars:m.chars, airline:!!m.airline, client:CAST[m.chars[0]]?.n||'' };
  job.pay = payFor(st, job); job.est = plan(job).est; return job;
}
function checkrideReady(st, rid){
  const R=RATINGS[rid]; if(!R.req || st.ratings[rid]) return {ok:false, earned:!!st.ratings[rid]};
  const r=R.req, miss=[];
  (r.after||[]).forEach(x=>{ if(!st.ratings[x]) miss.push(`${RATINGS[x].n} first`); });
  if(r.hours && st.minutes/60 < r.hours) miss.push(`${r.hours} career hours (you have ${(st.minutes/60).toFixed(1)})`);
  if(r.flights && st.flights < r.flights) miss.push(`${r.flights} flights (you have ${st.flights})`);
  if(r.cash && st.cash < r.cash) miss.push(`${money(r.cash)} in the bank`);
  if(st.cooldown[rid] && st.cooldown[rid] > st.day) miss.push(`a day's rest before a retest`);
  return {ok:!miss.length, miss};
}
function checkrideAircraft(st, rid){
  const R=RATINGS[rid];
  let list = R.ac ? R.ac.slice() : Object.keys(AC).filter(k=>['stol','ga','turbo'].includes(AC[k].cls));
  list = list.filter(k=>st.hangar[k]);
  if(R.dest) list = list.filter(k=>AC[k].rwy <= longestRwy(AP[R.dest]) && hasAllButTarget(st,k,rid));
  else list = list.filter(k=>hasAllButTarget(st,k,rid));
  return list;
}
function hasAllButTarget(st,k,rid){ return AC[k].req.every(r=>r===rid || st.ratings[r]); }
function checkrideJob(st, rid, acId){
  const R=RATINGS[rid]; let to = st.loc, local=true;
  if(R.dest){ to=R.dest; local=false; }
  if(R.water){ let best=null,bd=1e9; for(const k in AP){ if(!AP[k].water) continue; const d=distNm(AP[st.loc],AP[k]); if(d<bd){bd=d;best=k;} } if(best && bd < AC[acId].range*0.6){ to=best; local=false; } }
  if(R.hub){ let best=null,bd=1e9; for(const k in AP){ if(k===st.loc||AP[k].water||longestRwy(AP[k])<7000) continue; const d=distNm(AP[st.loc],AP[k]); if(d>80&&d<bd){bd=d;best=k;} } if(best){ to=best; local=false; } }
  const dep = Math.round((st.clock + 45)/5)*5;
  const wx = genWx(st, to, R.wx || (rid==='IR'?'wave':'trades'), dep);
  const ex = CAST[R.examiner||'wilkins'];
  const job = { id:'C-'+rid, kind:'check', rating:rid, title:`${R.n} checkride`, label:`Checkride`, cat:'check', from:st.loc, to, local, tourNm: local?35:0, ac:acId,
    pax:1, cargo:0, dep, wx, scen:R.scen||null, tasks:R.tasks, client:ex.n, chars:[R.examiner||'wilkins'],
    paras:[`${ex.n} meets you at the aircraft with a clipboard. ${ex.bio}`, `"Fly it like I'm not here," she says. ${R.n} unlocks: ${R.unlocks}`] };
  if(R.examiner==='devries') job.paras = [`Inspector Henk de Vries arrives with a thermos of tea and a clipboard. "Saba forgives nothing," he says, "so neither do I. But I am very fair."`, `He'll ride in the right seat for the whole flight. Pass, and you can land at the shortest commercial runway in the world. ${R.unlocks}`];
  if(R.examiner==='marchetti') job.paras = [`Capitaine Hélène Marchetti flew Twin Otters into St. Barth for twenty years. She looks at your airplane, then at you, and says only, "We go."`, `Pass, and you're cleared for one of the most famous approaches anywhere. ${R.unlocks}`];
  job.pay = 0; job.est = plan(job).est; return job;
}

/* ---------- Company ---------- */
function fleetTypes(st){ if(!st.company) return []; return [...new Set(st.company.fleet.filter(f=>!f.hired).map(f=>f.ac))].filter(k=>canFly(st,k)); }
function loanTerms(price){ const down = Math.round(price*0.15); const principal = price-down; const total = principal*1.3; return { down, principal, daily: Math.round(total/1825), total:Math.round(total) }; }

function regFor(st){ const c=st.company; const pre = {SXM:'PJ-',MAF:'F-O',BLM:'F-O',AIA:'VP-A',ATG:'V2-',KNA:'V4-',BRB:'8P-',LCA:'J6-',VCT:'J8-',GRD:'J3-',TTO:'9Y-',ABW:'P4-',CUW:'PJ-',BES:'PJ-',MSR:'VP-M',GLP:'F-O',MTQ:'F-O',DMA:'J7-',VGB:'VP-L',BHS:'C6-',TCA:'VQ-T',CYM:'VP-C',JAM:'6Y-',DOM:'HI'}[AP[c.base].c]||'N';
  const n = c.fleet.length+1; const letters = (c.name.replace(/[^A-Za-z]/g,'').toUpperCase()+'XXX').slice(0,2);
  return pre==='N' ? `N${100+n*7}${letters}` : `${pre}${letters}${String.fromCharCode(64+((n-1)%26)+1)}`; }

/* ---------- Debrief & scoring ---------- */
const LANDING = { butter:{n:`Butter (under 100 fpm)`,pts:30}, smooth:{n:`Smooth (100–200 fpm)`,pts:26}, firm:{n:`Firm (200–350 fpm)`,pts:18}, hard:{n:`Hard (350–600 fpm)`,pts:6}, crash:{n:`Damage or crash`,pts:-40} };
function gradeOf(score){ return score>=90?'A':score>=78?'B':score>=62?'C':score>=45?'D':'F'; }
function score(job, f){
  const a=AC[job.ac], p=plan(job); const parts=[];
  const L = LANDING[f.landing]||LANDING.firm; parts.push([`Landing`, L.pts, 30]);
  if(f.landing==='crash'){ return { score:0, grade:'F', parts:[[`Landing`,-40,30]], crash:true, fuelMin:0, block:f.block }; }
  parts.push([`Touchdown zone`, f.tdz?10:3, 10]);
  parts.push([`Centerline / alignment`, f.center?5:2, 5]);
  let fuelMin;
  if(a.fuel==='elec'){ fuelMin = (f.fuel/100)*90; parts.push([`Battery reserve`, f.fuel>=20?15:f.fuel>=10?6:-10, 15]); }
  else { const lb = f.fuelUnit==='gal' ? f.fuel*p.density : f.fuelUnit==='kg' ? f.fuel*2.2046 : f.fuel; fuelMin = a.burn ? lb/a.burn*60 : 999; const r=p.reserveMin; parts.push([`Fuel reserve (${Math.round(fuelMin)} min left, ${r} required)`, fuelMin>=r?15:fuelMin>=r*0.5?6:-10, 15]); }
  const slow = f.block > p.est*1.3 + 8; parts.push([`Block time vs plan (${durTxt(f.block)} vs ${durTxt(p.est)})`, f.diverted ? 8 : slow?4:10, 10]);
  const pr = ['checklist','radio','weather','smooth'].filter(k=>f[k]).length*5; parts.push([`Airmanship`, pr, 20]);
  if(job.kind==='check'){ const n=job.tasks.length, done=(f.tasks||[]).length; parts.push([`Checkride tasks (${done}/${n})`, Math.round(10*done/n), 10]); }
  else if(job.scen){ const s=SCEN[job.scen]; let how=f.scen||'book'; const landed=f.landedAt||job.to; let label=s.n;
    if(s.divert && how==='book' && !job.local && (s.returnHome ? landed!==job.from : landed===job.to)){ how='messy'; label=`${s.n} (by the book meant ${s.returnHome?'returning to '+job.from:'diverting'})`; }
    const m={book:10, messy:5, ignored:-10}[how]; parts.push([label, m, 10]); }
  else parts.push([`Passenger experience`, f.landing==='hard'?3:10, 10]);
  let total = parts.reduce((s,p)=>s+p[1],0); total = clamp(Math.round(total),0,100);
  return { score:total, grade:gradeOf(total), parts, fuelMin:Math.round(fuelMin), block:f.block };
}
function applyResult(st, job, f, res){
  const a=AC[job.ac]; const p=plan(job); const sc = job.scen?SCEN[job.scen]:null;
  const out = { id:job.id, title:job.title, grade:res.grade, score:res.score, parts:res.parts, pay:0, costs:0, notes:[], ok:true, story:'', jobKind:job.kind };
  const landedAt = f.landedAt || job.to;
  const expectedDivert = sc && sc.divert;
  const divertedOk = landedAt!==job.to && (expectedDivert || f.scen==='book');
  // pay
  let factor = 0.6 + res.score/100*0.6;
  if(res.crash){ factor=0; out.ok=false; }
  else if(landedAt!==job.to && !job.local && !divertedOk){ factor*=0.4; out.notes.push(`You landed at ${landedAt} instead of ${job.to}, so the client pays only part of the fare.`); }
  else if(landedAt!==job.to && !job.local){ out.notes.push(`Diverting was the right call. The client pays in full, and Coral Wing arranges onward transport.`); st.stats.diverts++; }
  if(job.kind==='check'){
    const n=job.tasks.length, done=(f.tasks||[]).length;
    const pass = !res.crash && res.score>=70 && done/n>=0.8 && f.landing!=='hard';
    out.pass = pass;
    if(pass){ st.ratings[job.rating]=true; out.notes.push(`Passed. You now hold the ${RATINGS[job.rating].n}.`); addJournal(st,`Earned: ${RATINGS[job.rating].n}`, `${CAST[job.chars[0]].n} signs the logbook. ${RATINGS[job.rating].unlocks}`, job.chars, 'milestone'); st.rep[job.chars[0]] = clamp(st.rep[job.chars[0]]+5,0,100); }
    else { st.cooldown[job.rating] = st.day+1; out.notes.push(`Not this time. You need a score of 70 or more, at least 80% of the tasks done, and no hard landing. You can retest after a day's rest.`); }
  } else {
    let gross = Math.round(job.pay*factor);
    if(job.company){ const rev = Math.round(gross*2.6); const cb = companyFlightCost(st, job, res.block); const cost = cb.total; out.pay = rev; out.costs = cost; out.costBreak = cb; txn(st, rev, 'Company revenue', job.title); txn(st, -cb.fuel, 'Fuel', job.title); txn(st, -cb.maint, 'Maintenance', job.title); txn(st, -cb.fees, 'Landing & handling fees', job.title); const f2 = st.company.fleet.find(x=>x.ac===job.ac && !x.hired); if(f2){ f2.cond = Math.max(30, f2.cond - (f.landing==='hard'?6:f.landing==='firm'?1.2:0.6)); f2.flights=(f2.flights||0)+1; } }
    else { out.pay = gross; txn(st, gross, 'Flight pay', job.title); }
    if(res.grade==='A' && !res.crash){ const bonus = Math.round(job.pay*0.1/10)*10; if(!job.company && bonus>0){ txn(st, bonus, 'Tips & bonuses', 'Client tip'); out.notes.push(`Client tip for an excellent flight: ${money(bonus)}.`); out.pay += bonus; } }
  }
  if(res.crash){ const fine = Math.round(Math.max(2000, (a.price||5e6)*0.002)); txn(st, -fine, 'Accidents & fines', job.title); out.costs += fine; out.notes.push(`Accident investigation, insurance excess and repairs: ${money(fine)}.`); st.stats.crash++; }
  // reputation
  const repDelta = res.crash?-12 : {A:3,B:2,C:0,D:-2,F:-4}[res.grade];
  st.reputation = clamp(st.reputation + repDelta, 0, 100);
  // story
  if(job.kind==='story'){
    const m = STORY.find(x=>x.id===job.story);
    if(!res.crash){ st.story.done[m.id]=true; }
    const tone = res.crash ? 'bad' : (res.grade==='A'||res.grade==='B') ? 'good' : res.grade==='C' ? 'ok' : 'bad';
    out.story = res.crash ? `The mission ends with an accident report instead of a happy client. You can try this chapter again.` : m.out[tone];
    if(!res.crash){ for(const k in (m.rep||{})){ st.rep[k] = clamp((st.rep[k]||10) + (tone==='bad'? Math.round(m.rep[k]/3) : m.rep[k]), 0, 100); } }
    if(!res.crash && m.reward){ if(m.reward.voucher){ st.voucher = m.reward.voucher; } if(m.reward.bonus){ txn(st, m.reward.bonus, 'Gifts & windfalls', m.title); out.pay += m.reward.bonus; } if(m.reward.note) out.notes.push(m.reward.note); }
    addJournal(st, `${m.title}`, out.story, m.chars, 'story', res.grade);
  } else if(job.kind==='gen'){
    const line = res.crash ? `The ${job.label.toLowerCase()} ended badly at ${landedAt}.` : `${job.client}: ${job.label.toLowerCase()} from ${AP[job.from].isl} to ${AP[landedAt].isl}, grade ${res.grade}.`;
    const ar = ARCH.find(x=>x.id===job.arch); if(ar && ar.char && !res.crash){ st.rep[ar.char] = clamp((st.rep[ar.char]||10) + ({A:4,B:3,C:1,D:0,F:-2}[res.grade]), 0, 100); }
    addJournal(st, job.title, line, ar&&ar.char?[ar.char]:[], 'flight', res.grade);
  }
  // logbook & stats
  if(f.verified){ out.notes.push(`Recorded by MSFS: touchdown at ${f.simFpm} fpm${f.simBounces?`, with ${f.simBounces} bounce${f.simBounces>1?'s':''}`:''}.`); }
  st.minutes += res.block; st.flights += 1; st.stats[f.landing] = (st.stats[f.landing]||0)+1; st.stats.nm += p.dist; if(job.scen && f.scen==='book') st.stats.scen++;
  const firstType = !st.types[job.ac]; st.types[job.ac] = (st.types[job.ac]||0) + 1; if(firstType && !res.crash) out.notes.push(`New type in your logbook: ${a.n}.`);
  const firstAp = !st.visited[landedAt]; st.visited[landedAt]=true; if(firstAp && !AP[landedAt].water) out.notes.push(`First landing at ${AP[landedAt].n}, ${AP[landedAt].isl}.`);
  st.log.unshift({ id:uid(), day:st.day, dep:job.dep, from:job.from, to:landedAt, ac:job.ac, min:res.block, grade:res.grade, score:res.score, pay:out.pay-out.costs, title:job.title, kind:job.kind, landing:f.landing, verified:!!f.verified, fpm:f.verified?f.simFpm:null });
  st.log = st.log.slice(0,300);
  // clock
  const start = Math.max(st.clock, job.dep);
  st.duty += Math.min(60, start - st.clock) + res.block + 30; st.clock = start + res.block + 30;
  st.loc = AP[landedAt].water ? job.from : landedAt; // after a water landing you return to base
  if(AP[landedAt].water) out.notes.push(`After the water landing you fly back to ${job.from} (not logged separately).`);
  st.active = null; st.last = { job, res, out, f };
  if(st.clock >= 1440){ out.notes.push(`It's past midnight. Time to rest.`); }
  afterFlight(st, job, f, res, out);
  st.jobsKey = '';
  return out;
}
function addJournal(st, title, text, chars, kind, grade){ st.journal.unshift({id:uid(), day:st.day, clock:st.clock, title, text, chars:chars||[], kind:kind||'flight', grade}); st.journal = st.journal.slice(0,200); }

function deadheadCost(st, to){ const d = distNm(AP[st.loc], AP[to]); return { cost: Math.round(60 + d*0.55), min: Math.round(d/380*60 + 75), d:Math.round(d) }; }

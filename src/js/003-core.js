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

/* ---------- Story & checkride jobs ---------- */
var storyAvailable; /* defined in full below (050-core.js) */

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

/* ---------- Company ---------- */
function fleetTypes(st){ if(!st.company) return []; return [...new Set(st.company.fleet.filter(f=>!f.hired).map(f=>f.ac))].filter(k=>canFly(st,k)); }
function loanTerms(price){ const down = Math.round(price*0.15); const principal = price-down; const total = principal*1.3; return { down, principal, daily: Math.round(total/1825), total:Math.round(total) }; }

function regFor(st){ const c=st.company; const pre = {SXM:'PJ-',MAF:'F-O',BLM:'F-O',AIA:'VP-A',ATG:'V2-',KNA:'V4-',BRB:'8P-',LCA:'J6-',VCT:'J8-',GRD:'J3-',TTO:'9Y-',ABW:'P4-',CUW:'PJ-',BES:'PJ-',MSR:'VP-M',GLP:'F-O',MTQ:'F-O',DMA:'J7-',VGB:'VP-L',BHS:'C6-',TCA:'VQ-T',CYM:'VP-C',JAM:'6Y-',DOM:'HI'}[AP[c.base].c]||'N';
  const n = c.fleet.length+1; const letters = (c.name.replace(/[^A-Za-z]/g,'').toUpperCase()+'XXX').slice(0,2);
  return pre==='N' ? `N${100+n*7}${letters}` : `${pre}${letters}${String.fromCharCode(64+((n-1)%26)+1)}`; }

/* ---------- Debrief & scoring ---------- */
const LANDING = { butter:{n:`Butter (under 100 fpm)`,pts:30}, smooth:{n:`Smooth (100–200 fpm)`,pts:26}, firm:{n:`Firm (200–350 fpm)`,pts:18}, hard:{n:`Hard (350–600 fpm)`,pts:6}, crash:{n:`Damage or crash`,pts:-40} };
function gradeOf(score){ return score>=90?'A':score>=78?'B':score>=62?'C':score>=45?'D':'F'; }
function addJournal(st, title, text, chars, kind, grade){ st.journal.unshift({id:uid(), day:st.day, clock:st.clock, title, text, chars:chars||[], kind:kind||'flight', grade}); st.journal = st.journal.slice(0,200); }

function deadheadCost(st, to){ const d = distNm(AP[st.loc], AP[to]); return { cost: Math.round(60 + d*0.55), min: Math.round(d/380*60 + 75), d:Math.round(d) }; }

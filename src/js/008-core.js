/* ===================== FINANCE: ledger, banking, housing, fuel, seasons, training, fleet finance, routes ===================== */
const CAT_GROUP = {
  'Flight pay':'in','Company revenue':'in','Route revenue':'in','Tips & bonuses':'in','Gifts & windfalls':'in','Interest earned':'in','Story':'in','Network':'in','Laundered':'in',
  'Fuel':'op','Maintenance':'op','Repairs':'op','Crew wages':'op','Landing & handling fees':'op','Insurance':'op','Hangar & parking':'op','Rent':'op','Travel':'op','Licenses & training':'op','Accidents & fines':'op','Loan interest':'op','Credit interest':'op','Crew':'op','Safehouse':'op','Payoffs':'op','Operation':'op','Overdraft fees':'op',
  'Aircraft purchases':'inv','Aircraft sales':'inv','Loan principal':'fin','Training bond':'fin','Credit line':'fin','Savings':'fin','Owed to Castillo':'fin'
};
function fin(st){ if(!st.fin) st.fin = { savings:0, credit:0, score:680, housing:'bunk', ledger:[], history:[], oil:1, market:null, marketDay:0, bond:0, bondPaid:0, rescue:false }; const F=st.fin; if(!F.tot) F.tot={}; if(!F.days) F.days={}; return F; }
function txn(st, amt, cat, memo){ amt=Math.round(amt); if(!amt) return; st.cash += amt; const F=fin(st); F.ledger.unshift({ d:st.day, t:st.clock, c:cat, a:amt, m:memo||'' }); if(F.ledger.length>250) F.ledger.length=250;
  F.tot[cat]=(F.tot[cat]||0)+amt; const dd=F.days[st.day]=F.days[st.day]||{}; dd[cat]=(dd[cat]||0)+amt; for(const k in F.days){ if(+k < st.day-60) delete F.days[k]; } }
function totalEarned(st){ const T=fin(st).tot||{}; return Object.keys(T).filter(k=>CAT_GROUP[k]==='in').reduce((a,k)=>a+Math.max(0,T[k]),0); }
function move(st, amt, cat, memo){ // transfers (savings, credit, bonds) shown in the list but not counted as income or expense
  const F=fin(st); F.ledger.unshift({ d:st.day, t:st.clock, c:cat, a:Math.round(amt), m:memo||'', transfer:true }); if(F.ledger.length>250) F.ledger.length=250; }

/* ---------- seasons & fuel ---------- */
function demandIndex(st){ const m=monthOf(st.day); return [1.25,1.3,1.3,1.2,1.0,0.95,0.95,0.95,0.72,0.75,0.95,1.25][m]; }
function seasonName(st){ const d=demandIndex(st); return d>=1.2?'High season':d>=0.95?'Shoulder season':'Low season'; }
function hash01(str){ let h=2166136261; for(const ch of str){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return ((h>>>0)%1000)/1000; }
function fuelPrice(st, code, type){
  const ap=AP[code]; const F=fin(st); const us = ap.c==='USA', eu = ['GBR','FRA','NLD','ESP'].includes(ap.c);
  const small = !ap.water && longestRwy(ap) < 5000;
  let base = type==='avgas' ? (us?6.6:eu?9.4:8.1) : (us?5.4:eu?6.9:6.3);
  base += small ? 0.9 + hash01(code)*1.4 : hash01(code)*0.7;
  base *= F.oil * (1 + (hash01(code+st.day)-0.5)*0.04);
  return Math.round(base*100)/100;
}
const FEES = { ga:15, stol:15, amph:20, bush:25, hp:30, twin:45, turbo:70, jet:220, regional:400, airliner:1200, widebody:3000 };
function companyFlightCost(st, job, blockMin){
  const a=AC[job.ac]; const hrs=blockMin/60; const dens = a.fuel==='avgas'?6:6.7;
  const fuel = a.fuel==='elec' ? Math.round(a.burn*0+hrs*90) : Math.round(a.burn*hrs/dens*fuelPrice(st, job.from, a.fuel==='avgas'?'avgas':'jeta'));
  const maint = Math.round(a.op*0.45*hrs); const fees = FEES[a.cls]||50;
  return { fuel, maint, fees, total: fuel+maint+fees };
}

/* ---------- pay (replaces engine version: adds seasonal demand) ---------- */
function payFor(st, job){
  const a=AC[job.ac]; const arch = job.arch ? ARCH.find(x=>x.id===job.arch) : null;
  const dist = job.local ? (job.tourNm||40) : distNm(AP[job.from],AP[job.to]);
  let p = (150 + dist*CLS[a.cls].rate + (job.pax||0)*(a.cls==='airliner'||a.cls==='widebody'?6:25) + (job.cargo||0)*0.4);
  if(arch?.mult) p*=arch.mult; if(job.wx.ifr) p*=1.15; if(isNight(job.dep)) p*=1.15; if(job.urgent) p*=1.1;
  if(!hasRating(st,'COMM') && !job.story) p*=0.55;
  p *= 0.9 + clamp(st.reputation,0,100)/500;
  if(job.story) p*=1.25;
  if(job.cat!=='cargo' && !job.story) p *= demandIndex(st);
  return Math.round(p/10)*10;
}

/* ---------- housing ---------- */
const HOUSING = {
  bunk:{n:`Crew bunk at the hangar`,rent:30,rep:0,blurb:`A cot behind the parts shelves. Dez snores. Iggy watches you sleep.`},
  apt:{n:`Apartment in Philipsburg`,rent:110,rep:1,blurb:`One bedroom above a roti shop, ten minutes from the field. Clients take you a bit more seriously.`},
  condo:{n:`Condo on Simpson Bay`,rent:340,rep:2,blurb:`Lagoon view, pool, and a doorman who knows your name. VIP clients notice.`},
  villa:{n:`Hillside villa above Maho`,rent:950,rep:4,blurb:`You can watch the 747s cross Maho Beach from your terrace. Celeste invites herself over.`}
};

/* ---------- training fees ---------- */
const TRAINING_FEES = { COMM:3500, SEA:1200, Q_SBH:800, Q_SABA:800, IR:4500, ME:3000, TURB:6000, JET:22000, ATP:9000 };
function feeFor(st, rid){ const base = TRAINING_FEES[rid]||0; return (st.cooldown && st.cooldown[rid]) ? Math.round(base*0.5) : base; }

/* ---------- credit ---------- */
function creditLimit(st){ const F=fin(st); return Math.round(2000 + Math.max(0,F.score-550)*60 + st.minutes/60*150); }
function loanRate(st){ const F=fin(st); return clamp(0.04 + (800-F.score)/2500, 0.04, 0.16); }
function scoreDelta(st, d){ const F=fin(st); F.score = clamp(F.score + d, 300, 850); }

/* ---------- aircraft values & loans ---------- */

const CO_PRICE = { ES30:9000000, A320:42000000, B38M:40000000, A321:52000000 };
function acPrice(k){ return AC[k].price || CO_PRICE[k] || 0; }
const CO_UPG = [
  {id:'hangar', n:'Maintenance hangar', cost:350000, day:150, d:'Company repairs 40% cheaper, aircraft wear 30% slower, no hangar fees.'},
  {id:'mkt', n:'Marketing office', cost:200000, day:120, d:'12% more passengers on every route.'},
  {id:'rm', n:'Revenue manager', cost:150000, day:40, d:'Sets every route to its best fare each morning.'},
  {id:'train', n:'Pilot training center', cost:450000, day:200, d:'Hired pilot wages 20% lower, breakdowns half as likely.'},
  {id:'lounge', n:'Premium lounge', cost:600000, day:250, d:'Passengers accept fares about 12% higher.'},
  {id:'charter', n:'VIP charter desk', cost:900000, day:300, d:'Charter-pool aircraft earn 30% more.'}
];
const BASE_COST = 400000, BASE_DAY = 250;
function coUpg(st, id){ return !!(st.company && st.company.upg && st.company.upg[id]); }
function baseOf(st, f){ return (f && f.base) || st.company.base; }
function refitCost(f){ return Math.round(acPrice(f.ac)*0.06/1000)*1000; }
function fairValue(f){ return Math.round(f.value * (0.55 + 0.45*f.cond/100)); }
function amortDaily(principal, apr, years){ const r=apr/365, n=years*365; return principal * r / (1 - Math.pow(1+r, -n)); }
function makeListings(st){
  const types = Object.keys(AC).filter(k=>acPrice(k)>0);
  const notes = [`Ex-flight school, high hours but well kept`,`Owner retiring, motivated seller`,`Hurricane damage, professionally rebuilt`,`Fresh annual inspection, new paint`,`Repossessed by the bank, sold as-is`,`One owner, hangared since new`,`Former island airline aircraft, lots of cycles`,`Engine near overhaul: price reflects it`,`Celebrity-owned, absurd custom interior`,`Bargain from a charter company that folded`];
  const L=[];
  for(let i=0;i<10;i++){ const k=pick(types); const cond = ri(52,97); const age = ri(2,28); const nv=acPrice(k);
    const value = Math.round(nv * Math.pow(0.95, age));
    const fair = Math.round(value*(0.55+0.45*cond/100));
    const price = Math.round(fair * rnd(0.78,1.15) / 1000)*1000;
    L.push({ id:'L'+uid(), ac:k, year: 2026-age, cond, value, fair, price, note: pick(notes), hours: Math.round(age*ri(250,700)) }); }
  return L.sort((a,b)=>a.price-b.price);
}
function ensureMarket(st){ const F=fin(st); if(!F.market || st.day - F.marketDay >= 7){ F.market = makeListings(st); F.marketDay = st.day; } return F.market; }

/* ---------- route economics for aircraft with hired pilots ---------- */
function routeOptions(st, f){ const a=AC[f.ac]; const base=baseOf(st,f);
  return Object.keys(AP).filter(k=>k!==base && !AP[k].water && longestRwy(AP[k])>=a.rwy && !(AP[k].q && !st.ratings[AP[k].q]) && distNm(AP[base],AP[k])<=Math.min(a.range*0.45, 450) && distNm(AP[base],AP[k])>=12)
    .sort((x,y)=>distNm(AP[base],AP[x])-distNm(AP[base],AP[y])); }
function refFare(dist){ return Math.round(90 + dist*1.1); }
const HUBS = ['TNCM','TJSJ','TBPB','MYNN','TAPA','MKJS','MDPC','TNCC','TIST','KFLL','KMIA','MMUN'];
function routeDay(st, f, noisy){
  const a=AC[f.ac]; const base=baseOf(st,f); const to=f.route.to; const d=distNm(AP[base],AP[to]);
  const block = d/a.cruise*60 + CLS[a.cls].over; const rot = clamp(Math.floor(600/(2*block+40)),1,6); const legs = rot*2;
  const attract = (0.3 + hash01(base+to)*0.35 + (HUBS.includes(to)?0.1:0) + (festivalOn(st).some(x=>x.ap===to)?0.3:0)) * (f.refit?1.1:1) * (coUpg(st,'mkt')?1.12:1);
  const seats = a.pax; const fare = f.route.fare; const ref = refFare(d)*(coUpg(st,'lounge')?1.12:1);
  let pax = seats * attract * demandIndex(st) * Math.pow(ref/fare, 1.5);
  // each route has a limited number of travellers a day, shared by your aircraft on it
  const share = Math.max(1, (st.company.fleet||[]).filter(x=>x.hired && x.route && x.route.to===to && baseOf(st,x)===base).length);
  const market = (50 + hash01('m'+base+to)*170 + (HUBS.includes(to)?180:0) + (HUBS.includes(base)?80:0)) * demandIndex(st) * (coUpg(st,'mkt')?1.12:1) * Math.min(1.6, Math.pow(ref/fare, 1.5));
  pax = Math.min(pax, market/share/legs);
  if(noisy) pax *= rnd(0.82,1.15); pax = Math.max(0, Math.min(seats, pax));
  const storm = stormActive(st); const grounded = storm && (AP[to].r===storm.region || AP[base].r===storm.region);
  if(grounded) pax = 0;
  const revenue = Math.round(pax*legs*fare);
  const dens = a.fuel==='avgas'?6:6.7; const price = fuelPrice(st, base, a.fuel==='avgas'?'avgas':'jeta');
  const fuel = grounded?0:Math.round(a.burn*block/60/dens*price*legs);
  const maint = grounded?0:Math.round(a.op*0.45*block/60*legs);
  const fees = grounded?0:Math.round((FEES[a.cls]||50)*legs + pax*legs*(14+fare*0.18));   // landing fees, plus per-passenger handling, taxes and booking costs
  const wage = Math.round(CLS[a.cls].wage*(coUpg(st,'train')?0.8:1));
  return { d:Math.round(d), block:Math.round(block), legs, pax:Math.round(pax*10)/10, lf: seats?pax/seats:0, revenue, fuel, maint, fees, wage, profit: revenue-fuel-maint-fees-wage, grounded };
}
function bestFare(st, f){ let best=null; const d=distNm(AP[baseOf(st,f)],AP[f.route.to]); for(let fare=Math.round(refFare(d)*0.4); fare<=refFare(d)*2.2; fare+=5){ const r=routeDay(st,{...f,route:{...f.route,fare}},false); if(!best||r.profit>best.profit) best={fare,profit:r.profit}; } return best; }

/* ---------- daily tick (replaces engine companyTick) ---------- */
function companyTick(st){
  const c=st.company; if(!c) return null; const before=st.cash; const lines=[];
  const upk = CO_UPG.filter(u=>coUpg(st,u.id)).reduce((t,u)=>t+u.day,0) + ((c.bases||[]).length*BASE_DAY);
  if(upk) txn(st,-upk,'Hangar & parking',`${c.name} facilities`);
  if(coUpg(st,'rm')) c.fleet.forEach(f=>{ if(f.hired && f.route){ const bf=bestFare(st,f); if(bf) f.route.fare=bf.fare; } });
  for(const f of c.fleet){
    const a=AC[f.ac];
    if(f.loan && f.loan.bal>0){ const interest = f.loan.bal*f.loan.rate/365; const principal = Math.min(f.loan.bal, Math.max(0,f.loan.daily-interest)); txn(st,-interest,'Loan interest',f.reg); txn(st,-principal,'Loan principal',f.reg); f.loan.bal = Math.max(0, f.loan.bal-principal); scoreDelta(st, 0.15); }
    txn(st, -f.value*0.012/365, 'Insurance', f.reg);
    if(!coUpg(st,'hangar')) txn(st, -({ga:12,stol:12,amph:15,bush:20,hp:22,twin:30,turbo:45,jet:90,regional:160,airliner:600}[a.cls]||30), 'Hangar & parking', f.reg);
    const wearK = coUpg(st,'hangar')?0.7:1;
    f.value = f.value*(1-0.07/365);
    if(f.aog>0){ f.aog--; lines.push(`${f.reg}: grounded for repairs`); continue; }
    if(f.hired){
      if(f.route){ const r=routeDay(st,f,true); txn(st,r.revenue,'Route revenue',`${f.reg} ${c.base}–${f.route.to}`); txn(st,-r.fuel,'Fuel',f.reg); txn(st,-r.maint,'Maintenance',f.reg); txn(st,-r.fees,'Landing & handling fees',f.reg); txn(st,-r.wage,'Crew wages',f.reg);
        f.cond = Math.max(35, f.cond - r.legs*0.045*wearK); lines.push(r.grounded ? `${f.reg}: grounded by the storm` : `${f.reg}: ${r.legs} legs to ${f.route.to}, ${Math.round(r.lf*100)}% full, ${money(r.profit)}`); }
      else { const rev = Math.round(CLS[a.cls].daily*rnd(0.55,1.25)*demandIndex(st)*(f.cond/100)*(coUpg(st,'charter')?1.3:1)*(f.refit?1.08:1)); txn(st,rev,'Route revenue',`${f.reg} charter pool`); txn(st,-Math.round(CLS[a.cls].wage*(coUpg(st,'train')?0.8:1)),'Crew wages',f.reg); txn(st,-Math.round(rev*0.32),'Fuel',f.reg); f.cond=Math.max(35,f.cond-rnd(0.2,0.6)*wearK); lines.push(`${f.reg}: charter pool`); }
      f.days=(f.days||0)+1;
      if(f.cond<65 && Math.random() < (65-f.cond)/(coUpg(st,'train')?400:200)){ const bill=Math.round(f.value*rnd(0.0008,0.0025)); txn(st,-bill,'Repairs',`${f.reg} unscheduled repair`); f.aog=1; f.cond=Math.min(100,f.cond+8); lines.push(`${f.reg}: broke down (${money(bill)} repair, grounded tomorrow)`); addJournal(st, `${f.reg} is AOG`, `Your ${a.n} broke down on the line. The repair bill is ${money(bill)} and it's grounded for a day. Low condition makes breakdowns more likely.`, ['dez'], 'flight'); }
    }
  }
  const net = Math.round(st.cash-before);
  c.ledger = c.ledger || []; c.ledger.unshift({day:st.day, net, lines}); c.ledger = c.ledger.slice(0,30);
  return net;
}
function finDaily(st){
  const F=fin(st);
  // rent & housing perks
  const H=HOUSING[F.housing]||HOUSING.bunk; txn(st,-H.rent,'Rent',H.n);
  if(st.day%7===0 && H.rep){ st.reputation=clamp(st.reputation+H.rep,0,100); }
  // savings interest (4.5% APY) and credit interest (19.9% APR)
  if(F.savings>0){ const i=F.savings*0.045/365; F.savings+=i; F.interestEarned=(F.interestEarned||0)+i; if(Math.round(F.interestEarned)>=1){ move(st, Math.round(F.interestEarned), 'Interest earned', 'Savings interest (kept in savings)'); F.interestEarned=0; } }
  if(F.credit>0){ const i=F.credit*0.199/365; txn(st,-i,'Credit interest','Credit line'); }
  // oil price random walk, mean-reverting
  F.oil = clamp(F.oil + (1-F.oil)*0.05 + rnd(-0.025,0.025), 0.7, 1.45);
  // overdraft: draw on the credit line, or Mari's rescue loan
  if(st.cash<0){ const need=-st.cash; const room=creditLimit(st)-F.credit;
    if(room>=need){ F.credit+=need; st.cash+=need; move(st, need,'Credit line','Automatic overdraft draw'); txn(st,-35,'Overdraft fees','Overdraft'); scoreDelta(st,-12); }
    else if(!F.rescue){ F.rescue=true; const amt=need+3000; st.cash+=amt; F.bond+=amt; move(st, amt,'Training bond','Emergency loan from Mari'); addJournal(st, `Mari bails you out`, `You're broke. Mari slides an envelope across the desk: ${money(amt)}. "Pay me back out of your flights. Twenty percent a flight. And stop buying airplanes you can't afford."`, ['mari'], 'milestone'); }
    else { scoreDelta(st,-20); } }
  ensureMarket(st);
  F.history.push({ d:st.day, cash:Math.round(st.cash), net:Math.round(netWorth(st)) }); if(F.history.length>400) F.history.shift();
}
function finAfterFlight(st, job, f, res, out){
  const F=fin(st);
  if(F.bond>0 && out.pay>0 && !job.company){ const cut=Math.min(F.bond, Math.round(out.pay*0.2)); F.bond-=cut; txn(st,-cut,'Training bond','20% of flight pay'); out.notes.push(`Training bond repayment: ${money(cut)} (${money(F.bond)} left).`); if(F.bond<=0){ out.notes.push(`Training bond paid off.`); scoreDelta(st, 15); } }
  if(job.company && out.costBreak){ out.notes.push(`Operating costs: fuel ${money(out.costBreak.fuel)} at ${job.from}, maintenance ${money(out.costBreak.maint)}, fees ${money(out.costBreak.fees)}.`); }
}
function netWorth(st){ const F=fin(st); const fleet = st.company ? st.company.fleet.reduce((s,f)=>s+fairValue(f)-(f.loan?f.loan.bal:0),0) : 0; return st.cash + F.savings + fleet - F.credit - F.bond; }
function debtTotal(st){ const F=fin(st); return F.credit + F.bond + (st.company ? st.company.fleet.reduce((s,f)=>s+(f.loan?f.loan.bal:0),0) : 0); }

/* ---------- migration ---------- */
function finMigrate(st){
  fin(st);
  if(st.company){ for(const f of st.company.fleet){ if(f.value==null){ f.value = f.price||AC[f.ac].price; f.loan = { bal: Math.round((f.loanLeft||0)/1.3), rate:0.07, daily: f.daily||0 }; delete f.loanLeft; } } }
  return st;
}

/* ---------- UI: Money tab ---------- */
function sumBy(st, fromDay){ const F=fin(st); if(!fromDay) return {...F.tot}; const out={}; for(const k in F.days){ if(+k<fromDay) continue; for(const c in F.days[k]) out[c]=(out[c]||0)+F.days[k][c]; } return out; }

/* ---------- UI: Company tab (replaces earlier version) ---------- */
function companyView(){
  const st=S.st; const F=fin(st);
  if(!st.company){
    const chk = checkrideReady(st,'CO'); const R=RATINGS.CO;
    return `<main class="wrap stack fade"><section class="panel stack" style="max-width:760px">
      <p class="label">Own wings</p><h1 style="font-size:32px">Start your own company</h1>
      <p class="brief">An Air Operator Certificate lets you buy aircraft, fly charters under your own name, and put hired pilots on scheduled routes that earn while you rest. Revenue is much bigger. So are the bills: fuel, maintenance, insurance, hangar fees, wages and loan payments.</p>
      ${st.voucher?`<div class="notice"><b>Mari's partnership discount:</b> ${Math.round(st.voucher*100)}% off your first aircraft.</div>`:`<div class="notice small">Coral Wing's story has a chapter called "Mari's Offer" with a big discount on your first aircraft.</div>`}
      <ul class="tight"><li>Commercial Pilot license ${st.ratings.COMM?'<span class="chip good">Done</span>':''}</li><li>${R.req.hours} career hours <span class="mono small">(${(st.minutes/60).toFixed(1)})</span></li><li>${money(R.req.cash)} in the bank <span class="mono small">(${money(st.cash)})</span></li><li>Certificate fee: ${money(R.fee)}</li></ul>
      ${chk.ok ? `<form id="co-form" class="form-grid" style="align-items:end"><label class="field"><span>Company name</span><input id="coname" type="text" required maxlength="40" placeholder="e.g. Leeward Air Charter"></label><div><button class="btn action" type="submit">Apply and pay ${money(R.fee)}</button></div></form>` : `<p class="small muted">Not yet: ${esc((chk.miss||[]).join(' · '))}</p>`}
    </section></main>`;
  }
  const c=st.company; const first = !c.fleet.length && !c.bought; const disc = first && st.voucher ? st.voucher : 0;
  const listings = ensureMarket(st); const rate = loanRate(st);
  const terms = (price) => { const dp = S.downPct||20, yrs = S.loanYrs||5; const down = dp>=100?price:Math.round(price*dp/100); const daily = dp>=100?0:Math.round(amortDaily(price-down, rate, yrs)); return { down, daily, dp, yrs }; };
  const buyCard = (title, acId, price, cond, note, id, fair) => { const a=AC[acId]; const p=Math.round(price*(1-disc)); const t=terms(p); const deal = fair && price < fair*0.92;
    return `<div class="cell stack" style="gap:6px"><div class="row between"><h4>${esc(title)}</h4>${deal?'<span class="chip good">Good deal</span>':fair&&price>fair*1.08?'<span class="chip warn">Overpriced</span>':''}</div>
      <p class="tiny muted">${esc(CLS[a.cls].name)} · ${a.pax} pax · ${a.cruise} kt${canFly(st,acId)?'':' · you can\'t fly it yet, but a hired pilot can'}</p>${note?`<p class="small">${esc(note)}</p>`:''}
      <div class="row between small"><span>Condition</span><span class="mono">${cond}%</span></div><div class="meter ${cond<65?'bad':cond<80?'warn':''}"><i style="width:${cond}%"></i></div>
      <dl class="kv small"><dt>Price</dt><dd>${money(p)}${disc?` <span class="chip good">−${Math.round(disc*100)}%</span>`:''}</dd>${fair?`<dt>Fair value</dt><dd>${money(fair)}</dd>`:''}<dt>${t.dp>=100?'Cash':'Down ('+t.dp+'%)'}</dt><dd>${money(t.down)}</dd>${t.daily?`<dt>Loan</dt><dd>${money(t.daily)}/day · ${t.yrs} yrs · ${(rate*100).toFixed(1)}%</dd>`:''}</dl>
      <button class="btn sm primary" data-act="co-buy" data-src="${id}" ${st.cash<t.down?'disabled':''}>Buy</button></div>`; };
  const newCards = Object.keys(AC).filter(k=>acPrice(k)>0).sort((x,y)=>acPrice(x)-acPrice(y)).map(k=>buyCard(`New ${AC[k].n}`, k, acPrice(k), 100, '', 'new:'+k));
  const usedCards = listings.map(L=>buyCard(`${L.year} ${AC[L.ac].n}`, L.ac, L.price, L.cond, `${L.note} · ${L.hours.toLocaleString()} hours`, 'used:'+L.id, L.fair));
  const fleet = c.fleet.map(f=>{ const a=AC[f.ac]; const fv=fairValue(f); const eq=fv-(f.loan?f.loan.bal:0); const repair=Math.round((100-f.cond)*f.value*0.0004*(coUpg(st,'hangar')?0.6:1));
    const opts = f.hired ? routeOptions(st,f) : []; let routeHTML='';
    if(f.hired){ const r = f.route ? routeDay(st,f,false) : null; const bf = f.route ? bestFare(st,f) : null;
      routeHTML = `<div class="stack" style="gap:6px;border-top:1px dashed var(--line);padding-top:8px"><p class="label">Route for the hired pilot</p>
        <div class="row" style="gap:6px;flex-wrap:wrap"><select data-route-to="${f.fid}" style="width:auto;max-width:100%" aria-label="Route destination"><option value="">Charter pool (no fixed route)</option>${opts.map(k=>`<option value="${k}" ${f.route&&f.route.to===k?'selected':''}>${baseOf(st,f)} ⇄ ${k} · ${esc(AP[k].isl)} (${Math.round(distNm(AP[baseOf(st,f)],AP[k]))} nm)</option>`).join('')}</select><button class="btn sm" data-act="co-bestroute" data-f="${f.fid}" title="Tries every destination at its best fare and picks the most profitable">Find the best route</button></div>
        ${f.route?`<label class="field"><span>Fare per seat, each way: ${money(f.route.fare)} <span class="muted">(market rate ${money(refFare(r.d))})</span></span><input type="range" min="${Math.round(refFare(r.d)*0.4)}" max="${Math.round(refFare(r.d)*2.2)}" step="5" value="${f.route.fare}" data-route-fare="${f.fid}"></label>
          <dl class="kv small"><dt>Schedule</dt><dd>${r.legs} legs/day · ${durTxt(r.block)} each</dd><dt>Load factor</dt><dd>${Math.round(r.lf*100)}% (${r.pax} of ${a.pax} seats)</dd><dt>Revenue</dt><dd>${money(r.revenue)}/day</dd><dt>Costs</dt><dd>fuel ${money(r.fuel)}, maint ${money(r.maint)}, fees ${money(r.fees)}, pilot ${money(r.wage)}</dd><dt>Profit</dt><dd><b style="color:${r.profit<0?'var(--bad)':'var(--good)'}">${money(r.profit)}/day</b> before loan & insurance</dd></dl>
          ${bf && Math.abs(bf.fare-f.route.fare)>10?`<p class="tiny muted">Your revenue manager thinks ${money(bf.fare)} would earn about ${money(bf.profit)}/day.</p>`:''}`:`<p class="tiny muted">Charter pool: the pilot takes whatever charters come up. Steady but unremarkable. Pick a route to set your own fares.</p>`}</div>`; }
    return `<div class="cell stack" style="gap:6px"><div class="row between"><h4 class="mono">${esc(f.reg)}</h4>${f.aog?'<span class="chip bad">AOG</span>':f.hired?'<span class="chip sky">Hired pilot</span>':'<span class="chip">With you</span>'}</div><p class="small">${esc(a.n)}${f.refit?' · <span class="chip good">Refitted cabin</span>':''}</p>
      ${(c.bases||[]).length?`<label class="row small" style="gap:6px">Based at <select data-co-base="${f.fid}" style="width:auto" aria-label="Base for ${esc(f.reg)}">${[c.base,...c.bases].map(k=>`<option value="${k}" ${baseOf(st,f)===k?'selected':''}>${k} · ${esc(AP[k].isl)}</option>`).join('')}</select></label>`:''}
      <div class="row between small"><span>Condition</span><span class="mono">${Math.round(f.cond)}%</span></div><div class="meter ${f.cond<65?'bad':f.cond<80?'warn':''}"><i style="width:${f.cond}%"></i></div>
      <dl class="kv small"><dt>Market value</dt><dd>${money(fv)}</dd><dt>Loan</dt><dd>${f.loan&&f.loan.bal>0?`${money(f.loan.bal)} at ${(f.loan.rate*100).toFixed(1)}% · ${money(f.loan.daily)}/day`:'Paid off'}</dd><dt>Equity</dt><dd>${money(eq)}</dd><dt>Insurance</dt><dd>${money(f.value*0.012/365)}/day</dd></dl>
      <div class="row">${f.hired&&!canFly(st,f.ac)?'':`<button class="btn sm" data-act="co-hire" data-f="${f.fid}">${f.hired?'Take it back':'Hire a pilot'}</button>`}<button class="btn sm" data-act="co-repair" data-f="${f.fid}" ${f.cond>=99||st.cash<repair?'disabled':''}>Repair · ${money(repair)}</button>${f.refit?'':`<button class="btn sm" data-act="co-refit" data-f="${f.fid}" ${st.cash<refitCost(f)?'disabled':''} title="New seats and interior: about 10% more passengers">Refit cabin · ${money(refitCost(f))}</button>`}${f.loan&&f.loan.bal>0?`<button class="btn sm" data-act="co-payoff" data-f="${f.fid}" ${st.cash<f.loan.bal?'disabled':''}>Pay off loan</button>`:''}
        ${S.confirm==='sell-'+f.fid ? `<button class="btn sm danger" data-act="co-sell" data-f="${f.fid}">Sell: ${money(Math.round(fv*0.97))} (${money(Math.round(fv*0.97)-(f.loan?f.loan.bal:0))} after loan)</button><button class="btn sm" data-act="confirm-no">Keep</button>` : `<button class="btn sm ghost" data-act="sell" data-f="${f.fid}">Sell</button>`}</div>${routeHTML}</div>`; }).join('');
  const led=(c.ledger||[]).slice(0,10);
  return `<main class="wrap stack fade">
    <section class="panel"><div class="row between"><div><p class="label">Your company · based at ${esc(c.base)}</p><h1 style="font-size:32px">${esc(c.name)}</h1></div><div class="row" style="gap:22px"><div class="stat"><span class="label">Fleet</span><span class="mono" style="font-size:20px">${c.fleet.length}</span></div><div class="stat"><span class="label">Company value</span><span class="mono" style="font-size:20px" title="Aircraft equity plus facilities and bases at half their cost">${money(companyValue(st))}</span></div><div class="stat"><span class="label">Last day's profit</span><span class="mono" style="font-size:20px">${led[0]?money(led[0].net):'—'}</span></div><div class="stat"><span class="label">Demand</span><span class="mono" style="font-size:20px" title="Charter demand vs. normal (×${demandIndex(st).toFixed(2)})">${seasonName(st).replace(' season','')}</span></div></div></div>
      <p class="small muted" style="margin-top:8px">Aircraft "with you" show up as company jobs on the job board: you collect the full charter fare and pay fuel, maintenance and fees. Aircraft with a hired pilot fly a route or the charter pool every day you rest. Loan payments, insurance and hangar fees come out daily either way. Demand follows the seasons: busy December to April, slow in September and October.</p></section>
    ${c.fleet.length?`<section><div class="section-title"><h2>Fleet</h2></div><div class="cards">${fleet}</div></section>`:''}
    ${led.length?`<section class="panel"><h3>Daily operations log</h3><div class="scroll-x"><table><thead><tr><th>Day</th><th class="num">Net</th><th>Notes</th></tr></thead><tbody>${led.map(l=>`<tr><td class="mono">${l.day}</td><td class="num">${money(l.net)}</td><td class="small" style="white-space:normal">${esc(l.lines.join(' · ')||'Loans, insurance and hangar fees')}</td></tr>`).join('')}</tbody></table></div></section>`:''}
    ${coUpgHTML(st)}
    <section class="panel stack"><div class="row between"><h2>Buy an aircraft</h2><div class="row small"><label class="row" style="gap:6px">Down payment <select id="co-dp" style="width:auto">${[10,20,30,50,100].map(v=>`<option value="${v}" ${(S.downPct||20)===v?'selected':''}>${v===100?'Pay cash':v+'%'}</option>`).join('')}</select></label><label class="row" style="gap:6px">Term <select id="co-yrs" style="width:auto">${[3,5,7,10].map(v=>`<option value="${v}" ${(S.loanYrs||5)===v?'selected':''}>${v} years</option>`).join('')}</select></label></div></div>
      <p class="small muted">Your rate is ${(rate*100).toFixed(1)}% APR, based on a credit score of ${Math.round(F.score)}. Used listings refresh every 7 days (next refresh on day ${F.marketDay+7}). Buy below fair value and you start with equity.</p>
      <h3>Used aircraft</h3><div class="cards">${usedCards.join('')}</div>
      <details><summary>New from the factory</summary><div class="cards" style="margin-top:10px">${newCards.join('')}</div></details></section>
  </main>`;
}

function companyValue(st){ const c=st.company; if(!c) return 0; return Math.round(c.fleet.reduce((t,f)=>t+fairValue(f)-(f.loan?f.loan.bal:0),0) + CO_UPG.filter(u=>coUpg(st,u.id)).reduce((t,u)=>t+u.cost*0.5,0) + (c.bases||[]).length*BASE_COST*0.5); }
function coUpgHTML(st){ const c=st.company; const owned=CO_UPG.filter(u=>coUpg(st,u.id)); const bases=c.bases||[];
  const free=HUBS.filter(k=>AP[k] && k!==c.base && !bases.includes(k));
  const upk=owned.reduce((t,u)=>t+u.day,0)+bases.length*BASE_DAY;
  return `<section class="panel stack"><div class="row between"><div><p class="label">Grow the company</p><h2>Facilities and bases</h2></div><span class="small muted">${owned.length}/${CO_UPG.length} built · ${bases.length} extra base${bases.length===1?'':'s'}${upk?` · upkeep ${money(upk)}/day`:''}</span></div>
    <div class="cards">${CO_UPG.map(u=>{ const has=coUpg(st,u.id); return `<div class="cell stack" style="gap:6px"><div class="row between"><h4>${esc(u.n)}</h4>${has?'<span class="chip good">Built</span>':''}</div><p class="small">${esc(u.d)}</p><p class="tiny muted">${money(u.cost)} · then ${money(u.day)}/day</p>${has?'':`<button class="btn sm primary" data-act="co-upg" data-v="${u.id}" ${st.cash<u.cost?'disabled':''}>Build · ${money(u.cost)}</button>`}</div>`; }).join('')}
      <div class="cell stack" style="gap:6px"><h4>Open a new base</h4><p class="small">Station aircraft at another hub and fly routes from there. Bigger hubs have more travellers.</p><p class="tiny muted">${money(BASE_COST)} · then ${money(BASE_DAY)}/day${bases.length?` · yours: ${bases.join(', ')}`:''}</p>${free.length?`<div class="row" style="gap:6px"><select id="co-newbase" style="width:auto" aria-label="New base">${free.map(k=>`<option value="${k}">${k} · ${esc(AP[k].isl)}</option>`).join('')}</select><button class="btn sm primary" data-act="co-base" ${st.cash<BASE_COST?'disabled':''}>Open · ${money(BASE_COST)}</button></div>`:'<p class="small muted">You have a base at every hub.</p>'}</div></div></section>`; }

/* ---------- goals panel ---------- */
function goalsHTML(st){
  const g=[];
  const nextR = RATING_ORDER.find(r=>r!=='CO' && !st.ratings[r] && (RATINGS[r].req.after||[]).every(x=>st.ratings[x]));
  if(nextR){ const R=RATINGS[nextR]; const ch=checkrideReady(st,nextR); g.push(ch.ok?`<b>${esc(R.n)}</b> checkride is ready (${money(feeFor(st,nextR))}).`:`<b>${esc(R.n)}</b>: ${esc((ch.miss||[]).filter(x=>!/first$/.test(x))[0]||'keep flying')}.`); }
  const locked = STORY.filter(m=>!st.story.done[m.id] && !storyAvailable(st).includes(m) && (!m.req.after || st.story.done[m.req.after]));
  if(locked.length){ const m=locked[0]; const need=[...(m.req.ratings||[]).filter(r=>!st.ratings[r]).map(r=>RATINGS[r].n), ...(m.req.hours&&st.minutes/60<m.req.hours?[`${m.req.hours} hours`]:[])]; if(need.length) g.push(`A new chapter unlocks with: ${esc(need.join(', '))}.`); }
  if(!st.company){ g.push(st.ratings.COMM ? `Own company: ${money(Math.max(0,150000-st.cash))} and ${Math.max(0,25-st.minutes/60).toFixed(1)} hours to go.` : `Earn your Commercial license to start building toward your own company.`); }
  const cs=Object.keys(st.celebs||{}).length; g.push(`Celebrity guestbook: ${cs} of ${CELEB_ORDER.length} met.`);
  const ach = ACH.filter(a=>!(st.ach&&st.ach[a.id])).slice(0,1); if(ach.length) g.push(`Next achievement idea: ${esc(ach[0].n)} (${esc(ach[0].d.toLowerCase().replace(/\.$/,''))}).`);
  return `<div class="panel stack"><h3>Goals</h3><ul class="tight small">${g.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
}

/* ---------- events ---------- */
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act]'); if(!b || !S.st) return; const st=S.st; const F=fin(st); const act=b.dataset.act;
  const amtEl=()=>Math.max(0, Math.round(parseFloat((document.getElementById('fin-amt')||{}).value)||0));
  const done=()=>{ save(); S.keepScroll=true; render(); };
  switch(act){
    case 'fin-period': S.finPeriod = b.dataset.p==='all'?'all':Number(b.dataset.p); done(); break;
    case 'fin-dep': { const a=Math.min(amtEl(), Math.max(0,st.cash)); if(!a) return; st.cash-=a; F.savings+=a; move(st,-a,'Savings','Deposit'); done(); toast(`Deposited ${money(a)}.`); break; }
    case 'fin-wd': { const a=Math.min(amtEl(), Math.floor(F.savings)); if(!a) return; F.savings-=a; st.cash+=a; move(st,a,'Savings','Withdrawal'); done(); toast(`Withdrew ${money(a)}.`); break; }
    case 'fin-draw': { const a=Math.min(amtEl(), creditLimit(st)-F.credit); if(a<=0){ toast(`You've reached your credit limit.`); return; } F.credit+=a; st.cash+=a; move(st,a,'Credit line','Borrowed'); done(); toast(`Borrowed ${money(a)} at 19.9% APR.`); break; }
    case 'fin-repay': { const a=Math.min(amtEl(), F.credit, Math.max(0,st.cash)); if(!a) return; F.credit-=a; st.cash-=a; move(st,-a,'Credit line','Repaid'); scoreDelta(st, a>=1000?4:1); done(); toast(`Repaid ${money(a)}.`); break; }
    case 'fin-bond': { const a=Math.min(amtEl(), F.bond, Math.max(0,st.cash)); if(!a) return; F.bond-=a; txn(st,-a,'Training bond','Early repayment'); if(F.bond<=0) scoreDelta(st,15); done(); break; }
    case 'co-buy': { const c=st.company; const [kind,id]=b.dataset.src.split(':'); const first=!c.fleet.length&&!c.bought; const disc=first&&st.voucher?st.voucher:0; let acId,price,cond,value;
      if(kind==='new'){ acId=id; price=acPrice(id); cond=100; value=acPrice(id); } else { const L=(F.market||[]).find(x=>x.id===id); if(!L) return; acId=L.ac; price=L.price; cond=L.cond; value=L.value; }
      price=Math.round(price*(1-disc)); const dp=S.downPct||20, yrs=S.loanYrs||5; const down = dp>=100?price:Math.round(price*dp/100); if(st.cash<down) return; const rate=loanRate(st);
      txn(st,-down,'Aircraft purchases',`${AC[acId].n}${kind==='used'?' (used)':''}`);
      const f={ fid:uid(), ac:acId, reg:regFor(st), value, cond, loan: dp>=100?{bal:0,rate:0,daily:0}:{ bal:price-down, rate, daily:Math.round(amortDaily(price-down,rate,yrs)) }, hired:!canFly(st,acId), route:null, flights:0, bought:st.day };
      c.fleet.push(f); if(first){ c.bought=true; st.voucher=0; } if(kind==='used') F.market=F.market.filter(x=>x.id!==id);
      st.jobsKey=''; addJournal(st, `Bought ${f.reg}`, `${c.name} takes delivery of a ${kind==='used'?'used ':''}${AC[acId].n}, ${f.reg}. ${money(down)} ${dp>=100?'in cash':'down, '+money(f.loan.daily)+' a day for '+yrs+' years at '+(rate*100).toFixed(1)+'%'}.`, ['mari'], 'milestone'); checkAch(st); done(); toast(`Welcome to the fleet, ${f.reg}.`); break; }
    case 'co-upg': { const u=CO_UPG.find(x=>x.id===b.dataset.v); const c=st.company; if(!u||coUpg(st,u.id)||st.cash<u.cost) return; txn(st,-u.cost,'Aircraft purchases',`${c.name}: ${u.n}`); c.upg=c.upg||{}; c.upg[u.id]=st.day; checkAch(st); addJournal(st,`${u.n} opens`,`${c.name} opens its ${u.n.toLowerCase()}. ${u.d}`,['mari'],'milestone'); done(); toast(`${u.n} built.`); break; }
    case 'co-base': { const c=st.company; const k=(document.getElementById('co-newbase')||{}).value; if(!k||!AP[k]||st.cash<BASE_COST) return; c.bases=c.bases||[]; if(c.bases.includes(k)||k===c.base) return; txn(st,-BASE_COST,'Aircraft purchases',`${c.name}: base at ${k}`); c.bases.push(k); checkAch(st); addJournal(st,`New base: ${k}`,`${c.name} opens a base at ${AP[k].n||k}. Station aircraft there from the fleet list.`,['mari'],'milestone'); done(); toast(`Base opened at ${k}.`); break; }
    case 'co-refit': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); const cost=refitCost(f); if(!f||f.refit||st.cash<cost) return; txn(st,-cost,'Maintenance',`${f.reg} cabin refit`); f.refit=true; f.value=Math.round(f.value*1.03); done(); toast(`${f.reg} has a new cabin.`); break; }
    case 'co-bestroute': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); if(!f) return; const keep=f.route; let best=null;
      for(const to of routeOptions(st,f)){ f.route={to,fare:100}; const bf=bestFare(st,f); if(bf && (!best||bf.profit>best.profit)) best={to,fare:bf.fare,profit:bf.profit}; }
      const pool=Math.round(CLS[AC[f.ac].cls].daily*0.9*demandIndex(st)*(f.cond/100)*(coUpg(st,'charter')?1.3:1)*0.68-CLS[AC[f.ac].cls].wage*(coUpg(st,'train')?0.8:1));
      if(!best || best.profit<pool){ f.route=null; done(); toast(`The charter pool beats every route for ${f.reg} (about ${money(pool)}/day).`); break; }
      f.route={to:best.to, fare:best.fare}; done(); toast(`${f.reg}: ${baseOf(st,f)} ⇄ ${best.to} at ${money(best.fare)}, about ${money(best.profit)}/day.`); break; }
    case 'co-hire': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); f.hired=!f.hired; if(!f.hired) f.route=null; st.jobsKey=''; done(); break; }
    case 'co-repair': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); const cost=Math.round((100-f.cond)*f.value*0.0004*(coUpg(st,'hangar')?0.6:1)); if(st.cash<cost) return; txn(st,-cost,'Repairs',`${f.reg} overhaul`); f.cond=100; done(); break; }
    case 'co-payoff': { const f=st.company.fleet.find(x=>x.fid===b.dataset.f); if(st.cash<f.loan.bal) return; txn(st,-f.loan.bal,'Loan principal',`${f.reg} paid off`); f.loan.bal=0; scoreDelta(st,20); done(); toast(`${f.reg} is paid off.`); break; }
    case 'co-sell': { const c=st.company; const f=c.fleet.find(x=>x.fid===b.dataset.f); const proceeds=Math.round(fairValue(f)*0.97); txn(st,proceeds,'Aircraft sales',f.reg); if(f.loan&&f.loan.bal>0) txn(st,-f.loan.bal,'Loan principal',`${f.reg} loan settled`); c.fleet=c.fleet.filter(x=>x!==f); S.confirm=null; st.jobsKey=''; done(); toast(`Sold ${f.reg}.`); break; }
    default: return;
  }
});
document.addEventListener('change', e=>{
  const t=e.target; if(!S.st) return; const st=S.st;
  if(t.id==='fin-house'){ fin(st).housing=t.value; save(); toast(`You moved: ${HOUSING[t.value].n}.`); S.keepScroll=true; render(); }
  if(t.id==='co-dp'){ S.downPct=Number(t.value); S.keepScroll=true; render(); }
  if(t.id==='co-yrs'){ S.loanYrs=Number(t.value); S.keepScroll=true; render(); }
  if(t.dataset && t.dataset.routeTo){ const f=st.company.fleet.find(x=>x.fid===t.dataset.routeTo); if(!t.value){ f.route=null; } else { const d=distNm(AP[baseOf(st,f)],AP[t.value]); f.route={to:t.value, fare:refFare(d)}; } save(); S.keepScroll=true; render(); }
  if(t.dataset && t.dataset.coBase){ const f=st.company.fleet.find(x=>x.fid===t.dataset.coBase); f.base = t.value===st.company.base?null:t.value; f.route=null; st.jobsKey=''; save(); toast(`${f.reg} now flies from ${t.value}. Pick a new route.`); S.keepScroll=true; render(); }
  if(t.dataset && t.dataset.routeFare){ const f=st.company.fleet.find(x=>x.fid===t.dataset.routeFare); f.route.fare=Number(t.value); save(); S.keepScroll=true; render(); }
});
// checkride fees: charge (or sign a training bond) before the booking handler runs
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="book-check"]'); if(!b || !S.st) return; const st=S.st; const rid=b.dataset.r; const fee=feeFor(st,rid);
  const how=(document.getElementById('crpay-'+rid)||{}).value||'cash';
  if(how==='bond'){ fin(st).bond += Math.round(fee*1.1); move(st, 0, 'Training bond', `${RATINGS[rid].n} checkride paid by Coral Wing: you owe ${money(Math.round(fee*1.1))}`); }
  else { if(st.cash<fee){ e.stopImmediatePropagation(); e.preventDefault(); toast(`You need ${money(fee)} for this checkride, or choose the training bond.`); return; } txn(st,-fee,'Licenses & training',`${RATINGS[rid].n} checkride`); }
}, true);
function feeSelect(st, rid){ const fee=feeFor(st,rid); return `<select id="crpay-${rid}" style="width:auto;padding:6px 8px;font-size:13px" aria-label="How to pay"><option value="cash">Pay ${money(fee)}</option><option value="bond">Training bond (repay ${money(Math.round(fee*1.1))})</option></select>`; }

/* airline milestones */
ACH.push(
  {id:'co_jetliner',n:`Big Iron`,d:`Put an airliner in your company's fleet.`,t:s=>!!(s.company&&s.company.fleet.some(f=>['regional','airliner'].includes(AC[f.ac].cls)))},
  {id:'co_bases',n:`Hub and Spoke`,d:`Run your company from three bases.`,t:s=>!!(s.company&&(s.company.bases||[]).length>=2)},
  {id:'co_full',n:`The Full Works`,d:`Build every company facility.`,t:s=>!!(s.company&&CO_UPG.every(u=>s.company.upg&&s.company.upg[u.id]))},
  {id:'co_value',n:`Ten Million`,d:`Grow your company's value to $10 million.`,t:s=>companyValue(s)>=1e7}
);

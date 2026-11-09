/* ===================== EXTRAS: ranks, world events, objectives, reviews, achievements, map ===================== */

/* ---------- ranks ---------- */
const RANKS = [[0,`Trainee`],[5,`Line Pilot`],[15,`Senior Pilot`],[30,`Captain`],[50,`Senior Captain`],[80,`Chief Pilot`],[120,`Legend of the Trades`]];
function rankOf(st){ const h=st.minutes/60; let r=RANKS[0]; for(const x of RANKS) if(h>=x[0]) r=x; const i=RANKS.indexOf(r); const next=RANKS[i+1]; return { name:r[1], next: next?next[1]:null, nextH: next?next[0]:null, pct: next? Math.min(100,(h-r[0])/(next[0]-r[0])*100):100 }; }

/* ---------- festivals (career calendar starts 1 June 2026) ---------- */
const FESTIVALS = [
  {n:`St Kitts Music Festival`,ap:'TKPK',from:[5,25],to:[5,28],blurb:`Three nights of soca, reggae and R&B in Basseterre. Every hotel is full and every charter is booked.`},
  {n:`Antigua Carnival`,ap:'TAPA',from:[6,24],to:[7,4],blurb:`Ten days of mas bands, steel pan and J'ouvert at dawn. Visitors pour in from the whole region.`},
  {n:`Crop Over: Grand Kadooment`,ap:'TBPB',from:[7,1],to:[7,4],blurb:`Barbados's harvest festival ends with costumed bands dancing down the Spring Garden Highway.`},
  {n:`Carriacou Regatta`,ap:'TGPZ',from:[7,1],to:[7,4],blurb:`Wooden sloops race around the island, and the tiny airstrip sees more traffic than all year.`},
  {n:`St. Martin Day`,ap:'TNCM',from:[10,9],to:[10,11],blurb:`Both sides of the island celebrate the friendly border that has stood since 1648.`},
  {n:`Statia Day`,ap:'TNCE',from:[10,14],to:[10,16],blurb:`Statia remembers the "First Salute" of 1776, when the island fired a salute to the flag of the newly independent United States.`},
  {n:`New Year's Eve in St. Barth`,ap:'TFFJ',from:[11,26],to:[11,31],blurb:`Superyachts fill the harbor in Gustavia and the tiny runway handles a parade of the world's richest passengers.`},
  {n:`Trinidad Carnival`,ap:'TTPP',from:[1,6],to:[1,10],blurb:`"The greatest show on Earth": two days of mas, calypso and steel pan in Port of Spain.`},
  {n:`St. Maarten Heineken Regatta`,ap:'TNCM',from:[2,2],to:[2,7],blurb:`"Serious fun": hundreds of yachts race around the island, and the parties never stop.`}
];
function festivalOn(st){ const d=dateOf(st.day); const m=d.getUTCMonth(), dd=d.getUTCDate(); return FESTIVALS.filter(f=>{ const a=f.from[0]*100+f.from[1], b=f.to[0]*100+f.to[1], x=m*100+dd; return x>=a && x<=b; }); }

/* ---------- storms ---------- */
const STORM_NAMES = [`Ariadne`,`Basil`,`Corinne`,`Dashiell`,`Elodie`,`Fitzroy`,`Gemma`,`Hollis`,`Isadora`,`Jasper`,`Katalina`,`Leopold`,`Marisela`,`Nolan`];
function stormActive(st){ return st.storm && st.storm.until >= st.day ? st.storm : null; }
function maybeStorm(st){
  const mo = monthOf(st.day); if(stormActive(st)) return null;
  if(mo<7 || mo>9) return null; if(Math.random() > 0.12) return null;
  const used = st.stormCount||0; const name = STORM_NAMES[used % STORM_NAMES.length];
  const region = pick(['LEE','LEE','VI','WIN','BAH','GA']);
  st.storm = { name, cat: ri(1,4), region, from: st.day, until: st.day + ri(2,3) };
  st.stormCount = used + 1; return st.storm;
}

/* ---------- morning dispatch ---------- */
const TIPS = [
  `A METAR ceiling is the lowest BKN or OVC layer. FEW and SCT don't count, however low they are.`,
  `Gusty crosswind? Add half the gust factor to your approach speed. 15 kt gusting 25 means +5 kt.`,
  `Trade-wind cumulus tops are usually around 6,000–8,000 ft. Climb above them for a smoother ride.`,
  `Mixing up wind direction: METARs and tower winds are true or magnetic depending on source. In the Caribbean the difference is about 13–15°.`,
  `Over water, glide distance is your life raft. At 5,000 ft a Cessna 172 glides roughly 8 nm.`,
  `Density altitude eats performance. At 32 °C on a sea-level island you're effectively taking off from about 2,000 ft.`,
  `"Clear of the active" isn't done until the whole airplane, tail included, is past the hold-short line.`,
  `On a short runway, the approach speed is the landing. Fly the exact number and the stopping takes care of itself.`,
  `Saharan dust can cut visibility to 3–5 miles for days at a time. It's legal VFR, but the horizon disappears over water.`,
  `The ITCZ sits near Trinidad for much of the year. Expect afternoon storms there more than anywhere else in the islands.`,
  `Hurricane season runs June to November and peaks from mid-August to mid-October.`,
  `File a flight plan for every international leg, even a 10-mile hop. Customs wants to know you're coming.`,
  `In a glassy-water landing, don't trust your eyes. Set the attitude, set 100–150 fpm down, and wait.`,
  `Stabilized approach rule: by 500 ft above the runway you should be on speed, on path and configured, or going around.`,
  `MSFS tip: the VFR map (Views → VFR Map) is a great backup for situational awareness on island hops.`,
  `In a twin, "blue line" is Vyse, the best single-engine climb speed. Know it before every takeoff.`,
  `Turbine engines show ITT. A hot start can cook an engine in seconds, so keep a hand on the condition lever.`,
  `Above FL180 everyone flies on 29.92 / 1013. Forgetting to reset on descent is a classic altitude bust.`
];
const MSGS = {
  dez:[`Rookie, the coffee machine finally died. I've ordered a new one. Fly safe and bring pastries.`,`West Indies need 40 runs off 6 overs tonight. If you hear screaming from the hangar, that's me.`,`Fueled up the Skyhawk, checked the oil, found a lizard in the cowling. Released him. He's fine.`,`Someone landed a Caravan so hard last night the tower called to ask if we were okay. Wasn't you, so you're my favorite today.`,`Reminder: tie-downs are not optional. A gust flipped a Cub at Grand Case last year.`],
  mari:[`Short-field practice at Grand Case if you have time today. The airplane doesn't care how many hours you have.`,`Read the NOTAMs before every flight. Half of what goes wrong in the islands was in a NOTAM somebody skipped.`,`Good work this week. Don't let it go to your head. Go fly.`,`If the weather looks bad from the ground, it looks worse from the air. You're allowed to say no.`],
  calloway:[`Heard you're good at the short ones now. Bet you can't beat my landing roll at Anegada.`,`Your Skyhawk's parked crooked again. Just saying.`,`Fine, I filed a flight plan. Happy?`],
  celeste:[`Darling, I may need you on Friday. A very important guest. Very, very important. Don't wear the flip-flops.`,`The champagne arrived perfectly last time. My guests talk about the "pilot with the gentle hands."`],
  rosa:[`I'm saving you a box of quesitos. Don't let Dez eat them before you get here.`,`The ferry is broken again, so planes are my only hope for the resort orders this week.`],
  amara:[`The coral nursery photos came out beautifully. Thirty new colonies this month!`,`Saw a manta ray off Canouan this morning. If you ever fly over the Cays, look down.`],
  hartwell:[`I've been asked to speak at another event. I'd prefer to fly with you. Priya will be in touch.`]
};
const HEADLINES = [
  `Cruise season starts early as three megaships call at Philipsburg on the same day`,
  `Avgas shortage on the smaller islands: carry extra fuel and check before you go`,
  `New ILS approach published for runway 10 at a busy island airport`,
  `Regional airline adds daily Twin Otter service to the Grenadines`,
  `Sargassum seaweed piles up on windward beaches across the islands`,
  `Record tourist arrivals reported across the Eastern Caribbean this month`,
  `Air traffic controllers at a regional center celebrate 30 years without an incident`,
  `Coral reef restoration projects expand across the Grenadines`,
  `Customs officials remind private pilots to file arrival paperwork in advance`,
  `Saharan dust plume expected to reach the islands by the weekend`
];
function newDayBrief(st){
  const storm = maybeStorm(st); const fest = festivalOn(st);
  const msgs = []; const pool = Object.keys(MSGS).filter(k=>{
    if(k==='celeste') return !!st.story.done.SB1; if(k==='amara') return !!st.story.done.HW2; if(k==='hartwell') return !!st.story.done.HW1; if(k==='rosa') return !!st.visited.TJCP || AP[st.loc].r==='VI'; return true; });
  const picks = [...pool].sort(()=>Math.random()-0.5).slice(0, 2);
  for(const k of picks) msgs.push({ from:k, text: pick(MSGS[k]) });
  let headline = pick(HEADLINES);
  if(storm) headline = `Hurricane ${storm.name} strengthens to Category ${storm.cat} near the ${REGIONS[storm.region].name}`;
  else if(fest.length) headline = `${fest[0].n} begins: ${fest[0].blurb}`;
  st.brief = { day: st.day, headline, msgs, tip: pick(TIPS) };
}

/* ---------- bonus objectives ---------- */
const LANDMARKS = { LEE:[`Saba's cliffs`,`The Quill on Statia`,`Nevis Peak`,`Shoal Bay on Anguilla`,`Maho Beach`], VI:[`The Baths on Virgin Gorda`,`Flamenco Beach on Culebra`,`El Morro in Old San Juan`,`Jost Van Dyke's White Bay`], WIN:[`the twin Pitons`,`Mont Pelée`,`the Tobago Cays`,`Kick 'em Jenny's waters (stay high)`,`Bathsheba's coast`], ABC:[`Klein Bonaire`,`Klein Curaçao's lighthouse`,`Arikok National Park`], GA:[`Seven Mile Beach`,`the Blue Mountains`,`Saona Island`], BAH:[`the Exuma Cays sandbars`,`Harbour Island's pink sand`,`Dean's Blue Hole`], FL:[`the Seven Mile Bridge`,`Miami Beach`], CAM:[`the Mayan ruins at Tulum`,`the Great Blue Hole`,`Isla Mujeres`], LONG:[`the coast below the first landfall`] };
function makeBonus(job){
  const kinds = ['butter','ontime','handfly','scenic','radio'];
  const k = pick(kinds); const amt = Math.max(30, Math.round(job.pay*0.2/10)*10);
  if(k==='butter') return { k, amt, text:`Grease it: touch down under 150 fpm`, auto:'fpm' };
  if(k==='ontime') return { k, amt, text:`Arrive on time: block time within 10% of the plan`, auto:'block' };
  if(k==='handfly') return { k, amt, text:`Hand-fly the whole leg. No autopilot.` };
  if(k==='radio') return { k, amt, text:`Work ATC the whole way (MSFS ATC or VATSIM), from clearance to taxi-in` };
  const lm = pick(LANDMARKS[AP[job.to].r] || LANDMARKS[AP[job.from].r] || [`the prettiest beach on the route`]);
  return { k, amt, text:`Show your passengers ${lm} on the way, at a safe altitude` };
}
function archWeight(st, a){
  const storm = stormActive(st);
  if(a.id==='relief') return storm ? 8 : 2;
  if(a.id==='festival') return festivalOn(st).length ? 6 : 0;
  return a.w;
}
function decorateJobs(st, jobs){
  const storm = stormActive(st); const fest = festivalOn(st); const out=[];
  for(const j of jobs){
    const toR = AP[j.to].r, fromR = AP[j.from].r;
    if(storm && (toR===storm.region || fromR===storm.region)){
      if(!hasRating(st,'IR')) continue;
      j.wx = genWx(st, j.to, storm.cat>=3 ? 'wave' : pick(['wave','tstorm']), j.dep); j.stormName = storm.name;
      if(j.arch==='relief') j.pay = Math.round(j.pay*1.3/10)*10;
    }
    const f = fest.find(x=>x.ap===j.to);
    if(f){ j.festival = f.n; j.pay = Math.round(j.pay*1.4/10)*10; }
    if(j.kind==='gen' && !j.airline && Math.random()<0.55) j.bonus = makeBonus(j);
    out.push(j);
  }
  return surpriseDecorate(st, out);
}
// festival charter archetype
ARCH.push({id:'festival',label:`Festival charter`,kind:'pax',w:0,cls:['ga','hp','turbo','twin','bush','jet'],need:'PPL',pax:[2,9],cargo:[40,300],mult:1.2,
  story:c=>{ const f = (typeof S!=='undefined' && S.st) ? festivalOn(S.st)[0] : null; const name = f ? f.n : `the festival`;
    return { title:`To ${name}`, client:`${pick(NAMES.first)} ${pick(NAMES.last)}'s party`, paras:[`Everyone in the islands is heading to ${c.to.isl} for ${name}, and your passengers are no exception: costumes in garment bags, a cooler of something cold, and a playlist they'd like you to hear.`, `${f?f.blurb+' ':''}Expect a crowded frequency and a busy ramp on arrival. Patience on the radio goes a long way today.`] }; }});

/* ---------- passenger reviews ---------- */
const REVIEW_TXT = {
  5:[`Smoothest flight of my life. Didn't even feel the landing.`,`Our pilot narrated every island like a tour guide. Five stars, would fly again tomorrow.`,`Professional, friendly, and that landing was pure butter.`,`I'm a nervous flyer and I actually enjoyed it. Thank you!`],
  4:[`Great flight and great views. A little bumpy, but that's the islands.`,`On time, friendly, and a solid landing. Recommended.`,`Very good. Would have loved a bit more commentary on the sights.`],
  3:[`Got us there. The landing woke me up.`,`Fine flight, nothing special. The air was rough.`,`Okay overall. A few nervous moments on the approach.`],
  2:[`That landing rattled my fillings.`,`We arrived late and a little shaken.`,`I spilled my coffee twice. Not ideal.`],
  1:[`Never again.`,`I think I left a few years of my life on that runway.`,`My kids are still crying.`]
};
function makeReview(st, job, f, res){
  if(job.kind==='check' || (!job.pax && !job.vip)) return null;
  let stars = res.crash?1 : {A:5,B:4,C:3,D:2,F:1}[res.grade];
  if(f.landing==='butter' && stars<5 && !res.crash) stars++;
  if(f.landing==='hard') stars = Math.min(stars, 2);
  return { day: st.day, stars, who: job.client || `A passenger`, route:`${job.from}→${f.landedAt||job.to}`, text: pick(REVIEW_TXT[stars]) };
}

/* ---------- achievements ---------- */
const ACH = [
  {id:'first',n:`Wheels Up`,d:`Complete your first flight.`,t:s=>s.flights>=1},
  {id:'butter1',n:`Butter Club`,d:`Land under 100 fpm.`,t:s=>s.stats.butter>=1},
  {id:'butter5',n:`Silk`,d:`Five butter landings.`,t:s=>s.stats.butter>=5},
  {id:'streak5',n:`Hot Streak`,d:`Five A grades in a row.`,t:s=>(s.stats.aStreak||0)>=5},
  {id:'ap10',n:`Island Collector`,d:`Land at 10 different airports.`,t:s=>landedCount(s)>=10},
  {id:'ap25',n:`Archipelago`,d:`Land at 25 different airports.`,t:s=>landedCount(s)>=25},
  {id:'ap50',n:`Atlas`,d:`Land at 50 different airports.`,t:s=>landedCount(s)>=50},
  {id:'saba',n:`Saba Survivor`,d:`Land on the shortest commercial runway in the world.`,t:s=>!!s.landedAt&&!!s.landedAt.TNCS},
  {id:'sbh',n:`Col de la Tourmente`,d:`Land at St. Barth.`,t:s=>!!s.landedAt&&!!s.landedAt.TFFJ},
  {id:'water',n:`Splashdown`,d:`Make a water landing.`,t:s=>(s.stats.water||0)>=1},
  {id:'night5',n:`Night Owl`,d:`Five night flights.`,t:s=>(s.stats.night||0)>=5},
  {id:'ifr5',n:`In the Soup`,d:`Five flights in instrument conditions.`,t:s=>(s.stats.ifr||0)>=5},
  {id:'book3',n:`By the Book`,d:`Handle three sealed orders by the book.`,t:s=>s.stats.scen>=3},
  {id:'divert',n:`Better Safe`,d:`Divert when it was the right call.`,t:s=>s.stats.diverts>=1},
  {id:'intl10',n:`Passport Stamps`,d:`Ten international flights.`,t:s=>(s.stats.intl||0)>=10},
  {id:'types5',n:`Type Collector`,d:`Fly five different aircraft types.`,t:s=>Object.keys(s.types).length>=5},
  {id:'types12',n:`Hangar Queen`,d:`Fly twelve different aircraft types.`,t:s=>Object.keys(s.types).length>=12},
  {id:'jet',n:`Jet Set`,d:`Fly a business jet.`,t:s=>Object.keys(s.types).some(k=>AC[k].cls==='jet')},
  {id:'heavy',n:`Heavy Metal`,d:`Fly a widebody.`,t:s=>Object.keys(s.types).some(k=>AC[k].cls==='widebody')},
  {id:'long',n:`Long Haul`,d:`A single flight of three hours or more.`,t:s=>s.log.some(l=>l.min>=180)},
  {id:'relief3',n:`Hurricane Hero`,d:`Fly three relief missions.`,t:s=>(s.stats.relief||0)>=3},
  {id:'five10',n:`Five Stars`,d:`Earn ten five-star reviews.`,t:s=>(s.reviews||[]).filter(r=>r.stars===5).length>=10},
  {id:'bonus10',n:`Overachiever`,d:`Complete ten bonus objectives.`,t:s=>(s.stats.bonus||0)>=10},
  {id:'verified',n:`Black Box`,d:`Complete a flight recorded by MSFS.`,t:s=>s.log.some(l=>l.verified)},
  {id:'k100',n:`Six Figures`,d:`Have $100,000 in the bank.`,t:s=>s.cash>=100000},
  {id:'m1',n:`Millionaire`,d:`Have $1,000,000 in the bank.`,t:s=>s.cash>=1000000},
  {id:'founder',n:`Founder`,d:`Start your own company.`,t:s=>!!s.company},
  {id:'fleet3',n:`Fleet Builder`,d:`Own three aircraft.`,t:s=>!!s.company&&s.company.fleet.length>=3},
  {id:'coral',n:`Coral Wing Family`,d:`Finish the Coral Wing chapters.`,t:s=>!!s.story.done.CW4},
  {id:'hartwell',n:`Discretion Assured`,d:`Finish Hartwell's story.`,t:s=>!!s.story.done.HW5},
  {id:'rated',n:`Fully Rated`,d:`Earn every rating and qualification.`,t:s=>RATING_ORDER.filter(r=>r!=='CO').every(r=>s.ratings[r])},
  {id:'festival',n:`Party Pilot`,d:`Fly a festival charter.`,t:s=>(s.stats.festival||0)>=1}
];
function landedCount(s){ return Object.keys(s.landedAt||{}).length; }
function checkAch(st){
  st.ach = st.ach || {}; const fresh=[];
  for(const a of ACH){ if(!st.ach[a.id] && a.t(st)){ st.ach[a.id]=st.day; fresh.push(a); addJournal(st, `Achievement: ${a.n}`, a.d, [], 'milestone'); } }
  return fresh;
}

/* ---------- after each flight ---------- */
function afterFlight(st, job, f, res, out){
  const s=st.stats; const landedAt = f.landedAt || job.to;
  st.landedAt = st.landedAt || {}; if(!res.crash){ st.landedAt[landedAt] = (st.landedAt[landedAt]||0)+1; }
  if(isNight(job.dep)) s.night=(s.night||0)+1;
  if(job.wx.ifr) s.ifr=(s.ifr||0)+1;
  if(!job.local && ZONE(AP[job.from].c)!==ZONE(AP[landedAt].c)) s.intl=(s.intl||0)+1;
  if(AP[landedAt].water && !res.crash) s.water=(s.water||0)+1;
  if(job.arch==='relief' || job.story==='HR1' || job.story==='HR2') s.relief=(s.relief||0)+1;
  if(job.festival) s.festival=(s.festival||0)+1;
  s.aStreak = res.grade==='A' ? (s.aStreak||0)+1 : 0;
  // bonus objective
  if(job.bonus && !res.crash){
    let met = !!f.bonus;
    if(job.bonus.auto==='fpm' && f.verified) met = f.simFpm < 150;
    if(job.bonus.auto==='fpm' && !f.verified) met = f.landing==='butter' || (f.landing==='smooth' && !!f.bonus);
    if(job.bonus.auto==='block') met = f.block <= plan(job).est*1.1 + 2;
    out.bonusMet = met;
    if(met){ const amt = job.company ? Math.round(job.bonus.amt*2.6) : job.bonus.amt; txn(st, amt, 'Tips & bonuses', 'Bonus objective'); out.pay += amt; s.bonus=(s.bonus||0)+1; out.notes.push(`Bonus objective met: ${job.bonus.text.replace(/\.$/,'')}. +${money(amt)}.`); }
    else out.notes.push(`Bonus objective missed: ${job.bonus.text.replace(/\.$/,'')}.`);
  }
  // review
  const rv = makeReview(st, job, f, res);
  if(rv){ st.reviews = st.reviews || []; st.reviews.unshift(rv); st.reviews = st.reviews.slice(0,60); out.review = rv; }
  if(job.mystery) s.mystery=(s.mystery||0)+1;
  surpriseAfter(st, job, f, res, out);
  finAfterFlight(st, job, f, res, out);
  out.ach = checkAch(st);
  out.rank = rankOf(st).name;
}

/* ---------- extra story chapters ---------- */
STORY.push(
 {id:'RS1',arc:`Rosa`,title:`The Wedding Cake`,chars:['rosa','dez'],req:{after:'CW2',hours:4},from:'TJCP',to:'TIST',ac:['C172','DA40','XCUB','NXCUB','G36'],pax:0,cargo:90,cargoLabel:`a four-tier wedding cake in a padded crate`,time:'day',dep:600,wx:'trades',
  brief:[`Rosa Delgado has baked wedding cakes for thirty years, and never once has one arrived anywhere but perfect. Today's is four tiers of coconut and guava, for a beach wedding at a St. Thomas resort at 2 p.m. The ferry from Culebra broke down at 6 a.m.`,`"You fly like you're carrying my grandchildren," she tells you, strapping the crate into the seat herself. She's coming to the ramp to watch you take off, and she has already told the bride's mother your name.`],
  teach:[`Culebra's runway sits in a bowl between hills. Departing, climb straight out over the water before you turn, and watch for downdrafts on the lee side of the ridge.`,`Cargo that must stay level wants gentle pitch changes, coordinated turns under 20° of bank, and a slow, steady descent.`],
  out:{good:`The cake arrives without a crumb out of place. The bride cries, Rosa cries, and you go home with a box of quesitos the size of a suitcase.`,ok:`One tier slid a few millimeters. The resort's pastry chef fixes it with a strategic hibiscus flower. Nobody ever knows.`,bad:`The top tier didn't survive the landing. Rosa drives the replacement herself on the afternoon ferry, and says nothing at all, which is worse than shouting.`},rep:{rosa:12,dez:2}},
 {id:'CL2',arc:`Calloway`,title:`Calloway's Comeback`,chars:['calloway','mari'],req:{after:'CL1',ratings:['IR']},from:'TNCM',to:'TBPB',ac:['G36','DA62','C208','PC12','TBM','KA350'],pax:1,cargo:30,cargoLabel:`Calloway's brand-new instrument flight bag`,time:'day',dep:540,wx:'showers',
  brief:[`Jack Calloway is studying for his instrument rating, and he asked you, quietly, at the fuel truck, so nobody would hear, whether you'd fly a real IFR leg with him in the right seat.`,`He's nervous, which you've never seen before. "Talk me through it like I'm a student," he says. "Because I am one." Today you fly, he watches, and you explain every decision out loud.`],
  teach:[`Teaching makes you a better pilot. Say every step out loud: clearance, the departure procedure, each altitude, each frequency change.`,`File IFR even on a good-weather day. It keeps you in the system, and ATC does the traffic separation.`],
  out:{good:`Over Barbados, Calloway flies the approach himself with you calling it out. On the ground he shakes your hand for a long time. "Coral Wing's lucky," he says. He means it.`,ok:`A good lesson. Calloway takes four pages of notes and only argues with you twice.`,bad:`A messy flight. Calloway is kind about it, which is how you know it went badly.`},rep:{calloway:15,mari:4}},
 {id:'DZ1',arc:`Dez`,title:`The Cricket Match`,chars:['dez','mari'],req:{ratings:['ME'],hours:16},from:'TAPA',to:'TBPB',ac:['DHC6','DC3','KA350','DA62'],pax:6,cargo:300,cargoLabel:`cricket kit, a cooler and a steel pan`,time:'day',dep:510,wx:'trades',
  brief:[`Once a year the Coral Wing ground crew plays the Barbados airport staff at cricket, and once a year Dez promises this is the year they win. This year he has recruited a fast bowler from the fuel company and bought new pads.`,`Mari has given you the day, an airplane and one instruction: "Bring them all back. Ideally winners." Dez has assigned you to field at fine leg, where "nothing ever happens."`],
  teach:[`A full cabin of excited passengers is a distraction. Brief them firmly before engine start: seat belts, no moving around, and quiet below 10,000 ft (the sterile cockpit rule).`,`Barbados's runway 09 points straight into the trades. On a strong-wind day, expect a short landing roll and a low groundspeed on final.`],
  out:{good:`Coral Wing wins by two wickets. Dez is carried off the field and won't stop talking about it until Christmas. You drop a catch at fine leg and nobody cares.`,ok:`A narrow loss and a great day. Dez announces that next year is definitely the year.`,bad:`The flight was rough and so was the match. Dez blames the umpire, the pitch, the wind and, briefly, you.`},rep:{dez:12,mari:4}},
 {id:'CE2',arc:`The Short Ones`,title:`Celeste's Guest`,chars:['celeste'],req:{after:'SB1',ratings:['TURB','ME']},from:'TNCM',to:'TFFJ',ac:['DHC6'],pax:9,cargo:200,cargoLabel:`designer luggage and six cases of champagne`,time:'sunset',dep:1050,wx:'trades',
  brief:[`Celeste's mysterious "very, very important" guest turns out to be an entire wedding party: nine people, one Twin Otter, and a sunset arrival timed so that the bride steps off the airplane into golden light for the photographer waiting at the end of the runway.`,`"Not one minute late," Celeste tells you, "and not one minute early. The light must be perfect." The approach over the ridge in a fully loaded Twin Otter is a different animal from a Skyhawk.`],
  teach:[`A loaded aircraft needs more runway and a longer flare. Use your performance numbers for today's weight, not the empty-airplane numbers in your head.`,`Timing an arrival: slow down early, not late. Use speed in cruise to absorb the minutes, then fly a normal stabilized approach.`],
  out:{good:`The bride steps into perfect golden light. The photo ends up on the cover of a wedding magazine, and Celeste puts it on the hotel's wall with a small note: "Arrived by Coral Wing."`,ok:`A few minutes off schedule, but the light holds. Celeste forgives you with only one raised eyebrow.`,bad:`The landing was firm enough that the bride's veil went everywhere. The photographer captures it anyway. Celeste calls it "candid."`},rep:{celeste:12}},
 {id:'HW5',arc:`Hartwell`,title:`The Reef Center`,chars:['hartwell','amara','mari'],req:{after:'HW4'},from:'TBPB',to:'TVSM',ac:['PC12','TBM','KA350'],pax:3,cargo:120,cargoLabel:`a framed photograph of a hawksbill turtle`,time:'day',dep:600,wx:'trades',
  brief:[`A year after you first flew "L. Smith" to Mustique, Hartwell's foundation is opening a reef research center on the island, named for the restoration team, not for him. Amara is giving the opening speech.`,`Hartwell asked for one thing: that you fly them in, "because none of this happens if you don't get me through that weather to Barbados." Priya has printed your name on the guest list. Mari is coming too, wearing a dress for the first time anyone at Coral Wing can remember.`],
  teach:[`Short runway, full cabin, VIP passengers: brief your landing distance and a go-around plan before you start the approach, and actually use the go-around if it isn't right.`,`Over the Grenadines, the reef below is a protected area. Keep a respectful altitude: aircraft noise stresses wildlife.`],
  out:{good:`Amara's speech brings the room to its feet. Afterward Hartwell hands you the framed turtle photograph, the one from the survey flight, and says, "I'd like you to have it. It's the reason I trusted you."`,ok:`A beautiful day. Mari gives a speech nobody expected, about pilots who keep their promises.`,bad:`A rough arrival, but nobody remembers the landing by the end of the night. They remember the reef.`},rep:{hartwell:15,amara:15,mari:5},reward:{bonus:25000,note:`Hartwell's foundation sends a thank-you gift of $25,000.`}},
 {id:'MR1',arc:`Own Wings`,title:`Mari's Last Flight`,chars:['mari','dez','calloway'],req:{after:'OW1',ratings:['ME','IR'],hours:45},from:'TNCM',to:'TJSJ',ac:['DC3'],pax:12,cargo:200,cargoLabel:`thirty years of Coral Wing memories`,time:'sunset',dep:1020,wx:'trades',
  brief:[`Captain Marisol Vega is retiring. She has flown the islands for thirty years, and for her last flight she wants a DC-3: the kind of airplane her father flew into San Juan when she was a girl watching from the fence at Isla Grande.`,`She won't fly it herself. "You fly," she says. "I want to look out the window for once." In the back: Dez, Calloway, a dozen Coral Wing regulars, and a cooler that Dez swears is only lemonade.`],
  teach:[`A taildragger with radial engines needs active feet on takeoff and landing. Bring the tail up gently and keep it straight with rudder, not brakes.`,`San Juan approach is busy at sunset. Expect vectors, keep your speed up until told otherwise, and read back every instruction.`],
  out:{good:`You grease the DC-3 onto runway 08 at San Juan as the sky turns orange. Mari doesn't say anything for a long time. Then: "Fly the airplane. Then make it pretty." She hands you her old captain's wings.`,ok:`A solid landing in the old girl. Mari pats the yoke on the way out and says, "Good airplane. Good pilot."`,bad:`A bounce or two on the landing. Mari laughs until she cries. "Thirty years," she says, "and my last landing is a kangaroo. Perfect."`},rep:{mari:20,dez:10,calloway:10}}
);

/* ---------- map ---------- */
const MAPV = { all:{lon:[-89.5,-58],lat:[8.5,27.5],label:`Whole Caribbean`}, east:{lon:[-66.5,-59],lat:[10,19.2],label:`Eastern islands`} };
function mapView(){
  const st=S.st; const v = MAPV[S.mapZoom||'east']; const W=1000, H=Math.round(1000*(v.lat[1]-v.lat[0])/(v.lon[1]-v.lon[0])*1.05);
  const X = lon => (lon - v.lon[0])/(v.lon[1]-v.lon[0])*W, Y = lat => H - (lat - v.lat[0])/(v.lat[1]-v.lat[0])*H;
  const regions = allowedRegions(st); const storm = stormActive(st); ensureJobs(st);
  const sel = S.mapSel && AP[S.mapSel] ? S.mapSel : st.loc;
  const inView = k => AP[k].lon>=v.lon[0]-0.5 && AP[k].lon<=v.lon[1]+0.5 && AP[k].lat>=v.lat[0]-0.5 && AP[k].lat<=v.lat[1]+0.5;
  // grid
  let g=''; for(let lo=Math.ceil(v.lon[0]); lo<=v.lon[1]; lo++){ if(lo% (S.mapZoom==='all'?5:1)) continue; g+=`<line x1="${X(lo)}" y1="0" x2="${X(lo)}" y2="${H}" class="mg"/><text x="${X(lo)+4}" y="${H-6}" class="ml">${Math.abs(lo)}°W</text>`; }
  for(let la=Math.ceil(v.lat[0]); la<=v.lat[1]; la++){ if(la% (S.mapZoom==='all'?5:1)) continue; g+=`<line x1="0" y1="${Y(la)}" x2="${W}" y2="${Y(la)}" class="mg"/><text x="6" y="${Y(la)-4}" class="ml">${la}°N</text>`; }
  // storm
  let stormSvg=''; if(storm){ const pts=Object.keys(AP).filter(k=>AP[k].r===storm.region); const cx=pts.reduce((s,k)=>s+X(AP[k].lon),0)/pts.length, cy=pts.reduce((s,k)=>s+Y(AP[k].lat),0)/pts.length; stormSvg=`<g class="storm"><circle cx="${cx}" cy="${cy}" r="${S.mapZoom==='all'?60:140}"/><text x="${cx}" y="${cy}" text-anchor="middle" class="stl">Hurricane ${esc(storm.name)} · Cat ${storm.cat}</text></g>`; }
  // job routes
  const here = AP[st.loc]; let routes='';
  for(const j of st.jobs){ if(j.local) continue; const a=AP[j.to]; routes+=`<line x1="${X(here.lon)}" y1="${Y(here.lat)}" x2="${X(a.lon)}" y2="${Y(a.lat)}" class="route ${j.company?'co':''}"/>`; }
  if(st.active && !st.active.job.local){ const a=AP[st.active.job.to], b=AP[st.active.job.from]; routes+=`<line x1="${X(b.lon)}" y1="${Y(b.lat)}" x2="${X(a.lon)}" y2="${Y(a.lat)}" class="route active"/>`; }
  // airports
  let dots='', offmap=[]; const placed=[];
  const labelPos=(x,y,w)=>{ for(const [dx,dy] of [[9,-8],[9,16],[-w-9,-8],[-w-9,16],[9,30],[-w-9,30]]){ const bx=x+dx, by=y+dy; if(!placed.some(p=>Math.abs(p[0]-bx)<w+2 && Math.abs(p[1]-by)<13)){ placed.push([bx,by]); return [bx,by]; } } return null; };
  const order = Object.keys(AP).sort((a,b)=>(b===st.loc)-(a===st.loc) || (b===sel)-(a===sel));
  for(const k of order){ const a=AP[k]; if(!inView(k)){ if(a.r==='LONG'||a.r==='FL'||a.r==='CAM') offmap.push(k); continue; }
    const locked = !regions.includes(a.r); const visited = st.landedAt && st.landedAt[k]; const isHere = k===st.loc; const jobTo = st.jobs.some(j=>j.to===k);
    const cls = ['ap', a.water?'water':'', locked?'locked':'', visited?'visited':'', isHere?'here':'', jobTo?'job':'', k===sel?'sel':''].join(' ');
    dots += `<g class="${cls}" data-act="map-sel" data-k="${k}" tabindex="0" role="button" aria-label="${esc(a.n)}, ${esc(a.isl)}"><circle cx="${X(a.lon)}" cy="${Y(a.lat)}" r="${isHere?9:a.water?5:6}"/>${(()=>{ if(!(isHere||k===sel||jobTo||S.mapZoom!=='all')) return ''; const lab=a.water?'≈':k; const p=labelPos(X(a.lon),Y(a.lat),lab.length*7.6); return p?`<text x="${p[0]}" y="${p[1]}" class="al">${esc(lab)}</text>`:''; })()}</g>`;
  }
  const s=AP[sel]; const d=distNm(here, s); const dh = sel!==st.loc && !s.water && regions.includes(s.r) ? deadheadCost(st, sel) : null;
  const jobsHere = st.jobs.filter(j=>j.to===sel);
  return `<main class="wrap stack fade">
    <div class="section-title"><h2>Map</h2><div class="row"><button class="btn sm ${S.mapZoom!=='all'?'primary':''}" data-act="map-zoom" data-z="east">Eastern islands</button><button class="btn sm ${S.mapZoom==='all'?'primary':''}" data-act="map-zoom" data-z="all">Whole Caribbean</button></div></div>
    ${storm?`<div class="notice warn"><b>Hurricane ${esc(storm.name)}</b> (Category ${storm.cat}) is over the ${esc(REGIONS[storm.region].name)} until day ${storm.until}. Instrument-rated pilots only, and relief flights pay 30% more.</div>`:''}
    <div class="grid-2">
      <div class="panel" style="padding:8px"><div class="mapwrap"><svg viewBox="0 0 ${W} ${H}" class="map" role="img" aria-label="Map of airports">${g}${stormSvg}${routes}${dots}</svg></div>
        <div class="row small muted" style="padding:6px 8px;gap:14px"><span><i class="lg here"></i> You</span><span><i class="lg visited"></i> Landed there</span><span><i class="lg"></i> Not yet</span><span><i class="lg locked"></i> Locked region</span><span><i class="lg water"></i> Water landing</span><span><i class="lr"></i> Today's jobs</span></div>
        ${offmap.length?`<p class="small muted" style="padding:0 8px 8px">Off this map: ${offmap.filter(k=>regions.includes(AP[k].r)).map(k=>`${k} (${Math.round(distNm(here,AP[k])).toLocaleString()} nm)`).join(', ')||'more destinations unlock with your Instrument and Jet ratings'}.</p>`:''}
      </div>
      <aside class="panel stack">
        <p class="label">${esc(COUNTRY[s.c])} · ${esc(REGIONS[s.r].name)}</p>
        <h2>${esc(s.n)}</h2>
        <p class="muted small">${esc(s.isl)} · ${esc(sel)}${s.water?'':` · ${s.el} ft`}${sel!==st.loc?` · ${Math.round(d)} nm from you`:' · you are here'}</p>
        <p class="small">${esc(s.note)}</p>
        ${s.rw?`<p class="small mono">${s.rw.map(r=>`${r[0]} · ${r[1].toLocaleString()} ft`).join(' / ')}</p>`:''}
        ${s.q?`<p class="small">${st.ratings[s.q]?'<span class="chip good">Qualified</span>':`<span class="chip warn">Needs ${esc(RATINGS[s.q].n)}</span>`}</p>`:''}
        <p class="small">${st.landedAt&&st.landedAt[sel]?`You've landed here ${st.landedAt[sel]} time${st.landedAt[sel]>1?'s':''}.`:`You haven't landed here yet.`}${regions.includes(s.r)?'':' This region unlocks with '+esc(RATINGS[REGIONS[s.r].unlock].n)+'.'}</p>
        ${jobsHere.length?`<div><p class="label">Jobs to here today</p><ul class="tight small">${jobsHere.map(j=>`<li>${esc(j.title)} · ${money(j.pay)}</li>`).join('')}</ul></div>`:''}
        ${dh?`<button class="btn" data-act="deadhead" data-to="${sel}" ${st.active||st.cash<dh.cost?'disabled':''}>Deadhead here · ${money(dh.cost)} · ${durTxt(dh.min)}</button>`:''}
      </aside>
    </div></main>`;
}

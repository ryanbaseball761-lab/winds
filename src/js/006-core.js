/* ===================== SURPRISES: fictional celebrities, mystery charters, twists, requests, souvenirs ===================== */
// Every celebrity here is invented. None is based on a real person.
const CELEBS = {
  nova:{n:`Nova Reyes`,what:`pop superstar`,col:'#c2410c',gift:`a signed platinum record of "Salt & Starlight"`,
    meet:[`Your passenger boards in a floppy hat and enormous sunglasses, carrying a hairless cat in a velvet carrier. "This is Duchess," she says. "She gets airsick, so please be gentle." Two songs into the flight you realize she's humming the chorus that has been on every radio in the islands all summer. It's Nova Reyes.`,
          `Nova asked for you by name. "Duchess only flies with you now," she announces, as the cat glares at you from her carrier. She spends the flight writing lyrics on a napkin and asking what the instruments are called. One of them, she says, is going in a song.`,
          `Nova's world tour ends in the islands, and she wants her final flight with "the pilot who never made Duchess throw up." At the bottom of the stairs she presses a frame into your hands.`]},
  theo:{n:`Theo Blackwood`,what:`action movie star`,col:'#334155',gift:`the prop cutlass from "Blackwater Tide III"`,
    meet:[`The man in the back has jumped off a moving train in four different films. He is also gripping the armrests so hard his knuckles are white. "Don't tell anyone," whispers Theo Blackwood, the most famous action star in the world. "I'm terrified of small planes."`,
          `Theo is back, and he's been practicing breathing exercises. "My therapist says I should look out the window," he says, and then does not look out the window for forty minutes.`,
          `Theo asks to sit in the right seat. He watches every move you make, and on short final he says, quietly, "I think I get it now. It's not scary when somebody knows what they're doing." Then he hands you a long wrapped package.`]},
  kairo:{n:`DJ Kairo`,what:`superstar DJ`,col:'#7c3aed',gift:`a lifetime all-access pass to every festival he plays`,
    meet:[`Your passenger brought more speaker cases than clothes. DJ Kairo, who has headlined every major festival on three continents, wants to record "the sound of the propeller" for an intro track. He holds a microphone to the window for the whole flight.`,
          `Kairo's new single opens with your engine. It's number one in eleven countries. He wants you to fly him to his next gig "for luck."`,
          `Kairo brings you on stage at sunrise, in front of twenty thousand people, and announces you as "the reason for the beat." It's mortifying and wonderful.`]},
  rex:{n:`Rex Tanaka`,what:`Formula 1 driver`,col:'#dc2626',gift:`his race-worn helmet visor`,
    meet:[`Your passenger times your takeoff roll on his phone. "Not bad," says Rex Tanaka, three-time Grand Prix winner. "You could brake later on landing, though." He doesn't know what a stabilized approach is, and he's about to find out.`,
          `Rex has been watching flight videos online and has opinions about your flare. Many opinions.`,
          `Rex finally admits it: "Landing is harder than qualifying." He leaves a gift on the seat, with a note that says "You'd make a decent racer."`]},
  isa:{n:`Isabella Chen`,what:`tennis champion`,col:'#0891b2',gift:`the racket she won her last final with`,
    meet:[`Your passenger is stretching in the aisle before takeoff. Isabella Chen, world number one, has a match in two days and a strict routine: water every 15 minutes, no turbulence if you can help it, and absolutely no talking about her opponent.`,
          `Isabella is back after winning the title. She lets you hold the trophy on the ramp for exactly four seconds.`,
          `Isabella retires this week. Her last flight as a professional athlete is with you, and she leaves her racket on the seat with a note: "For the smoothest landings on tour."`]},
  dante:{n:`Dante Okoro`,what:`NBA point guard`,col:'#ea580c',gift:`a pair of game-worn sneakers, size 17`,
    meet:[`Dante Okoro is six foot nine, and your cabin is not. He folds himself into the seat with the patience of a man who has done this in every small airplane in the Caribbean. "Worth it," he says, looking out at the water. "Every time."`,
          `Dante brought his whole family this time, plus a basketball he spins on one finger for the entire flight.`,
          `Dante's foundation is building courts on three islands, and he wants you to fly him to every opening. At the last one, he hands you a shoebox.`]},
  marco:{n:`Chef Marco Bellandi`,what:`celebrity TV chef`,col:'#a16207',gift:`a golden spatula from his cooking show`,
    meet:[`Your passenger is carrying a cooler and a knife roll. Chef Marco Bellandi, whose TV show is watched in eighty countries, is filming a Caribbean special and wants to cook a lobster on the beach the moment you land. "You'll eat with us," he insists. It isn't a question.`,
          `Marco is back with a camera crew. Your landing will be in the episode. No pressure.`,
          `The episode airs. Your landing gets its own slow-motion replay with dramatic music. Marco sends a thank-you gift.`]},
  alaric:{n:`Prince Alaric of Valdoria`,what:`incognito royal`,col:'#4338ca',gift:`the Order of the Silver Gull, Valdoria's highest honor for "service to the kingdom's comfort"`,
    meet:[`The passenger is polite, rumpled and traveling as "Mr. Al." His two very large companions don't speak. Only when one of them calls him "Your Highness" by mistake do you realize you're flying the crown prince of Valdoria, a tiny Alpine kingdom, on a secret holiday.`,
          `"Mr. Al" is back, now with a terrible fake mustache. The bodyguards still don't speak, but one of them nods at you.`,
          `Prince Alaric's holiday is over, and the kingdom insists on thanking you properly. There is a small ceremony on the ramp. A bodyguard hums the national anthem.`]},
  margot:{n:`Margot Lavigne`,what:`best-selling novelist`,col:'#be185d',gift:`a signed first edition of her new novel, in which the hero is a Caribbean charter pilot who looks a lot like you`,
    meet:[`Margot Lavigne has written thirty-one mystery novels and sold a hundred million copies. She asks you questions for the entire flight: how fuel works, what a mayday sounds like, how you'd hide something in an airplane. "Research," she says, smiling.`,
          `Margot's new book has a charter pilot in it. She wants to know how your character would land in a storm.`,
          `The book is out. Chapter 9 is a landing at Saba, described in a lot of detail. You recognize your own words.`]},
  jo:{n:`Commander Jo Adeyemi`,what:`astronaut`,col:'#1d4ed8',gift:`a mission patch that flew aboard the space station`,
    meet:[`Your passenger has spent 211 days in orbit. Commander Jo Adeyemi is back on Earth and wants to see the islands from "a sensible altitude." She knows more about orbital mechanics than anyone you'll ever meet, and she still asks good questions about crosswinds.`,
          `Jo is giving a talk at a school on the next island. She asks if the kids can come see the airplane afterwards.`,
          `Jo's last trip before her next mission. On the ramp she says, "Lots of people can fly. Very few make it look calm." She gives you something that has been to space.`]},
  sasha:{n:`Sasha Volkova`,what:`supermodel and ocean conservationist`,col:'#0f766e',gift:`a framed photo of the reef she took from your airplane`,
    meet:[`Sasha Volkova has been on more magazine covers than anyone this decade, and she would much rather talk about plastic in the ocean. She brought a camera with a long lens and wants photos of the reef "for the campaign."`,
          `Sasha's reef campaign has gone viral. One of the photos was taken through your window, and your wingtip is in the corner.`,
          `Sasha's foundation launches. She gives you the original print, signed on the back: "From the left seat's best view."`]},
  ghost:{n:`"The Gull"`,what:`anonymous street artist`,col:'#475569',gift:`a stencil painting of your airplane, signed with a small gull`,
    meet:[`The passenger pays cash, gives no name, and carries a long tube of rolled canvas. After landing, there's a small stencil of a seagull on your seat cushion. By evening a mural has appeared on the terminal wall, and the internet is losing its mind. The Gull, the world's most famous anonymous artist, was in your cabin.`,
          `Same passenger, same cash, same tube. This time you watch carefully and see nothing at all. The mural appears anyway.`,
          `Your final mysterious passenger leaves an envelope behind. Inside, a painting of your airplane over the islands, signed with a tiny gull.`]},
  tuna:{n:`"Big Tuna" Morales`,what:`TV sport-fishing legend`,col:'#15803d',gift:`his lucky lure, retired from service`,
    meet:[`Your passenger is wearing a fishing vest with forty pockets and a hat that says "BIG TUNA." Hector "Big Tuna" Morales has hosted a fishing show for twenty-five years, and he spends the flight spotting birds diving on bait fish. "Marlin down there," he says. He's right.`,
          `Big Tuna is back with a record-weight wahoo on ice in your cargo hold. It is very large and very dead.`,
          `Big Tuna retires his lucky lure on live TV and gives it to "the pilot who always found me fish."`]},
  penny:{n:`Lady Penelope Ashworth`,what:`92-year-old wartime ferry pilot`,col:'#78350f',gift:`her original ferry pilot's wings`,
    meet:[`Your passenger is ninety-two, sharp as a tack, and flew Spitfires as a ferry pilot during the Second World War. "Just a little hop," says Lady Penelope Ashworth. "I want to feel a takeoff again." She watches your hands the whole time and nods approvingly at your checklist.`,
          `Penny is back. She'd like to take the controls for one minute at cruise. Legally, you're the pilot in command. Practically, she is the most experienced pilot who has ever sat in your airplane.`,
          `Penny's final flight. On the ramp she unpins something from her coat. "These belong with someone who still flies," she says.`]}
};
const CELEB_ORDER = Object.keys(CELEBS);
function nextCeleb(st){ st.celebs = st.celebs || {}; const met = CELEB_ORDER.filter(k=>(st.celebs[k]||0)>0 && st.celebs[k]<3); const fresh = CELEB_ORDER.filter(k=>!st.celebs[k]);
  if(met.length && (Math.random()<0.45 || !fresh.length)) return pick(met); return fresh.length ? pick(fresh) : null; }

/* ---------- plot twists (after landing) ---------- */

const TWISTS = [
  {id:'tip', w:6, fx:(st,c)=>{ const amt=Math.round((c.job.pay*rnd(0.5,1.5))/10)*10+100; txn(st,amt,'Gifts & windfalls','Plot twist'); return {title:`An envelope on the seat`, text:`After everyone has gone, you find an envelope tucked into the seat pocket. Inside: ${money(amt)} in cash and a note: "For the smoothest flight of my life. Don't spend it on fuel."`, cash:amt}; }, ok:c=>c.good && c.job.pax},
  {id:'forgot', w:4, fx:(st,c)=>{ addFollowup(st, { from:c.landed, to:c.job.from, ac:c.job.ac, pax:0, cargo:5, title:`The forgotten passport`, client:c.job.client||`Your passenger`, mult:1.6,
      paras:[`Your passenger from the last flight is standing at immigration on ${AP[c.landed].isl} with no passport. It's sitting in a hotel safe back on ${AP[c.job.from].isl}, and the hotel has agreed to send it to the airport.`,`Fly back, collect one small envelope from a very apologetic hotel manager, and the passenger buys you dinner. Probably.`] });
      return {title:`"Have you seen my passport?"`, text:`Twenty minutes after landing, your passenger runs back across the ramp, pale. Their passport is still in the hotel safe on ${AP[c.job.from].isl}. They'll pay double if you can fetch it. Check the job board.`}; }, ok:c=>c.job.pax && !c.job.local},
  {id:'rebook', w:5, fx:(st,c)=>{ const dests=Object.keys(AP).filter(k=>k!==c.landed && !AP[k].water && allowedRegions(st).includes(AP[k].r) && apOk(st,k,c.job.ac) && distNm(AP[c.landed],AP[k])<AC[c.job.ac].range*0.6 && distNm(AP[c.landed],AP[k])>15); if(!dests.length) return null; const to=pick(dests);
      addFollowup(st, { from:c.landed, to, ac:c.job.ac, pax:c.job.pax||1, cargo:c.job.cargo||0, title:`${(c.job.client||'Your client').split(/[,(]/)[0].trim()} wants you again`, client:c.job.client||`Your client`, mult:1.3,
        paras:[`Your last client loved the flight so much they cancelled the airline ticket for their next leg. Their assistant called dispatch: "Same pilot. Same airplane. Tomorrow, or today if possible."`,`Next stop: ${AP[to].isl}. Repeat clients are how charter pilots stay in business.`] });
      return {title:`A repeat booking`, text:`Your client calls Coral Wing before you've even shut down: they want you for their next leg to ${AP[to].isl}. It's on the job board.`}; }, ok:c=>c.good && c.job.pax && !c.job.local},
  {id:'iguana', w:2, fx:(st,c)=>{ addSouvenir(st,'iguana'); return {title:`A stowaway`, text:`Something moves in the cargo hold. It's a green iguana, about three feet long, who rode the whole way from ${AP[c.job.from].isl} without a ticket. Dez names him Iggy. He now lives in the hangar rafters and eats Dez's mangoes.`}; }, ok:c=>!st_has(c.st,'iguana')},
  {id:'drawing', w:3, fx:(st,c)=>{ addSouvenir(st,'drawing'); return {title:`Art from the back row`, text:`The youngest passenger hands you a crayon drawing on the way out: your airplane, a very large sun, and a stick figure labeled "THE PILOT (COOL)". It goes on the hangar wall.`}; }, ok:c=>c.job.pax>=2 && !st_has(c.st,'drawing')},
  {id:'island', w:1, fx:(st,c)=>{ addSouvenir(st,'key'); st.rep.hartwell=clamp((st.rep.hartwell||10)+3,0,100); return {title:`"I own a small island"`, text:`As you unload, your passenger mentions casually that they own a small island nearby ("very small, really just a sandbar with a palm tree") and hands you a brass key. "The gate's on the north side. Use it whenever you like."`}; }, ok:c=>c.good && c.job.vip && !st_has(c.st,'key')},
  {id:'magazine', w:3, fx:(st,c)=>{ st.reputation=clamp(st.reputation+6,0,100); return {title:`You're in a magazine`, text:`One of your passengers was a travel writer. Three weeks later, a glossy magazine runs a story called "The Best Way to See the Caribbean Is From the Left Seat," and it mentions you by name. Phones ring at Coral Wing all week. (+6 reputation)`}; }, ok:c=>c.good && c.job.pax},
  {id:'captain', w:3, fx:(st,c)=>{ addSouvenir(st,'cap'); return {title:`A retired captain's advice`, text:`The quiet older passenger turns out to be a retired 747 captain with 31,000 hours. On the ramp he gives you a two-minute debrief: "${pick([`Flare a touch later and hold it off. Let it settle.`,`Your radio calls are good. Slow them down 10 percent and they'll be great.`,`You're looking at the runway numbers on short final. Look at the far end instead.`,`Trim, trim, trim. You were holding pressure the whole approach.`])}" Then he gives you his old cap.`}; }, ok:c=>c.job.pax && !st_has(c.st,'cap')},
  {id:'party', w:2, fx:(st,c)=>{ return {title:`Surprise!`, text:`When you taxi in, the whole Coral Wing crew is on the ramp with a banner, a cake from Rosa and a cooler. Dez counted: that was your ${st.flights}th flight with the company. Mari makes a speech that's eleven words long. It's perfect.`}; }, ok:c=>c.st.flights>=10 && c.st.flights%10===0},
  {id:'orchids', w:2, fx:(st,c)=>{ const amt=600; txn(st,amt,'Gifts & windfalls','Plot twist'); return {title:`What was in the crates?`, text:`Customs opens the "machine parts" in your cargo hold and finds two hundred rare orchids, all properly permitted, it turns out. The grower is so relieved they made it alive that she tips you ${money(amt)} and names a new hybrid after your airplane.`, cash:amt}; }, ok:c=>c.job.cargo>50},
  {id:'turtles', w:2, fx:(st,c)=>({title:`Turtle crossing`, text:`As you clear the runway, the tower closes the field for twenty minutes: hawksbill hatchlings are crossing the beach at the end of the runway, heading for the sea. Everyone on the ramp stops to watch. Nobody complains about the delay.`}), ok:c=>!c.job.airline},
  {id:'calloway', w:2, fx:(st,c)=>{ st.rep.calloway=clamp((st.rep.calloway||10)+2,0,100); st.reputation=clamp(st.reputation+2,0,100); return {title:`Calloway tried to poach your client`, text:`On the ramp, Calloway hands your passenger a Sunset Isle business card and offers 20% off next time. The passenger hands it right back: "I'll fly with this one, thanks." Calloway laughs and tips his cap. (+2 reputation)`}; }, ok:c=>c.good && c.job.pax},
  {id:'scratch', w:1, fx:(st,c)=>{ const amt=2500; txn(st,amt,'Gifts & windfalls','Plot twist'); addSouvenir(st,'ticket'); return {title:`The lucky scratch card`, text:`Your passenger scratched a lottery card during the flight "for fun" and won. Insisting you're their good-luck charm, they split it with you: ${money(amt)}.`, cash:amt}; }, ok:c=>c.job.pax && !st_has(c.st,'ticket')},
  {id:'rum', w:2, fx:(st,c)=>{ addSouvenir(st,'rum'); return {title:`A gift from the distillery`, text:`Your passenger turns out to own a small rum distillery. A week later a bottle arrives at the hangar: 25 years old, with a handwritten label bearing your name. Dez asks when you plan to open it. You tell him never.`}; }, ok:c=>c.good && !st_has(c.st,'rum')},
  {id:'bottle', w:1, fx:(st,c)=>{ addSouvenir(st,'bottle'); return {title:`A message in a bottle`, text:`During the walkaround you find a glass bottle in the grass beside the ramp. Inside, a note dated 1987: "If you find this, I hope you're somewhere beautiful." You are.`}; }, ok:c=>!st_has(c.st,'bottle')}
];
function st_has(st,k){ return !!(st.souvenirs && st.souvenirs[k]); }
function addSouvenir(st,k){ st.souvenirs = st.souvenirs || {}; if(!st.souvenirs[k]) st.souvenirs[k] = st.day; }
function addFollowup(st, spec){ st.followups = st.followups || []; st.followups.push({ ...spec, id:'F-'+uid(), expires: st.day+2 }); }
function materializeFollowups(st){
  st.followups = (st.followups||[]).filter(f=>f.expires>=st.day);
  const out=[];
  for(const f of st.followups){ if(f.from!==st.loc) continue; if(!canFly(st,f.ac)) continue;
    const dep = Math.round((st.clock+ri(30,90))/5)*5; const wx = genWx(st, f.to, null, dep);
    const job = { id:f.id, kind:'gen', arch:null, label:`Follow-up`, cat:f.pax?'pax':'cargo', from:f.from, to:f.to, local:false, tourNm:0, ac:f.ac, pax:f.pax, cargo:f.cargo, dep, wx, title:f.title, client:f.client, paras:f.paras, followup:true };
    job.pay = Math.round(payFor(st, job)*f.mult/10)*10; job.est = plan(job).est; if(plan(job).over>0){ job.cargo=0; job.pax=Math.min(job.pax, AC[job.ac].pax); }
    out.push(job); }
  return out;
}

/* ---------- mid-flight passenger requests ---------- */
const REQUESTS = [
  {id:'propose', n:`A proposal`, text:`Your passenger leans forward with a ring box hidden in their hand: "Can you circle the beach at the destination once? I'm going to propose." Their partner has no idea.`, how:`Fly one wide, gentle orbit near the coast at a safe altitude (1,000 ft or more over land), then continue to land.`},
  {id:'whales', n:`Whales!`, text:`A passenger shouts and points: humpback whales spouting a few miles off the right wing. Everyone wants a closer look.`, how:`If fuel and airspace allow, divert a few miles for a look. Stay at least 1,000 ft above the water and don't circle low over the animals.`},
  {id:'birthday', n:`A birthday`, text:`It's the youngest passenger's tenth birthday. Their parent asks whether you could make an announcement and point out something special on the way.`, how:`Make a cabin announcement (out loud is fine) and point out a landmark or island on the route.`},
  {id:'nervous', n:`A nervous flyer`, text:`One passenger is gripping the seat, breathing fast. It's their first flight in a small airplane, and the bumps are getting to them.`, how:`Talk them through it: explain the noises, what you're doing and why, and fly the smoothest arrival you can.`},
  {id:'photo', n:`The perfect photo`, text:`Your passenger is a photographer on assignment. Could you fly a slow, steady pass along the coast for five minutes with the sun behind you?`, how:`Fly a steady, level pass along the coastline for about five minutes, keeping a safe altitude and distance from terrain.`},
  {id:'cockpit', n:`Twenty questions`, text:`A kid in the front seat wants to know what every single dial and button does. Every. Single. One.`, how:`Explain at least five instruments during cruise. Keep it sterile below 1,000 ft.`},
  {id:'song', n:`Requests from the back`, text:`Your passenger is a musician and wants to film a short video of the islands from the air for their new song.`, how:`Fly a smooth stretch with gentle turns so they can film. No steep banks.`}
];

/* ---------- decorate jobs with mysteries, celebrities and requests ---------- */
function surpriseDecorate(st, jobs){
  const out = [...materializeFollowups(st), ...jobs];
  for(const j of jobs){
    if(j.kind!=='gen' || j.airline || j.company) continue;
    if(j.pax && Math.random()<0.2) j.request = pick(REQUESTS).id;
    if(j.pax && Math.random()<0.12 && j.arch!=='vip_celeb'){ const c=nextCeleb(st); if(c) j.hiddenCeleb = c; }
    if(Math.random()<0.16){ j.mystery = true; j.pay = Math.round(j.pay*1.35/10)*10; }
  }
  // a dedicated celebrity charter, sometimes
  if(hasRating(st,'COMM') && Math.random()<0.35){ const c=nextCeleb(st); if(c){ const a=ARCH.find(x=>x.id==='celebrity'); const j=makeJob(st, a, false); if(j){ j.celeb=c; const s=celebStory(st,c,j); j.title=s.title; j.client=s.client; j.paras=s.paras; j.mystery = (st.celebs[c]||0)===0; j.vip=true; j.pay=Math.round(j.pay*1.5/10)*10; out.push(j); } } }
  return out;
}
function celebStory(st, c, j){ const C=CELEBS[c]; const n=Math.min(2,(st.celebs&&st.celebs[c])||0);
  return { title: n===0 ? `A very private charter to ${AP[j.to].isl}` : n===1 ? `${C.n} is back` : `${C.n}'s last flight with you`, client: n===0 ? `Name withheld` : `${C.n} (${C.what})`,
    paras: [C.meet[n], `Today's leg goes from ${AP[j.from].isl} to ${AP[j.to].isl}. Whatever happens, the phones stay in pockets and the flight stays off social media.`] }; }
ARCH.push({id:'celebrity',label:`Celebrity charter`,kind:'vip',w:0,cls:['ga','hp','turbo','twin','bush','jet','amph'],need:'COMM',pax:[1,4],cargo:[60,250],vip:true,mult:1.3,
  story:c=>({title:`A private charter`,client:`Name withheld`,paras:[`A charter booked under a false name.`]})});

/* ---------- after landing ---------- */
function surpriseAfter(st, job, f, res, out){
  if(res.crash) return;
  const landed = f.landedAt || job.to; const good = res.grade==='A' || res.grade==='B';
  // request
  if(job.request){ const R=REQUESTS.find(r=>r.id===job.request); if(f.request){ const amt=Math.max(50,Math.round(job.pay*0.15/10)*10); txn(st,amt,'Tips & bonuses','Passenger request'); out.pay+=amt; out.notes.push(`You made it happen (${R.n.toLowerCase()}). Your passengers tip ${money(amt)}.`); if(out.review && out.review.stars<5){ out.review.stars++; out.review.text = pick(REVIEW_TXT[out.review.stars]); } if(job.request==='propose') out.twist = out.twist || {title:`She said yes`, text:`Somewhere over the beach, between the second and third bank of the orbit, the answer was yes. The whole cabin cheered. You may have gotten something in your eye.`}; } }
  // celebrity (open charter or hidden)
  const c = job.celeb || job.hiddenCeleb;
  if(c){ st.celebs = st.celebs||{}; const n = (st.celebs[c]||0); st.celebs[c] = n+1; const C=CELEBS[c];
    if(job.hiddenCeleb && !job.celeb) out.celeb = { k:c, title:`Wait, was that…?`, text:`As your passenger walks away, a baggage handler drops a suitcase and gasps. Under the hat and sunglasses, the whole flight, was ${C.n}, the ${C.what}. They signed the fuel receipt on the way out.` };
    else out.celeb = { k:c, title: n===0 ? `You just flew ${C.n}` : `${C.n}, again`, text: n>=2 ? `${C.n} gives you ${C.gift}. It goes on the hangar wall, in the place of honor.` : `${C.n} (${C.what}) signs your logbook: "${pick([`Best flight I've had all year.`,`Let's do this again.`,`You're hired. For everything.`,`Ten out of ten. Would fly again.`])}"` };
    if(n+1>=3){ st.gifts = st.gifts||{}; st.gifts[c]=st.day; }
    st.reputation = clamp(st.reputation + 2, 0, 100);
    addJournal(st, `Celebrity guestbook: ${C.n}`, out.celeb.text, [], 'milestone'); }
  // twist
  if(!out.twist && job.kind==='gen' && Math.random() < (job.mystery?0.5:0.25)){
    const ctx = { st, job, landed, good }; const pool = TWISTS.filter(t=>t.ok(ctx)).map(t=>({...t}));
    if(pool.length){ const t=wpickArr(pool); const r=t.fx(st,ctx); if(r){ out.twist=r; addJournal(st, r.title, r.text, [], 'flight'); } } }
  if(job.aiTwist && !out.twist){ out.twist = { title:`Plot twist`, text: job.aiTwist }; addJournal(st, `Plot twist: ${job.title}`, job.aiTwist, [], 'flight'); }
}

/* ---------- Claude: surprise me ---------- */
async function aiSurprise(){
  const st=S.st; if(!S.sample) return;
  S.busy.surprise=true; S.busy.surpriseErr=''; S.keepScroll=true; render();
  let base=null; for(let i=0;i<20 && !base;i++){ const a = wpickArr(ARCH.filter(x=>archOk(st,x) && !x.airline && x.id!=='festival' && x.id!=='celebrity' && x.w>0)); base = makeJob(st, a, false); }
  if(!base){ S.busy.surprise=false; S.busy.surpriseErr=`No aircraft or destination fits a surprise job right now. Try another airport.`; render(); return; }
  const a=AC[base.ac];
  const prompt = `You invent surprise charter flights for "Trade Winds", a Caribbean flight-sim career game. The player flies each job for real in Microsoft Flight Simulator 2024, so the route, aircraft and load below are fixed: build the story around them.

Make it surprising, funny or strange, but plausible enough to fly: a mystery passenger, an odd cargo, a secret, a misunderstanding. Use ONLY fictional people. Never name or describe any real celebrity, politician or public figure, and don't make anyone resemble a specific real person; you may invent famous fictional ones (a fictional rock star, a fictional royal, a fictional chef). Nothing dangerous or illegal for the pilot to take part in.

Recurring cast you may use: ${Object.values(CAST).map(c=>c.n+' ('+c.role+')').join('; ')}.

Fixed facts:
From: ${AP[base.from].n}, ${AP[base.from].isl}
To: ${base.local?'local flight returning to the same airport':`${AP[base.to].n}, ${AP[base.to].isl}`}
Aircraft: ${a.n}
Passengers: ${base.pax}; cargo: ${base.cargo} lb
Departure: ${hhmm(base.dep)} local; weather: ${base.wx.n}

Reply with only JSON:
{"title": "max 7 words, intriguing", "client": "who booked it (can be mysterious)", "paragraphs": ["2-3 short paragraphs of briefing, second person, present tense, ~150 words total. Hint at a mystery without resolving it."], "twist": "2-3 sentences revealed AFTER landing that pay off the mystery in a surprising way"}`;
  try{
    const r = await S.sample.json(prompt, { modelTier:'default', cache:false });
    if(!r || !Array.isArray(r.paragraphs) || !r.title) throw {code:'invalid_json'};
    base.title=String(r.title).slice(0,80); base.client=String(r.client||'Unknown').slice(0,80); base.paras=r.paragraphs.slice(0,3).map(String); base.aiTwist=String(r.twist||'').slice(0,600);
    base.label=`Claude's surprise`; base.mystery=true; base.aiGen=true; base.pay=Math.round(base.pay*1.4/10)*10; base.id='AI-'+uid();
    st.jobs.unshift(base); save(); toast(`A strange booking just came in.`);
  }catch(e){ S.busy.surpriseErr = aiErr(e); }
  S.busy.surprise=false; S.keepScroll=true; render();
}

/* ---------- UI pieces ---------- */
function surpriseFlightHTML(job){
  let h='';
  if(job.request){ const R=REQUESTS.find(r=>r.id===job.request); const opened = S.st.active.reqOpen;
    h += opened ? `<section class="surprise open"><p class="label">Passenger request</p><h3 style="margin:4px 0 6px">${esc(R.n)}</h3><p>${esc(R.text)}</p><p class="small" style="margin-top:8px"><b>To make it happen:</b> ${esc(R.how)}</p></section>`
      : `<section class="surprise"><p class="label">Passenger request</p><h3 style="margin:4px 0 6px">Something's going to come up</h3><p class="small">Open this once you're in cruise. One of your passengers is going to ask you for something. It's optional, but they tip well.</p><button class="btn sm" style="margin-top:10px" data-act="open-req">Open it</button></section>`; }
  return h;
}
function surpriseResultHTML(out){
  let h='';
  if(out.celeb){ const C=CELEBS[out.celeb.k]; h += `<section class="panel celeb-card"><div class="row" style="gap:12px"><div class="avatar" style="background:${C.col};width:48px;height:48px">${esc(C.n.replace(/[^A-Z]/g,'').slice(0,2))}</div><div style="min-width:0"><p class="label">Celebrity guestbook</p><h3>${esc(out.celeb.title)}</h3></div></div><p class="brief" style="margin-top:8px">${esc(out.celeb.text)}</p></section>`; }
  if(out.twist){ h += `<section class="panel twist"><p class="label">Plot twist</p><h3 style="margin-top:4px">${esc(out.twist.title)}</h3><p class="brief" style="margin-top:6px">${esc(out.twist.text)}</p></section>`; }
  return h;
}


ACH.push(
  {id:'celeb1',n:`Star Struck`,d:`Fly a celebrity.`,t:s=>Object.keys(s.celebs||{}).length>=1},
  {id:'celeb5',n:`Paparazzi Magnet`,d:`Meet five celebrities.`,t:s=>Object.keys(s.celebs||{}).length>=5},
  {id:'celebAll',n:`The Whole Guestbook`,d:`Meet every celebrity in the islands.`,t:s=>Object.keys(s.celebs||{}).length>=CELEB_ORDER.length},
  {id:'gift',n:`Treasured Gift`,d:`Earn a celebrity's personal gift.`,t:s=>Object.keys(s.gifts||{}).length>=1},
  {id:'wall5',n:`Hangar Wall`,d:`Collect five souvenirs.`,t:s=>Object.keys(s.souvenirs||{}).length+Object.keys(s.gifts||{}).length>=5},
  {id:'mystery5',n:`No Questions Asked`,d:`Fly five confidential charters.`,t:s=>(s.stats.mystery||0)>=5}
);

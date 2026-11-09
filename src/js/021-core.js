/* ===================== CABIN LINES THAT FIT THE FLIGHT ===================== */
function cabinCategory(job){
  if(job.lend) return 'exec';
  if(job.local || job.arch==='sunset') return 'tour';
  return ({honeymoon:'romance', missed_ship:'rush', dive:'dive', film:'film', wedding:'party', festival:'party', cricket:'team',
    vip_celeb:'vip', celebrity:'vip', realestate:'vip', vip_ceo:'exec', airline:'airline'})[job.arch] || (job.kind==='story'?'story':'commuter');
}
const CABIN_CTX = {
  tour:{
    takeoff:[`"Oh wow, look at the water!" Your passengers are already reaching for their phones.`,`As the wheels leave the runway, someone in the back says "Oh my gosh" and doesn't stop saying it.`],
    cruise:[`"Can you tip the wing so I can get a picture?" a passenger asks, camera ready.`,`"What's that island over there?" someone asks, pointing out the window.`,`"Look at that reef! You can see right to the bottom!"`,`"Is that a sailboat or a yacht? It's huge!" Everyone leans to the same side.`],
    near:[`"Already? Can we do one more lap?"`],
    tdB:[`"That was the best part of our whole trip," someone says as you roll out. Applause.`],
    tdH:[`A firm arrival ends the tour. "Well, that woke us up," someone says.`]},
  romance:{
    takeoff:[`The couple in the back are holding hands. "Our first flight as a married couple!"`],
    cruise:[`"Babe, look, it's like a postcard," you hear from the back. Then a long silence and a kiss.`,`The newlyweds are taking a selfie with the wing in the background. "Smile for the honeymoon album!"`],
    near:[`"Is that where we're staying? It's perfect," one of them whispers.`],
    tdB:[`"So smooth! Honey, tip him extra."`], tdH:[`"Ow! Well, that's a story for the wedding album," one of them laughs, a little shakily.`]},
  rush:{
    takeoff:[`"Thank you, thank you, thank you," your passengers say. "The ship leaves at four!"`],
    cruise:[`One passenger is refreshing the cruise line's app every thirty seconds. "Are we going to make it?"`,`"How much longer?" they ask, for the third time. Someone is tracking the ship on their phone.`],
    near:[`"I can see the ship! It's still there!" The whole cabin cheers.`],
    tdB:[`"Go, go, go!" They're unbuckling before you've even stopped. "Best pilot ever!"`], tdH:[`A hard landing, but nobody cares. "We're here! We're HERE!"`]},
  dive:{
    takeoff:[`The divers are already arguing about who saw the bigger turtle last trip.`],
    cruise:[`"Check out the color change over the reef. That's where we're diving," someone says, nose to the window.`,`A diver is checking his regulator in his lap. "Visibility's going to be amazing today."`],
    near:[`"Look, you can see the dive boats lined up!"`],
    tdB:[`"Smoother than my last giant-stride entry," a diver jokes.`], tdH:[`"Easy! There's a camera housing back here worth more than my car!"`]},
  film:{
    takeoff:[`The cameraman is filming out the window. "Keep it steady, this is gold."`],
    cruise:[`"Can you hold this heading for thirty seconds? I need a clean take," the director asks.`,`The location scout is muttering into a voice memo: "Cliffs, golden light, maybe the opening shot."`],
    near:[`"Roll on the approach! This is our establishing shot."`],
    tdB:[`"Cut! Print it. That was perfect," the director says, grinning.`], tdH:[`"Well, that take's unusable," the cameraman sighs, checking his lens.`]},
  party:{
    takeoff:[`Someone starts a cheer as you lift off. "Woooo! Wedding weekend!"`],
    cruise:[`"Who brought the speaker?" Somebody is already playing soca in the back.`,`The bridesmaids are planning their speeches out loud. One of them is going to make the groom cry.`],
    near:[`"There's the venue! Look, you can see the tent on the beach!"`],
    tdB:[`The whole cabin applauds. "Okay, the pilot's invited to the reception."`], tdH:[`"Careful! The cake topper is in my lap!"`]},
  team:{
    takeoff:[`The team starts singing as you lift off. The captain tells them to shut up. They don't.`],
    cruise:[`"Who's opening the batting today?" The argument in the back gets louder.`,`Someone is passing round a bag of plantain chips. The coach confiscates it.`],
    near:[`"There's the ground! You can see the pitch from here!"`],
    tdB:[`"Now that's a clean landing! Six!" the team shouts.`], tdH:[`"Out! Howzat!" someone yells as you thump down. Laughter all round.`]},
  vip:{
    takeoff:[`Your VIP doesn't look up from their phone. Their assistant gives you a discreet thumbs-up.`],
    cruise:[`"Could we be a little quieter up front?" the assistant asks politely. "They're on a call."`,`Your passenger finally puts the phone down and stares out the window. "It's beautiful up here. Nobody can find me."`],
    near:[`"Is there a car waiting? There'd better be a car waiting," the assistant mutters, typing fast.`],
    tdB:[`"Very nice," your VIP says, which their assistant later tells you is the highest compliment they give.`], tdH:[`The assistant winces. "We'll mention that in the review," they say, not unkindly.`]},
  exec:{
    takeoff:[`Laptops come out the second the wheels are up.`],
    cruise:[`"Can you get Wi-Fi up here? No? Fine, I'll draft offline." Keys clicking in the back.`,`Your passenger is on a call: "Tell them we land in twenty. Don't start without me."`],
    near:[`"Perfect timing. We're early," your passenger says, closing the laptop.`],
    tdB:[`"Smooth. I didn't even spill my coffee."`], tdH:[`Coffee everywhere. "I'll send you the dry-cleaning bill," your passenger says, half joking.`]},
  airline:{
    takeoff:[`Cabin crew: "Ladies and gentlemen, we've left the ground. Please keep your seatbelts fastened."`],
    cruise:[`Cabin crew: "The seatbelt sign is now off. We'll be coming through with drinks shortly."`,`A baby in row 14 has stopped crying. The whole cabin breathes a sigh of relief.`],
    near:[`Cabin crew: "Ladies and gentlemen, we've started our descent. Please return to your seats."`],
    tdB:[`Applause breaks out somewhere in the back. The cabin crew smile at each other.`], tdH:[`Overhead bins rattle. Cabin crew: "Please remain seated until the seatbelt sign is off."`]},
  story:{
    takeoff:[`"Here we go," {host} says, settling in.`],
    cruise:[`{host} looks out the window for a long moment. "I never get tired of this view."`,`"How are we doing up there?" {host} asks. "Good? Good."`],
    near:[`"There it is," {host} says. "Right on time."`],
    tdB:[`"Now that's a landing," {host} says, grinning.`], tdH:[`{host} exhales. "We're down. That's what matters."`]},
  commuter:{
    cruise:[`The cabin settles down. Someone is reading a paperback; someone else is asleep.`,`"First time flying in a small plane," a passenger admits. "It's actually great."`,`A passenger points out the window: "Is that {to} already?"`]}
};
const CARGO_CTX = {
  medical:{to:[`Dispatch: "Hospital at {to} is standing by. Fly safe, they're counting on this one."`], td:[`Dispatch: "Ambulance is at the gate. Nice work, that's going straight to the ward."`]},
  catch:{to:[`Dispatch: "Fish is on ice. The restaurant wants it on plates by lunch."`], td:[`Dispatch: "The chef is on the ramp with a cooler. He says thanks."`]},
  mail:{to:[`Dispatch: "Mail's aboard. The post office at {to} opens at nine."`], td:[`Dispatch: "Mail's in. Somebody's birthday card made it on time."`]},
  relief:{to:[`Relief coordinator: "Water and generators are on board. They need it badly. Thank you."`], td:[`Relief coordinator: "Volunteers are unloading now. You've made a real difference today."`]},
  rosa:{to:[`Rosa on the radio: "Gentle with my pastries! No steep turns!"`], td:[`Rosa: "Did they survive? Send me a picture. I'm serious."`]},
  aog:{to:[`Maintenance: "That part is the only thing between an airliner and two hundred angry passengers. No pressure."`], td:[`Maintenance: "Part received. The airliner will be flying tonight. Good job."`]},
  ferry:{to:[`Dispatch: "Ferry flight copied. Just get it there in one piece."`], td:[`Dispatch: "Aircraft delivered. The new owner is already walking around it."`]}
};
function cabinPick(k, job){
  const host = job.chars && job.chars[0] && CAST[job.chars[0]] ? shortName(job.chars[0]) : ((job.client||'Your passenger').split(/[ &]/)[0]);
  const isl = AP[job.to] ? AP[job.to].isl.replace(/\s*\(.*\)/,'') : 'the island';
  let pool = null;
  if(k==='cargoTo' || k==='cargoTd'){ const c=CARGO_CTX[job.arch]; pool = c ? c[k==='cargoTo'?'to':'td'] : null; }
  else { const c=CABIN_CTX[cabinCategory(job)]; pool = c && c[k]; }
  if(!pool || !pool.length) pool = CABIN_LINES[k] || [''];
  return pick(pool).replace(/\{host\}/g, host).replace(/\{to\}/g, isl);
}
/* the generic pool keeps only lines that fit any flight */
CABIN_LINES.cruise = [`The cabin settles down. Someone is reading; someone else is fast asleep.`,`"This is so much better than the ferry," a passenger says to nobody in particular.`];

/* ===================== MAIN STORY: CONTRABAND =====================
   A clean pilot gets pulled into the islands' smuggling network and rises to run it.
   4 acts, 15 chapters. Power (how much of the network answers to you) and Heat (how close the law is). */

/* ---- new characters ---- */
CAST.castillo = {n:`Mateo Castillo`, role:`"Shipping and logistics"`, col:'#7a1f2b', bio:`Soft-spoken, perfectly dressed, never in a hurry. Owns a great many things through a great many other people.`};
CAST.reyes = {n:`Agent Elena Reyes`, role:`DEA, Caribbean Division`, col:'#3b4a5a', bio:`Fifteen years chasing planes she could never catch. Tired, stubborn, and the one cop on the islands nobody has bought.`};
if(typeof PORTRAIT!=='undefined'){
  PORTRAIT.castillo = {skin:'#c8936a', hair:'#1a1410', style:'slick', top:'suit', topC:'#24242a', acc:['stubble']};
  PORTRAIT.reyes = {skin:'#a8754e', hair:'#1b1512', style:'bun', top:'blazer', topC:'#3f4a56', acc:[]};
}

/* ---- the four acts ---- */
const CRIME_ACTS = [
  {arc:'Clean Hands', col:'#7d9e98', tag:`You're just a pilot in a Cessna. Then Dez asks you for a small favor.`, nerve:`Nervous. Your hands won't stop sweating.`},
  {arc:'Fast Money', col:'#c8962a', tag:`A Vision Jet, a new rating and more cash than you've ever seen.`, nerve:`Getting comfortable. The money is very good.`},
  {arc:'Bigger Wings', col:'#d0643a', tag:`The Citation, your own crew, and a DEA agent who won't let go.`, nerve:`Confident. You want bigger loads.`},
  {arc:'Heavy Metal', col:'#9b6cd6', tag:`Your own cargo airline. Tons, not pounds.`, nerve:`Hungry. Nothing small is worth your time anymore.`},
  {arc:'The Last Run', col:'#d23b2c', tag:`A 747 full of product, and one flight that decides who runs the Caribbean.`, nerve:`Untouchable. Or so you think.`}
];
const GA = ['C172','DA40','C152','G36','DA62'];

const BIZJ = ['SF50','CJ4'];
const LINER = ['B38M','A320','A321'];
const CRIME = [
 /* ---------- ACT 1: CLEAN HANDS ---------- */
 {id:'CW1',arc:'Clean Hands',title:`The Extra Box`,chars:['dez','mari'],req:{},from:'TNCM',to:'TQPF',ac:['C172','DA40','C152','G36'],pax:1,cargo:40,cargoLabel:`a taped box with no label`,time:'day',dep:540,wx:'trades',
  hook:`A ten-minute hop to Anguilla, and a box that isn't on the manifest.`,
  recap:`You flew Dez's unlabeled box to Anguilla. A man in a white pickup took it without a word, and Dez paid you $200 cash.`,
  brief:[`Coral Wing Air is behind on its bills, and Mari has been sleeping in her office. Your job today is simple: fly Dez to Anguilla in the Skyhawk.`,`At the plane, Dez slides a taped-up box behind the rear seat. "Favor for a friend," he says. "It's not on the manifest. Don't make it weird." He tucks two hundred dollars into your shirt pocket. Your hands are slick on the yoke before you've even started the engine.`],
  teach:[`Anguilla is about 10 nm north of Juliana. Climb to 2,500 ft and you'll see it straight ahead.`],
  out:{good:`A man in a white pickup is waiting by the fence. He takes the box, nods once and drives off. "See?" Dez grins. "Easy money."`,ok:`The man at the fence checks the box carefully before he takes it. "He's fussy," Dez shrugs. "Easy money."`,bad:`The box took a beating on that landing. The man at the fence opens it, checks inside and gives you a long look before he drives away.`},rep:{dez:4}},
 {id:'CR2',arc:'Clean Hands',title:`Cash Run`,chars:['dez'],req:{after:'CW1'},from:'TQPF',to:'TKPN',ac:['C172','DA40','C152','G36'],pax:0,cargo:30,cargoLabel:`a padlocked gym bag`,time:'day',dep:600,wx:'trades',
  hook:`Dez needs a bag delivered to Nevis. Don't open it.`,
  recap:`You opened the bag on the way to Nevis: $400,000 in hundreds. You delivered it anyway.`,
  brief:[`Dez calls before breakfast. "Same friend. One bag, Anguilla to Nevis. Five hundred for you this time."`,`The gym bag is padlocked, but the zipper is split. Somewhere over St. Kitts you look. Bundles of hundred-dollar bills, packed tight. Around four hundred thousand dollars. You fly the rest of the way with your heart in your throat.`],
  teach:[`Nevis has a short runway under a big mountain. Expect bumpy air on the west side and a little extra crosswind.`],
  out:{good:`The yacht broker at Nevis counts it on the hood of his car. "Dez said you were clean," he says. "Good."`,ok:`The broker counts it twice. "Dez said you were clean."`,bad:`The broker counts it three times, sweating in the sun. "Rough ride," he says, not really asking.`},rep:{dez:4},
  choice:{q:`Before you hand over the bag, you count it: $400,000. Nobody would ever notice one bundle missing.`,opts:[
    {t:`Hand it over untouched`,out:`The broker counts it, smiles and gives you his card. "If you ever want real work," he says.`,power:5},
    {t:`Keep one bundle for yourself`,out:`$10,000 rides home in your flight bag. The broker pauses at the count, looks at you for a long second, then lets it go.`,cash:10000,heat:6,power:2}]}},
 {id:'CR3',arc:'Clean Hands',title:`The Ramp Check`,chars:['dez','mari'],req:{after:'CR2'},from:'TKPN',to:'TNCM',ac:['C172','DA40','C152','G36'],pax:0,cargo:60,cargoLabel:`two coolers "of fish"`,time:'day',dep:840,wx:'trades',
  hook:`Two coolers home to Juliana, and customs is waiting on the ramp.`,
  recap:`Customs met you at Juliana. Dez swapped the coolers before they reached the plane. Now you owe him.`,
  brief:[`Two coolers for the trip home. "Fish," says the man who loads them. They don't smell like fish.`,`On the radio, tower asks you to park at the main apron for a customs inspection. Your phone lights up: Dez. "Taxi to the Coral Wing hangar first. Two minutes. Trust me." You're sure everyone on the frequency can hear your heart.`],
  teach:[`Juliana is busy. Hold short for the jets, then taxi to the general aviation ramp on the north side.`],
  out:{good:`By the time customs reaches the plane, the coolers really are full of fish. Dez winks at you over the officer's shoulder. Up in her office, Mari watches through the blinds.`,ok:`Customs takes twenty minutes and finds nothing but fish. Dez lets out a long breath. Mari watches from her office window.`,bad:`Customs takes an hour. They find nothing, but they write down your name. Mari asks what's going on, and you lie to her for the first time.`},rep:{dez:6,mari:-2}},
 {id:'CR4',arc:'Clean Hands',title:`The Offer`,chars:['castillo','dez'],req:{after:'CR3'},from:'TNCM',to:'TAPA',ac:['C172','DA40','G36','DA62','C208'],pax:2,cargo:30,cargoLabel:`two leather briefcases`,time:'dusk',dep:1020,wx:'trades',
  hook:`A charter to Antigua for a polite man in a linen suit, who has a jet with no pilot.`,
  recap:`Mateo Castillo, the man behind Dez's "friend", offered you a place in his network, and a Vision Jet if you get your jet rating. You said yes.`,
  brief:[`A charter for two men in linen suits. The quiet one sits up front, asks good questions about flying, and seems to know a lot about you already: where you trained, where you live, how far behind Coral Wing is on its loans.`,`At the Antigua FBO, he buys you a coffee. "My name is Mateo Castillo. Dez works for me. Now and then, so does Coral Wing. I'd like you to work for me too. Not as a favor. As a career. I have a Vision Jet in San Juan with no pilot. Get your jet rating, and I'll pay for every hour of it."`],
  teach:[`Antigua is a big international field. Expect a long straight-in at dusk, and turn on your landing light early.`],
  out:{good:`Castillo watched you fly the whole way. "Smooth," he says. "Calm hands. That's rare."`,ok:`"Good enough," Castillo says. "We'll make it better."`,bad:`Castillo straightens his cuffs after the landing. "We'll work on that."`},rep:{castillo:8},
  choice:{q:`Castillo slides an envelope across the table. "Ten thousand. A welcome. Fly for me, and one day you won't need me at all."`,opts:[
    {t:`Take the envelope`,out:`"Good," he says. "I like people who know what they want." By the time you reach the plane, there's a new number in your phone with no name on it.`,cash:10000,power:6,heat:5},
    {t:`Ask for a cut instead`,out:`Castillo laughs, genuinely. "You haven't moved a single box for me yet." Then he writes 5% on a napkin and slides it back. You've just become part of the business.`,power:10,heat:5}]}},

 /* ---------- ACT 2: FAST MONEY (Vision Jet) ---------- */
 {id:'CR5',arc:'Fast Money',title:`Keys to the Jet`,chars:['castillo','hartwell'],req:{after:'CR4',ratings:['JET']},from:'TJSJ',to:'TNCM',ac:BIZJ,pax:0,cargo:300,cargoLabel:`nine leather bags, about a million dollars`,time:'day',dep:600,wx:'trades',
  hook:`Castillo's Vision Jet, your brand-new jet rating, and a million dollars in the back.`,
  recap:`You flew a million dollars from San Juan to Juliana in Castillo's Vision Jet, and you landed grinning.`,
  brief:[`Castillo kept his word. He paid for your jet rating, and now a Cirrus Vision Jet is waiting in a private hangar at San Juan with your name in the logbook. On paper it belongs to the Hartwell Reef Trust, a coral charity run by Lionel Hartwell, the billionaire who lives on Mustique. He waves at you from the hangar office like you're old friends.`,`Nine leather bags go in the back. "It's only money," Castillo says on the phone. "Money isn't a crime until somebody asks where it came from." Somewhere around 25,000 feet you notice you aren't nervous anymore. You feel fast.`],
  teach:[`The Vision Jet is a pressurized single-engine jet. Climb into the mid-20s, and start down early: jets don't slow down or descend like a Cessna. Approach at about 90 knots.`],
  out:{good:`You grease it onto runway 10. Castillo's people have the bags off before the engine spools down. Your cut is more than you made all last year.`,ok:`A decent landing in a jet that's still new to you. The bags are off in minutes, and your cut is more than you made all last year.`,bad:`The jet is faster than you are, and you know it. But the bags are home, and your cut is more than you made all last year.`},rep:{castillo:6}},
 {id:'CR6',arc:'Fast Money',title:`The Passengers`,chars:['castillo'],req:{after:'CR5'},from:'TNCM',to:'TUPJ',ac:BIZJ,pax:4,cargo:0,cargoLabel:`four people, one backpack each`,time:'night',dep:1320,wx:'calm',
  hook:`Four people with no passports, and a boy in the back who can't breathe.`,
  recap:`You flew four people with no papers to Tortola. One of them was a boy who couldn't breathe.`,
  brief:[`Tonight it isn't cargo. Four people climb in out of the dark: a mother, her brother, a young man and a boy of about ten. No passports. One backpack each. "No stops," Castillo says. "No radio."`,`Twenty minutes out, the mother bangs on the back of your seat. Her son is wheezing, fighting for every breath.`],
  teach:[`Beef Island is short for a jet, with water at both ends. Fly a stable approach at Vref and get on the brakes firmly.`],
  out:{good:`You get them down smoothly. The boy is still wheezing as his mother carries him off the plane.`,ok:`A firm landing at Beef Island. The boy is still wheezing.`,bad:`You land long and hard. Someone screams. The boy is still wheezing.`},rep:{castillo:3},
  choice:{q:`On the ground, the boy is getting worse. A van waits by the fence, and Castillo's driver waves at you to hurry.`,opts:[
    {t:`Call an ambulance`,flag:'boy',out:`The paramedics take the boy and he'll be fine. The van leaves without him. Castillo calls you that night and says only, "Don't do that again."`,heat:15,con:1,power:-4},
    {t:`Put them in the van`,out:`The van pulls away into the dark. Castillo calls an hour later: "That's the job." You sleep badly, then less badly the next night.`,power:6,con:-1}]}},
 {id:'CR7',arc:'Fast Money',title:`The Files`,chars:['castillo'],req:{after:'CR6'},from:'TUPJ',to:'TJSJ',ac:BIZJ,pax:1,cargo:10,cargoLabel:`a hard drive in a sandwich bag`,time:'day',dep:690,wx:'trades',
  hook:`A nervous lawyer has to beat the police to San Juan.`,
  recap:`You flew Castillo's lawyer and his hard drive out of Tortola. Two days later he was found in the harbor.`,
  brief:[`Philippe Arnaud does Castillo's paperwork, and the police are searching his Tortola office at noon. He's on your jet at eleven, sweating through his shirt, with a hard drive in a sandwich bag.`,`He talks the whole way: about his daughter, about how he only ever did the paperwork. You catch yourself thinking about your cut instead of listening.`],
  teach:[`San Juan is busy airspace. Expect vectors, keep your speed up until they slow you, and brief the ILS early.`],
  out:{good:`Arnaud shakes your hand twice on the ramp. Two days later, a lawyer is found floating in San Juan harbor. Castillo calls: "Loose ends. Not yours." You're surprised by how little you feel.`,ok:`Arnaud hurries into the terminal. Two days later he's found in the harbor. Castillo calls: "Loose ends. Not yours."`,bad:`Arnaud is shaking when he climbs out. Two days later he's found in the harbor.`},rep:{castillo:4}},
 {id:'CR8',arc:'Fast Money',title:`Into the Storm`,chars:['castillo','tico'],req:{after:'CR7'},from:'TJSJ',to:'MDPC',ac:BIZJ,pax:0,cargo:600,cargoLabel:`twenty duffel bags`,time:'day',dep:960,wx:'wave',
  hook:`The Coast Guard is grounded by a storm. You volunteer to fly through it.`,
  recap:`You volunteered to fly twenty bags through a tropical wave to Punta Cana while the Coast Guard sat on the ground.`,
  brief:[`A tropical wave is rolling across the islands: low cloud, heavy rain, gusts. The Coast Guard has grounded everything, and Castillo's other pilots won't go.`,`You call him before he can call you. "I'll fly it. What does it pay?" He doubles the number before you finish the sentence. Tico, a twenty-two-year-old loader who never stops talking, rides in the back with the bags. He wants to be a pilot, like you.`],
  teach:[`This one is on instruments. File IFR, stay ahead of the jet, slow down in the turbulence and fly the ILS all the way down at Punta Cana.`],
  out:{good:`You break out at 600 feet with the runway dead ahead. Castillo's people are waiting with umbrellas. "Nobody else would fly it," Castillo says. "Remember that. I will."`,ok:`A long, ugly flight, but the bags are in Punta Cana. Castillo is impressed.`,bad:`It was close. Too close. But the bags are in Punta Cana.`},rep:{castillo:8}},

 /* ---------- ACT 3: BIGGER WINGS (Citation CJ4) ---------- */
 {id:'CR9',arc:'Bigger Wings',title:`Reyes`,chars:['reyes','castillo'],req:{after:'CR8'},from:'MDPC',to:'TISX',ac:BIZJ,pax:0,cargo:40,cargoLabel:`a sealed case for Castillo's contact`,time:'day',dep:600,wx:'trades',
  hook:`St. Croix is American soil. Someone is waiting there for you.`,
  recap:`DEA Agent Elena Reyes was waiting at St. Croix with photos of you and the jet.`,
  brief:[`A sealed case for a contact on St. Croix. Routine now.`,`But St. Croix is United States territory, and when you shut down on the ramp, two dark SUVs pull up beside the jet. A tired-looking woman shows you a badge. "Agent Elena Reyes, DEA. Nice airplane. Whose is it?" She has photos of you in San Juan, loading bags.`],
  teach:[`St. Croix is a long, wide runway. An easy landing for a very hard day.`],
  out:{good:`A clean landing, for all the good it does you. They search the jet and take you to a small room with no windows.`,ok:`They search the jet and take you to a small room with no windows.`,bad:`They search the jet and take you to a small room with no windows.`},rep:{reyes:5},
  choice:{q:`Reyes slides a phone across the table. "Keep flying for Castillo. Tell me what you see. Do that, and you walk. Or I make one call and you do twenty years."`,opts:[
    {t:`Take her deal`,out:`"Smart," she says. "Keep this phone charged. Don't call me. I'll call you." You fly home playing both sides, and part of you likes it.`,heat:-25,flag:'informant'},
    {t:`Say nothing and ask for a lawyer`,out:`Twelve hours later, Castillo's lawyers have you out on a technicality. Castillo is impressed. "You kept your mouth shut. People will hear about that." Reyes isn't finished with you.`,heat:10,power:8}]}},
 {id:'CR10',arc:'Bigger Wings',title:`The Citation`,chars:['castillo','tico'],req:{after:'CR9'},from:'TISX',to:'MKJS',ac:['CJ4'],pax:2,cargo:1400,cargoLabel:`1,400 lb of "medical supplies"`,time:'day',dep:720,wx:'trades',
  hook:`A Citation CJ4, your own crew, and a route to Jamaica.`,
  recap:`Castillo gave you a Citation CJ4, two loaders of your own and the Jamaica route. You asked for more.`,
  brief:[`Castillo is promoting you. A Citation CJ4, a weekly run to Montego Bay, and two loaders, Tico and his cousin, who call you "boss".`,`Over the Mona Passage you do the math. The CJ4 carries 1,400 pounds. A cargo jet carries forty tons. You land already wanting more.`],
  teach:[`The CJ4 is fast and heavy. Program the FMS before taxi, climb to the high 30s, and plan your descent about 100 miles out.`],
  out:{good:`The crates are off in twenty minutes. Back at the hotel, you tell Castillo you want bigger airplanes. He just smiles. "Get your airline licence. Then we'll talk."`,ok:`Montego Bay takes the crates without a hitch. You tell Castillo you want bigger airplanes. "Get your airline licence," he says.`,bad:`A rough arrival, and one crate splits on the ramp. Your loaders cover it before anyone sees. Castillo says you'll get bigger planes when you can fly this one.`},rep:{castillo:6}},
 {id:'CRM',arc:'Bigger Wings',title:`The Medinas`,chars:['medina','tico'],req:{after:'CR10'},from:'MKJS',to:'MKJP',ac:BIZJ,pax:1,cargo:900,cargoLabel:`900 lb for Kingston`,time:'night',dep:1230,wx:'calm',
  hook:`A rival crew wants Castillo's routes, starting with yours.`,
  recap:`The Medina brothers, Castillo's rivals, shadowed your jet into Kingston and made you an offer.`,
  brief:[`Not everyone in the islands works for Castillo. The Medina brothers run boats and planes out of Venezuela, and lately they've been hitting Castillo's routes.`,`Tonight's run is a short hop across Jamaica to Kingston. Tico rides along, chattering about flight school. "Nobody hits the jet, boss," he says. "Who would even try?"`],
  teach:[`Kingston is a short hop. Keep the jet slow on the approach; Norman Manley sits right on the water.`],
  out:{good:`On the Kingston ramp, a man in a white guayabera is leaning on a car beside your parking spot. "Rafael Medina," he says. "Nice flying. Let's talk."`,ok:`On the Kingston ramp, a man in a white guayabera is waiting beside your parking spot. "Rafael Medina," he says. "Let's talk."`,bad:`On the Kingston ramp, a man in a white guayabera is waiting. "Rafael Medina," he says. "Rough landing. Let's talk anyway."`},rep:{},
  choice:{q:`Medina makes it simple: "Castillo pays you a cut. I'll pay you double to fly for me, and to tell me where his planes go."`,opts:[
    {t:`Turn him down`,out:`"Loyal," Medina says, getting back in his car. "Castillo doesn't deserve you. You'll see." Castillo hears about it by morning and sends you a bonus.`,cash:15000,power:8},
    {t:`Take his money, keep both doors open`,flag:'medinaDeal',out:`$50,000 in a gym bag, and now two dangerous men think you work for them. Tico watches you take the bag and says nothing.`,cash:50000,heat:8,power:4}]}},
 {id:'CR11',arc:'Bigger Wings',title:`The Rat`,chars:['castillo','tico'],req:{after:'CRM'},from:'MKJS',to:'MWCR',ac:BIZJ,pax:2,cargo:0,cargoLabel:`two passengers`,time:'night',dep:1260,wx:'calm',
  hook:`Someone in the crew is talking. Castillo wants you to fly him out.`,
  recap:`One of Castillo's men, Tico, was talking to the DEA. You were the one who flew him to Grand Cayman.`,
  brief:[`Someone has been talking to the DEA, and Castillo thinks it's Tico, your loader, the kid who wants to be a pilot. "Fly him to Grand Cayman," Castillo says. "Someone will meet him there to talk."`,`Tico sits in the back next to Castillo's driver. He knows. You can see it in his face.`],
  teach:[`Grand Cayman at night is a small island and a lot of black water. Fly the approach on instruments and trust them.`],
  out:{good:`A smooth landing at Grand Cayman.`,ok:`A firm landing at Grand Cayman.`,bad:`A rough landing at Grand Cayman. Tico is shaking.`},rep:{castillo:2},
  choice:{q:`Over the water, Castillo's driver falls asleep. Tico leans forward and whispers: "I talked to them once. Once. I have a daughter. Please."`,opts:[
    {t:`Give Tico a chance to run`,flag:'ticoRan',out:`You park on the far ramp "for fuel". Tico is over the fence before the engines spool down. Castillo will ask questions you'll have to answer.`,heat:8,con:1,power:-6},
    {t:`Deliver him as ordered`,out:`Tico gets into a car at Grand Cayman, and you never see him again. Castillo sends a case of rum and a note with one word on it: "Loyalty."`,power:10,con:-1}]}},
 {id:'CR12',arc:'Bigger Wings',title:`Dez`,chars:['dez','mari'],req:{after:'CR11'},from:'MWCR',to:'TNCM',ac:BIZJ,pax:1,cargo:20,cargoLabel:`a lawyer and her files`,time:'day',dep:600,wx:'trades',
  hook:`Dez was arrested at Juliana, and he's the one who got you into this.`,
  recap:`Dez was arrested at Juliana with a cooler that wasn't full of fish. You decided what happened to him.`,
  brief:[`Customs finally opened one of Dez's coolers. It wasn't fish. He's in a cell on Sint Maarten, and he hasn't said a word.`,`You're flying Castillo's best lawyer home to Juliana. On the way, she asks you a simple question: "How much is Dez worth to you?"`],
  teach:[`Home to Juliana. Runway 10, over Maho Beach, and try not to blow anyone into the water.`],
  out:{good:`The lawyer walks into the courthouse two hours later.`,ok:`The lawyer walks into the courthouse two hours later.`,bad:`The lawyer walks into the courthouse two hours later, still pale from the landing.`},
  choice:{q:`The lawyer can get Dez out on bail, but someone has to pay, and Castillo won't.`,opts:[
    {t:`Pay for Dez's defense yourself`,flag:'dezFree',out:`Dez is out on bail within the week. He finds you in the hangar and hugs you hard. "I don't forget," he says. Neither does anyone else in the hangar.`,cash:-15000,power:5,rep:{dez:20}},
    {t:`Let him take the fall`,flag:'dezJail',out:`Dez gets eight years and never says your name. The heat around Juliana dies down. You tell yourself it's business.`,power:8,heat:-15,rep:{dez:-30,mari:-10}}]}},
 {id:'CR13',arc:'Bigger Wings',title:`Mari`,chars:['mari'],req:{after:'CR12'},from:'TNCM',to:'TFFG',ac:BIZJ.concat(GA),pax:1,cargo:0,cargoLabel:`Mari`,time:'dusk',dep:1050,wx:'calm',
  hook:`Mari found the money. She wants to go flying, just the two of you.`,
  recap:`Mari found out about everything. You decided whether she stayed or walked away.`,
  brief:[`Mari found the cash in hangar three. All of it.`,`She doesn't yell. She asks if you'll take her flying, just the two of you, over to Grand Case like when you were new. She doesn't say a word until you're on final.`],
  teach:[`Grand Case has a hill right off the end of runway 30. A short hop. Keep it slow and stable.`],
  out:{good:`You land softly at Grand Case. Mari watches the sunset for a long time before she speaks.`,ok:`You land at Grand Case. Mari watches the sunset for a long time before she speaks.`,bad:`You land hard at Grand Case, and Mari doesn't comment. She has bigger things on her mind.`},
  choice:{q:`"I know what you are now," Mari says. "So tell me. Do I get on board, or do I get out?"`,opts:[
    {t:`Bring her in as your partner`,out:`Mari is quiet for a long time. Then: "If we do this, we do it my way. No more kids in the back." She turns out to be the best logistics mind the network has ever had.`,power:8,rep:{mari:10},flag:'mari'},
    {t:`Let her walk away`,out:`Mari signs her half of Coral Wing over to you for one dollar and leaves on the morning ferry. The airline is yours now.`,power:6,con:1}]}},

 /* ---------- ACT 4: HEAVY METAL (airliners) ---------- */
 {id:'CR14',arc:'Heavy Metal',title:`Hartwell's Secret`,chars:['hartwell','castillo'],req:{after:'CR13',ratings:['ATP']},from:'TNCM',to:'MDSD',ac:LINER,pax:2,cargo:30000,cargoLabel:`15 tons of "machine parts"`,time:'day',dep:660,wx:'trades',
  hook:`Your first airliner, and a billionaire who wants out.`,
  recap:`You flew your first airliner load to Santo Domingo. Lionel Hartwell handed you the ledgers that hold Castillo's money.`,
  brief:[`Your airline licence is still warm. Castillo has leased a tired 737 under a fake name, and you're flying fifteen tons to Santo Domingo. Lionel Hartwell, whose charity owns the Vision Jet on paper, is riding in the jump seat.`,`At cruise he finally speaks. His coral foundation has been washing Castillo's money for years, and he wants out. He puts a locked case on the console. "The ledgers. Every account. Whoever holds these holds Castillo."`],
  teach:[`Your first airliner: brief the departure, use the autopilot and FMS, and fly a stabilized ILS at Santo Domingo. Autopilot off by 1,000 ft if you're feeling brave.`],
  out:{good:`You grease the 737 on at Santo Domingo. Hartwell nods slowly. "He was right about you."`,ok:`The 737 is on the ground in Santo Domingo, in one piece. Hartwell unclenches his hands.`,bad:`A heavy landing. Fifteen tons of "machine parts" shift in the hold. Hartwell is very quiet.`},rep:{hartwell:6},
  choice:{q:`The ledgers are in your hands. With them, every dollar Castillo moves would have to pass through you.`,opts:[
    {t:`Keep the ledgers`,out:`You move the accounts that night. For the first time, Castillo needs you more than you need him. He just doesn't know it yet.`,power:12},
    {t:`Give the ledgers to Reyes`,out:`Reyes holds the ledgers like a winning lottery ticket. "This is it," she says. "A little longer, and we end him."`,heat:-30,flag:'ledgers'}]}},
 {id:'CR15',arc:'Heavy Metal',title:`Caribe Cargo`,chars:['castillo','mari'],req:{after:'CR14'},from:'MDSD',to:'MPTO',ac:LINER,pax:0,cargo:36000,cargoLabel:`18 tons of "fresh flowers"`,time:'night',dep:1230,wx:'trades',
  hook:`Your own cargo airline, eighteen tons a night, and a partner who wants half.`,
  recap:`You launched Caribe Cargo, your own airline, and flew eighteen tons of "flowers" to Panama.`,
  brief:[`With Hartwell's money you buy a struggling freight company and paint a new name on the tails: Caribe Cargo. On paper it flies flowers and fish. In reality it flies eighteen tons a night of whatever pays.`,`Castillo comes to the hangar for the first flight. He walks around the 737 slowly, like he's pricing it. "Nice airline," he says. "I'll take half."`],
  teach:[`A long night leg to Panama City. Plan your fuel with a real reserve, and expect thunderstorms near the coast.`],
  out:{good:`Eighteen tons of "flowers" land at Tocumen right on schedule. Customs waves the pallets through without looking. It's your airline now.`,ok:`The flowers land in Panama. Customs barely looks. It's your airline now.`,bad:`A rough night and a firm landing, but the pallets are in Panama. It's your airline now.`},rep:{castillo:4},
  choice:{q:`Castillo wants half of Caribe Cargo. He's smiling, but his driver isn't.`,opts:[
    {t:`Give him 30% and keep the rest`,out:`"Thirty," Castillo repeats, then laughs. "You've changed." He takes it. For now.`,power:10,heat:4},
    {t:`Tell him it's yours`,flag:'defied',out:`The hangar goes quiet. Castillo looks at you for a long time, then nods and leaves without a word. You've never been more scared, or felt more alive.`,power:12,heat:8}]}},

 {id:'CRB',arc:'Heavy Metal',title:`The Setup`,chars:['castillo','medina'],req:{after:'CR15'},from:'MPTO',to:'MMUN',ac:LINER,pax:0,cargo:34000,cargoLabel:`17 tons for Castillo's buyers`,time:'night',dep:1200,wx:'trades',
  hook:`Castillo booked this run himself. That should have been your first warning.`,
  recap:`Castillo sold you out to the Medinas at Cancún. Now it's war.`,
  brief:[`Since the fight over Caribe Cargo, Castillo is suddenly friendly again. He books you a run himself: seventeen tons to Cancún for his Mexican buyers. "Like old times," he says.`,`It's the nicest he's been in months. That bothers you all the way up to cruising altitude.`],
  teach:[`Cancún is long and wide. A good place for a smooth landing, whatever is waiting on the ramp.`],
  out:{good:`On the cargo ramp, three trucks box the airliner in. Medina's men take the whole load at gunpoint. "Castillo sold you to me," Medina says. "I just wanted you to know."`,ok:`On the cargo ramp, three trucks box you in. Medina's men take the whole load. "Castillo sold you to me," Medina says.`,bad:`On the cargo ramp, three trucks box you in. Medina's men take the whole load. "Castillo sold you to me," Medina says.`},rep:{castillo:-30},
  choice:{q:`Castillo sold you out. Everything you've built is on the line.`,opts:[
    {t:`Go to war with Castillo`,flag:'war',out:`You stop answering Castillo's calls and start calling his pilots instead. Half of them already fly for you. The other half will.`,power:12,heat:6},
    {t:`Act like nothing happened, and wait`,flag:'patient',out:`You smile, you fly, you say thank you. Castillo thinks he's won. He hasn't noticed you writing everything down.`,power:8}]}},

 /* ---------- ACT 5: THE LAST RUN (747) ---------- */
 {id:'CR16',arc:'The Last Run',title:`Heavy`,chars:['mari'],req:{after:'CRB'},from:'MPTO',to:'MKJS',ac:['B748'],pax:0,cargo:160000,cargoLabel:`80 tons of "textiles"`,time:'night',dep:1290,wx:'trades',
  hook:`A Boeing 747 and 80 tons. The biggest load the Caribbean has ever seen.`,
  recap:`You flew a 747 with 80 tons of "textiles" from Panama to Jamaica, the biggest load in the network's history.`,
  brief:[`A 747-8 freighter sits on the cargo ramp at Panama City with Caribe Cargo painted on the tail. Eighty tons of "textiles". More product in one airplane than the whole network moved last year.`,`Climbing out over the Pacific, with four engines roaring behind you, you realize you aren't scared of anything anymore. That should scare you.`],
  teach:[`The 747 is enormous and slow to respond. Plan everything early: the climb, the descent, the turn onto final. Fly the ILS at Montego Bay and let it settle.`],
  out:{good:`The 747 kisses the runway at Montego Bay. Mari, in the right seat, just shakes her head and laughs.`,ok:`Eighty tons on the ground at Montego Bay. The trucks are already lining up.`,bad:`A heavy, heavy landing, but eighty tons are on the ground at Montego Bay.`},rep:{castillo:4}},
 {id:'CRT',arc:'The Last Run',title:`The Table`,chars:['medina'],req:{after:'CR16'},from:'MKJS',to:'MMUN',ac:['B748'],pax:0,cargo:150000,cargoLabel:`75 tons for the suppliers`,time:'day',dep:720,wx:'trades',
  hook:`Fly the 747 to Cancún and convince the suppliers to deal with you, not Castillo.`,
  recap:`You flew the 747 into Cancún and won over the suppliers. Castillo's network is starting to answer to you.`,
  brief:[`Castillo's money comes from the suppliers in Mexico, and the suppliers go where the big airplanes go. You have the biggest airplane in the Caribbean.`,`You fly the 747 into Cancún, the same airport where Castillo sold you out, to sit down with the people who actually run things. Rafael Medina is already at the table.`],
  teach:[`A 747 at Cancún. Fly the ILS, keep it stable and make it look easy. Everyone at that table is watching.`],
  out:{good:`A perfect landing in front of everyone who matters. By dessert, the suppliers have agreed to move their product on Caribe Cargo. Not Castillo's network. Yours.`,ok:`A solid landing. By dessert, the suppliers have agreed to move their product on Caribe Cargo.`,bad:`A heavy landing in front of everyone who matters. It takes a long night of talking, but the suppliers come around.`},rep:{},
  choice:{q:`Medina leans in: "Together, we squeeze Castillo out. After that, we split the Caribbean."`,opts:[
    {t:`Shake his hand`,flag:'medinaAlly',out:`Medina grins and pours two glasses. "Partners." You both know it won't last, but tonight it's enough.`,power:12},
    {t:`Hand Medina's routes to the DEA`,flag:'medinaBurned',out:`Two days later, DEA boats hit every Medina route at once. With Medina gone, the suppliers have only one choice left: you.`,heat:-20,power:8}]}},
 {id:'CR17',arc:'The Last Run',title:`The Last Run`,chars:['castillo','reyes'],req:{after:'CRT'},from:'MMUN',to:'KMIA',ac:['B748'],pax:2,cargo:200000,cargoLabel:`100 tons. Everything.`,time:'night',dep:1260,wx:'showers',
  hook:`The last run: a 747 into Miami with everything on board, and Castillo in the jump seat.`,
  recap:`You flew the last run into Miami with Castillo in the jump seat.`,
  brief:[`One final run: a 747 into Miami with a hundred tons on board, everything the network has. Castillo has asked to ride in the jump seat "to make peace". You both know that's a lie.`,`Reyes has a team waiting at Miami. Castillo wants his network back. And you hold the airline, the ledgers, the routes and the pilots. Tonight decides who runs the Caribbean.`],
  teach:[`Miami is huge and busy. Fly the full STAR and ILS, keep your speed exactly where approach wants it, and land in the touchdown zone.`],
  out:{good:`Wheels down at Miami, smooth as glass.`,ok:`Wheels down at Miami.`,bad:`A hard landing at Miami jolts Castillo awake.`},rep:{},
  choice:{q:`Engines off on the Miami cargo ramp. Castillo is unbuckling in the jump seat. Three things can happen next, and only you decide.`,opts:[
    {t:`Take his place`,out:`You make one phone call. When the cargo door opens, it isn't Castillo's people on the ramp. It's yours. By morning, every route, every airline and every pilot in the Caribbean answers to you. ENDING: KINGPIN.`,power:100,ending:'kingpin'},
    {t:`Hand him to Reyes`,out:`Agents swarm the 747. Castillo looks at you once and smiles, as if he always knew. You testify, lose your licences and your name, and start over on an island nobody has heard of. ENDING: WITNESS.`,heat:-100,ending:'witness'},
    {t:`Take the money and vanish`,out:`While they argue on the ramp, you walk to a Citation you parked there yesterday, fueled and paid in cash. By sunrise you're over South America with ten million dollars in the back. Nobody ever sees you again. ENDING: GHOST.`,cash:250000,ending:'ghost'}]}}

];
const CRIME_IDS = new Set(CRIME.map(m=>m.id));

/* ---- swap the old main story out and this one in ---- */
(function(){
  const oldMain = new Set(MAIN_ORDER);
  for(let i=STORY.length-1;i>=0;i--) if(oldMain.has(STORY[i].arc)) STORY.splice(i,1);
  MAIN_ORDER.splice(0, MAIN_ORDER.length, ...CRIME_ACTS.map(a=>a.arc));
  CRIME_ACTS.forEach((a,i)=>{ ARC_META[a.arc]={n:i+1, tag:a.tag, col:a.col, main:true}; if(typeof ARC_COLORS!=='undefined') ARC_COLORS[a.arc]=a.col; });
  STORY.unshift(...CRIME);
})();

/* ---- state ---- */
function crime(st){ st=st||S.st; if(!st) return {power:0,heat:0,con:0,on:false,flags:{},choice:{}}; st.crime = st.crime || {power:0,heat:0,con:0,on:false,flags:{},choice:{}}; st.crime.flags=st.crime.flags||{}; st.crime.choice=st.crime.choice||{}; return st.crime; }
const CR_RANKS = [[0,'Pilot'],[12,'Courier'],[28,'Runner'],[45,'Lieutenant'],[65,'Partner'],[85,'Boss']];
function crimeRank(c){ if(c.ending==='kingpin') return 'Kingpin'; if(c.ending==='witness') return 'Witness'; if(c.ending==='ghost') return 'Ghost'; let r='Pilot'; CR_RANKS.forEach(([v,n])=>{ if(c.power>=v) r=n; }); return r; }
function crBump(c, k, v){ c[k]=clamp(Math.round((c[k]||0)+v), k==='con'?-10:0, k==='con'?10:100); }


/* ---- after a chapter: power, heat, customs searches; side jobs are legit cover that cools the heat ---- */

/* ---- choices: two or three options, each changes Power / Heat / cash / people ---- */
function crimeChoiceHTML(st){ const L=st.last; const j=L&&L.job; if(!j || j.kind!=='story' || !CRIME_IDS.has(j.story) || (L.res&&L.res.crash)) return null;
  const m=CRIME.find(x=>x.id===j.story); if(!m || !m.choice) return null; const c=crime(st); const picked=c.choice[m.id];
  if(picked!=null){ const o=m.choice.opts[picked]; return `<section class="panel choice made" style="--arc:${arcMeta(m.arc).col}"><p class="label">You chose: ${esc(o.t)}</p><p class="brief" style="margin:6px 0 0">${esc(o.out)}</p>${fxLine(o)}</section>`; }
  return `<section class="panel choice" style="--arc:${arcMeta(m.arc).col}"><p class="label">Your call</p><p class="brief" style="margin:6px 0 12px">${esc(m.choice.q)}</p><div class="choice-btns">${m.choice.opts.map((o,i)=>`<button class="btn ${i===0?'primary':''}" data-act="crime-choose" data-i="${i}">${esc(o.t)}</button>`).join('')}</div><p class="tiny muted" style="margin-top:8px">This choice sticks, and the story remembers it.</p></section>`; }
function fxLine(o){ const b=[]; if(o.power) b.push(`Power ${o.power>0?'+':''}${o.power>=100?'max':o.power}`); if(o.heat) b.push(`Heat ${o.heat>0?'+':''}${o.heat<=-100?'cleared':o.heat}`); if(o.cash) b.push(`${o.cash>0?'+':'−'}${money(Math.abs(o.cash))}`); return b.length?`<p class="tiny muted" style="margin-top:8px">${b.join(' · ')}</p>`:''; }
const _crChoice = choiceHTML;
choiceHTML = function(st){ const h=crimeChoiceHTML(st); return h!=null ? h : _crChoice(st); };
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="crime-choose"]'); if(!b || !S.st || !S.st.last) return; const st=S.st; const id=st.last.job.story; const m=CRIME.find(x=>x.id===id); const c=crime(st); if(!m || !m.choice || c.choice[id]!=null) return;
  const i=Number(b.dataset.i); const o=m.choice.opts[i]; c.choice[id]=i;
  if(o.power) crBump(c,'power',o.power); if(o.heat) crBump(c,'heat',o.heat); if(o.con) crBump(c,'con',o.con); if(o.flag) c.flags[o.flag]=1; if(o.ending) c.ending=o.ending;
  if(o.cash) txn(st, o.cash, o.cash>0?'Story':'Story', m.title);
  if(o.rep) for(const k in o.rep){ st.rep[k]=clamp((st.rep[k]||10)+o.rep[k],0,100); }
  addJournal(st, `${m.title}: ${o.t}`, o.out, m.chars, o.ending?'milestone':'story'); save();
  if(o.ending) setTimeout(()=>{ try{ confetti && confetti(); }catch(_){} }, 300);
  S.keepScroll=true; render(); });

/* ---- the story dashboard: always the first thing on the board until the story is finished ---- */



/* ---- side jobs grow with the story: 2 at the start, up to 6 by Act 3 ---- */

/* ---- styles ---- */
(function(){ const css=`
.hq .hq-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
.hq .hq-top h2{font-size:22px;margin:2px 0 2px;color:var(--arc)}
.hq-meters{display:grid;gap:6px;min-width:210px}
.hq-rank{justify-self:start;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--arc) 18%,transparent);color:var(--arc)}
.hq-m{display:grid;grid-template-columns:44px 1fr 28px;gap:8px;align-items:center;font-size:12px}
.hq-bar{height:8px;border-radius:6px;background:color-mix(in srgb,currentColor 12%,transparent);overflow:hidden}.hq-bar i{display:block;height:100%;border-radius:6px}
.hq-acts{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0 10px}
.hq-act{font-size:11px;opacity:.55}.hq-act.on{opacity:1}.hq-act span{display:block;margin-bottom:4px;font-weight:600;color:var(--c)}
.hq-dots{display:flex;gap:4px}.hq-dots i{flex:1;height:6px;border-radius:4px;background:color-mix(in srgb,var(--c) 22%,transparent)}.hq-dots i.d{background:var(--c)}.hq-dots i.n{background:var(--c);opacity:.5;animation:none;outline:2px solid var(--c);outline-offset:1px}
.hq-prev{font-size:14px;margin:6px 0 12px;padding:10px 12px;border-left:3px solid var(--arc);background:color-mix(in srgb,var(--arc) 7%,transparent);border-radius:0 8px 8px 0}
.hq-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.main-next .hq-chips .chip{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.28)}
.hq{margin-bottom:16px}
.hq-who{display:flex;gap:12px;margin:6px 0}.hq-p{display:flex;align-items:center;gap:6px}.hq-p .avatar{width:30px;height:30px}.hq-p small{font-size:12px}
.choice.made{border-left:4px solid var(--arc)}
@media (max-width:640px){.hq-acts{grid-template-columns:repeat(2,1fr)}.hq-meters{min-width:0;width:100%}}`;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); })();

/* ---- the chapter screen: "Previously" and "Your goal" for every chapter ---- */
(function(){ const GOALS = { CW1:`Fly Dez and his box to Anguilla. Don't ask questions.`, CR2:`Get the bag to Nevis.`, CR3:`Get home to Juliana and through customs.`, CR4:`Fly Castillo to Antigua and hear what he wants.`,
  CR5:`Fly the Vision Jet and the money home to Juliana.`, CR6:`Get four people to Tortola, no stops, no radio.`, CR7:`Beat the police: get the lawyer to San Juan.`, CR8:`Fly twenty bags through the storm to Punta Cana.`,
  CR9:`Deliver the case to St. Croix.`, CR10:`Fly your first Citation load to Montego Bay.`, CR11:`Fly Tico to Grand Cayman.`, CR12:`Get Castillo's lawyer home to Juliana.`, CR13:`Take Mari flying, and give her an answer.`,
  CR14:`Fly your first airliner load to Santo Domingo.`, CR15:`Launch Caribe Cargo: 18 tons to Panama.`, CRB:`Deliver 17 tons to Cancún for Castillo.`, CRM:`Fly 900 lb across Jamaica to Kingston.`, CRT:`Fly the 747 to Cancún and win over the suppliers.`, CR16:`Fly the 747 and 80 tons to Montego Bay.`, CR17:`The last run: a 747 into Miami.` };
  CRIME.forEach((m,i)=>{ CH_GOAL[m.id] = [GOALS[m.id]||'', i ? CRIME[i-1].recap : `Your first months flying for Coral Wing Air. Money is tight.`]; }); })();

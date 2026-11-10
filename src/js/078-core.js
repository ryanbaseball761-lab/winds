/* ===================== PROLOGUES: a short cutscene before every main-story chapter ===================== */
/* each shot: [place caption, speaker key (null = narration), line] */
const PRO = {
 CW1:[[`Coral Wing Air · Juliana · 7:40 AM`,null,`The hangar smells like avgas and burnt coffee. A stack of unpaid invoices sits on Mari's desk, weighed down by a wrench.`],
      [`Mari's office`,'mari',`Fuel supplier wants cash up front now. Cash. Like we're a fruit stand.`],
      [`The ramp`,'dez',`Morning, rookie. Easy one today. Anguilla and back. I'll ride along.`],
      [`The ramp`,null,`He's carrying a box wrapped in brown tape. He doesn't put it in the cargo log.`]],
 CR2:[[`Anguilla · 9:15 AM`,null,`Your phone buzzes before you've finished breakfast.`],
      [`Phone call`,'dez',`Same friend, one bag, Anguilla to Nevis. Five hundred for you. Don't open it.`],
      [`Wallblake ramp`,null,`The bag is heavy. The padlock is new. The zipper is already split an inch.`]],
 CR3:[[`Nevis · 1:50 PM`,null,`Two coolers sit by the plane. The man loading them is sweating harder than the heat explains.`],
      [`The ramp`,'dez',`Fish. Just fish. Bring them home and don't stop to chat with anybody.`],
      [`Cockpit`,null,`You strap in. Your hands are shaking a little. You tell yourself it's the coffee.`]],
 CR4:[[`Juliana · 4:45 PM`,null,`Two men in linen suits walk across the ramp like they own it. Maybe they do.`],
      [`The ramp`,'castillo',`You must be the pilot Dez keeps telling me about. Calm hands, he says. I'd like to see that.`],
      [`The ramp`,'dez',`Be nice to this one, rookie. Real nice.`]],
 CR5:[[`Private hangar · San Juan · 9:30 AM`,null,`The hangar door rolls up. A white Vision Jet sits under the lights, polished like jewelry.`],
      [`Hangar office`,'hartwell',`Lionel Hartwell. My foundation owns her, on paper. Mateo says you're the best he's found.`],
      [`Phone call`,'castillo',`Nine bags. Don't count them this time. Just fly.`],
      [`Cockpit`,null,`You run your hand along the glareshield. Last month you were flying a Cessna with a cracked seat.`]],
 CR6:[[`Juliana · 10:50 PM`,null,`A van pulls up to the jet with its lights off.`],
      [`The ramp`,null,`Four people climb out. A mother. Her brother. A young man. A boy, maybe ten, holding an inhaler like a toy.`],
      [`Phone call`,'castillo',`No stops. No radio. They paid for a quiet flight.`]],
 CR7:[[`Beef Island, Tortola · 10:45 AM`,null,`A man in a wrinkled suit is running across the ramp, clutching a sandwich bag to his chest.`],
      [`The ramp`,null,`"Philippe Arnaud. I'm Mr. Castillo's lawyer. The police are at my office at noon. Please, can we go?"`],
      [`Cockpit`,null,`He's sweating through his shirt. You start the engine before he's finished buckling in.`]],
 CR8:[[`San Juan · 3:30 PM`,null,`The sky to the east is a wall of grey. The Coast Guard helicopters are being towed into their hangar.`],
      [`Phone call`,'castillo',`Nobody else will fly today. That's the point.`],
      [`The ramp`,'tico',`You're the pilot? Tico. I load the bags. Someday I'm gonna fly one of these, boss. Watch.`]],
 CR9:[[`Punta Cana · 9:40 AM`,null,`A routine run. A sealed case, a contact on St. Croix. You've done twenty of these.`],
      [`Cockpit`,null,`You don't notice the man in the terminal window, taking pictures of your tail number.`]],
 CR10:[[`St. Croix · 11:30 AM`,null,`A Citation CJ4 waits on the ramp. Your name is painted under the cockpit window.`],
      [`Phone call`,'castillo',`You're not a courier anymore. You're part of the machine.`],
      [`The ramp`,'tico',`Boss! I'm on your crew now! This is the best day of my whole life.`]],
 CRM:[[`Montego Bay · 8:20 PM`,null,`The trucks are late. Nobody is ever late on a Castillo run.`],
      [`The ramp`,'tico',`Relax, boss. Nobody hits the jet. Who would even try?`],
      [`Across the airfield`,null,`A dark jet with no lights is sitting at the far end of the ramp. Its engines are running.`]],
 CR11:[[`Castillo's villa · Punta Cana · 7:00 PM`,'castillo',`Somebody on your crew talks to the DEA. I think it's Tico.`],
      [`The villa`,'castillo',`Fly him to Grand Cayman. Someone will meet him there to talk. Just talk.`],
      [`The ramp`,null,`Tico is waiting by the jet, smiling like it's any other night. Then he sees the driver getting in behind him.`]],
 CR12:[[`Grand Cayman · 8:30 AM`,null,`The news is on every TV in the terminal: "Coral Wing mechanic arrested at Juliana."`],
      [`Phone call`,'castillo',`Dez knew the risks. My lawyer will ride with you. Don't get sentimental.`],
      [`The ramp`,null,`The lawyer is already on board, reading Dez's file. She doesn't look up.`]],
 CR13:[[`Coral Wing hangar · 5:10 PM`,null,`Hangar three. A toolbox on the floor, lid open. Inside, under the trays, the money.`],
      [`The hangar`,'mari',`Don't. Don't explain. Just take me flying. Like when you were new.`]],
 CR14:[[`Juliana · 10:30 AM`,null,`Your airline licence is three days old. The 737 on the cargo ramp is twenty-two years older.`],
      [`The jet bridge`,'hartwell',`I'll ride in the jump seat, if you don't mind. I have something to give you, and I don't trust phones.`],
      [`Cockpit`,null,`Fifteen tons in the hold. You've never felt calmer.`]],
 CR15:[[`Santo Domingo · 8:15 PM`,null,`A fresh coat of paint is drying on the tail: CARIBE CARGO. Your airline.`],
      [`The ramp`,'castillo',`Nice airline. I'll take half.`],
      [`The ramp`,null,`He says it with a smile. His driver doesn't smile at all.`]],
 CRB:[[`Panama City · 7:45 PM`,'castillo',`My friend! No hard feelings about the airline. I've booked you a run myself. Like old times.`],
      [`The ramp`,null,`Seventeen tons for Cancún. Castillo shakes your hand for a long time.`],
      [`Cockpit`,null,`It's the nicest he's been in months. That's the part that bothers you.`]],
 CR16:[[`Tocumen cargo ramp · 9:30 PM`,null,`The 747-8 freighter is the biggest thing on the airfield. Eighty tons of "textiles" are going in through the nose.`],
      [`The ramp`,null,`Two years ago you were scared of a taped box in a Cessna. You stand under the wing and laugh out loud.`]],
 CRT:[[`Montego Bay · 11:00 AM`,null,`The suppliers want a meeting in Cancún. The same airport where Castillo sold you out.`],
      [`Phone call`,'medina',`I'll save you a seat at the table, my friend. Bring the big airplane. They like big airplanes.`]],
 CR17:[[`Cancún · 8:30 PM`,null,`One hundred tons. Everything the network has, in one airplane.`],
      [`The jump seat`,'castillo',`I'll ride along, if you don't mind. To make peace.`],
      [`Cockpit`,null,`Nobody believes that. Least of all you. Somewhere in Miami, Reyes is waiting.`]]
};
/* continuity variants */
const PRO_DYN = {
  CR13:f=>f.dezJail?[[`Coral Wing hangar · 5:10 PM`,null,`With Dez gone, the hangar is quiet. Mari has been going through his toolboxes.`],[`Hangar three`,null,`Under the trays, the money. All of it.`],[`The hangar`,'mari',`Don't. Don't explain. Just take me flying. Like when you were new.`]]:null,
  CR16:f=>f.mari?[[`Tocumen cargo ramp · 9:30 PM`,null,`The 747-8 freighter is the biggest thing on the airfield. Eighty tons are going in through the nose.`],[`The ramp`,'mari',`Eighty tons, and I tracked every pallet. Bring her home, partner.`],[`The ramp`,null,`Two years ago you were scared of a taped box in a Cessna. You stand under the wing and laugh out loud.`]]:null,
  CR17:f=>(f.informant||f.ledgers)?PRO.CR17.concat([[`Text message`,'reyes',`We're in position. Whatever you're planning, don't.`]]):null
};
const PRO_VOICE = { dez:[false,1.05,1], mari:[true,1,1.05], castillo:[false,0.92,0.8], hartwell:[false,0.95,0.9], tico:[false,1.12,1.05], reyes:[true,1,1], medina:[false,0.95,0.85] };

var playPrologue; /* defined in full below (081-core.js) */

/* play it the first time you start a chapter; the click goes through once it's over */
window.addEventListener('click', e=>{ const b=e.target.closest('[data-act="accept-story"],[data-act="story-go"]'); if(!b || b.disabled || !S.st) return; if(typeof fedsWatching==='function' && crime().on && fedsWatching(S.st)) return; const id=b.dataset.id; if(!CRIME_IDS.has(id)) return; const c=crime(); c.proSeen=c.proSeen||{};
  if(S._proPass){ S._proPass=false; return; } if(c.proSeen[id]) return; const m=CRIME.find(x=>x.id===id); if(!m || !proFor(id)) return;
  e.stopImmediatePropagation(); e.preventDefault(); c.proSeen[id]=1; save();
  playPrologue(m, ()=>{ S._proPass=true; const again=document.querySelector(`[data-act="${b.dataset.act}"][data-id="${id}"]`)||b; again.click(); S._proPass=false; }); }, true);
/* replay from the flight screen */
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="pro-replay"]')||!S.st||!S.st.active) return; const m=CRIME.find(x=>x.id===S.st.active.job.story); if(m) playPrologue(m, ()=>{}); });

(function(){ const css=`
.cut{position:fixed;inset:0;z-index:10000;background:#000;opacity:0;transition:opacity .6s;overflow:hidden;cursor:pointer;color:#ece6da}
.cut.on{opacity:1}
.cut-bg{position:absolute;inset:-4%;transition:transform 7s ease-out;filter:saturate(.45) brightness(.45) contrast(1.15)}.cut-bg svg{width:100%;height:100%;display:block}
.cut-shade{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,.75) 100%),linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.65))}
.cut-bar{position:absolute;left:0;right:0;height:11vh;background:#000;z-index:2}.cut-bar.top{top:0}.cut-bar.bot{bottom:0}
.cut-stage{position:absolute;left:0;right:0;bottom:15vh;z-index:3;padding:0 8vw;max-width:1100px}
.cut-place{font-family:var(--f-mono);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--arc);margin:0 0 14px}
.cut-line{opacity:0;transform:translateY(10px)}.cut-line.in{opacity:1;transform:none;transition:.5s}
.cut-who{display:flex;align-items:center;gap:12px;margin-bottom:10px}.cut-who .avatar{width:52px;height:52px}.cut-who b{font-size:15px;letter-spacing:.04em}
.cut-text{font-size:clamp(20px,2.4vw,30px);line-height:1.45;margin:0;max-width:900px;text-shadow:0 2px 12px rgba(0,0,0,.8)}.cut-text.nar{font-style:italic;color:#d6d0c4}
.cut-ctl{position:absolute;right:28px;bottom:calc(11vh + 16px);z-index:4;display:flex;gap:14px;align-items:center}
.cut-hint{font-size:12px;color:#8f897e}.cut-skip{background:transparent;border:1px solid #4a4a50;color:#cfc8bb;border-radius:6px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer}.cut-skip:hover{border-color:#c8962a;color:#fff}
.cut.title .cut-ctl{display:none}.cut-title{text-align:left;animation:cutT 2.2s ease}.cut-title p{font-family:var(--f-mono);font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--arc);margin:0 0 8px}.cut-title h1{font-size:clamp(40px,6vw,76px);margin:0;letter-spacing:-.02em}
@keyframes cutT{0%{opacity:0;transform:translateY(12px)}20%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.pro-replay{float:right;position:relative;z-index:2}
@media (prefers-reduced-motion:reduce){.cut-bg{transition:none}.cut-line.in{transition:none}}`;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); })();

/* ===================== FASTER TO THE BIG JETS: ratings follow the story ===================== */
try{
  RATINGS.JET.req = {after:['PPL'], hours:1};
  RATINGS.JET.unlocks = `Business jets: the Vision Jet and the Citation CJ4. Castillo is paying.`;
  RATINGS.JET.tasks = [`Climb to FL250 or above`,`Descent planned early, arrival at the right speed`,`Approach at Vref ±5 kt and a landing in the touchdown zone`];
  RATINGS.ATP.req = {after:['JET'], hours:6};
  RATINGS.ATP.unlocks = `Airliners and heavy freighters: 737, A320, A321, A330 and the 747-8.`;
  RATINGS.ATP.tasks = [`Departure briefing and a clean takeoff`,`Autopilot and FMS from climb to the approach`,`A stabilized ILS and a landing in the touchdown zone`];
}catch(_){}


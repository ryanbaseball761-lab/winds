/* ===================== MORE AIRCRAFT ON THE BOARD ===================== */
/* 1. spread the board across your fleet: no aircraft takes more than two jobs if another one fits */
function refitJob(st, j, acId){ const keep={ac:j.ac,cargo:j.cargo,pax:j.pax}; j.ac=acId; let p=plan(j); if(p.over>0){ j.cargo=Math.max(0,j.cargo-p.over-20); p=plan(j); }
  if(p.over>0 || !p.range || !apOk(st,j.to,acId) || !apOk(st,j.from,acId) || j.pax>AC[acId].pax){ Object.assign(j,keep); return false; } j.pay=payFor(st,j); j.est=p.est; return true; }

/* 2. type checkouts: fly a bigger aircraft than your license allows, with Mari in the right seat */
ARCH.push({id:'checkout', label:'Type checkout', kind:'pax', w:0, cls:['hp','bush','twin','turbo','amph','stol'], need:'PPL', pax:[1,1], cargo:[0,40], char:'mari', story:()=>({title:'',client:'',paras:[]})});
const CHECKOUT_TXT = {
  hp:`The Bonanza is fast, slippery and has retractable gear. Mari's rule: say "gear down, three green" out loud on every approach, even when nobody's listening.`,
  bush:`The Beaver's radial engine wants to swing the nose left on takeoff. Lots of right rudder, and let it fly itself off the water or runway.`,
  twin:`Two engines means two of everything to manage, and an engine failure that pulls you sideways. Mari will pull one back at altitude to see what you do.`,
  turbo:`A turbine is smoother and more powerful than anything you've flown, and it eats fuel. Watch the torque and temperature limits on the takeoff roll.`,
  amph:`An amphibian lands on runways and water. Mari wants to see you check the gear position twice before every landing: wheels for runways, up for water.`,
  stol:`This one gets into strips you'd never try in a Skyhawk. Fly slow, stay ahead of it, and use every bit of the short-field technique.`
};
/* checkout jobs show an instructor tag on the card */
const _fmStrip = stripHTML;
stripHTML = function(st, job, opts){ const h=_fmStrip(st, job, opts); return job.checkout ? h.replace('<article class="jcard', '<article data-checkout="1" class="jcard checkout') : h; };

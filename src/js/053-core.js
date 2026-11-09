/* ===================== MORE AIRCRAFT ON THE BOARD ===================== */
/* 1. spread the board across your fleet: no aircraft takes more than two jobs if another one fits */
function refitJob(st, j, acId){ const keep={ac:j.ac,cargo:j.cargo,pax:j.pax}; j.ac=acId; let p=plan(j); if(p.over>0){ j.cargo=Math.max(0,j.cargo-p.over-20); p=plan(j); }
  if(p.over>0 || !p.range || !apOk(st,j.to,acId) || !apOk(st,j.from,acId) || j.pax>AC[acId].pax){ Object.assign(j,keep); return false; } j.pay=payFor(st,j); j.est=p.est; return true; }
const _fmGen = genJobs;
genJobs = function(st){ const L=_fmGen(st); try{
    const used={}; for(const j of L) used[j.ac]=(used[j.ac]||0)+1;
    for(const j of L){ if(j.kind!=='gen' || j.company || used[j.ac]<=2) continue; const arch=ARCH.find(a=>a.id===j.arch); if(!arch) continue;
      const cands=eligibleAircraft(st).filter(k=>k!==j.ac && arch.cls.includes(AC[k].cls) && (used[k]||0)<2).sort((a,b)=>((used[a]||0)-(used[b]||0)) || ((st.types[a]||0)-(st.types[b]||0)));
      for(const k of cands){ const from=j.ac; if(refitJob(st,j,k)){ used[from]--; used[k]=(used[k]||0)+1; break; } } }
  }catch(_){} return L; };

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
const _fmGen2 = genJobs;
genJobs = function(st){ const L=_fmGen2(st); try{ if(st.company) return L;
    const pool=Object.keys(AC).filter(k=>st.hangar[k] && !canFly(st,k) && CHECKOUT_TXT[AC[k].cls] && !AC[k].custom && !['jet','regional','airliner','widebody'].includes(AC[k].cls) && AC[k].req.filter(r=>!st.ratings[r]).length<=2);
    let n=0; for(let t=0;t<10 && n<2 && pool.length;t++){ const acId=pick(pool); if(L.some(j=>j.ac===acId)) continue; const a=AC[acId];
      const to=pickDest(st, st.loc, acId, {id:'checkout'}, Math.max(25, 40*a.cruise/60)); if(!to) continue;
      const dep=Math.round((st.clock+ri(30,150))/5)*5; const job={ id:uid(), kind:'gen', arch:'checkout', label:'Type checkout', cat:'pax', from:st.loc, to, local:false, tourNm:0, ac:acId, pax:1, cargo:20, dep, wx:genWx(st,to,null,dep), checkout:true, company:false };
      const p=plan(job); if(p.over>0 || !p.range) continue;
      job.title=`Checkout: ${a.n}`; job.client=CAST.mari.n; job.paras=[`Mari wants you checked out in Coral Wing's ${a.n} before the busy season. Your license doesn't cover it on your own yet, so she'll ride in the right seat as your instructor. Fly it to ${AP[to].isl} and back to her standards, and she'll sign your logbook.`, CHECKOUT_TXT[a.cls]];
      job.pay=Math.round(payFor(st,job)*0.45/10)*10; job.est=p.est; L.push(job); n++; pool.splice(pool.indexOf(acId),1); }
  }catch(_){} return L; };
/* checkout jobs show an instructor tag on the card */
const _fmStrip = stripHTML;
stripHTML = function(st, job, opts){ const h=_fmStrip(st, job, opts); return job.checkout ? h.replace('<article class="jcard', '<article data-checkout="1" class="jcard checkout') : h; };

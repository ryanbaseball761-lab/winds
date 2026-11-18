/* ===================== SIMPLER: fewer steps, fewer systems, fewer storylines ===================== */
/* ---- bonus objectives are all checked from MSFS, so no debrief form ---- */
function makeBonus(job){ const amt=Math.max(30, Math.round(job.pay*0.2/10)*10); const opts=['butter','ontime','zone','center']; if(job.pax>0) opts.push('comfort');
  const k=pick(opts);
  return ({ butter:{k, amt, text:`Grease it: touch down under 150 fpm`, auto:'fpm'}, ontime:{k, amt, text:`Arrive on time: block time within 10% of the plan`, auto:'block'},
    zone:{k, amt, text:`Put it on the aiming point: touch down 400–1,800 ft past the threshold`, auto:'zone'}, center:{k, amt, text:`Land on the centerline: within 10 ft`, auto:'center'},
    comfort:{k, amt, text:`Keep the cabin happy: comfort 90 or better at the end`, auto:'comfort'} })[k]; }

/* ---- the flight starts itself when MSFS shows you've started the engine at the departure airport ---- */

/* ---- fewer interruptions: phone calls, urgent pop-ups and the end-of-day recap are off unless you turn them on ---- */
function maybeCall(){}
function urgentOn(){ try{ return localStorage.getItem('tw.urgent')==='on'; }catch(e){ return false; } }

/* ---- fewer, longer storylines: the one- and two-chapter stories become "Island Tales" ---- */
(function(){ const counts={}; STORY.forEach(m=>counts[m.arc]=(counts[m.arc]||0)+1);
  const small=Object.keys(counts).filter(a=>counts[a]<=2 && !MAIN_ORDER.includes(a));
  STORY.forEach(m=>{ if(small.includes(m.arc)){ m.tale=m.arc; m.arc='Island Tales'; } });
  ARC_META['Island Tales'] = {n:14, main:false, tag:`Short stories from around the islands: Rosa's cakes, Dez's cricket, Calloway's comeback, the hurricane relief flights and old passengers returning.`, col:'#2a68aa'};
})();
/* in a collection like Island Tales, the "next" chapter is the first one you can actually fly */


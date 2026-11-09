/* ===================== AIRLINE TRANSPORT PILOT checkride: always to a big runway with both an ILS and an RNAV approach ===================== */
const ILS_FIELDS = [ // [airport, runway, ILS, RNAV]
  ['TJSJ','10','ILS RWY 10','RNAV (GPS) RWY 10'], ['TISX','10','ILS RWY 10','RNAV (GPS) RWY 10'], ['TBPB','09','ILS RWY 09','RNAV (GNSS) RWY 09'],
  ['TFFR','12','ILS RWY 12','RNAV (GNSS) RWY 12'], ['MDPC','09','ILS RWY 09','RNAV (GNSS) RWY 09'], ['TAPA','07','ILS RWY 07','RNAV (GNSS) RWY 07'] ];
const _atpCk = checkrideJob;
checkrideJob = function(st, rid, acId){ const j=_atpCk(st, rid, acId); if(rid!=='ATP') return j;
  const here=AP[st.loc]; const opts=ILS_FIELDS.filter(f=>AP[f[0]] && f[0]!==st.loc).map(f=>({f, d:distNm(here,AP[f[0]])})).filter(x=>x.d>=60 && x.d<=Math.min(400,(AC[acId]?AC[acId].range:900)*0.5)).sort((a,b)=>a.d-b.d);
  const pickF=(opts.find(x=>x.f[0]==='TJSJ')||opts[0]); if(!pickF) return j; const [code,rw,ils,rnav]=pickF.f;
  Object.assign(j, { to:code, local:false, tourNm:0, wx:genWx(st, code, 'trades', j.dep), ilsRwy:rw });
  j.tasks=[`Departure briefing and a clean takeoff from ${st.loc}`, `Autopilot and FMS from the climb to the approach`, `Fly the ${ils} to ${code} (the ${rnav} is your backup) and land in the touchdown zone`];
  j.paras=[`${CAST.wilkins?CAST.wilkins.n:'The examiner'} meets you at the jet bridge with a clipboard.`, `"Today you'll take her to ${AP[code].n} and fly the ${ils}. Load the ${rnav} as the backup. Stabilized by a thousand feet, please." Pass, and you hold the Airline Transport Pilot licence.`];
  j.est=plan(j).est; return j; };
/* the runway card shows the ILS runway for this checkride */
const _atpPf = preflightHTML;
preflightHTML = function(job){ let h=_atpPf(job); if(job && job.kind==='check' && job.rating==='ATP' && job.ilsRwy){ h=h.replace(/(<small>Land<\/small><b[^>]*>)\s*[0-9]{2}[LRC]?\s*(<\/b>)/i, `$1${job.ilsRwy}$2`); h=h.replace(/(class="su-tile[^"]*"[^>]*>[\s\S]*?Runways[\s\S]*?)(<\/div>\s*<\/div>)/, `$1<p class="small" style="margin-top:6px"><b>Approach: ILS ${job.ilsRwy}</b>, RNAV ${job.ilsRwy} as backup</p>$2`); } return h; };

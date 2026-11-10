/* ===================== AIRLINE TRANSPORT PILOT checkride: always to a big runway with both an ILS and an RNAV approach ===================== */
const ILS_FIELDS = [ // [airport, runway, ILS, RNAV]
  ['TJSJ','10','ILS RWY 10','RNAV (GPS) RWY 10'], ['TISX','10','ILS RWY 10','RNAV (GPS) RWY 10'], ['TBPB','09','ILS RWY 09','RNAV (GNSS) RWY 09'],
  ['TFFR','12','ILS RWY 12','RNAV (GNSS) RWY 12'], ['MDPC','09','ILS RWY 09','RNAV (GNSS) RWY 09'], ['TAPA','07','ILS RWY 07','RNAV (GNSS) RWY 07'] ];
/* the runway card shows the ILS runway for this checkride */
const _atpPf = preflightHTML;
preflightHTML = function(job){ let h=_atpPf(job); if(job && job.kind==='check' && job.rating==='ATP' && job.ilsRwy){ h=h.replace(/(<small>Land<\/small><b[^>]*>)\s*[0-9]{2}[LRC]?\s*(<\/b>)/i, `$1${job.ilsRwy}$2`); h=h.replace(/(class="su-tile[^"]*"[^>]*>[\s\S]*?Runways[\s\S]*?)(<\/div>\s*<\/div>)/, `$1<p class="small" style="margin-top:6px"><b>Approach: ILS ${job.ilsRwy}</b>, RNAV ${job.ilsRwy} as backup</p>$2`); } return h; };

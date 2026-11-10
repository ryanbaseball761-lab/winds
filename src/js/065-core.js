/* ===================== Seaplane checkride: a short hop at St. Martin, Juliana (TNCM) to Simpson Bay Lagoon ===================== */
RATINGS.SEA.tasks = [`Water landing in Simpson Bay Lagoon: landing attitude, a steady 100–150 fpm down, no flaring by eye`, `Taxi slowly clear of boats`];
const _seaCk = checkrideJob;
checkrideJob = function(st, rid, acId){ if(rid!=='SEA') return _seaCk(st, rid, acId);
  const moved = st.loc!=='TNCM'; if(moved) st.loc='TNCM';
  const j=_seaCk(st, rid, acId); Object.assign(j, { from:'TNCM', to:'WSBL', local:false, tourNm:0, wx:genWx(st,'WSBL','calm',j.dep) });
  j.paras=[`${CAST[RATINGS.SEA.examiner].n} meets you at the seaplane on the ramp at Princess Juliana${moved?' (Coral Wing flew you over for free)':''}.`, `"Short and simple," she says. "Take off, swing around the lagoon, and put us down in Simpson Bay Lagoon, right over there. Gentle and steady, that's all I'm looking for." Pass, and you hold the Seaplane Rating: ${RATINGS.SEA.unlocks}`];
  j.est=Math.max(10, plan(j).est); return j; };
/* passing it: no crash, not a hard landing, and most of the tasks */

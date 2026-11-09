/* ===================== cancelling a checkride refunds the fee ===================== */
/* remember what was paid when the checkride is booked (runs after the booking handler) */
let _ckPay=null;
window.addEventListener('click', e=>{ const b=e.target.closest('[data-act="book-check"]'); if(!b||!S.st) return; const rid=b.dataset.r; _ckPay={rid, fee:feeFor(S.st,rid), how:(document.getElementById('crpay-'+rid)||{}).value||'cash'}; }, true);
document.addEventListener('click', e=>{ if(!_ckPay||!e.target.closest('[data-act="book-check"]')) return; const a=S.st&&S.st.active; if(a && a.job.kind==='check' && a.job.rating===_ckPay.rid && !a.job.paid){ a.job.paid=_ckPay; save(); } _ckPay=null; });
/* refund on cancel */
window.addEventListener('click', e=>{ if(!e.target.closest('[data-act="cancel-yes"]')||!S.st||!S.st.active) return; const j=S.st.active.job; if(j.kind!=='check' || !j.paid) return; const st=S.st, p=j.paid, R=RATINGS[p.rid];
  if(p.how==='bond'){ const F=fin(st); const owe=Math.round(p.fee*1.1); F.bond=Math.max(0,(F.bond||0)-owe); move(st,0,'Training bond',`${R.n} checkride cancelled: bond of ${money(owe)} cancelled`); }
  else txn(st, p.fee, 'Licenses & training', `Refund: ${R.n} checkride (cancelled)`);
  j.paid=null; setTimeout(()=>toast(`Checkride cancelled. ${p.how==='bond'?'Your training bond was cancelled.':`${money(p.fee)} refunded.`}`), 300); }, true);

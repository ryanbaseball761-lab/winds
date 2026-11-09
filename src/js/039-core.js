/* ===================== END-OF-DAY RECAP ("previously on Trade Winds") ===================== */
document.addEventListener('click', e=>{
  if(!e.target.closest('[data-act="rest"]') || !S.st) return; const st=S.st;
  const today=(st.log||[]).filter(l=>l.day===st.day); if(!today.length) return;
  const ver=today.filter(l=>l.verified&&l.fpm!=null); const beats=(st.journal||[]).filter(j=>j.day===st.day && (j.kind==='story'||j.kind==='milestone')).slice(0,3);
  S.recap = { day:st.day, date:dateTxt(st.day), flights:today.length, mins:today.reduce((s,l)=>s+(l.min||0),0), net:today.reduce((s,l)=>s+(l.pay||0),0),
    best: ver.length?ver.reduce((a,b)=>a.fpm<b.fpm?a:b):null, grades:today.map(l=>l.grade), routes:today.map(l=>`${l.from}→${l.to}`).reverse(), beats:beats.map(b=>({t:b.title, x:b.text})), cash0: st.cash };
}, true);

var recapHTML; /* defined in full below (055-core.js) */
const _rcTour = tourHTML;
tourHTML = function(st){ return (S.recap ? recapHTML(st) : '') + _rcTour(st); };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="recap-close"]')){ S.recap=null; render(); try{ if(typeof chime==='function') chime(); }catch(_){} } });

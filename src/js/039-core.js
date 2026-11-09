/* ===================== END-OF-DAY RECAP ("previously on Trade Winds") ===================== */
document.addEventListener('click', e=>{
  if(!e.target.closest('[data-act="rest"]') || !S.st) return; const st=S.st;
  const today=(st.log||[]).filter(l=>l.day===st.day); if(!today.length) return;
  const ver=today.filter(l=>l.verified&&l.fpm!=null); const beats=(st.journal||[]).filter(j=>j.day===st.day && (j.kind==='story'||j.kind==='milestone')).slice(0,3);
  S.recap = { day:st.day, date:dateTxt(st.day), flights:today.length, mins:today.reduce((s,l)=>s+(l.min||0),0), net:today.reduce((s,l)=>s+(l.pay||0),0),
    best: ver.length?ver.reduce((a,b)=>a.fpm<b.fpm?a:b):null, grades:today.map(l=>l.grade), routes:today.map(l=>`${l.from}→${l.to}`).reverse(), beats:beats.map(b=>({t:b.title, x:b.text})), cash0: st.cash };
}, true);
function recapTeaser(st){
  const out=[]; const avail=storyAvailable(st); const ready=avail.find(m=>m.from===st.loc) || avail[0];
  if(ready) out.push(`📖 <b>${esc(ready.arc)}</b> continues: “${esc(ready.title)}”${ready.from!==st.loc?` (starts at ${esc(ready.from)})`:''}.`);
  try{ const evs=realEvents(); if(evs[0]) out.push(`🌍 ${esc(evs[0].n)} is on in the real Caribbean: those islands pay 20% more.`); }catch(_){}
  try{ const fe=festivalOn(st)[0]; if(fe) out.push(`🎉 ${esc(fe.n||'A festival')} is on today. Charter demand is up.`); }catch(_){}
  try{ const W=weeklyState(st); const left=weekPicks(W.key).filter(c=>!W.done[c.id]); if(left[0]) out.push(`🏆 Weekly challenge still open: ${esc(left[0].n)} (${(W.prog[left[0].id]||0)}/${left[0].goal}).`); }catch(_){}
  try{ const g=Object.keys(st.airframes||{}).filter(k=>isGrounded(st,k)); if(g.length) out.push(`🔧 Still in Dez's hangar: ${g.map(k=>esc(AC[k].n)).join(', ')}.`); }catch(_){}
  return out.slice(0,4);
}
function recapHTML(st){
  const R=S.recap; if(!R) return ''; const T=recapTeaser(st); const gcount=g=>R.grades.filter(x=>x===g).length;
  return `<div class="overlay" role="dialog" aria-modal="true" aria-label="Day recap"><div class="panel recap">
    <div class="recap-art">${islandArt(st.loc, 1110, 900, 160)}<div class="recap-title"><p class="label">End of day ${R.day} · ${esc(R.date)}</p><h2>That's a wrap</h2></div></div>
    <div class="recap-body">
      <div class="recap-stats"><div><b class="mono">${R.flights}</b><span>flight${R.flights>1?'s':''}</span></div><div><b class="mono">${durTxt(R.mins)}</b><span>logged</span></div><div><b class="mono">${money(R.net)}</b><span>earned</span></div><div><b class="mono">${R.best?R.best.fpm:'—'}</b><span>best fpm</span></div></div>
      <p class="small"><b>Today's route:</b> <span class="mono">${R.routes.map(esc).join('  ·  ')}</span>${gcount('A')?` · ${gcount('A')} grade A`:''}</p>
      ${R.beats.length?`<div class="recap-beats">${R.beats.map(b=>`<div><b>${esc(b.t)}</b><p class="small muted">${esc(b.x.slice(0,180))}${b.x.length>180?'…':''}</p></div>`).join('')}</div>`:''}
      ${T.length?`<div class="recap-next"><p class="label">Tomorrow on Trade Winds</p>${T.map(x=>`<p class="small">${x}</p>`).join('')}</div>`:''}
      <div class="row" style="justify-content:flex-end"><button class="btn action" data-act="recap-close">Start day ${st.day} ☀</button></div>
    </div></div></div>`;
}
const _rcTour = tourHTML;
tourHTML = function(st){ return (S.recap ? recapHTML(st) : '') + _rcTour(st); };
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="recap-close"]')){ S.recap=null; render(); try{ if(typeof chime==='function') chime(); }catch(_){} } });

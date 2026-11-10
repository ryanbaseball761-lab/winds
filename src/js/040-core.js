/* ===================== RIVAL PILOTS + IDEAL GLIDEPATH ON THE REPLAY ===================== */
/* this week's landing league: your best MSFS-verified landing vs. the islands' pilots */
function leagueRows(st){
  const W=isoWeek(); const R=rng(hashStr('league'+W)); const mine=(st.log||[]).filter(l=>l.verified&&l.fpm!=null&&weekOfDay(l)===W);
  const rows=RIVALS.map(r=>({n:r.n, fpm:Math.round(r.base[0]+R()*(r.base[1]-r.base[0])), flights:2+Math.floor(R()*9)}));
  if(mine.length) rows.push({n:st.pilot.name+' (you)', fpm:Math.min(...mine.map(l=>l.fpm)), flights:mine.length, me:true});
  return rows.sort((a,b)=>a.fpm-b.fpm);
}
function weekOfDay(l){ return l.at ? isoWeek(new Date(l.at)) : isoWeek(); }
/* stamp real time on new log entries so weeks line up */
const _rvWeekly = weeklyPanel;
weeklyPanel = function(st){ const rows=leagueRows(st);
  const t=`<div class="league"><p class="label">Landing league · this week</p><ol>${rows.slice(0,6).map((r,i)=>`<li class="${r.me?'me':''}"><span>${i+1}</span><b>${esc(r.n)}</b><span class="mono">${r.fpm} fpm</span></li>`).join('')}</ol>${rows.some(r=>r.me)?'':'<p class="tiny muted">Land with MSFS connected to join the league.</p>'}</div>`;
  return _rvWeekly(st).replace(/<\/section>\s*$/, t+'</section>'); };
/* ghost glidepath: what a steady 3° approach would have looked like */
const _rvReplay = replaySection;
replaySection = function(st){ let h=_rvReplay(st); const R=st.last&&st.last.replay; if(!h || !R || !R.approach || R.approach.length<6) return h;
  const A=R.approach; const W=520,H=220; const t0=A[0][0]; const maxAgl=Math.max(...A.map(x=>x[1]),100);
  const X=t=>(t-t0)/((0-t0)||1)*(W-40)+30, Y=v=>H-24-(Math.max(0,v)/maxAgl)*(H-40);
  const ideal=A.map(x=>{ const gs=Math.max(x[2],40); const agl=-x[0]*(gs*5)/60; return [x[0], Math.min(agl,maxAgl)]; });
  const path=ideal.map((x,i)=>`${i?'L':'M'}${X(x[0]).toFixed(1)} ${Y(x[1]).toFixed(1)}`).join(' ');
  const last=A.slice(-30); const dev=Math.round(last.reduce((s,x)=>{ const gs=Math.max(x[2],40); return s + (x[1] - (-x[0]*(gs*5)/60)); },0)/last.length);
  const verdict = Math.abs(dev)<60 ? `Right on a 3° glidepath for the last 30 seconds. Textbook.` : dev>0 ? `About ${dev} ft high on average in the last 30 seconds, so you had to dive at the end. Start down a little earlier.` : `About ${-dev} ft low on average in the last 30 seconds: a dragged-in approach. Stay a little higher on final.`;
  h = h.replace('<path d="', `<path d="${path}" class="ghost"/><path d="`);
  return h.replace('Dots turn orange past 700 fpm down and red past 1,000.', `Dots turn orange past 700 fpm down and red past 1,000. The dashed line is an ideal 3° glidepath. <b>${verdict}</b>`); };

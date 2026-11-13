/* ===================== 5. WEEKLY CHALLENGES, SEASONS & RECORDS ===================== */
const WEEKLY = [
  {id:'butter', n:`Butter week`, d:`Land 3 times under 100 fpm.`, goal:3, cash:600, test:(c)=>c.fpm!=null ? c.fpm<100 : c.f.landing==='butter'},
  {id:'hop', n:`Island hopper`, d:`Land at 5 different airports.`, goal:5, cash:500, set:true, key:(c)=>c.to},
  {id:'comfort', n:`Smooth operator`, d:`Finish 3 passenger flights with 90+ comfort.`, goal:3, cash:600, test:(c)=>c.job.pax && c.job.comfort>=90},
  {id:'short', n:`Short-field week`, d:`Land twice on runways under 3,000 ft.`, goal:2, cash:700, test:(c)=>AP[c.to] && !AP[c.to].water && longestRwy(AP[c.to])<3000},
  {id:'record', n:`On the record`, d:`Fly 4 flights recorded by MSFS.`, goal:4, cash:500, test:(c)=>c.f.verified},
  {id:'night', n:`Night owl`, d:`Fly 2 flights that depart at night.`, goal:2, cash:500, test:(c)=>isNight(c.job.dep)},
  {id:'chapter', n:`Chapter week`, d:`Fly a story chapter.`, goal:1, cash:400, test:(c)=>c.job.kind==='story'},
  {id:'intl', n:`Passport stamps`, d:`Fly 3 international flights.`, goal:3, cash:500, test:(c)=>AP[c.to] && AP[c.job.from] && AP[c.to].c!==AP[c.job.from].c},
  {id:'grades', n:`Straight A's`, d:`Earn 3 A grades.`, goal:3, cash:600, test:(c)=>c.res.grade==='A'},
  {id:'weather', n:`All-weather pilot`, d:`Earn a live-weather bonus twice.`, goal:2, cash:800, test:(c)=>c.out.notes.some(n=>/weather bonus/.test(n))}
];
function isoWeek(d=new Date()){ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const y=t.getUTCFullYear(); const w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7); return `${y}-W${String(w).padStart(2,'0')}`; }
function weekEnds(){ const d=new Date(); const day=d.getDay()||7; const end=new Date(d); end.setDate(d.getDate()+(7-day)); end.setHours(23,59,0,0); const h=Math.max(0,Math.round((end-d)/36e5)); return h>48?`${Math.round(h/24)} days left`:`${h} h left`; }
function weekPicks(key){ let h=0; for(const ch of key) h=(h*131+ch.charCodeAt(0))>>>0; const pool=WEEKLY.slice(); const out=[]; while(out.length<3){ h=(h*1103515245+12345)>>>0; out.push(pool.splice(h%pool.length,1)[0]); } return out; }
function weeklyState(st){ const key=isoWeek(); if(!st.weekly || st.weekly.key!==key) st.weekly={key, prog:{}, sets:{}, done:{}, champ:false}; return st.weekly; }
function seasonOf(st){ const d=new Date(Date.UTC(2026,5,1)+ (st.day-1)*864e5); const m=d.getUTCMonth();
  return m>=5 && m<=10 ? {n:`Hurricane season`, d:`June to November. Tropical waves and storms roll through. Relief flights pay well; watch the forecasts.`, c:'#3d5a80'}
    : m===11 || m<=3 ? {n:`High season`, d:`Winter tourists flood the islands. More VIP and charter work, busier airports.`, c:'#d9532f'}
    : {n:`Shoulder season`, d:`Quieter skies between the winter rush and the storms.`, c:'#0b746f'}; }
function weeklyBase(st){
  const W=weeklyState(st); const picks=weekPicks(W.key); const s=seasonOf(st);
  return `<section class="panel stack weekly"><div class="row between"><div><p class="label">This week · ${esc(W.key)}</p><h3>Weekly challenges</h3></div><span class="chip">${weekEnds()}</span></div>
    ${picks.map(ch=>{ const p=Math.min(ch.goal, W.prog[ch.id]||0); const done=!!W.done[ch.id]; return `<div class="wk ${done?'done':''}"><div class="row between" style="gap:6px"><b>${done?'✓ ':''}${esc(ch.n)}</b><span class="mono small">${p}/${ch.goal}</span></div><p class="tiny muted">${esc(ch.d)} Reward ${money(ch.cash)}.</p><div class="meter"><i style="width:${p/ch.goal*100}%"></i></div></div>`; }).join('')}
    <p class="tiny muted">${W.champ?'You\'re this week\'s champion. New challenges arrive Monday.':'Finish all three for a $1,000 champion bonus.'}</p>
    <div class="season" style="--c:${s.c}"><b>${esc(s.n)}</b><span class="tiny">${esc(s.d)}</span></div>
  </section>`;
}
/* Profile page, "This week": the weekly panel, real-world Caribbean news (storms, events), and the landing league.
   Hidden until your second flight; the league shows from your fifth (or with "show all tabs"). */
function weeklyPanel(st){ const all=st.ui&&st.ui.allTabs; if(st.flights<2 && !all) return '';
  let h=weeklyBase(st).replace('</section>', realNowHTML()+'</section>');
  if(st.flights>=5 || all) h=h.replace(/<\/section>\s*$/, leagueHTML(st)+'</section>');
  return h; }
function realNowHTML(){ const evs=realEvents(); if(!(evs.length||REAL_STORMS.length)) return '';
  return `<div class="realnow"><p class="label">In the real Caribbean right now</p>${REAL_STORMS.map(s=>`<p class="small">🌀 <b>${esc(s.name)}</b> (${esc(s.classification||'storm')}) is active, per the US National Hurricane Center. Relief work is in demand.</p>`).join('')}${evs.map(e=>`<p class="small">🌍 <b>${esc(e.n)}</b>: flights to ${e.ap.join(', ')} pay 20% more.</p>`).join('')}</div>`; }
function leagueHTML(st){ const rows=leagueRows(st);
  return `<div class="league"><p class="label">Landing league · this week</p><ol>${rows.slice(0,6).map((r,i)=>`<li class="${r.me?'me':''}"><span>${i+1}</span><b>${esc(r.n)}</b><span class="mono">${r.fpm} fpm</span></li>`).join('')}</ol>${rows.some(r=>r.me)?'':'<p class="tiny muted">Land with MSFS connected to join the league.</p>'}</div>`; }

function recordsPanel(st){
  const R=st.records||{}; const row=(lbl,r,fmt)=>`<div class="rec"><span class="label">${lbl}</span><b class="mono">${r?fmt(r.v):'—'}</b><span class="tiny muted">${r&&r.at?esc(r.at)+' · day '+r.day:'Not set yet'}</span></div>`;
  return `<section><div class="section-title"><h2>Personal records</h2><span class="small muted">${st.weeksWon?`${st.weeksWon} weekly championship${st.weeksWon>1?'s':''}`:'Beat your best'}</span></div>
    <div class="recs">${row('Softest landing',R.fpm,v=>`${v} fpm`)}${row('Best score',R.score,v=>`${v}/100`)}${row('Longest flight',R.long,v=>`${v} nm`)}${row('Happiest cabin',R.comfort,v=>`${v}/100`)}<div class="rec"><span class="label">Best A streak</span><b class="mono">${R.bestStreak||0}</b><span class="tiny muted">Grade A flights in a row</span></div></div></section>`;
}

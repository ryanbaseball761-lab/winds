/* ===================== CLARITY: one main story, fly from the story card, an obvious flight setup, calmer screens ===================== */
/* ---- the main story is one line, in this order; everything else is a side story ---- */
const MAIN_ORDER = ['Coral Wing','The Buyout','Hartwell','Own Wings','The Tour','Your Company'];
(function(){ for(const a of new Set(STORY.map(m=>m.arc))){ const m=ARC_META[a] = ARC_META[a] || {n:99,tag:'',col:'#e8782a'}; m.main = MAIN_ORDER.includes(a); if(m.main) m.n = MAIN_ORDER.indexOf(a)+1; else if(m.n<10) m.n = 10+m.n; } })();
function mainChapters(){ return [].concat(...MAIN_ORDER.map(a=>STORY.filter(m=>m.arc===a))); }
function chapterAction(st, m, availSet, small){
  const s = chapterStatus(st, m, availSet); const sz = small?'sm':''; const busy = !!st.active;
  if(busy && (s.k==='ready'||s.k==='travel')) return `<span class="chip">Finish your current flight first</span>`;
  if(s.k==='ready') return `<button class="btn action ${sz}" data-act="accept-story" data-id="${m.id}">Fly this chapter</button>`;
  if(s.k==='travel'){ const d=deadheadCost(st,s.at); return `<button class="btn action ${sz}" data-act="story-go" data-id="${m.id}" ${st.cash<d.cost?'disabled':''}>Fly in to ${esc(s.at)} &amp; start · ${money(d.cost)}</button>`; }
  if(s.k==='aircraft') return `<button class="btn ${sz}" data-act="nav" data-v="hangar">Add an aircraft in the Hangar</button>`;
  if(s.k==='locked'){ const btns=[]; for(const r of ((m.req||{}).ratings||[])){ if(st.ratings[r]) continue; const cr=checkrideReady(st,r);
      if(st.cooldown && st.cooldown[r]!=null) btns.push(`<button class="btn ${sz}" data-act="signoff" data-r="${r}">Get signed off for ${esc(RATINGS[r].code||r)} and continue</button>`);
      if(cr.ok) btns.push(`<button class="btn action ${sz}" data-act="nav" data-v="pilot">Take the ${esc(RATINGS[r].n)} checkride</button>`); }
    return btns.join(' '); }
  return ''; }

/* deadhead to the start airport and open the chapter in one tap */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="story-go"]'); if(!b||!S.st) return; e.stopImmediatePropagation(); const st=S.st; const m=STORY.find(x=>x.id===b.dataset.id); if(!m || st.active) return;
  const to=m.from; if(st.loc!==to){ const d=deadheadCost(st,to); if(st.cash<d.cost){ toast(`You need ${money(d.cost)} for the ticket to ${to}.`); return; } txn(st,-d.cost,'Travel','Deadhead to '+to); st.duty+=d.min; st.clock+=d.min; st.loc=to; st.visited[to]=true; st.jobsKey=''; addJournal(st, `Deadheaded to ${AP[to].isl}`, `Rode in the back of an airliner to ${AP[to].n} for "${m.title}".`, [], 'travel'); }
  const acs=storyAircraft(st,m); if(!acs.length){ save(); toast(`You're at ${to}, but none of the aircraft for this chapter are in your Hangar.`); render(); return; }
  st.active={job:storyJob(st,m,acs[0]), accepted:Date.now()}; save(); S.showResult=false; go('flight'); toast(`You're at ${to}. "${m.title}" is ready.`); }, true);
/* a failed checkride shouldn't stop the story */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="signoff"]'); if(!b||!S.st) return; const r=b.dataset.r, st=S.st; if(!RATINGS[r]) return;
  st.ratings[r]=true; if(st.cooldown) delete st.cooldown[r]; addJournal(st, `Signed off: ${RATINGS[r].n}`, `After a long talk and a few extra circuits, the examiner signs your ${RATINGS[r].n}. "Keep practicing," she says. "The sky will test you again."`, ['wilkins'], 'milestone'); save(); toast(`${RATINGS[r].n} signed off. The story continues.`); S.keepScroll=true; render(); });
/* story map: main story first, side stories under their own heading; travel buttons start the chapter */



/* ---- flight setup: big, obvious tiles for runway, fuel, clock, parking and weather ---- */
function runwayPlan(job){ const dep=rwyAnalysis(job.from, job.wx, job.ac); const arr=job.local?null:rwyAnalysis(job.to, job.wx, job.ac); return {dep, arr}; }
function windTxt(r){ if(!r) return ''; if(r.water) return 'into the wind'; return `${Math.round(Math.max(0,r.head))} kt headwind, ${Math.round(r.xw)} kt crosswind${r.head<0?' (tailwind!)':''}`; }
function renderPreflight(){ const el=document.getElementById('preflight'); const a=S.st&&S.st.active; if(el && a) el.innerHTML=preflightHTML(a.job); }
/* setup sits right under the boarding pass */

/* ---- each screen gets its own atmosphere ---- */

/* ---- hangar in tabs instead of one very long page ---- */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="hg-tab"]'); if(!b) return; S.hangarTab=b.dataset.v; S.keepScroll=true; render(); });

/* the old 'Set up MSFS' list in the sidebar is now the Flight setup panel */

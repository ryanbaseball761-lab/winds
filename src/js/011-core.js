/* ===================== STORY PROGRESS, NAV & STORY TAB ===================== */
const ARC_META = {
  'Coral Wing':      {main:true, n:1, tag:`Your first weeks flying for Mari at Coral Wing Air.`, col:'#0b746f'},
  'Hartwell':        {main:true, n:2, tag:`A reclusive billionaire, a reef, and a secret worth protecting.`, col:'#a0671c'},
  'Own Wings':       {main:true, n:3, tag:`From pilot to owner: Mari's offer, and a company of your own.`, col:'#d9532f'},
  'Starling':        {n:4, tag:`Vivienne's Vision Jet, with Abe in the right seat.`, col:'#c2603a'},
  'The Short Ones':  {n:5, tag:`St. Barth, Saba and the shortest runways in the islands.`, col:'#6a49a8'},
  'Rosa':            {n:6, tag:`A baker who has never once been late, and won't start now.`, col:'#b0522a'},
  'Calloway':        {n:7, tag:`Your rival next door, and the day his luck runs out.`, col:'#c23b2a'},
  'Dez':             {n:8, tag:`Cricket, Dez, and a match he absolutely cannot miss.`, col:'#2a68aa'},
  'Hurricane Season':{n:9, tag:`Relief flights after the storm passes.`, col:'#3d5a80'},
  'Going Abroad':    {n:10, tag:`Ferry flights north, the Mayan coast, and across the Atlantic.`, col:'#1d7f47'}
};
function arcMeta(arc){ return ARC_META[arc] || {n:99, tag:'', col:'#0b746f'}; }

function arcChapters(arc){ return STORY.filter(m=>m.arc===arc); }

function unlockHintBase(st, m){
  const r=m.req||{}, miss=[];
  if(r.after && !st.story.done[r.after]){ const p=STORY.find(x=>x.id===r.after); miss.push(`finish “${p?p.title:r.after}”`); }
  (r.ratings||[]).forEach(x=>{ if(!st.ratings[x]) miss.push(RATINGS[x].n); });
  if(r.hours && st.minutes/60 < r.hours) miss.push(`${r.hours} career hours (you have ${(st.minutes/60).toFixed(1)})`);
  return miss;
}
/* Where a chapter stands right now: done | ready | travel | aircraft | locked */
function chapterStatus(st, m, availSet){
  if(st.story.done[m.id]) return {k:'done'};
  const avail = availSet ? availSet.has(m.id) : storyAvailable(st).some(x=>x.id===m.id);
  if(!avail) return {k:'locked', miss:unlockHint(st,m)};
  const acs = storyAircraft(st, m);
  if(!acs.length) return {k:'aircraft', ac:m.ac};
  if(st.loc!==m.from) return {k:'travel', at:m.from};
  return {k:'ready', at:m.from};
}
/* ---------- board: "Your story" tracker ---------- */

/* Story strips say which chapter they are */

/* ---------- navigation ---------- */
const NAV_ICON = {
  board:`<path d="M9 4h6v3H9zM7 5H5v15h14V5h-2M8 11h8M8 15h5"/>`,
  map:`<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>`,
  flight:`<path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5v2l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z"/>`,
  cockpit:`<path d="M4 15a8 8 0 1 1 16 0M12 15l4-5M4 19h16"/>`,
  pilot:`<path d="M4 5h16v14H4zM8 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 17c.5-1.6 1.6-2.5 2.5-2.5s2 .9 2.5 2.5M13 10h4M13 14h4"/>`,
  story:`<path d="M4 5c3-1.3 5.5-1.3 8 0v14c-2.5-1.3-5-1.3-8 0zM12 5c2.5-1.3 5-1.3 8 0v14c-3-1.3-5.5-1.3-8 0"/>`,
  log:`<path d="M6 3h11a1 1 0 0 1 1 1v17H7a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2zM5 18a2 2 0 0 1 2-2h11M9 7h6M9 11h6"/>`,
  money:`<path d="M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 10v4M18 10v4"/>`,
  company:`<path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 11h2M14 11h2"/>`,
  hangar:`<path d="M2 20h20M4 20V11a8 8 0 0 1 16 0v9M8 20v-5h8v5"/>`
};
const NAV_GROUPS = [['board','map','flight','cockpit'],['pilot','story','log'],['money','company','hangar']];


/* ---------- Story tab ---------- */

/* Keep the active tab in view on narrow screens */
(function(){ const app=document.getElementById('app'); if(!app || !window.MutationObserver) return;
  new MutationObserver(()=>{ const t=app.querySelector('.tab[aria-current="page"]'); const rail=t&&t.parentElement; if(!rail || rail.scrollWidth<=rail.clientWidth) return;
    const want = t.offsetLeft - (rail.clientWidth - t.offsetWidth)/2; rail.scrollLeft = Math.max(0, want); }).observe(app,{childList:true});
})();

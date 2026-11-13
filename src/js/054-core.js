/* ===================== CALM: fewer things on every screen ===================== */
function tpl(h){ const t=document.createElement('template'); t.innerHTML=h; return t; }
function headText(el){ return ((el.querySelector('h1,h2,h3,.label')||{}).textContent||'').trim(); }
function wrapDetails(nodes, title, cls){ if(!nodes.length) return null; const d=document.createElement('details'); d.className='calm-more '+(cls||''); const s=document.createElement('summary'); s.innerHTML=title; d.appendChild(s); const box=document.createElement('div'); box.className='calm-more-in'; nodes.forEach(n=>box.appendChild(n)); d.appendChild(box); return d; }

/* ---- navigation: fewer tabs ---- */

/* ---- job board ---- */
const CHIP_KEEP = /urgent|vip|sealed|bonus|owner|ifr|night|instructor|festival|storm|hurricane|2×|double/i;
document.addEventListener('click', e=>{ if(e.target.closest('[data-act="all-jobs"]')){ S.allJobs=true; S.keepScroll=true; render(); } });
function go(v){ if(v!=='board') S.allJobs=false; return goBase.apply(this, arguments); }

/* ---- flight briefing: the essentials, then one "Flight details" drawer ---- */

/* ---- pilot page: ratings first, the rest folded ---- */

/* ---- quieter cabin feed: last four lines ---- */
/* ---- story map: the storylines, then journal / guestbook / reviews / people folded ---- */



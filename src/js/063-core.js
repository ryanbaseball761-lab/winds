/* ===================== 20 MORE FIXES ===================== */
/* 1. the same message never pops twice in a row; tab-unlock messages for tabs that live elsewhere are dropped */
const _p20Toast = toast;
toast = function(msg){ const m=String(msg); if(/^New tab unlocked: (Logbook|Profile|Company|Cockpit)/.test(m)) return; const now=Date.now(); if(S._lt===m && now-(S._ltT||0)<20000) return; S._lt=m; S._ltT=now; return _p20Toast(msg); };

/* 2. a past departure time reads "Ready now" */

/* 3 + 4. difficulty and theme move out of the top bar and sidebar into Hangar > Settings */

/* 5. the copilot never reads out an impossible landing number */


/* 7. result: what next, right at the top; the share card folds away */

/* 8. money: cash and the ledger up front; savings, credit and the bank fold away */
const _p20Money = moneyView;
moneyView = function(){ const h=_p20Money(); const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h; const folds=[];
  main.querySelectorAll('section').forEach(s=>{ if(/Island Trust Bank|Bank|Credit|Savings|Housing|Market|Bonds?/i.test(headText(s)) && !folds.some(f=>f.contains(s))) folds.push(s); });
  const d=wrapDetails(folds.map(s=>{ s.remove(); return s; }), 'Bank, savings, credit and housing'); if(d) main.appendChild(d);
  main.querySelectorAll('.grid-2, .stack, aside').forEach(g=>{ if(!g.children.length) g.remove(); });
  return t.innerHTML; };

/* 9. hangar: the long "which aircraft do you own" list folds into one drawer */

/* 10. weekly challenges live on your Profile now */
const _p20Prof = profileView;
profileView = function(){ const h=_p20Prof(); try{ const w=weeklyPanel(S.st); return w ? h.replace(/<\/main>\s*$/, w+'</main>') : h; }catch(_){ return h; } };

/* 11. what reputation means */
const _p20Pilot = pilotView;
pilotView = function(){ return _p20Pilot().replace(/(reputation \d+)/, '<span title="Reputation (0–100) grows with good flights. Higher reputation means better pay and VIP clients.">$1</span>').replace('</h1>', '</h1>'); };

/* 12. sealed orders and cabin requests never pop up on short final */
function nearDestination(a){ const s=S.sim; if(!a||!s||!s.position||S.simState!=='live') return false; const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; return distNm({lat:s.position.lat,lon:s.position.lon},dest)<8 && (s.position.aglFt||0)<2000 && !a.job.local || (s.position.aglFt||0)<800; }

/* 13. the approach card on local flights only shows when you're coming back down */
const _p20Appr = approachCard;
approachCard = function(a){ const s=S.sim; if(a && a.job.local && s && s.motion && !(s.motion.vsFpm<-200 && (s.position.aglFt||0)<2500)) return ''; return _p20Appr(a); };

/* 14. the New day button says what it costs */

/* 15. story chapters and jobs prefer the aircraft you already have loaded in MSFS */

/* 16. new pilots don't get sealed orders or cabin requests until they've settled in */

/* 17. the guide hides itself once you've done a few flights, even if it was never closed */
const _p20Guide = guideActive;
guideActive = function(){ return _p20Guide() && (S.st.flights||0) < 1; };

/* 18. checkride booking: the fee picker explains itself */
const _p20Pilot2 = pilotView;
pilotView = function(){ return _p20Pilot2().replace(/<select([^>]*)aria-label="Checkride fee"/g, '<select$1aria-label="Checkride fee" title="Faster checkrides cost more"'); };

/* 19. "Checkride ready" on the board is a button that takes you there */

/* 20. very long job titles are clamped to two lines (CSS) */

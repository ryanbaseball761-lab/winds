/* ===================== 20 MORE FIXES ===================== */
/* 1. the same message never pops twice in a row; tab-unlock messages for tabs that live elsewhere are dropped */

/* 2. a past departure time reads "Ready now" */

/* 3 + 4. difficulty and theme move out of the top bar and sidebar into Hangar > Settings */

/* 5. the copilot never reads out an impossible landing number */


/* 7. result: what next, right at the top; the share card folds away */

/* 8. money: cash and the ledger up front; savings, credit and the bank fold away */

/* 9. hangar: the long "which aircraft do you own" list folds into one drawer */

/* 10. weekly challenges live on your Profile now */

/* 11. what reputation means */

/* 12. sealed orders and cabin requests never pop up on short final */
function nearDestination(a){ const s=S.sim; if(!a||!s||!s.position||S.simState!=='live') return false; const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; return distNm({lat:s.position.lat,lon:s.position.lon},dest)<8 && (s.position.aglFt||0)<2000 && !a.job.local || (s.position.aglFt||0)<800; }

/* 13. the approach card on local flights only shows when you're coming back down */
function approachCard(a){ const s=S.sim; if(a && a.job.local && s && s.motion && !(s.motion.vsFpm<-200 && (s.position.aglFt||0)<2500)) return ''; return approachCardBase(a); }

/* 14. the New day button says what it costs */

/* 15. story chapters and jobs prefer the aircraft you already have loaded in MSFS */

/* 16. new pilots don't get sealed orders or cabin requests until they've settled in */

/* 17. the guide hides itself once you've done a few flights, even if it was never closed */
function guideActive(){ return guideActiveBase() && (S.st.flights||0) < 1; }

/* 18. checkride booking: the fee picker explains itself */

/* 19. "Checkride ready" on the board is a button that takes you there */

/* 20. very long job titles are clamped to two lines (CSS) */

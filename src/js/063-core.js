/* ===================== 20 MORE FIXES ===================== */
/* 1. the same message never pops twice in a row; tab-unlock messages for tabs that live elsewhere are dropped */
const _p20Toast = toast;
toast = function(msg){ const m=String(msg); if(/^New tab unlocked: (Logbook|Profile|Company|Cockpit)/.test(m)) return; const now=Date.now(); if(S._lt===m && now-(S._ltT||0)<20000) return; S._lt=m; S._ltT=now; return _p20Toast(msg); };

/* 2. a past departure time reads "Ready now" */
const _p20Strip = stripHTML;
stripHTML = function(st, job, opts){ let h=_p20Strip(st, job, opts); if(job.dep<=st.clock) h=h.replace(`STD ${hhmm(job.dep)}`, 'Ready now'); return h; };

/* 3 + 4. difficulty and theme move out of the top bar and sidebar into Hangar > Settings */
const _p20Set = settingsHTML;
settingsHTML = function(){ let h=_p20Set(); const d=diff();
  const extra=`<div><p class="label">Difficulty</p><div class="diff">${Object.keys(DIFF).map(k=>`<button class="${k===d?'on':''}" data-act="diff" data-v="${k}" title="${esc(DIFF[k].d)}">${DIFF[k].n}</button>`).join('')}</div><p class="tiny muted" style="margin-top:4px">${esc(DIFF[d].d)}</p></div>
    <div><p class="label">Appearance</p><button class="btn sm" data-act="theme">${THEME_LBL[themePref()]}</button></div>`;
  h=h.replace(/<label class="row"><input type="checkbox" data-act="ui-flag" data-k="allTabs"[\s\S]*?<\/label>/, '');
  return h.replace('<div class="set-grid">', '<div class="set-grid">'+extra); };

/* 5. the copilot never reads out an impossible landing number */
const _p20Say = copilotSay;
copilotSay = function(text, key){ const m=String(text).match(/(\d{4,}) feet per minute/); if(m && Number(m[1])>1500) text='Down and safe.'; return _p20Say(text, key); };


/* 7. result: what next, right at the top; the share card folds away */
const _p20Res = resultView;
resultView = function(){ const h=_p20Res(); const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h; const st=S.st;
  const availSet=new Set(storyAvailable(st).map(m=>m.id)); const next=mainChapters().find(m=>!st.story.done[m.id] && chapterStatus(st,m,availSet).k!=='locked');
  const bar=document.createElement('div'); bar.className='row next-bar'; bar.innerHTML=`<button class="btn primary" data-act="nav" data-v="board">Back to the job board</button>${next?chapterAction(st,next,availSet,false).replace('Fly this chapter',`Next: ${esc(next.title)}`).replace(/Fly in to (\w+) &amp; start · \$0|Fly in to (\w+) & start · \$0/, (m,a1,a2)=>`Next: ${esc(next.title)} (free flight to ${a1||a2})`):''}`;
  const first=main.querySelector(':scope > section'); if(first) first.after(bar);
  const share=main.querySelector('.share-card'); if(share){ const d=wrapDetails([share], 'Share card: save an image of this flight'); main.appendChild(d); }
  return t.innerHTML; };

/* 8. money: cash and the ledger up front; savings, credit and the bank fold away */
const _p20Money = moneyView;
moneyView = function(){ const h=_p20Money(); const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h; const folds=[];
  main.querySelectorAll('section').forEach(s=>{ if(/Island Trust Bank|Bank|Credit|Savings|Housing|Market|Bonds?/i.test(headText(s)) && !folds.some(f=>f.contains(s))) folds.push(s); });
  const d=wrapDetails(folds.map(s=>{ s.remove(); return s; }), 'Bank, savings, credit and housing'); if(d) main.appendChild(d);
  main.querySelectorAll('.grid-2, .stack, aside').forEach(g=>{ if(!g.children.length) g.remove(); });
  return t.innerHTML; };

/* 9. hangar: the long "which aircraft do you own" list folds into one drawer */
const _p20Hangar = hangarView;
hangarView = function(){ const h=_p20Hangar(); if((S.hangarTab||'fleet')!=='fleet') return h; const t=tpl(h); const main=t.content.querySelector('main'); if(!main) return h;
  const classSecs=[...main.querySelectorAll('section')].filter(s=>!s.className && CLS && Object.values(CLS).some(c=>c.name===headText(s)));
  if(classSecs.length){ const owned=Object.keys(S.st.hangar||{}).filter(k=>S.st.hangar[k] && AC[k]).length; const d=wrapDetails(classSecs.map(s=>{ s.remove(); return s; }), `Aircraft you own in MSFS <span class="tiny muted">${owned} selected</span>`); main.appendChild(d); }
  return t.innerHTML; };

/* 10. weekly challenges live on your Profile now */
const _p20Prof = profileView;
profileView = function(){ const h=_p20Prof(); try{ const w=weeklyPanel(S.st); return w ? h.replace(/<\/main>\s*$/, w+'</main>') : h; }catch(_){ return h; } };

/* 11. what reputation means */
const _p20Pilot = pilotView;
pilotView = function(){ return _p20Pilot().replace(/(reputation \d+)/, '<span title="Reputation (0–100) grows with good flights. Higher reputation means better pay and VIP clients.">$1</span>').replace('</h1>', '</h1>'); };

/* 12. sealed orders and cabin requests never pop up on short final */
function nearDestination(a){ const s=S.sim; if(!a||!s||!s.position||S.simState!=='live') return false; const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; return distNm({lat:s.position.lat,lon:s.position.lon},dest)<8 && (s.position.aglFt||0)<2000 && !a.job.local || (s.position.aglFt||0)<800; }
const _p20Orders = openOrders;
openOrders = function(a, how){ if(a && !a.opened && nearDestination(a)) return; return _p20Orders(a, how); };
const _p20Take = takeover;
takeover = function(o){ const a=S.st&&S.st.active; if(o && /Request from the cabin/.test(o.kicker||'') && nearDestination(a)) { if(a) a.askShown=false; return; } return _p20Take(o); };

/* 13. the approach card on local flights only shows when you're coming back down */
const _p20Appr = approachCard;
approachCard = function(a){ const s=S.sim; if(a && a.job.local && s && s.motion && !(s.motion.vsFpm<-200 && (s.position.aglFt||0)<2500)) return ''; return _p20Appr(a); };

/* 14. the New day button says what it costs */
const _p20Board = boardView;
boardView = function(){ const h=_p20Board(); try{ const F=fin(S.st); const H=HOUSING[F.housing]||HOUSING.bunk; return h.replace('<button class="btn" data-act="rest">New day</button>', `<button class="btn" data-act="rest">New day · rent ${money(H.rent)}</button>`); }catch(_){ return h; } };

/* 15. story chapters and jobs prefer the aircraft you already have loaded in MSFS */
const _p20SA = storyAircraft;
storyAircraft = function(st, m){ const list=_p20SA(st, m); const L=S.simState==='live'?loadedAircraft():{}; return (L.id && list.includes(L.id)) ? [L.id, ...list.filter(x=>x!==L.id)] : list; };
const _p20Filter = filterJobs;
filterJobs = function(list){ const L=_p20Filter(list); const ld=S.simState==='live'?loadedAircraft():{}; if(!ld.id) return L; return L.filter(j=>j.ac===ld.id).concat(L.filter(j=>j.ac!==ld.id)); };
const _p20Strip2 = stripHTML;
stripHTML = function(st, job, opts){ const h=_p20Strip2(st, job, opts); const ld=S.simState==='live'?loadedAircraft():{}; return (ld.id && job.ac===ld.id) ? h.replace(/(<article[^>]*class="jcard[^"]*"[^>]*>)/, '$1<span class="loaded-tag">Loaded in MSFS</span>') : h; };

/* 16. new pilots don't get sealed orders or cabin requests until they've settled in */
const _p20Gen = genJobs;
genJobs = function(st){ const L=_p20Gen(st); if(st.flights<3) L.forEach(j=>{ delete j.ask; j.scen=null; }); return L; };

/* 17. the guide hides itself once you've done a few flights, even if it was never closed */
const _p20Guide = guideActive;
guideActive = function(){ return _p20Guide() && (S.st.flights||0) < 1; };

/* 18. checkride booking: the fee picker explains itself */
const _p20Pilot2 = pilotView;
pilotView = function(){ return _p20Pilot2().replace(/<select([^>]*)aria-label="Checkride fee"/g, '<select$1aria-label="Checkride fee" title="Faster checkrides cost more"'); };

/* 19. "Checkride ready" on the board is a button that takes you there */
const _p20Board2 = boardView;
boardView = function(){ return _p20Board2().replace(/<a[^>]*>Book it on the Pilot tab<\/a>/, '<button class="btn sm" data-act="nav" data-v="pilot">Book checkride</button>'); };

/* 20. very long job titles are clamped to two lines (CSS) */

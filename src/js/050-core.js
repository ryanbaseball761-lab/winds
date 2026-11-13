/* ===================== STORY CONTINUITY: chapter order and facts that have to agree ===================== */
/* chapters can need more than one earlier chapter ("also") */
function storyAvailable(st){ return STORY.filter(m=>{ if(st.story.done[m.id]) return false; const r=m.req||{};
  if(r.after && !st.story.done[r.after]) return false; if((r.also||[]).some(x=>!st.story.done[x])) return false;
  if(r.ratings && !ratingsOk(st, r.ratings)) return false; if(r.hours && st.minutes/60 < r.hours) return false; return true; }); }
function unlockHint(st, m){ const miss=unlockHintBase(st, m); for(const x of ((m.req||{}).also||[])){ if(!st.story.done[x]){ const p=STORY.find(y=>y.id===x); miss.unshift(`finish “${p?p.title:x}”`); } } return miss; }
(function fix(){ const S_ = id => STORY.find(m=>m.id===id); const also=(id, ...ids)=>{ const m=S_(id); if(m){ m.req=m.req||{}; m.req.also=[...new Set([...(m.req.also||[]), ...ids])]; } };
  // Mari hands over Coral Wing only after her last flight, and Vale's comeback only makes sense after you beat him in the Buyout
  also('CO3','MR1'); also('CO2','BO5');
  // Mari's retirement flight comes after the company exists and after the Buyout is settled
  also('MR1','BO5');
  // the Barbuda plaque happens after the island has been rebuilt from Hurricane Odalys
  also('LB5','HR1');
  // the Logbook's dates: Eddie's first entry was 1978 and he vanished in 1981; the game is set in 2026
  const fixText = (id, from, to) => { const m=S_(id); if(!m) return; const walk=o=>{ for(const k in o){ if(typeof o[k]==='string') o[k]=o[k].split(from).join(to); else if(o[k] && typeof o[k]==='object') walk(o[k]); } }; walk(m); };
  fixText('LB1', 'Forty-four years apart and the same number', 'Forty-eight years apart and the same number');
  fixText('LB3', 'The last letter has a postmark: Codrington, Barbuda, 1982.', 'The last letter in the bundle is dated Codrington, Barbuda, 1982, and was never mailed.');
  fixText('LB4', 'Flown. 44 years late. G.W.', 'Flown. 45 years late. G.W.');
  fixText('LB5', '1940–2019', '1932–2019');
  fixText('LB5', 'is putting up a plaque at the airfield', 'is rebuilding after Odalys, and putting up a plaque at the airfield');
  // Coast Watch: Mari flew helicopters, so the Jayhawk line holds; Borinquen is where she was stationed
  fixText('CG1', 'Lt. Daniela Ortiz calls Mari, Mari calls you.', 'Lt. Daniela Ortiz, who flew Jayhawks with Mari at Air Station Borinquen, calls Mari. Mari calls you.');
})();
/* existing careers: tabs you already had don't announce themselves as "new" */

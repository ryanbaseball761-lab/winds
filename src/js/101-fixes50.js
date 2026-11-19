/* ===================== 50 FIXES (Nov 9, second sweep) ===================== */
/* 1 (setup pitch), 14 (quiet mode wording) and 15 (title Settings) were fixed in their own files. */



/* 5 + 6. pop-ups really sit bottom-right; achievements show one at a time, after any cutscene */
const ACH_Q=[]; let achBusy=false;
function achPop(a){ ACH_Q.push(a); achPump(); }
function achPump(){ if(achBusy||!ACH_Q.length) return; if(document.querySelector('.cut')){ setTimeout(achPump,1500); return; } achBusy=true; achPopBase(ACH_Q.shift()); setTimeout(()=>{ achBusy=false; achPump(); }, 4400); }

/* 7. network runs have no airline flight number on the ticket */
function flightNo(job){ return job && job.network ? 'Unlisted' : flightNoBase(job); }






/* 16. Butter Cup cards get the same noir treatment as everything else */
/* (CSS below) */

/* 17 + 18 + 19. phone-width fixes: tabs scroll, the flight display wraps, the bottom menu is dark */
/* (CSS below) */


document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="own-ac"]'); if(!b||!S.st) return; S.st.hangar=S.st.hangar||{}; S.st.hangar[b.dataset.v]=true; save(); toast(`Added the ${AC[b.dataset.v].n} to your hangar list.`); S.keepScroll=true; render(); });


/* 23. Esc also closes the notifications list */
window.addEventListener('keydown', e=>{ if(e.key==='Escape'){ document.querySelectorAll('.notif-pane').forEach(p=>p.remove()); } });


/* 25 + 26. flight-display progress label and map "Next" label are easier to read */
/* (CSS below) */




/* 31. Esc closes the person card, the shortcut list and What's new */
window.addEventListener('keydown', e=>{ if(e.key!=='Escape') return; const w=document.querySelector('.pc-wrap'); if(w){ w.remove(); e.stopImmediatePropagation(); } }, true);




/* 36. laundering says what it did to your Heat */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="launder"]'); if(!b||!S.st) return; const o=launderOpts(S.st).find(x=>x.id===b.dataset.v); if(o&&o.heat) setTimeout(()=>toast(`Heat +${o.heat} from laundering.`), 700); });


window.addEventListener('click', e=>{ if(!e.target.closest('[data-act="cancel-yes"]')||!S.st||!S.st.active) return; if(S.st.active.job.kind==='story') setTimeout(()=>{ if(!S.st.active){ go('story'); } }, 50); }, true);



/* 44. at Heat 80+ (the feds are looking) the Heat chip pulses */
/* (CSS below) */


/* 46. clicking a speaker's portrait in a scene doesn't skip the line you're reading */
document.addEventListener('click', e=>{ if(e.target.closest('.cut-who')) e.stopPropagation(); }, true);



/* 49. "What's new" lists this sweep */
WHATS_NEW.unshift(['0.43','50 fixes: the new-career screen fits the story, Heat in the header, one-click "I own this aircraft", clearer checkride and job lists, phone-width fixes, and more.']);


(function(){ const s=document.createElement('style'); s.textContent=`
#toasts{transform:none!important;align-items:flex-end!important;width:auto!important}
.cup-grid .card > :first-child, .cup-card > :first-child, main .cup svg, .cup-art{filter:saturate(.5) brightness(.72) contrast(1.08)}
.subtabs{overflow-x:auto;scrollbar-width:none;white-space:nowrap}.subtabs::-webkit-scrollbar{display:none}.subtabs button{flex:none}.subtabs.more{-webkit-mask-image:linear-gradient(90deg,#000 85%,transparent);mask-image:linear-gradient(90deg,#000 85%,transparent)}
.fhud-route{min-width:0}.fhud-route b{font-size:clamp(20px,6vw,30px)}.fhud-route i{flex:1 1 40px;min-width:20px}.fhud-route span{flex-basis:100%;margin-left:0}
@media (min-width:900px){.fhud-route span{flex-basis:auto;margin-left:auto}}
.mrail{background:#0b0b0d!important;border-color:#222!important}.mrail{justify-content:space-around}.mrail button,.mrail a{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;border:0!important;border-radius:9px;background:transparent!important;color:#bdb6a8!important;font:600 11px var(--f-ui,inherit)}.mrail button svg,.mrail a svg{width:20px;height:20px}.mrail .on,.mrail [aria-current=page]{color:#e0b24a!important;background:rgba(224,178,74,.08)!important}
.cut.hint-off .cut-hint{opacity:0;transition:opacity .6s}
.fhud-prog span{top:auto;bottom:10px}
.map-next{paint-order:stroke;stroke:#0a0a0c;stroke-width:5px}
.sh-act-h{display:block!important;font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--c);margin-top:6px;cursor:default!important}
.heat-chip{display:inline-grid;line-height:1.1;text-align:left;border:1px solid var(--line);border-radius:10px;padding:4px 10px;cursor:pointer;background:var(--surface);color:var(--ink)}.heat-chip span{font-size:10px;letter-spacing:.12em;text-transform:uppercase}.heat-chip b{font-family:var(--f-mono);font-size:13px}
.heat-chip.cool span{color:#7cbf6f}.heat-chip.warm{border-color:#6b4e1a}.heat-chip.warm span{color:#e0b24a}.heat-chip.hot{border-color:#6b2a20;background:rgba(194,58,43,.12)}.heat-chip.hot span{color:#e5533d}
@keyframes heatp{50%{box-shadow:0 0 0 4px rgba(229,83,61,.18)}}.heat-chip.hot{animation:heatp 1.6s ease-in-out infinite}
.jr-m{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-width:600px){.if-phases{flex-wrap:wrap;overflow:visible!important}}
button.on small{color:inherit!important}
.scroll-x:focus-visible{outline:2px solid var(--c,#e0b24a);outline-offset:2px}
.chapter-hero .ch-in{gap:8px!important;padding:18px 26px 18px!important}.chapter-hero .ch-art{opacity:.6}
.ch-tip{margin:0;font-size:13.5px;color:rgba(255,255,255,.78);max-width:760px}.ch-tip span{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--arc,#e0b24a);margin-right:8px}
.setup2{padding:0!important;margin:-8px!important;width:calc(100% + 16px)}.setup2 .setup-hero{min-height:100vh;align-items:center;padding:48px 0;border-radius:0}
.setup2 .s2-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,400px);gap:56px;align-items:center;width:100%}
.setup2 .setup-copy h1{margin:8px 0 16px}.setup2 .lede{margin:0 0 22px}
.setup2 .s2-feats{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;max-width:720px}
.setup2 .s2-feats li{border-left:2px solid #e0b24a;padding-left:12px}.setup2 .s2-feats b{display:block;font-size:14px;margin-bottom:3px;color:#f1e9d8}.setup2 .s2-feats span{font-size:13px;line-height:1.45;color:rgba(241,233,216,.72);text-shadow:none}
.setup2 .setup-card{background:rgba(14,13,12,.88);backdrop-filter:blur(6px);border:1px solid rgba(224,178,74,.25);box-shadow:0 20px 60px rgba(0,0,0,.5);text-shadow:none}
.setup2 .import-row{margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;text-shadow:none}
@media (max-width:900px){.setup2 .s2-grid{grid-template-columns:1fr;gap:28px}.setup2 .s2-feats{grid-template-columns:1fr}.setup2 .setup-hero{padding:32px 0}}
.avatar.art-av{box-shadow:0 0 0 2px rgba(224,178,74,.55),0 2px 8px rgba(0,0,0,.4)}
.chapter-hero .pro-replay{float:none!important;position:absolute!important;top:12px;right:12px;z-index:2}
@media (max-width:600px){.chapter-hero .pro-replay{position:relative!important;top:auto;right:auto;margin:12px 0 0 18px}}
@media (max-width:900px){.setup2 .s2-grid{display:flex;flex-direction:column;align-items:stretch}.setup2 .setup-copy{display:contents}.setup2 .s2-side{order:2}.setup2 .s2-feats{order:3}}
.ac-hero{background:radial-gradient(120% 120% at 100% 0%,rgba(124,191,111,.18),transparent 55%),linear-gradient(135deg,#101413,#0b0b0d)!important;border:1px solid #23302b}
.cup-hero{background:radial-gradient(120% 120% at 0% 0%,rgba(224,178,74,.22),transparent 55%),linear-gradient(135deg,#17130c,#0b0b0d)!important;border:1px solid #3a2f18}`; document.head.appendChild(s); })();
WHATS_NEW.unshift(['0.50','Every story choice now comes back later, a fuller epilogue, Caribe Cargo becomes your own airline (Pilot → Airline), smuggling pays more and draws more Heat, and many fixes.']);
WHATS_NEW.unshift(['0.51','Clearer story: "Previously" remembers your choices, no spoilers before takeoff, consistent chapter numbers. Castillo pays for your jet rating, and the MSFS clock is set correctly.']);
WHATS_NEW.unshift(['0.52','A faster start: a new start screen, one setup screen, then chapter 1. The next story step is always the main button, checkrides can be booked from your story path, and many fixes.']);
WHATS_NEW.unshift(['0.53','Money fixes: "Earned" matches everywhere, story pay and laundered cash count as income on the Money page, plainer Airline stats, and a "Launder it" shortcut on your story page.']);
WHATS_NEW.unshift(['0.54','Your airline grows: buy airliners (ES-30, A320neo, 737 MAX, A321), build six facilities, open bases at other hubs, refit cabins, and track company value. Plus phone fixes for the job board and Pilot tabs.']);
WHATS_NEW.unshift(['0.55','Behind the scenes: most of the game\'s code is now one clean definition per screen, which makes future fixes safer. The title screen shows your flight in progress properly, and new automatic checks cover the MSFS clock and the airline.']);
WHATS_NEW.unshift(['0.56','Airline balance: every route has a limited number of travelers, passengers cost handling and taxes, and airliner crews cost what they should, so a big jet is a strong investment but not a money printer.']);
WHATS_NEW.unshift(['0.57','Airline: "Find the best route" picks the most profitable destination and fare for a hired aircraft (or tells you the charter pool pays more). Fixed a crash when bringing on crew while you own an airline.']);
WHATS_NEW.unshift(['0.58','Flight mode: the "course to" arrow now points where you need to turn (it was stuck pointing up), the checklist follows your flight phase on its own, duplicate numbers are gone from the phase panel, and the live weather line no longer shows "undefined".']);
WHATS_NEW.unshift(['0.59','The flight timer no longer flickers between real time and sim time (it uses MSFS block time when the sim is recording), and the checklist tabs wrap on phones.']);
WHATS_NEW.unshift(['0.60','Hangar → MSFS connection explains how the Trade Winds app connects (no Claude setup steps), and touchdown grading ignores the sign of the reading.']);
WHATS_NEW.unshift(['0.61','Airline: each route shows how many travelers it has and how many of your aircraft share them, and the DC-3 costs more to keep flying. Older MSFS Bridges now say "update to 1.5" instead of "Unknown tool". Audio code cleaned up.']);
WHATS_NEW.unshift(['0.62','Release prep: a damaged save repairs itself (or the newest backup loads), a full disk no longer loses your progress silently, better contrast and keyboard access, and consistent US spelling (Licenses tab).']);
WHATS_NEW.unshift(['0.63','Fly the story: some story moments now give you an order to fly (climb away, stay low, slow down, a steep turn for Castillo, a low pass), judged live from MSFS. Any aircraft in your hangar that fits the role can fly a chapter, Twitch chat can vote on your choices, you can share your ending, and the in-sim panel lets you answer story moments without alt-tabbing.']);
WHATS_NEW.unshift(['0.64','Smoother story flow: a cutscene never plays twice or stacks on another, "Previously on" follows one rule, painted scenes behind cutscenes and chapter banners, a redesigned start screen, a cleaner flight page with Start flight up top, book a checkride straight from the Story page, and the coach no longer nags during Castillo\'s steep turn.']);
WHATS_NEW.unshift(['0.65','A new look: a glass-cockpit design across the whole app. Sharp edges, one amber color for the thing to do next, avionics-style readouts, a slim top bar instead of the sidebar, a full-scene chapter screen, a cleaner job board, flight strip and in-flight view, and equal-looking story choices.']);
WHATS_NEW.unshift(['0.66','Less noise: plain labels instead of tiny capitals everywhere, about half the helper text gone, a shorter start screen, and a little film grain.']);
WHATS_NEW.unshift(['0.67','Every character sounds more like themselves: Dez loose and warm, Castillo smooth and cold, Tico talking too fast, Reyes clipped, Hartwell rambling. Two repeated lines fixed. The job board now reads like a departures board, and your license sits next to your story path.']);
WHATS_NEW.unshift(['0.68','A phone full of texts that want answers. Islands that remember you. Weekly events, a fixer on every island, bribes, Castillo\'s loans, properties that clean dirty money, named airplanes. In the air: ATC instructions, failures, Coast Guard intercepts, short fuel loads, contraband weight, graded approaches and customs scenes.']);
WHATS_NEW.unshift(['0.69','Dispatch paperwork before every flight (weights, fuel, NOTAMs, the fuel slip). A live route strip and weather radar in the air. Your home and the case Reyes is building, on the Story page. Phone buzz and result stamp sounds, optional ramp ambience, number keys for every choice, a big-screen mode for a second monitor, and texts in the MSFS panel.']);
WHATS_NEW.unshift(['0.70','The story remembers: later chapters mention what you did. Timed choices in the air. Two new endings (Walk Away, Coming Home). Halcón, Medina\'s pilot, races you. Reyes sits you down for an interview. A secret chapter for players who earned it. In New Game+, the leak is someone else. Save a picture card of every chapter.']);
WHATS_NEW.unshift(['0.71','Butter Cup codes to race your friends, ten secret achievements, photo moments on famous approaches, Twitch tips, a guided first ten minutes, Heat that follows your difficulty, Spanish menus (beta), crash reports with the last 50 events, and a save folder you can point at OneDrive or Dropbox (desktop app).']);
WHATS_NEW.unshift(['0.72','Hull insurance (it pays 80% of a crash), accident investigators who ask about your cargo, and the story notices when you fly through real weather.']);
WHATS_NEW.unshift(['0.73','Polish: the dispatch weights now add up (you count, and so does your cargo), the result screen\'s Heat change includes everything, achievements from the new systems pop, tables fit on phones, small print is readable, weekly events vary properly, Halcón no longer interrupts another instruction, and a few words fixed.']);
WHATS_NEW.unshift(['0.74','The top bar fits every screen size (it ran off the edge on laptops once Heat and dirty cash appeared). Property income comes as a weekly bank text instead of a pile of pop-ups.']);
WHATS_NEW.unshift(['0.75','Focus: the Story page shows what matters now (next chapter, your people, the last three chapters); the operation panels moved to Money. New systems appear one at a time, each introduced by a text. Dispatch folds away unless something needs you. The outdated welcome tour is gone. The result shows how your pay splits into base pay and bonuses. Daytime chapters end on the ramp, not a night cockpit. Customs is less predictable above 60 Heat, and above 75 only an A landing talks you out of a search.']);
WHATS_NEW.unshift(['0.76','Polish: the Airline page says how much more you need for a facility instead of showing empty buttons, phone layouts fixed on the result screen, the story path, flight tickets and money rows, and no more failed voice-file request at startup.']);
WHATS_NEW.unshift(['0.77','Polish: readable Buy and Start the story buttons, plain logbook columns, tidy Hours by aircraft rows, used aircraft say how much more the down payment needs, a steadier income chart, and centred achievement pop-ups.']);
WHATS_NEW.unshift(['0.78','Polish: no more empty portrait boxes while the painted portraits load, the flight ticket plane is no longer clipped, and tidier collapsed sections.']);
WHATS_NEW.unshift(['0.79','Phones and tablets: the job board shows each job\'s destination, aircraft and flight time again. Tidier flight ticket and story card on phones.']);
WHATS_NEW.unshift(['0.80','Polish: Flight Academy lessons are numbered instead of using emoji, and the Saves page lines up. The whole 20-chapter story was played through by clicks at desktop and phone width with no errors.']);
WHATS_NEW.unshift(['0.81','A still title screen and fifty fixes and upgrades: sort the job board, mute with M, sell property, name your planes on the pass, timed choices that pause while you\'re in MSFS, phone tidy-ups, new stats, credits and more. Full list in docs/launch/patch-0.81.md.']);
WHATS_NEW.unshift(['0.82','A radio call or cabin line no longer knocks an unanswered question (like the Coast Guard) off the screen; it waits its turn.']);
WHATS_NEW.unshift(['0.83','A tidier game: one Property list on the Money page (your home, safehouses and businesses together), one phone for texts and notifications, the Coast Guard radio warning now leads into the intercept instead of being a separate scare, and a lot of old code cleaned out underneath.']);
WHATS_NEW.unshift(['0.84','Daytime scenes now show a sunlit ramp with the plane you actually flew, instead of the rainy night jet. The result screen splits story money from tips, property income counts as income on the Money page, the transaction list starts short, and confetti is saved for butter landings. Fixed a rare crash when clicking a choice as a scene ended.']);

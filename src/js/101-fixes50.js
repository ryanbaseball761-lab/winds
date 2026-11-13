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
.ac-hero{background:radial-gradient(120% 120% at 100% 0%,rgba(124,191,111,.18),transparent 55%),linear-gradient(135deg,#101413,#0b0b0d)!important;border:1px solid #23302b}
.cup-hero{background:radial-gradient(120% 120% at 0% 0%,rgba(224,178,74,.22),transparent 55%),linear-gradient(135deg,#17130c,#0b0b0d)!important;border:1px solid #3a2f18}`; document.head.appendChild(s); })();
WHATS_NEW.unshift(['0.50','Every story choice now comes back later, a fuller epilogue, Caribe Cargo becomes your own airline (Pilot → Airline), smuggling pays more and draws more Heat, and many fixes.']);
WHATS_NEW.unshift(['0.51','Clearer story: "Previously" remembers your choices, no spoilers before takeoff, consistent chapter numbers. Castillo pays for your jet rating, and the MSFS clock is set correctly.']);
WHATS_NEW.unshift(['0.52','A faster start: a new start screen, one setup screen, then chapter 1. The next story step is always the main button, checkrides can be booked from your story path, and many fixes.']);
WHATS_NEW.unshift(['0.53','Money fixes: "Earned" matches everywhere, story pay and laundered cash count as income on the Money page, plainer Airline stats, and a "Launder it" shortcut on your story page.']);
WHATS_NEW.unshift(['0.54','Your airline grows: buy airliners (ES-30, A320neo, 737 MAX, A321), build six facilities, open bases at other hubs, refit cabins, and track company value. Plus phone fixes for the job board and Pilot tabs.']);
WHATS_NEW.unshift(['0.55','Behind the scenes: most of the game\'s code is now one clean definition per screen, which makes future fixes safer. The title screen shows your flight in progress properly, and new automatic checks cover the MSFS clock and the airline.']);
WHATS_NEW.unshift(['0.56','Airline balance: every route has a limited number of travellers, passengers cost handling and taxes, and airliner crews cost what they should, so a big jet is a strong investment but not a money printer.']);
WHATS_NEW.unshift(['0.57','Airline: "Find the best route" picks the most profitable destination and fare for a hired aircraft (or tells you the charter pool pays more). Fixed a crash when bringing on crew while you own an airline.']);
WHATS_NEW.unshift(['0.58','Flight mode: the "course to" arrow now points where you need to turn (it was stuck pointing up), the checklist follows your flight phase on its own, duplicate numbers are gone from the phase panel, and the live weather line no longer shows "undefined".']);
WHATS_NEW.unshift(['0.59','The flight timer no longer flickers between real time and sim time (it uses MSFS block time when the sim is recording), and the checklist tabs wrap on phones.']);

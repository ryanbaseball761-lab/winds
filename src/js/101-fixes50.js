/* ===================== 50 FIXES (Nov 9, second sweep) ===================== */
/* 1 (setup pitch), 14 (quiet mode wording) and 15 (title Settings) were fixed in their own files. */


/* 4. no more "New tab unlocked" pop-ups: everything lives in the five-item menu now */
(function(){ const _t=toast; toast=function(msg){ if(/^New tab unlocked/i.test(String(msg))) return; return _t.apply(this, arguments); }; })();

/* 5 + 6. pop-ups really sit bottom-right; achievements show one at a time */
(function(){ const Q=[]; let busy=false; const _ap=achPop; achPop=function(a){ Q.push(a); pump(); }; function pump(){ if(busy||!Q.length) return; if(document.querySelector('.cut')){ setTimeout(pump,1500); return; } busy=true; _ap(Q.shift()); setTimeout(()=>{ busy=false; pump(); }, 4400); } })();

/* 7. network runs have no airline flight number on the ticket */
(function(){ const _fn=flightNo; flightNo=function(job){ return job && job.network ? 'Unlisted' : _fn(job); }; })();




/* 11. your role reads properly everywhere ("Castillo's crew", not just "Castillo") */
(function(){ const _sr=storyRole; storyRole=function(st){ const r=_sr(st); return r==='Castillo' ? "Castillo's crew" : r; }; })();


/* 16. Butter Cup cards get the same noir treatment as everything else */
/* (CSS below) */

/* 17 + 18 + 19. phone-width fixes: tabs scroll, the flight display wraps, the bottom menu is dark */
/* (CSS below) */


/* 21. story card: if a chapter needs an aircraft you own in MSFS, one click adds it */
(function(){ const _pa=playAction; playAction=function(st,m,availSet,n){ const r=_pa(st,m,availSet,n); if(chapterStatus(st,m,availSet).k==='aircraft'){ const opts=m.ac.filter(k=>AC[k] && canFly(st,k)).slice(0,3); if(opts.length) r.btn=opts.map(k=>`<button class="btn sm" data-act="own-ac" data-v="${k}">I own the ${esc(AC[k].n)}</button>`).join('')+r.btn; } return r; }; })();
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="own-ac"]'); if(!b||!S.st) return; S.st.hangar=S.st.hangar||{}; S.st.hangar[b.dataset.v]=true; save(); toast(`Added the ${AC[b.dataset.v].n} to your hangar list.`); S.keepScroll=true; render(); });


/* 23. Esc also closes the notifications list */
window.addEventListener('keydown', e=>{ if(e.key==='Escape'){ document.querySelectorAll('.notif-pane').forEach(p=>p.remove()); } });

/* 24. the "Click or press Space" hint fades after the first couple of lines */
(function(){ const _sh=cutHook.shot; cutHook.shot=function(s,el,i,opt){ _sh.call(this,s,el,i,opt); try{ if(i>=2) el.classList.add('hint-off'); }catch(_){} }; })();

/* 25 + 26. flight-display progress label and map "Next" label are easier to read */
/* (CSS below) */

/* 27. the Skip button says where it goes: to your next decision, or the end */
(function(){ const _sh=cutHook.shot; cutHook.shot=function(s,el,i,opt){ _sh.call(this,s,el,i,opt); try{ const sk=el.querySelector('.cut-skip'); const L=(opt&&opt.shots)||[]; if(sk && L.length) sk.textContent = L.slice(i+1).some(x=>x&&x.choice) ? 'Skip to decision' : (s&&s.choice ? 'Skip' : 'Skip scene'); }catch(_){} }; })();


/* 29 + 30. command bar: find people and open their card */
(function(){ const _ci=cmdItems; cmdItems=function(){ const L=_ci(); try{ (typeof metPeople==='function'?metPeople(S.st):[]).forEach(k=>L.push({n:CAST[k].n, k:'Person · '+(CAST[k].role||''), run:()=>{ go('story'); setTimeout(()=>personCard(k),150); }})); }catch(_){} return L; }; })();

/* 31. Esc closes the person card, the shortcut list and What's new */
window.addEventListener('keydown', e=>{ if(e.key!=='Escape') return; const w=document.querySelector('.pc-wrap'); if(w){ w.remove(); e.stopImmediatePropagation(); } }, true);

/* 32. the five acts show how far you are in each */
(function(){ const _sv=storyView; storyView=function(){ const h=_sv(); try{ const st=S.st; const MC=mainChapters(); return h.replace(/<p class="label">Act (\d)<\/p><h4>([^<]+)<\/h4>/g, (m,n,arc)=>{ const ch=MC.filter(x=>x.arc===arc.replace(/&amp;/g,'&')); const d=ch.filter(x=>st.story.done[x.id]).length; return `<p class="label">Act ${n} · ${d}/${ch.length}</p><h4>${arc}</h4>`; }); }catch(_){ return h; } }; })();

/* 33. "The story so far" is split by act */
(function(){ const _sv=storyView; storyView=function(){ const h=_sv(); try{ const MC=mainChapters(); let lastArc=null; return h.replace(/<li style="--c:([^"]+)"><span class="sh-n">(\d+)<\/span>/g, (m,col,n)=>{ const ch=MC[Number(n)-1]; if(!ch) return m; const head = ch.arc!==lastArc ? `<li class="sh-act-h" style="--c:${col}">Act ${CRIME_ACTS.findIndex(a=>a.arc===ch.arc)+1} · ${esc(ch.arc)}</li>` : ''; lastArc=ch.arc; return head+m; }); }catch(_){ return h; } }; })();

/* 34 + 35. hiring crew and buying safehouses say how much more you need */
(function(){ const _f=fleetCrewHTML; fleetCrewHTML=function(st){ return _f(st).replace(/<button class="btn sm" data-act="hire" data-v="([a-z]+)">Hire · (\$[\d,]+)<\/button>/g, (m,id,cost)=>{ const k=CREW.find(x=>x.id===id); return st.cash<k.cost ? `<span class="small muted">Hire · ${cost} (you need ${money(k.cost-st.cash)} more)</span>` : m; }); }; })();
(function(){ const _o=operationHTML; operationHTML=function(st){ return _o(st).replace(/<button class="btn sm" data-act="buy-safe" data-v="([a-z]+)" disabled>Buy · (\$[\d,]+)<\/button>/g, (m,id,cost)=>{ const s=SAFEHOUSES.find(x=>x.id===id); return `<span class="small muted">${cost} · you need ${money(s.cost-st.cash)} more</span>`; }); }; })();

/* 36. laundering says what it did to your Heat */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="launder"]'); if(!b||!S.st) return; const o=launderOpts(S.st).find(x=>x.id===b.dataset.v); if(o&&o.heat) setTimeout(()=>toast(`Heat +${o.heat} from laundering.`), 700); });


window.addEventListener('click', e=>{ if(!e.target.closest('[data-act="cancel-yes"]')||!S.st||!S.st.active) return; if(S.st.active.job.kind==='story') setTimeout(()=>{ if(!S.st.active){ go('story'); } }, 50); }, true);

/* 40. the result screen starts at the top after the scene */
(function(){ const _pa=playAftermath; playAftermath=function(){ const r=_pa(); setTimeout(()=>{ try{ window.scrollTo(0,0); }catch(_){} }, 400); return r; }; })();


/* 44. at Heat 80+ (the feds are looking) the Heat chip pulses */
/* (CSS below) */


/* 46. clicking a speaker's portrait in a scene doesn't skip the line you're reading */
document.addEventListener('click', e=>{ if(e.target.closest('.cut-who')) e.stopPropagation(); }, true);

/* 47. airport search results say what you'd land on */
(function(){ const _ci=cmdItems; cmdItems=function(){ return _ci().map(it=>{ if(/^Airport/.test(it.k)){ const code=it.n.split(' · ')[0]; const a=AP[code]; if(a) it.k=`Airport · ${a.isl} · ${longestRwy(a).toLocaleString()} ft`; } return it; }); }; })();


/* 49. "What's new" lists this sweep */
WHATS_NEW.unshift(['0.43','50 fixes: the new-career screen fits the story, Heat in the header, one-click "I own this aircraft", clearer checkride and job lists, phone-width fixes, and more.']);

/* 50. the welcome walkthrough points at the Heat chip */
(function(){ const _cs=cutscene; cutscene=function(opt){ try{ opt.shots=opt.shots.map(s=>s&&s.card&&s.title==='Power, Heat and dirty cash' ? Object.assign({},s,{sub:s.sub.replace('Above 60, customs starts searching.</p>','Above 60, customs starts searching. Your Heat is always shown at the top of the screen.</p>')}) : s); }catch(_){} return _cs(opt); }; })();

(function(){ const s=document.createElement('style'); s.textContent=`
.setup-wrap .hero, .setup-wrap header, .setup-wrap .setup-hero{filter:saturate(.55) brightness(.6) contrast(1.08)}
#toasts{transform:none!important;align-items:flex-end!important;width:auto!important}
.cup-grid .card > :first-child, .cup-card > :first-child, main .cup svg, .cup-art{filter:saturate(.5) brightness(.72) contrast(1.08)}
.subtabs{overflow-x:auto;scrollbar-width:none;white-space:nowrap}.subtabs::-webkit-scrollbar{display:none}.subtabs button{flex:none}
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
.jr-m{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`; document.head.appendChild(s); })();

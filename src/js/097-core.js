/* ===================== 20 SMALL FIXES AND UPGRADES ===================== */

/* 1. the ticket names the right operator as the story moves on */
function carrierFor(st, job){ const c=crime(st); if(job.network) return 'Unlisted charter'; if(job.kind==='story' && CRIME_IDS.has(job.story)){ if(st.story.done.CR15 || job.story==='CR15') return 'Caribe Cargo'; if(c.on || ['CR5','CR6','CR7','CR8','CR9','CR10'].includes(job.story)) return 'Castillo Logistics'; } if(job.kind==='check') return 'Flight examination'; return null; }
const _fxPass = boardingPass;
boardingPass = function(st, job){ let h=_fxPass.apply(this, arguments); const n=carrierFor(st, job); if(n) h=h.replace(/(<span class="carrier">[\s\S]*?<b>)Coral Wing Air(<\/b>)/, `$1${n}$2`); return h; };

/* 2. in-flight story moments never talk over the copilot or ATC, and stay quiet on short final */
(function(){ const _rs=renderSimBits; let held=false; renderSimBits=function(){ const s=S.sim; const a=S.st&&S.st.active; let block=false;
  try{ if(window.speechSynthesis && speechSynthesis.speaking) block=true; if(s&&s.position&&s.motion&&!s.motion.onGround && (s.position.aglFt||0)<1000 && a){ const L=beatsFor(a); const nxt=L.find((b,i)=>!(a.beatsDone||{})[i]); if(nxt && nxt.at!=='final') block=true; } }catch(_){}
  if(block){ const keep=BEAT.last; BEAT.last=Date.now(); _rs(); BEAT.last=keep; return; } _rs(); }; })();

/* 3. "Previously on" only when you've been away for a while (3+ hours) */
(function(){ const _p=playRecapNow; playRecapNow=function(){ let last=0; try{ last=Number(localStorage.getItem('tw.lastSeen')||0); }catch(_){} if(Date.now()-last < 3*3600000) return; return _p(); }; setInterval(()=>{ try{ localStorage.setItem('tw.lastSeen', String(Date.now())); }catch(_){} }, 60000); window.addEventListener('beforeunload', ()=>{ try{ localStorage.setItem('tw.lastSeen', String(Date.now())); }catch(_){} }); })();

/* 4. command bar: Settings opens the Settings tab */
(function(){ const _ci=cmdItems; cmdItems=function(){ return _ci().map(it=>it.n==='Settings'?Object.assign({},it,{run:()=>{ S.hangarTab='settings'; go('hangar'); }}):it); }; })();

/* 5 + 6. keys: number shortcuts don't fire behind the title screen or a popup; Esc closes popups and the open job */
window.addEventListener('keydown', e=>{ if(document.querySelector('.title-screen,.cmd') && /^[1-5f/]$/i.test(e.key) && !/INPUT/.test(e.target.tagName)){ e.stopImmediatePropagation(); }
  if(e.key==='Escape'){ const np=document.querySelector('.notif-pane'); if(np){ np.remove(); return; } if(S.openJob && !document.querySelector('.cut,.cmd')){ S.openJob=null; S.keepScroll=true; render(); } } }, true);

/* 7. network runs say plainly that the pay is dirty */
(function(){ const _jr=jobRow; jobRow=function(st,j){ const h=_jr(st,j); return j.network ? h.replace(/(<span class="jr-p">[^<]*)(<\/span>)/, '$1<small class="dirty">dirty</small>$2') : h; }; })();

/* 8. the story card shows roughly how long the flight is */
(function(){ const _cc=campaignCard; campaignCard=function(st){ let h=_cc(st); try{ const next=mainChapters().find(m=>!st.story.done[m.id]); if(!next) return h; const ac=storyAircraft(st,next)[0]||next.ac[0]; const jj=storyJob(st,next,ac); const est=jj.est||plan(jj).est; h=h.replace(/(<div class="sc-meta"><b>[^<]*<\/b>)/, `$1<span>~${durTxt(est)}</span>`); }catch(_){} return h; }; })();

/* 9. the aircraft you load in MSFS is added to your hangar list automatically */
(function(){ const _rs=renderSimBits; renderSimBits=function(){ _rs(); try{ if(S.simState!=='live'||!S.st) return; const L=loadedAircraft(); if(L.id && S.st.hangar && !S.st.hangar[L.id]){ S.st.hangar[L.id]=true; save(); toast(`Added the ${AC[L.id].n} to your hangar list, since it's loaded in MSFS.`); } }catch(_){} }; })();

/* 10 + 11. cutscenes: optional auto-play, and a progress line */
window.cutAuto = ()=>!!uiP().autoCut;
(function(){ const _sh=cutHook.shot; cutHook.shot=function(s,el,i,opt){ _sh.call(this,s,el,i,opt); try{ let p=el.querySelector('.cut-prog'); if(!p){ p=document.createElement('div'); p.className='cut-prog'; el.appendChild(p); } const n=opt.shots.length; p.innerHTML=Array.from({length:Math.min(n,24)},(_,k)=>`<i class="${k<=i?'on':''}"></i>`).join(''); }catch(_){} }; })();
(function(){ const _s=settingsHTML; settingsHTML=function(){ return _s().replace('Skip all cutscenes (choices still appear on the result screen)</label>', `Skip all cutscenes (choices still appear on the result screen)</label><label class="row"><input type="checkbox" data-act="ui-tog2" data-k="autoCut" ${uiP().autoCut?'checked':''}> Play cutscenes automatically (no clicking between lines)</label>`); }; })();

/* 12. title screen: "Resume flight" when you were in the middle of one */
(function(){ const _t=titleHTML; titleHTML=function(){ const h=_t(); const a=S.st&&S.st.active; return a ? h.replace('<b>Continue</b>', a.started?'<b>Resume flight</b>':'<b>Continue to your flight</b>').replace(/(data-ts="continue" class="on"><b>[^<]*<\/b><span>)[^<]*/, `$1${esc(a.job.from)} → ${esc(a.job.local?a.job.from:a.job.to)} · ${esc(a.job.title)}`) : h; }; })();

/* 13. an empty job list offers a way forward */
(function(){ const _b=boardView; boardView=function(){ return _b().replace(/<div class="empty"><h3>No jobs here right now<\/h3><p>[^<]*<\/p><\/div>/, `<div class="empty"><h3>No jobs here right now</h3><p>Start a new day for fresh work, or travel to a busier airport.</p><div class="row" style="gap:8px;justify-content:center;margin-top:10px"><button class="btn sm" data-act="rest">New day</button><button class="btn sm" data-act="cmd">Find an airport</button></div></div>`); }; })();

/* 14. the result screen warns when Heat is getting dangerous */
(function(){ const _r=resultView; resultView=function(){ const h=_r(); const c=crime(); if(!c.on || c.heat<60) return h; const msg = c.heat>=80 ? `Heat ${c.heat}: the feds are watching. Story chapters are on hold until it's under 80.` : `Heat ${c.heat}: customs is searching planes now. A clean landing gets you waved through; legit jobs cool it down.`; return h.replace('<div class="row next-bar">', `<div class="heat-warn">${msg}</div><div class="row next-bar">`); }; })();

/* 15. the "right now" button shows its full text on hover */
(function(){ const _n=nowHTML; nowHTML=function(st){ const r=rightNow(st); return _n(st).replace('<div class="now-pill">', `<div class="now-pill" title="${r?esc(r.t):''}">`); }; })();

/* 16. "New day" shows the full cost: rent plus fleet and crew */
(function(){ const _b=boardView; boardView=function(){ const h=_b(); try{ const st=S.st; const H=HOUSING[fin(st).housing]||HOUSING.bunk; const ops=dailyCosts(st).reduce((s,x)=>s+x[1],0); const tot=(H.rent||0)+ops; return h.replace(/New day · rent \$[\d,]+/, `New day · ${money(tot)}`).replace('<button class="btn sm" data-act="rest"', `<button class="btn sm" data-act="rest" title="Rent ${money(H.rent||0)}${ops?` + fleet and crew ${money(ops)}`:''}"`); }catch(_){ return h; } }; })();

/* 17. laundering: the cheapest option is highlighted */
(function(){ const _l=launderHTML; launderHTML=function(st){ const h=_l(st); if(!h) return h; const L=launderOpts(st); const best=L.slice().sort((a,b)=>a.fee-b.fee)[0]; return best ? h.replace(`<button class="btn sm" data-act="launder" data-v="${best.id}">`, `<button class="btn sm primary" data-act="launder" data-v="${best.id}">`) : h; }; })();

/* 18. fleet cards show what each jet costs per day */
(function(){ const _f=fleetCrewHTML; fleetCrewHTML=function(st){ let h=_f(st); FLEET.forEach(f=>{ const u=UPKEEP[f[1]]; if(u) h=h.replace(`<small>${esc(f[4])}</small>`, `<small>${esc(f[4])}</small><small class="mono">${money(u)}/day</small>`); }); return h; }; })();

/* 19. a backup every 30 minutes of play, too */
setInterval(()=>{ try{ if(S.st && !(S.st.active&&S.st.active.started)) backupLabeled(S.st, `Autosave · ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`); }catch(_){} }, 30*60000);

/* 20. dirty cash shows in the header next to your cash */
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ const hud=document.querySelector('.topbar .hud'); const c=S.st&&crime(); const old=document.querySelector('.dirty-chip'); if(old) old.remove(); if(hud && c && c.dirty>0){ const d=document.createElement('button'); d.className='dirty-chip'; d.dataset.act='nav'; d.dataset.v='money'; d.title='Dirty cash from network runs. Launder it on the Money page.'; d.innerHTML=`<span>Dirty</span><b>${money(c.dirty)}</b>`; const bell=hud.querySelector('.bell'); bell?bell.before(d):hud.appendChild(d); } }catch(_){} return x; }; })();

(function(){ const s=document.createElement('style'); s.textContent=`
.jr-p small.dirty{display:block;font-size:10px;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:#e5533d}
.cut-prog{position:absolute;left:8vw;bottom:calc(11vh + 22px);z-index:4;display:flex;gap:4px}.cut-prog i{width:14px;height:3px;border-radius:2px;background:rgba(255,255,255,.18)}.cut-prog i.on{background:var(--arc)}
.heat-warn{padding:12px 16px;border:1px solid #6b2a20;border-left:4px solid #e5533d;border-radius:12px;background:rgba(194,58,43,.08);font-size:14px}
.dirty-chip{display:inline-grid;line-height:1.1;text-align:left;border:1px solid #6b2a20;background:rgba(194,58,43,.08);color:var(--ink);border-radius:10px;padding:4px 10px;cursor:pointer}.dirty-chip span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#e5533d}.dirty-chip b{font-family:var(--f-mono);font-size:13px}
.fc-ac small.mono{color:#e0b24a}`; document.head.appendChild(s); })();

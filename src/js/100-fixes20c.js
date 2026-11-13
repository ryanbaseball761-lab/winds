/* ===================== 20 FIXES AND SMALL UPGRADES (Nov 9) ===================== */

/* 1. art: preload the portraits and scenes so they never pop in mid-cutscene */
function artLoad(i){ artLoadBase(i); setTimeout(()=>{ [...Object.values(ART.portraits), ...Object.values(ART.scenes)].forEach(u=>{ const im=new Image(); im.src=u; }); }, 4000); }

/* 2. click anyone on the Story page for their card: big portrait, who they are, where you stand */
function personCard(k){ const st=S.st; const c=CAST[k]; if(!c) return; const trust=Math.round(st.rep[k]||0); const big=ART.portraits[k]?`<div class="pc-img" style="background-image:url('${ART.portraits[k]}')"></div>`:`<div class="pc-img pc-svg">${avatar(k)}</div>`;
  const d=document.createElement('div'); d.className='pc-wrap'; d.innerHTML=`<div class="pc" role="dialog" aria-label="${esc(c.n)}">${big}<div class="pc-in"><p class="label">${esc(c.role||'')}</p><h2>${esc(c.n)}</h2><p>${esc(c.bio||'')}</p><p class="pc-status">${esc(personStatus(st,k))}</p><div class="pc-trust"><span>Trust</span><div><i style="width:${Math.min(100,trust)}%"></i></div><b>${trust}</b></div><button class="btn sm" data-act="pc-close">Close</button></div></div>`;
  document.body.appendChild(d); d.addEventListener('click', e=>{ if(e.target===d || e.target.closest('[data-act="pc-close"]')) d.remove(); }); }
document.addEventListener('click', e=>{ const p=e.target.closest('.sh-p, .sc-who'); if(!p || !S.st) return; const name=(p.querySelector('b')||p).textContent.trim(); const k=Object.keys(CAST).find(x=>CAST[x].n===name || ({reyes:'Reyes',castillo:'Castillo'}[x]===name) || (typeof shortName==='function' && shortName(x)===name)); if(k) personCard(k); });


/* 4. result screen: the grade letter is coloured by how you did */
/* (CSS only, see below) */


document.addEventListener('input', e=>{ if(!e.target.closest('.cmd-box input')) return; }, true);

document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="cold-again"]')) return; const st=S.st; const f=st.flights, d=st.story.done.CW1; st.flights=0; delete st.story.done.CW1; const shots=coldOpenShots(); st.flights=f; if(d) st.story.done.CW1=d; cutscene({shots, col:'#c8962a', art:SCENES.ramp(), onEnd:()=>{}}); });


/* 10. notifications: a Clear button */
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="bell"]'); if(!b) return; setTimeout(()=>{ const p=document.querySelector('.notif-pane'); if(p && S.notifs.length && !p.querySelector('.np-clear')){ const c=document.createElement('button'); c.className='btn sm ghost np-clear'; c.textContent='Clear'; c.onclick=()=>{ S.notifs=[]; S.notifSeen=0; p.remove(); }; p.querySelector('.label').after(c); } }, 0); });

/* 11. Profile: story achievements are listed first */
(function(){ const story=ACH.filter(a=>/^cx_/.test(a.id)); const rest=ACH.filter(a=>!/^cx_/.test(a.id)); ACH.splice(0, ACH.length, ...story, ...rest); })();

/* 12. press ? for the list of shortcuts */
document.addEventListener('keydown', e=>{ if(e.key!=='?' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.cut,.title-screen')) return; if(document.querySelector('.keys-wrap')){ document.querySelector('.keys-wrap').remove(); return; }
  const d=document.createElement('div'); d.className='pc-wrap keys-wrap'; d.innerHTML=`<div class="pc keys"><div class="pc-in"><p class="label">Keyboard</p><h2>Shortcuts</h2><dl>${[['1 – 5','Story, Jobs, Flight, Pilot, Hangar'],['Ctrl K or /','Search anything'],['F','Your current flight'],['M','Menu in flight mode'],['Space / →','Next line in a cutscene'],['←','Previous line in a cutscene'],['Esc','Skip a cutscene, close a popup'],['?','This list']].map(([k,v])=>`<dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join('')}</dl><button class="btn sm" data-act="pc-close">Close</button></div></div>`; document.body.appendChild(d); d.addEventListener('click', ev=>{ if(ev.target===d||ev.target.closest('[data-act="pc-close"]')) d.remove(); }); });

document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="cut-size"]'); if(!b||!S.st) return; uiP().cutSize=b.dataset.v; save(); S.keepScroll=true; render(); });

/* 14. "What's new" on the title screen */
const WHATS_NEW = [['0.42','Illustrated portraits and scenes, person cards on the Story page, flight progress in flight mode, ← to go back in cutscenes, shortcuts list (?), and more.'],['0.41','Fixed Butter Cup, Academy and Profile pages; 21 smaller fixes.'],['0.40','20 small fixes: the right airline on your ticket, dirty cash in the header, cutscene auto-play.'],['0.39','Title screen, cold open, music, character voices, volume and units settings.'],['0.38','Backups before every chapter, safehouses, the feds, New Game+.']];
document.addEventListener('click', e=>{ if(!e.target.closest('[data-ts-new]')) return; e.stopPropagation(); const d=document.createElement('div'); d.className='pc-wrap'; d.style.zIndex=13000; d.innerHTML=`<div class="pc keys"><div class="pc-in"><p class="label">Updates</p><h2>What's new</h2><dl>${WHATS_NEW.map(([v,t])=>`<dt><b>${v}</b></dt><dd>${esc(t)}</dd>`).join('')}</dl><button class="btn sm" data-act="pc-close">Close</button></div></div>`; document.body.appendChild(d); d.addEventListener('click', ev=>{ if(ev.target===d||ev.target.closest('[data-act="pc-close"]')) d.remove(); }); }, true);


/* 16. click a finished chapter in "The story so far" for its full recap */
document.addEventListener('click', e=>{ const li=e.target.closest('.sh-time li'); if(!li || e.target.closest('button')) return; const n=Number((li.querySelector('.sh-n')||{}).textContent); const m=mainChapters()[n-1]; if(!m||!S.st.story.done[m.id]) return; const c=crime(); const ch=m.choice&&c.choice[m.id]!=null?m.choice.opts[c.choice[m.id]]:null;
  const d=document.createElement('div'); d.className='pc-wrap'; d.innerHTML=`<div class="pc keys"><div class="pc-in"><p class="label">Chapter ${n} · ${esc(m.arc)}</p><h2>${esc(m.title)}</h2><p>${esc((m.brief||[]).join(' '))}</p><p class="pc-status">${esc(m.recap||'')}</p>${ch?`<p><b>You chose:</b> ${esc(ch.t)}. ${esc(ch.out)}</p>`:''}<div class="row" style="gap:8px"><button class="btn sm" data-act="replay-ch" data-id="${m.id}">▶ Replay the opening</button><button class="btn sm ghost" data-act="pc-close">Close</button></div></div></div>`; document.body.appendChild(d); d.addEventListener('click', ev=>{ if(ev.target===d||ev.target.closest('[data-act="pc-close"],[data-act="replay-ch"]')) d.remove(); }); });

/* 17. a small "Saved" tick in the sidebar when your career is saved */
function save(){ const r=saveBase.apply(this, arguments); try{ clearTimeout(S._svT); S._svT=setTimeout(()=>{ const el=document.querySelector('.band .sync, .side .sync, .side-foot'); if(el){ el.classList.add('saved-flash'); setTimeout(()=>el.classList.remove('saved-flash'), 900); } }, 50); }catch(_){} return r; }


/* 19. bigger portraits in "The people" now that there's art */
/* (CSS only, see below) */

/* 20. ← steps back a line in cutscenes (never past a decision) */
/* (added to the cutscene engine) */

(function(){ const s=document.createElement('style'); s.textContent=`
.pc-wrap{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:20px;animation:pgIn .2s ease}
.pc{display:grid;grid-template-columns:300px 1fr;max-width:760px;width:100%;background:#131316;border:1px solid #2c2c31;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.pc.keys{grid-template-columns:1fr;max-width:560px}.pc-img{background-size:cover;background-position:center 25%;min-height:320px}.pc-svg{display:grid;place-items:center}.pc-svg .avatar{width:180px!important;height:180px!important}
.pc-in{padding:22px 24px;display:grid;gap:10px;align-content:start}.pc-in h2{margin:0;font-size:26px}.pc-in p{margin:0;line-height:1.5}.pc-status{color:#e0b24a}
.pc-trust{display:grid;grid-template-columns:50px 1fr 30px;gap:10px;align-items:center;font-size:13px}.pc-trust div{height:6px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}.pc-trust i{display:block;height:100%;background:#c8962a}
.pc-in dl{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:4px 0}.pc-in dd{margin:0;color:var(--muted)}.pc-in .btn{justify-self:start}
@media (max-width:700px){.pc{grid-template-columns:1fr}.pc-img{min-height:220px}}
.sh-p{cursor:pointer}.sh-p:hover b{color:#e0b24a}.sh-p .avatar{width:48px!important;height:48px!important}.sh-p{grid-template-columns:48px 1fr!important}.sc-who{cursor:pointer}
.sh-time li{cursor:pointer}.sh-time li:hover b{color:#e0b24a}
.cut-who .avatar{width:84px!important;height:84px!important}.cut-who b{font-size:18px}.cut-role{display:block;font-size:12px;color:#8f897e;letter-spacing:.04em;margin-left:2px}.cut-who{flex-wrap:wrap}
.cut[data-size="s"] .cut-text{font-size:clamp(16px,1.8vw,22px)}.cut[data-size="l"] .cut-text{font-size:clamp(24px,3vw,38px)}
.ring.gA .ring-fg,.ring.gA circle:last-child{stroke:#7cbf6f}.ring.gB circle:last-child{stroke:#c8962a}.ring.gC circle:last-child{stroke:#e0b24a}.ring.gD circle:last-child,.ring.gF circle:last-child{stroke:#e5533d}
.fhud-prog{position:relative;height:6px;border-radius:4px;background:rgba(255,255,255,.07);margin-top:14px}.fhud-prog i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#c8962a,#e0b24a)}.fhud-prog span{position:absolute;right:0;top:-18px;font-size:11px;color:var(--muted);font-family:var(--f-mono)}
.np-clear{float:right;margin-top:-26px}
.ts-new{position:absolute;bottom:52px;left:9vw;background:none;border:0;color:#c8962a;font:inherit;font-size:13px;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
.cut-bg:has(.art-scene),.ts-bg:has(.art-scene){filter:saturate(.95) brightness(.9) contrast(1.05)!important}
.saved-flash{color:#7cbf6f!important;transition:color .2s}`; document.head.appendChild(s); })();

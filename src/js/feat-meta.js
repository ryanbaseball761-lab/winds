/* ===================== REPLAY, SHARING AND RELEASE (0.71) =====================
   - Butter Cup share codes: every best landing makes a short code. Paste a friend's code and they show up on your board.
   - Secret achievements: hidden until you earn them.
   - Photo moments: famous approaches tell you when to hit the screenshot key.
   - Twitch: chat can tip you (!tip). (Chat already votes on choices.)
   - First flight: a short guided start for brand-new careers.
   - Difficulty: Casual and Expert change how fast Heat builds.
   - Language: Spanish for the menus and buttons (beta). All text goes through one table, ready for more.
   - Crash reports: the last 50 things that happened go into "Report a problem", and the desktop app keeps a copy. */

/* ---------- counters the other features feed ---------- */
function twStats(){ const w=twW(); w.stats=w.stats||{atc:0,ph:0,fuel:0}; return w.stats; }
AFTER_RESULT.push(function metaCounters(st, job){ const a=S._lastActive; if(!a) return; const S2=twStats(); if(a.order && a.order.atc && a.order.state==='ok') S2.atc++; if(job.fuelLie && a.fuelChecked) S2.fuel++; });

/* =====================================================================
   SECRET ACHIEVEMENTS
   ===================================================================== */
const SECRET_ACH = [
  {id:'sx_box', n:`The First Box`, d:`Fly the secret chapter.`, t:s=>!!s.story.done.SX1},
  {id:'sx_walk', n:`Clean Exit`, d:`Walk away from Castillo.`, t:s=>!!(s.crime&&s.crime.ending==='walk')},
  {id:'sx_home', n:`Coming Home`, d:`Go back to Coral Wing.`, t:s=>!!(s.crime&&s.crime.ending==='home')},
  {id:'sx_halcon', n:`Faster Than the Falcon`, d:`Beat Halcón three times.`, t:s=>!!(s.w&&s.w.halcon&&s.w.halcon.w>=3)},
  {id:'sx_honest', n:`Nothing to Hide`, d:`Tell Reyes the truth, every time.`, t:s=>!!(s.crime&&s.crime.flags&&s.crime.flags.reyesTalked)},
  {id:'sx_name', n:`She Has a Name`, d:`Name one of your airplanes.`, t:s=>!!(s.w&&s.w.ac&&Object.values(s.w.ac).some(h=>h.nick))},
  {id:'sx_phone', n:`Always Answers`, d:`Reply to 10 texts.`, t:s=>!!(s.w&&s.w.stats&&s.w.stats.ph>=10)},
  {id:'sx_islands', n:`Island Famous`, d:`Be welcomed on three islands.`, t:s=>!!(s.w&&s.w.isl&&Object.values(s.w.isl).filter(v=>v>=30).length>=3)},
  {id:'sx_fuel', n:`Read the Slip`, d:`Catch a short fuel load before takeoff.`, t:s=>!!(s.w&&s.w.stats&&s.w.stats.fuel>=1)},
  {id:'sx_atc', n:`Roger, Wilco`, d:`Follow five ATC instructions.`, t:s=>!!(s.w&&s.w.stats&&s.w.stats.atc>=5)},
];
SECRET_ACH.forEach(a=>{ a.secret=true; ACH.push(a); });
AFTER_RENDER.push(function hideSecretAch(){ const names=new Set(SECRET_ACH.filter(a=>!(S.st&&S.st.ach&&S.st.ach[a.id])).map(a=>a.n));
  document.querySelectorAll('.ach:not(.on)').forEach(el=>{ const b=el.querySelector('b'); if(b && names.has(b.textContent)){ b.textContent='Secret'; const s=el.querySelector('.small'); if(s) s.textContent='Keep playing. You\'ll know it when it happens.'; el.classList.add('ach-secret'); } }); });

/* =====================================================================
   BUTTER CUP SHARE CODES (and friends on your board)
   ===================================================================== */
function cupCode(cid, fpm, bounces){ const wk=isoWeek(); const raw=`${cid}.${Math.round(fpm)}.${bounces||0}.${wk}`; const chk=(hashStr(raw+'tw')%1296).toString(36).padStart(2,'0'); return `TW-${cid.toUpperCase()}-${Math.round(fpm)}-${bounces||0}-${String(wk).replace(/\W/g,'')}-${chk}`.toUpperCase(); }
function cupDecode(code){ const m=String(code).trim().toUpperCase().match(/^TW-([A-Z0-9]+)-(\d+)-(\d+)-([A-Z0-9]+)-([A-Z0-9]{2})$/); if(!m) return null; const cid=m[1].toLowerCase(); if(!CUP.some(c=>c.id===cid)) return null;
  const wk=isoWeek(); if(m[4]!==String(wk).replace(/\W/g,'').toUpperCase()) return {old:true}; const raw=`${cid}.${m[2]}.${m[3]}.${wk}`; const chk=(hashStr(raw+'tw')%1296).toString(36).padStart(2,'0').toUpperCase(); if(chk!==m[5]) return null;
  return {cid, fpm:+m[2], b:+m[3]}; }
/* friends' codes for this week show under the board (cupBoard in 037-core.js calls this) */
function cupFriendsHTML(st, c){ const fr=(cupState(st).friends||[]).filter(f=>f.cid===c.id && f.wk===isoWeek()); if(!fr.length) return '';
  return `<div class="cup-friends">${fr.map(f=>`<p class="small"><b>${esc(f.n)}</b> <span class="mono">${f.fpm} fpm</span>${f.b?` · ${f.b} bounce${f.b>1?'s':''}`:''}</p>`).join('')}</div>`; }
AFTER_RENDER.push(function cupShare(){ if(S.view!=='cup'||!S.st) return; const main=document.querySelector('main'); if(!main||main.querySelector('.cup-share')) return; const C=cupState(S.st);
  const mine=CUP.filter(c=>C.best[c.id]).map(c=>`<li><span>${esc(c.n)}</span><code class="mono">${cupCode(c.id, C.best[c.id].fpm, C.best[c.id].bounces)}</code><button class="btn sm" data-act="cup-copy" data-c="${cupCode(c.id, C.best[c.id].fpm, C.best[c.id].bounces)}">Copy</button><button class="btn sm ghost" data-act="share-discord" data-what="cup" data-c="${cupCode(c.id, C.best[c.id].fpm, C.best[c.id].bounces)}" data-n="${esc(c.n)}" data-fpm="${Math.round(C.best[c.id].fpm)}">Discord</button></li>`).join('');
  const d=document.createElement('section'); d.className='panel cup-share'; d.innerHTML=`<div class="section-title"><h2>Race your friends</h2></div>${mine?`<p class="small muted">Your codes for this week. Send one to a friend.</p><ul class="cs-list">${mine}</ul>`:`<p class="small muted">Land on any Cup approach and you'll get a code to send.</p>`}
    <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><input id="cup-friend-n" placeholder="Friend's name" maxlength="20" aria-label="Friend's name" style="width:160px"><input id="cup-friend-c" placeholder="TW-MAHO-84-0-…" maxlength="40" aria-label="Friend's code" style="width:240px"><button class="btn sm" data-act="cup-add">Add to my board</button></div>`;
  main.appendChild(d); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="cup-copy"],[data-act="cup-add"]'); if(!b||!S.st) return;
  if(b.dataset.act==='cup-copy'){ try{ navigator.clipboard.writeText(b.dataset.c); toast('Code copied.'); }catch(_){ toast(b.dataset.c); } return; }
  const n=(document.getElementById('cup-friend-n').value||'Friend').trim().slice(0,20), r=cupDecode(document.getElementById('cup-friend-c').value);
  if(!r){ toast('That code doesn\'t look right.'); return; } if(r.old){ toast('That code is from another week. The board resets every Monday.'); return; }
  const C=cupState(S.st); C.friends=(C.friends||[]).filter(f=>!(f.n===n&&f.cid===r.cid)).concat([{n, cid:r.cid, fpm:r.fpm, b:r.b, wk:isoWeek()}]).slice(-30); save(); toast(`${n} is on your ${CUP.find(c=>c.id===r.cid).n} board.`); S.keepScroll=true; render(); });

/* =====================================================================
   PHOTO MOMENTS
   ===================================================================== */
const PHOTO_SPOTS = {TNCM:`Maho Beach on short final. The crowd on the sand is filming you.`, TFFJ:`Over the ridge into St. Barth. The road is right under your wheels.`, TNCS:`Saba's runway, cliffs on every side.`, TQPF:`Anguilla's water, that color.`, TFFR:`Guadeloupe's volcano off your wing.`, TBPB:`Barbados at golden hour.`};
SIM_TICK.push(function photoMoment(){ const a=S.st&&S.st.active; if(!a||!a.started||a.photoSaid||S.simState!=='live') return; const s=S.sim; if(!s||!s.position||s.motion.onGround) return; const to=a.job.local?a.job.from:a.job.to; const t=PHOTO_SPOTS[to]; if(!t||!AP[to]) return;
  const d=distNm({lat:s.position.lat,lon:s.position.lon},AP[to]); if(d>5 || (s.position.aglFt||0)>1800 || document.querySelector('.beat')) return; a.photoSaid=1; save();
  showBeat(a,{who:'self', text:`${t}|Photo moment: hit your MSFS screenshot key now.`}, 'photo'); });

/* =====================================================================
   FIRST FLIGHT (new careers)
   ===================================================================== */

/* (the setup wizard covers this now; the panel stays defined for reference) */

/* =====================================================================
   DIFFICULTY: how fast Heat builds
   ===================================================================== */
AFTER_RESULT.push(function difficultyHeat(st, job, f, res, was){ const c=crime(st); if(!c.on) return; const d=diff(); const gain=c.heat-was.heat; if(gain<=0) return;
  if(d==='casual') crBump(c,'heat',-Math.round(gain*0.3)); else if(d==='expert') crBump(c,'heat',Math.round(gain*0.3)); });


/* =====================================================================
   CRASH REPORTS
   ===================================================================== */
/* the last 50 toasts, page changes and errors (TW_TRAIL in 027-core.js) go into every report */
window.addEventListener('error', e=>{ trail('error', `${e.message} @ ${(e.filename||'').split('/').pop()}:${e.lineno}`); crashCopy(); });
window.addEventListener('unhandledrejection', e=>{ trail('error', 'Promise: '+(e.reason&&(e.reason.message||e.reason))); });
let crashT=0; function crashCopy(){ if(Date.now()-crashT<60000) return; crashT=Date.now(); try{ if(window.twNative && twNative.flightLog) twNative.flightLog(`crash-${new Date().toISOString().replace(/[:.]/g,'-')}.json`, JSON.stringify({version:TW_VERSION, trail:TW_TRAIL}, null, 1)); }catch(_){} }

/* =====================================================================
   SAVE FOLDER (desktop): put your career in a synced folder (OneDrive, Dropbox, iCloud)
   ===================================================================== */
AFTER_RENDER.push(function syncFolder(){ if(S.view!=='hangar'||S.hangarTab!=='settings'||!window.twNative||!twNative.chooseSyncDir) return; const box=document.querySelector('.ui3-set'); if(!box||box.querySelector('[data-act="sync-dir"]')) return;
  box.insertAdjacentHTML('beforeend', `<div style="margin-top:12px"><p class="small muted">Keep your career in a synced folder (OneDrive, Dropbox, iCloud Drive) and it follows you to another PC.</p><button class="btn sm" data-act="sync-dir">Choose save folder</button> <span class="small muted" id="sync-dir-now"></span></div>`);
  try{ twNative.saveDir && twNative.saveDir().then(d=>{ const el=document.getElementById('sync-dir-now'); if(el) el.textContent=d||''; }); }catch(_){} });
document.addEventListener('click', async e=>{ if(!e.target.closest('[data-act="sync-dir"]')) return; try{ const d=await twNative.chooseSyncDir(); if(d){ toast(`Saving to ${d} from now on.`); save(); const el=document.getElementById('sync-dir-now'); if(el) el.textContent=d; } }catch(_){ toast('Couldn\'t change the save folder.'); } });

(function(){ const s=document.createElement('style'); s.textContent=`
.ach-secret{opacity:.7}.ach-secret b{letter-spacing:.2em}
.cs-list{list-style:none;padding:0;margin:8px 0 0}.cs-list li{display:flex;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}.cs-list li span{flex:1}.cs-list code{color:var(--amb)}
.cup-friends{border-top:1px dashed var(--line-2);margin-top:6px;padding-top:6px}.cup-friends b{color:var(--sky)}
.first-flight{border-top:2px solid var(--amb)!important}.ff{list-style:none;padding:0;margin:0}.ff li{display:flex;gap:14px;padding:12px 0;border-top:1px solid var(--line)}.ff li:first-child{border-top:0}
.ff li>span{width:26px;height:26px;display:grid;place-items:center;border:1px solid var(--line-2);flex:none}.ff li.done>span{border-color:var(--good);color:var(--good)}.ff p{margin:3px 0 8px}
`; document.head.appendChild(s); })();

/* =====================================================================
   INSURANCE AND ACCIDENT INVESTIGATIONS
   A hull policy costs a little every day and pays 80% of what a crash costs you. Any crash brings an investigator;
   one during a network run brings questions you can't answer.
   ===================================================================== */
function insOn(){ return !!(S.st && S.st.w && S.st.w.ins); }
function insDaily(st){ const n=1+Object.keys(st.hangar||{}).length; return 25*n; }
DAY_HOOKS.push(st=>{ if(st.w && st.w.ins){ txn(st, -insDaily(st), 'Insurance', 'Hull insurance'); } });
AFTER_RESULT.push(function accident(st, job, f, res){ if(!res.crash || job.practice) return; const o=st.last&&st.last.out; if(!o) return; const c=crime(st);
  const note=o.notes.find(n=>/^Accident investigation, insurance excess and repairs: /.test(n)); const cost=note ? Number(note.replace(/[^0-9]/g,'')) : 0;
  if(insOn() && cost>0){ const back=Math.round(cost*0.8); txn(st, back, 'Insurance', 'Claim paid'); o.notes.push(`Your insurer paid ${money(back)} of it.`); }
  if(c.on){ if(job.network){ crBump(c,'heat',15); const lost=Math.round((c.dirty||0)*0.5); c.dirty=Math.max(0,(c.dirty||0)-lost); o.notes.push(`The accident investigators found what was in the hold. Heat +15${lost?`, and ${money(lost)} in dirty cash is gone`:''}.`); phonePush({from:'reyes', text:`I read the accident report from ${job.to}. Interesting cargo.`}); }
    else { crBump(c,'heat',4); o.notes.push('An accident investigator wants to see your logbook. Heat +4.'); } } });
AFTER_RENDER.push(function insPanel(){ if(S.view!=='money'||!S.st) return; const host=document.querySelector('.w-added'); if(!host||host.querySelector('.w-ins')) return; const st=S.st;
  host.insertAdjacentHTML('afterbegin', `<section class="panel w-ins row between" style="gap:12px;flex-wrap:wrap"><div><h3>Hull insurance</h3><p class="small muted">${money(insDaily(st))} a day. Pays 80% of what a crash costs you. It doesn't ask what you were carrying, but the investigators will.</p></div><button class="btn sm" data-act="w-ins">${insOn()?'Cancel the policy':'Buy the policy'}</button></section>`); });
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="w-ins"]')||!S.st) return; const w=twW(); w.ins=!w.ins; save(); toast(w.ins?'Insured. It starts tonight.':'Policy cancelled.'); S.keepScroll=true; render(); });

/* the story notices the weather you flew through */
AFTER_RESULT.push(function storyWeather(st, job){ if(job.kind!=='story') return; const o=st.last&&st.last.out; if(!o) return; const wx=o.notes.find(n=>/weather bonus/.test(n)); if(!wx) return;
  const who = crime(st).on ? 'Castillo' : 'Mari'; o.notes.push(who==='Castillo' ? `Castillo heard about the weather you flew through. "Nobody else would have gone," he says. He sounds pleased.` : `Mari saw the weather on the radar. "You flew in that? Don't tell the insurance company."`); });

/* runs last: the result screen's Power/Heat change includes everything above, and achievements earned by the newer steps pop too */
AFTER_RESULT.push(function finalDelta(st, job, f, res, was){ const c=crime(st); if(st.last) st.last.delta={power:c.power-was.power, heat:c.heat-was.heat};
  const fresh=checkAch(st); fresh.forEach((a,i)=>setTimeout(()=>achPop(a), 4000+i*2600)); });
/* readable small print (contrast fixes found by the accessibility check) */
(function(){ const s=document.createElement('style'); s.textContent=`.ff p,.ff .muted{color:var(--muted)!important;opacity:1!important}.perks li p{color:var(--muted)!important}.perks li{opacity:1!important}html.ckp .pass-stub .label{color:var(--muted)!important;opacity:1!important}`; document.head.appendChild(s); })();

AFTER_RESULT.push(function tourOff(st){ if(!st.tourDone){ st.tourDone=true; } });

/* ---- one-click share to Discord: copy the picture (or the text) and open Discord, ready to paste ---- */
const DISCORD_URL='https://discord.com/channels/@me';
async function shareDiscord(what, b){ let text='', cv=null;
  if(what==='chapter'){ const m=S.st.last&&S.st.last.job&&S.st.last.job.mission; const ch=m&&mainChapters().find(x=>x.id===m); text=`Trade Winds: just finished ${ch&&ch.title?'"'+ch.title+'"':'a chapter'}, grade ${S.st.last.res.grade}.`; try{ cv=drawChapterCard(S.st); }catch(_){} }
  else if(what==='cup'){ text=`Butter Cup, ${b.dataset.n}: ${b.dataset.fpm} fpm. Beat it in Trade Winds with my code ${b.dataset.c}`; }
  let how='text';
  try{ if(cv && window.ClipboardItem && navigator.clipboard.write){ const blob=await new Promise(r=>cv.toBlob(r,'image/png')); await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); how='image'; } else { await navigator.clipboard.writeText(text); } }
  catch(_){ try{ await navigator.clipboard.writeText(text); }catch(__){ how='none'; } }
  window.open(DISCORD_URL,'_blank','noopener');
  toast(how==='image'?'Picture copied. Paste it into Discord with Ctrl+V.':how==='text'?'Copied. Paste it into Discord with Ctrl+V.':'Opening Discord. Copy didn\'t work here, so use Save image.'); }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="share-discord"]'); if(!b||!S.st) return; shareDiscord(b.dataset.what, b); });

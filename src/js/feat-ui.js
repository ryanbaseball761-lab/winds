/* ===================== THE INTERFACE, ROUND 3 (0.69) =====================
   - Dispatch: before you start a flight, the paperwork. Weights, fuel, NOTAMs (some of them hints) and the fuel slip.
   - Sound: phone buzz, the result stamp, paper and switches. Optional ramp ambience.
   - In flight: a live progress strip of the route, and a weather radar ring built from the live weather.
   - Home: where you live and what you own, on the Story page; it changes as you get richer.
   - The case board: what Reyes has on you, pinned up, once Castillo's work starts.
   - Keyboard: 1–4 answer whatever is on screen.
   - Big screen: a large flight display for a second monitor (Settings or ?big).
   - Voiced empty states: an empty list says something in a character's voice. */

/* =====================================================================
   SOUND
   ===================================================================== */
function twSfx(kind){ if(typeof sfxOn==='function' && !sfxOn()) return; const c=typeof actx==='function'?actx():null; if(!c) return; const t=c.currentTime;
  const osc=(f,type,dur,vol,at=0,slide)=>{ const o=c.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t+at); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+at+dur); const g=c.createGain(); g.gain.setValueAtTime(0,t+at); g.gain.linearRampToValueAtTime(vol,t+at+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+at+dur); o.connect(g).connect(c.destination); o.start(t+at); o.stop(t+at+dur+0.05); };
  const noise=(dur,vol,freq,at=0)=>{ const n=Math.floor(c.sampleRate*dur), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3); const s=c.createBufferSource(); s.buffer=b; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=freq; const g=c.createGain(); g.gain.value=vol; s.connect(f).connect(g).connect(c.destination); s.start(t+at); };
  if(kind==='buzz'){ for(let i=0;i<2;i++) osc(150,'sawtooth',0.18,0.05,i*0.28); }
  else if(kind==='stamp'){ noise(0.12,0.5,900); osc(90,'sine',0.18,0.25,0,45); }
  else if(kind==='paper'){ noise(0.09,0.12,4000); }
  else if(kind==='switch'){ osc(2400,'square',0.015,0.04); noise(0.02,0.1,6000); } }

/* ramp ambience: wind and far-off engines, very quiet, only on the ground pages */
const TW_AMB={node:null};
function ambOn(){ return !!(S.st && S.st.ui && S.st.ui.amb); }
function ambSync(){ const want = ambOn() && !document.hidden && !(S.st&&S.st.active&&S.st.active.started) && ['story','board','hangar','pilot','profile','money'].includes(S.view);
  const c=want && typeof actx==='function' ? actx() : AC_CTX; if(!c) return;
  if(want && !TW_AMB.node){ const n=c.sampleRate*4, b=c.createBuffer(2,n,c.sampleRate); for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch); let last=0; for(let i=0;i<n;i++){ last=(last+0.02*(Math.random()*2-1))/1.02; d[i]=last*3; } }
    const s=c.createBufferSource(); s.buffer=b; s.loop=true; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=500; const g=c.createGain(); g.gain.value=0.05; s.connect(f).connect(g).connect(c.destination); s.start(); TW_AMB.node=s; TW_AMB.g=g; }
  else if(!want && TW_AMB.node){ try{ TW_AMB.node.stop(); }catch(_){} TW_AMB.node=null; } }
document.addEventListener('visibilitychange', ambSync);

/* =====================================================================
   DISPATCH
   ===================================================================== */
function notamsFor(job){ const r=fevHash(job.id+'|notam'); const to=job.local?job.from:job.to; const c=crime(S.st); const L=[];
  const pool=[`${to}: bird activity reported near the runway at dawn and dusk.`,`${to}: taxiway B closed for resurfacing. Expect a long taxi.`,`${to}: PAPI out of service.`,`${to}: runway edge lights out of service after 22:00 local.`,`${job.from}: fuel available by phone only. Allow 30 minutes.`,`${to}: tower closes at 19:00. Uncontrolled after.`,`${to}: goats on the airfield perimeter. Really.`,`${to}: military exercise in the area 14:00–16:00. Expect vectors.`];
  L.push(pool[Math.floor(r*pool.length)]); L.push(pool[Math.floor(fevHash(job.id+'n2')*pool.length)]);
  if(c.on && (job.network||job.kind==='story')){ const hot=c.hot&&c.hot[to]; const hints=[`${to}: customs staffing reduced this week.`,`${to}: increased customs presence. Ramp checks likely.`,`${to}: DEA liaison visiting the airport.`,`${to}: customs computer system down until further notice.`];
    L.push(hot||c.heat>=60 ? hints[Math.random()<0.5?1:2] : hints[fevHash(job.id+'h')<0.5?0:3]); }
  return [...new Set(L)]; }
function dispatchHTML(st, a){ const j=a.job; const p=plan(j); const s=S.sim; const live=S.simState==='live'&&s&&s.systems; const lb=x=>`${Math.round(x).toLocaleString()} lb`;
  const loadedGal = live && s.systems.fuelGal!=null ? Math.round(s.systems.fuelGal) : null;
  const shortNow = j.fuelLie && !a.fuelChecked;
  const slipGal = Math.ceil(Math.max(p.gal*1.3, p.gal+5));
  const fuelLine = j.fuelLie ? (a.fuelChecked ? `<p class="small">Topped off. The fuel man wouldn't look at you.</p>` : a.slipRead ? `<p class="small">The slip says ${slipGal} gal. The truck's meter says ${Math.ceil(p.gal*0.68)}. Someone shorted you.</p><button class="btn sm" data-act="ui-topoff">Make them top it off</button>` : `<button class="btn sm" data-act="ui-slip">Read the fuel slip</button>`) : '';
  const total=p.total+(j.contraband||0); const over=total-(AC[j.ac].useful||0);
  return `<section class="panel dispatch"><div class="section-title"><h2>Dispatch</h2><span class="small muted">${esc(j.from)} → ${esc(j.local?j.from:j.to)} · ${esc(AC[j.ac].n)}</span></div>
    <div class="dsp-grid">
      <div><h3>Weight</h3><table class="w-tab"><tbody>
        <tr><td>People</td><td class="mono">${lb(p.paxLb)}</td></tr><tr><td>Bags and cargo</td><td class="mono">${lb(p.bagLb + (j.cargo||0)*0)}</td></tr>
        ${j.contraband?`<tr><td>Not on the manifest</td><td class="mono" style="color:var(--amb)">${lb(j.contraband)}</td></tr>`:''}
        <tr><td>Fuel</td><td class="mono">${lb(p.fuelLb)}</td></tr><tr><td><b>Total load</b></td><td class="mono"><b>${lb(total)}</b> of ${lb(AC[j.ac].useful)}</td></tr></tbody></table>
        ${over>0?`<p class="small" style="color:var(--bad)">${lb(over)} over. Something stays on the ground, or you take less fuel.</p>`:''}</div>
      <div><h3>Fuel</h3><table class="w-tab"><tbody><tr><td>Trip</td><td class="mono">${lb(p.tripLb)}</td></tr><tr><td>Reserve (${p.reserveMin} min)</td><td class="mono">${lb(p.resLb)}</td></tr>${p.altCode?`<tr><td>Alternate ${esc(p.altCode)}</td><td class="mono">${lb(p.altLb||0)}</td></tr>`:''}<tr><td><b>Planned</b></td><td class="mono"><b>${p.gal} gal</b></td></tr>${loadedGal!=null?`<tr><td>In the tanks now</td><td class="mono" style="${loadedGal<p.gal?'color:var(--bad)':''}">${loadedGal} gal</td></tr>`:''}</tbody></table>${fuelLine}</div>
      <div><h3>NOTAMs</h3><ul class="dsp-notam">${notamsFor(j).map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>
    </div></section>`; }
AFTER_RENDER.push(function dispatchPanel(){ const st=S.st, a=st&&st.active; if(S.view!=='flight' || !a || a.started || S.showResult) return; const main=document.querySelector('main'); if(!main || main.querySelector('.dispatch')) return;
  const pass=main.querySelector('.pass'); if(!pass) return; const d=document.createElement('div'); d.innerHTML=dispatchHTML(st,a); pass.after(d.firstElementChild); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act]'); if(!b||!S.st) return; const a=S.st.active; const k=b.dataset.act;
  if(k==='ui-slip' && a){ a.slipRead=1; twSfx('paper'); save(); S.keepScroll=true; render(); }
  else if(k==='ui-topoff' && a){ a.fuelChecked=1; twSfx('switch'); save(); toast('Topped off. Load the fuel again in MSFS if you already did.'); S.keepScroll=true; render(); } });

/* =====================================================================
   IN FLIGHT: route progress and weather radar
   ===================================================================== */
function routeStripHTML(a){ const s=S.sim; if(S.simState!=='live'||!s||!s.position) return ''; const from=AP[a.job.from], to=AP[a.job.local?a.job.from:a.job.to]; if(!from||!to) return '';
  const tot=Math.max(1,distNm(from,to)), togo=distNm({lat:s.position.lat,lon:s.position.lon},to); const f=a.job.local?0.5:clamp(1-togo/tot,0,1);
  const gs=s.motion.gs||s.motion.ias||0; const eta=gs>40?Math.round(togo/gs*60):null;
  return `<div class="rs"><b class="mono">${esc(a.job.from)}</b><div class="rs-line"><i style="width:${(f*100).toFixed(1)}%"></i><svg class="rs-plane" style="left:${(f*100).toFixed(1)}%" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5v2l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z" transform="rotate(90 12 12)"/></svg></div><b class="mono">${esc(a.job.local?a.job.from:a.job.to)}</b><span class="mono small">${Math.round(togo)} nm${eta!=null?` · ${eta} min`:''}</span></div>`; }
function radarHTML(){ const s=S.sim; const w=(s&&s.ext&&s.ext.weather)||null; if(S.simState!=='live'||!w) return '';
  const rain=Number(w.precip||w.rain||0), vis=Number(w.visSm||w.vis||10), wind=Number(w.windKt||w.wind||0), dir=Number(w.windDir||0); const cells=[];
  const n=Math.min(9, Math.round(rain*6 + (vis<5?3:0) + wind/10)); for(let i=0;i<n;i++){ const ang=(fevHash('r'+i+Math.floor(Date.now()/60000))*360), dist=20+fevHash('d'+i)*65, sz=6+fevHash('s'+i)*14; const x=100+Math.cos(ang*Math.PI/180)*dist, y=100+Math.sin(ang*Math.PI/180)*dist; const col=sz>15&&rain>0.5?'#ef5b4c':sz>10?'#f0a53a':'#5cc97a'; cells.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${sz.toFixed(0)}" fill="${col}" opacity=".45"/>`); }
  return `<div class="radar" title="Weather radar"><svg viewBox="0 0 200 200" aria-label="Weather radar">${cells.join('')}<circle cx="100" cy="100" r="90" fill="none" stroke="#323a41"/><circle cx="100" cy="100" r="60" fill="none" stroke="#22282d"/><circle cx="100" cy="100" r="30" fill="none" stroke="#22282d"/><line x1="100" y1="100" x2="100" y2="12" stroke="#f0a53a" stroke-opacity=".5" class="radar-sweep"/><path d="M100 92 l5 12 h-10z" fill="#e8eaec"/></svg><small class="mono">${wind?`${String(dir).padStart(3,'0')}°/${Math.round(wind)} kt`:'calm'}${rain>0.05?' · rain':''}</small></div>`; }
AFTER_RENDER.push(function flightExtras(){ const a=S.st&&S.st.active; if(S.view!=='flight'||!a||!a.started||S.showResult) return; const host=document.querySelector('.fo-host'); if(!host || document.querySelector('.rs-host')) return;
  const d=document.createElement('div'); d.className='rs-host'; host.before(d); d.innerHTML=routeStripHTML(a)+radarHTML(); });
SIM_TICK.push(function flightExtrasTick(){ const a=S.st&&S.st.active; const d=document.querySelector('.rs-host'); if(d && a) d.innerHTML=routeStripHTML(a)+radarHTML(); });

/* =====================================================================
   HOME
   ===================================================================== */
function homeHTML(){ const st=S.st; const F=fin(st); const w=st.w||{}; const props=(typeof PROPS!=='undefined'?PROPS:[]).filter(p=>w.props&&w.props[p.id]);
  const H={bunk:'A cot behind the parts shelves. Dez snores.', room:'A rented room above a bakery. It always smells of bread.', flat:'An apartment with a balcony over the harbor.', house:'A house of your own. The neighbors think you fly for an airline.', villa:'A villa. The pool is the only thing that\'s quiet.'};
  const lines=[H[F.housing]||H.bunk].concat(props.map(p=>p.home));
  const c=crime(st); if(c.dirty>20000) lines.push('There is a gym bag of cash under the bed. You should do something about that.');
  if(st._loanCollected && st.day-st._loanCollected<7) lines.push('The dent in the hangar door is still there.');
  return `<section class="panel home-strip"><p class="label">Home</p><p>${lines.map(esc).join(' ')}</p></section>`; }

/* =====================================================================
   THE CASE BOARD
   ===================================================================== */
function caseBoardHTML(){ const st=S.st, c=crime(st); if(!c.on) return ''; const F=c.flags||{}; const done=st.story.done||{}; const pins=[];
  const pin=(t,sub,hot)=>pins.push(`<li class="${hot?'hot':''}"><b>${esc(t)}</b><span>${esc(sub)}</span></li>`);
  pin(st.pilot.name, `Pilot. ${fmtH(st.minutes)} logged.`, c.heat>=60);
  if(done.CR4) pin('Mateo Castillo','Seen boarding your aircraft in St. Martin.');
  if(done.CR5) pin('N505HT','Vision Jet, Hartwell Reef Trust. Flies at odd hours.');
  if(done.CR10) pin('N88MC','Citation CJ4. Paid in cash.');
  if(done.CR12) pin('Desmond Richardson','In custody. Not talking.', true);
  if(done.CR15) pin('Caribe Cargo','Your airline. Shares a lawyer with Castillo.');
  for(const k in (c.hot||{})) pin(k, 'Searched here recently.', true);
  if(F.ticoRan) pin('Tico Alvarez','Disappeared. Last seen with you.');
  if(c.laundered>50000 || (st.w&&st.w.props&&Object.keys(st.w.props).length)) pin('Your businesses','Too much cash for a beach bar.');
  const level = c.heat>=80?'They are close.':c.heat>=60?'Reyes has a file with your name on it.':c.heat>=30?'A few photos. Nothing that holds up.':'One blurry photo of a tail number.';
  return `<section class="panel case-board"><div class="section-title"><h2>What they have on you</h2><span class="small muted">Heat ${c.heat}</span></div><p class="small muted">${esc(level)}</p><ul class="cb-pins">${pins.slice(0, Math.max(2, Math.ceil(pins.length*c.heat/70))).join('')}</ul></section>`; }

AFTER_RENDER.push(function storyExtras(){ if(S.view!=='story'||!S.st) return; const main=document.querySelector('main'); if(!main || main.querySelector('.home-strip')) return;
  const hero=main.querySelector('.story-card'); const d=document.createElement('div'); d.className='stack'; d.innerHTML=homeHTML()+caseBoardHTML();
  if(hero && hero.nextElementSibling) hero.nextElementSibling.after(d); else main.appendChild(d); ambSync(); });
AFTER_RENDER.push(function ambience(){ ambSync(); });

/* =====================================================================
   KEYBOARD: 1–4 answer what's on screen
   ===================================================================== */
document.addEventListener('keydown', e=>{ if(e.ctrlKey||e.metaKey||e.altKey) return; const t=e.target; if(t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return; const n=Number(e.key); if(!(n>=1&&n<=4)) return;
  const scope = document.querySelector('.beat .bt-o') || document.querySelector('.tw-sheet .ph-opts') || document.querySelector('.choice-btns'); if(!scope) return;
  const b=scope.querySelectorAll('button')[n-1]; if(b){ e.preventDefault(); e.stopPropagation(); twSfx('switch'); b.click(); } }, true);
AFTER_RENDER.push(function keyHints(){ document.querySelectorAll('.choice-btns button, .beat .bt-o button').forEach((b,i)=>{ if(!b.querySelector('kbd')) b.insertAdjacentHTML('afterbegin',`<kbd class="kh">${(i%4)+1}</kbd>`); }); });
new MutationObserver(()=>{ document.querySelectorAll('.beat .bt-o button, .ph-opts button').forEach(b=>{ if(b.querySelector('kbd')) return; const i=[...b.parentElement.children].indexOf(b); b.insertAdjacentHTML('afterbegin',`<kbd class="kh">${i+1}</kbd>`); }); }).observe(document.body,{childList:true,subtree:true});

/* =====================================================================
   BIG SCREEN (second monitor next to MSFS)
   ===================================================================== */
function bigOn(){ return /[?&#]big\b/.test(location.search+location.hash) || !!(S.st&&S.st.ui&&S.st.ui.big); }
AFTER_RENDER.push(function bigScreen(){ document.documentElement.classList.toggle('bigscreen', bigOn()); });

/* =====================================================================
   VOICED EMPTY STATES
   ===================================================================== */
const EMPTY_VOICE = [
  [/^None yet\. Your first flight adds one\.$/, `"Empty logbook. That's fixable," says Mari.`],
  [/^Nothing yet this session\.$/, `"Quiet day, rookie. Enjoy it," says Dez.`],
  [/^No history yet\.$/, `"Money comes, money goes. Mostly goes," says Mari.`],
  [/^Nobody knows you anywhere yet\.$/, `"Fly enough and they'll know your tail number before your name," says Dez.`],
  [/^No messages\. Quiet days are allowed\.$/, `No messages. Dez says no news is good news. Dez is often wrong.`],
];
AFTER_RENDER.push(function voicedEmpty(){ document.querySelectorAll('main p.muted, main p.small, .tw-sheet p.muted').forEach(p=>{ if(p.dataset.v) return; const t=p.textContent.trim(); const m=EMPTY_VOICE.find(([r])=>r.test(t)); if(m){ p.textContent=m[1]; p.dataset.v=1; } }); });

/* =====================================================================
   SETTINGS: ambience and big screen
   ===================================================================== */
AFTER_RENDER.push(function uiSettings(){ if(S.view!=='hangar' || S.hangarTab!=='settings' || !S.st) return; const box=document.querySelector('main'); if(!box || box.querySelector('.ui3-set')) return;
  const u=S.st.ui=S.st.ui||{}; const sec=document.createElement('section'); sec.className='panel ui3-set';
  sec.innerHTML=`<h3>Atmosphere and screens</h3><label class="row" style="gap:8px"><input type="checkbox" data-act="ui-amb" ${u.amb?'checked':''}> Ramp ambience on the ground pages (wind, distant engines)</label><label class="row" style="gap:8px;margin-top:6px"><input type="checkbox" data-act="ui-big" ${u.big?'checked':''}> Big-screen flight display, for a second monitor next to MSFS</label>`;
  const first=box.querySelector('section.panel'); if(first) first.after(sec); else box.appendChild(sec); });
document.addEventListener('change', e=>{ const i=e.target.closest('[data-act="ui-amb"],[data-act="ui-big"]'); if(!i||!S.st) return; const u=S.st.ui=S.st.ui||{}; if(i.dataset.act==='ui-amb') u.amb=i.checked; else u.big=i.checked; save(); ambSync(); document.documentElement.classList.toggle('bigscreen', bigOn()); });

/* the result stamp */
AFTER_RENDER.push(function stampSound(){ if(S.showResult && !S._stamped){ S._stamped=true; setTimeout(()=>twSfx('stamp'), 500); } if(!S.showResult) S._stamped=false; });

/* the latest unread text goes to the in-sim panel and the phone companion */
function phoneLatest(){ try{ const w=S.st&&S.st.w; const m=w&&w.phone&&w.phone.msgs.find(x=>!x.read); return m?{who:m.fromName||PH_WHO[m.from], text:m.text}:null; }catch(_){ return null; } }

(function(){ const s=document.createElement('style'); s.textContent=`
.dispatch .dsp-grid{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:24px}
.dispatch h3{font-size:14px;color:var(--muted);font-weight:500;margin:0 0 6px}
.dsp-notam{list-style:none;padding:0;margin:0;font-family:var(--f-mono);font-size:12.5px}.dsp-notam li{padding:7px 0;border-top:1px solid var(--line)}.dsp-notam li:first-child{border-top:0}
.rs-host{display:flex;gap:16px;align-items:center;margin:8px 0}
.rs{flex:1;display:flex;align-items:center;gap:12px;border:1px solid var(--line);padding:10px 14px;background:var(--surface)}
.rs-line{position:relative;flex:1;height:2px;background:var(--line-2)}.rs-line i{position:absolute;left:0;top:0;height:100%;background:var(--amb)}
.rs-plane{position:absolute;top:50%;width:18px;height:18px;transform:translate(-50%,-50%);fill:var(--amb)}
.radar{width:120px;flex:none;text-align:center}.radar svg{width:120px;height:120px;background:#06080a;border:1px solid var(--line)}.radar small{color:var(--muted)}
.radar-sweep{transform-origin:100px 100px;animation:sweep 4s linear infinite}@keyframes sweep{to{transform:rotate(360deg)}}
.home-strip p:last-child{margin:4px 0 0;font-size:15px}
.case-board{background:#14110d!important;border-color:#3a2f22!important}
.cb-pins{list-style:none;padding:0;margin:12px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.cb-pins li{background:#ece6da;color:#1b1712;padding:10px 12px;transform:rotate(-.6deg);display:flex;flex-direction:column;gap:3px;font-size:13px;position:relative}
.cb-pins li:nth-child(2n){transform:rotate(.8deg)}.cb-pins li::before{content:"";position:absolute;top:-4px;left:50%;width:8px;height:8px;background:#c23a2b;border-radius:50%!important}
.cb-pins li b{font-family:var(--f-mono);font-size:12px}.cb-pins li.hot{outline:2px solid #c23a2b}
kbd.kh{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-right:8px;font:500 11px/1 var(--f-mono);border:1px solid var(--line-2);color:var(--muted);background:transparent}
html.bigscreen body.flying main{max-width:none!important}
html.bigscreen body.flying .fo-chip,html.bigscreen body.flying .rs{font-size:22px}
html.bigscreen body.flying .rs b{font-size:28px}html.bigscreen .radar,html.bigscreen .radar svg{width:200px;height:200px}
html.bigscreen body.flying .beat .bt-t{font-size:26px}
@media (max-width:900px){ .dispatch .dsp-grid{grid-template-columns:1fr} .rs-host{flex-direction:column;align-items:stretch} .radar{display:none} }
`; document.head.appendChild(s); })();

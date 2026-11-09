/* ===================== QUICK WINS BEFORE TESTING ===================== */
const _qkSim = renderSimBits;
renderSimBits = function(){ const a=S.st&&S.st.active; const was=a&&a.started; _qkSim(); try{ if(a && !was && a.started && S.view!=='flight') go('flight'); }catch(_){} };

/* 2 + 3 + 5. copilot safety calls: too fast, flaps too fast, sim rate on approach, fuel */
const VWARN = { ga:145, stol:120, amph:120, hp:190, bush:145, twin:190, turbo:240, jet:290, regional:250, airliner:320, widebody:320 };
const VFLAP = { ga:100, stol:85, amph:85, hp:120, bush:90, twin:130, turbo:150, jet:180, regional:170, airliner:200, widebody:200 };
const SAFE = { id:null, t:{} };
function safeSay(key, text, every){ const now=Date.now(); if(SAFE.t[key] && now-SAFE.t[key] < (every||60000)) return; if(SAFE.any && now-SAFE.any < 6000) return; SAFE.any=now; SAFE.t[key]=now; try{ copilotSay(text, key+':'+now); }catch(_){} }
const _qkSim2 = renderSimBits;
renderSimBits = function(){ _qkSim2(); try{ const a=S.st&&S.st.active, s=S.sim; if(!simRelevant(a) || !s.motion || s.motion.onGround) return;
    if(SAFE.id!==a.job.id){ SAFE.id=a.job.id; SAFE.t={}; }
    const cls=AC[a.job.ac].cls, ias=s.motion.ias, x=s.ext||{};
    if(ias > (VWARN[cls]||200)) safeSay('fast', `Speed! ${ias} knots. Power back.`, 20000);
    if(x.flaps && x.flaps.handle>0 && ias > (VFLAP[cls]||110)) safeSay('flapfast', `Too fast for flaps. Slow down before you extend them.`, 20000);
    if(x.simRate>1 && s.motion.vsFpm < -300 && s.position && s.position.aglFt < 5000) safeSay('rate', `Sim rate back to one times for the descent.`, 45000);
    // fuel: enough for the rest of the trip plus the reserve?
    const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; const p=plan(a.job); const ac=AC[a.job.ac];
    if(s.systems && s.systems.fuelLb!=null && ac.burn>0 && s.position){ const togo=a.job.local?0:distNm({lat:s.position.lat,lon:s.position.lon},dest); const needLb=(togo/Math.max(60,s.motion.gs||ac.cruise)*60 + p.reserveMin*0.75)/60*ac.burn; if(s.systems.fuelLb < needLb) safeSay('fuel', `Fuel check. We're getting close to the reserve. Consider the nearest airport.`, 300000); }
  }catch(_){} };

/* 4. approach card: the landing runway, wind and approach speed, big, once you're close */
function approachCard(a){ const s=S.sim; if(!s||!s.position||S.simState!=='live') return ''; const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; const d=distNm({lat:s.position.lat,lon:s.position.lon},dest); if(d>15 || (s.motion&&s.motion.onGround)) return '';
  const code=a.job.local?a.job.from:a.job.to; const w=(s.ext&&s.ext.weather)||null; const wx = w ? Object.assign({}, a.job.wx, {dir:w.windDir, spd:w.windKt, gust:0}) : a.job.wx; let r=null; try{ r=rwyAnalysis(code, wx, a.job.ac); }catch(_){}
  const vapp=(String(AC[a.job.ac].v||'').match(/(?:Approach|Vref|Vapp)\s*~?(\d+)/)||[])[1];
  return `<section class="appr-card"><div><span>Landing</span><b class="mono">${r&&!r.water?esc(r.rw):'into wind'}</b></div><div><span>Wind</span><b class="mono">${pad3(wx.dir)}°/${wx.spd}</b><small>${r&&!r.water?`${Math.round(Math.max(0,r.head))} head · ${Math.round(r.xw)} cross`:''}</small></div>${vapp?`<div><span>Approach</span><b class="mono">${vapp} kt</b><small>+5 if gusty</small></div>`:''}<div><span>Distance</span><b class="mono">${d.toFixed(1)} nm</b></div></section>`; }
const _qkIf = inflightView;
inflightView = function(){ const h=_qkIf(); const a=S.st&&S.st.active; if(!a) return h; const c=approachCard(a); return c ? h.replace(/(<section class="if-head">[\s\S]*?<\/section>)/, m=>m+c) : h; };
const _qkSim3 = renderSimBits;
renderSimBits = function(){ _qkSim3(); try{ const a=S.st&&S.st.active; if(!a||!a.started||S.view!=='flight') return; const want=!!approachCard(a); const has=!!document.querySelector('.appr-card'); if(want!==has){ S.keepScroll=true; render(); } else if(has){ const t=tpl(approachCard(a)); document.querySelector('.appr-card').replaceWith(t.content.firstElementChild); } }catch(_){} };

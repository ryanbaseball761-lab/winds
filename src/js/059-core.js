/* ===================== QUICK WINS BEFORE TESTING ===================== */

/* 2 + 3 + 5. copilot safety calls: too fast, flaps too fast, sim rate on approach, fuel */
const VWARN = { ga:145, stol:120, amph:120, hp:190, bush:145, twin:190, turbo:240, jet:290, regional:250, airliner:320, widebody:320 };
const VFLAP = { ga:100, stol:85, amph:85, hp:120, bush:90, twin:130, turbo:150, jet:180, regional:170, airliner:200, widebody:200 };
const SAFE = { id:null, t:{} };

/* 4. approach card: the landing runway, wind and approach speed, big, once you're close */
function approachCardBase(a){ const s=S.sim; if(!s||!s.position||S.simState!=='live') return ''; const dest=a.job.local?AP[a.job.from]:AP[a.job.to]; const d=distNm({lat:s.position.lat,lon:s.position.lon},dest); if(d>15 || (s.motion&&s.motion.onGround)) return '';
  const code=a.job.local?a.job.from:a.job.to; const w=(s.ext&&s.ext.weather)||null; const wx = w ? Object.assign({}, a.job.wx, {dir:w.windDir, spd:w.windKt, gust:0}) : a.job.wx; let r=null; try{ r=rwyAnalysis(code, wx, a.job.ac); }catch(_){}
  const vapp=(String(AC[a.job.ac].v||'').match(/(?:Approach|Vref|Vapp)\s*~?(\d+)/)||[])[1];
  return `<section class="appr-card"><div><span>Landing</span><b class="mono">${r&&!r.water?esc(r.rw):'into wind'}</b></div><div><span>Wind</span><b class="mono">${pad3(wx.dir)}°/${wx.spd}</b><small>${r&&!r.water?`${Math.round(Math.max(0,r.head))} head · ${Math.round(r.xw)} cross`:''}</small></div>${vapp?`<div><span>Approach</span><b class="mono">${vapp} kt</b><small>+5 if gusty</small></div>`:''}<div><span>Distance</span><b class="mono">${d.toFixed(1)} nm</b></div></section>`; }

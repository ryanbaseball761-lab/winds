/* ===================== LIVE MAP, FLIGHT REPLAY, AIRCRAFT FROM SIM, REPORTS, VOICES, REAL-WORLD EVENTS ===================== */
const TW_VERSION = '0.55.0';

/* ---------- live map ---------- */
function mapProj(){ const v = MAPV[S.mapZoom||'east']; const W=1000, H=Math.round(1000*(v.lat[1]-v.lat[0])/(v.lon[1]-v.lon[0])*1.05);
  return { W, H, X: lon => (lon - v.lon[0])/(v.lon[1]-v.lon[0])*W, Y: lat => H - (lat - v.lat[0])/(v.lat[1]-v.lat[0])*H }; }
function liveFlightInfo(){
  const st=S.st, a=st&&st.active, s=S.sim; if(!a || !s || S.simState!=='live' || !s.position) return null;
  const job=a.job; const pos={lat:s.position.lat, lon:s.position.lon}; const dest = job.local ? AP[job.from] : AP[job.to];
  const togo = distNm(pos, dest); const gs = Math.max(s.motion.gs||0, 1); const eta = s.motion.onGround ? null : Math.round(togo/gs*60);
  const rec = simRecFor(a); return {job, pos, dest, togo, eta, gs:s.motion.gs, alt:s.position.altFt, hdg:s.position.hdg, track: rec && rec.track || []};
}

/* ---------- replay: keep the path and approach with the result ---------- */
function replaySvgPath(track, w, h){
  const lats=track.map(p=>p[0]), lons=track.map(p=>p[1]); let a0=Math.min(...lats), a1=Math.max(...lats), o0=Math.min(...lons), o1=Math.max(...lons);
  const pad=0.02; a0-=pad; a1+=pad; o0-=pad; o1+=pad; const k=Math.cos((a0+a1)/2*Math.PI/180);
  const sx=w/((o1-o0)*k||1), sy=h/((a1-a0)||1), sc=Math.min(sx,sy); const ox=(w-(o1-o0)*k*sc)/2, oy=(h-(a1-a0)*sc)/2;
  return track.map(p=>[ox+(p[1]-o0)*k*sc, h-(oy+(p[0]-a0)*sc)]);
}
function replaySectionBase(st){
  const R=st.last && st.last.replay; if(!R || (!(R.track&&R.track.length>1) && !R.approach)) return '';
  let pathSvg=''; if(R.track && R.track.length>1){ const pts=replaySvgPath(R.track, 520, 300); const maxAlt=Math.max(...R.track.map(p=>p[2]),1);
    pathSvg = `<svg viewBox="0 0 520 300" class="replay-map" role="img" aria-label="Flown path">${pts.slice(1).map((p,i)=>{ const q=pts[i]; const t=R.track[i+1][2]/maxAlt; return `<line x1="${q[0].toFixed(1)}" y1="${q[1].toFixed(1)}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="hsl(${(170-t*150).toFixed(0)} 70% 50%)" stroke-width="4" stroke-linecap="round"/>`; }).join('')}<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="7" class="r-start"/><circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="7" class="r-end"/></svg><p class="tiny muted">Color shows altitude: teal low, orange high. Max ${maxAlt.toLocaleString()} ft.</p>`; }
  let apSvg=''; if(R.approach && R.approach.length>5){ const A=R.approach; const W=520,H=220; const t0=A[0][0], t1=0; const maxAgl=Math.max(...A.map(x=>x[1]),100);
    const X=t=>(t-t0)/((t1-t0)||1)*(W-40)+30, Y=v=>H-24-(v/maxAgl)*(H-40);
    const line=A.map((x,i)=>`${i?'L':'M'}${X(x[0]).toFixed(1)} ${Y(x[1]).toFixed(1)}`).join(' ');
    const last=A.slice(-12); const avgVs=Math.round(last.reduce((s,x)=>s+x[3],0)/last.length); const ias=A[A.length-1][2];
    apSvg=`<svg viewBox="0 0 ${W} ${H}" class="replay-ap" role="img" aria-label="Approach profile: height above ground over the last two minutes"><line x1="30" y1="${H-24}" x2="${W-10}" y2="${H-24}" class="ax"/><text x="30" y="${H-6}" class="axl">${A[0][0]} s</text><text x="${W-40}" y="${H-6}" class="axl">touchdown</text><text x="34" y="${Y(maxAgl)-4}" class="axl">${maxAgl} ft</text><path d="${line}" class="apl"/>${A.filter((_,i)=>i%6===0).map(x=>`<circle cx="${X(x[0]).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r="3" class="${x[3]<-1000?'bad':x[3]<-700?'warn':'ok'}"><title>${x[1]} ft · ${x[2]} kt · ${x[3]} fpm</title></circle>`).join('')}</svg>
      <p class="small">Final 12 seconds: average <b>${avgVs} fpm</b>, crossing at <b>${ias} kt</b>. ${R.td?`Touchdown <b>${R.td.fpm} fpm</b>, ${R.td.g} G.`:''} Dots turn orange past 700 fpm down and red past 1,000.</p>`; }
  return `<section class="panel stack replay"><div><p class="label">Flight replay</p><h3>Your path and approach</h3></div><div class="replay-grid">${pathSvg?`<div>${pathSvg}</div>`:''}${apSvg?`<div>${apSvg}</div>`:''}</div></section>`;
}

/* ---------- add your aircraft straight from MSFS ---------- */
function specGuess(sp){
  if(!sp) return null; const T=sp.engineType, n=sp.engines||1, mg=sp.maxGrossLb||0;
  let cls = T==='jet' ? (mg>60000?'airliner':mg>30000?'regional':'jet') : T==='turboprop' ? 'turbo' : sp.floats ? 'amph' : n>=2 ? 'twin' : (sp.retractable || sp.cruiseKt>150) ? 'hp' : 'ga';
  const tpl=CLS_TEMPLATE[cls]; const useful=Math.max(0, mg - sp.emptyLb);
  const pax = Math.max(1, Math.min(cls==='airliner'?220:19, Math.round((useful - sp.fuelGal*6.0*0.6 - 190)/200)));
  const fuelLb = sp.fuelGal * (T==='piston'?6:6.7); const range = Math.round(Math.min(tpl.range*2, Math.max(150, fuelLb/(tpl.burn||100) * (sp.cruiseKt||tpl.cruise) * 0.8)));
  return { cls, pax: isFinite(pax)?pax:tpl.pax, cruise: sp.cruiseKt||tpl.cruise, range, vapp: sp.vs0Kt ? Math.round(sp.vs0Kt*1.3) : null };
}

/* ---------- problem reports ---------- */
function errLog(){ try{ return JSON.parse(localStorage.getItem('tw.errors')||'[]'); }catch(e){ return []; } }
function logErrBase(msg){ try{ const a=errLog(); a.push({t:new Date().toISOString(), msg:String(msg).slice(0,400), view:S.view}); localStorage.setItem('tw.errors', JSON.stringify(a.slice(-30))); }catch(e){} }
window.addEventListener('error', e=>logErr(`${e.message} @ ${(e.filename||'').split('/').pop()}:${e.lineno}`));
window.addEventListener('unhandledrejection', e=>logErr(`Promise: ${e.reason && (e.reason.message||e.reason.code||e.reason)}`));
function buildReport(note){ const st=S.st||{}; return JSON.stringify({ app:'Trade Winds', version:TW_VERSION, standalone:!!window.TW_STANDALONE, at:new Date().toISOString(), note,
  sim:{state:S.simState, bridge:S.sim&&S.sim.version, connected:S.sim&&S.sim.connected, aircraft:S.sim&&S.sim.aircraft&&S.sim.aircraft.title},
  career:{day:st.day, loc:st.loc, flights:st.flights, minutes:st.minutes, difficulty:st.difficulty, active:st.active?{title:st.active.job.title, ac:st.active.job.ac, from:st.active.job.from, to:st.active.job.to}:null},
  errors:errLog(), screen:`${innerWidth}x${innerHeight}`, ua:navigator.userAgent }, null, 2); }
document.addEventListener('click', async e=>{
  const b=e.target.closest('[data-act="bug-save"],[data-act="bug-copy"]'); if(!b) return; const note=(document.getElementById('bug-note')||{}).value||''; const rep=buildReport(note);
  if(b.dataset.act==='bug-copy'){ try{ await navigator.clipboard.writeText(rep); toast('Report copied.'); }catch(_){ toast('Copy not allowed here. Use Save.'); } return; }
  try{ const dl=window.claude && await claude.use('downloads'); if(dl){ await dl.save({filename:`TradeWinds-report-${Date.now()}.json`, data:rep}); toast('Report saved. Thanks!'); return; } }catch(err){ if(err&&err.code==='declined') return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([rep],{type:'application/json'})); a.download='TradeWinds-report.json'; a.click(); }catch(_){}
});

/* ---------- better voices: prefer natural voices, let the player pick ---------- */
function voicePref(role){ try{ return localStorage.getItem('tw.v.'+role)||''; }catch(e){ return ''; } }
function pickVoice(female, slot){
  const en=_voices.filter(v=>/^en/i.test(v.lang)); if(!en.length) return null;
  const want = voicePref(slot===1 && !female ? 'atc' : female ? 'female' : 'male'); if(want){ const v=_voices.find(x=>x.name===want); if(v) return v; }
  const nat = en.filter(v=>/natural|neural|online|premium|enhanced/i.test(v.name));
  const isF = v=>/female|zira|aria|jenny|samantha|susan|hazel|libby|sonia|natasha|michelle|karen|moira|tessa|serena|emma|ava|ana/i.test(v.name);
  const isM = v=>/(^|\W)(male|david|mark|guy|george|ryan|daniel|alex|fred|thomas|christopher|eric|james|william|brian|andrew)(\W|$)/i.test(v.name) && !/female/i.test(v.name);
  const pool = (nat.length?nat:en).filter(v=> female?isF(v):isM(v)); const fall = en.filter(v=> female?isF(v):isM(v));
  const list = pool.length?pool:fall.length?fall:en; return list[slot % list.length];
}
function voiceSettingsHTML(){
  if(!window.speechSynthesis) return ''; loadVoices(); const en=_voices.filter(v=>/^en/i.test(v.lang));
  const sel=(role,label)=>`<label class="field"><span>${label}</span><select data-voice-role="${role}"><option value="">Automatic</option>${en.map(v=>`<option ${voicePref(role)===v.name?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label>`;
  return `<section class="panel stack" style="max-width:760px"><h3>Voices</h3><p class="small muted">${en.length} English voices found on this computer. Voices marked "Natural" or "Online" sound the most human. Windows 11 users can add more in Settings → Time &amp; language → Speech.</p><div class="form-grid">${sel('female','Women (Mari, Vivienne…)')}${sel('male','Men (Abe, Dez…)')}${sel('atc','ATC and ground')}<label class="field"><span>Volume</span><input type="range" min="0.2" max="1" step="0.1" value="${voiceVol()}" data-voice-vol></label></div><div class="row"><button class="btn sm" data-act="voice-test">Test voices</button></div></section>`;
}
document.addEventListener('change', e=>{ const r=e.target.dataset && e.target.dataset.voiceRole; if(r){ try{ localStorage.setItem('tw.v.'+r, e.target.value); }catch(_){} } if(e.target.dataset && e.target.dataset.voiceVol!==undefined){ try{ localStorage.setItem('tw.vol', e.target.value); }catch(_){} } });
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="voice-test"]') || !window.speechSynthesis) return; loadVoices(); speechSynthesis.cancel();
  [[pickVoice(true,0),`This is Mari. Flaps up, Rookie.`],[pickVoice(false,0),`Abe here. Nice and stable.`],[pickVoice(false,1),`Coral Wing three seven one, cleared for takeoff runway one zero.`]].forEach(([v,t])=>{ const u=new SpeechSynthesisUtterance(t); if(v) u.voice=v; u.volume=voiceVol(); speechSynthesis.speak(u); }); });

/* ---------- real-world calendar: events happening around now ---------- */
function easter(y){ const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return new Date(y,mo-1,da); }
function realEvents(now=new Date()){
  const y=now.getFullYear(); const D=(m,d)=>new Date(y,m-1,d); const ash=new Date(easter(y)); ash.setDate(ash.getDate()-46);
  const ev=[
    {n:`Trinidad Carnival`, ap:['TTPP'], from:new Date(ash.getTime()-10*864e5), to:ash},
    {n:`St. Maarten Heineken Regatta season`, ap:['TNCM','TFFG'], from:D(2,25), to:D(3,10)},
    {n:`St. Barths Bucket regatta season`, ap:['TFFJ'], from:D(3,10), to:D(3,25)},
    {n:`Antigua Sailing Week season`, ap:['TAPA'], from:D(4,24), to:D(5,6)},
    {n:`St. Maarten Carnival season`, ap:['TNCM'], from:D(4,15), to:D(5,3)},
    {n:`Crop Over season in Barbados`, ap:['TBPB'], from:D(7,10), to:D(8,6)},
    {n:`Emancipation festivals in the Virgin Islands`, ap:['TUPJ','TIST'], from:D(7,25), to:D(8,8)},
    {n:`Holiday travel rush`, ap:['TNCM','TJSJ','TBPB','TAPA','MBPV','MYNN'], from:D(12,15), to:D(12,31)},
    {n:`Junkanoo in the Bahamas`, ap:['MYNN'], from:D(12,24), to:D(12,31)},
    {n:`New Year's travel`, ap:['TNCM','TJSJ','TBPB'], from:D(1,1), to:D(1,4)}];
  const t=now.getTime(); return ev.filter(e=>t>=e.from.getTime() && t<=e.to.getTime()+864e5);
}
let REAL_STORMS = [];
async function loadRealStorms(){ if(!window.twNative || !twNative.storms) return; try{ const r=await twNative.storms(); REAL_STORMS = (r||[]).filter(s=>s.lat>8 && s.lat<30 && s.lon<-55 && s.lon>-90); if(REAL_STORMS.length && S.st) render(); }catch(_){} }
setTimeout(loadRealStorms, 3000); setInterval(loadRealStorms, 30*60000);

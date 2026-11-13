/* ===================== THE BUTTER CUP: landing challenges at famous approaches ===================== */
const CUP = [
  {id:'maho', ap:'TNCM', n:`Maho Beach`, rw:'10', ac:'Cessna 172 or anything bigger', blurb:`Over the beach, over the fence, onto runway 10 while the crowd films you.`, setup:`MSFS: Sint Maarten (TNCM), start on a 3–5 nm final to runway 10.`, par:[90,160,260]},
  {id:'sbh', ap:'TFFJ', n:`St. Barth dive`, rw:'10', ac:'Cessna 172, Twin Otter or Caravan', blurb:`Over the Col de la Tourmente, a steep dive, and a full stop before the beach.`, setup:`MSFS: St. Barthélemy (TFFJ), approach to runway 10 over the ridge.`, par:[110,180,280]},
  {id:'saba', ap:'TNCS', n:`Saba: the shortest`, rw:'12', ac:'Twin Otter, CubCrafters or a 172 if you dare', blurb:`1,312 feet of runway with cliffs at both ends.`, setup:`MSFS: Saba (TNCS), short final to runway 12.`, par:[120,200,300]},
  {id:'axa', ap:'TQPF', n:`Anguilla crosswind`, rw:'10', ac:'Any light aircraft', blurb:`Set 15 knots of wind from the north and keep it on the centerline.`, setup:`MSFS: Anguilla (TQPF), runway 10, weather: wind 010° at 15 kt.`, par:[100,170,260]},
  {id:'bequia', ap:'TVSB', n:`Bequia over the water`, rw:'07', ac:'Any light aircraft', blurb:`The runway starts at the sea wall. Don't land short.`, setup:`MSFS: Bequia (TVSB), final to runway 07.`, par:[100,170,260]},
  {id:'teb', ap:'TNCM', n:`Jet into Juliana`, rw:'10', ac:'Vision Jet or Citation CJ4', blurb:`Bring a jet in over Maho without floating halfway down the runway.`, setup:`MSFS: Sint Maarten (TNCM) in the Vision Jet or CJ4, 5 nm final to runway 10.`, par:[120,200,320]}
];
const RIVALS = [{n:'Jack Calloway', k:'calloway', base:[95,150]},{n:'Kofi Richardson', k:null, base:[120,220]},{n:'Ana Reyes (Winair)', k:null, base:[80,140]},{n:'Captain Abe', k:'abe', base:[70,120]},{n:'Celeste Moreau', k:'celeste', base:[140,260]}];
VIEWS.push(['cup','Butter Cup']); NAV_GROUPS[0].push('cup');
NAV_ICON.cup = `<path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M10 17h4"/>`;
VIEW_META.cup = ['The Butter Cup','Landing challenges at the Caribbean\'s most famous approaches'];
function cupState(st){ st.cup = st.cup || {best:{}, tries:{}, cur:null, recId:null}; return st.cup; }
function medalFor(c, fpm, bounces){ if(bounces>1) return fpm<c.par[2]?'bronze':null; if(fpm<=c.par[0] && !bounces) return 'gold'; if(fpm<=c.par[1]) return 'silver'; if(fpm<=c.par[2]) return 'bronze'; return null; }
const MEDAL = {gold:['🥇','Gold'], silver:['🥈','Silver'], bronze:['🥉','Bronze']};
function rivalScores(cid){ const key=isoWeek()+cid; let h=hashStr(key); const R=rng(h); return RIVALS.map(r=>({n:r.n, fpm:Math.round(r.base[0]+R()*(r.base[1]-r.base[0]))})); }
function cupBoard(st, c){ const me=cupState(st).best[c.id]; const rows=rivalScores(c.id).concat(me?[{n:st.pilot.name+' (you)', fpm:me.fpm, me:true}]:[]).sort((a,b)=>a.fpm-b.fpm);
  return `<ol class="cup-board">${rows.map((r,i)=>`<li class="${r.me?'me':''}"><span>${i+1}</span><b>${esc(r.n)}</b><span class="mono">${r.fpm} fpm</span></li>`).join('')}</ol>`; }
async function startCup(id){
  const st=S.st, C=cupState(st); if(st.active){ toast('Finish or cancel your current job first.'); return; }
  if(!S.mcp || ['off','nobridge'].includes(S.simState)){ toast('Connect MSFS first: the Butter Cup scores your touchdown straight from the sim.'); return; }
  C.cur=id; C.recId=null; C.started=Date.now(); C.tries[id]=(C.tries[id]||0)+1; save(); render();
  if(S.mcp && S.simState!=='nobridge'){ try{ const r=await S.mcp.callTool(SIM_SERVER,'flight_recorder_reset',{label:'Butter Cup: '+id},{cache:false}); let p=r.payload; if(typeof p==='string'){ try{p=JSON.parse(p);}catch(_){} } if(p&&p.recorderId){ C.recId=p.recorderId; save(); } }catch(_){} }
}
function cupTick(){
  const st=S.st; if(!st) return; const C=cupState(st); if(!C.cur || !C.recId) return; const s=S.sim; const r=s&&s.recorder; if(!r || r.id!==C.recId || !r.touchdown) return;
  const c=CUP.find(x=>x.id===C.cur); const near=nearestAirport(r.touchdown.lat, r.touchdown.lon); const fpm=r.touchdown.fpm, b=r.bounces||0;
  C.cur=null; C.recId=null;
  if(near.code!==c.ap || near.d>3){ toast(`That landing was at ${near.code}, not ${c.ap}. Try again.`); save(); render(); return; }
  const medal=medalFor(c,fpm,b); const prev=C.best[c.id]; const better=!prev || fpm<prev.fpm;
  if(better) C.best[c.id]={fpm, g:r.touchdown.g, bounces:b, medal, day:st.day};
  const firstMedal = medal && (!prev || !prev.medal || ['bronze','silver','gold'].indexOf(medal)>['bronze','silver','gold'].indexOf(prev.medal));
  if(firstMedal){ const cash={gold:600,silver:350,bronze:200}[medal]; txn(st,cash,'Gifts & windfalls',`Butter Cup ${MEDAL[medal][1]}: ${c.n}`); addJournal(st,`Butter Cup: ${MEDAL[medal][1]} at ${c.n}`,`${fpm} fpm${b?`, ${b} bounce${b>1?'s':''}`:''}. The ramp at ${AP[c.ap].isl} saw it.`,['calloway'],'milestone'); }
  S.cupResult={id:c.id, fpm, g:r.touchdown.g, b, medal, better, firstMedal}; save(); S.view='cup'; render();
  try{ if(typeof chime==='function') chime(true); if(window.speechSynthesis && voiceOn()){ const u=new SpeechSynthesisUtterance(medal?`${MEDAL[medal][1]} medal. ${fpm} feet per minute.`:`${fpm} feet per minute. No medal this time.`); u.volume=voiceVol(); speechSynthesis.speak(u); } }catch(_){}
}
function cupView(){
  const st=S.st, C=cupState(st); const R=S.cupResult; const cur=C.cur?CUP.find(x=>x.id===C.cur):null;
  const golds=Object.values(C.best).filter(b=>b.medal==='gold').length;
  return `<main class="wrap stack fade">
    <section class="cup-hero"><div><p class="label" style="color:inherit;opacity:.8">The Butter Cup</p><h1>How soft can you land?</h1><p>Six famous Caribbean approaches. Set one up in MSFS, press Start, and land. Trade Winds reads your touchdown straight from the sim and ranks you against the islands' best pilots. The board resets every week.</p></div><div class="cup-medals"><b>${golds}</b><span>gold medals</span></div></section>
    ${R?(()=>{ const c=CUP.find(x=>x.id===R.id); return `<section class="panel cup-res ${R.medal||'none'}"><div class="cup-big">${R.medal?MEDAL[R.medal][0]:'✈'}</div><div><p class="label">${esc(c.n)}</p><h2>${R.fpm} fpm${R.medal?` · ${MEDAL[R.medal][1]}`:''}</h2><p>${R.g} G${R.b?` · ${R.b} bounce${R.b>1?'s':''}`:' · no bounces'}${R.better?' · personal best!':''}${R.firstMedal?' · medal bonus paid':''}</p></div><button class="btn sm ghost" data-act="cup-dismiss">OK</button></section>`; })():''}
    ${cur?`<section class="panel stack cup-live"><div class="row between"><div><p class="label">Attempt in progress</p><h3>${esc(cur.n)} · ${esc(cur.ap)} runway ${esc(cur.rw)}</h3></div><button class="btn sm ghost" data-act="cup-stop">Stop</button></div><p>${esc(cur.setup)}</p><p class="small muted">${C.recId?(S.simState==='live'?'● Recording. Land when ready.':'Waiting for MSFS…'):'MSFS isn\'t connected, so this attempt can\'t be scored. Connect the sim and start again.'}</p></section>`:''}
    <div class="cup-grid">${CUP.map(c=>{ const b=C.best[c.id]; return `<article class="cup-card"><div class="cup-art">${islandArt(c.ap, 1000, 600, 130, c.id==='teb'?'SF50':'C172')}${b&&b.medal?`<span class="cup-medal">${MEDAL[b.medal][0]}</span>`:''}</div>
      <div class="stack" style="gap:8px;padding:14px"><div class="row between"><h3>${esc(c.n)}</h3><span class="chip">${esc(c.ap)} ${esc(c.rw)}</span></div><p class="small">${esc(c.blurb)}</p><p class="tiny muted">${esc(c.ac)} · Gold under ${c.par[0]} fpm with no bounce, silver under ${c.par[1]}, bronze under ${c.par[2]}.</p>
      ${b?`<p class="small"><b>Your best: ${b.fpm} fpm</b>${b.medal?` ${MEDAL[b.medal][0]}`:''}</p>`:''}
      <details><summary class="small">This week's board</summary>${cupBoard(st,c)}</details>
      <button class="btn ${C.cur===c.id?'':'primary'} sm" data-act="cup-start" data-id="${c.id}" ${C.cur&&C.cur!==c.id?'disabled':''}>${C.cur===c.id?'In progress':b?'Try again':'Start attempt'}</button></div></article>`; }).join('')}</div>
  </main>`;
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="cup-start"],[data-act="cup-stop"],[data-act="cup-dismiss"]'); if(!b || !S.st) return; const C=cupState(S.st);
  if(b.dataset.act==='cup-start') startCup(b.dataset.id);
  else if(b.dataset.act==='cup-stop'){ C.cur=null; C.recId=null; save(); render(); }
  else { S.cupResult=null; render(); }
});

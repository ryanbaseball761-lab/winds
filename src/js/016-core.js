/* ===================== 3. YOUR PLANE, YOUR CAREER ===================== */
const CLS_TEMPLATE = {
  ga:   {pax:3, useful:900,  cruise:120, burn:50,  fuel:'avgas', range:600,  rwy:1800, xw:15, op:180,  req:['PPL']},
  stol: {pax:2, useful:700,  cruise:100, burn:40,  fuel:'avgas', range:500,  rwy:700,  xw:15, op:200,  req:['PPL']},
  amph: {pax:2, useful:700,  cruise:95,  burn:45,  fuel:'avgas', range:400,  rwy:1500, xw:12, op:250,  req:['PPL','SEA'], water:true},
  bush: {pax:6, useful:2000, cruise:130, burn:120, fuel:'avgas', range:600,  rwy:1500, xw:15, op:400,  req:['COMM']},
  hp:   {pax:5, useful:1300, cruise:170, burn:90,  fuel:'avgas', range:900,  rwy:2500, xw:17, op:300,  req:['COMM']},
  twin: {pax:5, useful:1500, cruise:180, burn:120, fuel:'avgas', range:1000, rwy:2800, xw:20, op:450,  req:['COMM','ME']},
  turbo:{pax:8, useful:3000, cruise:260, burn:450, fuel:'jeta',  range:1500, rwy:3000, xw:25, op:800,  req:['TURB','IR']},
  jet:  {pax:6, useful:4000, cruise:400, burn:900, fuel:'jeta',  range:1800, rwy:4000, xw:25, op:1600, req:['JET']},
  regional:{pax:70, useful:15000, cruise:300, burn:1500, fuel:'jeta', range:1200, rwy:4500, xw:30, op:3000, req:['ATP']},
  airliner:{pax:160,useful:40000, cruise:450, burn:5400, fuel:'jeta', range:3000, rwy:6500, xw:33, op:6000, req:['ATP']}
};
function registerCustomAc(st){
  st.customAc = st.customAc || {};
  for(const id in st.customAc){ AC[id] = Object.assign({}, st.customAc[id]); if(st.hangar && st.hangar[id]===undefined) st.hangar[id]=true; }
}
function loadedAircraft(){
  const t = S.sim && S.simState==='live' && S.sim.aircraft ? S.sim.aircraft.title : '';
  if(!t) return {title:'', id:null};
  const cust = S.st && S.st.customAc ? Object.keys(S.st.customAc).find(k=>S.st.customAc[k].simTitle===t) : null;
  if(cust) return {title:t, id:cust};
  const known = Object.keys(AC).find(k=>!AC[k].custom && acMatches(t,k));
  return {title:t, id:known||null};
}
/* jobs built around the plane you have loaded */
function makeJobFor(st, acId){
  const orig = eligibleAircraft; let job=null;
  try{ eligibleAircraft = ()=>[acId];
    const arches = ARCH.filter(a=>a.w>0 && a.cls.includes(AC[acId].cls) && (!a.need || hasRating(st,a.need)));
    for(let i=0;i<8 && !job && arches.length;i++){ job = makeJob(st, pick(arches), false); }
  } finally { eligibleAircraft = orig; }
  if(job) job.loaded = true; return job;
}
function loadedBanner(st){
  const L = loadedAircraft(); if(!L.title) return '';
  if(!L.id) return `<div class="notice row between" style="gap:10px"><span><b>MSFS has “${esc(L.title)}” loaded.</b> It isn't in your career yet.</span><button class="btn sm primary" data-act="nav" data-v="hangar">Add it in the Hangar</button></div>`;
  const a=AC[L.id]; const ok=canFly(st,L.id);
  return `<div class="notice row between" style="gap:10px"><span><b>Loaded in MSFS: ${esc(a.n)}.</b> ${ok?`Jobs for it are at the top of the board.`:`You'll need ${a.req.filter(r=>!st.ratings[r]).map(r=>RATINGS[r].n).join(' + ')} to fly it for pay.`}</span>${ok?'<span class="chip sea">Your plane</span>':''}</div>`;
}
const _myBoard = boardView;
boardView = function(){ const h=_myBoard(); return h.replace('<section><div class="section-title"><h2>Jobs at', loadedBanner(S.st)+'<section><div class="section-title"><h2>Jobs at'); };

/* Hangar: bring your own aircraft */
function byoSection(st){
  const L = loadedAircraft(); const list = Object.keys(st.customAc||{});
  const pre = L.title && !L.id ? L.title : '';
  const clsOpts = Object.keys(CLS_TEMPLATE).map(k=>`<option value="${k}">${esc(CLS[k]?CLS[k].name:k)}</option>`).join('');
  return `<section class="panel stack byo"><div class="row between"><div><p class="label">Your plane, your career</p><h2>Bring your own aircraft</h2></div>${L.title?`<span class="chip sea">MSFS: ${esc(L.title)}</span>`:''}</div>
    <p class="small muted">Fly add-ons like Fenix, PMDG, Black Square or anything from the Marketplace. Add the plane once and the job board builds work around it. Load it in MSFS with the Bridge running and the name fills in for you.</p>
    <form id="byo-form" class="form-grid">
      <label class="field"><span>Name</span><input id="byo-n" required maxlength="60" value="${esc(pre)}" placeholder="e.g. Black Square Baron"></label>
      <label class="field"><span>Type</span><select id="byo-cls">${clsOpts}</select></label>
      <label class="field"><span>Passenger seats</span><input id="byo-pax" type="number" min="0" max="400" placeholder="auto"></label>
      <label class="field"><span>Cruise speed (kt)</span><input id="byo-cruise" type="number" min="50" max="600" placeholder="auto"></label>
      <label class="field"><span>Range (nm)</span><input id="byo-range" type="number" min="100" max="8000" placeholder="auto"></label>
      <label class="field"><span>Shortest runway (ft)</span><input id="byo-rwy" type="number" min="300" max="12000" placeholder="auto"></label>
      <label class="field"><span>Approach speed (kt)</span><input id="byo-vapp" type="number" min="40" max="180" placeholder="for live coaching"></label>
      <div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Add to my hangar</button></div>
    </form>
    ${list.length?`<div class="cards">${list.map(k=>{ const a=st.customAc[k]; return `<div class="cell stack" style="gap:6px"><b>${esc(a.n)}</b><span class="small muted">${esc(CLS[a.cls]?CLS[a.cls].name:a.cls)} · ${a.pax} seats · ${a.cruise} kt · ${a.range} nm · ${a.rwy.toLocaleString()} ft</span><div class="row" style="gap:4px">${a.req.map(r=>`<span class="chip ${st.ratings[r]?'good':''}">${RATINGS[r].code}</span>`).join('')}${st.types[k]?`<span class="chip sea">${st.types[k]} flown</span>`:''}<button class="btn sm ghost" data-act="byo-del" data-id="${k}" style="margin-left:auto">Remove</button></div></div>`; }).join('')}</div>`:''}
  </section>`;
}
document.addEventListener('submit', e=>{
  if(e.target.id!=='byo-form' || !S.st) return; e.preventDefault(); e.stopImmediatePropagation();
  const st=S.st; const v=id=>document.getElementById(id).value.trim(); const num=(id,d)=>{ const x=Number(v(id)); return x>0?x:d; };
  const cls=v('byo-cls'); const T=CLS_TEMPLATE[cls]; const name=v('byo-n'); if(!name) return;
  const id='X'+uid().slice(0,6).toUpperCase(); const vapp=num('byo-vapp',null);
  const L=loadedAircraft();
  const spec = Object.assign({}, T, { n:name, cls, custom:true, simTitle: (L.title && !L.id) ? L.title : (L.title===name?name:''), price:0,
    pax:num('byo-pax',T.pax), cruise:num('byo-cruise',T.cruise), range:num('byo-range',T.range), rwy:num('byo-rwy',T.rwy),
    v: vapp ? `Approach ${vapp} KIAS` : `Cruise ${num('byo-cruise',T.cruise)} KIAS`, note:`Your own aircraft, added from MSFS.`, req:T.req.slice() });
  spec.useful = Math.max(T.useful, spec.pax*200 + 300);
  st.customAc = st.customAc||{}; st.customAc[id]=spec; AC[id]=Object.assign({},spec); st.hangar[id]=true; st.jobsKey='';
  save(); toast(`${name} added. Jobs for it will appear on the board.`); render();
}, true);
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="byo-del"]'); if(!b || !S.st) return;
  const id=b.dataset.id; if(S.st.active && S.st.active.job.ac===id){ toast('Finish the current flight in it first.'); return; }
  delete S.st.customAc[id]; delete AC[id]; delete S.st.hangar[id]; S.st.jobsKey=''; save(); render();
});

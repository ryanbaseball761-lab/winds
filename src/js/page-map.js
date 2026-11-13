/* ===================== MAP PAGE =====================
   The islands with every airport, today's job routes, a hurricane if there is one, your live flight,
   the story so far and the next chapter. The side panel describes the selected airport. */

function mapView(){
  mapZoomToSel();
  const st=S.st; const v = MAPV[S.mapZoom||'east']; const W=1000, H=Math.round(1000*(v.lat[1]-v.lat[0])/(v.lon[1]-v.lon[0])*1.05);
  const X = lon => (lon - v.lon[0])/(v.lon[1]-v.lon[0])*W, Y = lat => H - (lat - v.lat[0])/(v.lat[1]-v.lat[0])*H;
  const regions = allowedRegions(st); const storm = stormActive(st); ensureJobs(st);
  const sel = S.mapSel && AP[S.mapSel] ? S.mapSel : st.loc;
  const inView = k => AP[k].lon>=v.lon[0]-0.5 && AP[k].lon<=v.lon[1]+0.5 && AP[k].lat>=v.lat[0]-0.5 && AP[k].lat<=v.lat[1]+0.5;
  // grid
  let g=''; for(let lo=Math.ceil(v.lon[0]); lo<=v.lon[1]; lo++){ if(lo% (S.mapZoom==='all'?5:1)) continue; g+=`<line x1="${X(lo)}" y1="0" x2="${X(lo)}" y2="${H}" class="mg"/><text x="${X(lo)+4}" y="${H-6}" class="ml">${Math.abs(lo)}°W</text>`; }
  for(let la=Math.ceil(v.lat[0]); la<=v.lat[1]; la++){ if(la% (S.mapZoom==='all'?5:1)) continue; g+=`<line x1="0" y1="${Y(la)}" x2="${W}" y2="${Y(la)}" class="mg"/><text x="6" y="${Y(la)-4}" class="ml">${la}°N</text>`; }
  // storm
  let stormSvg=''; if(storm){ const pts=Object.keys(AP).filter(k=>AP[k].r===storm.region); const cx=pts.reduce((s,k)=>s+X(AP[k].lon),0)/pts.length, cy=pts.reduce((s,k)=>s+Y(AP[k].lat),0)/pts.length; stormSvg=`<g class="storm"><circle cx="${cx}" cy="${cy}" r="${S.mapZoom==='all'?60:140}"/><text x="${cx}" y="${cy}" text-anchor="middle" class="stl">Hurricane ${esc(storm.name)} · Cat ${storm.cat}</text></g>`; }
  // job routes
  const here = AP[st.loc]; let routes='';
  for(const j of st.jobs){ if(j.local) continue; const a=AP[j.to]; routes+=`<line x1="${X(here.lon)}" y1="${Y(here.lat)}" x2="${X(a.lon)}" y2="${Y(a.lat)}" class="route ${j.company?'co':''}"/>`; }
  if(st.active && !st.active.job.local){ const a=AP[st.active.job.to], b=AP[st.active.job.from]; routes+=`<line x1="${X(b.lon)}" y1="${Y(b.lat)}" x2="${X(a.lon)}" y2="${Y(a.lat)}" class="route active"/>`; }
  // airports
  let dots='', offmap=[]; const placed=[];
  const labelPos=(x,y,w)=>{ for(const [dx,dy] of [[9,-8],[9,16],[-w-9,-8],[-w-9,16],[9,30],[-w-9,30]]){ const bx=x+dx, by=y+dy; if(!placed.some(p=>Math.abs(p[0]-bx)<w+2 && Math.abs(p[1]-by)<13)){ placed.push([bx,by]); return [bx,by]; } } return null; };
  const order = Object.keys(AP).sort((a,b)=>(b===st.loc)-(a===st.loc) || (b===sel)-(a===sel));
  for(const k of order){ const a=AP[k]; if(!inView(k)){ if(a.r==='LONG'||a.r==='FL'||a.r==='CAM') offmap.push(k); continue; }
    const locked = !regions.includes(a.r); const visited = st.landedAt && st.landedAt[k]; const isHere = k===st.loc; const jobTo = st.jobs.some(j=>j.to===k);
    const cls = ['ap', a.water?'water':'', locked?'locked':'', visited?'visited':'', isHere?'here':'', jobTo?'job':'', k===sel?'sel':''].join(' ');
    dots += `<g class="${cls}" data-act="map-sel" data-k="${k}" tabindex="0" role="button" aria-label="${esc(a.n)}, ${esc(a.isl)}"><circle cx="${X(a.lon)}" cy="${Y(a.lat)}" r="${isHere?9:a.water?5:6}"/>${(()=>{ if(!(isHere||k===sel||jobTo||S.mapZoom!=='all')) return ''; const lab=a.water?'≈':k; const p=labelPos(X(a.lon),Y(a.lat),lab.length*7.6); return p?`<text x="${p[0]}" y="${p[1]}" class="al">${esc(lab)}</text>`:''; })()}</g>`;
  }
  const s=AP[sel]; const d=distNm(here, s); const dh = sel!==st.loc && !s.water && regions.includes(s.r) ? deadheadCost(st, sel) : null;
  const jobsHere = st.jobs.filter(j=>j.to===sel);
  return `<main class="wrap stack fade">${safeHTML(()=>mapJobBar(st))}
    <div class="section-title"><h2>Map</h2><div class="row"><button class="btn sm ${S.mapZoom!=='all'?'primary':''}" data-act="map-zoom" data-z="east">Eastern islands</button><button class="btn sm ${S.mapZoom==='all'?'primary':''}" data-act="map-zoom" data-z="all">Whole Caribbean</button></div></div>
    ${storm?`<div class="notice warn"><b>Hurricane ${esc(storm.name)}</b> (Category ${storm.cat}) is over the ${esc(REGIONS[storm.region].name)} until day ${storm.until}. Instrument-rated pilots only, and relief flights pay 30% more.</div>`:''}
    ${safeHTML(mapLiveBox)}<div class="grid-2">
      <div class="panel" style="padding:8px"><div class="mapwrap"><svg viewBox="0 0 ${W} ${H}" class="map" role="img" aria-label="Map of airports">${g}${stormSvg}${routes}${dots}${safeHTML(()=>mapLiveSvg(X,Y))}${safeHTML(()=>mapStorySvg(st,X,Y))}${safeHTML(()=>mapJobSvg(st,X,Y))}</svg></div>
        <div class="row small muted" style="padding:6px 8px;gap:14px"><span><i class="lg here"></i> You</span><span><i class="lg visited"></i> Landed there</span><span><i class="lg"></i> Not yet</span><span><i class="lg locked"></i> Locked region</span><span><i class="lg water"></i> Water landing</span><span><i class="lr"></i> Today's jobs</span></div>
        ${offmap.length?`<p class="small muted" style="padding:0 8px 8px">Off this map: ${offmap.filter(k=>regions.includes(AP[k].r)).map(k=>`${k} (${Math.round(distNm(here,AP[k])).toLocaleString()} nm)`).join(', ')||'more destinations unlock with your Instrument and Jet ratings'}.</p>`:''}
      </div>
      <aside class="panel stack">
        <p class="label">${esc(COUNTRY[s.c])} · ${esc(REGIONS[s.r].name)}</p>
        <h2>${esc(s.n)}</h2>
        <p class="muted small">${esc(s.isl)} · ${esc(sel)}${s.water?'':` · ${s.el} ft`}${sel!==st.loc?` · ${Math.round(d)} nm from you`:' · you are here'}</p>
        <p class="small">${esc(s.note)}</p>
        ${s.rw?`<p class="small mono">${s.rw.map(r=>`${r[0]} · ${r[1].toLocaleString()} ft`).join(' / ')}</p>`:''}
        ${s.q?`<p class="small">${st.ratings[s.q]?'<span class="chip good">Qualified</span>':`<span class="chip warn">Needs ${esc(RATINGS[s.q].n)}</span>`}</p>`:''}
        <p class="small">${st.landedAt&&st.landedAt[sel]?`You've landed here ${st.landedAt[sel]} time${st.landedAt[sel]>1?'s':''}.`:`You haven't landed here yet.`}${regions.includes(s.r)?'':' This region unlocks with '+esc(RATINGS[REGIONS[s.r].unlock].n)+'.'}</p>
        ${jobsHere.length?`<div><p class="label">Jobs to here today</p><ul class="tight small">${jobsHere.map(j=>`<li>${esc(j.title)} · ${money(j.pay)}</li>`).join('')}</ul></div>`:''}
        ${dh?`<button class="btn" data-act="deadhead" data-to="${sel}" ${st.active||st.cash<dh.cost?'disabled':''}>Deadhead here · ${money(dh.cost)} · ${durTxt(dh.min)}</button>`:''}
      </aside>
    </div></main>`;
}

/* the map opens on the zoom level that shows the airport you picked or searched for */
function mapZoomToSel(){ if(!S.mapSel||!AP[S.mapSel]) return; const v=MAPV[S.mapZoom||'east']; const a=AP[S.mapSel];
  if(a.lon<v.lon[0]||a.lon>v.lon[1]||a.lat<v.lat[0]||a.lat>v.lat[1]){ const k=Object.keys(MAPV).find(z=>a.lon>=MAPV[z].lon[0]&&a.lon<=MAPV[z].lon[1]&&a.lat>=MAPV[z].lat[0]&&a.lat<=MAPV[z].lat[1]); if(k && k!==S.mapZoom) S.mapZoom=k; } }

/* your flight, live from MSFS: the track flown so far and the plane */
function mapLiveSvg(X,Y){ const L=liveFlightInfo(); if(!L) return '';
  const path = L.track.length>1 ? `<polyline class="flown" points="${L.track.map(p=>`${X(p[1]).toFixed(1)},${Y(p[0]).toFixed(1)}`).join(' ')}"/>` : '';
  const px=X(L.pos.lon), py=Y(L.pos.lat);
  return path+`<g class="liveplane" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${L.hdg||0})"><circle r="16" class="halo"/><path d="M0 -12 L3 -3 L12 2 L12 4 L3 2 L2 9 L5 11 L5 12 L0 11 L-5 12 L-5 11 L-2 9 L-3 2 L-12 4 L-12 2 L-3 -3Z"/></g>`; }
function mapLiveBox(){ const L=liveFlightInfo(); if(!L) return '';
  return `<div class="livebox"><span class="dot-live"></span><b>Live</b><span>${esc(L.job.from)} → ${esc(L.job.local?L.job.from:L.job.to)}</span><span class="mono">${Math.round(L.togo)} nm to go</span>${L.eta!=null?`<span class="mono">ETA ${L.eta} min</span>`:''}<span class="mono">${L.gs} kt · ${L.alt.toLocaleString()} ft</span></div>`; }

/* the story so far as dashed lines, and the next chapter in red */
function mapStorySvg(st,X,Y){ const MC=mainChapters(); let g='<g class="story-lines">';
  MC.forEach(m=>{ if(!st.story.done[m.id]) return; const a=AP[m.from], b=AP[m.to]; if(!a||!b) return; const col=(CRIME_ACTS.find(x=>x.arc===m.arc)||{}).col||'#c8962a'; g+=`<line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="${col}" stroke-width="2" stroke-opacity=".55" stroke-dasharray="5 4"/>`; });
  const next=MC.find(m=>!st.story.done[m.id]); if(next && AP[next.to]){ const b=AP[next.to], a=AP[next.from]; g+=`<line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="#d23b2c" stroke-width="3"/><circle cx="${X(b.lon)}" cy="${Y(b.lat)}" r="9" fill="none" stroke="#d23b2c" stroke-width="3" class="map-pulse"/><text x="${X(b.lon)+12}" y="${Y(b.lat)-12}" class="map-next">Next: ${esc(next.title)}</text>`; }
  return g+'</g>'; }

/* "Show on map" from the job board: that job's route, with Back and Accept */
function mapRouteJob(st){ return S.mapRoute && (st.jobs||[]).find(x=>x.id===S.mapRoute); }
function mapJobSvg(st,X,Y){ const j=mapRouteJob(st); if(!j) return ''; const a=AP[j.from], b=AP[j.local?j.from:j.to];
  return `<g><line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="#c8962a" stroke-width="3"/><circle cx="${X(b.lon)}" cy="${Y(b.lat)}" r="7" fill="#c8962a"/><text x="${X(b.lon)+10}" y="${Y(b.lat)+18}" class="map-next">${esc(j.title)} · ${money(j.pay)}</text></g>`; }
function mapJobBar(st){ const j=mapRouteJob(st); if(!j) return '';
  return `<div class="row" style="gap:8px;margin-bottom:10px"><button class="btn sm" data-act="map-back">← Back to jobs</button><button class="btn sm primary" data-act="accept" data-id="${j.id}">Accept · ${money(j.pay)}</button></div>`; }

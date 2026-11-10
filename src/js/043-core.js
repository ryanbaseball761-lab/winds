/* ===================== REAL RUNWAYS: more airports, real lengths, touchdown zone + centerline grading ===================== */
Object.assign(AP, AP_MORE);
for(const k in RWY){ const ap=AP[k]; if(!ap || ap.water || ap.gen) continue; const real=RWY[k].filter(r=>r[11]!=='water'); if(real.length) ap.rw = real.map(r=>[`${r[0]}/${r[1]}`, r[2]]); }
function rwyEnds(code){ const out=[]; for(const r of (RWY[code]||[])){ if(r[11]==='water') continue; const [le,he,len,w,la1,lo1,la2,lo2,d1,d2,hdg,surf,approx]=r;
  out.push({id:le, len, w, thr:{lat:la1,lon:lo1}, far:{lat:la2,lon:lo2}, disp:d1, hdg, surf, approx});
  out.push({id:he, len, w, thr:{lat:la2,lon:lo2}, far:{lat:la1,lon:lo1}, disp:d2, hdg:(hdg+180)%360, surf, approx}); } return out; }
/* local flat-earth offset in feet (fine over a few miles) */
function ftOffset(a, b){ const kx=Math.cos(a.lat*toR)*364567, ky=364567; return {x:(b.lon-a.lon)*kx, y:(b.lat-a.lat)*ky}; }
function touchdownAnalysis(code, td){
  if(!td || td.lat==null || !RWY[code]) return null; const ends=rwyEnds(code); if(!ends.length) return null;
  let best=null;
  for(const e of ends){ const v=ftOffset(e.thr, td), h=e.hdg*toR; const along = v.x*Math.sin(h) + v.y*Math.cos(h); const cross = v.x*Math.cos(h) - v.y*Math.sin(h);
    const hd = td.hdg!=null ? Math.abs(((td.hdg - e.hdg + 540) % 360) - 180) : 0;
    const on = along > -1500 && along < e.len + 500 && Math.abs(cross) < Math.max(400, e.w*3);
    const cost = (on?0:1e6) + hd*40 + Math.abs(cross);
    if(!best || cost<best.cost) best={e, along, cross, hd, on, cost}; }
  if(!best.on) return { runway:null, off:true };
  const e=best.e, fromThr = Math.round(best.along - e.disp); const zoneEnd = Math.min(3000, Math.round(e.len/3));
  const zone = fromThr < -30 ? 'short' : fromThr <= zoneEnd ? (fromThr>=400 && fromThr<=1800 ? 'aim' : 'zone') : 'long';
  const xt = Math.round(best.cross); const half=e.w/2;
  const center = Math.abs(xt) <= Math.max(8, e.w*0.12) ? 'on' : Math.abs(xt) <= half*0.55 ? 'near' : Math.abs(xt) <= half ? 'wide' : 'off';
  return { runway:e.id, len:e.len, w:e.w, avail:e.len-e.disp, fromThr, zoneEnd, zone, xt, center, approx:!!e.approx, remaining: Math.round(e.len - best.along), surf:e.surf };
}
function runwaySVG(A){
  if(!A || !A.runway) return ''; const W=560, H=90, pad=24, L=A.len; const sx = x => pad + (x/L)*(W-2*pad); const half=26;
  const yOf = xt => H/2 + Math.max(-half-8, Math.min(half+8, xt/(A.w/2)*half));
  const disp = A.len-A.avail; const zx1=sx(disp), zx2=sx(disp+A.zoneEnd), ax1=sx(disp+400), ax2=sx(disp+1800);
  const tx = sx(Math.max(-200, Math.min(L, disp + A.fromThr))), ty = A.approx ? H/2 : yOf(A.xt);
  return `<svg class="rwy-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Touchdown ${A.fromThr} feet past the threshold, ${Math.abs(A.xt)} feet off centerline">
    <rect x="${pad}" y="${H/2-half}" width="${W-2*pad}" height="${half*2}" rx="3" class="rw-body"/>
    ${disp?`<rect x="${pad}" y="${H/2-half}" width="${sx(disp)-pad}" height="${half*2}" class="rw-disp"/>`:''}
    <rect x="${zx1}" y="${H/2-half}" width="${zx2-zx1}" height="${half*2}" class="rw-zone"/>
    <rect x="${ax1}" y="${H/2-half+6}" width="${ax2-ax1}" height="${half*2-12}" class="rw-aim"/>
    <line x1="${pad+4}" x2="${W-pad-4}" y1="${H/2}" y2="${H/2}" class="rw-cl"/>
    <text x="${pad+4}" y="${H/2-half-6}" class="rw-t">${esc(A.runway)} threshold</text><text x="${W-pad-4}" y="${H/2-half-6}" text-anchor="end" class="rw-t">${A.len.toLocaleString()} ft</text>
    <text x="${(ax1+ax2)/2}" y="${H/2+half+14}" text-anchor="middle" class="rw-t">aiming point</text>
    <circle cx="${tx}" cy="${ty}" r="7" class="rw-td"/><circle cx="${tx}" cy="${ty}" r="12" class="rw-td-ring"/>
  </svg>`;
}
function touchdownPanel(f){ const A=f&&f.tda; if(!A) return ''; if(A.off) return `<section class="panel"><p class="label">Where you touched down</p><p class="small muted">Couldn't match the touchdown to a runway at this airport.</p></section>`;
  const zoneTxt = {aim:'Right on the aiming point. Textbook.', zone:'Inside the touchdown zone.', long:`Floated past the touchdown zone, leaving ${A.remaining.toLocaleString()} ft of runway.`, short:'Touched down before the threshold. On a real runway that can mean lights, a fence, or water.'}[A.zone];
  const clTxt = A.approx ? 'Centerline not graded at this airport (approximate runway position).' : {on:'Right on the centerline.', near:'Close to the centerline.', wide:'Well off the centerline, but on the pavement.', off:'Touched down off the runway edge.'}[A.center];
  return `<section class="panel stack"><div class="row between"><div><p class="label">Where you touched down</p><h3>Runway ${esc(A.runway)}</h3></div><span class="chip ${A.zone==='aim'||A.zone==='zone'?'good':'warn'}">${A.fromThr<0?'Short':A.fromThr.toLocaleString()+' ft'}</span></div>${runwaySVG(A)}<p class="small">${esc(zoneTxt)} ${esc(clTxt)}</p></section>`; }
const _wResult = resultView;
resultView = function(){ let h=_wResult(); const f=S.st.last&&S.st.last.f; const p=touchdownPanel(f); if(p) h=h.replace('<div class="grid-2">', p+'<div class="grid-2">'); return h; };
/* the flight card shows exactly where you put it down */
const _wCard = drawFlightCard;
drawFlightCard = function(st){ const cv=_wCard(st); const A=st.last&&st.last.f&&st.last.f.tda; if(!A || !A.runway) return cv; const g=cv.getContext('2d');
  const x0=740, x1=1160, y=545, h=34, L=A.len, sx=v=>x0+(v/L)*(x1-x0), disp=A.len-A.avail;
  g.fillStyle='rgba(4,20,24,.78)'; roundRect(g,x0-20,y-56,x1-x0+40,h+86,18); g.fill();
  g.fillStyle='#3b4148'; roundRect(g,x0,y,x1-x0,h,4); g.fill();
  g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(sx(disp+400),y+5,sx(disp+1800)-sx(disp+400),h-10);
  g.strokeStyle='rgba(255,255,255,.7)'; g.setLineDash([12,9]); g.lineWidth=2; g.beginPath(); g.moveTo(x0+6,y+h/2); g.lineTo(x1-6,y+h/2); g.stroke(); g.setLineDash([]);
  const tx=sx(Math.max(0,Math.min(L,disp+A.fromThr))), ty=y+h/2+(A.approx?0:Math.max(-h/2,Math.min(h/2, A.xt/(A.w/2)*(h/2))));
  g.fillStyle='#f2b33d'; g.strokeStyle='#08171c'; g.lineWidth=3; g.beginPath(); g.arc(tx,ty,9,0,Math.PI*2); g.fill(); g.stroke();
  g.fillStyle='#fff'; g.font='700 15px "Instrument Sans","Segoe UI",sans-serif'; g.fillText(`RUNWAY ${A.runway}`, x0, y-28);
  g.fillStyle='rgba(255,255,255,.8)'; g.font='600 15px "IBM Plex Mono",Consolas,monospace'; g.textAlign='right';
  g.fillText(A.fromThr<0?`${Math.abs(A.fromThr)} ft short`:`${A.fromThr.toLocaleString()} ft in${A.approx?'':` · ${Math.abs(A.xt)} ft ${A.xt>=0?'R':'L'}`}`, x1, y-28); g.textAlign='left';
  return cv; };

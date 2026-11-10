/* ===================== PILOT PROFILE (shareable) ===================== */
VIEWS.push(['profile','Profile']); NAV_GROUPS[1].splice(1,0,'profile');
NAV_ICON.profile = `<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4.5-6 8-6s7 2 8 6"/>`;
VIEW_META.profile = ['Pilot profile','Your flying, in numbers'];
function profileStats(st){
  const L=st.log||[]; const ver=L.filter(l=>l.verified && l.fpm!=null);
  const byAc={}; L.forEach(l=>{ byAc[l.ac]=(byAc[l.ac]||0)+(l.min||0); });
  const grades={A:0,B:0,C:0,D:0,F:0}; L.forEach(l=>{ if(grades[l.grade]!=null) grades[l.grade]++; });
  const visited=Object.keys(st.landedAt||{}).filter(k=>AP[k]&&!AP[k].water);
  return { flights:st.flights||0, hours:(st.minutes||0)/60, nm:Math.round((st.stats&&st.stats.nm)||0), visited, apTotal:Object.keys(AP).filter(k=>!AP[k].water).length,
    avgFpm: ver.length? Math.round(ver.reduce((s,l)=>s+l.fpm,0)/ver.length):null, best: ver.length? Math.min(...ver.map(l=>l.fpm)) : null,
    aPct: L.length? Math.round(grades.A/L.length*100):0, grades, byAc, ach:Object.keys(st.ach||{}).length, achTotal:ACH.length,
    chapters:Object.keys(st.story.done||{}).length, chTotal:STORY.length, earned:L.reduce((s,l)=>s+(l.pay||0),0), landings:st.stats||{} };
}
function visitedMap(st, W=520, H=300){
  const ks=Object.keys(AP).filter(k=>!AP[k].water && AP[k].lon>-90 && AP[k].lon<-55); const la=ks.map(k=>AP[k].lat), lo=ks.map(k=>AP[k].lon);
  const a0=Math.min(...la)-1, a1=Math.max(...la)+1, o0=Math.min(...lo)-1, o1=Math.max(...lo)+1; const X=v=>(v-o0)/(o1-o0)*W, Y=v=>H-(v-a0)/(a1-a0)*H;
  return `<svg viewBox="0 0 ${W} ${H}" class="pf-map" role="img" aria-label="Airports visited">${ks.map(k=>{ const v=st.landedAt&&st.landedAt[k]; return `<circle cx="${X(AP[k].lon).toFixed(1)}" cy="${Y(AP[k].lat).toFixed(1)}" r="${v?5:3}" class="${v?'v':''}"><title>${esc(k)} · ${esc(AP[k].isl)}${v?` · ${v} landing${v>1?'s':''}`:''}</title></circle>`; }).join('')}</svg>`;
}
function profileView(){
  const st=S.st; const P=profileStats(st); const rk=rankOf(st); const r=topRating(st);
  const acRows=Object.keys(P.byAc).filter(k=>AC[k]).sort((a,b)=>P.byAc[b]-P.byAc[a]).slice(0,8); const maxM=Math.max(1,...acRows.map(k=>P.byAc[k]));
  const tile=(l,v,s='')=>`<div class="pf-tile"><span>${l}</span><b class="mono">${v}</b>${s?`<small>${s}</small>`:''}</div>`;
  const lands=['butter','smooth','firm','hard'].map(k=>[k,P.landings[k]||0]); const lmax=Math.max(1,...lands.map(x=>x[1]));
  return `<main class="wrap stack fade">
    <section class="pf-hero"><div class="pav big">${esc(initials(st.pilot.name))}</div><div style="min-width:0"><p class="label" style="color:inherit;opacity:.75">${esc(r.n)} · ${esc(DIFF[diff()].n)} difficulty</p><h1>${esc(st.pilot.name)}</h1><p>${esc(rk.name)}${st.company?` · ${esc(st.company.name)}`:' · Coral Wing Air'} · flying since day 1 of the career</p></div>
      <button class="btn" data-act="pf-card">Save profile card</button></section>
    <div class="pf-tiles">${tile('Hours',P.hours.toFixed(1))}${tile('Flights',P.flights)}${tile('Distance',P.nm.toLocaleString(),'nm')}${tile('Airports',`${P.visited.length}/${P.apTotal}`)}${tile('Avg touchdown',P.avgFpm!=null?P.avgFpm:'—','fpm, MSFS-verified')}${tile('Best landing',P.best!=null?P.best:'—','fpm')}${tile('Grade A',P.aPct+'%','of flights')}${tile('Achievements',`${P.ach}/${P.achTotal}`)}${tile('Story',`${P.chapters}/${P.chTotal}`,'chapters')}${tile('Earned',money(P.earned))}</div>
    <div class="grid-2">
      <section class="panel stack"><h3>Islands you've landed on</h3>${visitedMap(st)}<p class="tiny muted">${P.visited.length?P.visited.map(k=>esc(AP[k].isl.replace(/\s*\(.*\)/,''))).filter((v,i,a)=>a.indexOf(v)===i).join(' · '):'Your first landing goes here.'}</p></section>
      <div class="stack"><section class="panel stack"><h3>Hours by aircraft</h3>${acRows.length?acRows.map(k=>`<div class="pf-bar"><span>${esc(AC[k].n)}</span><div><i style="width:${(P.byAc[k]/maxM*100).toFixed(0)}%"></i></div><b class="mono">${(P.byAc[k]/60).toFixed(1)} h</b></div>`).join(''):'<p class="small muted">Fly a few jobs to fill this in.</p>'}</section>
        <section class="panel stack"><h3>Landings</h3>${lands.map(([k,v])=>`<div class="pf-bar"><span>${esc((LANDING[k]&&LANDING[k].n||k).split(' (')[0])}</span><div><i class="l-${k}" style="width:${(v/lmax*100).toFixed(0)}%"></i></div><b class="mono">${v}</b></div>`).join('')}</section></div>
    </div>
  </main>`;
}
function drawProfileCard(st){
  const P=profileStats(st); const W=1200,H=630; const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
  const disp='"Bricolage Grotesque","Segoe UI",sans-serif', body='"Instrument Sans","Segoe UI",sans-serif', mono='"IBM Plex Mono",Consolas,monospace';
  let gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#08171c'); gr.addColorStop(.6,'#0e3a40'); gr.addColorStop(1,'#d9732f'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.08)'; roundRect(g,40,40,W-80,H-80,28); g.fill();
  g.fillStyle='#fff'; g.font=`800 28px ${disp}`; g.fillText('TRADE WINDS · PILOT PROFILE',80,100);
  g.font=`800 72px ${disp}`; g.fillText(st.pilot.name.slice(0,22),80,190); g.fillStyle='rgba(255,255,255,.75)'; g.font=`500 24px ${body}`; g.fillText(`${rankOf(st).name} · ${topRating(st).n}`,82,232);
  const tiles=[['HOURS',P.hours.toFixed(1)],['FLIGHTS',String(P.flights)],['AIRPORTS',`${P.visited.length}/${P.apTotal}`],['BEST LANDING',P.best!=null?P.best+' fpm':'—'],['AVG TOUCHDOWN',P.avgFpm!=null?P.avgFpm+' fpm':'—'],['GRADE A',P.aPct+'%']];
  tiles.forEach((t,i)=>{ const x=80+(i%3)*350, y=290+Math.floor(i/3)*130; g.fillStyle='rgba(255,255,255,.1)'; roundRect(g,x,y,320,110,16); g.fill(); g.fillStyle='rgba(255,255,255,.65)'; g.font=`700 15px ${body}`; g.fillText(t[0],x+22,y+36); g.fillStyle='#fff'; g.font=`600 40px ${mono}`; g.fillText(t[1],x+22,y+86); });
  g.fillStyle='rgba(255,255,255,.7)'; g.font=`500 18px ${body}`; g.fillText(`${P.ach} achievements · ${P.chapters} story chapters · ${P.nm.toLocaleString()} nm flown in Microsoft Flight Simulator`,80,H-70);
  return cv;
}
document.addEventListener('click', async e=>{ if(!e.target.closest('[data-act="pf-card"]') || !S.st) return; const cv=drawProfileCard(S.st); const blob=await new Promise(r=>cv.toBlob(r,'image/png')); const name=`TradeWinds-profile-${S.st.pilot.name.replace(/\W+/g,'')}.png`;
  try{ if(window.twNative && twNative.saveFile){ const ok=await twNative.saveFile(name,new Uint8Array(await blob.arrayBuffer())); if(ok) toast('Profile card saved.'); return; } }catch(_){}
  try{ const dl=window.claude && await claude.use('downloads'); if(dl){ await dl.save({filename:name, data:blob}); toast('Profile card saved.'); return; } }catch(err){ if(err&&err.code==='declined') return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }catch(_){} });

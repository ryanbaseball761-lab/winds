/* ===================== 2. LANDING REPLAY CARD (shareable image) ===================== */
function drawFlightCard(st){
  const {job,res,f,out} = st.last; const W=1200, H=630;
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
  const disp='"Bricolage Grotesque", "Segoe UI", system-ui, sans-serif', body='"Instrument Sans", "Segoe UI", system-ui, sans-serif', mono='"IBM Plex Mono", Consolas, monospace';
  // sky + sea
  let gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0c3d52'); gr.addColorStop(.48,'#1b8a9a'); gr.addColorStop(.62,'#f2a65a'); gr.addColorStop(.63,'#0b746f'); gr.addColorStop(1,'#063c3d'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,220,150,.9)'; g.beginPath(); g.arc(1110,372,60,Math.PI,0); g.fill();
  g.fillStyle='#0a3436'; g.beginPath(); g.moveTo(560,395); g.bezierCurveTo(650,330,720,330,800,385); g.bezierCurveTo(860,350,930,345,1010,395); g.lineTo(1200,398); g.lineTo(1200,400); g.lineTo(560,400); g.fill();
  g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=2; for(let i=0;i<7;i++){ g.beginPath(); const y=420+i*28; g.moveTo(600+i*20,y); g.lineTo(1150-i*30,y); g.stroke(); }
  // dark panel
  g.fillStyle='rgba(4,20,24,.72)'; roundRect(g,40,40,660,550,28); g.fill();
  g.fillStyle='#fff'; g.font=`800 30px ${disp}`; g.fillText('TRADE WINDS',76,98);
  g.fillStyle='rgba(255,255,255,.65)'; g.font=`500 16px ${body}`; g.fillText('Caribbean career for MSFS',76,124);
  // route
  const to = st.log[0]?.to || job.to;
  g.fillStyle='#fff'; g.font=`600 76px ${mono}`; g.fillText(job.from,76,232); const wF=g.measureText(job.from).width;
  g.fillStyle='#ff9470'; g.font=`700 44px ${body}`; g.fillText('→',76+wF+22,222);
  g.fillStyle='#fff'; g.font=`600 76px ${mono}`; g.fillText(job.local?job.from:to,76+wF+86,232);
  g.fillStyle='rgba(255,255,255,.7)'; g.font=`500 19px ${body}`; g.fillText(`${AP[job.from].isl} to ${AP[to].isl}`.slice(0,52),78,266);
  g.fillStyle='#fff'; g.font=`700 30px ${disp}`; wrapText(g, job.title, 76, 322, 590, 36, 2);
  // stats
  const fpm = f && f.verified ? `${f.simFpm} fpm` : ({butter:'< 100 fpm',smooth:'100–200 fpm',firm:'200–350 fpm',hard:'350+ fpm',crash:'crash'}[f.landing]||'—');
  const stats = [['Touchdown',fpm],['G-force', f&&f.simG?`${f.simG} G`:'—'],['Block',durTxt(res.block)],['Comfort', f&&f.comfort!=null?`${f.comfort}/100`:'—']];
  stats.forEach((s,i)=>{ const x=76+i*155, y=430; g.fillStyle='rgba(255,255,255,.08)'; roundRect(g,x,y,140,86,14); g.fill();
    g.fillStyle='rgba(255,255,255,.6)'; g.font=`700 12px ${body}`; g.fillText(s[0].toUpperCase(),x+14,y+28);
    g.fillStyle='#fff'; g.font=`600 ${s[1].length>9?18:22}px ${mono}`; g.fillText(s[1],x+14,y+62); });
  g.fillStyle='rgba(255,255,255,.75)'; g.font=`500 17px ${body}`; g.fillText(`${st.pilot.name} · ${AC[job.ac].n} · ${dateTxt(st.day)}`.slice(0,64),76,560);
  // grade ring
  const cx=960, cy=190, r=110; g.lineWidth=18; g.strokeStyle='rgba(255,255,255,.18)'; g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
  const gc={A:'#43d17f',B:'#43b8ad',C:'#f2b14a',D:'#ff7a55',F:'#ff5b4b'}[res.grade]||'#fff';
  g.strokeStyle=gc; g.lineCap='round'; g.beginPath(); g.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*res.score/100); g.stroke();
  g.fillStyle='#fff'; g.font=`800 110px ${disp}`; g.textAlign='center'; g.fillText(res.grade,cx,cy+38);
  g.font=`600 20px ${mono}`; g.fillStyle='rgba(255,255,255,.85)'; g.fillText(`${res.score}/100`,cx,cy+r+48);
  if(f && f.verified){ g.font=`700 15px ${body}`; const t='✓ VERIFIED BY MSFS'; const w=g.measureText(t).width+28; g.fillStyle='rgba(47,211,154,.9)'; roundRect(g,cx-w/2,cy+r+66,w,32,16); g.fill(); g.fillStyle='#04281c'; g.fillText(t,cx,cy+r+87); }
  g.textAlign='left';
  return cv;
}
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function wrapText(g,t,x,y,max,lh,lines){ const words=t.split(' '); let line='', n=0; for(const w of words){ const test=line?line+' '+w:w; if(g.measureText(test).width>max && line){ g.fillText(line,x,y); y+=lh; line=w; n++; if(n>=lines-1){ /* last line */ } if(n>=lines){ return; } } else line=test; } if(line && n<lines) g.fillText(line.length>60?line.slice(0,58)+'…':line,x,y); }
function cardSection(){
  return `<section class="panel stack share-card"><div class="row between"><div><p class="label">Flight card</p><h3>Share this flight</h3></div>
      <div class="row"><button class="btn primary sm" data-act="card-save">Save image</button><button class="btn sm" data-act="card-copy">Copy</button></div></div>
      <img id="flight-card" alt="Flight card image: route, grade and landing stats" style="width:100%;border-radius:14px;display:block;aspect-ratio:1200/630;background:var(--surface-2)"></section>`;
}

function paintCard(){ const img=document.getElementById('flight-card'); if(!img || !S.st || !S.st.last) return; const draw=()=>{ try{ const cv=drawFlightCard(S.st); img.src=cv.toDataURL('image/png'); }catch(e){} }; if(document.fonts && document.fonts.ready) document.fonts.ready.then(draw); else draw(); }
document.addEventListener('click', async e=>{
  const b=e.target.closest('[data-act="card-save"],[data-act="card-copy"]'); if(!b || !S.st || !S.st.last) return;
  const cv=drawFlightCard(S.st); const blob = await new Promise(r=>cv.toBlob(r,'image/png'));
  const name = `trade-winds-${S.st.last.job.from}-${S.st.log[0]?.to||S.st.last.job.to}-${S.st.last.res.grade}.png`;
  if(b.dataset.act==='card-copy'){
    try{ await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); toast('Card copied. Paste it anywhere.'); }catch(_){ toast('Copy isn\'t allowed here. Use Save image instead.'); }
    return;
  }
  try{ const dl = window.claude && await claude.use('downloads'); if(dl){ await dl.save({filename:name, data:blob}); toast('Saved.'); return; } }catch(err){ if(err && err.code==='declined') return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }catch(_){ toast('Saving isn\'t available in this view.'); }
});

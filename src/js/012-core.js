/* ===================== JOB CARDS (replaces the flight-strip board) ===================== */
const WX_ICON = {
  sun:`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  cloud:`<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18z"/>`,
  rain:`<path d="M7 15h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 8 3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/>`,
  storm:`<path d="M7 14h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 7 3.5 3.5 0 0 0 7 14zM13 14l-3 4h4l-2 4"/>`,
  haze:`<path d="M3 9h14M5 13h16M3 17h14M17 5h2"/>`,
  wind:`<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>`
};
function wxIconKey(w){ const k=w.key||''; return k==='tstorm'?'storm': k==='showers'||k==='wave'?'rain': k==='dust'?'haze': k==='north'?'wind': (w.cl&&w.cl.some(c=>c[0]==='BKN'||c[0]==='OVC'))?'cloud':'sun'; }

const ICO_PLANE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5v2l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z"/></svg>`;
function stripHTML(st, job, opts={}){
  const extra = opts.extra||'';
  const a=AC[job.ac]; const p=plan(job); const kd=jobKind(job);
  const duty = dutyAfter(st, job); const overDuty = duty > DUTY_MAX;
  const load = job.pax ? `${job.pax} pax${job.cargo?` · ${job.cargo} lb`:''}` : job.cargo ? `${job.cargo} lb cargo` : 'Ferry, empty';
  const payTxt = job.kind==='check' ? 'Checkride' : job.company ? money(Math.round(job.pay*2.6 - a.op*job.est/60)) : money(job.pay);
  const payLbl = job.kind==='check' ? '' : job.company ? 'est. profit' : 'pay';
  const btn = opts.btn!==undefined ? opts.btn : (st.active ? `<button class="btn sm" disabled>Flight booked</button>` : overDuty ? `<span class="chip warn">Over duty limit</span>` : `<button class="btn primary jc-go" data-act="accept" data-id="${job.id}">Accept ${ICO_PLANE}</button>`);
  const from = AP[job.from], to = job.mystery ? null : AP[job.to];
  const toCode = job.mystery ? '????' : job.local ? job.from : job.to;
  const toName = job.mystery ? 'Sealed destination' : job.local ? 'Local flight' : to.isl.replace(/\s*\(.*\)/,'');
  const dist = job.mystery ? '' : job.local ? `${p.dist} nm loop` : `${p.dist} nm`;
  const w = job.wx;
  const wxHTML = job.mystery
    ? `<span class="jc-wx"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"/></svg>${job.celeb?'Rumor: someone famous':job.aiGen?'A very odd booking':'Sealed until you accept'}</span>`
    : `<span class="jc-wx" title="${esc(w.n)}"><svg viewBox="0 0 24 24" aria-hidden="true">${WX_ICON[wxIconKey(w)]}</svg><span>${esc((x=>x.charAt(0).toUpperCase()+x.slice(1))(w.n.replace(/^(Classic|Passing) /,'')))}</span><span class="mono">${pad3(w.dir)}°/${w.spd}${w.gust?'G'+w.gust:''}</span></span>`;
  const title = job.mystery ? (job.aiGen?esc(job.title):'Confidential charter') : esc(job.title);
  return `<article class="jcard k-${kd.k} ${opts.locked?'locked':''}" style="--k:${kd.c}">
    <div class="jc-top"><span class="jc-type">${esc(kd.t)}</span><span class="jc-pay"><b>${payTxt}</b>${payLbl?`<small>${payLbl}</small>`:''}</span></div>
    <div class="jc-route">
      <div><b>${esc(job.from)}</b><span>${esc(from.isl.replace(/\s*\(.*\)/,''))}</span></div>
      <div class="jc-line" aria-hidden="true"><i></i>${ICO_PLANE}<i></i></div>
      <div class="r"><b>${esc(toCode)}</b><span>${esc(toName)}</span></div>
    </div>
    <h3 class="jc-title">${title}</h3>
    <p class="jc-meta">${esc(a.n.replace(/^(Cessna|Beechcraft|Diamond|CubCrafters|Zlin|ICON|de Havilland Canada|Grumman|Pilatus|Daher|Douglas|Cirrus|Airbus|Boeing|Heart Aerospace)\s/,''))} · ${load}${dist?` · ${dist}`:''} · ~${durTxt(p.est)} · <span class="mono">STD ${hhmm(job.dep)}</span></p>
    <div class="chips">${chipsFor(st,job)}</div>${extra}
    <div class="jc-foot">${wxHTML}${btn}</div>
  </article>`;
}

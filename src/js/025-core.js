/* ===================== ILLUSTRATIONS: island postcards + aircraft silhouettes ===================== */
let _artN = 0;
function hashStr(s){ let h=2166136261; for(const c of String(s)) { h^=c.charCodeAt(0); h=Math.imul(h,16777619)>>>0; } return h; }
function rng(seed){ let x=seed||1; return ()=>{ x^=x<<13; x>>>=0; x^=x>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }
function skyFor(min){ const h=((min||600)/60)%24;
  if(h<5.5||h>=19.5) return ['#0b1530','#1d2b55','#e9eefc',true];
  if(h<7) return ['#2b3f7a','#f2a46b','#ffd9a8',false];
  if(h>=17.5) return ['#3a3f86','#f0805a','#ffcf8a',false];
  return ['#2f8fd0','#9fd6f0','#fff5d6',false]; }
function islandArt(code, min, w=600, h=140, plane=null){
  const id='a'+(++_artN); const R=rng(hashStr(code)); const [top,bot,sun,night]=skyFor(min); const sea=night?'#0a2a3a':'#118a92';
  const peaks=1+Math.floor(R()*3); let hill=`M0 ${h*0.72}`; const x0=w*(0.15+R()*0.3), x1=w*(0.55+R()*0.35); const base=h*0.72;
  hill+=` L${x0.toFixed(0)} ${base}`; for(let i=0;i<peaks;i++){ const cx=x0+(x1-x0)*(i+0.5)/peaks, ph=h*(0.18+R()*0.35); hill+=` Q${(cx-(x1-x0)/peaks/2).toFixed(0)} ${(base-ph*0.4).toFixed(0)} ${cx.toFixed(0)} ${(base-ph).toFixed(0)} T${(x0+(x1-x0)*(i+1)/peaks).toFixed(0)} ${base}`; }
  hill+=` L${w} ${base} L${w} ${h} L0 ${h}Z`;
  const sx=(w*(0.7+R()*0.2)).toFixed(0), sy=(h*(night?0.25:0.32)).toFixed(0);
  const palm=(px)=>`<g transform="translate(${px} ${base-2})" fill="${night?'#06141c':'#0b3b34'}"><path d="M0 0 C2 -14 4 -24 3 -34 L5 -34 C6 -24 4 -12 3 0Z"/><path d="M4 -34 C-6 -40 -14 -36 -18 -30 C-10 -34 -4 -34 4 -32Z"/><path d="M4 -34 C12 -42 22 -38 26 -31 C18 -35 10 -34 4 -32Z"/><path d="M4 -35 C2 -44 -4 -48 -10 -48 C-4 -45 0 -40 3 -34Z"/></g>`;
  const boat = R()>0.4 ? `<g transform="translate(${(w*(0.08+R()*0.2)).toFixed(0)} ${(base+h*0.12).toFixed(0)})"><path d="M-12 0 L12 0 L8 5 L-8 5Z" fill="#fff" opacity=".9"/><path d="M0 -1 L0 -22 L12 -2Z" fill="#fff" opacity=".85"/></g>` : '';
  const stars = night ? Array.from({length:14},()=>`<circle cx="${(R()*w).toFixed(0)}" cy="${(R()*h*0.5).toFixed(0)}" r="${(R()*1.2+0.3).toFixed(1)}" fill="#fff" opacity=".8"/>`).join('') : '';
  const pl = plane ? `<g transform="translate(${(w*0.32).toFixed(0)} ${(h*0.16).toFixed(0)}) scale(${(h/140*0.9).toFixed(2)})" opacity=".95">${acSvgInner(plane, '#ffffff')}</g>` : '';
  return `<svg class="art" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea}"/><stop offset="1" stop-color="${night?'#04131b':'#0a5a62'}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#${id}s)"/>${stars}<circle cx="${sx}" cy="${sy}" r="${night?10:16}" fill="${sun}" opacity=".95"/>
    <rect y="${base}" width="${w}" height="${h-base}" fill="url(#${id}w)"/>
    <path d="${hill}" fill="${night?'#0b1d24':'#1f5e45'}" opacity=".95"/><path d="M${x0.toFixed(0)} ${base} Q${((x0+x1)/2).toFixed(0)} ${base+5} ${x1.toFixed(0)} ${base}" stroke="#f3e2b0" stroke-width="3" fill="none" opacity="${night?0.25:0.8}"/>
    ${palm((x1-18).toFixed(0))}${R()>0.5?palm((x0+20).toFixed(0)):''}${boat}${pl}
    <g stroke="#fff" stroke-opacity=".25">${Array.from({length:4},(_,i)=>`<line x1="${(w*0.1+i*40).toFixed(0)}" x2="${(w*0.1+i*40+60).toFixed(0)}" y1="${(base+10+i*7).toFixed(0)}" y2="${(base+10+i*7).toFixed(0)}"/>`).join('')}</g></svg>`;
}
/* side-view silhouettes, 120 x 40 */
const SIL = {
  high:`<path d="M8 24 Q10 18 22 18 L78 17 Q92 17 100 21 L104 24 Q92 28 70 28 L22 28 Q12 28 8 24Z"/><path d="M30 15 L84 14 L84 16 L30 17Z"/><path d="M42 16 L48 26 L50 26 L46 16Z"/><path d="M96 20 L108 8 L112 8 L106 22Z"/><path d="M92 22 L114 21 L114 23 L92 24Z"/><rect x="4" y="16" width="2" height="16" rx="1"/><circle cx="34" cy="31" r="2.6"/><circle cx="60" cy="31" r="2.6"/><path d="M34 28 L34 31 M60 28 L60 31" stroke="currentColor" stroke-width="1.4"/>`,
  low:`<path d="M8 23 Q10 17 24 17 L78 17 Q92 17 100 21 L104 23 Q92 27 70 27 L22 27 Q12 27 8 23Z"/><path d="M28 24 L86 24 L86 27 L28 27Z"/><path d="M34 16 Q40 11 52 12 L60 17Z" opacity=".55"/><path d="M96 20 L108 8 L112 8 L106 22Z"/><path d="M92 21 L114 20 L114 22 L92 23Z"/><rect x="4" y="15" width="2" height="16" rx="1"/><circle cx="36" cy="31" r="2.6"/><circle cx="62" cy="31" r="2.6"/>`,
  twin:`<path d="M10 22 Q12 16 26 16 L82 16 Q94 16 102 20 L106 22 Q94 26 72 26 L24 26 Q14 26 10 22Z"/><path d="M30 23 L84 23 L84 26 L30 26Z"/><path d="M36 20 Q38 18 52 18 L56 22 L52 25 L38 25Z"/><path d="M98 19 L110 6 L114 6 L108 21Z"/><path d="M94 20 L116 19 L116 21 L94 22Z"/><rect x="34" y="15" width="2" height="14" rx="1"/><circle cx="40" cy="31" r="2.6"/><circle cx="64" cy="31" r="2.6"/>`,
  jet:`<path d="M4 23 Q6 17 20 17 L84 17 Q98 17 104 21 L106 23 Q96 27 78 27 L20 27 Q8 27 4 23Z"/><path d="M40 24 L76 24 L80 27 L40 27Z"/><path d="M78 14 L96 14 Q100 17 96 20 L78 20Z"/><path d="M98 20 L104 4 L108 4 L106 21Z"/><path d="M98 5 L116 4 L116 6 L100 7Z"/><path d="M10 18 Q14 14 22 15 L24 18Z" opacity=".5"/><circle cx="18" cy="31" r="2.2"/><circle cx="62" cy="31" r="2.6"/>`,
  airliner:`<path d="M2 22 Q4 16 18 16 L96 16 Q106 16 110 20 L112 22 Q104 26 90 26 L18 26 Q6 26 2 22Z"/><path d="M38 23 L82 23 L88 28 L44 28Z"/><path d="M48 27 Q50 25 60 25 L62 31 L50 31Z"/><path d="M104 19 L112 2 L117 2 L114 21Z"/><path d="M102 20 L118 19 L118 21 L102 22Z"/><circle cx="16" cy="31" r="2"/><circle cx="64" cy="33" r="2.4"/><g opacity=".55">${Array.from({length:12},(_,i)=>`<rect x="${20+i*6}" y="18" width="2.6" height="2.6" rx="1"/>`).join('')}</g>`,
  float:`<path d="M10 20 Q12 14 24 14 L78 13 Q92 13 100 17 L104 20 Q92 24 70 24 L24 24 Q14 24 10 20Z"/><path d="M30 11 L84 10 L84 12 L30 13Z"/><path d="M96 16 L108 4 L112 4 L106 18Z"/><path d="M92 18 L114 17 L114 19 L92 20Z"/><path d="M24 31 Q20 31 18 29 L86 29 L82 33 L26 33Z"/><path d="M34 24 L36 29 M70 24 L72 29" stroke="currentColor" stroke-width="1.6"/><rect x="6" y="12" width="2" height="16" rx="1"/>`
};
function silType(acId){ const a=AC[acId]; if(!a) return 'high';
  if(['airliner','regional','widebody'].includes(a.cls)) return 'airliner'; if(a.cls==='jet') return 'jet'; if(a.cls==='amph' || acId==='GOOSE') return 'float';
  if(a.cls==='twin' || ['DHC6','KA350','DA62','GOOSE','DC3'].includes(acId)) return 'twin';
  if(['DA40','G36','PC12','TBM','SR22','SF50','A5'].includes(acId) || a.cls==='hp') return 'low';
  return 'high'; }
function acSvgInner(acId, color){ return `<g fill="${color||'currentColor'}" style="color:${color||'currentColor'}">${SIL[silType(acId)]}</g>`; }
function acSvg(acId, cls){ return `<svg class="${cls||'sil'}" viewBox="0 0 120 40" aria-hidden="true">${acSvgInner(acId)}</svg>`; }
/* job cards: a postcard of the destination with your aircraft */
const _artStrip = stripHTML;
stripHTML = function(st, job, opts={}){
  const h=_artStrip(st, job, opts);
  const art = `<div class="jc-art">${islandArt(job.mystery?'????':job.local?job.from+'L':job.to, job.dep, 600, 120, job.ac)}</div>`;
  return h.replace(/(<article class="jcard[^>]*>)/, '$1'+art);
};
/* boarding pass: destination postcard header */
/* hangar cards get a silhouette */

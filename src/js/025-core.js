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
  hill+=` L${x0.toFixed(0)} ${base}`; for(let i=0;i<peaks;i++){ const cx=x0+(x1-x0)*(i+0.5)/peaks, ph=Math.min(h*(0.18+R()*0.35), w*0.09); /* islands stay low and wide, even in a tall frame */ hill+=` Q${(cx-(x1-x0)/peaks/2).toFixed(0)} ${(base-ph*0.4).toFixed(0)} ${cx.toFixed(0)} ${(base-ph).toFixed(0)} T${(x0+(x1-x0)*(i+1)/peaks).toFixed(0)} ${base}`; }
  hill+=` L${w} ${base} L${w} ${h} L0 ${h}Z`;
  const sx=(w*(0.7+R()*0.2)).toFixed(0), sy=(h*(night?0.25:0.32)).toFixed(0);
  const palm=(px)=>`<g transform="translate(${px} ${base-2})" fill="${night?'#06141c':'#0b3b34'}"><path d="M0 0 C2 -14 4 -24 3 -34 L5 -34 C6 -24 4 -12 3 0Z"/><path d="M4 -34 C-6 -40 -14 -36 -18 -30 C-10 -34 -4 -34 4 -32Z"/><path d="M4 -34 C12 -42 22 -38 26 -31 C18 -35 10 -34 4 -32Z"/><path d="M4 -35 C2 -44 -4 -48 -10 -48 C-4 -45 0 -40 3 -34Z"/></g>`;
  const boat = R()>0.4 ? `<g transform="translate(${(w*(0.08+R()*0.2)).toFixed(0)} ${(base+h*0.12).toFixed(0)})"><path d="M-12 0 L12 0 L8 5 L-8 5Z" fill="#fff" opacity=".9"/><path d="M0 -1 L0 -22 L12 -2Z" fill="#fff" opacity=".85"/></g>` : '';
  const stars = night ? Array.from({length:14},()=>`<circle cx="${(R()*w).toFixed(0)}" cy="${(R()*h*0.5).toFixed(0)}" r="${(R()*1.2+0.3).toFixed(1)}" fill="#fff" opacity=".8"/>`).join('') : '';
  const pl = plane ? `<g class="art-plane" transform="translate(${(w*0.32).toFixed(0)} ${(h*0.16).toFixed(0)}) scale(${(Math.min(h/140, w/600)*0.9).toFixed(2)})" opacity=".95">${acSvgInner(plane, '#ffffff')}</g>` : '';
  return `<svg class="art" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea}"/><stop offset="1" stop-color="${night?'#04131b':'#0a5a62'}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#${id}s)"/>${stars}<circle cx="${sx}" cy="${sy}" r="${night?10:16}" fill="${sun}" opacity=".95"/>
    <rect y="${base}" width="${w}" height="${h-base}" fill="url(#${id}w)"/>
    <path d="${hill}" fill="${night?'#0b1d24':'#1f5e45'}" opacity=".95"/><path d="M${x0.toFixed(0)} ${base} Q${((x0+x1)/2).toFixed(0)} ${base+5} ${x1.toFixed(0)} ${base}" stroke="#f3e2b0" stroke-width="3" fill="none" opacity="${night?0.25:0.8}"/>
    ${palm((x1-18).toFixed(0))}${R()>0.5?palm((x0+20).toFixed(0)):''}${boat}${pl}
    <g stroke="#fff" stroke-opacity=".25">${Array.from({length:4},(_,i)=>`<line x1="${(w*0.1+i*40).toFixed(0)}" x2="${(w*0.1+i*40+60).toFixed(0)}" y1="${(base+10+i*7).toFixed(0)}" y2="${(base+10+i*7).toFixed(0)}"/>`).join('')}</g></svg>`;
}
/* side-view silhouettes, 120 x 40 */
/* aircraft side profiles, nose left, in a 120×40 box: real gear legs, props, wings where they sit (redrawn in 0.87) */
const SIL_GEAR=(nx,mx)=>`<path d="M${nx} 27 L${nx} 33" stroke="currentColor" stroke-width="1.6"/><circle cx="${nx}" cy="34" r="2.4"/><path d="M${mx+4} 26 L${mx} 33" stroke="currentColor" stroke-width="2"/><circle cx="${mx}" cy="34" r="3"/>`;
const SIL = {
  high:`<path d="M9 21 C9 18.5 11 17 15 17 L30 17 L36 11.5 L61 11.5 C66 11.5 70 14 76 16 L102 18.5 L106 21 L101 23.5 L72 25.5 L42 27.5 L20 27.5 C13 27.5 9 25.5 9 21 Z"/><path d="M28 9.5 L74 9.5 L74 12 L28 12 Z"/><path d="M54 12 L45 26" stroke="currentColor" stroke-width="1.3"/><path d="M90 17.5 L101 5 L107 5 L106 19.5 Z"/><path d="M95 19.5 L117 19 L117 21.5 L96 22 Z"/><rect x="5.5" y="12" width="2" height="19" rx="1"/><circle cx="8.5" cy="21.5" r="2"/>${SIL_GEAR(15,46)}`,
  low:`<path d="M9 21 C9 18.5 11 17 15 17 L32 17 C36 12 42 11 50 11 C56 11 60 13 64 16 L102 18.5 L106 21 L101 23.5 L72 25.5 L42 27 L20 27 C13 27 9 25.5 9 21 Z"/><path d="M27 24 L74 23.5 L72 27 L29 27.5 Z"/><path d="M90 17.5 L101 5 L107 5 L106 19.5 Z"/><path d="M95 19.5 L117 19 L117 21.5 L96 22 Z"/><rect x="5.5" y="12" width="2" height="19" rx="1"/><circle cx="8.5" cy="21.5" r="2"/>${SIL_GEAR(15,44)}`,
  twin:`<path d="M6 21 C6 18 9 16.5 14 16.5 L28 16.5 L33 12 L64 12 C70 12 74 14 80 16 L104 18.5 L108 21 L103 23.5 L74 25.5 L42 27 L18 27 C10 27 6 25 6 21 Z"/><path d="M30 24 L76 23.5 L74 27 L32 27.5 Z"/><path d="M36 21 C36 19 38 18 42 18 L58 18 L60 22.5 L58 25 L42 25 C38 25 36 23.5 36 21 Z"/><rect x="33.5" y="13" width="2" height="17" rx="1"/><path d="M92 17.5 L103 4 L109 4 L108 19.5 Z"/><path d="M97 19.5 L118 19 L118 21.5 L98 22 Z"/>${SIL_GEAR(13,50)}`,
  jet:`<path d="M3 22 C3 19 7 17 14 16.5 L22 13.5 L30 12.5 L84 13 C92 13.5 98 16 104 19 L106 21.5 L100 24 L84 25.5 L40 26.5 L16 26.5 C8 26.5 3 25 3 22 Z"/><path d="M40 23.5 L74 23 L80 27.5 L44 27.5 Z"/><path d="M74 13.5 C74 11.5 76 10.5 80 10.5 L94 10.5 C97 10.5 98 12 98 13.5 C98 15 97 16.5 94 16.5 L80 16.5 C76 16.5 74 15.5 74 13.5 Z"/><path d="M80 16 L84 13" stroke="currentColor" stroke-width="1.6"/><path d="M96 18 L101 3.5 L106 3.5 L105 19 Z"/><path d="M95 4 L117 3 L117 5.5 L97 6.5 Z"/>${SIL_GEAR(14,58)}`,
  airliner:`<path d="M2 21 C2 17.5 6 15.5 13 15 L20 13 L100 13 C106 13 110 15.5 113 18.5 L114 21 L108 23.5 L90 25.5 L18 26 C8 26 2 24.5 2 21 Z"/><path d="M38 23 L80 22.5 L90 28.5 L46 28.5 Z"/><path d="M46 27 C46 25.5 48 25 52 25 L64 25 L66 27.5 L64 30.5 L52 30.5 C48 30.5 46 29 46 27 Z"/><path d="M100 14 L110 1 L117 1 L115 18 Z"/><path d="M102 17.5 L119 16.5 L119 19 L104 20.5 Z"/>${SIL_GEAR(13,64)}`,
  float:`<path d="M9 19 C9 16.5 11 15 15 15 L30 15 L36 9.5 L61 9.5 C66 9.5 70 12 76 14 L102 16.5 L106 19 L101 21.5 L72 23.5 L42 25 L20 25 C13 25 9 23.5 9 19 Z"/><path d="M28 7.5 L74 7.5 L74 10 L28 10 Z"/><path d="M90 15.5 L101 3 L107 3 L106 17.5 Z"/><path d="M95 17.5 L117 17 L117 19.5 L96 20 Z"/><rect x="5.5" y="10" width="2" height="19" rx="1"/><path d="M14 31 C14 29.5 16 29 20 29 L84 29 L90 31.5 L84 34 L20 34 C16 34 14 32.5 14 31 Z"/><path d="M28 25 L30 29 M64 24 L66 29" stroke="currentColor" stroke-width="1.8"/>`
};
function silType(acId){ const a=AC[acId]; if(!a) return 'high';
  if(['airliner','regional','widebody'].includes(a.cls)) return 'airliner'; if(a.cls==='jet') return 'jet'; if(a.cls==='amph' || acId==='GOOSE') return 'float';
  if(a.cls==='twin' || ['DHC6','KA350','DA62','GOOSE','DC3'].includes(acId)) return 'twin';
  if(['DA40','G36','PC12','TBM','SR22','SF50','A5'].includes(acId) || a.cls==='hp') return 'low';
  return 'high'; }
function acSvgInner(acId, color){ return `<g fill="${color||'currentColor'}" style="color:${color||'currentColor'}">${SIL[silType(acId)]}</g>`; }
function acSvg(acId, cls){ return `<svg class="${cls||'sil'}" viewBox="0 0 120 40" aria-hidden="true">${acSvgInner(acId)}</svg>`; }
/* job cards: a postcard of the destination with your aircraft */
/* boarding pass: destination postcard header */
/* hangar cards get a silhouette */

/* ===================== CHARACTER PORTRAITS (flat illustrated busts, drawn in SVG) ===================== */
const PORTRAIT = {
  mari:     {skin:'#b07a52', hair:'#24160f', style:'pony',   top:'pilot',  topC:'#f4f4f0', acc:['shades-head']},
  dez:      {skin:'#5a3a26', hair:'#141010', style:'short',  top:'overall',topC:'#2a68aa', acc:['cap'], capC:'#7a1f2b'},
  devries:  {skin:'#f0c9a8', hair:'#c9c3b8', style:'bald',   top:'suit',   topC:'#5b6470', acc:['glasses','mustache']},
  marchetti:{skin:'#e8b892', hair:'#d8d4cc', style:'bob',    top:'pilot',  topC:'#eef2f6', acc:['scarf'], scarfC:'#2b4c9a'},
  wilkins:  {skin:'#8a5a3c', hair:'#d6d2cc', style:'curly',  top:'blazer', topC:'#23395d', acc:['glasses']},
  hartwell: {skin:'#f2d0b0', hair:'#bfc3c9', style:'slick',  top:'turtle', topC:'#1c1f24', acc:[]},
  amara:    {skin:'#6b4128', hair:'#18100c', style:'afro',   top:'tee',    topC:'#178a8a', acc:['earrings']},
  calloway: {skin:'#d9a07a', hair:'#d9b25a', style:'messy',  top:'hawaii', topC:'#d9532f', acc:['aviators','stubble']},
  celeste:  {skin:'#f0c3a0', hair:'#8a3b22', style:'long',   top:'elegant',topC:'#f2e6d8', acc:['earrings']},
  rosa:     {skin:'#c08a62', hair:'#2b1a12', style:'bun',    top:'apron',  topC:'#f6f1e7', acc:['headscarf'], scarfC:'#c23b2a'},
  vivienne: {skin:'#7a4a30', hair:'#1a110c', style:'braids', top:'tee',    topC:'#f4f4f0', acc:['shades-head','earrings']},
  abe:      {skin:'#e6b996', hair:'#eeeeea', style:'short',  top:'pilot',  topC:'#f4f4f0', acc:['beard'], stripes:4},
  preston:  {skin:'#f2d2b4', hair:'#5a3b22', style:'slick',  top:'tie',    topC:'#20263a', acc:[]},
  lucille:  {skin:'#6e4630', hair:'#d8d4ce', style:'bun',    top:'cardigan',topC:'#7a5c99', acc:['glasses']}
};
function shade(hex, f){ const n=parseInt(hex.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255; const m=v=>Math.max(0,Math.min(255,Math.round(f<0?v*(1+f):v+(255-v)*f))); return '#'+[m(r),m(g),m(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function portraitSVG(k){ const P=PORTRAIT[k]; if(!P) return null; const sk=P.skin, skD=shade(sk,-.18), hr=P.hair, hrD=shade(hr,-.25), tc=P.topC, tcD=shade(tc,-.2); const A=new Set(P.acc||[]);
  let back='', front='', top='', extra='';
  // hair behind the head
  if(P.style==='long') back=`<path d="M27 44 C25 22 75 22 73 44 L76 80 L24 80 Z" fill="${hr}"/>`;
  if(P.style==='braids') back=`<path d="M28 42 C26 22 74 22 72 42 L74 84 L26 84 Z" fill="${hr}"/><path d="M30 50 V82 M36 52 V84 M64 52 V84 M70 50 V82" stroke="${hrD}" stroke-width="2.4" stroke-dasharray="3 2"/>`;
  if(P.style==='pony') back=`<path d="M66 34 C82 40 80 62 72 70 C74 58 70 46 64 40 Z" fill="${hr}"/>`;
  if(P.style==='afro') back=`<circle cx="50" cy="36" r="25" fill="${hr}"/><circle cx="31" cy="44" r="10" fill="${hr}"/><circle cx="69" cy="44" r="10" fill="${hr}"/>`;
  if(P.style==='bun') back=`<circle cx="50" cy="15" r="8" fill="${hr}"/>`;
  if(P.style==='bob') back=`<path d="M28 44 C26 20 74 20 72 44 L72 58 C66 60 34 60 28 58 Z" fill="${hr}"/>`;
  if(P.style==='curly') back=`<g fill="${hr}"><circle cx="34" cy="30" r="8"/><circle cx="44" cy="23" r="8"/><circle cx="56" cy="23" r="8"/><circle cx="66" cy="30" r="8"/><circle cx="31" cy="40" r="6"/><circle cx="69" cy="40" r="6"/></g>`;
  // body
  top = `<path d="M14 100 C16 78 30 70 50 70 C70 70 84 78 86 100 Z" fill="${tc}"/>`;
  if(P.top==='pilot'){ top += `<path d="M42 71 L50 82 L58 71" fill="none" stroke="${tcD}" stroke-width="2"/><rect x="20" y="76" width="14" height="5" rx="1.5" fill="#1c2a3a" transform="rotate(-14 27 78)"/><rect x="66" y="76" width="14" height="5" rx="1.5" fill="#1c2a3a" transform="rotate(14 73 78)"/>`;
    const n=P.stripes||3; for(let i=0;i<n;i++){ top += `<line x1="${22+i*3}" y1="${80-i*.8}" x2="${22+i*3}" y2="${75-i*.8}" stroke="#e8c15a" stroke-width="1.2" transform="rotate(-14 27 78)"/><line x1="${68+i*3}" y1="${75+i*.8}" x2="${68+i*3}" y2="${80+i*.8}" stroke="#e8c15a" stroke-width="1.2" transform="rotate(14 73 78)"/>`; }
    top += `<rect x="58" y="86" width="9" height="3" rx="1" fill="#e8c15a"/>`; }
  if(P.top==='suit'||P.top==='tie'||P.top==='blazer'){ top += `<path d="M40 71 L50 92 L60 71 Z" fill="#f4f4f0"/><path d="M36 72 L50 100 L30 100 Z M64 72 L50 100 L70 100 Z" fill="${tcD}" opacity=".55"/>`; if(P.top==='tie') top+=`<path d="M48 74 L52 74 L53 92 L50 96 L47 92 Z" fill="#8a1f2b"/>`; }
  if(P.top==='turtle') top += `<rect x="40" y="64" width="20" height="12" rx="5" fill="${tcD}"/>`;
  if(P.top==='overall') top += `<rect x="36" y="80" width="28" height="20" fill="${tcD}"/><circle cx="40" cy="82" r="1.8" fill="#e8e8e8"/><circle cx="60" cy="82" r="1.8" fill="#e8e8e8"/><path d="M38 72 L40 82 M62 72 L60 82" stroke="${tcD}" stroke-width="4"/>`;
  if(P.top==='hawaii') top += `<g fill="#ffd27a" opacity=".85"><circle cx="30" cy="88" r="3"/><circle cx="70" cy="86" r="3"/><circle cx="62" cy="96" r="2.5"/><circle cx="38" cy="97" r="2.5"/></g><path d="M42 71 L50 84 L58 71" fill="none" stroke="${tcD}" stroke-width="2"/>`;
  if(P.top==='apron') top += `<path d="M34 80 H66 V100 H34 Z" fill="#ffffff"/><path d="M38 80 L44 70 M62 80 L56 70" stroke="#ffffff" stroke-width="3"/>`;
  if(P.top==='elegant') top += `<path d="M38 71 C44 80 56 80 62 71" fill="${skD}" opacity=".45"/>`;
  if(P.top==='cardigan') top += `<path d="M44 71 L50 100 L56 71" fill="#f2ede4"/><circle cx="47" cy="84" r="1.3" fill="#d8cfc0"/><circle cx="47" cy="92" r="1.3" fill="#d8cfc0"/>`;
  if(P.top==='tee') top += `<path d="M42 71 C46 76 54 76 58 71" fill="none" stroke="${tcD}" stroke-width="2"/>`;
  // neck + head
  const head = `<rect x="44" y="58" width="12" height="14" rx="4" fill="${skD}"/><ellipse cx="30" cy="46" rx="4" ry="6" fill="${skD}"/><ellipse cx="70" cy="46" rx="4" ry="6" fill="${skD}"/><ellipse cx="50" cy="44" rx="20" ry="23" fill="${sk}"/>`;
  // front hair
  if(P.style==='short') front=`<path d="M30 40 C30 20 70 20 70 40 C64 30 38 30 30 40 Z" fill="${hr}"/>`;
  if(P.style==='pony'||P.style==='long'||P.style==='bob'||P.style==='bun'||P.style==='braids') front=`<path d="M30 44 C28 18 72 18 70 44 C66 30 56 27 50 28 C44 27 34 30 30 44 Z" fill="${hr}"/>`;
  if(P.style==='slick') front=`<path d="M30 40 C30 18 72 18 70 38 C62 28 46 26 34 34 Z" fill="${hr}"/><path d="M40 26 C50 24 60 26 66 32" stroke="${hrD}" stroke-width="1.2" fill="none"/>`;
  if(P.style==='messy') front=`<path d="M29 42 L31 26 L38 30 L42 20 L48 27 L54 19 L58 27 L66 22 L67 32 L72 34 L70 42 C62 31 38 31 29 42 Z" fill="${hr}"/>`;
  if(P.style==='bald') front=`<path d="M30 46 C30 38 33 34 35 33 M70 46 C70 38 67 34 65 33" stroke="${hr}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(P.style==='afro') front=`<path d="M31 40 C34 26 66 26 69 40 C60 33 40 33 31 40 Z" fill="${hr}"/>`;
  if(P.style==='curly') front=`<g fill="${hr}"><circle cx="38" cy="29" r="5"/><circle cx="47" cy="26" r="5"/><circle cx="56" cy="26" r="5"/><circle cx="63" cy="30" r="5"/></g>`;
  // face
  let face = `<ellipse cx="42" cy="46" rx="2.1" ry="2.5" fill="#1c1410"/><ellipse cx="58" cy="46" rx="2.1" ry="2.5" fill="#1c1410"/><path d="M37 40 Q42 37.5 46 40 M54 40 Q58 37.5 63 40" stroke="${hrD}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M50 48 Q48 54 51 55" stroke="${skD}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M43 59 Q50 64 57 59" stroke="#7a2e22" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="54" rx="3.4" ry="2" fill="#e36b5a" opacity=".18"/><ellipse cx="62" cy="54" rx="3.4" ry="2" fill="#e36b5a" opacity=".18"/>`;
  if(A.has('glasses')) extra += `<g fill="none" stroke="#2a2a2a" stroke-width="1.6"><circle cx="42" cy="46" r="5.5"/><circle cx="58" cy="46" r="5.5"/><path d="M47.5 46 H52.5"/></g>`;
  if(A.has('aviators')) extra += `<g fill="#2b3640" stroke="#c9a54a" stroke-width="1"><path d="M35 43 H48 V48 C48 52 37 52 35 48 Z"/><path d="M52 43 H65 V48 C63 52 52 52 52 48 Z"/></g>`;
  if(A.has('shades-head')) extra += `<g fill="#2b3640" stroke="#555" stroke-width=".8"><rect x="36" y="25" width="12" height="5" rx="2.5"/><rect x="52" y="25" width="12" height="5" rx="2.5"/></g>`;
  if(A.has('mustache')) extra += `<path d="M42 56 Q50 52 58 56 Q50 55 42 56 Z" fill="${hr}" stroke="${hr}" stroke-width="2"/>`;
  if(A.has('beard')) extra += `<path d="M31 48 C32 66 42 70 50 70 C58 70 68 66 69 48 C66 58 58 60 50 60 C42 60 34 58 31 48 Z" fill="${hr}"/><path d="M44 60 Q50 63 56 60" stroke="#7a2e22" stroke-width="2" fill="none"/>`;
  if(A.has('stubble')) extra += `<path d="M34 54 C36 64 44 67 50 67 C56 67 64 64 66 54" fill="${hrD}" opacity=".22"/>`;
  if(A.has('earrings')) extra += `<circle cx="30" cy="53" r="2" fill="#e8c15a"/><circle cx="70" cy="53" r="2" fill="#e8c15a"/>`;
  if(A.has('cap')) extra += `<path d="M29 38 C29 18 71 18 71 38 Z" fill="${P.capC}"/><path d="M48 36 H78 C78 40 66 41 58 40 Z" fill="${shade(P.capC,-.25)}"/><circle cx="50" cy="20" r="2" fill="${shade(P.capC,-.3)}"/>`;
  if(A.has('headscarf')) extra += `<path d="M29 38 C28 18 72 18 71 38 C64 31 36 31 29 38 Z" fill="${P.scarfC}"/><circle cx="50" cy="20" r="3" fill="${shade(P.scarfC,.2)}" opacity=".6"/>`;
  if(A.has('scarf')) extra += `<path d="M38 68 C44 76 56 76 62 68 L64 74 C56 82 44 82 36 74 Z" fill="${P.scarfC}"/><path d="M58 76 L62 92 L56 90 Z" fill="${P.scarfC}"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${back}${top}${head}${front}${face}${extra}</svg>`; }
const _ptAvatar = avatar;
avatar = function(k){ const svg=portraitSVG(k); if(!svg) return _ptAvatar(k); const c=CAST[k]||{}; return `<div class="avatar portrait" style="background:${c.col||'#0b746f'}" aria-hidden="true">${svg}</div>`; };

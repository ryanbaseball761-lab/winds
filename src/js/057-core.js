/* ===================== EVERY STORYLINE HAS ITS OWN COLOR ===================== */
const ARC_COLORS = {
  'Coral Wing':'#0b8a7a', 'The Buyout':'#2d4f9e', 'Hartwell':'#a0671c', 'Own Wings':'#c2410c', 'The Tour':'#b0306a', 'Your Company':'#1f9d55',
  'The Logbook':'#7a5c3a', 'Starling':'#e8782a', 'Coast Watch':'#c0392b', 'The Short Ones':'#6a49a8', 'Going Abroad':'#1d6fa5', 'Island Tales':'#6f8a1f'
};
for(const k in ARC_COLORS){ if(ARC_META[k]) ARC_META[k].col = ARC_COLORS[k]; }
function arcColor(arc){ return ARC_COLORS[arc] || (ARC_META[arc]&&ARC_META[arc].col) || '#0b8a7a'; }
const _clrKind = jobKind;
jobKind = function(job){ const k=_clrKind(job); if(job.kind==='story'){ const m=STORY.find(x=>x.id===job.story); if(m) k.c=arcColor(m.arc); } return k; };
const _clrHero = chapterHero;
chapterHero = function(job){ const h=_clrHero(job); const m=STORY.find(x=>x.id===job.story); return m ? h.replace(/style="--arc:[^"]*"/, `style="--arc:${arcColor(m.arc)}"`) : h; };
const _clrCamp = campaignCard;
campaignCard = function(st){ const h=_clrCamp(st); const t=tpl(h); const mn=t.content.querySelector('.main-next'); if(mn){ const k=(mn.querySelector('.mn-kicker')||{}).textContent||''; const arc=Object.keys(ARC_COLORS).find(a=>k.endsWith(a)); if(arc) mn.style.setProperty('--arc', arcColor(arc)); } return t.innerHTML; };

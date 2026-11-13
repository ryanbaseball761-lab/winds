/* ===================== EVERY STORYLINE HAS ITS OWN COLOR ===================== */
const ARC_COLORS = {
  'Coral Wing':'#0b8a7a', 'The Buyout':'#2d4f9e', 'Hartwell':'#a0671c', 'Own Wings':'#c2410c', 'The Tour':'#b0306a', 'Your Company':'#1f9d55',
  'The Logbook':'#7a5c3a', 'Starling':'#e8782a', 'Coast Watch':'#c0392b', 'The Short Ones':'#6a49a8', 'Going Abroad':'#1d6fa5', 'Island Tales':'#6f8a1f'
};
for(const k in ARC_COLORS){ if(ARC_META[k]) ARC_META[k].col = ARC_COLORS[k]; }
function arcColor(arc){ return ARC_COLORS[arc] || (ARC_META[arc]&&ARC_META[arc].col) || '#0b8a7a'; }
function jobKind(job){ const k=jobKindBase(job); if(job.kind==='story'){ const m=STORY.find(x=>x.id===job.story); if(m) k.c=arcColor(m.arc); } return k; }



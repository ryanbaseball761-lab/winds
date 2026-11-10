/* ===================== the chapter story lives in the cutscene; the flight screen stays short ===================== */
(function(){ const _pf=proFor; proFor=function(id){ const base=_pf(id); const m=CRIME.find(x=>x.id===id); if(!m) return base; const mm=(typeof dynM==='function'&&S.st)?dynM(S.st,m):m;
  const here=AP[m.from]?`${AP[m.from].n}`:''; const brief=(mm.brief||[]).map(t=>[here, null, t]); return (base||[]).concat(brief); }; })();


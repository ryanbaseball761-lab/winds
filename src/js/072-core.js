/* ================= 1. the cabin goes quiet: no passenger chatter or cabin requests; safety calls stay ================= */
(function(){ const _ct=cabinTick; cabinTick=function(){ const a=S.st&&S.st.active; S._cabMute=true; try{ return _ct.apply(this, arguments); } finally { S._cabMute=false; if(a&&a.cab&&a.cab.log) a.cab.log=a.cab.log.filter(m=>m.kind); } }; })();
(function(){ const _sp=spokenText; spokenText=function(m){ if(!m.kind) return null; return _sp(m); }; })();


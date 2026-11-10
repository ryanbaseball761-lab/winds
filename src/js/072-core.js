/* ================= 1. the cabin goes quiet: no passenger chatter or cabin requests; safety calls stay ================= */
(function(){ const _ct=cabinTick; cabinTick=function(){ const a=S.st&&S.st.active; S._cabMute=true; try{ return _ct.apply(this, arguments); } finally { S._cabMute=false; if(a&&a.cab&&a.cab.log) a.cab.log=a.cab.log.filter(m=>m.kind); } }; })();
(function(){ const _t=toast; toast=function(msg){ if(S._cabMute) return; return _t.apply(this, arguments); }; })();
(function(){ const _sp=spokenText; spokenText=function(m){ if(!m.kind) return null; return _sp(m); }; })();
(function(){ const _tk=takeover; takeover=function(o){ if(o && /Request from the cabin/.test(o.kicker||'')) return; return _tk(o); }; })();
/* no "sim rate" call on descent */
(function(){ const _ss=safeSay; safeSay=function(key, text, every){ if(key==='rate') return; return _ss(key, text, every); }; })();


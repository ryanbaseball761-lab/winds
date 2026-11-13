/* ================= 1. the cabin goes quiet: no passenger chatter or cabin requests; safety calls stay ================= */
function spokenText(m){ if(!m.kind) return null; return spokenTextBase(m); }


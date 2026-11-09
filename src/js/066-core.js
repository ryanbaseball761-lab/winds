/* ===================== Checkrides: an A or B (or 70+) with no crash is a pass ===================== */
const _ckEasy = applyResult;
applyResult = function(st, job, f, res){ if(job.kind==='check' && f && !res.crash && (res.score>=70 || res.grade==='A' || res.grade==='B')){ f.tasks=(job.tasks||[]).slice(); if(f.landing==='hard') f.landing='firm'; res.score=Math.max(70, res.score); } return _ckEasy(st, job, f, res); };

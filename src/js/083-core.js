/* ===================== FLIGHT SCREEN, REORGANIZED: ticket first, then three plain steps ===================== */
(function(){ const s=document.createElement('style'); s.textContent=`
.fl-how{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
.fl-step{display:grid;grid-template-columns:30px 1fr;gap:10px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.fl-step > span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:var(--sea);color:#140f05}
.fl-step b{display:block;margin-bottom:3px}.fl-step p{margin:0;font-size:13px;color:var(--muted);line-height:1.45}.fl-step p b{display:inline;color:var(--ink)}
.fl-tasks{margin-bottom:14px}.fl-tasks ul{margin:6px 0 0}
@media (max-width:820px){.fl-how{grid-template-columns:1fr}}`; document.head.appendChild(s); })();


/* ===================== REWORK: a calm story card and a clean Side jobs page ===================== */

/* ---- the next-chapter action, in plain words ---- */


/* ---- the Side jobs page ---- */
function jobTabOf(j){ return j.network?'network':j.special||j.vip?'special':'legit'; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="job-tab"]'); if(!b) return; S.jobTab=b.dataset.v; S.allJobs=false; S.keepScroll=true; render(); });
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="job-sort"]'); if(!b) return; S.jobSort=b.value; S.keepScroll=true; render(); });

(function(){ const s=document.createElement('style'); s.textContent=`
.story-card{padding:22px 24px;border-top:3px solid var(--arc)}
.sc-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.sc-act{margin:0;font-family:var(--f-mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--arc)}
.sc-m{display:flex;gap:14px;align-items:center;font-size:13px;color:var(--muted)}.sc-m b{color:var(--ink);font-family:var(--f-mono)}.sc-m b.hot{color:#e5533d}
.sc-rank{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--arc) 18%,transparent);color:var(--arc)}
.sc-bar{display:flex;gap:3px;margin:12px 0 14px}.sc-bar i{flex:1;height:5px;border-radius:3px;background:color-mix(in srgb,var(--c) 20%,transparent)}.sc-bar i.d{background:var(--c)}.sc-bar i.n{background:var(--c);opacity:.55}
.sc-prev{margin:0 0 16px;font-size:14px;color:var(--muted)}.sc-prev span{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--arc);margin-right:6px}
.sc-next{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.sc-k{margin:0;font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.sc-next h2{font-size:28px;margin:4px 0 6px}.sc-hook{margin:0 0 12px;font-size:16px;color:var(--ink);opacity:.85}
.sc-meta{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:0 0 16px;font-size:13px;color:var(--muted)}.sc-meta b{color:var(--ink);font-family:var(--f-mono)}
.sc-whos{display:inline-flex;gap:12px;align-items:center}.sc-who{display:inline-flex;flex-direction:row;align-items:center;gap:6px;white-space:nowrap}.sc-who .avatar{width:24px!important;height:24px!important;min-width:24px;flex:none;margin:0}
.sc-avw{width:26px;height:26px;display:inline-block;flex:none;border-radius:50%;overflow:hidden}.sc-avw > *{width:100%!important;height:100%!important;min-width:0!important;margin:0!important}.sc-meta .sc-whos{flex-basis:100%;margin-top:6px}
.sc-go{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.btn.big{padding:12px 22px;font-size:16px}
.board2{max-width:1180px}
.b2-status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;font-size:13px;color:var(--muted);padding:4px 0 14px;border-bottom:1px solid var(--line);margin-bottom:16px}
.b2-here b{font-family:var(--f-mono);color:var(--ink);margin-right:4px}.b2-sp{flex:1}
.b2-dot::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#8f897e;margin-right:6px;vertical-align:1px}.b2-dot.ok::before{background:#7cbf6f}
.b2-story{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 18px;border:1px solid var(--line);border-left:4px solid var(--arc);border-radius:12px;background:var(--surface);margin-bottom:12px}
.b2-story b{font-size:17px}.b2-story-go{display:flex;gap:8px;align-items:center}
.b2-note{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border:1px solid var(--line);border-radius:10px;margin-bottom:10px;font-size:14px}
.b2-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:22px 0 6px}.b2-head h2{margin:0;font-size:20px}.b2-head select{width:auto;margin-left:auto;padding:6px 10px;font-size:13px}
.b2-tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:3px}.b2-tabs button{border:0;background:transparent;color:var(--muted);font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer}.b2-tabs button.on{background:var(--ink);color:var(--bg)}.b2-tabs small{opacity:.6;margin-left:2px}
.b2-hint{margin:0 0 10px}
.b2-grid{grid-template-columns:repeat(auto-fill,minmax(330px,1fr))!important}
.b2-grid .jc-art{display:none}
.b2-grid .jcard{padding-top:4px}.b2-grid .net-tag{display:none}.b2-grid .jcard:has(.net-tag){border-color:#6b2a20;box-shadow:inset 3px 0 0 #c23a2b}
.b2-grid .chips .chip:not(.warn):not(.good):not(.vio){display:none}
.b2-foot{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.b2-more summary{cursor:pointer;font-weight:600}
@media (max-width:760px){.b2-foot{grid-template-columns:1fr}}`; document.head.appendChild(s); })();

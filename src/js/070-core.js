/* ===================== NOIR: a darker, criminal look ===================== */
const _nrApply = applyTheme;
applyTheme = function(){ _nrApply(); const r=document.documentElement; if(themePref()==='light'){ delete r.dataset.noir; } else { r.dataset.noir='1'; r.dataset.theme='dark'; } };
THEME_LBL.auto='Theme: noir'; THEME_LBL.dark='Theme: noir'; THEME_LBL.light='Theme: light';
const _nrBand = band;
band = function(){ return _nrBand().replace('Caribbean career for MSFS', 'Every cargo has a price'); };
(function(){ const css=`
:root[data-noir]{--bg:#0a0a0c;--surface:#131316;--surface-2:#0f0f12;--ink:#ece6da;--muted:#8f897e;--line:#26262b;
  --sea:#c8962a;--sea-soft:#2a2112;--coral:#c23a2b;--coral-soft:#2b1210;--sand:#1d1a14;--sky:#8a9bb0;--sky-soft:#151a21;
  --good:#7cbf6f;--warn:#d9a441;--bad:#e5533d;--violet:#a68cd9;
  --strip-pax:#18160f;--strip-cargo:#11151a;--strip-vip:#1d1110;--strip-story:#1a1610;--strip-check:#17131d;
  --side:#060607;--side-2:#0f0f11;--side-ink:#e9e3d6;--side-mut:#7d786f;
  --shadow:0 1px 2px rgba(0,0,0,.6),0 8px 24px rgba(0,0,0,.45);color-scheme:dark}
:root[data-noir] body{background:radial-gradient(1100px 520px at 75% -8%,rgba(194,58,43,.10),transparent 60%),radial-gradient(900px 500px at 0% 100%,rgba(200,150,42,.05),transparent 60%),var(--bg)}
:root[data-noir] .band{background:#050506;border-right:1px solid #1a1a1d}
:root[data-noir] .label,:root[data-noir] .mn-kicker,:root[data-noir] .section-title .small{font-family:var(--f-mono);letter-spacing:.14em;text-transform:uppercase}
:root[data-noir] .panel,:root[data-noir] section.panel{border-color:#232327;background:linear-gradient(180deg,#141417,#111113)}
:root[data-noir] .btn.primary{background:#c8962a;border-color:#c8962a;color:#140f05}
:root[data-noir] .btn.action{background:#b8321f;border-color:#b8321f;color:#fff}
:root[data-noir] .btn.action:hover{background:#d23b2c}
:root[data-noir] .today,:root[data-noir] .mn-art,:root[data-noir] .jcard > :first-child,:root[data-noir] .chapter-hero{filter:saturate(.5) brightness(.72) contrast(1.08)}
:root[data-noir] .today h1,:root[data-noir] .today .big{letter-spacing:-.01em}
:root[data-noir] .hq{border-top:3px solid var(--arc);background:linear-gradient(180deg,#151416,#0f0f11)}
:root[data-noir] .hq .main-next{background:#0c0c0e;border:1px solid #232327}
.hq .mn-in{position:relative}
.hq-stamp{position:absolute;top:4px;right:16px;transform:rotate(-8deg);font-family:var(--f-mono);font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#d23b2c;border:2px solid #d23b2c;border-radius:4px;padding:3px 10px;opacity:.85}
.hq-nerve{margin-top:6px;font-size:13px}.hq-nerve span{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--arc);margin-right:6px}
:root[data-noir] .hq-prev{background:rgba(255,255,255,.03)}
:root[data-noir] .toast2,:root[data-noir] #toasts > *{background:#141416;border-color:#2a2a2e;color:#ece6da}
:root[data-noir] .choice{border-left:4px solid var(--arc,#c23a2b)}
:root[data-noir] .chip{background:#1a1a1d;border-color:#2a2a2e;color:#cfc8bb}
:root[data-noir] .side-foot,:root[data-noir] .band .muted{color:#6d685f}`;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); try{ applyTheme(); }catch(_){} })();

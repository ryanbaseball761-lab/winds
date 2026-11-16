/* ===================== GLASS COCKPIT THEME (0.65) =====================
   One visual system for the whole app, loaded last so it wins over the older layers:
   near-black, square corners, 1px lines, one amber accent for "do this", avionics-style numbers.
   Green and red are only for good/bad status. Boxes inside boxes are flattened into ruled sections.
   The top bar (chrome.js band) replaces the old sidebar. */

(function(){
  // sharper type: IBM Plex Sans / Condensed alongside the Plex Mono already loaded
  const l=document.createElement('link'); l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&display=swap';
  document.head.appendChild(l);
  document.documentElement.setAttribute('data-theme','dark');
  document.documentElement.classList.add('ckp');
})();

const CK_CSS = `
:root,:root[data-noir],:root[data-theme]{
  --bg:#0a0c0e!important;--surface:#111417!important;--surface-2:#0d1013!important;--surface-3:#171b1f!important;
  --ink:#e8eaec!important;--muted:#8f989f!important;--dim:#7d868d!important;--line:#22282d!important;--line-2:#323a41!important;
  --amb:#f0a53a;--amb-ink:#140c00;--amb-soft:rgba(240,165,58,.10);
  --sea:#f0a53a!important;--sea-soft:rgba(240,165,58,.10)!important;--coral:#f0a53a!important;--coral-soft:rgba(240,165,58,.10)!important;
  --sky:#9fb4c4!important;--sky-soft:#151c22!important;--violet:#a9a3c4!important;--sand:#191714!important;
  --good:#5cc97a!important;--warn:#f0a53a!important;--bad:#ef5b4c!important;
  --strip-pax:var(--surface)!important;--strip-cargo:var(--surface)!important;--strip-vip:var(--surface)!important;--strip-story:var(--surface)!important;--strip-check:var(--surface)!important;
  --shadow:none!important;--r:0px!important;
  --f-display:"IBM Plex Sans Condensed","IBM Plex Sans",ui-sans-serif,system-ui,sans-serif!important;
  --f-body:"IBM Plex Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important;
  --f-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
  color-scheme:dark}

/* ---- everything square, flat, no glow ---- */
html.ckp *,html.ckp *::before,html.ckp *::after{border-radius:0!important;box-shadow:none!important;text-shadow:none!important}
html.ckp .simdot,html.ckp .b2-dot,html.ckp .lad-dot,html.ckp .sr-dot,html.ckp .map-pulse,html.ckp .dot,html.ckp .cb-nb{border-radius:50%!important}
html.ckp,html.ckp body{background:var(--bg)!important;color:var(--ink)}
html.ckp body{margin:0;font-family:var(--f-body);font-size:15px;letter-spacing:0;background-image:none!important}
html.ckp ::selection{background:var(--amb);color:var(--amb-ink)}
html.ckp :focus-visible{outline:2px solid var(--amb)!important;outline-offset:2px}

/* ---- type: one scale ---- */
html.ckp h1,html.ckp h2,html.ckp h3,html.ckp h4{font-family:var(--f-display);font-weight:600;letter-spacing:0;color:var(--ink)}
html.ckp main h1{font-size:34px;line-height:1.08}
html.ckp main h2{font-size:22px}
html.ckp main h3{font-size:16px}
html.ckp .label,html.ckp .section-title .small,html.ckp .mn-kicker,html.ckp .ch-kicker{font-family:var(--f-mono)!important;font-size:11px!important;font-weight:500!important;letter-spacing:.12em!important;text-transform:uppercase;color:var(--muted)!important}
html.ckp .muted{color:var(--muted)}
html.ckp .mono,html.ckp kbd,html.ckp code{font-family:var(--f-mono)}
html.ckp a{color:var(--ink);text-decoration-color:var(--line-2);text-underline-offset:3px}
html.ckp a:hover{text-decoration-color:var(--amb)}

/* ---- panels: flat sheets with a hairline; nested ones become ruled sections ---- */
html.ckp .panel,html.ckp section.panel{background:var(--surface)!important;border:1px solid var(--line)!important;padding:20px 22px}
html.ckp .panel .panel,html.ckp .panel .card,html.ckp .panel .tile{background:transparent!important;border:0!important;border-top:1px solid var(--line)!important;padding:14px 0 0!important}
html.ckp .grid-2>.panel,html.ckp .grid-3>.panel{border-top:2px solid var(--line-2)!important}
html.ckp .section-title{border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:14px}
html.ckp .section-title h2{font-size:20px;font-weight:600}
html.ckp hr{border:0;border-top:1px solid var(--line)}

/* ---- buttons: outlined by default, amber = the thing to do ---- */
html.ckp .btn{background:transparent!important;border:1px solid var(--line-2)!important;color:var(--ink)!important;font-family:var(--f-display);font-weight:600;font-size:13.5px;letter-spacing:.04em;text-transform:uppercase;padding:8px 14px;min-height:36px;transition:background-color .12s,border-color .12s,color .12s;filter:none!important}
html.ckp .btn:hover{border-color:var(--ink)!important;background:var(--surface-3)!important}
html.ckp .btn.sm{font-size:12px;padding:5px 10px;min-height:30px}
html.ckp .btn.big{font-size:15px;padding:12px 22px;min-height:46px}
html.ckp .btn.primary,html.ckp .btn.action,html.ckp .jc-go .btn,html.ckp .btn.go,html.ckp .btn.accept{background:var(--amb)!important;border-color:var(--amb)!important;color:var(--amb-ink)!important}
html.ckp .btn.primary:hover,html.ckp .btn.action:hover{background:#ffb54e!important;border-color:#ffb54e!important}
html.ckp .btn.primary svg,html.ckp .btn.action svg{color:var(--amb-ink)}
html.ckp .btn.danger{color:var(--bad)!important;border-color:rgba(239,91,76,.45)!important}
html.ckp .btn.ghost{border-color:transparent!important}
html.ckp .btn.ghost:hover{border-color:var(--line-2)!important}
html.ckp .btn:disabled{opacity:.4}
html.ckp .btn:active{transform:none}

/* ---- chips: square tags ---- */
html.ckp .chip,html.ckp .badge{background:transparent!important;border:1px solid var(--line-2)!important;color:var(--muted)!important;font-family:var(--f-mono);font-size:10.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px}
html.ckp .chip.good{color:var(--good)!important;border-color:rgba(92,201,122,.4)!important}
html.ckp .chip.bad{color:var(--bad)!important;border-color:rgba(239,91,76,.45)!important}
html.ckp .chip.warn,html.ckp .chip.new,html.ckp .chip.sea{color:var(--amb)!important;border-color:rgba(240,165,58,.45)!important}

/* ---- form controls ---- */
html.ckp input,html.ckp select,html.ckp textarea{background:var(--surface-2)!important;border:1px solid var(--line-2)!important;color:var(--ink)!important;font-family:var(--f-body)}
html.ckp input:focus,html.ckp select:focus,html.ckp textarea:focus{border-color:var(--amb)!important;outline:none}
html.ckp .field span{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

/* ---- meters and bars: thin, flat ---- */
html.ckp .meter,html.ckp .pf-bar,html.ckp .cb-xp,html.ckp .xp{background:var(--line)!important;height:4px}
html.ckp .meter>i,html.ckp .meter>span,html.ckp .pf-bar>i,html.ckp .xp>i,html.ckp .cb-xp>i{background:var(--amb)!important}

/* ===================== TOP BAR ===================== */
html.ckp #app{display:block!important}
html.ckp .cbar{position:sticky;top:0;z-index:20;background:#07090b!important;border-bottom:1px solid var(--line);backdrop-filter:none!important;padding:0!important;color:var(--ink)}
.cb-row{display:flex;align-items:stretch;height:52px;padding:0 16px;gap:18px;max-width:1440px;margin:0 auto}
.cb-brand{display:flex;align-items:center;gap:9px;background:none;border:0;color:var(--ink);cursor:pointer;padding:0;flex:none}
.cb-brand .logo{width:24px;height:24px;color:var(--amb)}
.cb-brand b{font-family:var(--f-display);font-size:15px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.cb-tabs{display:flex;align-items:stretch;gap:2px;margin-left:10px}
.cb-tab{position:relative;display:flex;align-items:center;gap:7px;background:none;border:0;border-bottom:2px solid transparent;color:var(--muted);font-family:var(--f-display);font-size:13.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:0 14px;cursor:pointer}
.cb-tab:hover{color:var(--ink);background:#0f1215}
.cb-tab.on{color:var(--ink);border-bottom-color:var(--amb)}
.cb-nb{display:inline-grid;place-items:center;min-width:17px;height:17px;padding:0 4px;background:var(--amb);color:var(--amb-ink);font:600 10.5px/1 var(--f-mono);font-style:normal}
.cb-hud{display:flex;align-items:center;gap:0;margin-left:auto;flex:none}
.cb-ro{display:flex;flex-direction:column;justify-content:center;padding:0 14px;height:100%;border-left:1px solid var(--line);background:none;border-top:0;border-right:0;border-bottom:0;color:var(--ink);text-align:left;font:inherit;line-height:1.15}
.cb-ro small{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.cb-ro b{font-size:13.5px;font-weight:500;white-space:nowrap;display:flex;align-items:center;gap:6px}
button.cb-ro{cursor:pointer}button.cb-ro:hover{background:#0f1215}
.cb-ro.heat-chip.warm b{color:var(--amb)}.cb-ro.heat-chip.hot b{color:var(--bad)}
.cb-ro.dirty-chip b{color:#c9b98a}
.cb-sim .simdot{width:7px;height:7px;background:var(--dim);display:inline-block}.cb-sim .simdot.on{background:var(--good)}
.cb-sim #sim-band{font-size:12px;color:var(--muted)}.cb-sim.on #sim-band{color:var(--good)}
.cb-ic{position:relative;display:grid;place-items:center;width:44px;height:100%;background:none;border:0;border-left:1px solid var(--line);color:var(--muted);cursor:pointer}
.cb-ic:hover{color:var(--ink);background:#0f1215}.cb-ic svg{width:18px;height:18px}
.cb-ic.bell b{position:absolute;top:10px;right:8px;min-width:15px;height:15px;padding:0 3px;background:var(--amb);color:var(--amb-ink);font:600 9.5px/15px var(--f-mono);text-align:center}
.cb-sub{display:flex;align-items:center;gap:16px;height:36px;padding:0 16px;border-top:1px solid var(--line);max-width:1440px;margin:0 auto;font-size:12.5px;color:var(--muted)}
.cb-pilot{display:flex;align-items:center;gap:10px;min-width:0}
.cb-pilot b{color:var(--ink);font-weight:600;white-space:nowrap}
.cb-pilot>span:not(.cb-xp){white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cb-xp{display:block;width:70px;flex:none}.cb-xp i{display:block;height:100%}
.cb-pilot small{font-size:11px;color:var(--dim);white-space:nowrap}
.cb-booked{display:flex;align-items:center;gap:8px;background:none;border:1px solid rgba(240,165,58,.45);color:var(--amb);padding:3px 10px;cursor:pointer;font:inherit}
.cb-booked small{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase}
.cb-booked b{font-size:12.5px;font-weight:600}
.cb-booked:hover{background:var(--amb-soft)}
html.ckp .cbar .now-pill{margin-left:auto;display:flex;align-items:center;gap:10px;background:none!important;border:0!important;padding:0!important;color:var(--ink);max-width:60%}
html.ckp .cbar .now-pill>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px}
html.ckp .cbar .now-pill>span::before{content:"NEXT  ";font-family:var(--f-mono);font-size:10px;letter-spacing:.14em;color:var(--amb);white-space:pre}
html.ckp .cbar .now-pill .btn{min-height:26px;padding:3px 10px;font-size:11.5px}
.cb-sync{font-size:11px;color:var(--dim);white-space:nowrap}
.cb-sub .now-pill + .cb-sync{margin-left:0}.cb-sub>.cb-sync:only-child,.cb-sub .cb-booked + .cb-sync,.cb-sub .cb-pilot + .cb-sync{margin-left:auto}
html.ckp .urgent-host{max-width:1440px;margin:0 auto;padding:0 16px 8px}
html.ckp .side,html.ckp .mrail,html.ckp .tb-in{display:none!important}
html.tw-app .cbar{-webkit-app-region:drag}html.tw-app .cbar button,html.tw-app .cbar a{-webkit-app-region:no-drag}

/* page body */
html.ckp main,html.ckp main.wrap{max-width:1440px!important;margin:0 auto;padding:22px 24px 72px!important;width:100%}
html.ckp .subtabs{display:flex;gap:0;border-bottom:1px solid var(--line);margin:-6px 0 20px;background:none!important;padding:0!important;overflow-x:auto;scrollbar-width:none}
html.ckp .subtabs button{background:none!important;border:0!important;border-bottom:2px solid transparent!important;color:var(--muted)!important;font-family:var(--f-display);font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:9px 14px!important;white-space:nowrap;cursor:pointer}
html.ckp .subtabs button:hover{color:var(--ink)!important}
html.ckp .subtabs button.on{color:var(--ink)!important;border-bottom-color:var(--amb)!important}

/* flying: just the content */
html.ckp body.flying .cb-sub{display:none}

@media (max-width:1180px){ .cb-pilot>span:not(.cb-xp),.cb-sync,.cb-sim{display:none} }
@media (max-width:980px){
  .cb-row{flex-wrap:wrap;height:auto;padding:0 12px;gap:0}
  .cb-brand{height:44px}.cb-brand b{font-size:13px}
  .cb-hud{height:44px}
  .cb-tabs{order:3;flex-basis:100%;margin:0 -12px;border-top:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
  .cb-tab{flex:1;justify-content:center;height:42px;padding:0 10px;font-size:12px}
  .cb-ro{padding:0 10px}.cb-time{display:none!important}
  .cb-sub{height:auto;min-height:34px;padding:6px 12px;flex-wrap:wrap;gap:8px 12px}
  html.ckp .cbar .now-pill{max-width:100%;margin-left:0;flex:1 1 100%;justify-content:space-between}
  html.ckp main,html.ckp main.wrap{padding:16px 16px 72px!important}
  html.ckp main h1{font-size:28px}
}
@media (max-width:520px){ .cb-brand b{display:none}.cb-ro.cash{border-left:0}.cb-ro small{font-size:9px}.cb-ic{width:38px}.cb-ro{padding:0 8px}.cb-ro b{font-size:12.5px} .cb-pilot small{display:none} }
`;
(function(){ const s=document.createElement('style'); s.id='ck-theme'; s.textContent=CK_CSS; document.head.appendChild(s);
  // styles injected later by other modules must not outrank the theme: keep it last in <head>
  new MutationObserver(()=>{ const t=document.getElementById('ck-theme'), p=document.getElementById('ck-pages'); if(!t||!p) return; const last=document.head.lastElementChild; if(last!==p && [...document.head.children].slice([...document.head.children].indexOf(p)+1).some(e=>e.tagName==='STYLE')){ document.head.appendChild(t); document.head.appendChild(p); } }).observe(document.head,{childList:true}); })();

/* ===================== PAGES ===================== */
const CK_PAGES = `
/* shared: a row of avionics readouts (label over value, hairline dividers) */
.ro-strip{display:flex;flex-wrap:wrap;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.ro-strip>div{padding:9px 18px 9px 0;margin-right:18px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
.ro-strip>div:last-child{border-right:0;margin-right:0}
.ro-strip small{font-family:var(--f-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.ro-strip b{font-size:14.5px;font-weight:500;color:var(--ink);white-space:nowrap}

/* ---- Story: the next chapter is a full-width scene with the title over it ---- */
html.ckp .story-card{position:relative;overflow:hidden;padding:0!important;border:1px solid var(--line)!important;border-top:2px solid var(--amb)!important;background:#07090b!important;min-height:440px;display:flex;flex-direction:column;animation:none!important}
html.ckp .sc-art{position:absolute;inset:0;z-index:0}
html.ckp .sc-art>*{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background-size:cover!important;background-position:60% 40%!important}
html.ckp .story-card::after{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,rgba(7,9,11,.97) 0%,rgba(7,9,11,.88) 42%,rgba(7,9,11,.35) 75%,rgba(7,9,11,.15) 100%),linear-gradient(0deg,rgba(7,9,11,.9),transparent 45%)}
html.ckp .story-card>*:not(.sc-art){position:relative;z-index:1}
html.ckp .sc-top{padding:22px 32px 0}
html.ckp .sc-act{font-family:var(--f-mono);font-size:11px;letter-spacing:.18em;color:var(--amb)!important}
html.ckp .sc-bar{margin:12px 32px 0!important;gap:2px!important;max-width:560px}
html.ckp .sc-bar i{height:3px!important;background:rgba(255,255,255,.12)!important}
html.ckp .sc-bar i.d{background:var(--ink)!important}html.ckp .sc-bar i.n{background:var(--amb)!important}
html.ckp .sc-prev{margin:16px 32px 0!important;max-width:620px;font-size:13.5px}
html.ckp .sc-prev span{color:var(--dim)!important}
html.ckp .sc-next{background:none!important;border:0!important;padding:28px 32px 30px!important;margin-top:auto;max-width:760px;animation:none!important}
html.ckp .sc-k{color:var(--muted)!important}
html.ckp .sc-next h2{font-size:52px!important;font-weight:600;line-height:1;margin:8px 0 12px!important;letter-spacing:-.01em}
html.ckp .sc-hook{font-size:18px!important;opacity:1!important;color:#cfd4d8!important;margin:0 0 20px!important;max-width:620px}
html.ckp .sc-meta.ro-strip{display:flex!important;gap:0!important;margin:0 0 16px!important;font-size:inherit}
html.ckp .sc-whos{display:flex!important;align-items:center;gap:14px!important;margin:0 0 22px;font-size:13px;color:var(--muted)}
html.ckp .sc-whos>small{font-family:var(--f-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
html.ckp .sc-avw{border-radius:0!important;width:28px!important;height:28px!important;border:1px solid var(--line-2)}
html.ckp .sc-go{gap:16px!important}
html.ckp .sc-m{gap:18px}.sc-rank{background:none!important;border:1px solid var(--line-2);color:var(--ink)!important}
html.ckp .sh-stats{display:flex!important;gap:0!important;padding:0!important}
html.ckp .sh-stats>div{flex:1;padding:14px 20px;border-right:1px solid var(--line)}
html.ckp .sh-stats>div:last-child{border-right:0}
html.ckp .sh-stats span{font-family:var(--f-mono);font-size:10px!important;letter-spacing:.14em;color:var(--dim)!important}
html.ckp .sh-stats b{font-family:var(--f-mono);font-size:22px!important;font-weight:500}
html.ckp .sh-time li{border-left:0}html.ckp .sh-n{border-radius:0!important;background:none!important;border:1px solid var(--line-2);color:var(--muted)!important;font-family:var(--f-mono)}
html.ckp .sh-p .avatar,html.ckp .avatar{border-radius:0!important}
html.ckp .trust{background:var(--line)!important;height:3px!important}html.ckp .trust i{background:var(--amb)!important}
html.ckp .sh-act h4{font-family:var(--f-display);font-size:16px}
html.ckp .sh-time .sh-ch{color:var(--amb)!important}

/* ---- one amber per screen: list-row buttons are outlined until hovered ---- */
html.ckp .jrow .btn.primary,html.ckp .jr-go .btn,html.ckp .btn.jc-go,html.ckp .jlist .btn.primary,html.ckp .cards .btn.primary,html.ckp table .btn.primary{background:transparent!important;border-color:var(--line-2)!important;color:var(--ink)!important}
html.ckp .jrow:hover .btn.jc-go,html.ckp .btn.jc-go:hover{background:var(--amb)!important;border-color:var(--amb)!important;color:var(--amb-ink)!important}
html.ckp .btn.jc-go svg{width:14px;height:14px;fill:currentColor}
/* segmented controls become underline tabs */
html.ckp .diff,html.ckp .b2-tabs,html.ckp .hg-tabs,html.ckp .seg,html.ckp .tabs{display:inline-flex;gap:0;background:none!important;border:0!important;border-bottom:1px solid var(--line)!important;padding:0!important}
html.ckp .diff button,html.ckp .b2-tabs button,html.ckp .hg-tabs button,html.ckp .seg button,html.ckp .tabs button{background:none!important;border:0!important;border-bottom:2px solid transparent!important;color:var(--muted)!important;font-family:var(--f-display);font-size:13px!important;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:8px 14px!important;margin-bottom:-1px;cursor:pointer}
html.ckp .diff button.on,html.ckp .diff button[aria-pressed="true"],html.ckp .b2-tabs button.on,html.ckp .hg-tabs button.on,html.ckp .seg button.on,html.ckp .tabs button.on,html.ckp .seg button[aria-pressed="true"]{color:var(--ink)!important;border-bottom-color:var(--amb)!important}
html.ckp .b2-tabs small{color:var(--dim)!important;font-family:var(--f-mono)}
html.ckp .hg-tabs{display:flex;margin-bottom:0}
/* page rhythm */
html.ckp .subtabs{margin-bottom:22px!important}html.ckp .subtabs + *{margin-top:0!important}
html.ckp .subtabs ~ .calm-subnav{display:none!important}
html.ckp main:not(.stack)>*+*{margin-top:18px}
html.ckp main.stack{gap:18px!important}html.ckp main.stack>*{margin-top:0!important;margin-bottom:0!important}html.ckp main.stack>.subtabs{margin-bottom:4px!important}
html.ckp main .grid-2,html.ckp main .grid-3{gap:18px}
/* story strip on the job board */
html.ckp .b2-story{border:1px solid var(--line)!important;border-left:2px solid var(--amb)!important;background:var(--surface)!important}
html.ckp .b2-story b{font-family:var(--f-display);font-size:18px}
/* job list: a dense flight-strip table */
html.ckp .jlist{border:1px solid var(--line)!important;background:var(--surface)!important}
html.ckp .jl-head{background:var(--surface-2)!important;border-bottom:1px solid var(--line)!important}
html.ckp .jl-head *{font-family:var(--f-mono)!important;font-size:10px!important;letter-spacing:.14em!important;color:var(--dim)!important}
html.ckp .jrow{border-top:1px solid var(--line)!important;background:transparent!important}
html.ckp .jrow:hover{background:#151a1e!important}
html.ckp .jr-k{font-family:var(--f-mono)!important;font-size:10.5px!important;letter-spacing:.1em!important;color:var(--muted)!important}
html.ckp .jr-rt{font-family:var(--f-mono)!important;font-weight:500!important}
html.ckp .jr-p{font-family:var(--f-mono)!important;font-weight:500!important;font-size:16px!important}
html.ckp .jrow .chip.bad,html.ckp .jrow .chip.new{color:var(--amb)!important;border-color:rgba(240,165,58,.45)!important}
html.ckp .calm-showmore,html.ckp .b2-more{background:transparent!important;border:1px solid var(--line)!important;border-top:0!important;color:var(--muted)!important;font-family:var(--f-display);text-transform:uppercase;letter-spacing:.08em;font-size:12.5px}
/* forms: one control height */
html.ckp .field input,html.ckp .field select,html.ckp .form-grid input,html.ckp .form-grid select{height:40px;padding:0 12px;font-size:14.5px}
/* license card */
html.ckp .license{background:var(--surface)!important;border:1px solid var(--line)!important;border-top:2px solid var(--amb)!important}
html.ckp .license *{border-radius:0!important}
html.ckp .lic-photo{background:var(--surface-3)!important;color:var(--ink)!important;border:1px solid var(--line-2)!important}

html.ckp .jr-t em{font-style:normal;font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--amb)!important;border:1px solid rgba(240,165,58,.45)!important;background:none!important;padding:1px 6px;margin-left:6px}
html.ckp .btn.jc-go svg{display:none}
/* ---- Flight: the boarding pass is a flat flight strip ---- */
html.ckp .pass{background:var(--surface)!important;border:1px solid var(--line)!important;border-top:2px solid var(--amb)!important;overflow:hidden}
html.ckp .pass-art{opacity:.55;filter:saturate(.5)}
html.ckp .pass .carrier b{color:var(--ink)!important;font-family:var(--f-display);letter-spacing:.08em;text-transform:uppercase;font-size:13px}
html.ckp .pass .carrier .logo{color:var(--amb)}
html.ckp .pass-route .code{font-family:var(--f-mono)!important;font-weight:500!important;letter-spacing:.02em;color:var(--ink)!important}
html.ckp .pass-route .city{color:var(--muted)!important;font-family:var(--f-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
html.ckp .pass-fields{border-top:1px solid var(--line)!important;border-bottom:1px solid var(--line)!important;padding:10px 0!important}
html.ckp .pass-fields>div{border-right:1px solid var(--line);padding-left:14px}html.ckp .pass-fields>div:first-child{padding-left:0}html.ckp .pass-fields>div:last-child{border-right:0}
html.ckp .pass-fields span{font-family:var(--f-mono)!important;font-size:10px!important;letter-spacing:.14em!important;color:var(--dim)!important}
html.ckp .pass-fields b{font-family:var(--f-mono)!important;font-weight:500!important}
html.ckp .pass-stub{background:var(--surface-2)!important;color:var(--ink)!important;border-left:1px dashed var(--line-2)!important}
html.ckp .pass-stub .label{color:var(--dim)!important}html.ckp .pass-stub b{color:var(--ink)!important}
html.ckp .pass-stub .barcode{opacity:.5;filter:invert(1)}
html.ckp .pass-plane,html.ckp .pass-arc{color:var(--amb)!important}
/* chapter banner on the flight page */
html.ckp .chapter-hero{border:1px solid var(--line)!important;border-top:2px solid var(--line-2)!important;background-color:#07090b!important}
html.ckp .chapter-hero h1,html.ckp .chapter-hero h2{font-size:44px!important;font-weight:600}
html.ckp .ch-tip,html.ckp .chapter-hero .label{font-family:var(--f-mono)}
html.ckp .chapter-hero b,html.ckp .chapter-hero strong{color:var(--ink)}
/* numbered steps */
html.ckp .step-n,html.ckp .num{background:none!important;border:1px solid var(--amb)!important;color:var(--amb)!important;font-family:var(--f-mono)}

/* how a flight works: one ruled line of three steps, not three cards */
html.ckp .fl-how{display:grid!important;grid-template-columns:repeat(3,1fr);gap:0!important;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:none!important}
html.ckp .fl-step{background:none!important;border:0!important;border-right:1px solid var(--line)!important;padding:14px 18px 14px 0!important;margin-right:18px}
html.ckp .fl-step:last-child{border-right:0!important;margin-right:0}
html.ckp .fl-step>span{background:none!important;border:1px solid var(--line-2)!important;color:var(--muted)!important;font-family:var(--f-mono);font-weight:500;width:24px!important;height:24px!important;font-size:12px!important}
html.ckp .fl-step b{font-family:var(--f-display);font-size:15px}html.ckp .fl-step p{font-size:13.5px;color:var(--muted)}
/* MSFS setup: five equal readout cells */
html.ckp .su-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:0!important;border:1px solid var(--line)}
html.ckp .su-tile{grid-column:auto!important;background:none!important;border:0!important;border-right:1px solid var(--line)!important;padding:14px 16px!important;display:block!important;min-height:0}
html.ckp .su-tile:last-child{border-right:0!important}
html.ckp .su-tile.todo{background:var(--amb-soft)!important;box-shadow:inset 0 2px 0 var(--amb)!important}
html.ckp .su-ic{display:none!important}
html.ckp .su-tile b{font-size:16px}html.ckp .su-tile.rw b{font-size:15px}
html.ckp .su-tile.rw [class*="big"],html.ckp .su-tile.rw .rw-n{font-size:28px!important}
html.ckp .ch-tip{font-family:var(--f-body)!important}html.ckp .ch-tip span{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
@media (max-width:980px){ html.ckp .su-grid{grid-template-columns:1fr 1fr!important} html.ckp .su-tile{border-bottom:1px solid var(--line)!important} html.ckp .fl-how{grid-template-columns:1fr} html.ckp .fl-step{border-right:0!important;border-bottom:1px solid var(--line)!important;margin:0}}

/* story choices are equal: neither option looks like the "right" one */
html.ckp .choice-btns .btn{background:transparent!important;border-color:var(--line-2)!important;color:var(--ink)!important;min-height:48px;font-size:14px}
html.ckp .choice-btns .btn:hover{border-color:var(--amb)!important;color:var(--amb)!important;background:var(--amb-soft)!important}
html.ckp .panel.choice{border-left:2px solid var(--amb)!important}
/* in flight */
html.ckp .if-head{background:var(--surface)!important;border:1px solid var(--line)!important;border-top:2px solid var(--amb)!important}
html.ckp .if-phases{display:flex;gap:0;border-bottom:1px solid var(--line)}
html.ckp .if-phases button{background:none!important;border:0!important;border-bottom:2px solid transparent!important;color:var(--muted)!important;font-family:var(--f-display);font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px!important;margin-bottom:-1px}
html.ckp .if-phases button.on{color:var(--ink)!important;border-bottom-color:var(--amb)!important}
html.ckp .fm-bar{border-bottom:1px solid var(--line)}
html.ckp .map,html.ckp .mapwrap svg,html.ckp .route-map{background:#0b0e11!important}
html.ckp .ck-item,html.ckp label.ck{background:transparent!important;border:0!important;border-bottom:1px solid var(--line)!important}
html.ckp .btn.primary,html.ckp .btn.action,html.ckp button.btn.primary.sm,html.ckp button.btn.action.sm,html.ckp .b2-story-go .btn.action,html.ckp main .btn.action[data-act]{color:var(--amb-ink)!important}
html.ckp .sh-act small{color:var(--muted)!important;opacity:1!important}
.cb-h1{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
/* one look now: the old theme switch goes away */
html.ckp div:has(> [data-act="theme"]),html.ckp [data-act="theme"]{display:none!important}
/* the "next" chip in the bar repeats the hero on the Story page */
html.ckp body.v-story .cbar .now-pill{display:none!important}
/* title screen */
html.ckp .title-screen .ts-menu button,html.ckp .ts-menu button{border:0!important;border-left:2px solid var(--line-2)!important;background:none!important;padding:8px 16px!important;text-align:left}
html.ckp .ts-menu button:hover,html.ckp .ts-menu button:first-child{border-left-color:var(--amb)!important}
html.ckp .title-screen h1,html.ckp .ts-title{font-family:var(--f-display)!important;letter-spacing:.06em!important}
html.ckp .setup2{border:0!important;outline:0!important}
@media (max-width:760px){
  html.ckp .story-card{min-height:0}
  html.ckp .story-card::after{background:linear-gradient(0deg,rgba(7,9,11,.97) 35%,rgba(7,9,11,.55))}
  html.ckp .sc-top,html.ckp .sc-next{padding-left:18px!important;padding-right:18px!important}html.ckp .sc-bar,html.ckp .sc-prev{margin-left:18px!important;margin-right:18px!important}
  html.ckp .sc-next{padding-top:120px!important}
  html.ckp .sc-next h2{font-size:36px!important}
  html.ckp .sh-stats{flex-wrap:wrap}html.ckp .sh-stats>div{flex:1 1 33%;border-bottom:1px solid var(--line)}
  .ro-strip>div{padding-right:12px;margin-right:12px}
}
`;
(function(){ const s=document.createElement('style'); s.id='ck-pages'; s.textContent=CK_PAGES; document.getElementById('ck-theme').after(s); })();

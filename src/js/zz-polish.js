/* ===================== POLISH (0.76) =====================
   Small layout fixes found by the screenshot audit (tests/shots.js). The cockpit theme moves its own styles last, so a rule here that fights one of its rules at equal
   specificity needs an extra "body" in the selector to win. */
const POLISH_CSS = `
/* job board: the "dirty · Heat +5" note under a network run's pay stays on one line */
.jr-p small.dirty{white-space:nowrap}
/* money page rows: the button keeps its label on one line instead of stacking word by word */
.fc-row>.btn{flex-shrink:0;white-space:nowrap}
/* airline: what's missing for a facility you can't afford yet */
.co-short{margin:2px 0 0}
/* achievement pop-up: centred without a transform (its fade-in animation replaced the transform, so it slid in from
   the right), and as wide as its title instead of half the screen, which wrapped titles on a phone */
body .achpop{left:0;right:0;margin:0 auto;transform:none;width:max-content;max-width:calc(100vw - 32px);text-align:center}
/* a collapsed section (Dispatch on the flight page) has no rule and gap under its title */
html.ckp body details:not([open])>summary.section-title{border-bottom:0;padding-bottom:0;margin-bottom:0}
/* Buy an aircraft: Down payment and Term labels sit level with their dropdowns */
.co-terms{flex-wrap:wrap;gap:8px 16px;align-items:center}
.panel .co-terms>label.row{align-items:center;white-space:nowrap}
.co-terms select{margin:0}
/* outlined buttons in job lists, tables and cards (airline Buy, facilities): light text, not dark-on-dark */
html.ckp .jrow button.btn.primary.sm,html.ckp .jlist button.btn.primary.sm,html.ckp .cards button.btn.primary.sm,html.ckp table button.btn.primary.sm{color:var(--ink)!important}
/* amber action buttons outside the pages (Start the story): dark text on amber, as everywhere else */
html.ckp[data-noir] .btn.action{color:var(--amb-ink)!important}
/* number columns in tables (logbook, money, scorecard) are plain columns, not the amber step badges that share the class */
html.ckp th.num,html.ckp td.num{border:0!important;border-bottom:1px solid var(--line)!important;background:none!important}
html.ckp th.num{color:var(--muted)!important}
html.ckp td.num{color:var(--ink)!important}
/* profile: "Hours by aircraft" and "Landings" rows were squashed to 4px, so long aircraft names overlapped */
html.ckp body .pf-bar{height:auto;background:none!important;grid-template-columns:minmax(0,1fr) auto;row-gap:6px;column-gap:12px;padding:4px 0}
html.ckp body .pf-bar>span{grid-column:1;grid-row:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html.ckp body .pf-bar>b{grid-column:2;grid-row:1}
html.ckp body .pf-bar>div{grid-column:1 / -1;grid-row:2;height:4px;border-radius:0;background:var(--line)!important}
.sh-time li.sh-empty{display:block}
/* job board on phones and tablets: the destination, aircraft and flight time come back under the job title
   (the columns that hold them are hidden below 1000px) */
@media (max-width:1000px){ html.ckp body .jr-t small.jr-k{white-space:normal;overflow:visible} }
@media (max-width:600px){
  /* flight ticket: the plane in the header art sat on top of the airline name, and the stub's three facts wrapped mid-pair */
  .pass-art .art-plane{display:none}
  html.ckp body .pass-stub{display:grid!important;grid-auto-flow:column;grid-template-rows:auto auto;justify-content:start;gap:2px 28px;border-left:0!important;border-top:1px dashed var(--line-2)!important}
  html.ckp body .pass-stub .barcode{display:none}
  /* chart labels are drawn in a 600-wide viewBox; at phone width they shrank to about 6px */
  .chart .ct{font-size:19px}
  /* result: the grade ring sits above the title on a phone, so the title gets the full width */
  .res-head{flex-wrap:wrap;gap:12px!important}
  .res-head>.stack{flex:1 1 100%!important}
  .res-head h1{font-size:22px!important;line-height:1.2}
  /* pilot: the story path becomes a vertical list, dot beside each rating */
  .lad-row{flex-direction:column;align-items:stretch;flex-wrap:nowrap}
  .lad{grid-template-columns:26px minmax(0,1fr);column-gap:12px;min-width:0}
  .lad>.lad-dot{grid-row:1 / span 2;margin:0}
  .lad>b,.lad>small,.lad>.btn,.lad>a{grid-column:2}
  .lad>.btn,.lad>a{justify-self:start;margin-top:4px}
  .lad-line{flex:none;width:2px;height:12px;min-width:0;margin:2px 0 2px 12px}
  /* flight ticket: two even columns, each row starting flush left */
  html.ckp .pass-fields{grid-template-columns:1fr 1fr!important}
  html.ckp .pass-fields>div:nth-child(odd){padding-left:0}
  html.ckp .pass-fields>div:nth-child(even){border-right:0}
  /* story card: less empty space above the chapter title when "Previously" already fills it */
  /* story card on a phone: the scene art behind it is almost fully shaded there, so the tall gap above the chapter title read as empty */
  html.ckp body .sc-next{padding-top:56px!important}
  html.ckp .sc-prev+.sc-next{padding-top:44px!important}
}`;
(function(){ const s=document.createElement('style'); s.id='tw-polish'; s.textContent=POLISH_CSS; document.head.appendChild(s); })();

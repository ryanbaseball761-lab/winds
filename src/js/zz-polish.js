/* ===================== POLISH (0.76) =====================
   Small layout fixes found by the screenshot audit (tests/shots.js). Loaded after the cockpit theme so it wins. */
const POLISH_CSS = `
/* job board: the "dirty · Heat +5" note under a network run's pay stays on one line */
.jr-p small.dirty{white-space:nowrap}
/* money page rows: the button keeps its label on one line instead of stacking word by word */
.fc-row>.btn{flex-shrink:0;white-space:nowrap}
/* airline: what's missing for a facility you can't afford yet */
.co-short{margin:2px 0 0}
.sh-time li.sh-empty{display:block}
@media (max-width:600px){
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
  html.ckp .sc-prev+.sc-next{padding-top:44px!important}
}`;
(function(){ const s=document.createElement('style'); s.id='tw-polish'; s.textContent=POLISH_CSS; document.head.appendChild(s); })();

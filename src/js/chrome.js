/* ===================== PAGE CHROME =====================
   The parts of the screen that surround every page: the side menu, the top bar with its
   status chips, and the phone-width menu. band() returns all of it as one piece of HTML. */

const ICON_BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>';
const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>';
const ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

/* The "Right now" button in the top bar: the one thing to do next. Hidden on the Flight page, where it would repeat itself. */
function nowHTML(st){ const r=rightNow(st); if(!r) return ''; return `<div class="now-pill" title="${esc(r.t)}"${S.view==='flight'?' style="display: none;"':''}><span>${esc(r.t)}</span><button class="btn sm action" data-act="${r.act}" ${r.v?`data-v="${r.v}"`:''} ${r.id?`data-id="${r.id}"`:''}>${esc(r.b)}</button></div>`; }

/* The status chips on the right of the top bar. */
function hudHTMLTop(st){
  const c=crime(st); const unread=S.notifs.length-S.notifSeen;
  return `<div class="hud">${nowHTML(st)}
        <span class="hp"><small>At</small><b class="mono">${esc(st.loc)}</b></span>
        <span class="hp"><small>Day ${st.day}</small><b class="mono">${dateTxt(st.day)} ${hhmm(st.clock)}</b></span>
        <span class="hp cash"><small>Cash</small><b class="mono">${money(st.cash)}</b></span>
        ${st.active?`<button class="hp go" data-act="nav" data-v="flight"><small>Booked</small><b class="mono">${esc(st.active.job.from)}→${esc(st.active.job.local?st.active.job.from:st.active.job.to)}</b></button>`:''}
      ${c.on?`<button class="heat-chip ${c.heat>=80?'hot':c.heat>=60?'warm':'cool'}" data-act="nav" data-v="story" title="${esc(CX_TIPS.Heat)}"><span>Heat</span><b>${c.heat}</b></button>`:''
      }${c.dirty>0?`<button class="dirty-chip" data-act="nav" data-v="money" title="Dirty cash from network runs. Launder it on the Money page."><span>Dirty</span><b>${money(c.dirty)}</b></button>`:''
      }<button class="bell" data-act="bell" title="Notifications">${ICON_BELL}<b${unread>0?'':' style="display:none"'}>${unread>9?'9+':unread}</b></button><button class="cmd-btn" data-act="cmd" title="Search (Ctrl+K)">${ICON_SEARCH}<kbd>Ctrl K</kbd></button><button class="cmd-btn gear-btn" title="Settings" data-act="open-settings">${ICON_GEAR}</button></div>`;
}

function band(){
  const st=S.st; const rk=rankOf(st); const c=crime(st); const live=S.simState==='live';
  const emp = st.company ? esc(st.company.name) : 'Coral Wing Air';
  const meta = VIEW_META[S.view] || [Object.fromEntries(VIEWS)[S.view]||'',''];
  const cur = navGroup(S.view); const isCur = g => !!(cur && cur.v===g.v);
  const ready = storyAvailable(st).filter(m=>MAIN_ORDER.includes(m.arc)).length;   // chapters you can play now
  const urgent = urgentBanner();
  /* under your name: your story rank once you work for Castillo, your airline rank before that */
  const rankLine = c.on ? `${esc(crimeRank(c))} · Power ${c.power}` : `${esc(rk.name)} · ${emp}`;
  const sideItem = (g,i) => `<button class="snav ${isCur(g)?'on':''}" data-act="nav" data-v="${g.v}" ${isCur(g)?'aria-current="page"':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.ico}</svg><span class="lbl">${g.n}</span>${g.v==='story'&&ready?`<span class="nb" title="${ready} chapter${ready>1?'s':''} ready to play">${ready}</span>`:''}<kbd>${i+1}</kbd></button>`;
  const railItem = g => `<button class="${isCur(g)?'on':''}" data-act="nav" data-v="${g.v}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${g.ico}</svg><span>${g.n}</span></button>`;
  return `<aside class="side" aria-label="Main menu">
    <div class="side-brand">${LOGO}<div><b>Trade Winds</b><span>Every cargo has a price</span></div></div>
    <div class="side-pilot">
      <div class="pav">${esc(initials(st.pilot.name))}</div>
      <div style="min-width:0"><b>${esc(st.pilot.name)}</b><span>${rankLine}</span>
        <div class="xp" title="${rk.next?`Next rank: ${rk.next} at ${rk.nextH} h`:'Top rank'}"><i style="width:${rk.pct.toFixed(0)}%"></i></div>
        <small>${fmtH(st.minutes)} logged${rk.next?` · ${esc(rk.next)} at ${rk.nextH} h`:''}</small></div>
    </div>
    <nav class="side-nav">${NAV5.map(sideItem).join('')}</nav>
    <div class="side-foot"><span class="simdot ${live?'on':''}"></span><span id="sim-band">${live?'MSFS live':'Sim not connected'}</span><span class="sep">·</span><span id="sync">${syncText()}</span></div>
  </aside>
  <header class="topbar">
    <div class="tb-in">
      <div class="tb-title"><div class="tb-brand">${LOGO}<b>Trade Winds</b></div><h1>${esc(meta[0])}</h1><p>${esc(meta[1])}</p></div>
      ${hudHTMLTop(st)}
    </div>
    <nav class="mrail" aria-label="Sections">${NAV5.map(railItem).join('')}</nav>
  ${urgent?`<div class="urgent-host">${urgent}</div>`:''}</header>${S.view==='board' && !S.showResult ? callHTML(st) : ''}`;
}

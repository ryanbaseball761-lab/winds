/* ===================== PAGE CHROME =====================
   The parts of the screen that surround every page: the side menu, the top bar with its
   status chips, and the phone-width menu. band() returns all of it as one piece of HTML. */

const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>';
const ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

/* The "Right now" button in the top bar: the one thing to do next. Hidden on the Flight page, where it would repeat itself. */
function nowHTML(st){ const r=rightNow(st); if(!r) return ''; return `<div class="now-pill" title="${esc(r.t)}"${(S.view==='flight'||S.view==='story'||S.view==='board')?' style="display: none;"':''}><span>${esc(r.t)}</span><button class="btn sm action" data-act="${r.act}" ${r.v?`data-v="${r.v}"`:''} ${r.id?`data-id="${r.id}"`:''}>${esc(r.b)}</button></div>`; }

/* The status chips on the right of the top bar. */


function band(){
  const st=S.st; const rk=rankOf(st); const c=crime(st); const live=S.simState==='live';
  const cur = navGroup(S.view); const isCur = g => !!(cur && cur.v===g.v);
  const ready = storyAvailable(st).filter(m=>MAIN_ORDER.includes(m.arc)).length;   // chapters you can play now
  const urgent = urgentBanner(); const unread=S.notifs.length-S.notifSeen;
  const rankLine = c.on ? `${esc(crimeRank(c))} · Power ${c.power}` : `${esc(rk.name)}`;
  const tab = (g,i) => `<button class="cb-tab ${isCur(g)?'on':''}" data-act="nav" data-v="${g.v}" ${isCur(g)?'aria-current="page"':''} title="${g.n} (${i+1})"><span>${g.n}</span>${g.v==='story'&&ready?`<i class="cb-nb" title="${ready} chapter${ready>1?'s':''} ready to play">${ready}</i>`:''}</button>`;
  const ro = (k,v,cls='') => `<span class="cb-ro ${cls}"><small>${k}</small><b class="mono">${v}</b></span>`;
  const a=st.active;
  const meta = VIEW_META[S.view] || [Object.fromEntries(VIEWS)[S.view]||'',''];
  return `<header class="topbar cbar"><h1 class="cb-h1">${esc(meta[0]||'Trade Winds')}</h1>
    <div class="cb-row">
      <button class="cb-brand" data-act="nav" data-v="story" aria-label="Trade Winds: Story">${LOGO}<b>Trade Winds</b></button>
      <nav class="cb-tabs" aria-label="Main menu">${NAV5.map(tab).join('')}</nav>
      <div class="hud cb-hud">
        ${ro('Loc',esc(st.loc))}${ro('Day '+st.day,`<span class="cb-date">${dateTxt(st.day)} </span>${hhmm(st.clock)}`,'cb-time')}${ro('Cash',money(st.cash),'cash')}
        ${c.on?`<button class="cb-ro heat-chip ${c.heat>=80?'hot':c.heat>=60?'warm':'cool'}" data-act="nav" data-v="story" title="${esc(CX_TIPS.Heat)}"><small>Heat</small><b class="mono">${c.heat}</b></button>`:''}
        ${c.dirty>0?`<button class="cb-ro dirty-chip" data-act="nav" data-v="money" title="Dirty cash from network runs. Launder it on the Money page."><small>Dirty</small><b class="mono">${money(c.dirty)}</b></button>`:''}
        <span class="cb-ro cb-sim ${live?'on':''}" title="${live?'MSFS is connected':'MSFS is not connected'}"><small>Sim</small><b class="mono"><i class="simdot ${live?'on':''}"></i><span id="sim-band">${live?'MSFS live':'Not connected'}</span></b></span>
        <button class="cb-ic cb-phone" data-act="w-phone" title="Phone: texts and notifications" aria-label="Phone"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="1.6"/></svg><b style="display:none"></b></button><button class="cb-ic cmd-btn" data-act="cmd" title="Search (Ctrl+K)" aria-label="Search">${ICON_SEARCH}</button><button class="cb-ic cmd-btn gear-btn" title="Settings" aria-label="Settings" data-act="open-settings">${ICON_GEAR}</button>
      </div>
    </div>
    <div class="cb-sub">
      <span class="cb-pilot"><b>${esc(st.pilot.name)}</b><span>${rankLine}</span><span class="cb-xp" title="${rk.next?`Next rank: ${rk.next} at ${rk.nextH} h`:'Top rank'}"><i style="width:${rk.pct.toFixed(0)}%"></i></span><small class="mono">${fmtH(st.minutes)}${rk.next?` / ${rk.nextH}&nbsp;h`:''}</small></span>
      ${a?`<button class="cb-booked" data-act="nav" data-v="flight"><small>Booked</small><b class="mono">${esc(a.job.from)} → ${esc(a.job.local?a.job.from:a.job.to)}</b></button>`:''}
      ${nowHTML(st)}<span id="sync" class="cb-sync">${syncText()}</span>
    </div>
  ${urgent?`<div class="urgent-host">${urgent}</div>`:''}</header>${S.view==='board' && !S.showResult ? callHTML(st) : ''}`;
}

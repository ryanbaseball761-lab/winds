/* ===================== STREAMER MODE =====================
   Let Twitch chat vote on story choices. Turn it on in Hangar → Settings and type your channel name.
   Trade Winds reads chat anonymously (no login, it never posts). When a story choice comes up, after a chapter
   or mid-flight, chat types 1, 2 or 3; when the timer runs out the most-voted option is picked for you.
   You can still click an option yourself at any time; that cancels the vote. */

const TWITCH = { ws:null, channel:'', state:'off', vote:null, retry:0 };
function streamP(){ const u=uiP(); return { on:!!u.streamer, channel:String(u.twitchChannel||'').toLowerCase().replace(/[^a-z0-9_]/g,''), sec:Number(u.voteSec)||45 }; }

function twitchConnect(){ const P=streamP(); if(!P.on || !P.channel || typeof WebSocket==='undefined') { twitchClose(); return; }
  if(TWITCH.ws && TWITCH.channel===P.channel && TWITCH.state!=='off') return; twitchClose();
  TWITCH.channel=P.channel; TWITCH.state='connecting'; streamStatus();
  let ws; try{ ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443'); }catch(_){ TWITCH.state='off'; return; } TWITCH.ws=ws;
  ws.onopen=()=>{ ws.send('PASS SCHMOOPIIE'); ws.send('NICK justinfan'+(10000+Math.floor(Math.random()*80000))); ws.send('JOIN #'+P.channel); };
  ws.onmessage=ev=>{ String(ev.data).split('\r\n').forEach(line=>{ if(!line) return;
    if(line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }
    if(/ 366 /.test(line) || / JOIN #/.test(line)){ if(TWITCH.state!=='live'){ TWITCH.state='live'; TWITCH.retry=0; streamStatus(); } }
    const m=line.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.*)$/); if(m) twitchMsg(m[1], m[2].trim()); }); };
  ws.onclose=()=>{ if(TWITCH.ws!==ws) return; TWITCH.state='off'; streamStatus(); if(streamP().on){ const wait=Math.min(60000, 3000*Math.pow(2,TWITCH.retry++)); setTimeout(twitchConnect, wait); } };
  ws.onerror=()=>{ try{ ws.close(); }catch(_){} }; }
function twitchClose(){ const ws=TWITCH.ws; TWITCH.ws=null; TWITCH.state='off'; if(ws) try{ ws.close(); }catch(_){} }
function twitchMsg(user, text){ if(/^!tip\b/i.test(String(text)) && S.st){ const T=TWITCH; T.tips=T.tips||{}; const day=S.st.day, k=user+'|'+day; if(!T.tips[k] && Object.keys(T.tips).filter(x=>x.endsWith('|'+day)).length<20){ T.tips[k]=1; txn(S.st, 50, 'Tips & bonuses', `Tip from ${user} (Twitch)`); toast(`${user} tipped you $50 from chat.`); save(); } return; }
  const v=TWITCH.vote; if(!v) return; const m=text.match(/^!?(?:vote\s*)?([1-9])\b/i); if(!m) return; const i=Number(m[1])-1; if(i<0 || i>=v.n) return;
  v.by[user.toLowerCase()]=i; voteRender(); }

/* a vote over a set of buttons that are on screen right now */
function startVote(key, buttons){ if(document.querySelector('.cut')) return; const P=streamP(); if(TWITCH.vote && TWITCH.vote.key===key) return; endVote(false);
  TWITCH.vote={ key, n:buttons.length, by:{}, t0:Date.now(), sec:P.sec, buttons };
  buttons.forEach((b,i)=>{ if(!b.querySelector('.tw-n')){ const s=document.createElement('span'); s.className='tw-n'; s.textContent=String(i+1); b.prepend(s); const c=document.createElement('span'); c.className='tw-c'; b.append(c); } });
  let bar=document.getElementById('tw-vote'); if(!bar){ bar=document.createElement('div'); bar.id='tw-vote'; bar.setAttribute('role','status'); document.body.appendChild(bar); }
  voteRender(); }
function voteTally(v){ const t=Array(v.n).fill(0); Object.values(v.by).forEach(i=>t[i]++); return t; }
function voteRender(){ const v=TWITCH.vote, bar=document.getElementById('tw-vote'); if(!v||!bar) return; const t=voteTally(v), total=t.reduce((a,b)=>a+b,0), left=Math.max(0, Math.ceil(v.sec-(Date.now()-v.t0)/1000));
  v.buttons.forEach((b,i)=>{ const c=b.querySelector('.tw-c'); if(c) c.textContent = total ? ` ${Math.round(t[i]/total*100)}%` : ''; });
  bar.innerHTML=`<b>Chat is deciding</b><span>Type ${Array.from({length:v.n},(_,i)=>`<kbd>${i+1}</kbd>`).join(' ')} in chat · ${total} vote${total===1?'':'s'}</span><i class="mono">${left}s</i>`; }
function endVote(pick){ if(pick && document.querySelector('.cut') && TWITCH.vote){ const v0=TWITCH.vote; setTimeout(()=>{ if(TWITCH.vote===v0) endVote(pick); }, 800); return; }   // the pick waits for the scene
  const v=TWITCH.vote; TWITCH.vote=null; const bar=document.getElementById('tw-vote'); if(bar) bar.remove(); if(!v) return;
  v.buttons.forEach(b=>b.querySelectorAll('.tw-n,.tw-c').forEach(x=>x.remove()));
  if(!pick) return; const t=voteTally(v); const total=t.reduce((a,b)=>a+b,0); if(!total){ toast('No votes from chat. Your call.'); return; }
  const win=t.indexOf(Math.max(...t)); const b=v.buttons[win]; if(b && b.isConnected){ toast(`Chat picked option ${win+1} (${t[win]} of ${total} votes).`); b.click(); } }

/* every second: find a story choice on screen and run a vote on it */
setInterval(()=>{ try{ const P=streamP(); if(!P.on){ if(TWITCH.ws) twitchClose(); if(TWITCH.vote) endVote(false); return; } if(!TWITCH.ws) twitchConnect();
  const v=TWITCH.vote;
  if(v){ if(!v.buttons.every(b=>b.isConnected) ){ endVote(false); return; } if((Date.now()-v.t0)/1000 >= v.sec) endVote(true); else voteRender(); return; }
  if(TWITCH.state!=='live') return;
  const ch=[...document.querySelectorAll('.choice [data-act="crime-choose"]')]; if(ch.length>1 && S.st && S.st.last) return startVote('ch:'+S.st.last.job.story, ch);
  const bt=[...document.querySelectorAll('.beat [data-act="beat-opt"]')]; if(bt.length>1){ const k=(document.querySelector('.beat .bt-t')||{}).textContent||''; return startVote('beat:'+k.slice(0,40), bt); }
}catch(_){} }, 1000);

function streamStatus(){ const el=document.getElementById('tw-status'); if(el) el.innerHTML=streamStatusHTML(); }
function streamStatusHTML(){ const P=streamP(); if(!P.on) return ''; if(!P.channel) return '<span class="chip">Type your channel name</span>';
  return TWITCH.state==='live'?`<span class="chip good">Reading #${esc(P.channel)}</span>`:TWITCH.state==='connecting'?'<span class="chip">Connecting…</span>':'<span class="chip bad">Not connected</span>'; }
function streamerSettingsHTML(){ const u=uiP();
  return `<section class="panel stack"><div class="row between"><div><p class="label">Streaming</p><h3>Let Twitch chat vote</h3></div><span id="tw-status">${streamStatusHTML()}</span></div>
    <p class="small">When a story choice comes up (after a chapter, or in flight), your chat votes by typing 1, 2 or 3. The winner is picked when the timer runs out; click an option yourself to overrule. Trade Winds only reads chat and never posts.</p>
    <label class="row"><input type="checkbox" data-act="ui-tog2" data-k="streamer" ${u.streamer?'checked':''}> Streamer mode</label>
    <div class="row" style="gap:8px;flex-wrap:wrap"><label class="field" style="flex:1 1 200px"><span>Twitch channel</span><input data-tw-chan value="${esc(u.twitchChannel||'')}" placeholder="yourchannel" maxlength="25" autocomplete="off"></label>
    <label class="field" style="flex:0 1 160px"><span>Vote time</span><select data-tw-sec>${[30,45,60,90].map(s=>`<option value="${s}" ${(Number(u.voteSec)||45)===s?'selected':''}>${s} seconds</option>`).join('')}</select></label></div></section>`; }
document.addEventListener('change', e=>{ const t=e.target; if(!S.st) return;
  if(t.matches && t.matches('[data-tw-chan]')){ uiP().twitchChannel=t.value.trim().replace(/^#/,''); save(); twitchClose(); twitchConnect(); streamStatus(); }
  if(t.matches && t.matches('[data-tw-sec]')){ uiP().voteSec=Number(t.value); save(); } });

(function(){ const s=document.createElement('style'); s.textContent=`
#tw-vote{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:90;display:flex;gap:14px;align-items:center;background:#18101f;border:1px solid #6441a5;color:#efeff1;border-radius:14px;padding:12px 18px;box-shadow:0 10px 40px rgba(0,0,0,.5);font-size:14px;max-width:calc(100vw - 32px)}
#tw-vote b{color:#bf94ff;font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase}#tw-vote i{font-style:normal;color:#bf94ff;font-size:18px}
#tw-vote kbd{background:#6441a5;color:#fff;border-radius:5px;padding:1px 7px;font:700 12px var(--f-mono)}
.tw-n{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:6px;background:#6441a5;color:#fff;font:700 12px var(--f-mono);margin-right:8px}.tw-c{font-family:var(--f-mono);opacity:.85}`; document.head.appendChild(s); })();

/* ---------- the ending card: a picture of how your story ended, to share ---------- */
const ENDING_TITLE={kingpin:'Kingpin',witness:'Witness',ghost:'Ghost'};
function drawEndingCard(st){ const c=crime(st), f=flagsOf(st); const cv=document.createElement('canvas'); cv.width=1200; cv.height=630; const g=cv.getContext('2d');
  const grd=g.createLinearGradient(0,0,1200,630); grd.addColorStop(0,'#1c1410'); grd.addColorStop(1,'#08080a'); g.fillStyle=grd; g.fillRect(0,0,1200,630);
  g.fillStyle='rgba(224,178,74,.08)'; for(let i=0;i<14;i++){ g.fillRect(0,40+i*44,1200,1); }
  g.fillStyle='#e0b24a'; g.font='600 20px "IBM Plex Mono",Consolas,monospace'; g.fillText('TRADE WINDS · THE END', 64, 86);
  g.fillStyle='#f1e9d8'; g.font='800 112px "Instrument Sans","Segoe UI",sans-serif'; g.fillText(ENDING_TITLE[c.ending]||'The end', 60, 210);
  g.font='500 26px "Instrument Sans","Segoe UI",sans-serif'; g.fillStyle='rgba(241,233,216,.85)';
  const lines=(epilogue(st)||[]).slice(0,3); let y=272; const wrap=(t,max)=>{ const w=t.split(' '), out=[]; let l=''; w.forEach(x=>{ if(g.measureText(l+x).width>max){ out.push(l.trim()); l=''; } l+=x+' '; }); out.push(l.trim()); return out; };
  lines.forEach(t=>{ wrap(t,1060).slice(0,2).forEach(l=>{ g.fillText(l,64,y); y+=36; }); y+=10; });
  const stats=[['Chapters',`${mainChapters().filter(m=>st.story.done[m.id]).length}/${mainChapters().length}`],['Power',c.power],['Heat',c.heat],['Hours',Math.round((st.minutes||0)/6)/10],['Laundered',money(c.laundered||0)]];
  stats.forEach(([k,v],i)=>{ const x=64+i*220; g.fillStyle='rgba(241,233,216,.55)'; g.font='600 16px "IBM Plex Mono",Consolas,monospace'; g.fillText(k.toUpperCase(),x,548); g.fillStyle='#f1e9d8'; g.font='700 34px "IBM Plex Mono",Consolas,monospace'; g.fillText(String(v),x,590); });
  g.fillStyle='#e0b24a'; g.font='600 18px "Instrument Sans","Segoe UI",sans-serif'; g.textAlign='right'; g.fillText(`${st.pilot&&st.pilot.name||''}${f.informant?' · informant':''}`,1136,86); g.textAlign='left';
  return cv; }
function endingCardHTML(st){ if(!crime(st).ending) return ''; return `<section class="panel row between" style="gap:12px;flex-wrap:wrap"><div><p class="label">Your ending</p><h3>Share how it ended</h3><p class="small muted">A picture of your ending, the people's fates and your numbers. No spoilers beyond your own story.</p></div><div class="row" style="gap:6px"><button class="btn primary sm" data-act="end-card" data-v="save">Save image</button><button class="btn sm" data-act="end-card" data-v="copy">Copy</button></div></section>`; }
document.addEventListener('click', async e=>{ const b=e.target.closest('[data-act="end-card"]'); if(!b||!S.st||!crime(S.st).ending) return;
  const blob=await new Promise(r=>drawEndingCard(S.st).toBlob(r,'image/png')); const name=`trade-winds-ending-${crime(S.st).ending}.png`;
  if(b.dataset.v==='copy'){ try{ await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); toast('Ending card copied. Paste it anywhere.'); }catch(_){ toast('Copy isn\'t allowed here. Use Save image instead.'); } return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }catch(_){ toast('Saving isn\'t available in this view.'); } });

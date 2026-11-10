/* ===================== 4. THINGS THAT HAPPEN TO YOU ===================== */

/* ---- (a) real MSFS weather: track what you actually flew through, and pay for it ---- */
const _evCoach = coachTick;
coachTick = function(){
  _evCoach();
  const a=S.st&&S.st.active; const x=S.sim&&S.sim.ext; if(!a || !x || S.simState!=='live') return;
  const w=x.weather; const W = a.job._wx = a.job._wx || {maxWind:0, minVis:99, cloud:false};
  W.maxWind=Math.max(W.maxWind, w.windKt||0); W.minVis=Math.min(W.minVis, w.visSm||99); if(w.inCloud && !S.sim.motion.onGround) W.cloud=true;
};
function liveWxLine(){ const x=S.sim&&S.sim.ext; if(!x || S.simState!=='live') return ''; const w=x.weather;
  return `<div class="livewx"><span class="label">Live MSFS weather</span><span class="mono">${String(w.windDir).padStart(3,'0')}°/${w.windKt} kt · ${w.visSm>=10?'10+':w.visSm} sm · ${w.oatC} °C · ${w.qnhHpa} hPa${w.inCloud?' · in cloud':''}</span></div>`; }
const _evCabin = cabinInner;
cabinInner = function(){ const h=_evCabin(); return h ? h.replace(/(<p class="tiny muted">[^<]*riding along today\.<\/p>)/, '$1'+liveWxLine()) : h; };

/* ---- (b) your phone rings: characters call with time-limited work ---- */

var maybeCall; /* defined in full below (055-core.js) */
function callHTML(st){
  const c=st.call; if(!c) return ''; if(st.clock > c.until){ st.call=null; return ''; }
  const j=c.job; const a=AC[j.ac];
  return `<div class="overlay call-ov" role="dialog" aria-modal="true" aria-label="Incoming call"><div class="panel call-card">
    <div class="ring-ph">${avatar(c.who)}</div>
    <p class="label">Incoming call</p><h2>${esc(CAST[c.who].n)}</h2>
    <p class="brief">${esc(c.line)}</p>
    <div class="call-job"><span class="mono">${esc(j.from)} → ${esc(j.to)}</span><span>${esc(a.n)}</span><span>${j.pax?j.pax+' pax':j.cargo+' lb'}</span><b>${money(j.pay)}</b></div>
    <p class="tiny muted">Rush rate: 1.6× normal pay. The offer stands until ${hhmm(c.until)} game time.</p>
    <div class="row" style="justify-content:center"><button class="btn action" data-act="call-yes">Take the job</button><button class="btn" data-act="call-no">Not today</button></div>
  </div></div>`;
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="call-yes"],[data-act="call-no"]'); if(!b || !S.st || !S.st.call) return; const st=S.st; const c=st.call;
  if(b.dataset.act==='call-yes'){ if(st.active){ toast('Finish your current flight first.'); return; } st.active={job:c.job, accepted:Date.now()}; st.call=null; st.rep[c.who]=clamp((st.rep[c.who]||10)+2,0,100); save(); S.debrief=false; S.showResult=false; go('flight'); }
  else { st.call=null; st.rep[c.who]=clamp((st.rep[c.who]||10)-1,0,100); save(); toast(`${shortName(c.who)}: "No worries. Next time."`); render(); }
});

/* ---- (c) choices that change the story ---- */
const CHOICES = {
  CW4:{q:`On the ramp at St. Kitts, the wedding family hands you an envelope with $200 "for Captain Calloway, for the trouble." Calloway never flew a minute of it.`,
    a:{t:`Give it to Calloway`, out:`Calloway opens the envelope, stares at you, and says "...thanks." He sounds like he means it.`, rep:{calloway:8,mari:3}},
    b:{t:`Keep it. You flew it`, out:`$200 richer. Calloway hears about it within the hour, and so does Mari.`, cash:200, rep:{calloway:-6,mari:-3}}},
  VJ3:{q:`On the ramp at Canouan, the guest in sunglasses quietly offers you $1,000 to fly a "photo-free" film shoot next month, as long as Vivienne doesn't hear about it.`,
    a:{t:`Tell Vivienne about the offer`, out:`Vivienne laughs. "He tries that with every pilot I hire. You passed." She seems pleased.`, rep:{vivienne:7,abe:2}},
    b:{t:`Take the money quietly`, out:`$1,000 lands in your account. Vivienne doesn't say anything, but she's a little cooler on the flight home.`, cash:1000, rep:{vivienne:-5}}},
  VJ5:{q:`The hospital wants to name a pilot in their press release about the transplant flight.`,
    a:{t:`Put your name in it`, out:`The story runs in three island papers. Charter calls pick up.`, reputation:5},
    b:{t:`Credit Vivienne and the Starling`, out:`Vivienne reads the article twice and sends you a single heart emoji, which from her is a sonnet.`, rep:{vivienne:8}}},
  VJ7:{q:`The CJ4 broker takes you aside: "If she buys at full price, there's a $1,500 finder's fee in it for you. Our secret."`,
    a:{t:`Decline and warn Vivienne`, out:`Vivienne negotiates $300,000 off the price. Abe buys you dinner.`, rep:{vivienne:10,abe:5}},
    b:{t:`Take the fee`, out:`$1,500 for a handshake. It feels heavier than it should.`, cash:1500, rep:{abe:-4}}}
};
const ALT_OUT = {
  VJ8: st => st.story.flags.VJ7==='b' ? {good:`Starling II lands beautifully. On the ramp, Vivienne hands you a folder: the broker's emails, including the one about your fee. "I'd have paid you that myself if you'd asked," she says, and walks away. Abe shakes his head slowly.`, ok:`Starling II comes home in one piece. Vivienne is polite, nothing more. Somebody told her about the broker.`, bad:`A rough arrival, and a rougher conversation afterwards. Vivienne knows about the fee.`}
    : st.story.flags.VJ7==='a' && st.story.flags.VJ3==='a' ? {good:`The whole Coral Wing ramp turns out to watch Starling II taxi in. Vivienne hands you a second set of keys. "Chief pilot of Saltwater Air. Don't argue." Abe hands you the finished crossword with "PILOT" written across the margin.`, ok:`A long flight, flown honestly and well. Vivienne offers you a permanent seat on every Starling trip, at double the rate.`, bad:`It wasn't pretty, but Vivienne doesn't care. "You're the one I trust," she says. "The landing we can fix."`} : null,
};
function choiceHTML(st){
  const j=st.last && st.last.job; if(!j || j.kind!=='story' || !CHOICES[j.story] || st.story.flags[j.story] || st.last.res.crash) return '';
  const c=CHOICES[j.story];
  return `<section class="panel choice"><p class="label">Your call</p><p class="brief" style="margin:6px 0 12px">${esc(c.q)}</p><div class="choice-btns"><button class="btn primary" data-act="choose" data-v="a">${esc(c.a.t)}</button><button class="btn" data-act="choose" data-v="b">${esc(c.b.t)}</button></div><p class="tiny muted" style="margin-top:8px">Choices stick. People remember, and some chapters end differently because of them.</p></section>`;
}
const _evResult = resultView;
resultView = function(){ const h=_evResult(); const c=choiceHTML(S.st); if(!c) return h; const i=h.indexOf('<section class="panel stack share-card">'); return i>0 ? h.slice(0,i)+c+h.slice(i) : h.replace('</main>', c+'</main>'); };
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-act="choose"]'); if(!b || !S.st || !S.st.last) return; const st=S.st; const id=st.last.job.story; const C=CHOICES[id]; if(!C || st.story.flags[id]) return;
  const v=b.dataset.v; const o=C[v]; st.story.flags[id]=v;
  for(const k in (o.rep||{})) st.rep[k]=clamp((st.rep[k]||10)+o.rep[k],0,100);
  if(o.cash) txn(st, o.cash, 'Gifts & windfalls', o.t);
  if(o.reputation) st.reputation=clamp(st.reputation+o.reputation,0,100);
  addJournal(st, `Choice: ${o.t}`, o.out, Object.keys(o.rep||{}), 'story');
  save(); toast(o.out.slice(0,140)); S.keepScroll=true; render();
});

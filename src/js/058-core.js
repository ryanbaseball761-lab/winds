/* ===================== TESTING TOOLS: connection check, practice landings, calm test mode, "something's off" notes ===================== */
function testMode(){ return !!(S.st && S.st.ui && S.st.ui.calmTest); }

/* ---- connection check + practice + test mode, at the top of the board ---- */
function connCard(st){ const live=S.simState==='live'; const s=S.sim||{}; const L=live?loadedAircraft():{title:'',id:null}; const rec=s.recorder;
  const row=(ok,t)=>`<span class="cc-i ${ok?'ok':'no'}">${ok?'✓':'•'} ${t}</span>`;
  return `<section class="panel conn-card"><div class="cc-row">
    ${row(live, live?'MSFS connected':'MSFS not connected')}
    ${row(live && !!rec, live&&rec?'Recorder ready':'Recorder waiting')}
    ${row(live && !!L.id, live ? (L.title ? `Aircraft: ${esc(L.id?AC[L.id].n:L.title)}${L.id?'':' (not in the game list)'}` : 'No aircraft loaded') : 'Aircraft: start MSFS')}
  </div><div class="cc-row">
    <button class="btn sm" data-act="practice" ${st.active?'disabled':''}>Practice landing</button>
    <label class="row cc-t"><input type="checkbox" data-act="calm-test" ${testMode()?'checked':''}> Calm test mode <span class="tiny muted">(no sealed orders, cabin requests or urgent jobs)</span></label>
  </div></section>`; }
const _tsBoard = boardView;
boardView = function(){ const h=_tsBoard(); if(S.view!=='board'||!S.st) return h; return h.replace(/(<section[^>]*class="today[\s\S]*?<\/section>)/, m=>m+connCard(S.st)); };
const _tsSim = renderSimBits;
renderSimBits = function(){ _tsSim(); try{ if(S.view==='board'){ const el=document.querySelector('.conn-card'); if(el){ const t=tpl(connCard(S.st)); el.replaceWith(t.content.firstElementChild); } } }catch(_){} };
document.addEventListener('change', e=>{ const b=e.target.closest('[data-act="calm-test"]'); if(!b||!S.st) return; S.st.ui=S.st.ui||{}; S.st.ui.calmTest=b.checked; if(b.checked) (S.st.jobs||[]).forEach(j=>{ j.scen=null; delete j.ask; }); save(); toast(b.checked?'Calm test mode on: plain A-to-B flights.':'Calm test mode off.'); S.keepScroll=true; render(); });
const _tsGen = genJobs;
genJobs = function(st){ const L=_tsGen(st); if(st.ui && st.ui.calmTest) L.forEach(j=>{ j.scen=null; delete j.ask; }); return L; };
const _tsOrders = openOrders;
openOrders = function(a, how){ if(testMode()) return; return _tsOrders(a, how); };

/* ---- practice landing: no pay, no logbook, just the grade ---- */
document.addEventListener('click', e=>{ if(!e.target.closest('[data-act="practice"]') || !S.st || S.st.active) return; const st=S.st; const s=S.sim;
  let code=st.loc; if(S.simState==='live' && s && s.position){ const n=nearestAirport(s.position.lat, s.position.lon); if(n.d<8 && !AP[n.code].water) code=n.code; }
  const L=loadedAircraft(); const acId=(L.id && AC[L.id]) ? L.id : (eligibleAircraft(st).find(k=>apOk(st,code,k)) || 'C172');
  const dep=Math.round(st.clock/5)*5; const job={ id:'P-'+uid(), kind:'practice', practice:true, label:'Practice', cat:'pax', from:code, to:code, local:true, tourNm:15, ac:acId, pax:0, cargo:0, dep, wx:genWx(st,code,null,dep), title:`Practice landing at ${AP[code].isl}`, client:'', paras:[`Take off, fly a circuit, and land. No pay and nothing goes in your logbook: just your landing grade, the runway diagram and the copilot calls.`] };
  job.pay=0; job.est=plan(job).est; st.active={job, accepted:Date.now()}; save(); S.showResult=false; go('flight'); toast('Practice: start the engine in MSFS and fly a circuit.'); });
const _tsApply = applyResult;
applyResult = function(st, job, f, res){ if(!job.practice) return _tsApply(st, job, f, res);
  const out={ id:job.id, title:job.title, grade:res.grade, score:res.score, parts:res.parts, pay:0, costs:0, notes:['Practice flight: no pay, and nothing was added to your logbook or career.'], ok:true, story:'', jobKind:'practice' };
  if(f.verified) out.notes.push(`Recorded by MSFS: touchdown at ${f.simFpm} fpm${f.simBounces?`, ${f.simBounces} bounce${f.simBounces>1?'s':''}`:''}.`);
  st.active=null; st.last={job, res, out, f}; save(); return out; };

/* ---- "something's off": a note saved into the flight's log ---- */
function noteBox(){ return `<div class="note-box" role="dialog" aria-label="Report something"><p class="label">Something's off?</p><textarea id="tw-note" rows="3" placeholder="What happened? e.g. callout came late, wrong runway, plane rolled on descent"></textarea><div class="row"><button class="btn sm primary" data-act="note-save">Save note</button><button class="btn sm ghost" data-act="note-cancel">Cancel</button></div></div>`; }
async function saveNote(text){ const st=S.st, a=st&&st.active, s=S.sim||{}; const L=st&&st.last;
  const body={ at:new Date().toISOString(), app:(typeof TW_VERSION!=='undefined'?TW_VERSION:''), view:S.view, note:text,
    job: a ? {id:a.job.id, title:a.job.title, from:a.job.from, to:a.job.to, ac:a.job.ac, started:!!a.started} : (L&&L.job ? {id:L.job.id, title:L.job.title, from:L.job.from, to:L.job.to, ac:L.job.ac, result:{score:L.res&&L.res.score, grade:L.res&&L.res.grade, parts:L.res&&L.res.parts, tda:L.f&&L.f.tda}} : null),
    sim: S.simState==='live' ? {aircraft:s.aircraft, position:s.position, motion:s.motion, systems:s.systems, ext:s.ext, simLocalTime:s.simLocalTime, recorder:s.recorder&&{phase:s.recorder.phase, takeoff:s.recorder.takeoff, touchdown:s.recorder.touchdown, events:s.recorder.events}} : {state:S.simState} };
  st.testNotes=(st.testNotes||[]).slice(-49); st.testNotes.push({at:body.at, note:text, job:body.job&&body.job.title}); save();
  if(window.twNative && twNative.flightLog){ const d=new Date(); try{ await twNative.flightLog(`note-${d.toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`, JSON.stringify(body)); }catch(_){} }
  toast('Note saved with this flight\'s data. Thanks!'); }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="note-open"],[data-act="note-save"],[data-act="note-cancel"]'); if(!b) return; const box=document.querySelector('.note-box');
  if(b.dataset.act==='note-open'){ if(box) return; const t=tpl(noteBox()); document.body.appendChild(t.content.firstElementChild); setTimeout(()=>{ const x=document.getElementById('tw-note'); if(x) x.focus(); },30); return; }
  if(b.dataset.act==='note-save'){ const v=(document.getElementById('tw-note')||{}).value||''; if(v.trim()) saveNote(v.trim()); }
  if(box) box.remove(); });
const NOTE_BTN = `<button class="btn sm ghost note-btn" data-act="note-open">Something's off?</button>`;
const _tsIf = inflightView;
inflightView = function(){ return _tsIf().replace(/(<div class="row"><span class="if-timer)/, NOTE_BTN+'$1'); };
const _tsRes = resultView;
resultView = function(){ const h=_tsRes(); return h.replace(/(<section class="panel how-did">)/, `<div class="row" style="justify-content:flex-end">${NOTE_BTN}</div>$1`); };

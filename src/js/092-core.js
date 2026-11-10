/* ===================== B1. ECONOMY: upkeep for your fleet and crew, and things worth buying ===================== */
const UPKEEP = { SF50:300, CJ4:700, B38M:1800, B748:4000 };
const WAGES = { loaders:120, fo:350 };
const SAFEHOUSES = [ {id:'flat',n:'Apartment in Philipsburg',cost:25000,perk:'Heat −1 every new day'},
  {id:'villa',n:'Villa above Simpson Bay',cost:120000,perk:'Heat −2 every new day, laundering fees −5%'},
  {id:'strip',n:'Private strip on a quiet cay',cost:600000,perk:'Network runs pay +20%, Heat −3 every new day'} ];
function safeLevel(st){ const c=crime(st); return SAFEHOUSES.findIndex(s=>s.id===c.safe); }
function dailyCosts(st){ const d=st.story.done; const L=[]; FLEET.forEach(f=>{ if(d[f[0]] && UPKEEP[f[1]]) L.push([`${f[2]} (${f[3]}) upkeep`, UPKEEP[f[1]]]); }); const c=crime(st); if(c.crew){ for(const k in WAGES) if(crewHas(st,k)) L.push([`${CREW.find(x=>x.id===k).n} wages`, WAGES[k]]); } return L; }
(function(){ const _g=genJobs; genJobs=function(st){ const L=_g(st); try{ if(crime(st).safe==='strip') L.forEach(j=>{ if(j.network) j.pay=Math.round(j.pay*1.2/10)*10; }); }catch(_){} return L; }; })();
const _ecLaunder = launderOpts;
launderOpts = function(st){ const L=_ecLaunder(st); return safeLevel(st)>=1 ? L.map(o=>Object.assign({},o,{fee:Math.max(0.03,o.fee-0.05)})) : L; };
function operationHTML(st){ const c=crime(st); if(!c.on) return ''; const L=dailyCosts(st); const tot=L.reduce((s,x)=>s+x[1],0); const lv=safeLevel(st);
  return `<section class="panel op-panel"><p class="label">Your operation</p><div class="op-grid">
    <div><h3>Daily costs <span class="mono">${money(tot)}</span></h3>${L.length?`<ul class="tight small">${L.map(x=>`<li>${esc(x[0])}: ${money(x[1])}</li>`).join('')}</ul>`:'<p class="small muted">Nothing yet. Jets and crew cost money every day.</p>'}</div>
    <div><h3>Safehouse</h3>${SAFEHOUSES.map((s,i)=>`<div class="fc-row"><div><b>${esc(s.n)}</b><p class="small muted">${esc(s.perk)}</p></div>${i<=lv?'<span class="chip good">Yours</span>':i===lv+1?`<button class="btn sm" data-act="buy-safe" data-v="${s.id}" ${st.cash<s.cost?'disabled':''}>Buy · ${money(s.cost)}</button>`:`<span class="small muted">${money(s.cost)}</span>`}</div>`).join('')}</div></div></section>`; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="buy-safe"]'); if(!b||!S.st) return; const s=SAFEHOUSES.find(x=>x.id===b.dataset.v); if(!s||S.st.cash<s.cost) return; txn(S.st,-s.cost,'Safehouse',s.n); crime().safe=s.id; save(); toast(`Bought: ${s.n}.`); S.keepScroll=true; render(); });
(function(){ const _m=moneyView; moneyView=function(){ const h=_m(); try{ const o=operationHTML(S.st); return o ? h.replace(/(<main[^>]*>(?:<div class="subtabs">[\s\S]*?<\/div>)?)/, '$1'+o) : h; }catch(_){ return h; } }; })();
(function(){ const _sv=storyView; storyView=function(){ const h=_sv(); try{ const o=operationHTML(S.st); return o ? h.replace('<section class="panel"><h3>The five acts</h3>', o+'<section class="panel"><h3>The five acts</h3>') : h; }catch(_){ return h; } }; })();


/* ===================== MONEY PAGE =====================
   Cash, savings, debt and net worth; the income statement; housing and fuel; the transaction list.
   With the crime story on, your operation (crew, safehouses) and dirty cash sit at the top.
   The bank (savings, credit line, bond) is folded away at the bottom. */

function safeHTML(f){ try{ return f()||''; }catch(_){ return ''; } }

function moneyView(){
  const st=S.st; const F=fin(st); const per = S.finPeriod||7; const fromDay = per==='all'?0:st.day-per+1;
  const sums = sumBy(st, fromDay); const groups={in:[],op:[],inv:[],fin:[]};
  Object.keys(sums).sort((a,b)=>Math.abs(sums[b])-Math.abs(sums[a])).forEach(k=>groups[CAT_GROUP[k]||'op'].push([k,sums[k]]));
  const tot = g=>groups[g].reduce((s,x)=>s+x[1],0);
  const opProfit = tot('in')+tot('op');
  const row = ([k,v])=>`<tr><td>${esc(k)}</td><td class="num" style="color:${v<0?'var(--bad)':'var(--good)'}">${money(v)}</td></tr>`;
  const H=HOUSING[F.housing]||HOUSING.bunk; const lim=creditLimit(st);
  // charts
  const hist = F.history.slice(-60); const W=600,Hh=160,P=28;
  let nwChart = `<p class="small muted">Rest a few days to build up a history.</p>`;
  if(hist.length>=2){ const vals=hist.flatMap(h=>[h.net,h.cash]); const mn=Math.min(0,...vals), mx=Math.max(1,...vals); const x=i=>P+i*(W-2*P)/(hist.length-1), y=v=>Hh-P-(v-mn)/(mx-mn)*(Hh-2*P);
    const line=k=>hist.map((h,i)=>`${x(i).toFixed(1)},${y(h[k]).toFixed(1)}`).join(' ');
    nwChart = `<svg viewBox="0 0 ${W} ${Hh}" class="chart" role="img" aria-label="Net worth and cash over time"><line x1="${P}" x2="${W-P}" y1="${y(0)}" y2="${y(0)}" class="cg"/><text x="2" y="${y(mx)+4}" class="ct">${money(mx).replace('$','$')}</text><text x="2" y="${y(mn)+4}" class="ct">${money(mn)}</text><polyline points="${line('cash')}" class="cl2"/><polyline points="${line('net')}" class="cl"/><circle cx="${x(hist.length-1)}" cy="${y(hist[hist.length-1].net)}" r="4" class="cd gB"/></svg><div class="row small muted" style="gap:14px"><span><i class="lk sea"></i> Net worth</span><span><i class="lk sky"></i> Cash</span></div>`; }
  const days=[]; for(let d=Math.max(1,st.day-13); d<=st.day; d++){ let inc=0,exp=0; const dd=F.days[d]||{}; for(const c in dd){ if(CAT_GROUP[c]==='in') inc+=dd[c]; else if(CAT_GROUP[c]==='op') exp+=dd[c]; } days.push({d,inc,exp}); }
  const mxb=Math.max(1,...days.map(x=>Math.max(x.inc,-x.exp))); const bw=(W-2*P)/days.length;
  const bars = `<svg viewBox="0 0 ${W} ${Hh}" class="chart" role="img" aria-label="Daily income and expenses, last 14 days"><line x1="${P}" x2="${W-P}" y1="${Hh/2}" y2="${Hh/2}" class="cg"/>${days.map((x,i)=>{ const hi=(x.inc/mxb)*(Hh/2-P/2), he=(-x.exp/mxb)*(Hh/2-P/2); return `<rect x="${P+i*bw+bw*0.15}" y="${Hh/2-hi}" width="${bw*0.7}" height="${Math.max(0,hi)}" class="bi"><title>Day ${x.d}: income ${money(x.inc)}</title></rect><rect x="${P+i*bw+bw*0.15}" y="${Hh/2}" width="${bw*0.7}" height="${Math.max(0,he)}" class="be"><title>Day ${x.d}: expenses ${money(x.exp)}</title></rect><text x="${P+i*bw+bw/2}" y="${Hh-4}" text-anchor="middle" class="ct">${x.d}</text>`; }).join('')}</svg>`;
  const bank = `<section class="panel stack"><h3>Island Trust Bank</h3>
          <dl class="kv small"><dt>Savings</dt><dd>${money(F.savings)} at 4.5% APY</dd><dt>Credit line</dt><dd>${money(F.credit)} used of ${money(lim)} at 19.9% APR</dd><dt>Credit score</dt><dd>${Math.round(F.score)} · aircraft loans at ${(loanRate(st)*100).toFixed(1)}% APR</dd>${F.bond>0?`<dt>Training bond</dt><dd>${money(F.bond)} owed to Coral Wing, repaid at 20% of each flight's pay</dd>`:''}</dl>
          <label class="field"><span>Amount</span><input id="fin-amt" type="number" min="0" step="100" value="1000"></label>
          <div class="row"><button class="btn sm" data-act="fin-dep">Deposit</button><button class="btn sm" data-act="fin-wd">Withdraw</button><button class="btn sm" data-act="fin-draw">Borrow</button><button class="btn sm" data-act="fin-repay">Repay credit</button>${F.bond>0?`<button class="btn sm" data-act="fin-bond">Repay bond</button>`:''}</div>
          <p class="tiny muted">Paying debts on time raises your score. Overdrafts drop it. If your cash goes negative, the bank automatically draws on your credit line.</p></section>`;
  return `<main class="wrap stack fade">${safeHTML(()=>operationHTML(st))}${safeHTML(()=>launderHTML(st))}
    <div class="tiles">
      <div class="tile"><span class="label">Cash</span><b class="mono">${money(st.cash)}</b><span class="tiny muted">${seasonName(st)} · charter demand ${demandIndex(st)>=1?'+':''}${Math.round((demandIndex(st)-1)*100)}%</span></div>
      <div class="tile"><span class="label">Savings</span><b class="mono">${money(F.savings)}</b><span class="tiny muted">4.5% APY</span></div>
      <div class="tile"><span class="label">Debt</span><b class="mono">${money(debtTotal(st))}</b><span class="tiny muted">Credit score ${Math.round(F.score)}</span></div>
      <div class="tile"><span class="label">Net worth</span><b class="mono">${money(netWorth(st))}</b><span class="tiny muted">Cash + savings + aircraft equity − debt</span></div>
    </div>
    <div class="grid-2">
      <section class="panel stack"><div class="row between"><h3>Net worth</h3><span class="small muted">${hist.length>=2?`Last ${hist.length} days`:""}</span></div>${nwChart}</section>
      <section class="panel stack"><div class="row between"><h3>Daily income vs expenses</h3><span class="small muted">Last 14 days</span></div>${bars}<div class="row small muted" style="gap:14px"><span><i class="lk good"></i> Income</span><span><i class="lk bad"></i> Operating expenses</span></div></section>
    </div>
    <div class="grid-2">
      <section class="panel stack"><div class="row between"><h2>Income statement</h2><div class="row">${[[7,'7 days'],[30,'30 days'],['all','All time']].map(([v,l])=>`<button class="btn sm ${String(per)===String(v)?'primary':''}" data-act="fin-period" data-p="${v}">${l}</button>`).join('')}</div></div>
        <div class="scroll-x"><table><tbody>
          <tr><th colspan="2">Income</th></tr>${groups.in.map(row).join('')||'<tr><td class="muted">None yet</td><td></td></tr>'}
          <tr><td><b>Total income</b></td><td class="num"><b>${money(tot('in'))}</b></td></tr>
          <tr><th colspan="2">Operating expenses</th></tr>${groups.op.map(row).join('')||'<tr><td class="muted">None yet</td><td></td></tr>'}
          <tr><td><b>Total expenses</b></td><td class="num"><b>${money(tot('op'))}</b></td></tr>
          <tr><td><b>Operating profit</b></td><td class="num"><b style="color:${opProfit<0?'var(--bad)':'var(--good)'}">${money(opProfit)}</b></td></tr>
          ${groups.inv.length||groups.fin.length?`<tr><th colspan="2">Investing & financing</th></tr>${[...groups.inv,...groups.fin].map(row).join('')}`:''}
        </tbody></table></div>
        <p class="tiny muted">Operating profit excludes aircraft purchases and sales, loan principal and bond repayments, which change what you own and owe rather than what you earn.</p></section>
      <aside class="stack">
        <section class="panel stack"><h3>Where you live</h3><p class="small"><b>${esc(H.n)}</b> · ${money(H.rent)}/day</p><p class="small muted">${esc(H.blurb)}</p>
          <select id="fin-house" aria-label="Housing">${Object.entries(HOUSING).map(([k,h])=>`<option value="${k}" ${k===F.housing?'selected':''}>${esc(h.n)} · ${money(h.rent)}/day${h.rep?` · +${h.rep} rep/week`:''}</option>`).join('')}</select></section>
        <section class="panel stack"><h3>Fuel today at ${esc(st.loc)}</h3><dl class="kv small"><dt>Avgas</dt><dd class="mono">$${fuelPrice(st,st.loc,'avgas').toFixed(2)}/gal</dd><dt>Jet-A</dt><dd class="mono">$${fuelPrice(st,st.loc,'jeta').toFixed(2)}/gal</dd><dt>Oil index</dt><dd class="mono">${F.oil.toFixed(2)}</dd></dl><p class="tiny muted">Small islands charge more. Fuel only costs you money on your own company's aircraft.</p></section>
      </aside>
    </div>
    <section class="panel"><div class="section-title"><h2>Transactions</h2><span class="small muted">Most recent first</span></div><div class="scroll-x"><table><thead><tr><th>Day</th><th>Category</th><th>Details</th><th class="num">Amount</th></tr></thead><tbody>${F.ledger.slice(0,60).map(e=>`<tr><td class="mono">${e.d} · ${hhmm(e.t)}</td><td>${esc(e.c)}${e.transfer?' <span class="chip">transfer</span>':''}</td><td style="white-space:normal">${esc(e.m)}</td><td class="num" style="color:${e.a<0?'var(--bad)':'var(--good)'}">${money(e.a)}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">No transactions yet. Fly a job.</td></tr>'}</tbody></table></div></section>
    <details class="calm-more"><summary>Bank, savings, credit and housing</summary><div class="calm-more-in">${bank}</div></details>
  </main>`;
}

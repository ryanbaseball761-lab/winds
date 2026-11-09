/* ================= 3. Power and Heat matter ================= */
/* network runs: higher pay, more heat; there are more of them as your Power grows */
const NET_TITLES = [`Unmarked crates`,`Sealed cargo`,`"Medical supplies"`,`Cash bags`,`"Spare parts"`,`Wrapped bundles`];
(function(){ const _g=genJobs; genJobs=function(st){ const L=_g(st); try{ const c=crime(st); if(!c.on) return L; const n=1+(c.power>=45?1:0)+(c.power>=70?1:0); let k=0;
  L.forEach(j=>{ if(k<n && j.kind==='gen' && j.cargo>0 && !j.special && !j.story){ k++; j.network=true; j.label='Network run'; j.title=`${pick(NET_TITLES)} for the network`; j.client='The network'; j.pay=Math.round(j.pay*(1.6+c.power/100)/10)*10; j.scen=null; } }); }catch(_){} return L; }; })();
(function(){ const _ap=applyResult; applyResult=function(st, job, f, res){ const r=_ap(st, job, f, res); try{ const c=crime(st); const o=st.last&&st.last.out; if(!c.on || res.crash) return r;
  if(job.network){ crBump(c,'heat',7); crBump(c,'power',1); }   // (the legit -2 in 67 already ran; net +5)
  if((job.network || job.kind==='story') && o){
    if(c.heat>=90){ txn(st,-50000,'Payoffs',`Lawyers, ${job.to}`); crBump(c,'power',-10); c.heat=50; o.notes.push(`BUSTED at ${job.to}. Customs found the hidden compartment. The network's lawyers got you out for $50,000. Power −10, Heat down to 50.`); try{ setTimeout(()=>takeover({kind:'orders',kicker:'Busted',title:`Customs at ${job.to}`,text:`They found the hidden compartment. The network's lawyers got you out, for $50,000.`,ms:9000}),600); }catch(_){} }
    else if(c.heat>=60){ if(res.grade==='A'||res.grade==='B'){ o.notes.push(`Customs came out to the plane, but a clean landing and calm answers got you waved through. Heat −5.`); crBump(c,'heat',-5); }
      else { const cost=Math.round(c.heat*60/10)*10; txn(st,-cost,'Payoffs',`Customs at ${job.to}`); crBump(c,'heat',-15); o.notes.push(`Customs searched the plane at ${job.to}. Your people made it go away for ${money(cost)}. Heat −15. (A cleaner landing gets you waved through.)`); } } } }catch(_){} return r; }; })();
const _netStrip = stripHTML;
stripHTML = function(st, job, opts){ const h=_netStrip(st, job, opts); return job.network ? h.replace(/(<article[^>]*class="jcard[^"]*"[^>]*>)/, '$1<span class="net-tag">Network · +Heat</span>') : h; };


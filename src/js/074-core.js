/* ================= 3. Power and Heat matter ================= */
/* network runs: higher pay, more heat; there are more of them as your Power grows */
const NET_TITLES = [`Unmarked crates`,`Sealed cargo`,`"Medical supplies"`,`Cash bags`,`"Spare parts"`,`Wrapped bundles`];
(function(){ const _g=genJobs; genJobs=function(st){ const L=_g(st); try{ const c=crime(st); if(!c.on) return L; const n=1+(c.power>=45?1:0)+(c.power>=70?1:0); let k=0;
  L.forEach(j=>{ if(k<n && j.kind==='gen' && j.cargo>0 && !j.special && !j.story){ k++; j.network=true; j.label='Network run'; j.title=`${pick(NET_TITLES)} for the network`; j.client='The network'; j.pay=Math.round(j.pay*(1.6+c.power/100)/10)*10; j.scen=null; } }); }catch(_){} return L; }; })();
const _netStrip = stripHTML;
stripHTML = function(st, job, opts){ const h=_netStrip(st, job, opts); return job.network ? h.replace(/(<article[^>]*class="jcard[^"]*"[^>]*>)/, '$1<span class="net-tag">Network · +Heat</span>') : h; };


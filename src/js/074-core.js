/* ================= 3. Power and Heat matter ================= */
/* network runs: higher pay, more heat; there are more of them as your Power grows */
const NET_TITLES = [`Unmarked crates`,`Sealed cargo`,`"Medical supplies"`,`Cash bags`,`"Spare parts"`,`Wrapped bundles`];
const _netStrip = stripHTML;
stripHTML = function(st, job, opts){ const h=_netStrip(st, job, opts); return job.network ? h.replace(/(<article[^>]*class="jcard[^"]*"[^>]*>)/, '$1<span class="net-tag">Network · +Heat</span>') : h; };


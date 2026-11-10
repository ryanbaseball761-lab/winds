/* ===================== JOB CARDS (replaces the flight-strip board) ===================== */
const WX_ICON = {
  sun:`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  cloud:`<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18z"/>`,
  rain:`<path d="M7 15h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 8 3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/>`,
  storm:`<path d="M7 14h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 7 3.5 3.5 0 0 0 7 14zM13 14l-3 4h4l-2 4"/>`,
  haze:`<path d="M3 9h14M5 13h16M3 17h14M17 5h2"/>`,
  wind:`<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>`
};
function wxIconKey(w){ const k=w.key||''; return k==='tstorm'?'storm': k==='showers'||k==='wave'?'rain': k==='dust'?'haze': k==='north'?'wind': (w.cl&&w.cl.some(c=>c[0]==='BKN'||c[0]==='OVC'))?'cloud':'sun'; }

const ICO_PLANE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5v2l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z"/></svg>`;

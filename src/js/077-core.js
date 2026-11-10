/* ================= 6. the story is the home screen ================= */
const PEOPLE = ['dez','mari','castillo','hartwell','tico','reyes','medina'];
function personStatus(st, k){ const f=flagsOf(st), c=crime(st), d=st.story.done;
  return ({ dez: f.dezFree?'Out on bail, and loyal to you.':f.dezJail?'Serving eight years. Never said your name.':'Coral Wing mechanic. Your fixer.',
    mari: f.mari?'Your partner.':d.CR13?'Gone. Left on the morning ferry.':d.CR3?'Owner of Coral Wing. Suspects something.':'Owner of Coral Wing Air. Your boss.',
    castillo: c.ending==='kingpin'?'Gone. Put on a flight to nowhere.':c.ending==='witness'?'In federal prison.':d.CRB?'Sold you out. Your enemy now.':f.defied?'You told him no. He remembers.':d.CR4?'Your boss.':'A polite man in a linen suit.',
    hartwell: d.CR14?(f.ledgers?'Gave you the ledgers. You gave them to Reyes.':'Gave you the ledgers that hold Castillo.'):'Billionaire on Mustique. His charity owns the jet.',
    tico: f.ticoRan?'Ran. Alive, somewhere.':d.CR11?'Never seen again.':'Your loader. Wants to be a pilot.',
    reyes: f.informant?'Your handler. You wear her wire.':d.CR9?'Watching you. Patiently.':'DEA. You haven\'t met yet.',
    medina: f.medinaBurned?'Arrested by the DEA, thanks to you.':f.medinaAlly?'Your partner, for now.':f.medinaDeal?'Thinks you work for him.':'Castillo\'s rival.' })[k]||''; }
function metPeople(st){ const seen=new Set(); mainChapters().forEach(m=>{ if(st.story.done[m.id]) dynM(st,m).chars.forEach(k=>seen.add(k)); }); const next=mainChapters().find(m=>!st.story.done[m.id]); if(next) dynM(st,next).chars.forEach(k=>seen.add(k)); return PEOPLE.filter(k=>seen.has(k)); }
/* the story card uses the right cast, and the nerve line */

/* nav: "Main story" first; the app opens on it */

/* ---- styles ---- */
(function(){ const css=`
.beat{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9998;width:min(640px,calc(100vw - 32px));animation:btIn .35s ease}
.beat.out{opacity:0;transform:translate(-50%,12px);transition:.35s}
.bt-in{background:rgba(12,12,14,.96);color:#ece6da;border:1px solid #2b2b30;border-left:4px solid #c8962a;border-radius:14px;padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,.55)}
.beat-self .bt-in{border-left-color:#8f897e}.beat-radio .bt-in{border-left-color:#5f8fb0}.beat-reyes .bt-in{border-left-color:#5f7d9c}.beat-castillo .bt-in,.beat-medina .bt-in{border-left-color:#c23a2b}
.bt-k{font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c8962a;margin:0 0 6px;display:flex;align-items:center;gap:8px}
.bt-ring{width:8px;height:8px;border-radius:50%;background:#c23a2b;box-shadow:0 0 0 0 rgba(194,58,43,.6);animation:btRing 1.2s infinite}
.bt-t{font-size:17px;line-height:1.45;margin:0}.beat-self .bt-t{font-style:italic;color:#d6d0c4}
.bt-nar{display:block;margin-top:6px;font-size:15px;font-style:italic;color:#bdb6a8}
.bt-o{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.bt-r{margin:10px 0 0;font-size:14px;color:#bdb6a8}
@keyframes btIn{from{opacity:0;transform:translate(-50%,16px)}}@keyframes btRing{70%{box-shadow:0 0 0 8px rgba(194,58,43,0)}100%{box-shadow:0 0 0 0 rgba(194,58,43,0)}}
.net-tag{position:absolute;top:10px;left:10px;z-index:2;font-family:var(--f-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;background:#b8321f;color:#fff;padding:3px 8px;border-radius:4px}
.story-home .sh-head{margin:4px 0 14px}.story-home .sh-head h1{font-size:30px;margin:2px 0}
.sh-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin:16px 0}
.sh-time{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:12px}.sh-time li{display:grid;grid-template-columns:28px 1fr;gap:10px}
.sh-n{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c)}
.sh-time p{margin:2px 0 0;font-size:14px;color:var(--muted)}.sh-time .sh-ch{color:var(--c);font-size:13px}
.sh-people{display:grid;gap:12px;margin-top:8px}.sh-p{display:grid;grid-template-columns:40px 1fr;gap:10px;align-items:center}.sh-p .avatar{width:40px;height:40px}.sh-p p{margin:0;font-size:13px;color:var(--muted)}
.sh-acts{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:8px}.sh-act h4{color:var(--c);margin:2px 0 6px}.sh-act ol{list-style:none;padding:0;margin:0;font-size:13px;display:grid;gap:4px}.sh-act li{color:var(--muted)}.sh-act li.d{color:var(--ink)}.sh-act li.n{color:var(--c);font-weight:700}.sh-act small{display:block;font-size:11px;opacity:.75;margin-left:14px}
@media (max-width:900px){.sh-grid{grid-template-columns:1fr}.sh-acts{grid-template-columns:1fr 1fr}}`;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); })();
VIEW_META.story = ['Main story','One story in five acts. Everything else is side work.'];
VIEW_META.board = ['Side jobs','Legit work, network runs and checkrides'];

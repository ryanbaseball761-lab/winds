/* ===================== BETA FEEDBACK =====================
   During the beta, every story chapter's result screen asks one quick question: how was that chapter?
   Answers stay in the save and go into "Report a problem" exports, so testers can send everything at once.
   BETA.links: where the Feedback buttons point (fill in the Discord invite / form when they exist).
   Set BETA.on = false for the 1.0 release. */
const BETA = { on:true, links:{ discord:'', form:'' } };

function betaFeedbackHTML(st){ const L=st.last; if(!BETA.on || !L || !L.job || L.job.kind!=='story') return '';
  const id=L.job.story, had=(st.feedback||[]).find(f=>f.ch===id && f.v===TW_VERSION);
  if(had) return `<section class="panel row between beta-fb"><p class="small muted">Thanks: your note on this chapter is saved and goes with your next report.</p>${betaLinksHTML()}</section>`;
  return `<section class="panel stack beta-fb"><div class="row between"><div><p class="label">Beta</p><h3>How was this chapter?</h3></div>${betaLinksHTML()}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap">${[['great','Loved it'],['ok','It was fine'],['confusing','Confusing'],['bad','Didn\'t like it']].map(([k,l])=>`<button class="btn sm" data-act="beta-fb" data-v="${k}">${l}</button>`).join('')}</div>
    <label class="field"><span>Anything to add? (optional)</span><input id="beta-note" maxlength="400" placeholder="What confused you, what you loved, what broke…"></label></section>`; }
function betaLinksHTML(){ const L=BETA.links; return (L.discord||L.form) ? `<div class="row" style="gap:6px">${L.discord?`<a class="btn sm" href="${esc(L.discord)}" target="_blank" rel="noopener">Beta Discord</a>`:''}${L.form?`<a class="btn sm" href="${esc(L.form)}" target="_blank" rel="noopener">Feedback form</a>`:''}</div>` : ''; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="beta-fb"]'); if(!b||!S.st||!S.st.last) return; const st=S.st, L=st.last;
  const note=((document.getElementById('beta-note')||{}).value||'').trim().slice(0,400);
  st.feedback=(st.feedback||[]).concat([{ch:L.job.story, title:L.job.title, r:b.dataset.v, note, grade:L.res&&L.res.grade, v:TW_VERSION, t:Date.now()}]).slice(-60);
  save(); toast('Thanks! Saved with your career; it goes with your next report.'); S.keepScroll=true; render(); });

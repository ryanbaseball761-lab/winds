/* ================= 5. who you are: the sidebar and profile follow the story ================= */
function storyRole(st){ const c=crime(st); if(c.ending==='kingpin') return 'Kingpin'; if(c.ending==='witness') return 'New name, new island'; if(c.ending==='ghost') return 'Whereabouts unknown';
  if(st.story.done.CR15) return 'Caribe Cargo (owner)'; if(c.on) return "Castillo's network"; return 'Coral Wing Air'; }
const TEXT_FIX = [[/Coral Wing ops board/g,'Island ops board'],[/Ana Reyes \(Winair\)/g,'Ana Ruiz (Winair)'],[/(Tip: )?Coral Wing's story has a chapter called[^.]*\./g,'Your own airline, Caribe Cargo, comes later in the main story.']];
function fixText(root){ if(!root||!S.st) return; const role=storyRole(S.st); const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n=>{ let t=n.nodeValue, o=t; if(t.indexOf('Coral Wing Air')>=0 && role!=='Coral Wing Air' && !(n.parentElement&&n.parentElement.closest('.story-body,.brief,.choice,.hq-prev,.sh-time'))) t=t.replace(/Coral Wing Air/g, role); TEXT_FIX.forEach(([re,r])=>{ t=t.replace(re,r); }); if(t!==o) n.nodeValue=t; }); }
(function(){ const _r=render; render=function(){ const x=_r.apply(this, arguments); try{ fixText(document.body); }catch(_){} return x; }; })();
const _s3Setup = setupView;
setupView = function(){ return _s3Setup().replace(/You arrive in St\. Martin with a fresh private license and 62 hours\.[^<]*/, `You arrive in St. Martin with a fresh licence and a cheap job flying a Cessna for Coral Wing Air. Then the mechanic, Dez, asks you for a small favor. Five acts later you're flying a 747 full of contraband, and either running the Caribbean or running from it.`); };


/* ===================== STORY, PART 3: continuity, in-flight moments, a story home, and a quieter cabin ===================== */

/* ---- two more people ---- */
CAST.tico = {n:`Tico Alvarez`, role:`Loader`, col:'#3f7f5a', bio:`Twenty-two, never stops talking, wants to be a pilot more than anything.`};
CAST.medina = {n:`Rafael Medina`, role:`Castillo's rival`, col:'#8a5a1f', bio:`Runs boats and planes out of Venezuela. Charming, patient and completely ruthless.`};
if(typeof PORTRAIT!=='undefined'){
  PORTRAIT.tico = {skin:'#b07a4f', hair:'#16110d', style:'messy', top:'tee', topC:'#2f6f4f', acc:[]};
  PORTRAIT.medina = {skin:'#c08a5c', hair:'#2a2018', style:'short', top:'hawaii', topC:'#e9e2d0', acc:['mustache']};
}
try{ const r=RIVALS.find(x=>/^Ana Reyes/.test(x.n)); if(r) r.n='Ana Ruiz (Winair)'; }catch(_){}


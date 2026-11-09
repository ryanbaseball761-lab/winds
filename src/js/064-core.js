/* ===================== HW2 "Below the Surface": a short hand-flown hop on St. Martin, landing in Simpson Bay Lagoon beside TNCM ===================== */
AP.WSBL = {n:`Simpson Bay Lagoon (water)`, isl:`Sint Maarten`, c:'SXM', r:'LEE', lat:18.0480, lon:-63.0880, el:0, water:true,
  note:`The big sheltered lagoon right beside Princess Juliana (TNCM). Look for it just north-east of the runway. Land in open water away from the moored yachts and the causeway bridge.`};
/* HW2 "Below the Surface": no water landing. A slow photo run along the reef from Grand Case, landing on the runway at Juliana (TNCM) */
(function(){ const m=STORY.find(x=>x.id==='HW2'); if(!m) return;
  Object.assign(m, { from:'TFFG', to:'TNCM', dep:450, ac:['C172','DA40','G36','A5','C208'], req:{after:'HW1'},
    brief:[`Hartwell's secret turns out to be a reef. Through a foundation that never uses his name, he's funding coral restoration around St. Martin. The project's lead scientist, Dr. Amara Okafor, needs aerial photos of the new coral nurseries off Creole Rock and along the south coast before the afternoon wind ruffles the water.`,
      `"Calm morning, low sun, glassy water," she says, strapping a camera rig to the door frame. "Perfect for photographs. Take off from Grand Case, fly slowly down the coast so I can shoot, and land us at Juliana." It's a short hop you can fly by hand the whole way.`],
    teach:[`For photos, fly slow and steady: about 1,000 ft, a little flap, and gentle turns. A level wing makes for sharp pictures.`,
      `Princess Juliana is busy. Expect to hold or extend for jet traffic, and leave room behind heavy jets for their wake.`],
    out:{ good:`Amara gets 600 clean frames of the nurseries. On the ramp she shows you one with a hawksbill turtle gliding over the reef. "Lionel will want this one framed," she says.`,
      ok:`The photos are usable. The landing was a little firm, and Amara's coffee is now on the ceiling.`,
      bad:`The flight got rough and half the photos are blurred. Amara is gracious about it, and the foundation pays the invoice anyway.` } });
})();


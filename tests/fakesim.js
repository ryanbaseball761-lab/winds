// Page-side helpers for tests: a virtual clock (timers only fire when the test advances time)
// and a scripted MSFS flight that feeds the game the same data the real bridge sends.
// Use: await ctx.addInitScript(require('./fakesim').INIT)
exports.INIT = `(()=>{
  let seed=1234567; Math.random=()=>{ seed=(seed*1103515245+12345)%2147483648; return seed/2147483648; };
  let T=Date.UTC(2026,5,1,16,0,0); const _D=Date; class D extends _D{ constructor(...a){ super(...(a.length?a:[T])); } static now(){ return T; } } window.Date=D;
  const timers=[]; let id=1;
  window.setTimeout=(fn,ms,...a)=>{ if(typeof fn!=='function') return 0; timers.push({id:++id,fn,a,due:T+(ms||0)}); return id; };
  window.setInterval=(fn,ms,...a)=>{ timers.push({id:++id,fn,a,due:T+(ms||0),every:Math.max(50,ms||0)}); return id; };
  window.clearTimeout=window.clearInterval=i=>{ const k=timers.findIndex(t=>t.id===i); if(k>=0) timers.splice(k,1); };
  for(const k of ['speechSynthesis','AudioContext','webkitAudioContext']){ try{ Object.defineProperty(window,k,{value:undefined,configurable:true,writable:true}); }catch(_){} }
  // advance the virtual clock, firing timers in due order (an interval fires at most 60 times per call)
  window.__tick=(ms)=>{ const end=T+ms; const fired={}; for(let guard=0; guard<20000; guard++){ const due=timers.filter(t=>t.due<=end && (fired[t.id]||0)<60).sort((a,b)=>a.due-b.due||a.id-b.id)[0]; if(!due) break;
      T=Math.max(T,due.due); fired[due.id]=(fired[due.id]||0)+1; if(due.every) due.due=T+due.every; else timers.splice(timers.indexOf(due),1); try{ due.fn(...due.a); }catch(e){ (window.__errs=window.__errs||[]).push(String(e&&e.message||e)); } }
    timers.forEach(t=>{ if(t.every && t.due<=end) t.due=end+t.every; }); T=end; };
  window.__now=()=>T;

  // ---- scripted flight ----
  const lerp=(a,b,f)=>a+(b-a)*f;
  window.__fake={ rec:null,
    start(job, opt){ opt=opt||{}; const A=AP[job.from], B=job.local?AP[job.from]:AP[job.to]; const ac=AC[job.ac]||{}; const jet=(ac.cruise||120)>250;
      this.o={job,A,B,ac,cruiseAlt:jet?31000:5500,ias:ac.cruise||120,fpm:opt.fpm==null?140:opt.fpm,bounces:opt.bounces||0,g:opt.g||1.2,divert:opt.divert||null,fuel0:jet?6000:300,t0:T};
      this.rec={id:'fake01',phase:'waiting',armedAt:T,blockOut:null,takeoff:null,touchdown:null,blockIn:null,blockMinutes:null,airborneMinutes:0,fuelAtBlockOutLb:null,fuelUsedLb:null,fuelNowLb:this.o.fuel0,maxAltFt:0,distanceNm:0,bounces:0,landings:[],events:[],track:[],approach:null}; this.k=-1; },
    // frame k: 0 parked, 1 engine on, 2-3 taxi, 4 roll, 5 airborne, 6-12 climb, 13-28 cruise, 29-36 descent, 37 final, 38 touchdown, 39 rollout, 40 taxi in, 41 stopped, 42 parked
    frame(k){ const o=this.o, r=this.rec; this.k=k; const f=Math.min(1,Math.max(0,(k-4)/34)); const elev=k<20?(o.A.elev||10):(o.B.elev||10);
      let lat,lon; const dest=o.divert?AP[o.divert]:o.B;
      if(o.job.local){ const out=f<0.5?f*2:(1-f)*2; lat=o.A.lat+out*0.25; lon=o.A.lon+out*0.1; } else { lat=lerp(o.A.lat,dest.lat,f); lon=lerp(o.A.lon,dest.lon,f); }
      const air=k>=5&&k<38; let alt=elev, vs=0, ias=0, gs=0;
      if(k===2||k===3||k===40){ gs=ias=12; } if(k===4){ gs=ias=55; } if(k===39){ gs=ias=30; }
      if(air){ if(k<=12){ alt=elev+(o.cruiseAlt-elev)*((k-4)/9); vs=900; ias=Math.min(o.ias,90+(k-5)*20); } else if(k<=28){ alt=o.cruiseAlt; vs=0; ias=o.ias; } else if(k<=36){ alt=o.cruiseAlt-(o.cruiseAlt-elev-1500)*((k-28)/8); vs=-800; ias=Math.max(110,o.ias*0.7); } else { alt=elev+300; vs=-500; ias=85; } gs=ias; }
      const engine=k>=1&&k<=40; const fuel=o.fuel0-(k>0?k*o.fuel0*0.012:0); const t=T;
      if(k>=2&&!r.blockOut){ r.blockOut={t,s:0,lat,lon}; r.fuelAtBlockOutLb=Math.round(o.fuel0); r.phase='taxi-out'; r.events.push({t,msg:'Block out: taxiing'}); }
      if(k>=5&&!r.takeoff){ r.takeoff={t,lat,lon,ias:Math.round(ias)}; r.phase='airborne'; r.events.push({t,msg:'Takeoff'}); }
      if(air){ r.phase='airborne'; r.track.push([Math.round(lat*1e4)/1e4,Math.round(lon*1e4)/1e4,Math.round(alt)]); r.maxAltFt=Math.max(r.maxAltFt,Math.round(alt)); r.airborneMinutes=Math.round((t-r.takeoff.t)/60000); }
      if(k>=38&&!r.touchdown){ const td={t,lat,lon,fpm:o.fpm,g:o.g,ias:70,hdg:100,source:'sim touchdown velocity'}; r.touchdown=td; r.landings=[td]; r.bounces=o.bounces; r.phase='landed'; r.approach=[[-30,400,85,-500],[-15,200,80,-450],[-5,50,75,-300],[0,0,70,-Math.abs(o.fpm)]]; r.events.push({t,msg:'Touchdown at '+o.fpm+' fpm'}); }
      if(k===40) r.phase='taxi-in'; if(k>=42&&!r.blockIn){ r.blockIn={t,s:0,lat,lon}; r.phase='in'; r.events.push({t,msg:'Block in: parked'}); }
      if(r.blockOut){ r.blockMinutes=Math.round(((r.blockIn?r.blockIn.t:t)-r.blockOut.t)/60000); r.fuelUsedLb=Math.round(o.fuel0-fuel); } r.fuelNowLb=Math.round(fuel);
      if(r.takeoff){ r.distanceNm=Math.round(distNm(o.A,{lat,lon})*10)/10; }
      return { bridge:'ok', version:'1.4.0', mock:false, connected:true, receivingData:true, simulator:'KittyHawk', note:null,
        aircraft:{title:o.ac.n||'Cessna 172', atcId:'N123TW'}, position:{lat,lon,altFt:Math.round(alt),aglFt:Math.round(alt-elev),hdg:100},
        motion:{ias:Math.round(ias),gs:Math.round(gs),vsFpm:vs,onGround:!air,gForce:k===38?o.g:1}, systems:{engineRunning:engine,parkingBrake:k<2||k>=41,fuelLb:Math.round(fuel),fuelGal:Math.round(fuel/6*10)/10},
        spec:{tanks:{left:28,right:28,center:0},stations:4,cruiseKt:o.ias,vs0Kt:40,engines:1,engineType:'piston',maxGrossLb:2550,emptyLb:1680,fuelGal:56,retractable:false,floats:false},
        ext:{flaps:{handle:k>=36&&k<=39?2:0,left:k>=36&&k<=39?50:0,right:k>=36&&k<=39?50:0,overspeed:false,damaged:false},gear:{down:true,retractable:false,overspeed:false,damaged:false},attitude:{bank:k===8?20:0,pitch:air&&k<=12?8:0},warnings:{stall:false,overspeed:false},controls:{yokeX:0,yokeY:0,rudder:0,aileron:0},lights:{landing:k<8||k>34,beacon:engine},autopilot:k>12&&k<34,simRate:1,weather:{windDir:90,windKt:14,visSm:10,oatC:28,qnhHpa:1014,inCloud:false}},
        simLocalTime:'16:00', recorder:JSON.parse(JSON.stringify(r)) }; },
    // one poll at frame k, advancing the clock by dt seconds first
    async poll(k, dt){ __tick((dt==null?30:dt)*1000); const p=this.frame(k); this.cur=p; S.mcp=S.mcp||{callTool:async(s,tool)=>tool==='sim_status'?{payload:this.cur}:{payload:{recorderId:'fake01'}}}; await simPoll(true); clearTimeout(S.simTimer); __tick(50); },
  };
})();`;

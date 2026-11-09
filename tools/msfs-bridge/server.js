#!/usr/bin/env node
/*
 * MSFS Bridge for Trade Winds
 * A small local MCP server that reads Microsoft Flight Simulator 2024 through SimConnect
 * and records each flight (block out, takeoff, touchdown rate, landing spot, fuel, block in).
 * The Trade Winds career page calls it through the Claude desktop app.
 *
 * Logs go to stderr only: stdout carries the MCP protocol.
 */
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const MOCK = process.env.MSFS_BRIDGE_MOCK === '1';
const log = (...a) => console.error('[msfs-bridge]', ...a);

/* ---------------- state ---------------- */
const sim = {
  connected: false, lastData: 0, error: null, appName: null,
  title: '', atcId: '',
  lat: null, lon: null, altFt: null, aglFt: null, ias: null, gs: null, vsFpm: null, hdg: null,
  onGround: null, engine: false, parkingBrake: false, fuelLb: null, fuelGal: null, gForce: null,
  touchdownFps: null, localTimeSec: null, ext: null, extAt: 0
};
let rec = newRecord();
function newRecord(){
  return { id: Math.random().toString(36).slice(2,9), armedAt: Date.now(), phase: 'waiting',
    blockOut: null, takeoff: null, touchdown: null, blockIn: null,
    fuelAtBlockOut: null, fuelNow: null, fuelUsed: null,
    maxAltFt: 0, distanceNm: 0, bounces: 0, airborneSec: 0, landings: [],
    origin: null, events: [], track: [], approach: null, lastTrackT: 0 };
}
const clock = { t: 0 }; // virtual seconds in mock mode
const now = () => MOCK ? clock.t * 1000 : Date.now();
function ev(msg){ rec.events.push({ t: now(), msg }); if(rec.events.length > 40) rec.events.shift(); log(msg); }
const toR = Math.PI/180;
function nm(aLat,aLon,bLat,bLon){ const R=3440.065, dLat=(bLat-aLat)*toR, dLon=(bLon-aLon)*toR; const h=Math.sin(dLat/2)**2+Math.cos(aLat*toR)*Math.cos(bLat*toR)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }

/* ---------------- recorder ---------------- */
let prev = null, airborneSince = null, groundSince = null, stoppedSince = null, lastLiftoff = null, pendingTd = null, tdAtTakeoff = null;
const vsWindow = []; const apBuf = []; let simAcc = 0, lastWall = null; // simulated seconds, scaled by the MSFS sim rate
function onSample(){
  const s = sim, t = now();
  if(s.lat == null) return;
  const rate = (s.ext && s.ext.simRate > 0) ? s.ext.simRate : 1; if(lastWall != null) simAcc += Math.min(10, (t - lastWall)/1000) * rate; lastWall = t;
  vsWindow.push({ t, vs: s.vsFpm, g: s.gForce }); while(vsWindow.length && t - vsWindow[0].t > 4000) vsWindow.shift();
  if(prev && prev.lat != null){ const d = nm(prev.lat, prev.lon, s.lat, s.lon); if(d < 5) rec.distanceNm += (rec.phase==='waiting' ? 0 : d); }
  rec.fuelNow = s.fuelLb;
  // flight path (every 8 s once moving) and the last two minutes of approach data (1 Hz)
  if(rec.phase !== 'waiting' && rec.phase !== 'in' && t - rec.lastTrackT >= 8000){ rec.lastTrackT = t; rec.track.push([Math.round(s.lat*1e4)/1e4, Math.round(s.lon*1e4)/1e4, Math.round(s.altFt)]); if(rec.track.length > 900) rec.track.splice(0, rec.track.length-900); }
  if(s.onGround === false && (!apBuf.length || t - apBuf[apBuf.length-1].t >= 1000)){ apBuf.push({ t, s: simAcc, agl: Math.round(s.aglFt), ias: Math.round(s.ias), vs: Math.round(s.vsFpm) }); while(apBuf.length > 150) apBuf.shift(); }
  if(s.altFt > rec.maxAltFt && rec.phase !== 'waiting') rec.maxAltFt = Math.round(s.altFt);

  // block out: engine running and moving
  if(rec.phase === 'waiting' && s.onGround && s.engine && s.gs > 3){
    rec.phase = 'taxi-out'; rec.blockOut = { t, s: simAcc, lat: s.lat, lon: s.lon }; rec.fuelAtBlockOut = s.fuelLb; rec.origin = { lat: s.lat, lon: s.lon };
    ev('Block out: taxiing');
  }
  // airborne transitions (debounced)
  if(s.onGround === false){
    groundSince = null;
    if(pendingTd){ const p=pendingTd; pendingTd=null; const td={ t:p.t, lat:p.lat, lon:p.lon, fpm:Math.round(Math.abs(p.worstVs)), g:Math.round(p.maxG*100)/100, ias:p.ias, hdg:p.hdg, source:'vertical speed before touchdown' }; if(!rec.touchdown){ rec.touchdown=td; } rec.landings.push(td); rec.phase='landed'; ev(`Touchdown at ${td.fpm} fpm`); }
    if(airborneSince == null) airborneSince = t;
    if((rec.phase === 'taxi-out' || rec.phase === 'waiting') && t - airborneSince > 2000 && s.ias > 25){
      if(!rec.blockOut){ rec.blockOut = { t: airborneSince, s: simAcc, lat: s.lat, lon: s.lon }; rec.fuelAtBlockOut = s.fuelLb; rec.origin = { lat: s.lat, lon: s.lon }; }
      rec.phase = 'airborne'; rec.takeoff = { t: airborneSince, lat: s.lat, lon: s.lon, ias: Math.round(s.ias) }; tdAtTakeoff = s.touchdownFps; ev('Takeoff'); }
    if(rec.phase === 'landed' && t - airborneSince > 1000 && !pendingTd && rec.touchdown && t - rec.touchdown.t < 20000){
      rec.phase = 'airborne'; rec.bounces += 1; lastLiftoff = t; ev('Bounced back into the air'); }
    if(rec.phase === 'landed' && t - airborneSince > 8000){ rec.phase = 'airborne'; ev('Airborne again (touch-and-go or go-around)'); }
    if(rec.phase === 'airborne') rec.airborneSec += prev ? Math.min(10,(t - prev.t)/1000) * rate : 0;
  } else if(s.onGround === true){
    airborneSince = null;
    if(groundSince == null) groundSince = t;
    if(rec.phase === 'airborne' && rec.airborneSec > 20 && !pendingTd){
      pendingTd = { t, lat: s.lat, lon: s.lon, worstVs: vsWindow.reduce((m,x)=> x.vs < m ? x.vs : m, 0), maxG: vsWindow.reduce((m,x)=> x.g > m ? x.g : m, 1), ias: Math.round(s.ias), hdg: Math.round(s.hdg) };
    }
    if(pendingTd && t - pendingTd.t >= 1000){
      // prefer the sim's own touchdown velocity if it updated during this flight, else the worst VS just before touchdown
      const p = pendingTd; pendingTd = null;
      const maxG = Math.max(p.maxG, vsWindow.reduce((m,x)=> x.g > m ? x.g : m, 1));
      const simTd = s.touchdownFps != null && Math.abs(s.touchdownFps) > 0.01 && s.touchdownFps !== tdAtTakeoff ? Math.abs(s.touchdownFps)*60 : null;
      const fpm = simTd != null ? simTd : Math.abs(p.worstVs);
      const td = { t: p.t, lat: p.lat, lon: p.lon, fpm: Math.round(fpm), g: Math.round(maxG*100)/100, ias: p.ias, hdg: p.hdg, source: simTd != null ? 'sim touchdown velocity' : 'vertical speed before touchdown' };
      if(!rec.approach) rec.approach = apBuf.slice(-120).map(x=>[Math.round(x.s - simAcc), x.agl, x.ias, x.vs]);
      if(rec.bounces && rec.touchdown && lastLiftoff && p.t - lastLiftoff < 20000){ rec.landings.push(td); ev(`Touched down again at ${td.fpm} fpm`); }
      else { rec.touchdown = td; rec.landings.push(td); ev(`Touchdown at ${td.fpm} fpm, ${td.g} G`); }
      rec.phase = 'landed';
    }
  }
  // block in: after landing, stopped with engine off or parking brake set for 5 s
  if((rec.phase === 'landed' || rec.phase === 'taxi-in') && s.onGround){
    if(s.gs > 3) rec.phase = 'taxi-in';
    if(s.gs < 1 && (!s.engine || s.parkingBrake)){ if(stoppedSince == null) stoppedSince = t; if(t - stoppedSince > 5000){ rec.phase = 'in'; rec.blockIn = { t, s: simAcc, lat: s.lat, lon: s.lon }; rec.fuelUsed = rec.fuelAtBlockOut != null ? Math.round(rec.fuelAtBlockOut - s.fuelLb) : null; ev('Block in: parked'); } }
    else stoppedSince = null;
  }
  if(rec.fuelAtBlockOut != null && s.fuelLb != null) rec.fuelUsed = Math.round(rec.fuelAtBlockOut - s.fuelLb);
  prev = { t, lat: s.lat, lon: s.lon };
}

/* ---------------- SimConnect ---------------- */
const SPEC_VARS = [
  ['ESTIMATED CRUISE SPEED','knots','cruise'],['DESIGN SPEED VS0','knots','vs0'],['DESIGN SPEED VC','knots','vc'],['NUMBER OF ENGINES','number','engines'],['ENGINE TYPE','enum','engineType'],
  ['FUEL TANK LEFT MAIN CAPACITY','gallons','capL'],['FUEL TANK RIGHT MAIN CAPACITY','gallons','capR'],['FUEL TANK CENTER CAPACITY','gallons','capC'],['PAYLOAD STATION COUNT','number','stations'],
  ['MAX GROSS WEIGHT','pounds','maxGross'],['EMPTY WEIGHT','pounds','empty'],['FUEL TOTAL CAPACITY','gallons','fuelCap'],['IS GEAR RETRACTABLE','bool','retract'],['IS GEAR FLOATS','bool','floats']
];
const EXT_VARS = [
  ['FLAPS HANDLE INDEX','number','flapIdx'],['TRAILING EDGE FLAPS LEFT PERCENT','percent','flapL'],['TRAILING EDGE FLAPS RIGHT PERCENT','percent','flapR'],
  ['FLAP SPEED EXCEEDED','bool','flapOver'],['FLAP DAMAGE BY SPEED','bool','flapDmg'],['GEAR SPEED EXCEEDED','bool','gearOver'],['GEAR DAMAGE BY SPEED','bool','gearDmg'],
  ['GEAR HANDLE POSITION','bool','gearDown'],['IS GEAR RETRACTABLE','bool','retract'],
  ['PLANE BANK DEGREES','degrees','bank'],['PLANE PITCH DEGREES','degrees','pitch'],
  ['STALL WARNING','bool','stall'],['OVERSPEED WARNING','bool','overspeed'],
  ['YOKE X POSITION','position','yokeX'],['YOKE Y POSITION','position','yokeY'],['RUDDER PEDAL POSITION','position','rudder'],['AILERON POSITION','position','aileron'],
  ['LIGHT LANDING','bool','landLight'],['LIGHT BEACON','bool','beacon'],['AUTOPILOT MASTER','bool','ap'],
  ['AMBIENT WIND DIRECTION','degrees','windDir'],['AMBIENT WIND VELOCITY','knots','windKt'],['AMBIENT VISIBILITY','meters','visM'],['AMBIENT TEMPERATURE','celsius','oat'],['SEA LEVEL PRESSURE','millibars','qnh'],['AMBIENT IN CLOUD','bool','inCloud'],['SIMULATION RATE','number','simRate']
];
async function connectLoop(){
  if(MOCK) return startMock();
  let simconnect;
  try { simconnect = require('node-simconnect'); } catch(e){ sim.error = 'node-simconnect is not installed. Run install.bat.'; log(sim.error); return; }
  const { open, Protocol, SimConnectDataType: T, SimConnectPeriod: P, SimConnectConstants: C } = simconnect;
  const DEF_MAIN = 1, DEF_STR = 2, DEF_EXT = 3, DEF_SPEC = 4, REQ_MAIN = 1, REQ_STR = 2, REQ_EXT = 3, REQ_SPEC = 4;
  for(;;){
    try {
      const { recvOpen, handle } = await open('Trade Winds MSFS Bridge', Protocol.KittyHawk);
      sim.connected = true; sim.error = null; sim.appName = recvOpen.applicationName; log('Connected to', recvOpen.applicationName);
      writer.handle = handle; writer.T = T; writer.C = C; writer.RawBuffer = simconnect.RawBuffer; writer.defs = {}; writer.next = 50;
      const add = (name, unit, type=T.FLOAT64) => handle.addToDataDefinition(DEF_MAIN, name, unit, type);
      add('PLANE LATITUDE','degrees'); add('PLANE LONGITUDE','degrees'); add('PLANE ALTITUDE','feet'); add('PLANE ALT ABOVE GROUND','feet');
      add('AIRSPEED INDICATED','knots'); add('GROUND VELOCITY','knots'); add('VERTICAL SPEED','feet per minute'); add('PLANE HEADING DEGREES TRUE','degrees');
      add('SIM ON GROUND','bool',T.INT32); add('GENERAL ENG COMBUSTION:1','bool',T.INT32); add('BRAKE PARKING POSITION','bool',T.INT32);
      add('FUEL TOTAL QUANTITY WEIGHT','pounds'); add('FUEL TOTAL QUANTITY','gallons'); add('G FORCE','GForce');
      add('PLANE TOUCHDOWN NORMAL VELOCITY','feet per second'); add('LOCAL TIME','seconds');
      handle.addToDataDefinition(DEF_STR, 'TITLE', null, T.STRING256);
      handle.addToDataDefinition(DEF_STR, 'ATC ID', null, T.STRING256);
      // extended set (v1.1): flaps, gear, attitude, warnings, controls, lights, weather. All read as numbers.
      for(const [n,u] of EXT_VARS) handle.addToDataDefinition(DEF_EXT, n, u, T.FLOAT64);
      for(const [n,u] of SPEC_VARS) handle.addToDataDefinition(DEF_SPEC, n, u, T.FLOAT64);
      handle.requestDataOnSimObject(REQ_SPEC, DEF_SPEC, C.OBJECT_ID_USER, P.SECOND, 0, 0, 10, 0);
      handle.requestDataOnSimObject(REQ_EXT, DEF_EXT, C.OBJECT_ID_USER, P.SIM_FRAME, 0, 0, 6, 0);
      handle.requestDataOnSimObject(REQ_MAIN, DEF_MAIN, C.OBJECT_ID_USER, P.SIM_FRAME, 0, 0, 5, 0);
      handle.requestDataOnSimObject(REQ_STR, DEF_STR, C.OBJECT_ID_USER, P.SECOND, 0, 0, 5, 0);
      await new Promise(resolve => {
        handle.on('simObjectData', r => {
          try {
            if(r.requestID === REQ_MAIN){ const d = r.data;
              sim.lat=d.readFloat64(); sim.lon=d.readFloat64(); sim.altFt=d.readFloat64(); sim.aglFt=d.readFloat64();
              sim.ias=d.readFloat64(); sim.gs=d.readFloat64(); sim.vsFpm=d.readFloat64(); sim.hdg=d.readFloat64();
              sim.onGround=d.readInt32()===1; sim.engine=d.readInt32()===1; sim.parkingBrake=d.readInt32()===1;
              sim.fuelLb=d.readFloat64(); sim.fuelGal=d.readFloat64(); sim.gForce=d.readFloat64(); sim.touchdownFps=d.readFloat64(); sim.localTimeSec=d.readFloat64();
              sim.lastData = Date.now(); onSample(); }
            else if(r.requestID === REQ_SPEC){ const d=r.data; const o={}; for(const [,,k] of SPEC_VARS) o[k]=d.readFloat64(); sim.spec=o; }
            else if(r.requestID === REQ_EXT){ const d=r.data; const o={}; for(const [n,,k] of EXT_VARS) o[k]=d.readFloat64(); sim.ext=o; sim.extAt=Date.now(); }
            else if(r.requestID === REQ_STR){ sim.title = r.data.readString256().trim(); sim.atcId = r.data.readString256().trim(); }
          } catch(e){ log('read error', e.message); }
        });
        handle.on('exception', e => log('SimConnect exception', e.exception));
        handle.on('quit', () => { log('Simulator quit'); resolve(); });
        handle.on('close', () => { log('Connection closed'); resolve(); });
        handle.on('error', e => { log('Connection error', e.message); resolve(); });
      });
    } catch(e){ sim.error = 'MSFS is not running, or SimConnect refused the connection.'; }
    sim.connected = false; sim.lastData = 0; writer.handle = null;
    await new Promise(r => setTimeout(r, 5000));
  }
}

/* ---------------- writing to the sim (only when the player presses "Load into MSFS") ---------------- */
const writer = { handle:null };
function setVar(name, unit, value){
  const w = writer; if(!w.handle) throw new Error('MSFS is not connected');
  if(!w.defs[name]){ w.defs[name] = w.next++; w.handle.addToDataDefinition(w.defs[name], name, unit, w.T.FLOAT64); }
  const buf = new w.RawBuffer(16); buf.writeFloat64(value);
  w.handle.setDataOnSimObject(w.defs[name], w.C.OBJECT_ID_USER, { buffer: buf, arrayCount: 0, tagged: false });
}
function loadAircraft(fuelGal, payloadLb){
  const sp = sim.spec || {}; const out = { ok:true, fuel:null, payload:null, notes:[] };
  if(MOCK){ sim.fuelGal = fuelGal; sim.fuelLb = fuelGal*6; out.fuel = fuelGal; out.payload = payloadLb; return out; }
  if(fuelGal != null && fuelGal >= 0){
    const L = sp.capL||0, R = sp.capR||0, Cc = sp.capC||0;
    if(L > 0 && R > 0){ const each = Math.min(fuelGal/2, L, R); setVar('FUEL TANK LEFT MAIN QUANTITY','gallons',each); setVar('FUEL TANK RIGHT MAIN QUANTITY','gallons',each); out.fuel = Math.round(each*2*10)/10; if(fuelGal/2 > Math.min(L,R)) out.notes.push('Requested fuel is more than the main tanks hold; filled them.'); }
    else if(Cc > 0){ const q=Math.min(fuelGal, Cc); setVar('FUEL TANK CENTER QUANTITY','gallons',q); out.fuel = q; }
    else out.notes.push("This aircraft doesn't expose standard fuel tanks; set fuel in the MSFS fuel menu.");
  }
  if(payloadLb != null && payloadLb >= 0){
    const n = Math.round(sp.stations||0);
    if(n >= 2){ const per = payloadLb/(n-1); for(let i=2;i<=n;i++) setVar(`PAYLOAD STATION WEIGHT:${i}`,'pounds',per); out.payload = Math.round(payloadLb); }
    else if(n === 1){ setVar('PAYLOAD STATION WEIGHT:1','pounds',payloadLb+170); out.payload = Math.round(payloadLb); }
    else out.notes.push("This aircraft doesn't expose payload stations; set weights in the MSFS payload menu.");
  }
  ev(`Loaded aircraft: ${out.fuel!=null?out.fuel+' gal fuel':'fuel unchanged'}, ${out.payload!=null?out.payload+' lb payload':'payload unchanged'}`);
  return out;
}

/* A scripted fake flight, for testing without the simulator. */
function startMock(){
  sim.connected = true; sim.appName = 'Mock MSFS'; sim.title = 'Cessna 172 Skyhawk G1000 (mock)'; sim.atcId = 'N172TW';
  let lat = 18.0410, lon = -63.1089, alt = 13, gs = 0, ias = 0, vs = 0, onGround = true, engine = false, fuel = 300, phaseT = 0;
  setInterval(() => {
    clock.t += 1; phaseT += 1; const k = clock.t;
    if(k < 4){ engine = false; gs = 0; }
    else if(k < 8){ engine = true; gs = 0; }
    else if(k < 20){ engine = true; gs = 12; }
    else if(k < 26){ gs = ias = 40 + (k-20)*5; }
    else if(k < 90){ onGround = false; ias = gs = 110; vs = k < 50 ? 700 : k < 70 ? 0 : -500; alt += vs/60; }
    else if(k === 90){ onGround = true; vs = -180; ias = 60; alt = 127; sim.touchdownFps = -3.0; }
    else if(k < 100){ gs = ias = Math.max(0, 50 - (k-90)*6); vs = 0; }
    else if(k < 110){ gs = 8; }
    else { gs = 0; engine = false; }
    if(gs > 0){ lat += gs/3600/60 * 0.9; lon += gs/3600/60 * 0.15; }
    fuel -= engine ? 0.15 : 0;
    sim.spec = { capL:28, capR:28, capC:0, stations:4, cruise:124, vs0:40, vc:124, engines:1, engineType:0, maxGross:2550, empty:1680, fuelCap:56, retract:0, floats:0 };
    sim.ext = { flapIdx: k>80&&k<100?2:0, flapL: k>80&&k<100?50:0, flapR: k>80&&k<100?50:0, flapOver: 0, flapDmg: 0, gearOver:0, gearDmg:0, gearDown:1, retract:0, bank: k>30&&k<40?20:0, pitch: k<50&&k>25?8:0, stall:0, overspeed:0, yokeX:0, yokeY:0, rudder:0, aileron:0, landLight:1, beacon:1, ap:0, simRate:1, windDir:90, windKt:14, visM:16000, oat:28, qnh:1014, inCloud:0 }; sim.extAt = Date.now();
    Object.assign(sim, { lat, lon, altFt: alt, aglFt: onGround ? 0 : alt, ias, gs, vsFpm: vs, hdg: 10, onGround, engine, parkingBrake: !engine, fuelLb: fuel, fuelGal: fuel/6, gForce: k===90 ? 1.25 : 1, localTimeSec: 36000 + k, lastData: Date.now() });
    onSample();
  }, Number(process.env.MSFS_BRIDGE_MOCK_TICK || 100));
}

/* ---------------- MCP ---------------- */
function snapshot(){
  const s = sim; const live = s.connected && Date.now() - s.lastData < 10000;
  const r = rec;
  const blockMin = r.blockOut ? (r.blockOut.s != null ? Math.round(((r.blockIn ? r.blockIn.s : simAcc) - r.blockOut.s) / 60) : Math.round(((r.blockIn ? r.blockIn.t : now()) - r.blockOut.t) / 60000)) : null;
  return {
    bridge: 'ok', version: '1.4.0', mock: MOCK,
    connected: s.connected, receivingData: live, simulator: s.appName, note: s.connected ? (live ? null : 'Connected, waiting for flight data. Load into a flight.') : (s.error || 'Waiting for MSFS to start.'),
    aircraft: { title: s.title, atcId: s.atcId },
    position: live ? { lat: s.lat, lon: s.lon, altFt: Math.round(s.altFt), aglFt: Math.round(s.aglFt), hdg: Math.round(s.hdg) } : null,
    motion: live ? { ias: Math.round(s.ias), gs: Math.round(s.gs), vsFpm: Math.round(s.vsFpm), onGround: s.onGround, gForce: Math.round(s.gForce*100)/100 } : null,
    systems: live ? { engineRunning: s.engine, parkingBrake: s.parkingBrake, fuelLb: Math.round(s.fuelLb), fuelGal: Math.round(s.fuelGal*10)/10 } : null,
    spec: s.spec ? (e => ({ tanks: { left: Math.round(e.capL||0), right: Math.round(e.capR||0), center: Math.round(e.capC||0) }, stations: Math.round(e.stations||0), cruiseKt: Math.round(e.cruise||e.vc||0), vs0Kt: Math.round(e.vs0||0), engines: Math.round(e.engines||0), engineType: ['piston','jet','none','helo','rocket','turboprop'][Math.round(e.engineType)]||'other', maxGrossLb: Math.round(e.maxGross||0), emptyLb: Math.round(e.empty||0), fuelGal: Math.round(e.fuelCap||0), retractable: !!e.retract, floats: !!e.floats }))(s.spec) : null,
    ext: live && s.ext && Date.now() - s.extAt < 10000 ? (e => ({
      flaps: { handle: Math.round(e.flapIdx), left: Math.round(e.flapL), right: Math.round(e.flapR), overspeed: !!e.flapOver, damaged: !!e.flapDmg },
      gear: { down: !!e.gearDown, retractable: !!e.retract, overspeed: !!e.gearOver, damaged: !!e.gearDmg },
      attitude: { bank: Math.round(e.bank), pitch: Math.round(e.pitch) },
      warnings: { stall: !!e.stall, overspeed: !!e.overspeed },
      controls: { yokeX: Math.round(e.yokeX*100)/100, yokeY: Math.round(e.yokeY*100)/100, rudder: Math.round(e.rudder*100)/100, aileron: Math.round(e.aileron*100)/100 },
      lights: { landing: !!e.landLight, beacon: !!e.beacon }, autopilot: !!e.ap, simRate: Math.round((e.simRate||1)*100)/100,
      weather: { windDir: Math.round(e.windDir), windKt: Math.round(e.windKt), visSm: Math.round(e.visM/1609*10)/10, oatC: Math.round(e.oat), qnhHpa: Math.round(e.qnh), inCloud: !!e.inCloud }
    }))(s.ext) : null,
    simLocalTime: live && s.localTimeSec != null ? `${String(Math.floor(s.localTimeSec/3600)%24).padStart(2,'0')}:${String(Math.floor(s.localTimeSec/60)%60).padStart(2,'0')}` : null,
    recorder: { id: r.id, phase: r.phase, armedAt: r.armedAt, blockOut: r.blockOut, takeoff: r.takeoff, touchdown: r.touchdown, blockIn: r.blockIn,
      blockMinutes: blockMin, airborneMinutes: Math.round(r.airborneSec/60), fuelAtBlockOutLb: r.fuelAtBlockOut != null ? Math.round(r.fuelAtBlockOut) : null,
      fuelUsedLb: r.fuelUsed, fuelNowLb: r.fuelNow != null ? Math.round(r.fuelNow) : null, maxAltFt: r.maxAltFt, distanceNm: Math.round(r.distanceNm*10)/10,
      bounces: r.bounces, landings: r.landings, events: r.events.slice(-12), track: r.track.length > 300 ? r.track.filter((_,i)=>i % Math.ceil(r.track.length/300) === 0 || i===r.track.length-1) : r.track, approach: r.approach }
  };
}
const server = new McpServer({ name: 'msfs-bridge', version: '1.4.0' });
server.registerTool('sim_status', {
  title: 'MSFS status and flight recorder',
  description: 'Live state of the user aircraft in Microsoft Flight Simulator (position, speeds, fuel, on-ground) plus the automatic flight recorder: block out, takeoff, touchdown rate in fpm, landing position, bounces, block in, fuel used. Read-only.',
  inputSchema: {},
  annotations: { readOnlyHint: true }
}, async () => ({ content: [{ type: 'text', text: JSON.stringify(snapshot()) }] }));
server.registerTool('flight_recorder_reset', {
  title: 'Start a new flight recording',
  description: 'Clears the flight recorder so the next block out starts a fresh record. Call when a new flight begins.',
  inputSchema: { label: z.string().max(120).optional() },
  annotations: { readOnlyHint: false, destructiveHint: false }
}, async ({ label }) => { apBuf.length = 0; rec = newRecord(); prev = null; airborneSince = null; groundSince = null; stoppedSince = null; lastLiftoff = null; pendingTd = null; tdAtTakeoff = null; ev(`Recorder armed${label ? ': ' + label : ''}`); return { content: [{ type: 'text', text: JSON.stringify({ ok: true, recorderId: rec.id }) }] }; });

server.registerTool('load_aircraft', {
  title: 'Load fuel and payload into the aircraft',
  description: 'Sets fuel (US gallons, split across the main tanks) and payload (pounds, spread across the passenger and cargo stations) on the user aircraft in MSFS. Only call when the player asks to load the plane.',
  inputSchema: { fuelGal: z.number().min(0).max(100000).optional(), payloadLb: z.number().min(0).max(200000).optional() },
  annotations: { readOnlyHint: false, destructiveHint: false }
}, async ({ fuelGal, payloadLb }) => { try{ return { content: [{ type:'text', text: JSON.stringify(loadAircraft(fuelGal, payloadLb)) }] }; }catch(e){ return { content: [{ type:'text', text: JSON.stringify({ ok:false, error: e.message }) }] }; } });

(async () => {
  await server.connect(new StdioServerTransport());
  log(MOCK ? 'Running in mock mode' : 'MCP server ready; looking for MSFS...');
  connectLoop();
})();

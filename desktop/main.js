const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path'); const fs = require('fs');
/* startup log: %APPDATA%\\Trade Winds\\main.log */
let LOGF=null; function L(...a){ try{ if(!LOGF) LOGF=path.join(app.getPath('userData'),'main.log'); fs.appendFileSync(LOGF, new Date().toISOString()+' '+a.map(x=>x&&x.stack?x.stack:String(x)).join(' ')+'\n'); }catch(e){} }
process.on('uncaughtException', e=>{ L('UNCAUGHT', e); });
process.on('unhandledRejection', e=>{ L('UNHANDLED', e); });
L('--- start', app.getVersion(), process.platform, process.versions.electron);
let sim=null; try{ sim = require('./sim-core.js'); L('sim core loaded'); }catch(e){ L('sim core failed', e); sim={ start(){}, snapshot(){ return {bridge:'ok',connected:false,receivingData:false,note:'Sim module failed to load',recorder:{}}; }, reset(){ return {ok:false}; } }; }
const gotLock = app.requestSingleInstanceLock();
if(!gotLock){ L('another instance is running; handing over'); app.quit(); }
app.on('second-instance', ()=>{ L('second-instance: focusing'); if(mainWin){ if(mainWin.isMinimized()) mainWin.restore(); mainWin.show(); mainWin.center(); mainWin.focus(); } else createWindow(); });
function createWindow(){
  L('creating window');
  const win = new BrowserWindow({ show: false, width: 1440, height: 920, minWidth: 380, minHeight: 600, title: 'Trade Winds', backgroundColor: '#08171c', icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true, titleBarStyle: 'hidden', titleBarOverlay: { color: '#08171c', symbolColor: '#e6f0ef', height: 38 },
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false } });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', ()=>{ L('ready-to-show'); win.show(); });
  setTimeout(()=>{ try{ if(!win.isDestroyed() && !win.isVisible()){ L('forcing show'); win.show(); } }catch(e){} }, 5000);
  try{ const { screen } = require('electron'); const b=win.getBounds(); const d=screen.getDisplayMatching(b); const wa=d.workArea; if(b.x<wa.x || b.y<wa.y || b.x+100>wa.x+wa.width) win.center(); }catch(e){ L('screen check', e); }
  win.webContents.on('render-process-gone', (_e, d)=>L('renderer gone', JSON.stringify(d)));
  win.webContents.on('did-fail-load', (_e, c, d)=>L('load failed', c, d));
  win.webContents.on('console-message', (_e, level, msg)=>{ if(level>=3) L('page error', msg); });
  mainWin = win;
  win.loadFile(gamePath());
  win.webContents.setWindowOpenHandler(({ url }) => { if(/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if(!url.startsWith('file://')){ e.preventDefault(); if(/^https:\/\//.test(url)) shell.openExternal(url); } });
}

/* game updates without reinstalling: %APPDATA%\Trade Winds\update.json -> {"feed":"https://.../"}; the feed has version.json {version, file} */
function verNum(v){ return String(v||'0').split('.').map(n=>parseInt(n,10)||0).reduce((a,n)=>a*1000+n,0); }
function bundledVersion(){ try{ return require('./package.json').version; }catch(e){ return '0'; } }
function gameCacheDir(){ return path.join(app.getPath('userData'),'game-cache'); }
function gamePath(){ try{ const m=JSON.parse(fs.readFileSync(path.join(gameCacheDir(),'version.json'),'utf8')); const f=path.join(gameCacheDir(),'index.html'); if(verNum(m.version) > verNum(bundledVersion()) && fs.existsSync(f)) return f; }catch(e){} return path.join(__dirname, 'game', 'index.html'); }
/* where players get game updates: %APPDATA%\Trade Winds\update.json if present (developer setups), else the public
   feed in package.json "tradeWinds.feed" (a URL whose folder holds version.json and index.html). */
function updateCfg(){ try{ return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'update.json'),'utf8')); }catch(e){}
  try{ const f=require('./package.json').tradeWinds; if(f && f.feed) return { feed:f.feed }; }catch(e){} return {}; }
async function checkGameUpdate(){ try{ const cfg=updateCfg(); const { net } = require('electron');
    // public feed {feed:"https://.../"} or a private GitHub repo {repo:"owner/name", token:"github_pat_...", branch:"main"}
    const get = async (file) => cfg.repo ? net.fetch(`https://api.github.com/repos/${cfg.repo}/contents/${file}?ref=${cfg.branch||'main'}&t=${Date.now()}`, { headers: { 'Accept':'application/vnd.github.raw', 'Authorization': cfg.token?('Bearer '+cfg.token):undefined, 'User-Agent':'TradeWinds' } }) : net.fetch(cfg.feed.replace(/\/?$/,'/')+file+'?t='+Date.now());
    if(!cfg.repo && !cfg.feed) return; const r=await get('version.json'); if(!r.ok){ L('update check '+r.status); return; } const v=await r.json();
    let cur='0'; try{ cur=JSON.parse(fs.readFileSync(path.join(gameCacheDir(),'version.json'),'utf8')).version; }catch(e){}
    if(verNum(v.version) <= Math.max(verNum(cur), verNum(bundledVersion()))) return;
    const g=await get(v.file||'index.html'); if(!g.ok) return; const html=await g.text(); if(html.length<100000 || !html.includes('TW_VERSION')) return;
    fs.mkdirSync(gameCacheDir(),{recursive:true}); fs.writeFileSync(path.join(gameCacheDir(),'index.html'), html); fs.writeFileSync(path.join(gameCacheDir(),'version.json'), JSON.stringify(v));
    if(mainWin) mainWin.webContents.send('game-updated', v.version); L('Game updated to '+v.version);
  }catch(e){} }
ipcMain.handle('restart-game', () => { if(mainWin) mainWin.loadFile(gamePath()); return true; });
ipcMain.handle('sim', (_e, tool, input) => {
  if(tool === 'sim_status') return sim.snapshot();
  if(tool === 'flight_recorder_reset') return sim.reset(input && input.label);
  if(tool === 'load_aircraft') return sim.load(input && input.fuelGal, input && input.payloadLb);
  if(tool === 'parking_spots') return sim.parking(input && input.icao);
  if(tool === 'move_to') return sim.move(input && input.lat, input && input.lon, input && input.hdg);
  if(tool === 'set_time') return sim.setTime(input && input.localMin);
  throw new Error('unknown tool');
});
ipcMain.handle('save', async (e, name, bytes) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('pictures'), String(name).replace(/[\\/:*?"<>|]/g,'_')) });
  if(r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, Buffer.from(bytes)); return true;
});
ipcMain.handle('open-save', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showOpenDialog(win, { title:'Import a Trade Winds career', defaultPath: app.getPath('downloads'), filters:[{name:'Trade Winds career', extensions:['json']}], properties:['openFile'] });
  if(r.canceled || !r.filePaths[0]) return null; return fs.readFileSync(r.filePaths[0], 'utf8');
});
ipcMain.handle('auto-save', () => { const dirs=[]; try{ dirs.push(app.getPath('downloads')); }catch(e){} dirs.push(path.join(require('os').homedir(),'Downloads'), path.join(require('os').homedir(),'Desktop')); for(const d of dirs){ try{ const f=path.join(d,'TradeWinds-save.json'); if(fs.existsSync(f)) return fs.readFileSync(f,'utf8'); }catch(e){} } return null; });
const syncCfgPath = () => path.join(app.getPath('userData'), 'save-folder.json');
const saveDir = () => { try{ const j=JSON.parse(fs.readFileSync(syncCfgPath(),'utf8')); if(j && j.dir && fs.existsSync(j.dir)) return j.dir; }catch(e){} return path.join(app.getPath('documents'), 'Trade Winds'); };
/* move the career to a folder of the player's choice (a OneDrive/Dropbox/iCloud folder follows them to another PC) */
ipcMain.handle('choose-sync-dir', async () => { const r = await dialog.showOpenDialog(mainWin, { title:'Choose where Trade Winds keeps your career', properties:['openDirectory','createDirectory'] }); if(r.canceled || !r.filePaths[0]) return null;
  const dir = path.join(r.filePaths[0], 'Trade Winds'); try{ fs.mkdirSync(dir, {recursive:true}); const old=path.join(saveDir(),'career.json'), now=path.join(dir,'career.json'); if(fs.existsSync(old) && !fs.existsSync(now)) fs.copyFileSync(old, now); fs.writeFileSync(syncCfgPath(), JSON.stringify({dir})); return dir; }catch(e){ return null; } });
ipcMain.handle('write-save', (_e, text) => { try{ const d=saveDir(); fs.mkdirSync(d,{recursive:true}); const f=path.join(d,'career.json'); if(fs.existsSync(f)){ try{ fs.copyFileSync(f, path.join(d,'career.backup.json')); }catch(e){} } fs.writeFileSync(f+'.tmp', text); fs.renameSync(f+'.tmp', f); return true; }catch(e){ return false; } });
ipcMain.handle('read-save', () => { try{ const f=path.join(saveDir(),'career.json'); return fs.existsSync(f) ? fs.readFileSync(f,'utf8') : null; }catch(e){ return null; } });
ipcMain.handle('save-dir', () => saveDir());
ipcMain.handle('flight-log', (_e, name, text) => { try{ const d=path.join(saveDir(),'flight-logs'); fs.mkdirSync(d,{recursive:true}); const safe=String(name).replace(/[^A-Za-z0-9_.-]/g,'_').slice(0,80); fs.writeFileSync(path.join(d,safe), text); const all=fs.readdirSync(d).filter(f=>f.endsWith('.json')).sort(); while(all.length>60){ try{ fs.unlinkSync(path.join(d,all.shift())); }catch(e){ break; } } return path.join(d,safe); }catch(e){ return null; } });
/* premium voices: OpenAI text-to-speech with the player's own key, cached on disk */
function ttsCfgPath(){ return path.join(app.getPath('userData'),'tts.json'); }
function ttsKey(){ try{ const j=JSON.parse(fs.readFileSync(ttsCfgPath(),'utf8')); const { safeStorage } = require('electron'); if(j.enc && safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(Buffer.from(j.enc,'base64')); return j.key||null; }catch(e){ return null; } }
ipcMain.handle('tts-key-set', (_e, key) => { try{ const { safeStorage } = require('electron'); if(!key){ try{ fs.unlinkSync(ttsCfgPath()); }catch(e){} return true; } const j = safeStorage.isEncryptionAvailable() ? {enc: safeStorage.encryptString(key).toString('base64')} : {key}; fs.writeFileSync(ttsCfgPath(), JSON.stringify(j)); return true; }catch(e){ return false; } });
ipcMain.handle('tts-key-has', () => !!ttsKey());
ipcMain.handle('tts', async (_e, text, voice, instructions) => {
  try{ const key=ttsKey(); if(!key) return {error:'no_key'}; const crypto=require('crypto'); const h=crypto.createHash('sha1').update(voice+'|'+(instructions||'')+'|'+text).digest('hex');
    const dir=path.join(app.getPath('userData'),'tts-cache'); fs.mkdirSync(dir,{recursive:true}); const f=path.join(dir,h+'.mp3');
    if(fs.existsSync(f)) return {audio: fs.readFileSync(f).toString('base64')};
    const { net } = require('electron');
    const r = await net.fetch('https://api.openai.com/v1/audio/speech', { method:'POST', headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'}, body: JSON.stringify({ model:'gpt-4o-mini-tts', voice, input:String(text).slice(0,600), instructions: instructions||undefined, response_format:'mp3' }) });
    if(!r.ok){ let msg=''; try{ msg=(await r.json()).error.message; }catch(e){} return {error: r.status===401?'bad_key':'http_'+r.status, message: msg}; }
    const buf=Buffer.from(await r.arrayBuffer()); fs.writeFileSync(f, buf);
    try{ const all=fs.readdirSync(dir); if(all.length>3000){ all.map(n=>({n,t:fs.statSync(path.join(dir,n)).mtimeMs})).sort((a,b)=>a.t-b.t).slice(0,500).forEach(x=>{ try{ fs.unlinkSync(path.join(dir,x.n)); }catch(e){} }); } }catch(e){}
    return {audio: buf.toString('base64')};
  }catch(e){ return {error:'network', message: String(e && e.message || e)}; } });
/* The toolbar panel ships prebuilt (msfs-panel/trade-winds-panel/InGamePanels/*.spb, built once with the MSFS SDK).
   When it's there, the app installs it into every MSFS Community folder it finds: no SDK needed for players. */
function communityFolders(){ const env=process.env, out=[]; const cands=[path.join(env.LOCALAPPDATA||'','Packages','Microsoft.Limitless_8wekyb3d8bbwe','LocalCache','UserCfg.opt'), path.join(env.APPDATA||'','Microsoft Flight Simulator 2024','UserCfg.opt'), path.join(env.LOCALAPPDATA||'','Packages','Microsoft.FlightSimulator_8wekyb3d8bbwe','LocalCache','UserCfg.opt'), path.join(env.APPDATA||'','Microsoft Flight Simulator','UserCfg.opt')];
  for(const c of cands){ try{ const m=fs.readFileSync(c,'utf8').match(/^InstalledPackagesPath\s+"?([^"\r\n]+)"?/m); if(m){ const com=path.join(m[1].trim(),'Community'); if(fs.existsSync(com) && !out.includes(com)) out.push(com); } }catch(e){} } return out; }
function panelPrebuilt(){ const src=path.join(process.resourcesPath||__dirname,'msfs-panel','trade-winds-panel'); try{ return fs.readdirSync(path.join(src,'InGamePanels')).some(f=>f.endsWith('.spb')) ? src : null; }catch(e){ return null; } }
function panelInstall(){ const src=panelPrebuilt(); if(!src) return {ok:false, why:'not-prebuilt'}; const dests=communityFolders(); if(!dests.length) return {ok:false, why:'no-community'};
  const files=[]; const walk=(d)=>{ for(const f of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,f.name); if(f.isDirectory()){ if(f.name!=='Build') walk(p); } else if(!['layout.json'].includes(f.name)) files.push(p); } }; walk(src);
  const layout={content:files.filter(f=>path.basename(f)!=='manifest.json').map(f=>{ const st=fs.statSync(f); return {path:path.relative(src,f).split(path.sep).join('/'), size:st.size, date:Math.round((st.mtimeMs+11644473600000)*10000)}; })};
  const done=[]; for(const com of dests){ try{ const dst=path.join(com,'trade-winds-panel'); fs.rmSync(dst,{recursive:true,force:true}); for(const f of files){ const t=path.join(dst,path.relative(src,f)); fs.mkdirSync(path.dirname(t),{recursive:true}); fs.copyFileSync(f,t); } fs.writeFileSync(path.join(dst,'layout.json'), JSON.stringify(layout,null,2)); done.push(dst); }catch(e){ L('panel install', e); } }
  return {ok:done.length>0, dests:done}; }
ipcMain.handle('panel-install', () => panelInstall());
ipcMain.handle('panel-status', () => ({prebuilt:!!panelPrebuilt(), installed:communityFolders().some(c=>fs.existsSync(path.join(c,'trade-winds-panel','layout.json'))), community:communityFolders().length}));
ipcMain.handle('panel-setup', () => { try{ const src=path.join(process.resourcesPath||__dirname,'msfs-panel'); const dst=path.join(saveDir(),'msfs-panel'); fs.cpSync(src, dst, {recursive:true, force:true}); require('electron').shell.openPath(dst); return dst; }catch(e){ return null; } });
ipcMain.handle('open-folder', (_e, sub) => { try{ const d=sub?path.join(saveDir(),String(sub).replace(/[^A-Za-z0-9_-]/g,'')):saveDir(); fs.mkdirSync(d,{recursive:true}); require('electron').shell.openPath(d); return true; }catch(e){ return false; } });
ipcMain.handle('storms', async () => { try{ const { net } = require('electron'); const r = await net.fetch('https://www.nhc.noaa.gov/CurrentStorms.json'); if(!r.ok) return []; const j = await r.json(); return (j.activeStorms||[]).map(s=>({ name:s.name, classification:s.classification, lat:Number(s.latitudeNumeric), lon:Number(s.longitudeNumeric) })); }catch(e){ return []; } });
/* phone companion on the local network */
let companionState = '{}'; let mainWin = null;
ipcMain.on('companion-state', (_e, json) => { companionState = json; });
function lanIp(){ const nets=require('os').networkInterfaces(); for(const k of Object.keys(nets)) for(const n of nets[k]||[]) if(n.family==='IPv4' && !n.internal && !/^169\.254/.test(n.address)) return n.address; return null; }
function startCompanion(){
  const http=require('http'); const page=fs.readFileSync(path.join(__dirname,'companion.html')); let panelPage=''; try{ panelPage=fs.readFileSync(path.join(__dirname,'panel.html')); }catch(e){}
  http.createServer((req,res)=>{
    if(req.url.split('?')[0]==='/panel'){ res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}); return res.end(panelPage); }
    if(req.url.split('?')[0]==='/state'){ res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'}); return res.end(companionState); }
    if(req.url==='/beat' && req.method==='POST'){ let b=''; req.on('data',c=>{ b+=c; if(b.length>1000) req.destroy(); }); req.on('end',()=>{ try{ const m=JSON.parse(b); if(typeof m.key==='string' && Number.isInteger(m.i) && m.i>=0 && m.i<6 && mainWin) mainWin.webContents.send('companion-beat', {key:m.key.slice(0,80), i:m.i}); }catch(e){} res.writeHead(204); res.end(); }); return; }
    if(req.url==='/ck' && req.method==='POST'){ let b=''; req.on('data',c=>{ b+=c; if(b.length>1000) req.destroy(); }); req.on('end',()=>{ try{ const k=JSON.parse(b).k; if(/^\d+-\d+$/.test(k) && mainWin) mainWin.webContents.send('companion-ck', k); }catch(e){} res.writeHead(204); res.end(); }); return; }
    res.writeHead(200,{'content-type':'text/html; charset=utf-8'}); res.end(page);
  }).on('error',()=>{}).listen(4747,'0.0.0.0');
}
ipcMain.handle('companion-info', async () => { const ip=lanIp(); if(!ip) return null; const url=`http://${ip}:4747`; let qr=null; try{ qr=await require('qrcode').toDataURL(url,{margin:1,width:220,color:{dark:'#08171c',light:'#ffffff'}}); }catch(e){} return {url, qr}; });
app.whenReady().then(() => { if(!gotLock) return; L('ready'); try{ sim.start(); }catch(e){ L('sim start', e); } try{ startCompanion(); }catch(e){ L('companion', e); } createWindow(); setTimeout(checkGameUpdate, 4000); setInterval(checkGameUpdate, 30*60000); app.on('activate', () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if(process.platform !== 'darwin') app.quit(); });

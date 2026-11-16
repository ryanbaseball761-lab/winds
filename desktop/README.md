# Trade Winds desktop app

The Windows app players install. It wraps the game (`../index.html`), reads MSFS itself through SimConnect
(`sim-core.js`, no separate bridge needed), keeps saves and flight logs in `Documents\Trade Winds`, and updates the
game from GitHub between installer releases.

| File | What it does |
|---|---|
| `main.js` | Window, game updates from `version.json`, saves, flight logs, premium voices, storms, the local server on port 4747 |
| `preload.js` | `window.twNative`: the bridge between the game page and `main.js` |
| `sim-core.js` | SimConnect: live data, the flight recorder, fuel, set time, parking spots, move to a gate |
| `companion.html` | Phone companion page (same Wi-Fi, `http://<pc>:4747`) |
| `panel.html` | The page shown inside MSFS by the toolbar panel (`http://localhost:4747/panel`) |
| `msfs-panel/` | The MSFS toolbar panel package (built once with the MSFS SDK, then shipped prebuilt) |

## Build the installer
```bash
cd desktop
npm install
npm run dist        # copies ../index.html into game/, then builds dist/TradeWinds-Setup-<version>.exe
```
GitHub Actions builds it too: push a tag like `desktop-v0.20.0` (see `.github/workflows/desktop.yml`).
The installer is unsigned until a code-signing certificate is added (Windows SmartScreen warns on unsigned apps).

This source was recovered from the 0.19.1 installer on 2026-11-16; the build settings in `package.json` were rebuilt
to match it (Electron 33.2.1, NSIS).

# Launch checklist

What has to be true before strangers can install and play Trade Winds. ✅ done, ⬜ open.

## Needs Ryan's PC (can't be done from the repo)
- ✅ **Electron app source in GitHub** (`desktop/`, recovered from the 0.19.1 installer) with an installer build on GitHub Actions (tag `desktop-v*`).
- ✅ **MSFS Bridge 1.5 in the repo** (`tools/msfs-bridge/`).
- ⬜ **Build the in-sim panel once with the MSFS SDK** (`desktop/msfs-panel/build-and-install.bat`) and commit the resulting
  `trade-winds-panel.spb` into `desktop/msfs-panel/trade-winds-panel/InGamePanels/`. After that the app installs the panel in one click, no SDK for players.
- ✅ **Public update feed**: `tradeWinds.feed` in `desktop/package.json` points at the public repo's raw folder, so new installs update with no token.
- ⬜ **Live test in MSFS 2024**: clock setting, touchdown grading, the course arrow, the auto-advancing checklist,
  auto-start and auto-finish, airliner company flights.
- ⬜ **Installer**: a signed Windows installer (unsigned builds trigger SmartScreen warnings), with the bridge inside it.
- ⬜ **Check MSFS 2020** at least once (the bridge reads both, but only 2024 has been flown).

## Game (done in the repo)
- ✅ 20-chapter story, endings, New Game+, epilogue
- ✅ Airline: airliners, facilities, bases, refits, best-route finder, balance table in `docs/BALANCE.md`
- ✅ Automatic tests: `tests/soak.js` (90-day stress run), `tests/simevents.js` (in-flight events), `tests/playthrough.js` (every ending), `tests/run.js` (flows), `tests/snapshot.js` (289 screens), `tests/simflight.js` (fake MSFS flight),
  `tests/fuzz.js` (clicks every button), `tools/sim.js` (economy)
- ✅ Phone layout checked at 400 px on every page
- ✅ Older bridges fail politely (clear message instead of "Unknown tool")
- ✅ Damaged saves repair themselves; unreadable saves are kept aside and the newest backup loads; storage-full is handled
- ✅ Security check: player-entered text can't inject code
- ✅ Accessibility: no serious axe-core issues on any page (`tests/a11y.js`)
- ✅ Spelling checked across the story and every screen (US English)
- ✅ CI: GitHub Actions runs every test on each push; `tools/ship.sh` refuses older versions
- ⬜ Bush side missions (on hold until their story is written)

## Store and marketing (drafts in this folder)
- ✅ `store-page.md`, `trailer-script.md`, `beta-tester-guide.md`, `patch-notes-1.0.md`
- ⬜ Screenshots and a trailer captured in MSFS
- ✅ Download: [beta page](https://ryanbaseball761-lab.github.io/winds/) (GitHub Pages, source in `site/`, deployed to the `gh-pages` branch) and GitHub Releases (Actions → Desktop installer → Run workflow with a version)
- ✅ Support channel: GitHub issues with bug and feedback forms; the game's Report a problem opens one prefilled
- ⬜ Discord server, then link it from the title screen and the beta page
- ⬜ flightsim.to listing (ask the moderators first: it's a companion app)
- ✅ Privacy line on the beta page and release notes: saves stay on the player's PC. The page itself only contacts GitHub (updates and
  character art) and Google Fonts; SimBrief and SkyVector open only when the player clicks those links. The desktop app
  also fetches real storms (US National Hurricane Center) and, only if the player adds a key, OpenAI (premium voices).
  Double-check the app side when its source is in the repo.

# Launch checklist

What has to be true before strangers can install and play Trade Winds. ✅ done, ⬜ open.

## Needs Ryan's PC (can't be done from the repo)
- ⬜ **Put the Electron app source in GitHub** (a `desktop/` folder or its own repo). Today it only exists on Ryan's PC,
  so nobody else can build, fix or sign the installer.
- ⬜ **Put MSFS Bridge 1.5 in the repo.** `tools/msfs-bridge/` is still 1.4.0: it lacks `set_time`, `parking_spots`
  and `move_to`. The 1.5.0 copy is at `C:\Users\ryang\Downloads\msfs-bridge\msfs-bridge\server.js`.
  (The game already copes with an older bridge: those three buttons say "update to 1.5".)
- ⬜ **Live test in MSFS 2024**: clock setting, touchdown grading, the course arrow, the auto-advancing checklist,
  auto-start and auto-finish, airliner company flights.
- ⬜ **Installer**: a signed Windows installer (unsigned builds trigger SmartScreen warnings), with the bridge inside it.
- ⬜ **Check MSFS 2020** at least once (the bridge reads both, but only 2024 has been flown).

## Game (done in the repo)
- ✅ 20-chapter story, endings, New Game+, epilogue
- ✅ Airline: airliners, facilities, bases, refits, best-route finder, balance table in `docs/BALANCE.md`
- ✅ Automatic tests: `tests/run.js` (flows), `tests/snapshot.js` (289 screens), `tests/simflight.js` (fake MSFS flight),
  `tests/fuzz.js` (clicks every button), `tools/sim.js` (economy)
- ✅ Phone layout checked at 400 px on every page
- ✅ Older bridges fail politely (clear message instead of "Unknown tool")
- ⬜ Bush side missions (on hold until their story is written)

## Store and marketing (drafts in this folder)
- ✅ `store-page.md`, `trailer-script.md`, `beta-tester-guide.md`, `patch-notes-1.0.md`
- ⬜ Screenshots and a trailer captured in MSFS
- ⬜ A place to download it (itch.io, flightsim.to or a site) and a support channel (Discord or email)
- ⬜ Privacy line for the store page: saves stay on the player's PC. The page itself only contacts GitHub (updates and
  character art) and Google Fonts; SimBrief and SkyVector open only when the player clicks those links. The desktop app
  also fetches real storms (US National Hurricane Center) and, only if the player adds a key, OpenAI (premium voices).
  Double-check the app side when its source is in the repo.

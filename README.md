# Trade Winds

A story career for Microsoft Flight Simulator (2024, and 2020 through the bridge). You fly every chapter of a
20-chapter Caribbean crime story in the sim; Trade Winds books the flights, briefs you, follows the flight live
through SimConnect and grades the landing. Between chapters there are side jobs, checkrides, an airline to run,
the Butter Cup landing contest and the Academy.

The desktop app downloads `index.html` from this repo (branch `main`) whenever `version.json` has a newer version.

## Quick start (developers)
```bash
npm ci                                  # Playwright + axe-core
npx playwright install chromium         # once, for the tests
npm run build                           # src/ -> index.html
npm test                                # build + regression suite
npm run test:all                        # everything CI runs (about 6 minutes)
```
Open `index.html` in Chrome to play the web build. No MSFS needed: Hangar → Settings has a "Skip flight" testing shortcut.

## Layout
| Path | What it is |
|---|---|
| `index.html`, `version.json` | The published game. Built: never edit by hand. |
| `src/head.html` | Page markup and the main stylesheet |
| `src/js/` | The game script, one file per feature, loaded in `src/order.txt` order |
| `src/js/page-*.js` | One file per screen: story, jobs, flight, result, hangar, money, map, pilot |
| `src/js/game-flow.js` | Scoring, applying a flight's result (`AFTER_RESULT` steps), rest days |
| `src/js/jobs.js` | Job generation, story/checkride jobs, save migration |
| `src/js/sim-live.js` | Everything that runs on each MSFS update (`SIM_TICK` steps) |
| `src/js/cutscenes.js` | Cutscene engine, prologues, aftermaths, "Previously" recaps |
| `src/js/0xx-core.js` | Older feature files (story data, airline, audio, academy…); see `docs/CODEMAP.md` |
| `src/app-pre.html`, `src/app-post.js` | Desktop-app glue around the game script |
| `tools/msfs-bridge/` | The SimConnect bridge for the web version (the desktop app has its own) |
| `art/` | Optional painted portraits and scenes, listed in `art/index.json` |
| `docs/` | Design notes, balance, story script, launch material |

## Making a change
1. Edit the file that owns the feature (a page's look is in its `page-*.js`; a rule is where it's defined).
   Avoid the old pattern of re-wrapping a function from a later file: `docs/CLEANUP_NOTES.md` explains why.
2. `npm run build`, then check it in Chrome.
3. `npm test`. For refactors, `npm run test:snapshots` must show **0 differences**; for intended changes, read the
   differences and make sure each one is what you meant.
4. Add a line to `WHATS_NEW` (in `src/js/101-fixes50.js`, newest first) and to `docs/launch/patch-notes-1.0.md`.
5. Ship: `tools/ship.sh 0.62.0 "what changed"`. It refuses a version that isn't newer, builds, runs the suite,
   saves the snapshot baseline, writes `version.json`, commits and pushes to `main`. Players get it within minutes.

## Tests
| Command | What it checks |
|---|---|
| `node tests/run.js` | Regression suite: setup, story, checkrides, money, airline, MSFS clock, damaged saves (~1 min) |
| `node tests/snapshot.js` | 289 screens and story states compared with `tests/snapshots/baseline.json` |
| `node tests/simflight.js` | A fake MSFS flight from engine start to shutdown, through the live code |
| `node tests/fuzz.js` | Clicks every button on every page in an early and a mid-game career (`W=400` for phone width) |
| `node tests/a11y.js` | axe-core accessibility scan; fails on serious issues |
| `node tools/sim.js` | Economy simulator: four play styles through the whole story (`docs/BALANCE.md`) |

GitHub Actions (`.github/workflows/test.yml`) runs all of these except the economy simulator on every push.

## Docs
- `docs/launch/launch-checklist.md`: what's left before release
- `docs/launch/`: store page, trailer script, beta-tester guide, patch notes
- `docs/BALANCE.md`: economy and airline numbers
- `docs/STORY.md` (`node tools/storydump.js`): the whole story as a script; `docs/STORY_AUDIT.md`: story review
- `docs/CODEMAP.md` (`node tools/codemap.js`): every file and function
- `docs/CLEANUP_NOTES.md`: code cleanup history and known leftovers
- `docs/FABLE_BRIEF.md`: the plan for the pre-release pass

## Saves
Careers live in the browser's local storage (`tradewinds.career.v1`), with rolling and labelled backups (`tw.backups`).
A save that can't be read is set aside, never overwritten, and the newest backup loads. Players can export and import
a career file from Hangar → Saves & help.

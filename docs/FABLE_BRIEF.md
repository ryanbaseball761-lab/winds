# Trade Winds: brief for the big pre-release pass

Read this whole file first. Then read `docs/CODEMAP.md` and `docs/STORY.md`.

## Who you're working for

Ryan builds Trade Winds, a story career for MSFS 2024 that runs in an Electron desktop app on his PC. The app downloads `index.html` from this repo (`ryanbaseball761-lab/winds`, branch `main`) whenever `version.json` has a newer version, within about 5 minutes of a push.

How he likes to work:
- **Short, direct replies.** Lists are fine. No long recaps.
- **Multiple-choice questions** when a decision is his (use AskUserQuestion). Ask, don't guess, on anything that changes how the game feels.
- **If he says he's mid-test, hold updates.** Don't push to `main` until he says so.
- Do work now. Don't create scheduled tasks.
- Never publish his real save. `tests/fixture-save.json` is a sanitized copy with the pilot named "Test Pilot".
- **Bush missions are out of scope.** Don't add or write them. He'll ask when he wants them.

**Fable usage:** Ryan has a free Fable reset (expires Nov 17) that refunds Fable usage to his weekly limit. When all phases are done, remind him to press **Reset for free**. Pressing it earlier forfeits the refund for any later work.

## Getting set up (the container can be wiped; GitHub is the only safe place)

```bash
cd /home/claude && git clone https://github.com/ryanbaseball761-lab/winds.git && cd winds   # if not already there
git checkout -b fable          # do all work on this branch
bash tools/build.sh            # builds index.html from src/
node tests/run.js              # 12 gameplay checks, must say ALL PASSED
node tests/snapshot.js         # behaviour snapshot: must say 0 differences before you start
```

- Push the `fable` branch often (`git push -u origin fable`) so a container reset can't lose work. Pushing a branch does not update Ryan's game. Only `main` does.
- **Ship** a finished phase with `bash tools/ship.sh 0.50.0 "message"`. It bumps the version, builds, runs `tests/run.js` and pushes HEAD to `main`. Use 0.50, 0.51 and so on, then 1.0.0 only when Ryan says it's the release.
- Commit messages must end with the attribution lines that `ship.sh` already adds.
- Chromium and Playwright are preinstalled. Don't reinstall them.

## The game in one minute

- `index.html` is built from `src/`:
  - `app-pre.html` is the desktop shell;
  - `head.html` is the markup plus all CSS (94 KB);
  - `src/js/*.js` are about 100 files in `src/order.txt` order, about 1.1 MB in total;
  - `app-post.js` is the boot code.
- Everything shares one global scope. Later files **wrap** earlier functions:
  ```js
  const _r = render; render = function(){ const h = _r(); /* patch h */ return h; }
  ```
  For example, `render` has 27 wrappers, `renderSimBits` 26, and `boardView` and `applyResult` 21 each. See the CODEMAP table. A function's real behaviour is its whole chain, and many wrappers patch HTML with regex `.replace()`.
- Global state is `S` (UI) and `S.st` (the career save). The save lives in `localStorage['tradewinds.career.v1']`, with backups in `tw.backups`. Other per-device keys start with `tw.`.
- **Story data.** Main story = `CRIME` (in 067-core.js) = 20 chapters in 5 acts (`CRIME_ACTS`):
  - Prologue cutscenes: `PRO` and `PRO_DYN`.
  - In-flight lines: `BEATS`.
  - Mid-flight decisions: `MID`.
  - Lines that change with earlier choices: `DYN`.
  - Gates for the three endings: `ENDING_REQ`.
  - Crime state: `crime(st)` = `{power, heat, dirty, choice, flags, crew, safe, ending, ng, ...}`.
- **Cutscenes.** The engine is `cutscene({shots, col, art, onEnd})` in 081-core.js. A shot is one of:
  - `[place, speakerKey|null, text]`;
  - `{card:true, kicker, title, sub}`;
  - `{choice:true, q, opts, pick}`.
- **Desktop contract (don't break):**
  - `window.twNative.*` (flightLog, pushState, saveFile/readSave/writeSave, autoSave, tts, ttsKeyHas/ttsKeySet, storms, openFolder, panelSetup, companionInfo, onCompanionCk, onGameUpdated, restartGame);
  - `window.TW_STANDALONE`;
  - the globals `S`, `render`, `save` and `load` used by `app-post.js`.
  - The MSFS bridge and the Electron app source live only on Ryan's PC. You can't change them, so keep the game side of the protocol identical.
- Art comes from GitHub raw `art/` (portraits and scenes). The noir style is dark, gold `#e0b24a`, red `#c23a2b`.
- Shipped versions so far are 0.1 through 0.43. The latest is 0.43.0.

## Tools made for you

| Tool | What it does |
|---|---|
| `node tools/codemap.js` | Rewrites `docs/CODEMAP.md`: files, every wrapper chain, duplicate declarations (there are 15), constants. |
| `node tools/storydump.js` | Rewrites `docs/STORY.md` from the built game: the whole main story as a readable script. Rebuild first. |
| `node tests/snapshot.js` | Renders all 11 pages plus 4 hangar tabs in 4 game states (early, mid-story, feds at Heat 86, endgame), plus jobs, a new day, and every chapter's result and decision in order. Random numbers and the clock are frozen. Compares 105 snapshots to `tests/snapshots/baseline.json`. `save` writes a new baseline. |
| `node tests/run.js` | Gameplay regression suite: story playthrough, cutscene decision, refunds, feds, economy, New Game+. |

## The work, in this order

Each phase ends with:
- `tests/run.js` reporting ALL PASSED;
- no script errors;
- a check at 1300px and 400px wide (screenshots via Playwright; look at them);
- a short report to Ryan.

Ask Ryan before shipping each phase. He may be mid-test.

### Phase 1: Code cleanup (pure refactor, behaviour identical)

**Goal:** turn the patch stack into clean, readable code so future fixes are fast and safe.

**Do:**
- Collapse each wrapper chain into one plain function that does what the whole chain did. Remove the regex patching of HTML by building the right HTML in the first place.
- Reorganise `src/js/` into a small number of files by area (for example data/aircraft and airports, state and saving, economy and jobs, story data, story logic, cutscenes, flight and sim link, pages, UI chrome, settings and audio). Update `order.txt` and the README.
- Move CSS that is injected from JS (many files append a `<style>`) into `head.html`, deduplicated, with no overridden-then-re-overridden rules.
- Delete dead code: features that were replaced, hidden tabs nobody can reach, superseded story systems (the old non-crime campaign data, if nothing uses it). Check the uses first.
- Keep: every global named in the desktop contract, the save format and every save migration, the localStorage keys, the data-act names unless you update every use, and the single-file `index.html` build.

**Proof:** `node tests/snapshot.js` reports **0 differences**. A difference means behaviour changed, so fix it rather than re-baselining. The only allowed exception is whitespace or attribute order that the normaliser doesn't hide; if so, explain it. Also: `tests/run.js` passes and you've done a quick click-through of every page and a cutscene.

**Work in steps.** One area at a time, run the snapshot after each, commit after each.

### Phase 2: Story audit, then a full story and dialogue pass

**Start with the logic audit** and write it to `docs/STORY_AUDIT.md`:
- Choices that set flags or crew nobody reads.
- `MID` echoes that never appear.
- `DYN` and `PRO_DYN` branches that can't trigger.
- Endings that can't be reached, or can be reached too easily (check `ENDING_REQ` against the Power and Heat you can actually earn).
- People who appear before they're introduced.
- Recaps that contradict the chapter.
- Aircraft or routes that don't match the act.
- Anything confusing about "what's going on right now".

Fix the logic problems, then rewrite.

**Ryan's direction for the story (all stated by him):**
- **Characters and arc:**
  - You start as a clean pilot (a fresh licence, flying a Cessna in St. Martin) who gets pulled in by a small favour. Then it gets darker.
  - You **never owe Castillo**. The goal is gaining power and control.
  - Early on, the character is uneasy and nervous; confidence grows by act (see `CRIME_ACTS[].nerve`).
  - Phone calls and nervousness are part of the feel.
- **Pacing:** move quickly from the Cessna to the Vision Jet, the CJ4 and the 747.
- **Tone:** dark, criminal, noir.
- **Presentation:** everything is a cutscene: prologues, decisions and aftermaths.
- **Clarity:** it must never be confusing which storyline is going on or what to do next.
- **Removed, keep out:**
  - no water landings anywhere in the story;
  - no passenger voices (safety warnings stay);
  - no sim-rate callouts.

**Writing goals:**
- One consistent voice.
- Distinct characters: Castillo, Reyes, Mari, Dez, Tico, Medina, Hartwell (and the DEA agent). Each has a recognisable way of talking, wants something, and changes over the story.
- Stakes rise every act. Choices feel consequential and get paid off later (use `DYN`, `PRO_DYN` and echoes).
- The three endings (kingpin, witness, ghost) each land with weight.
- Recaps match what happened.
- Cut filler.

**Constraints:**
- Keep chapter IDs, data shapes, routes and airports, aircraft lists, rating gates (JET from CR5, ATP from CR14) and the number of chapters and acts, unless Ryan agrees otherwise.
- Cutscene lines are typed out and may be spoken by text-to-speech, so keep each to about 170 characters. Use plain punctuation. Use words for numbers when they're spoken.
- Keep effects (Power, Heat, cash) balanced or hand them to Phase 3.

**Before rewriting all 20 chapters, show Ryan 1 or 2 rewritten chapters** (paste a `docs/STORY.md`-style excerpt) and ask, with multiple choice, whether the voice is right.

**After:**
- Rebuild.
- Run `node tools/storydump.js`.
- Read `docs/STORY.md` start to finish as a player would.
- Re-save the snapshot baseline once you're happy (story changes are expected diffs).

### Phase 3: Economy and balance

Build `tools/sim.js` to play the career headlessly in many ways (careful legit-only, greedy network runs, a mix, a bad pilot with C grades, a crash). Measure:
- days to each act;
- cash and dirty cash over time;
- Heat spikes;
- time spent stuck in the feds lockout (Heat 80+);
- whether upkeep or debt death-spirals happen;
- whether crew and safehouses pay for themselves;
- whether New Game+ is fun.

Then tune pay, upkeep, Heat gain and decay, laundering cut and Heat, the crew and safehouse costs, and the ending gates. Show Ryan the before and after numbers in a small table and ask before big feel changes (for example how long the story should take).

**Known facts:**
- Daily costs can't take cash below 0. The shortfall becomes +2 Heat (0.43).
- Feds lock out network runs and chapters at Heat 80+.
- Paying the fix cuts Heat.

### Phase 4: Deep bug hunt

Go past the surface polish (several 20–50-fix sweeps have already been done). Target:
- **Saves:** corruption, old-save migrations, a save from mid-flight (`st.active`) restored after the app restarts, New Game+ carry-over.
- **Timing and state:** cutscene timers and keyboard handlers left behind after a cutscene ends; double clicks on accept, cancel or choose buttons; cancelling and refunding at every stage; the sim disconnecting mid-flight.
- **Story edges:** grades A to F and crashes in every chapter; the result screen with and without a choice; Heat 79/80/81 boundaries; endings when you're short of a gate.
- **Layout:** 400px phone width on every page and in flight mode; long airport and aircraft names.

Add a regression test to `tests/run.js` for each real bug you fix.

### Phase 5: Launch materials (in `docs/launch/`)

- **Store page copy:** a short pitch, features, requirements (MSFS 2024, the desktop app and bridge) and FAQ.
- **Trailer script:** 60–90 seconds, shot list using in-game cutscenes.
- **Beta tester guide:** install, what to test, how to report bugs (the in-game error log is `tw.errors`), known issues.
- **1.0 patch notes.**
- **README:** refresh.

No bush missions anywhere.

## Done means

- Clean code: CODEMAP shows few or no wrapper chains.
- Tests and snapshot are green.
- The story reads well start to finish.
- The balance numbers have been agreed with Ryan.
- Bugs are fixed and each has a test.
- Launch docs are written.
- Everything is shipped only with Ryan's go-ahead.
- You've reminded Ryan to press **Reset for free**.

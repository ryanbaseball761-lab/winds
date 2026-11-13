# Cleanup notes

Running notes from the code cleanup (Phase 1). Two lists: bugs the cleanup fixed on the way, and
odd behaviour that was kept exactly as it was so the cleanup stays provably "no change". The second
list is the starting point for the bug hunt (Phase 4).

## Fixed during the cleanup (the only intended snapshot differences)
- Hangar, Your fleet: an aircraft costing "$1,800/day" was shown as ",800/day" and broke the layout of the
  fleet card (a `$1` in the text was swallowed by a text replacement). Now shown correctly.
- Jobs no longer carry an unused `_askAlt` field in the save.
- Flight page, before the flight: the setup panel's heading said "Step 1 · set up MSFS" and then changed to
  "Flight setup" a second later, when MSFS sent its first update. It now stays "Step 1 · set up MSFS".

## Kept as is for now (look at these in the bug hunt)
- score(): on Expert, the −10 for skipping the checklist is lost whenever MSFS measured the touchdown
  point or the flight carried no passengers, because the total is recomputed from the lines afterwards.
- afterFlight(): when one flight takes more than 12% health, the damage is capped at 12%, but the
  deductible is still charged on the uncapped damage, and a "grounded for repairs" note and journal
  entry can be written for an aircraft that the cap then un-grounds.
- rest(): aircraft are repaired twice a night (+6 or +18, then +6 again), and the second pass clears any
  grounding at 25%+, which makes the day-based grounding nearly meaningless.
- storyJob(): the "Ch n/total" label is looked up with the choice-adjusted copy of the chapter, so a
  chapter changed by earlier choices can read "Ch 0".
- Hangar, Your fleet: the tab bar is drawn below the "Loaded in MSFS" and fleet cards (on the other
  three tabs it is at the top).
- genJobs(): two random draws from the removed cabin-request feature are kept so job lists stay identical.
  Remove them (and ASKS, askMet, the cabin-request part of applyResult) with the next job-generation change.
- Cabin chatter: cabinTick() still builds passenger lines and then throws them away (only comfort is used).
- Flight page, before a checkride: the whole "Flight details" drawer (conditions, weights, route, aircraft)
  is missing, because the code that hides the duplicate task list removes the drawer it sits in.
- Result page: the "Write a journal entry with Claude" button was dropped by a later layout change; the
  handler and the AI-briefing button in the client briefing are leftovers of that feature.

## Round 2 (0.55)
Wrapped functions went from 71 to 9. Every page and helper that used to be patched by later files
(`x = function(){ … _old() … }`) is now one definition:
- New page files: `page-money.js`, `page-map.js`, `page-pilot.js`. Money, Map and the Licences tab are each one function;
  the extras (operation panel, dirty cash, live flight, story lines, "show on map" route, story ladder) are named helpers.
- Multi-layer functions (profile, weekly panel, cockpit, cabin panel, avatar, flight card, title screen, pre-flight checks,
  setup/tour) were folded into single definitions; single wrappers became `function x(){ … xBase() … }`.
- Placeholders like `var storyAvailable; /* defined below */` are gone; those functions are now normal declarations.
- Removed dead code: the retired passenger/ATC chatter (cabin line tables, `cabinPick`, `manifestLine`, IMC lines,
  the examiner lines), the retired end-of-day recap, the no-op `renderToast`, an Academy text replace that never matched,
  and the `_cabMute` toast switch. `cabinTick()` now only tracks passenger comfort.
- Only snapshot change: random review lines on two test flights, because the removed chatter no longer uses random numbers.
- Still wrapped (audio/voice hooks and two story data overrides, left alone on purpose): `SS.speak`, `SS.cancel`, `actx`,
  `pvVoiceFor`, `pvInstr`, `twSpeaker`, `playRecapNow`, `ALT_OUT.BO5`, `ALT_OUT.CO3`.
- Title screen bug fixed on the way: with a flight in progress, the Continue line ran the chapter name and the route together.

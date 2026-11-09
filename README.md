# Trade Winds

A story career for Microsoft Flight Simulator 2024. The desktop app downloads `index.html` from this repo when `version.json` has a newer version.

## Layout
- `index.html`, `version.json`: the published game (built, don't edit by hand)
- `src/head.html`: page markup and styles
- `src/js/`: the game script, one file per feature; `src/order.txt` sets the load order (later files build on earlier ones)
- `src/app-pre.html`, `src/app-post.js`: desktop-app glue around the game script
- `tests/run.js`: regression suite (Playwright), run before every release; `tests/fixture-save.json` is a sample career
- `tools/build.sh`: builds `index.html` from `src/`
- `tools/ship.sh VERSION "message"`: bump version, build, test, publish
- `tools/msfs-bridge/`: the MSFS connection (SimConnect) source
- `art/`: optional painted art. `art/index.json` lists what exists; files go in `art/portraits/<id>.jpg` and `art/scenes/<name>.jpg`. `art/PROMPTS.md` has the prompts.

## Adding a change
Add a new file to `src/js/` (e.g. `100-my-change.js`), append its name to `src/order.txt`, then `tools/ship.sh`.

# Trade Winds beta: tester guide

Thanks for testing. This guide takes about five minutes to read.

## Install
1. Download the installer from the [beta page](https://ryanbaseball761-lab.github.io/winds/) or the [latest release](https://github.com/ryanbaseball761-lab/winds/releases/latest) and run it. Windows may say "Windows protected your PC" because the beta isn't code-signed yet: click **More info → Run anyway**. The app updates itself after that.
2. Start MSFS 2024 and load into any airport. The app connects to MSFS through its bridge by itself; the **Hangar → MSFS connection** tab shows the status and runs a setup check.
3. In **Hangar → Your fleet**, untick any aircraft you don't own in MSFS. Own a payware or mod aircraft? Add it under **Hangar → Bring your own aircraft**: story chapters accept any aircraft that fills the role (a business jet for the jet chapters, an airliner for the airline ones).
4. The in-sim toolbar panel isn't in this beta yet. Play from the app window, or open the phone companion on your phone.

## What to test
- **The main story.** Play from chapter 1. Tell us when something is confusing: who someone is, why you're flying somewhere, what to do next.
- **Flying with MSFS connected.** The flight should start when your engine runs and finish by itself when you park at the destination. Tell us if it ever doesn't, or if a grade seems wrong.
- **Flight orders.** Some story moments ask you to *fly* something: climb away from a shadowing jet, stay under 1,000 ft, slow down, a steep turn for Castillo, a low pass. Tell us if one was judged wrong.
- **Tell us how each chapter felt.** A line per chapter in a [feedback issue](https://github.com/ryanbaseball761-lab/winds/issues/new?template=feedback.yml) is the most useful thing you can send us.
- **Streamers:** Hangar → Settings → Let Twitch chat vote. Chat types 1, 2 or 3 on story choices.
- **Choices.** Try different answers on a second career (Hangar → Saves & help → Start a new career; export your save first).
- **Checkrides.** Private Pilot first, then the Jet Type Rating (chapter 5 needs it) and Airline Transport Pilot (chapter 15).
- **Money and Heat.** Does it ever feel unfair, too easy or stuck?
- **Phone or small screens**, if you open the app on a small window.

## Reporting a bug
1. **Hangar → Saves & help → Report a problem.** Describe what happened and what you expected, then press **Open a GitHub issue**. The report is filled in (or copied for you to paste). It includes the version, recent errors and your sim status, but not your whole save. You need a free GitHub account to post.
2. If it happened in flight, also send the flight log: **Hangar → Settings → Open flight logs folder**.
3. A screenshot helps a lot.

## Useful shortcuts
- **Ctrl K** or **/**: search for anything (pages, airports, people, chapters).
- **Space**: next line in a cutscene. **←** back a line. **Esc** skip to the next decision.
- **?**: all shortcuts.
- **Testing shortcut**: Hangar → Settings → "Skip flight" adds a button on the Flight page that finishes the current flight with an A+, so you can move through the story quickly. Please also fly chapters for real.

## Known issues
- MSFS can't be changed by add-ons for weather, so briefings follow MSFS live weather instead of the other way round.
- The in-sim toolbar panel is coming in a later beta.
- Premium voices need your own OpenAI key; without one, Windows voices are used.
- The Seaplane Rating still exists for side jobs, but the main story never lands on water.

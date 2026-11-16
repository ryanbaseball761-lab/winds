# Beta plan

Goal: 30–50 testers for 3–4 weeks before launch, so launch day has fixes in, reviews written and clips on YouTube/Twitch.

## Who to recruit
| Group | Where | Why |
|---|---|---|
| Career-mode players (OnAir, NeoFly, A Pilot's Life users) | r/flightsim, r/MicrosoftFlightSim, flightsim.to comments, the NeoFly and OnAir Discords' off-topic channels (ask the mods first) | They know the genre and will compare honestly |
| Story-game fans who fly casually | r/MicrosoftFlightSim, MSFS forums | The main audience if the story lands |
| 3–5 small Twitch/YouTube flight-sim creators (500–5,000 followers) | DM with a beta key and the streamer-mode pitch | Clips at launch; they can use chat voting on stream |
| Real pilots (2–3) | Pilot friends, r/flying | Catch anything that would embarrass us in front of pilots |

Sign-up: a short form (MSFS 2020/2024, PC specs, aircraft owned, how long they usually fly, Twitch/YouTube link if any).

## Discord layout
`#announcements` (patch notes, read only) · `#start-here` (install, the tester guide) · `#bugs` (one thread per bug; paste the
report from Hangar → Saves & help) · `#story-feedback` (spoiler-tagged, by act) · `#flying-and-grading` · `#ideas` · `#clips`.
Put the invite link in `BETA.links.discord` (`src/js/beta.js`) so the in-game Feedback buttons point there.

## Schedule
| Week | Focus | Ship |
|---|---|---|
| 1 | Install, setup, Act 1. Fix anything that blocks starting. | Daily fixes as needed |
| 2 | Acts 2–3, flight orders, own-aircraft roles | Patch twice a week |
| 3 | Acts 4–5, endings, airline, streamer mode on 2–3 streams | Patch twice a week |
| 4 | Freeze: fixes only. Collect quotes for the store page. | Release candidate |

## What to measure (from the chapter ratings and reports)
- Where people stop: last chapter reached per tester.
- Chapters rated "Confusing" or "Didn't like it" by more than 20% of testers: rewrite those first.
- Flight orders judged wrong (from `#flying-and-grading` and the flight logs).
- Install problems: anyone who couldn't get MSFS connected within 10 minutes.

## Before launch
Set `BETA.on = false` in `src/js/beta.js`, ship 1.0, and post the patch notes (`patch-notes-1.0.md`).

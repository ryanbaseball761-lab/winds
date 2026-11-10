# Balance

Measured with `node tools/sim.js` (12 simulated careers: 4 play styles x 3 seeds, 3 side jobs a day, the story played as soon as it can be).

| Style | Days to finish | Peak Heat | Customs searches | Final cash | Ending |
|---|---|---|---|---|---|
| Legit (no network runs) | 20 | 12 | 0 | $1.55M | witness |
| Mixed (runs while Heat < 55) | 20 | 56 | 2 | $1.57M | kingpin |
| Greedy (every run) | 20 | 61 | 3 | $1.73M | kingpin |
| Sloppy (C/D landings, some crashes) | 20 | 57 | 3 | $1.08M | kingpin |

Before the 1.0 tuning, greedy players peaked at Heat 25, were never searched and ended with less money than legit players.

Changes: network runs pay 2.4x + Power% (was 1.6x) and add 12 Heat before the legit-job cooling (was 7).

Open: players finish with about $1.5M. Chapter 16 now makes Caribe Cargo your company so the money can go into aircraft, crews and routes. Nobody hits the feds lockout (Heat 80) in normal play; it stays a rare, self-inflicted state.

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

## Airline (0.55)
Best single route from TNCM for one hired aircraft at its best fare, vs. the daily cost of owning it
(80% loan over 10 years at 8.8%, plus insurance). Charter pool shown for comparison.

| Aircraft | Price | Best route profit/day | Loan + insurance/day | Net/day |
|---|---|---|---|---|
| Cessna 172 | $0.42M | $651 | $152 | ~$500 |
| Bonanza G36 | $0.95M | $2,158 | $344 | ~$1,800 |
| DC-3 | $1.2M | $3,797 | $435 | ~$3,350 |
| Twin Otter | $6.5M | $5,776 | $2,356 | ~$3,400 |
| King Air 350 | $8.5M | $1,725 (pool $2,123) | $3,081 | about −$1,000 |
| Citation CJ4 | $10.5M | pool $3,633 | $3,806 | about break-even |
| ES-30 | $9M | $15,333 | $3,262 | ~$12,000 |
| A320neo | $42M | $59,151 | $15,224 | ~$44,000 |

- Each route has a daily market (50–220 travelers, more to and from hubs) shared by every aircraft you put on it,
  and cheap fares can grow it by up to 60%. Passengers cost $14 + 18% of the fare each (handling, taxes, booking).
- Airliner crews cost $22,000/day, regional crews $4,500/day.
- Business jets don't make money on scheduled routes; use the charter pool (VIP charter desk +30%).

### Airline playthrough check (0.61)
A bot company starting with $1.5M, buying with 20% down and putting each plane on its best route, run for 120 days:
- Two DC-3s on the same best route (Antigua) earn about $1,700/day each after loan payments, wear and repairs:
  +$410k cash in 120 days on $480k down (one DC-3 alone: +$205k). The route has ~570 travelers a day, so two fit.
- Stacking four aircraft on that route (two DC-3s, two Caravans) loses money because they share its travelers, so growth
  needs new routes, bases or bigger hubs, not just more planes. The best-route finder and the new "Travelers" line show this.
- DC-3 maintenance raised (op cost 1,100 → 2,400/hr) so a $1.2M vintage plane no longer out-earns a $6.5M Twin Otter.

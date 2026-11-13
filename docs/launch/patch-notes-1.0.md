# Trade Winds 1.0: patch notes (draft)

## The story
- Every choice now comes back later. Giving the boy oxygen, copying Arnaud's drive, hiding the case on St. Croix, letting Tico sit up front, telling Castillo's lawyer everything, promising Hartwell a way out, and going to war (or waiting) after Cancún all change later scenes or the ending.
- **The Rat**: if you made a deal with Reyes, you now know who the real rat is when Castillo blames Tico.
- Reyes now checks in with her informant during Acts 3 and 4.
- The epilogue tells you what became of Castillo, Reyes, Medina and Hartwell, not just your crew.
- The Witness ending also opens if you kept Arnaud's drive or quietly wrote everything down.
- Prologues no longer repeat themselves, and two chapters no longer give away their twist before takeoff (Reyes now meets you on the St. Croix ramp).

## First ten minutes
- New noir start screen, and the name box is empty instead of pre-filled.
- From "Start the story" to flying in three steps: the Miami cold open, one setup screen (difficulty, MSFS, voices), then chapter 1's opening scene.
- Power, Heat and dirty cash are explained right after you say yes to Castillo, when they start to matter.
- After a flight the main button is always the next story step: the next chapter, the checkride it needs, or a seat to where it starts.
- Story checkrides can be booked straight from "Your path through the story" on the Pilot page.
- The "Skip flight (test)" button is now a setting (Hangar → Settings → Story), off for new careers.

## Clearer story
- "Previously" now tells you what you chose last chapter, not just where you flew.
- Scenes no longer give away what happens in flight: Castillo makes his offer after you land in Antigua, and Hartwell hands over the ledgers in the air.
- The Rat: Tico's plea now happens on the Grand Cayman ramp, with the car waiting.
- Chapters are numbered the same everywhere (Chapter 9 of 20).
- New players see chapter 1's opening scene even if they start it from the setup screen.
- Castillo pays for your jet rating right after The Offer, as he promised.

## Your airline and the economy
- **Caribe Cargo is now a real airline.** When you launch it in chapter 16, it becomes your company: buy aircraft (new or used, with loans), hire pilots and put them on routes that earn while you rest. Find it under **Pilot → Airline**.
- **Smuggling pays, and it's risky.** Network runs pay 2.4x a legit job (was 1.6x) and add more Heat. Players who take every run now reach customs-search Heat (60) and earn more than honest pilots; before, Heat never went past about 25 and crime paid no better than honest work.
- "Earned" on the Profile and Story pages is the same number now (all income, not loans or savings moves).
- Story pay, network bonuses and laundered cash count as income on the Money page instead of as costs.
- The Airline page shows "Demand: High/Shoulder/Low" instead of "Season ×0.95".
- When you hold dirty cash, your story page has a "Launder it" button.

- **Bigger airline, more to spend on.** Your company can now buy the ES-30, A320neo, 737 MAX 8 and A321LR (hired crews fly them until you hold the ATP). Build six facilities (maintenance hangar, marketing office, revenue manager, pilot training center, premium lounge, VIP charter desk), open bases at other hubs, and refit cabins. The Airline page shows your company's value.
- Each route now has a limited number of travellers a day, shared by your aircraft on it, so big jets need busy hub routes and smart fares.
- Four new airline achievements.

## Flying and grading
- Expert difficulty: skipping the checklist now always costs the 10 points it should.
- One flight never costs more than 12% airframe health (unless you crash); aircraft at 25% or more are never grounded; the damage deductible matches the damage.
- Overnight repairs are applied once (12% a day, 24% while grounded).
- Checkrides show the full flight details again (weather, weights, route), without repeating the task list.

## Interface
- Dollar amounts starting with $1 (like $1,800 upkeep) no longer lose their first digits on the Money page and the Pilot page.
- The Power and Heat bars after a chapter include what your choice changed, and are shown once.
- The flight page opens at the top after a chapter's opening scene.
- A fast double click on New day, Accept, a choice or a purchase only counts once.
- The Hangar tabs are at the top on every tab.
- The chapter label on the ticket no longer reads "Ch 0" for chapters changed by earlier choices.
- On a phone-width window, the cabin panel in flight mode no longer pushes the page sideways.

- Phone: job cards show the full title, with Accept below the price; Pilot tabs scroll to the one you're on.
- Academy and Butter Cup headers match the rest of the game, and so does the launch splash.
- The Butter Cup asks you to connect MSFS before starting an attempt it can't score.

## Under the hood
- Code cleanup, round 2: 71 patched-over functions down to 9, each screen drawn by one function. Dead code from retired features (passenger chatter, the end-of-day recap) is gone.
- Title screen: "Resume flight" shows the route and job cleanly instead of running it into the chapter name.
- New automatic checks: the MSFS clock lands on the planned time whatever offset the sim applies, the airline (airliners, facilities, bases, refits, shared routes), and "Earned" matching between pages.
- The game's code was reorganised into clear files by area (jobs, flight results, live sim, each page, cutscenes). Behaviour was checked screen by screen against the previous version, and with a full simulated MSFS flight.

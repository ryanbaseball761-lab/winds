MSFS BRIDGE FOR TRADE WINDS
===========================

What it does
------------
A small program that runs on your PC and connects the Trade Winds career page to
Microsoft Flight Simulator 2024 through SimConnect. While you fly, it records:

  - block out (when you start taxiing) and block in (parked, engine off or parking brake set)
  - takeoff
  - touchdown rate in feet per minute, G force, bounces, and where you touched down
  - fuel at departure, fuel used, fuel remaining
  - your live position, speed, altitude and the aircraft you loaded

The Trade Winds debrief fills itself in from that recording.

USING THE TRADE WINDS APP? You don't need anything in this file. The app connects to MSFS by
itself: start MSFS, load into a flight, and Hangar > MSFS connection turns live. These steps are
only for playing the web version inside the Claude desktop app.

What it can do
--------------
  sim_status             position, speed, fuel, weather, sim clock and the flight recording (read only)
  flight_recorder_reset  starts a fresh recording for a new flight
  load_aircraft          sets the fuel for the flight you're about to fly
  set_time               sets the MSFS clock to the flight's departure time          (1.5 and later)
  parking_spots          lists the gates and ramps at an airport                       (1.5 and later)
  move_to                moves your aircraft to a parking spot                         (1.5 and later)

Apart from fuel, time and position (each only when you press the button for it), it only reads.
If your bridge is older than 1.5, the game says so when you press one of the newer buttons;
everything else still works.

What you need
-------------
  - Windows PC with MSFS 2020 or 2024
  - Node.js LTS (https://nodejs.org)
  - The Claude desktop app, on the same PC

Setup (about 5 minutes)
-----------------------
1. Move this "msfs-bridge" folder somewhere permanent, for example:
       C:\Users\ryang\msfs-bridge

2. Double-click install.bat. It downloads the two libraries the bridge needs.

3. Open the Claude desktop app > Settings > Developer > Edit Config.
   That opens claude_desktop_config.json. Add the msfs-bridge entry under "mcpServers".

   If the file is empty or has no "mcpServers" yet, make it look like this:

   {
     "mcpServers": {
       "msfs-bridge": {
         "command": "node",
         "args": ["C:\\Users\\ryang\\msfs-bridge\\server.js"]
       }
     }
   }

   If it already has "mcpServers" with other entries, add only the "msfs-bridge": { ... } block
   inside it, with a comma between entries. Use double backslashes in the path, and change the
   path if you put the folder somewhere else.

4. Fully quit the Claude app (right-click the tray icon > Quit) and open it again.
   Settings > Developer should now list msfs-bridge as running.

5. Open the Trade Winds page in the Claude desktop app. Start MSFS and load into a flight.
   The sidebar shows "MSFS live" within a few seconds. The first time, Claude asks
   whether the page may use msfs-bridge: allow it.

Using it
--------
  - Accept a job and spawn at the departure airport. The flight starts by itself when your
    engine is running (or press "Start flight").
  - Fly. Taxi in and park at the destination: engine off or parking brake on.
  - The flight finishes by itself and the debrief opens with the touchdown rate, fuel,
    block time and airport filled in.

Troubleshooting
---------------
  - "Bridge not connected": the Claude app isn't running the bridge. Check step 3 and 4, and
    that the page is open in the desktop app (not a web browser or your phone).
  - "Bridge running, MSFS not detected": start MSFS. The bridge retries every 5 seconds.
  - "MSFS connected, no flight loaded": load into a flight from the world map.
  - Touchdown rate looks wrong: the bridge uses the sim's own touchdown velocity, and falls back
    to the vertical speed just before touchdown. You can always edit the debrief before submitting.

Testing without the sim
-----------------------
In a terminal in this folder:  npm run mock
That runs a fake two-minute flight instead of connecting to MSFS (useful only for testing).

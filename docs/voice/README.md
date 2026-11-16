# Recorded voices

Trade Winds plays recorded audio for any story line that has one, and uses computer speech for the rest, so
recordings can be added a few at a time.

## The script
`docs/voice/script.csv` lists every line a character speaks in the main story (prologues, in-flight moments,
flight-order outcomes), with the **id** its file must use. Regenerate it after story edits: `node tools/voicescript.js`.
An edited line gets a new id, so its old recording simply stops playing (speech takes over) until it's re-recorded.

## Files
- One file per line: `art/voice/<id>.mp3` (mono, 44.1 kHz, 128 kbps or better, about −16 LUFS, no music or effects;
  radio lines can have a light radio filter).
- List the recorded ids in `art/voice/index.json`: `{"lines":["vad2f3783","v8ad7e82c"]}`.
- Ship them with `tools/ship.sh` like any change: the game loads them from GitHub.

## Casting notes
| Character | Voice |
|---|---|
| Mateo Castillo | Fifties, Latin American, low and slow, never raises his voice; menace through politeness |
| Captain Marisol "Mari" Vega | Thirties, Caribbean, warm, quick, worried under the jokes |
| Desmond "Dez" Richardson | Forties, Caribbean, easy laugh, big-brother warmth, calls you "rookie" |
| Tico Alvarez | Early twenties, eager, a bit breathless, calls you "boss" |
| Agent Elena Reyes | Forties, American, dry, tired, precise |
| Rafael Medina | Venezuelan, charming, theatrical, dangerous |
| Lionel Hartwell | Sixties, English upper class, weary, regretful |
| You (thinking) | The player's inner voice: close-mic, quiet, present tense. Consider leaving these to text only. |
| Radio / ATC | Controllers and patrols: clipped radio phraseology, light radio filter |

Budget idea: the 9 roles above cover the main story's ~100 spoken lines; a professional voice actor typically records
that in one short session per role.

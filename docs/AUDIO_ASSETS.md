# Greedy Pig audio assets and implementation notes

This patch contains the three supplied background music tracks, all ten supplied TTSMP3 voice recordings, an audio player/settings implementation, a voice-clip catalogue, and a review page.

## Folder layout

```text
public/audio/
├── music/
│   ├── everyday-is-a-holiday-queens-of-ocean-11.mp3
│   ├── up-in-the-air.mp3
│   └── background-music-lnplusmusic.mp3
└── announcer/
    ├── normal-roll-one/
    │   ├── 01-damn-tough-luck-your-turn-is-over.mp3
    │   └── 02-well-that-didnt-go-as-planned-next-player.mp3
    └── double-down/
        ├── success/
        │   ├── 01-you-beat-the-odds-what-a-roll.mp3
        │   ├── 02-absolutely-brilliant-gamble-paid-off.mp3
        │   ├── 03-the-risk-was-worth-it-what-a-play.mp3
        │   └── 04-big-risk-bigger-reward-brilliant.mp3
        └── failure/
            ├── 01-unlucky-that-gamble-didnt-pay-off.mp3
            ├── 02-ahh-unfortunate-you-lost-ten-points.mp3
            ├── 03-not-quite-the-outcome-you-wanted-huh.mp3
            └── 04-the-gamble-backfired-better-luck-next-time.mp3
```

## Announcer clip mapping

The descriptions below are based on the clip-to-phrase mapping supplied by the project owner. Original timestamp-based TTSMP3 filenames are retained in this table for traceability.

| Original clip | Category | Spoken line | New file |
|---:|---|---|---|
| 1 | Normal roll — dice result 1 | Damn, tough luck! Your turn is over. | `normal-roll-one/01-damn-tough-luck-your-turn-is-over.mp3` |
| 10 | Normal roll — dice result 1 | Well, that didn't go as planned. Next player! | `normal-roll-one/02-well-that-didnt-go-as-planned-next-player.mp3` |
| 2 | Double Down success | You beat the odds! What a roll! | `double-down/success/01-you-beat-the-odds-what-a-roll.mp3` |
| 7 | Double Down success | Absolutely brilliant! That gamble paid off! | `double-down/success/02-absolutely-brilliant-gamble-paid-off.mp3` |
| 8 | Double Down success | The risk was worth it! What a play! | `double-down/success/03-the-risk-was-worth-it-what-a-play.mp3` |
| 9 | Double Down success | Big risk, bigger reward! Brilliant! | `double-down/success/04-big-risk-bigger-reward-brilliant.mp3` |
| 3 | Double Down failure | Unlucky! That gamble didn't pay off. | `double-down/failure/01-unlucky-that-gamble-didnt-pay-off.mp3` |
| 4 | Double Down failure | Ahh, unfortunate! You've lost 10 points. | `double-down/failure/02-ahh-unfortunate-you-lost-ten-points.mp3` |
| 5 | Double Down failure | Not quite the outcome you wanted, huh? | `double-down/failure/03-not-quite-the-outcome-you-wanted-huh.mp3` |
| 6 | Double Down failure | The gamble backfired! Better luck next time. | `double-down/failure/04-the-gamble-backfired-better-luck-next-time.mp3` |

There are currently two normal-roll announcements and four announcements in each Double Down category. The previously discussed alternatives “Ohhh, not your day, is it?” and “Ouch! All that work for nothing.” were not among the ten recordings supplied in the audio ZIP, so they are not included here.

## Announcer catalogue

`src/audio/announcerConfig.js` exports `ANNOUNCER_CLIPS` and `getRandomAnnouncerClip(category, previousClipId)`. Available categories:

- `normalRollOne`
- `doubleDownSuccess`
- `doubleDownFailure`

The helper randomly selects a clip and avoids the immediately previous clip when there is more than one choice. `src/hooks/useGameActions.js` calls the helper and plays the selected clip after the server returns the matching game outcome.

## Agreed game-event mapping

- **Normal roll:** when a player rolls a 1, play one clip from `normalRollOne`. This is the normal Pig rule: the player's unbanked points for that turn are lost and the turn ends; previously banked points remain unchanged.
- **Double Down success:** under the proposed updated rule, an even result (2, 4, or 6) is successful. Play one clip from `doubleDownSuccess` and optionally a separate short victory fanfare.
- **Double Down failure:** under the proposed updated rule, an odd result (1, 3, or 5) fails and applies the agreed 10-point penalty. Play one clip from `doubleDownFailure`.
- **One-use restriction:** each player may activate Double Down once per match. The backend must enforce this when the feature is implemented.

The current main branch already implements these Double Down rules in the backend (`backend/src/doubleDown.js` and `backend/src/routes/matches.js`). The audio fix does not alter the scoring rules or backend implementation; it only connects the corresponding voice announcements to the server-returned outcomes.

No separate short success-fanfare file was included in the supplied audio ZIP. The three supplied tracks are background music only. Add a properly licensed fanfare asset separately if the group decides to use one.

## Implemented in this patch

- A global background music player is mounted in `src/routes/root.jsx` so it can continue across route navigation.
- The three tracks are stored in `public/audio/music/` and are available as a playlist or individually selected tracks.
- The Audio Settings interface provides separate on/off switches and volume controls for background music and sound effects.
- Audio preferences are persisted in browser `localStorage`.
- Existing game sound effects use the global sound-effects enabled/volume settings.
- Music starts after the first user interaction because browsers generally block autoplay before a user gesture.
- `audio-review.html` previews all ten announcer lines and all three background tracks.

## Integration and testing status

- `normalRollOne` is connected to the server-reported `bust` outcome (normal roll of 1).
- `doubleDownSuccess` is connected to `double_down_success`, and also to a successful Double Down that finishes the match (`won` with `doubleDown.success === true`).
- `doubleDownFailure` is connected to `double_down_failed`.
- No separate success fanfare was supplied. The success announcements are spoken voice clips; the group can add a separate licensed fanfare later if desired.
- Physical-device testing is still required for audio controls, playlist transitions, route navigation, browser refresh, desktop playback and mobile playback, especially iPhone Safari.
- Run `npm ci`, `npm run build` and `npm run lint` in the team's current repository before merging.

## Music source and licence notes

| Track | Creator | Source / note |
|---|---|---|
| Everyday Is A Holiday | Brotheration Records / Queens of Ocean 11 | [Pixabay asset](https://pixabay.com/music/reggae-everyday-is-a-holiday-queens-of-ocean-11-brotheration-records-325618/) — listed under the Pixabay Content License. **Review note:** the producer's Bandcamp page describes this recording as a version of a classic reggae hit and marks that Bandcamp release “all rights reserved”; confirm the underlying composition/cover permissions before public release. [Bandcamp context](https://brotherationrecordspresents.bandcamp.com/track/everyday-is-a-holiday). |
| Up In The Air | DonnySombrero | [Pixabay asset](https://pixabay.com/music/samba-latin-up-in-the-air-499093/) — listed under the Pixabay Content License and marked “Content ID Registered”. Keep the download/source evidence in case a gameplay video receives an automated claim. |
| Background Music | lNPLUSMUSIC | [Pixabay asset](https://pixabay.com/music/funk-background-music-628850/) — listed under the Pixabay Content License and marked “Content ID Registered”. Keep the download/source evidence in case a gameplay video receives an automated claim. |

Pixabay's [terms](https://pixabay.com/service/terms/) and [licence summary](https://pixabay.com/service/license-summary/) describe the applicable content licence. It does not permit redistributing the audio as a standalone file, and third-party rights may still apply.

## TTSMP3 recordings

The ten spoken MP3s were generated by the project owner with ttsMP3 AI. The source licence/terms should be retained with the project; see [ttsMP3 terms](https://ttsmp3.com/tos). These files are placed in the game as spoken sound effects, not streamed from the TTS service.

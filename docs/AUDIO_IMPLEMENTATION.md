# Audio integration handoff

## What this patch adds

1. Three background music tracks under `public/audio/music/`.
2. Ten named TTS announcer recordings under `public/audio/announcer/`.
3. A global background music player mounted from `src/routes/root.jsx`.
4. Audio Settings with independent music and sound-effects enable/disable and volume controls.
5. Browser persistence for audio preferences using `localStorage`.
6. `src/audio/announcerConfig.js`, which documents all announcer categories and provides a random clip selector that avoids repeating the previous clip where possible.
7. `audio-review.html`, a browser-based preview page for the voice lines and background tracks.

## Main changed/added code files

- `src/audio/audioConfig.js` — music track metadata and audio settings defaults/storage.
- `src/audio/announcerConfig.js` — announcer phrase catalog and random selection helper.
- `src/components/BackgroundMusicPlayer.jsx` — global looping/playlist music player.
- `src/components/SoundSwitch.jsx` — separate music/effects controls and volume sliders.
- `src/hooks/useAudio.js` — game sound effects respect effect enable/volume preferences.
- `src/routes/root.jsx` — stores settings in context and mounts the music player globally.
- `src/components/Navbar.jsx` and `src/routes/Home.jsx` — expose the Audio Settings button.
- `src/routes/play_friends_live/game/components/DiceSection.jsx` and `DiceSectionMobile.jsx` — updated sound-effect hook integration.
- Relevant setup components — updated to use the global sound-effect settings.

## Important limits

- This patch does not implement Double Down game logic.
- This patch does not yet trigger the ten announcer clips from game events. The paths, exact spoken lines and categories are supplied in `src/audio/announcerConfig.js` for the gameplay developer to wire in.
- The original normal-roll lose sound remains in the game until the normal-roll announcer is connected and the group decides whether to replace or layer the existing effect.
- No separate success fanfare file was supplied; only the three background music files and ten voice recordings are included.
- This patch does not add a backend, database table, API endpoint or Match History feature.

## Applying to the team's branch

Copy/merge the included `src/`, `public/`, and `docs/` folders into the current cloned project, and place `audio-review.html` at the project root. Do not replace `.git`, `.env`, `node_modules`, `dist`, `package.json` or `package-lock.json`. Review conflicts carefully if team members have edited the same source files. Then run:

```bash
npm ci
npm run dev
npm run build
```

Review `git status` before committing. This patch contains frontend audio changes and static audio assets only; no backend/schema changes are included.

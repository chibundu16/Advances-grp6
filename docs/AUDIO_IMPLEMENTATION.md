# Greedy Pig audio implementation and handoff

## What is included

1. Three background music tracks under `public/audio/music/`.
2. Ten named TTS announcer recordings under `public/audio/announcer/`.
3. A global background music player mounted from `src/routes/root.jsx`.
4. Audio Settings with independent music and sound-effects enable/disable switches and volume sliders.
5. Browser persistence for audio preferences using `localStorage`.
6. `src/audio/announcerConfig.js`, which documents all announcer phrases and randomly selects a clip without repeating the previous clip in the same category when possible.
7. `audio-review.html`, a browser-based preview page for the voice lines and background tracks.
8. A shared Web Audio audio manager in `src/audio/audioEngine.js` for independent music and sound-effects volume channels, with native media fallback.

## Main audio code files

- `src/audio/audioConfig.js` — music track metadata and saved audio settings.
- `src/audio/announcerConfig.js` — announcer phrase catalogue and random selection.
- `src/audio/audioEngine.js` — shared Web Audio gain channels, media-element routing, autoplay unlock and native fallback.
- `src/components/BackgroundMusicPlayer.jsx` — global playlist/single-track playback.
- `src/components/SoundSwitch.jsx` — separate music/effects switches, volume controls and sound-effects test button.
- `src/hooks/useAudio.js` — existing game effects routed through the shared sound-effects channel.
- `src/hooks/useGameActions.js` — connects announcements to server-reported game outcomes.
- `src/routes/root.jsx` — stores settings in context, persists them and updates the audio engine.
- `src/components/Navbar.jsx` and `src/routes/Home.jsx` — expose Audio Settings.

## Announcer event mapping

- Normal roll outcome `bust` (the die is 1): play a random clip from `normalRollOne`.
- Double Down outcome `double_down_success`: play a random clip from `doubleDownSuccess`.
- Double Down outcome `double_down_failed`: play a random clip from `doubleDownFailure`.
- If a successful Double Down also ends the match, the outcome is `won` with `doubleDown.success === true`; the success announcement is played before the match-win celebration.

The server response is authoritative. Announcements play only after the server returns the corresponding outcome. The Double Down parity/scoring rules remain in the existing backend; this audio update does not modify backend logic.

## How the cross-browser audio handling works

The audio manager routes background music and sound effects through separate Web Audio `GainNode` channels when `AudioContext` is available. This is important because `HTMLMediaElement.volume` is only partially supported on some mobile browsers, including iOS Safari. When Web Audio is unavailable or routing a specific element fails, the manager falls back to the media element's native `volume` and `muted` properties.

A music volume of 0 pauses the background track. A sound-effects volume of 0 makes that channel silent. Turning music off does not turn effects off, and turning effects off does not turn music off.

Browsers generally restrict audible autoplay until the user interacts with the page. Greedy Pig attempts to resume the audio engine and start music after a genuine tap, click or keyboard interaction. Interacting with Audio Settings unlocks the audio engine without briefly starting music if the player is adjusting or disabling it. No website can override device-level mute, OS volume, browser restrictions or missing audio hardware; physical-device testing is still required.

## Test checklist

1. Open the app and tap/click the game once. If music is enabled and its volume is above 0, the selected track should start.
2. Set music volume to 0%. Music should pause and become silent.
3. Raise music volume above 0%. Music should resume after the site has received a user interaction.
4. Turn background music off while leaving sound effects on. Music should stop; the test effect and game effects should still play.
5. Turn sound effects off while leaving music on. Music should continue; test/game effects should be silent.
6. Set sound-effects volume to 0%. The test effect and game effects should be silent.
7. Use **Test sound effects** at several volume levels.
8. Test all four music/effects on/off combinations.
9. Test on desktop Chrome/Edge/Firefox, iPhone Safari and Android Chrome where available.
10. During a normal turn, roll a 1 and confirm a `normalRollOne` announcement plays.
11. Use Double Down and confirm even results play `doubleDownSuccess`, while odd results play `doubleDownFailure`.
12. Confirm a successful Double Down that wins the match still plays its success announcement before the match-win celebration.

## Verification commands

Run in the project root:

```bash
npm ci
npm run build
npm run lint
```

A successful local production build does not certify the entire browser/device matrix. Test on physical iPhone Safari and other team target browsers before merging/redeploying.

## Backend / schema impact

No backend files, database tables, schema migrations or API endpoints were changed by this audio fix.

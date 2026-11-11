# Audio controls and announcer fixes

## What changed

- Added `src/audio/audioEngine.js` as the shared audio manager.
- Music and sound effects are routed through separate Web Audio `GainNode` channels when `AudioContext` is available. This avoids relying only on `HTMLMediaElement.volume`, which has partial support on some mobile browsers, including iOS Safari.
- The audio manager falls back to the native media `volume` and `muted` properties when Web Audio is unavailable or a particular media element cannot be routed.
- A music volume of 0 pauses the background music. A sound-effects volume of 0 mutes sound effects. The two categories remain independent.
- The music player attempts to unlock/resume audio on a real pointer, touch or keyboard interaction. This follows browser autoplay policies; the website cannot force audible playback before the user interacts.
- Added a **Test sound effects** button in Audio Settings to verify the effects channel at the selected volume.
- Connected the announcer categories to the server-returned outcomes in `src/hooks/useGameActions.js`:
  - `bust` -> `normalRollOne`
  - `double_down_success` -> `doubleDownSuccess`
  - `double_down_failed` -> `doubleDownFailure`
  - A successful Double Down that also wins the match (`won` with `doubleDown.success`) also plays `doubleDownSuccess` before the match-win celebration.
- The announcer picks a random line within the relevant category and avoids repeating the immediately preceding line in that category where possible.

## Files changed

- `src/audio/audioEngine.js` (new)
- `src/components/BackgroundMusicPlayer.jsx`
- `src/components/SoundSwitch.jsx`
- `src/hooks/useAudio.js`
- `src/hooks/useGameActions.js`
- `src/routes/root.jsx`

## Browser behaviour to understand

Browsers commonly block sound that starts automatically before a user gesture. In Greedy Pig, the first genuine tap/click or keyboard interaction attempts to resume the audio context and start the music if music is enabled and its volume is above 0. The player does not need to install anything or grant a special website permission for ordinary playback.

No web implementation can guarantee sound on literally every device configuration. The browser may lack Web Audio support, audio may be disabled at OS/device level, the tab may be backgrounded, or the user may block media. This implementation uses Web Audio where supported and a native media fallback otherwise. It must still be tested on the team's target devices, especially iPhone Safari.

## Test checklist

1. Open the app and tap/click once. If background music is enabled and above 0, music should start.
2. Set music volume to 0%. Music should become silent and pause.
3. Raise music volume above 0%. Music should resume after the page has received a user interaction.
4. Turn background music off while leaving sound effects on. Music should stop; the test effect and game effects should still play.
5. Turn sound effects off while leaving music on. Music should continue; the test effect and game effects should be silent.
6. Set sound-effects volume to 0%. The test effect and game effects should be silent.
7. Use **Test sound effects** at several volume settings.
8. Test all four music/effects on/off combinations.
9. Test on desktop Chrome/Edge/Firefox and iPhone Safari, ideally also Android Chrome.
10. During a normal turn, roll a 1 and confirm a `normalRollOne` voice clip plays.
11. Use Double Down and confirm even outcomes play `doubleDownSuccess`; odd outcomes play `doubleDownFailure`.
12. Confirm a successful Double Down that ends the match still plays its success announcement before the match-win celebration.

## Verification

Run in the project root:

```bash
npm ci
npm run build
npm run lint
```

The browser/device matrix above cannot be certified from a local production build alone. The team should test on physical iOS Safari and the other target browsers before merging/redeploying.

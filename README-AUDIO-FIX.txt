GREEDY PIG — CROSS-BROWSER AUDIO FIX

This update contains:
- Cross-browser audio routing using separate Web Audio gain channels for background music and sound effects, with a native media fallback.
- Music pauses at 0% volume; music and sound effects can be muted/adjusted independently.
- Music playback unlocks after a real tap/click/key press, following browser autoplay rules.
- A sound-effects test button in Audio Settings.
- Announcer clips connected to server-reported normal-bust, Double Down success and Double Down failure outcomes.
- A successful Double Down that also wins the match still receives its success announcement.

Files changed:
- src/audio/audioEngine.js (new)
- src/components/BackgroundMusicPlayer.jsx
- src/components/SoundSwitch.jsx
- src/hooks/useAudio.js
- src/hooks/useGameActions.js
- src/routes/root.jsx
- docs/AUDIO_IMPLEMENTATION.md
- docs/AUDIO_CROSS_BROWSER_FIX.md

The existing three background tracks and ten announcer recordings are still present in public/audio/. No backend routes, database schema or dependencies were changed.

To verify, run npm ci, npm run build and npm run lint. Then test on physical iPhone Safari and other browsers/devices used by the group. A local build alone cannot certify every device, and browsers/OS settings may still restrict sound or autoplay.

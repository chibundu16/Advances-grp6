GREEDY PIG — ORGANIZED AUDIO INTEGRATION PATCH

This patch contains the background-music/audio-controls code plus all three supplied background tracks and all ten TTSMP3 announcer recordings, renamed and grouped by the spoken lines.

FOLDERS IN THIS PATCH
- src/        React audio-player and audio-settings integration.
- public/     Three background tracks and ten announcer MP3s.
- docs/       Audio inventory, licensing notes and implementation handoff.
- audio-review.html  Preview all included audio in a browser.

IMPORTANT
- Announcer files are categorised and catalogued but are NOT yet triggered by gameplay events.
- Double Down game logic is NOT implemented by this patch.
- A separate short victory fanfare was NOT present in the supplied audio ZIP.
- No backend endpoint or database schema was changed.

See docs/AUDIO_ASSETS.md and docs/AUDIO_IMPLEMENTATION.md for the complete mapping and handoff instructions.

To apply, merge src/, public/, docs/ into the existing team repository and place audio-review.html at the project root. Do not replace .git, .env, node_modules, dist or package manifests. Review conflicts, then run npm ci, npm run dev and npm run build.

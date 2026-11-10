/**
 * Catalog of the supplied TTS announcer recordings.
 *
 * Paths are public URLs, so they can be used with new Audio(src) or the
 * existing useAudio hook. This file only organises/selects clips; it does not
 * connect announcements to game outcomes. Wire the categories into the
 * normal roll and Double Down result handlers when those game rules are ready.
 */
export const ANNOUNCER_CLIPS = {
  normalRollOne: [
    {
      id: "normal_tough_luck",
      text: "Damn, tough luck! Your turn is over.",
      src: "/audio/announcer/normal-roll-one/01-damn-tough-luck-your-turn-is-over.mp3",
    },
    {
      id: "normal_not_as_planned",
      text: "Well, that didn't go as planned. Next player!",
      src: "/audio/announcer/normal-roll-one/02-well-that-didnt-go-as-planned-next-player.mp3",
    },
  ],
  doubleDownSuccess: [
    {
      id: "double_down_success_beat_odds",
      text: "You beat the odds! What a roll!",
      src: "/audio/announcer/double-down/success/01-you-beat-the-odds-what-a-roll.mp3",
    },
    {
      id: "double_down_success_brilliant",
      text: "Absolutely brilliant! That gamble paid off!",
      src: "/audio/announcer/double-down/success/02-absolutely-brilliant-gamble-paid-off.mp3",
    },
    {
      id: "double_down_success_risk_worth_it",
      text: "The risk was worth it! What a play!",
      src: "/audio/announcer/double-down/success/03-the-risk-was-worth-it-what-a-play.mp3",
    },
    {
      id: "double_down_success_big_risk",
      text: "Big risk, bigger reward! Brilliant!",
      src: "/audio/announcer/double-down/success/04-big-risk-bigger-reward-brilliant.mp3",
    },
  ],
  doubleDownFailure: [
    {
      id: "double_down_failure_unlucky",
      text: "Unlucky! That gamble didn't pay off.",
      src: "/audio/announcer/double-down/failure/01-unlucky-that-gamble-didnt-pay-off.mp3",
    },
    {
      id: "double_down_failure_ten_points",
      text: "Ahh, unfortunate! You've lost 10 points.",
      src: "/audio/announcer/double-down/failure/02-ahh-unfortunate-you-lost-ten-points.mp3",
    },
    {
      id: "double_down_failure_not_outcome",
      text: "Not quite the outcome you wanted, huh?",
      src: "/audio/announcer/double-down/failure/03-not-quite-the-outcome-you-wanted-huh.mp3",
    },
    {
      id: "double_down_failure_backfired",
      text: "The gamble backfired! Better luck next time.",
      src: "/audio/announcer/double-down/failure/04-the-gamble-backfired-better-luck-next-time.mp3",
    },
  ],
};

/**
 * Returns one clip from a category, avoiding the previous clip when possible.
 * Example categories: normalRollOne, doubleDownSuccess, doubleDownFailure.
 */
export function getRandomAnnouncerClip(category, previousClipId = null) {
  const clips = ANNOUNCER_CLIPS[category];
  if (!Array.isArray(clips) || clips.length === 0) return null;

  const alternatives = clips.filter((clip) => clip.id !== previousClipId);
  const pool = alternatives.length > 0 ? alternatives : clips;
  return pool[Math.floor(Math.random() * pool.length)];
}

// The Double Down power-up rules, kept in one small pure file so they are easy
// to read, easy to test, and used only by the server.
//
// Each player may use Double Down ONCE per game. They choose it BEFORE a roll:
//   - roll 2, 4 or 6 (even): the points held this turn are doubled, then the roll is added.
//   - roll 1, 3 or 5 (odd):  the points held this turn are lost AND the player
//                            loses 10 points they had already banked. The turn ends.
export const DOUBLE_DOWN_PENALTY = 10;

export function resolveDoubleDown(roll, runningPoints, totalPoints) {
  const success = roll % 2 === 0;

  if (success) {
    return {
      success: true,
      newRunning: runningPoints * 2 + roll,
      newTotal: totalPoints,
      penaltyApplied: 0,
    };
  }

  // The banked score can never go below zero.
  const penaltyApplied = Math.min(DOUBLE_DOWN_PENALTY, totalPoints);
  return {
    success: false,
    newRunning: 0,
    newTotal: totalPoints - penaltyApplied,
    penaltyApplied,
  };
}

import { useState } from "react";
import { useLiveGameContext } from "src/context/useLiveGameContext";
import { rollDice, passTurn } from "src/utils/api";
import addPlayerSound from "src/sound_effect/add_player.mp3";
import loseSound from "src/sound_effect/lose_sound.mp3";
import celebrationSound from "src/sound_effect/celebration.mp3";
import useAudio, { playAudio } from "src/hooks/useAudio";

// The game actions (roll, pass), shared by the desktop and mobile dice sections.
// The SERVER decides every dice roll and every score. This hook only asks the server
// to act, then copies the server's answer onto the screen.
export default function useGameActions() {
  const {
    matchId,
    setPlayerData,
    setCurrentPlayer,
    setDiceValue,
    setIsGameOver,
    setErrorMessage,
    doubleDownArmed,
    setDoubleDownArmed,
    setLastOutcome,
    setInfoMessage,
  } = useLiveGameContext();

  const addPlayerAudio = useAudio(addPlayerSound);
  const loseAudio = useAudio(loseSound);
  const celebrationAudio = useAudio(celebrationSound);
  const [isPassing, setIsPassing] = useState(false);

  // Copy the server's scores into the player data that the screen displays.
  // Server players are listed by seat (turn order), the same order as playerData.
  function applyServerMatch(match) {
    setPlayerData((current) =>
      current.map((player, index) => ({
        ...player,
        running_points: match.players[index].runningPoints,
        total_points: match.players[index].totalPoints,
        double_down_used: match.players[index].doubleDownUsed,
      }))
    );
    setCurrentPlayer(match.currentPlayer);
  }

  // Called by the dice when the player clicks it: ask the server for a roll.
  // If the player armed Double Down, we ask the server to use it for this roll.
  const rollRequest = () => rollDice(matchId, doubleDownArmed);

  // Called by the dice once the animation ends, with the server's answer.
  function handleRollResult(result) {
    applyServerMatch(result.match);
    setDiceValue(result.roll);
    setLastOutcome(result.outcome);
    setDoubleDownArmed(false); // Double Down only ever applies to one roll

    if (result.outcome === "bust") {
      playAudio(loseAudio);
    }

    // Tell the players how the Double Down gamble went (the numbers come from the server).
    if (result.outcome === "double_down_success") {
      playAudio(addPlayerAudio);
      setInfoMessage({
        kind: "success",
        text: `Double Down paid off! Rolled ${result.roll}: turn points went from ${result.doubleDown.turnPointsBefore} to ${result.doubleDown.turnPointsAfter}.`,
      });
    }
    if (result.outcome === "double_down_failed") {
      playAudio(loseAudio);
      const { turnPointsBefore, penaltyApplied } = result.doubleDown;
      setInfoMessage({
        kind: "fail",
        text: `Double Down failed! Rolled ${result.roll}: lost ${turnPointsBefore} turn points and ${penaltyApplied} banked points.`,
      });
    }

    if (result.outcome === "won") {
      // Short pause so players can see the winning roll, then show the winner screen.
      setTimeout(() => {
        playAudio(celebrationAudio);
        setIsGameOver(true);
      }, 1100);
    }
  }

  function handleActionError(error) {
    setErrorMessage(error.message);
  }

  // The PASS button. "isRolling" is passed in so you can't pass in the middle of a roll.
  async function handlePass(isRolling) {
    if (isRolling || isPassing) return;
    setIsPassing(true);
    try {
      const result = await passTurn(matchId);
      playAudio(addPlayerAudio);
      applyServerMatch(result.match);
      setDoubleDownArmed(false); // a new player's turn starts with Double Down off
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsPassing(false);
    }
  }

  return { rollRequest, handleRollResult, handleActionError, handlePass };
}

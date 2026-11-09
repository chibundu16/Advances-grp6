import { useState } from "react";
import { useLiveGameContext } from "src/context/useLiveGameContext";
import { rollDice, passTurn } from "src/utils/api";
import addPlayerSound from "src/sound_effect/add_player.mp3";
import loseSound from "src/sound_effect/lose_sound.mp3";
import celebrationSound from "src/sound_effect/celebration.mp3";
import useAudio from "src/hooks/useAudio";

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
      }))
    );
    setCurrentPlayer(match.currentPlayer);
  }

  // Called by the dice when the player clicks it: ask the server for a roll.
  const rollRequest = () => rollDice(matchId);

  // Called by the dice once the animation ends, with the server's answer.
  function handleRollResult(result) {
    applyServerMatch(result.match);
    setDiceValue(result.roll);

    if (result.outcome === "bust") {
      loseAudio?.play();
    }

    if (result.outcome === "won") {
      // Short pause so players can see the winning roll, then show the winner screen.
      setTimeout(() => {
        celebrationAudio?.play();
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
      addPlayerAudio?.play();
      applyServerMatch(result.match);
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsPassing(false);
    }
  }

  return { rollRequest, handleRollResult, handleActionError, handlePass };
}

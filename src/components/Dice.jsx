import { useEffect, useRef, useState } from "react";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import diceRollSound from "src/sound_effect/dice_roll.mp3";
import useAudio, { playAudio } from "src/hooks/useAudio";

export function Dice({
  getFinalDiceValue, // called with the server's answer when the roll animation ends
  rollRequest, // asks the server to roll; returns a promise
  onError, // called if the server could not be reached or refused the roll
  setIsRolling,
  isRolling,
  setChangeBackground,
}) {
  const { preloadSrcList } = useGreedyPigContext();
  const [currentDice, setCurrentDice] = useState(0);
  const pendingRoll = useRef(null);
  const die = preloadSrcList.filter((dice) => dice.includes("dice"));
  const diceRollAudio = useAudio(diceRollSound);

  const handleDiceClick = () => {
    if (isRolling) return;
    setIsRolling(true);
    setChangeBackground(true);
    // Ask the server for the real roll straight away, while the dice animation plays.
    // We keep the answer (or the error) until the animation finishes.
    pendingRoll.current = rollRequest()
      .then((result) => ({ result }))
      .catch((error) => ({ error }));
  };

  useEffect(() => {
    if (isRolling) {
      let endRoll = 0;
      const interval = setInterval(async () => {
        if (endRoll < 30) {
          // The spinning is just for show. These faces are random and mean nothing.
          playAudio(diceRollAudio);
          setCurrentDice(Math.floor(Math.random() * 6));
          endRoll++;
        } else {
          clearInterval(interval);
          const { result, error } = await pendingRoll.current;
          if (error) {
            onError(error);
          } else {
            // Land on the number the server rolled.
            setCurrentDice(result.roll - 1);
            getFinalDiceValue(result);
          }
          setIsRolling(false);
          setChangeBackground(false);
        }
      }, 100);
    }
  }, [isRolling]);

  return (
    <>
      <button
        className={`hover:scale-105 active:scale-100 duration-300 md:w-auto w-[200px]`}
        onClick={handleDiceClick}
        disabled={isRolling}
        aria-label="Roll the dice"
      >
        {die.map((dice, index) => (
          <img
            key={index}
            src={dice}
            alt={currentDice + 1}
            className={`${currentDice === index ? "" : "hidden"}`}
          />
        ))}
      </button>
    </>
  );
}

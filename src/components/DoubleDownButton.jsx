import { useLiveGameContext } from "src/context/useLiveGameContext";

// The Double Down power-up button. Each player can use it once per game.
// Tapping it "arms" it for the next roll; tapping again cancels. The server does the
// real work: it checks the player hasn't used it, rolls the dice and updates the scores.
export default function DoubleDownButton({ isRolling }) {
  const { playerData, currentPlayer, doubleDownArmed, setDoubleDownArmed } =
    useLiveGameContext();

  const used = Boolean(playerData[currentPlayer]?.double_down_used);
  const armed = doubleDownArmed && !used;

  return (
    <div className="w-full flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setDoubleDownArmed(!armed)}
        disabled={used || isRolling}
        aria-pressed={armed}
        aria-label={
          used
            ? "Double Down already used"
            : armed
            ? "Double Down is on for your next roll. Press to cancel."
            : "Use Double Down on your next roll"
        }
        className={`w-[200px] md:w-full text-center text-sm lg:text-lg font-semibold py-2 lg:py-3 rounded-lg border duration-300 ${
          used
            ? "bg-[#ffffff10] text-[#ffffff60] border-[#ffffff30] cursor-not-allowed"
            : armed
            ? "bg-[#F59E0B] text-black border-[#FDE68A] shadow-[0_0_20px_#F59E0B80] hover:scale-105 active:scale-100"
            : "bg-[#F59E0B30] text-[#FDE68A] border-[#F59E0B] hover:scale-105 active:scale-100"
        }`}
      >
        {used ? "DOUBLE DOWN USED" : armed ? "DOUBLE DOWN ON ✕" : "DOUBLE DOWN ×2"}
      </button>
      {armed && (
        <p className="text-[#FDE68A] text-xs lg:text-sm text-center">
          Even roll: turn points doubled. Odd roll: lose them and 10 banked points.
        </p>
      )}
    </div>
  );
}

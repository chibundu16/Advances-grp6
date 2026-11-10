import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import { LiveGameContext } from "src/context/useLiveGameContext";
import { getInitialPlayerData } from "src/utils/live_game/getInitialData";
import ErrorBanner from "src/components/ErrorBanner";
import InfoBanner from "src/components/InfoBanner";
import { getMatch } from "src/utils/api";
import { generateId } from "src/utils/generateData";

// The match lives on the server. We keep only its id in this browser, so a page refresh
// can ask the server for the same match again instead of starting a new game.
const MATCH_STORAGE_KEY = "greedyPigMatchId";

function readSavedMatchId() {
  try {
    const saved = Number(localStorage.getItem(MATCH_STORAGE_KEY));
    return Number.isInteger(saved) && saved >= 1 ? saved : null;
  } catch {
    return null; // storage can be blocked (private mode); the game still works without it
  }
}

function LiveGamePage() {
  const { preloadSrcList,pigPetNames } = useGreedyPigContext();
  const [playerData, setPlayerData] = useState(getInitialPlayerData(preloadSrcList.slice(0,9),pigPetNames));
  const [maxPoints, setMaxPoints] = useState(100);
  const [gameHistory, setGameHistory] = useState([]);
  const [numberRolled, setNumberRolled] = useState(0);
  const [changeBackground, setChangeBackground] = useState(false); //if the state of the game was still in the running points
  const [isGameOver, setIsGameOver] = useState(false);
  const [isContinue, setIsContinue] = useState(false);
  const [isRunning, setIsRunning] = useState("?"); //if the state of the game was still in the running points
  const [diceValue, setDiceValue] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [matchId, setMatchIdState] = useState(readSavedMatchId); // the id of the match saved on the server
  const [isRestoring, setIsRestoring] = useState(() => readSavedMatchId() !== null);
  const [errorMessage, setErrorMessage] = useState(""); // shown in the red banner
  const [doubleDownArmed, setDoubleDownArmed] = useState(false); // player tapped Double Down for the next roll
  const [lastOutcome, setLastOutcome] = useState(""); // what the server said happened on the last roll
  const [infoMessage, setInfoMessage] = useState(null); // { text, kind } shown in the info banner
  const showRed = diceValue === 1 || lastOutcome === "double_down_failed";

  // Remember (or forget) the match id in this browser as well as in state.
  function setMatchId(id) {
    setMatchIdState(id);
    try {
      if (id) localStorage.setItem(MATCH_STORAGE_KEY, String(id));
      else localStorage.removeItem(MATCH_STORAGE_KEY);
    } catch {
      // ignore: nothing to do if the browser won't let us save
    }
  }

  // After a refresh: if we remember a match, load it from the server and rebuild the screen.
  useEffect(() => {
    const savedId = readSavedMatchId();
    if (!savedId) return;
    let cancelled = false;

    getMatch(savedId)
      .then((match) => {
        if (cancelled) return;
        if (match.status === "finished") {
          setMatchId(null); // that game is over, so there is nothing to resume
          return;
        }
        const pigs = preloadSrcList.filter((src) => src.includes("pig"));
        setPlayerData(
          match.players.map((p) => ({
            id: generateId(),
            avatar: pigs[p.avatar],
            tag: pigPetNames[p.avatar],
            name: p.name,
            pig_index: p.avatar,
            running_points: p.runningPoints,
            total_points: p.totalPoints,
            double_down_used: p.doubleDownUsed,
          }))
        );
        setCurrentPlayer(match.currentPlayer);
        setMaxPoints(match.maxPoints);
        setIsContinue(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setMatchId(null);
        setErrorMessage(`Couldn't restore your last game. ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isRestoring) {
    return (
      <main className="bg-[#111111] min-h-screen grid place-content-center text-white sec-font">
        <p role="status">Loading your game...</p>
      </main>
    );
  }

  return (
    <>
      <main className="bg-[#111111] min-h-screen min-w-full relative z-10 sec-font ">
        <div
          className={`${
            changeBackground ? " bg-[#D30CBD] blur-[200px] md:blur-[300px] " : showRed ? "bg-[#D30C0C]  blur-[500px] md:blur-[800px]" : "bg-[#056FA4]  blur-[500px] md:blur-[800px]"
          } rounded-full w-[800px] h-[800px] -z-10 fixed -bottom-[700px] -left-[700px] md:-bottom-96 md:-left-96 `}
        ></div>
        <div className={`${
            changeBackground ? "bg-[#056FA4] blur-[200px] md:blur-[300px] " : showRed ? "bg-[#D30C0C] blur-[500px] md:blur-[800px] " : "bg-[#D30CBD] blur-[500px] md:blur-[800px]"
          } rounded-full w-[800px] h-[800px]  -z-10 fixed -top-[700px] -right-[700px] md:-top-96 md:-right-96`}></div>
        <LiveGameContext.Provider
          value={{
            playerData,
            setPlayerData,
            maxPoints,
            setMaxPoints,
            gameHistory,
            setGameHistory,
            numberRolled,
            setNumberRolled,
            isRunning,
            setIsRunning,
            changeBackground,
            setChangeBackground,
            diceValue,
            setDiceValue,
            currentPlayer,
            setCurrentPlayer,
            setIsGameOver,
            isGameOver,
            isContinue,
            setIsContinue,
            matchId,
            setMatchId,
            errorMessage,
            setErrorMessage,
            doubleDownArmed,
            setDoubleDownArmed,
            lastOutcome,
            setLastOutcome,
            infoMessage,
            setInfoMessage,
          }}
        >
          <ErrorBanner />
          <InfoBanner />
          <Outlet />
        </LiveGameContext.Provider>
      </main>
    </>
  );
}

export default LiveGamePage;

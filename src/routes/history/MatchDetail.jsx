import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "src/components/Navbar";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import { getMatch } from "src/utils/api";

export default function MatchDetail() {
  const { id } = useParams();
  const { preloadSrcList } = useGreedyPigContext();
  const pigs = preloadSrcList.filter((src) => src.includes("pig"));

  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    getMatch(id)
      .then((result) => {
        if (!cancelled) setMatch(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  return (
    <>
      <Navbar />
      <div className="text-white px-[5%] md:px-[10%] py-6 max-w-3xl mx-auto">
        <Link to="/history" className="underline hover:text-[#D30CBD]">
          ← All matches
        </Link>

        {isLoading && (
          <p role="status" className="py-10 text-center">
            Loading match...
          </p>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-[#D30C0C] bg-[#3a0a0a] p-4 text-center"
          >
            <p className="mb-3">{error}</p>
            <button
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded px-6 py-2 bg-[#D30CBD] font-bold hover:scale-95 duration-300"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && match && (
          <>
            <h2 className="pri-font text-3xl md:text-5xl mt-4 mb-2">
              Match #{match.id}
            </h2>
            <p className="mb-6 text-[#ffffffb0]">
              First to {match.maxPoints} points ·{" "}
              {match.players.length} players ·{" "}
              {match.finishedAt
                ? new Date(match.finishedAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "not finished"}
            </p>

            {match.status !== "finished" && (
              <p className="mb-4 rounded-lg border border-[#ffffff40] bg-[#ffffff10] p-3">
                This match was never finished, so these are the scores so far.
              </p>
            )}

            <h3 className="text-xl font-bold mb-3">Final leaderboard</h3>
            <ol className="grid gap-3">
              {match.leaderboard.map((player) => {
                const isWinner =
                  match.status === "finished" && player.rank === 1;
                return (
                  <li
                    key={player.seat}
                    className={`flex items-center gap-4 rounded-lg border p-3 ${
                      isWinner
                        ? "border-[#D30CBD] bg-[#D30CBD30]"
                        : "border-[#ffffff40] bg-[#ffffff10]"
                    }`}
                  >
                    <span className="pri-font text-2xl w-8 text-center">
                      {player.rank}
                    </span>
                    <img src={pigs[player.avatar]} alt="" width={56} />
                    <span className="flex-1 min-w-0 text-lg font-bold capitalize truncate">
                      {player.name}
                      {isWinner && (
                        <span className="ml-2 text-sm font-normal">
                          (winner)
                        </span>
                      )}
                    </span>
                    <span className="text-xl font-bold">
                      {player.totalPoints}
                    </span>
                  </li>
                );
              })}
            </ol>

            <Link
              to="/live-game/setup"
              className="inline-block mt-8 rounded px-8 py-3 bg-[#D30CBD] font-bold hover:scale-95 duration-300"
            >
              Play again
            </Link>
          </>
        )}
      </div>
    </>
  );
}

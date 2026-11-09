import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "src/components/Navbar";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import { getMatches } from "src/utils/api";

const PAGE_SIZE = 8;

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MatchHistory() {
  const { preloadSrcList } = useGreedyPigContext();
  // Same list the setup screen uses, so avatar number 3 is the same pig everywhere.
  const pigs = preloadSrcList.filter((src) => src.includes("pig"));

  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0); // add 1 to load the page again

  useEffect(() => {
    let cancelled = false; // ignore the answer if the player has already moved on
    setIsLoading(true);
    setError("");

    getMatches(page, PAGE_SIZE)
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [page, attempt]);

  return (
    <>
      <Navbar />
      <div className="text-white px-[5%] md:px-[10%] py-6 max-w-5xl mx-auto">
        <h2 className="pri-font text-3xl md:text-5xl mb-2">Match History</h2>
        <p className="mb-6 text-[#ffffffb0]">
          Every finished match. Pick one to see its final leaderboard.
        </p>

        {isLoading && (
          <p role="status" className="py-10 text-center">
            Loading matches...
          </p>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-lg border border-[#D30C0C] bg-[#3a0a0a] p-4 text-center"
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

        {!isLoading && !error && data && data.matches.length === 0 && (
          <div className="rounded-lg border border-[#ffffff40] bg-[#ffffff10] p-8 text-center">
            <p className="mb-4 text-lg">No finished matches yet.</p>
            <Link
              to="/live-game/setup"
              className="inline-block rounded px-8 py-3 bg-[#D30CBD] font-bold hover:scale-95 duration-300"
            >
              Play a match
            </Link>
          </div>
        )}

        {!isLoading && !error && data && data.matches.length > 0 && (
          <>
            <ul className="grid gap-4">
              {data.matches.map((match) => {
                const winner = match.leaderboard[0];
                return (
                  <li key={match.id}>
                    <Link
                      to={`/history/${match.id}`}
                      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-lg border border-[#ffffff40] hover:border-[#ffffff90] bg-[#ffffff10] hover:bg-[#ffffff18] p-4 duration-300"
                    >
                      <img
                        src={pigs[winner.avatar]}
                        alt=""
                        width={64}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="pri-font text-xl md:text-2xl truncate">
                          <span className="capitalize">{winner.name}</span> won
                        </p>
                        <p className="text-sm text-[#ffffffb0]">
                          {match.players.length} players · first to{" "}
                          {match.maxPoints} · {formatDate(match.finishedAt)}
                        </p>
                      </div>
                      <ol className="flex flex-wrap gap-2 text-sm">
                        {match.leaderboard.map((p) => (
                          <li
                            key={p.seat}
                            className={`rounded-full px-3 py-1 border ${
                              p.rank === 1
                                ? "border-[#D30CBD] bg-[#D30CBD40]"
                                : "border-[#ffffff40]"
                            }`}
                          >
                            {p.name} {p.totalPoints}
                          </li>
                        ))}
                      </ol>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <nav
              aria-label="History pages"
              className="flex items-center justify-between mt-6"
            >
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="rounded px-5 py-2 bg-[#ffffff20] border border-[#ffffff40] disabled:opacity-40 hover:bg-[#ffffff40] duration-300"
              >
                Newer
              </button>
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
                className="rounded px-5 py-2 bg-[#ffffff20] border border-[#ffffff40] disabled:opacity-40 hover:bg-[#ffffff40] duration-300"
              >
                Older
              </button>
            </nav>
          </>
        )}
      </div>
    </>
  );
}

import { useEffect } from "react";
import { useLiveGameContext } from "src/context/useLiveGameContext";

// A message that pops up at the top of the screen when something goes wrong
// (server unreachable, invalid setup, and so on). It hides itself after 6 seconds.
export default function ErrorBanner() {
  const { errorMessage, setErrorMessage } = useLiveGameContext();

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [errorMessage, setErrorMessage]);

  if (!errorMessage) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md flex items-start gap-3 rounded-lg border border-[#D30C0C] bg-[#3a0a0a] px-4 py-3 text-white shadow-lg"
    >
      <p className="flex-1 text-sm md:text-base">{errorMessage}</p>
      <button
        onClick={() => setErrorMessage("")}
        aria-label="Dismiss message"
        className="text-lg leading-none hover:scale-110 duration-200"
      >
        ✕
      </button>
    </div>
  );
}

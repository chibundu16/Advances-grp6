import { useEffect } from "react";
import { useLiveGameContext } from "src/context/useLiveGameContext";

// A message that pops up at the top of the screen to tell players what just happened
// (for example the result of a Double Down). It hides itself after 6 seconds.
// Same idea as ErrorBanner, but green for good news and red for bad news.
export default function InfoBanner() {
  const { infoMessage, setInfoMessage } = useLiveGameContext();

  useEffect(() => {
    if (!infoMessage) return;
    const timer = setTimeout(() => setInfoMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [infoMessage, setInfoMessage]);

  if (!infoMessage) return null;

  const isGood = infoMessage.kind === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md flex items-start gap-3 rounded-lg border px-4 py-3 text-white shadow-lg ${
        isGood ? "border-[#22C55E] bg-[#0a3a1c]" : "border-[#D30C0C] bg-[#3a0a0a]"
      }`}
    >
      <p className="flex-1 text-sm md:text-base">{infoMessage.text}</p>
      <button
        onClick={() => setInfoMessage(null)}
        aria-label="Dismiss message"
        className="text-lg leading-none hover:scale-110 duration-200"
      >
        ✕
      </button>
    </div>
  );
}

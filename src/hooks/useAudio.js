import { useEffect, useMemo } from "react";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";

/** Creates a reusable sound-effect audio element that follows app settings. */
export default function useAudio(src) {
  const { audioSettings } = useGreedyPigContext();
  const audio = useMemo(() => {
    const element = new Audio(src);
    element.preload = "auto";
    return element;
  }, [src]);

  useEffect(() => {
    audio.volume = audioSettings.soundEffectsVolume;
    audio.muted = !audioSettings.soundEffectsEnabled;
  }, [audio, audioSettings.soundEffectsEnabled, audioSettings.soundEffectsVolume]);

  return audio;
}

/** Restart a short effect when it is triggered and ignore blocked play promises. */
export function playAudio(audio) {
  if (!audio || audio.muted) return;

  try {
    audio.currentTime = 0;
    const playback = audio.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {});
    }
  } catch {
    // Audio should never interrupt the game if a browser blocks playback.
  }
}

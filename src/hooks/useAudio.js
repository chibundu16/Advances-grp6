import { useEffect, useMemo } from "react";
import {
  playManagedAudio,
  registerAudioElement,
  unregisterAudioElement,
} from "src/audio/audioEngine";

const dynamicAudioCache = new Map();

/** Creates a reusable sound-effect audio element that follows app settings. */
export default function useAudio(src) {
  const audio = useMemo(() => {
    const element = new Audio(src);
    element.preload = "auto";
    return element;
  }, [src]);

  // Preferences are applied centrally by Root through audioEngine. Registering
  // each effect here routes it through the shared effects volume on Web Audio.
  useEffect(() => {
    registerAudioElement(audio, "effects");
    return () => unregisterAudioElement(audio);
  }, [audio]);

  return audio;
}

/** Restart a short effect when it is triggered. */
export function playAudio(audio) {
  return playManagedAudio(audio, "effects");
}

/** Play a public-folder sound by URL and cache its media element for reuse. */
export function playAudioSource(src) {
  if (!src) return Promise.resolve(false);
  let audio = dynamicAudioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    dynamicAudioCache.set(src, audio);
  }
  return playManagedAudio(audio, "effects");
}

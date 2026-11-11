import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import { BACKGROUND_MUSIC_TRACKS } from "src/audio/audioConfig";
import {
  registerAudioElement,
  unregisterAudioElement,
  unlockAudio,
} from "src/audio/audioEngine";

/**
 * One persistent music element for the whole app. It uses the Web Audio music
 * gain bus where available (important for iOS Safari volume support), with a
 * native media-volume fallback. Playback begins after the first user gesture.
 */
export default function BackgroundMusicPlayer() {
  const { audioSettings } = useGreedyPigContext();
  const audioRef = useRef(null);
  const hasUserInteracted = useRef(false);
  const settingsRef = useRef(audioSettings);
  const [playlistIndex, setPlaylistIndex] = useState(0);

  useEffect(() => {
    settingsRef.current = audioSettings;
  }, [audioSettings]);

  const activeTrack = useMemo(() => {
    if (audioSettings.musicSelection === "playlist") {
      return BACKGROUND_MUSIC_TRACKS[playlistIndex];
    }
    return (
      BACKGROUND_MUSIC_TRACKS.find(
        (track) => track.id === audioSettings.musicSelection
      ) || BACKGROUND_MUSIC_TRACKS[0]
    );
  }, [audioSettings.musicSelection, playlistIndex]);

  const startMusicFromGesture = useCallback(() => {
    hasUserInteracted.current = true;
    unlockAudio();

    const audio = audioRef.current;
    const settings = settingsRef.current;
    if (!audio || !settings.backgroundMusicEnabled || settings.backgroundMusicVolume <= 0) {
      return;
    }

    // play() is invoked synchronously from the trusted gesture handler, which
    // satisfies browsers that block audible autoplay until a user interacts.
    if (audio.paused) {
      audio.play().catch(() => {
        // If a browser still blocks playback, the next real gesture retries it.
      });
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    registerAudioElement(audio, "music");

    // Capture-phase handlers run before React's click/tap handlers. Pointer is
    // the modern path; touch and keyboard cover older/mobile/assistive cases.
    const handleGesture = (event) => {
      if (event && event.isTrusted === false) return;

      // Interacting with the audio-settings UI should unlock the audio engine,
      // but must not briefly start music when the player's intention is to mute it.
      const target = event?.target;
      const isAudioSettingsInteraction =
        target && typeof target.closest === "function" &&
        target.closest("[data-audio-control='true']");
      if (isAudioSettingsInteraction) {
        hasUserInteracted.current = true;
        unlockAudio();
        return;
      }

      startMusicFromGesture();
    };

    window.addEventListener("pointerdown", handleGesture, { capture: true, passive: true });
    window.addEventListener("touchstart", handleGesture, { capture: true, passive: true });
    window.addEventListener("click", handleGesture, { capture: true });
    window.addEventListener("keydown", handleGesture, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", handleGesture, true);
      window.removeEventListener("touchstart", handleGesture, true);
      window.removeEventListener("click", handleGesture, true);
      window.removeEventListener("keydown", handleGesture, true);
      unregisterAudioElement(audio);
    };
  }, [startMusicFromGesture]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    registerAudioElement(audio, "music");

    if (!audioSettings.backgroundMusicEnabled || audioSettings.backgroundMusicVolume <= 0) {
      audio.pause();
      return;
    }

    if (hasUserInteracted.current) {
      unlockAudio();
      audio.play().catch(() => {
        // A subsequent user gesture can retry if the browser suspended audio.
      });
    }
  }, [
    audioSettings.backgroundMusicEnabled,
    audioSettings.backgroundMusicVolume,
    activeTrack.src,
  ]);

  function handleTrackEnded() {
    if (audioSettings.musicSelection === "playlist") {
      setPlaylistIndex((currentIndex) =>
        (currentIndex + 1) % BACKGROUND_MUSIC_TRACKS.length
      );
      return;
    }

    const audio = audioRef.current;
    if (
      audio &&
      audioSettings.backgroundMusicEnabled &&
      audioSettings.backgroundMusicVolume > 0
    ) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  return (
    <audio
      ref={audioRef}
      src={activeTrack.src}
      preload="none"
      onEnded={handleTrackEnded}
      aria-hidden="true"
    />
  );
}

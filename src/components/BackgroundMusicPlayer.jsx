import { useEffect, useMemo, useRef, useState } from "react";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import { BACKGROUND_MUSIC_TRACKS } from "src/audio/audioConfig";

/**
 * A single music player mounted at the app root so music does not restart
 * when the user moves between React Router pages.
 * Browsers require a user gesture before scripted audio playback is allowed.
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

  useEffect(() => {
    const startMusicAfterGesture = () => {
      hasUserInteracted.current = true;
      window.removeEventListener("pointerdown", startMusicAfterGesture);
      window.removeEventListener("keydown", startMusicAfterGesture);
      const currentAudio = audioRef.current;
      if (currentAudio && settingsRef.current.backgroundMusicEnabled) {
        currentAudio.volume = settingsRef.current.backgroundMusicVolume;
        currentAudio.play().catch(() => {
          // The browser may still reject playback; the next user interaction
          // or change in audio settings will try again.
        });
      }
    };

    window.addEventListener("pointerdown", startMusicAfterGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", startMusicAfterGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", startMusicAfterGesture);
      window.removeEventListener("keydown", startMusicAfterGesture);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = audioSettings.backgroundMusicVolume;

    if (!audioSettings.backgroundMusicEnabled) {
      audio.pause();
      return;
    }

    if (hasUserInteracted.current) {
      audio.play().catch(() => {
        // Playback is intentionally not forced before a browser gesture.
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
    if (audio && audioSettings.backgroundMusicEnabled) {
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

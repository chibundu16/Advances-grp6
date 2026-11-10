export const AUDIO_SETTINGS_STORAGE_KEY = "greedy-pig-audio-settings";

export const DEFAULT_AUDIO_SETTINGS = {
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.22,
  soundEffectsEnabled: true,
  soundEffectsVolume: 0.8,
  musicSelection: "playlist",
};

export const BACKGROUND_MUSIC_TRACKS = [
  {
    id: "everyday-is-a-holiday",
    title: "Everyday Is A Holiday",
    artist: "Brotheration Records / Queens of Ocean 11",
    src: "/audio/music/everyday-is-a-holiday-queens-of-ocean-11.mp3",
  },
  {
    id: "up-in-the-air",
    title: "Up In The Air",
    artist: "DonnySombrero",
    src: "/audio/music/up-in-the-air.mp3",
  },
  {
    id: "background-music",
    title: "Background Music",
    artist: "lNPLUSMUSIC",
    src: "/audio/music/background-music-lnplusmusic.mp3",
  },
];

export function readSavedAudioSettings() {
  try {
    const saved = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (!saved) return DEFAULT_AUDIO_SETTINGS;

    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...parsed,
      backgroundMusicVolume: clampVolume(parsed.backgroundMusicVolume, DEFAULT_AUDIO_SETTINGS.backgroundMusicVolume),
      soundEffectsVolume: clampVolume(parsed.soundEffectsVolume, DEFAULT_AUDIO_SETTINGS.soundEffectsVolume),
      musicSelection:
        parsed.musicSelection === "playlist" ||
        BACKGROUND_MUSIC_TRACKS.some((track) => track.id === parsed.musicSelection)
          ? parsed.musicSelection
          : DEFAULT_AUDIO_SETTINGS.musicSelection,
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function clampVolume(value, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(1, Math.max(0, numericValue));
}

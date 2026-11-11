import { useState } from "react";
import { createPortal } from "react-dom";
import { AiFillSound } from "react-icons/ai";
import { FiMusic, FiVolume2, FiX } from "react-icons/fi";
import { useGreedyPigContext } from "src/context/useGreedyPigContext";
import { BACKGROUND_MUSIC_TRACKS } from "src/audio/audioConfig";
import { playAudioSource } from "src/hooks/useAudio";
import { unlockAudio } from "src/audio/audioEngine";
import previewSound from "src/sound_effect/selection_button.mp3";

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      <span className="relative h-6 w-11 rounded-full bg-white/20 transition peer-checked:bg-[#D30CBD] after:content-[''] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
      <span className="text-sm text-white">{checked ? "On" : "Off"}</span>
    </label>
  );
}

function VolumeControl({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <label className="text-white/80">{label}</label>
        <span className="font-semibold text-white tabular-nums">
          {value === 0 ? "Muted · 0%" : `${Math.round(value * 100)}%`}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#D30CBD] cursor-pointer"
        aria-label={label}
      />
    </div>
  );
}

function SoundSwitch() {
  const [isOpen, setIsOpen] = useState(false);
  const { audioSettings, updateAudioSettings } = useGreedyPigContext();

  const update = (changes) => {
    unlockAudio();
    updateAudioSettings(changes);
  };

  const modal = isOpen ? (
    <div
      data-audio-control="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-settings-title"
        className="w-full max-w-md rounded-2xl border border-white/20 bg-[#171717] p-5 text-white shadow-2xl sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="audio-settings-title" className="pri-font text-2xl">
              Audio Settings
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Music and sound effects can be controlled separately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close audio settings"
          >
            <FiX size={22} />
          </button>
        </header>

        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiMusic size={21} className="text-[#E879DF]" />
                <div>
                  <h3 className="font-semibold">Background Music</h3>
                  <p className="text-xs text-white/55">Continuous music while playing</p>
                </div>
              </div>
              <Toggle
                label="Background music"
                checked={audioSettings.backgroundMusicEnabled}
                onChange={(value) => update({ backgroundMusicEnabled: value })}
              />
            </div>

            <VolumeControl
              label="Music volume"
              value={audioSettings.backgroundMusicVolume}
              onChange={(value) => update({ backgroundMusicVolume: value })}
            />

            <div className="space-y-2">
              <label htmlFor="music-selection" className="block text-sm text-white/80">
                Music selection
              </label>
              <select
                id="music-selection"
                value={audioSettings.musicSelection}
                onChange={(event) => update({ musicSelection: event.target.value })}
                className="w-full rounded-lg border border-white/20 bg-[#252525] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D30CBD]"
              >
                <option value="playlist">Play all three tracks in order</option>
                {BACKGROUND_MUSIC_TRACKS.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title} — {track.artist}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="border-t border-white/10" />

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiVolume2 size={22} className="text-[#E879DF]" />
                <div>
                  <h3 className="font-semibold">Sound Effects</h3>
                  <p className="text-xs text-white/55">Dice, buttons and announcements</p>
                </div>
              </div>
              <Toggle
                label="Sound effects"
                checked={audioSettings.soundEffectsEnabled}
                onChange={(value) => update({ soundEffectsEnabled: value })}
              />
            </div>

            <VolumeControl
              label="Sound effects volume"
              value={audioSettings.soundEffectsVolume}
              onChange={(value) => update({ soundEffectsVolume: value })}
            />
            <button
              type="button"
              onClick={() => playAudioSource(previewSound)}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
            >
              Test sound effects
            </button>
          </section>
        </div>

        <p className="mt-5 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-white/65">
          Your preferences are saved in this browser. Music starts after your first
          tap, click or key press because browsers restrict autoplay. Setting a
          volume slider to 0% pauses or mutes that audio category. Music and sound
          effects remain independent.
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-5 w-full rounded-lg bg-[#D30CBD] px-4 py-3 font-bold text-white transition hover:bg-[#b90aa9]"
        >
          Done
        </button>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Open audio settings"
      >
        <AiFillSound size={19} />
        <span>Audio</span>
      </button>
      {modal && createPortal(modal, document.body)}
    </>
  );
}

export default SoundSwitch;

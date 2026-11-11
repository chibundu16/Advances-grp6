/**
 * Cross-browser audio routing for Greedy Pig.
 *
 * HTMLMediaElement.volume is only partially supported on some mobile browsers
 * (notably iOS Safari). When Web Audio is available, route music and effects
 * through separate GainNodes so the sliders work independently. If Web Audio
 * is unavailable or a media element cannot be routed, fall back to the native
 * media volume/mute properties.
 */

let audioContext = null;
let musicGain = null;
let effectsGain = null;
let latestPreferences = {
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.22,
  soundEffectsEnabled: true,
  soundEffectsVolume: 0.8,
};

const registeredElements = new Map();
const sourceNodes = new WeakMap();
const routedElements = new WeakMap();

function clamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

function getBusGain(bus) {
  return bus === "music" ? musicGain : effectsGain;
}

function getBusPreferences(bus) {
  if (bus === "music") {
    return {
      enabled: latestPreferences.backgroundMusicEnabled,
      volume: clamp(latestPreferences.backgroundMusicVolume),
    };
  }

  return {
    enabled: latestPreferences.soundEffectsEnabled,
    volume: clamp(latestPreferences.soundEffectsVolume),
  };
}

function effectiveGain(bus) {
  const { enabled, volume } = getBusPreferences(bus);
  return enabled ? volume : 0;
}

function applyGain(bus) {
  const gainNode = getBusGain(bus);
  if (!gainNode || !audioContext) return;

  const value = effectiveGain(bus);
  try {
    gainNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.015);
  } catch {
    gainNode.gain.value = value;
  }
}

function applyNativeFallback(audio, bus) {
  const { enabled, volume } = getBusPreferences(bus);
  // Native volume is the fallback for browsers without a usable Web Audio API.
  // The muted property remains useful even on platforms that restrict volume.
  try {
    audio.volume = volume;
    audio.muted = !enabled || volume === 0;
  } catch {
    // A device/browser may expose read-only media volume controls.
  }
}

function ensureAudioContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;

  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    audioContext = new AudioContextConstructor();
    musicGain = audioContext.createGain();
    effectsGain = audioContext.createGain();

    musicGain.connect(audioContext.destination);
    effectsGain.connect(audioContext.destination);
    applyGain("music");
    applyGain("effects");

    // Connect any media elements that were registered before the first gesture.
    registeredElements.forEach((bus, audio) => connectElement(audio, bus));
    return audioContext;
  } catch {
    audioContext = null;
    musicGain = null;
    effectsGain = null;
    return null;
  }
}

function connectElement(audio, bus) {
  if (!audio || !audioContext) return false;
  const destination = getBusGain(bus);
  if (!destination) return false;
  if (routedElements.get(audio) === bus) return true;

  try {
    let source = sourceNodes.get(audio);
    if (!source) {
      source = audioContext.createMediaElementSource(audio);
      sourceNodes.set(audio, source);
    } else if (routedElements.has(audio)) {
      // It is already connected to a different bus. A disconnected source is
      // safe to reconnect after a React StrictMode cleanup/remount.
      source.disconnect();
    }

    // A media element source can only be created once, but can be reconnected.
    source.connect(destination);
    routedElements.set(audio, bus);
    audio.volume = 1;
    audio.muted = false;
    return true;
  } catch {
    // Keep the app usable if a specific browser/media element cannot be routed.
    applyNativeFallback(audio, bus);
    return false;
  }
}

export function registerAudioElement(audio, bus = "effects") {
  if (!audio) return;
  const safeBus = bus === "music" ? "music" : "effects";
  registeredElements.set(audio, safeBus);

  if (audioContext) {
    if (!connectElement(audio, safeBus)) applyNativeFallback(audio, safeBus);
  } else {
    applyNativeFallback(audio, safeBus);
  }
}

export function unregisterAudioElement(audio) {
  if (!audio) return;
  registeredElements.delete(audio);
  const source = sourceNodes.get(audio);
  if (source) {
    try {
      source.disconnect();
    } catch {
      // Ignore a source that is already disconnected.
    }
  }
  routedElements.delete(audio);
  try {
    audio.pause();
  } catch {
    // Ignore cleanup errors.
  }
  // Keep the WeakMap source association: createMediaElementSource() must not
  // be called a second time for the same HTMLAudioElement instance.
}

export function updateAudioPreferences(preferences) {
  latestPreferences = {
    ...latestPreferences,
    ...preferences,
    backgroundMusicVolume: clamp(preferences.backgroundMusicVolume ?? latestPreferences.backgroundMusicVolume),
    soundEffectsVolume: clamp(preferences.soundEffectsVolume ?? latestPreferences.soundEffectsVolume),
  };

  if (audioContext) {
    applyGain("music");
    applyGain("effects");
  }

  registeredElements.forEach((bus, audio) => {
    if (routedElements.get(audio) !== bus) applyNativeFallback(audio, bus);
  });
}

/**
 * Call directly from a real click/tap/keydown handler. Browsers may suspend
 * audio until a user gesture; resuming here makes later game-event audio work.
 */
export function unlockAudio() {
  const context = ensureAudioContext();
  if (!context) return Promise.resolve(false);

  registeredElements.forEach((bus, audio) => {
    if (routedElements.get(audio) !== bus) connectElement(audio, bus);
  });

  if (context.state === "running") return Promise.resolve(true);
  try {
    return context.resume().then(() => context.state === "running").catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

export function isAudioBusEnabled(bus = "effects") {
  const { enabled, volume } = getBusPreferences(bus);
  return enabled && volume > 0;
}

export function playManagedAudio(audio, bus = "effects") {
  if (!audio || !isAudioBusEnabled(bus)) return Promise.resolve(false);

  registerAudioElement(audio, bus);
  // This is also called from actual UI/game interactions. If the context was
  // suspended by the browser, resume it before playback where possible.
  unlockAudio();

  try {
    audio.pause();
    audio.currentTime = 0;
    const playback = audio.play();
    if (playback && typeof playback.then === "function") {
      return playback.then(() => true).catch(() => false);
    }
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

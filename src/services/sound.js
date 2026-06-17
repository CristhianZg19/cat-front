export const playOptionalSound = (src, options = {}) => {
  if (typeof Audio === 'undefined') {
    return null;
  }

  try {
    const audio = new Audio(src);
    audio.volume = options.volume ?? 0.45;
    audio.loop = options.loop ?? false;

    const playPromise = audio.play();

    if (playPromise?.catch) {
      playPromise.catch(() => undefined);
    }

    return audio;
  } catch {
    return null;
  }
};

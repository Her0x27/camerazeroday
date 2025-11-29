export function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      return new AudioContextClass();
    }
    return null;
  } catch {
    return null;
  }
}

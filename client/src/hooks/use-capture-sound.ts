import { useCallback, useRef } from "react";
import { getAudioContext } from "@/lib/types";

const SOUND_CONFIG = {
  frequency: 800,
  initialGain: 0.1,
  finalGain: 0.01,
  duration: 0.1,
} as const;

export function useCaptureSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCapture = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = getAudioContext();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = SOUND_CONFIG.frequency;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(SOUND_CONFIG.initialGain, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        SOUND_CONFIG.finalGain,
        audioContext.currentTime + SOUND_CONFIG.duration
      );

      oscillator.start();
      oscillator.stop(audioContext.currentTime + SOUND_CONFIG.duration);
    } catch {
      // Audio not available
    }
  }, []);

  return { playCapture };
}

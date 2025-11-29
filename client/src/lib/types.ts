export interface WebkitDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export const DeviceOrientationEventWithPermission =
  DeviceOrientationEvent as unknown as DeviceOrientationEventStatic &
    typeof DeviceOrientationEvent;

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

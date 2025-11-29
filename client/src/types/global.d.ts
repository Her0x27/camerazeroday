declare global {
  interface NetworkInformation extends EventTarget {
    readonly downlink: number;
    readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
    readonly rtt: number;
    readonly saveData: boolean;
    readonly type?: "bluetooth" | "cellular" | "ethernet" | "none" | "wifi" | "wimax" | "other" | "unknown";
    onchange: ((this: NetworkInformation, ev: Event) => void) | null;
  }

  interface Navigator {
    readonly connection?: NetworkInformation;
    readonly mozConnection?: NetworkInformation;
    readonly webkitConnection?: NetworkInformation;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  interface IDBFactoryWithDatabases extends IDBFactory {
    databases(): Promise<Array<{ name: string; version: number }>>;
  }

  interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
    readonly webkitCompassHeading?: number;
  }

  interface DeviceOrientationEventStatic {
    new(type: string, eventInitDict?: DeviceOrientationEventInit): DeviceOrientationEvent;
    prototype: DeviceOrientationEvent;
    requestPermission?: () => Promise<"granted" | "denied">;
  }

  interface WebkitAudioContext extends AudioContext {}

  interface Window {
    __REACT_ROOT__?: import("react-dom/client").Root;
    webkitAudioContext?: typeof AudioContext;
  }
}

export {};

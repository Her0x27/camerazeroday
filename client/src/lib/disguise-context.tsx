import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export type GestureType = 'quickTaps' | 'patternUnlock';

interface DisguiseSettings {
  enabled: boolean;
  gestureType: GestureType;
  autoLockMinutes: number;
  secretPattern: string;
}

interface DisguiseContextType {
  settings: DisguiseSettings;
  isDisguised: boolean;
  showCamera: () => void;
  hideCamera: () => void;
  toggleDisguise: () => void;
  updateSettings: (updates: Partial<DisguiseSettings>) => void;
  resetInactivityTimer: () => void;
}

const DisguiseContext = createContext<DisguiseContextType | null>(null);

const STORAGE_KEY = "camera-zeroday-disguise";
const FAVICON_CAMERA = "/favicon.svg";
const FAVICON_GAME = "/game-icon.svg";

const defaultSettings: DisguiseSettings = {
  enabled: false,
  gestureType: 'quickTaps',
  autoLockMinutes: 1,
  secretPattern: '',
};

// Check if disguise mode is forced by environment variable
const isDisguiseModeForced = import.meta.env.VITE_DISGUISE_MODE === 'true';

function loadSettings(): DisguiseSettings {
  // If disguise mode is forced by env var, always enable it
  if (isDisguiseModeForced) {
    return { ...defaultSettings, enabled: true };
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch {
  }
  return defaultSettings;
}

function saveSettings(settings: DisguiseSettings): void {
  // Don't save if disguise mode is forced by env var
  if (isDisguiseModeForced) {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}

function updateFavicon(isDisguised: boolean): void {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = isDisguised ? FAVICON_GAME : FAVICON_CAMERA;
  }
}

function updateTitle(isDisguised: boolean): void {
  document.title = isDisguised ? "2048" : "Camera ZeroDay";
}

export function DisguiseProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DisguiseSettings>(loadSettings);
  const [isDisguised, setIsDisguised] = useState(() => {
    const saved = loadSettings();
    return saved.enabled;
  });
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const showCamera = useCallback(() => {
    setIsDisguised(false);
    updateFavicon(false);
    updateTitle(false);
  }, []);
  
  const hideCamera = useCallback(() => {
    if (!settings.enabled) return;
    setIsDisguised(true);
    updateFavicon(true);
    updateTitle(true);
  }, [settings.enabled]);
  
  const toggleDisguise = useCallback(() => {
    setIsDisguised(prev => {
      const newValue = !prev;
      updateFavicon(newValue);
      updateTitle(newValue);
      return newValue;
    });
  }, []);
  
  const updateSettings = useCallback((updates: Partial<DisguiseSettings>) => {
    // Prevent disabling disguise if it's forced by env var
    if (isDisguiseModeForced && 'enabled' in updates && !updates.enabled) {
      return;
    }
    
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      
      if ('enabled' in updates) {
        if (updates.enabled) {
          setIsDisguised(true);
          updateFavicon(true);
          updateTitle(true);
        } else {
          setIsDisguised(false);
          updateFavicon(false);
          updateTitle(false);
        }
      }
      
      return newSettings;
    });
  }, []);
  
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    if (!isDisguised && settings.enabled && settings.autoLockMinutes > 0) {
      inactivityTimerRef.current = setTimeout(() => {
        hideCamera();
      }, settings.autoLockMinutes * 60 * 1000);
    }
  }, [isDisguised, settings.enabled, settings.autoLockMinutes, hideCamera]);
  
  useEffect(() => {
    if (settings.enabled) {
      updateFavicon(isDisguised);
      updateTitle(isDisguised);
    } else {
      updateFavicon(false);
      updateTitle(false);
    }
  }, [settings.enabled, isDisguised]);
  
  useEffect(() => {
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);
  
  useEffect(() => {
    const handleActivity = () => {
      if (!isDisguised) {
        resetInactivityTimer();
      }
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isDisguised, resetInactivityTimer]);
  
  return (
    <DisguiseContext.Provider
      value={{
        settings,
        isDisguised,
        showCamera,
        hideCamera,
        toggleDisguise,
        updateSettings,
        resetInactivityTimer,
      }}
    >
      {children}
    </DisguiseContext.Provider>
  );
}

export function useDisguise() {
  const context = useContext(DisguiseContext);
  if (!context) {
    throw new Error("useDisguise must be used within a DisguiseProvider");
  }
  return context;
}

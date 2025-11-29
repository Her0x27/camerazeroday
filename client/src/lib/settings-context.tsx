import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Settings, ReticleConfig } from "@shared/schema";
import { defaultSettings } from "@shared/schema";
import { getSettings, saveSettings } from "./db";

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  updateReticle: (updates: Partial<ReticleConfig>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await getSettings();
        setSettings(stored);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try {
      await saveSettings(newSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  const updateReticle = useCallback(async (updates: Partial<ReticleConfig>) => {
    const newReticle = { ...settings.reticle, ...updates };
    await updateSettings({ reticle: newReticle });
  }, [settings.reticle, updateSettings]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    try {
      await saveSettings(defaultSettings);
    } catch (error) {
      console.error("Failed to reset settings:", error);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        updateReticle,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

import { useState, useEffect, useCallback } from "react";
import { canInstallPWA, installPWA, isStandalone } from "../main";

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setCanInstall(canInstallPWA());
    setIsInstalled(isStandalone());

    const handleInstallAvailable = () => {
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener("pwaInstallAvailable", handleInstallAvailable);
    window.addEventListener("pwaInstalled", handleInstalled);

    return () => {
      window.removeEventListener("pwaInstallAvailable", handleInstallAvailable);
      window.removeEventListener("pwaInstalled", handleInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!canInstall || isInstalling) return false;
    
    setIsInstalling(true);
    try {
      const result = await installPWA();
      if (result) {
        setIsInstalled(true);
        setCanInstall(false);
      }
      return result;
    } finally {
      setIsInstalling(false);
    }
  }, [canInstall, isInstalling]);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return {
    canInstall,
    isInstalled,
    isInstalling,
    install: handleInstall,
    isIOS,
    isAndroid,
    showIOSInstructions: isIOS && !isInstalled,
  };
}

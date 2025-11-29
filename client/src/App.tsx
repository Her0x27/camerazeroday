import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/lib/settings-context";
import { I18nProvider } from "@/lib/i18n";
import { DisguiseProvider, useDisguise } from "@/lib/disguise-context";
import { SplashScreen } from "@/components/splash-screen";

import CameraPage from "@/pages/camera";
import GalleryPage from "@/pages/gallery";
import PhotoDetailPage from "@/pages/photo-detail";
import SettingsPage from "@/pages/settings";
import DisguiseGamePage from "@/pages/disguise-game";
import NotFound from "@/pages/not-found";

function DisguiseRedirect({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { settings, isDisguised } = useDisguise();
  
  useEffect(() => {
    if (settings.enabled && isDisguised && location === "/") {
      navigate("/disguise-game");
    }
  }, [settings.enabled, isDisguised, location, navigate]);
  
  return <>{children}</>;
}

function Router() {
  return (
    <DisguiseRedirect>
      <Switch>
        <Route path="/" component={CameraPage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/photo/:id" component={PhotoDetailPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/disguise-game" component={DisguiseGamePage} />
        <Route component={NotFound} />
      </Switch>
    </DisguiseRedirect>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <SettingsProvider>
            <DisguiseProvider>
              {showSplash && <SplashScreen onComplete={handleSplashComplete} duration={2800} />}
              <Router />
              <Toaster />
            </DisguiseProvider>
          </SettingsProvider>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;

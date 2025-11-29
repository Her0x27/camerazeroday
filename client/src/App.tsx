import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/lib/settings-context";
import { I18nProvider } from "@/lib/i18n";
import { DisguiseProvider, useDisguise } from "@/lib/disguise-context";
import { SplashScreen } from "@/components/splash-screen";
import { ErrorBoundary } from "@/components/error-boundary";
import { Loader2 } from "lucide-react";

const CameraPage = lazy(() => import("@/pages/camera"));
const GalleryPage = lazy(() => import("@/pages/gallery"));
const PhotoDetailPage = lazy(() => import("@/pages/photo-detail"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const DisguiseGamePage = lazy(() => import("@/pages/disguise-game"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="page-loader" />
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={CameraPage} />
          <Route path="/gallery" component={GalleryPage} />
          <Route path="/photo/:id" component={PhotoDetailPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/disguise-game" component={DisguiseGamePage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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
              <ErrorBoundary>
                {showSplash && <SplashScreen onComplete={handleSplashComplete} duration={2800} />}
                <Router />
                <Toaster />
              </ErrorBoundary>
            </DisguiseProvider>
          </SettingsProvider>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;

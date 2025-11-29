import { createRoot, Root } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker management
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('SW unregistered for development');
      });
    });
  }
}

// PWA Install prompt - store for later use
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  window.dispatchEvent(new CustomEvent('pwaInstalled'));
});

export function canInstallPWA(): boolean {
  return deferredInstallPrompt !== null;
}

export async function installPWA(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  
  if (outcome === 'accepted') {
    deferredInstallPrompt = null;
    return true;
  }
  return false;
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Store root instance on window to persist across HMR updates
declare global {
  interface Window {
    __REACT_ROOT__?: Root;
  }
}

const container = document.getElementById("root");
if (container) {
  // Reuse existing root if available (HMR case)
  if (!window.__REACT_ROOT__) {
    window.__REACT_ROOT__ = createRoot(container);
  }
  window.__REACT_ROOT__.render(<App />);
}

// Accept HMR updates
if (import.meta.hot) {
  import.meta.hot.accept();
}

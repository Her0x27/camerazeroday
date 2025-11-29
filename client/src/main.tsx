import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
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
  
  await deferredInstallPrompt.prompt();
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

const container = document.getElementById("root");
if (container) {
  if (!window.__REACT_ROOT__) {
    window.__REACT_ROOT__ = createRoot(container);
  }
  window.__REACT_ROOT__.render(<App />);
}

if (import.meta.hot) {
  import.meta.hot.accept();
}

import { useState, useEffect } from 'react';
import { logEvent } from '../api/styleApi';

const INSTALLED_KEY = 'sg_pwa_installed';

// Global shared reference so beforeinstallprompt is never lost across hook instances
let globalDeferredPrompt = typeof window !== 'undefined' ? (window.__deferredPWAInstallPrompt || null) : null;
const promptListeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.__deferredPWAInstallPrompt = e;
    promptListeners.forEach((fn) => {
      try { fn(e); } catch (_) {}
    });
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.__deferredPWAInstallPrompt = null;
    localStorage.setItem(INSTALLED_KEY, 'true');
    promptListeners.forEach((fn) => {
      try { fn(null); } catch (_) {}
    });
    logEvent('pwa_app_installed');
  });
}

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState(() => 
    globalDeferredPrompt || (typeof window !== 'undefined' ? window.__deferredPWAInstallPrompt : null)
  );
  const [isInstallable, setIsInstallable] = useState(() => !!(globalDeferredPrompt || (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt)));
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    const onPromptChange = (prompt) => {
      setInstallPromptEvent(prompt);
      setIsInstallable(!!prompt);
    };

    promptListeners.add(onPromptChange);

    // If global or window event exists, sync it
    const existing = globalDeferredPrompt || (typeof window !== 'undefined' ? window.__deferredPWAInstallPrompt : null);
    if (existing) {
      setInstallPromptEvent(existing);
      setIsInstallable(true);
    }

    return () => {
      promptListeners.delete(onPromptChange);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = installPromptEvent || globalDeferredPrompt || (typeof window !== 'undefined' ? window.__deferredPWAInstallPrompt : null);
    if (!promptEvent) {
      return 'unavailable';
    }

    try {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      globalDeferredPrompt = null;
      if (typeof window !== 'undefined') {
        window.__deferredPWAInstallPrompt = null;
      }
      setInstallPromptEvent(null);

      if (choiceResult && choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, 'true');
        logEvent('pwa_install_accepted');
        return 'accepted';
      } else {
        logEvent('pwa_install_rejected');
        return 'rejected';
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return 'error';
    }
  };

  const dismissInstall = () => {
    setIsInstallable(false);
    logEvent('pwa_install_dismissed');
  };

  const hasPrompt = !!(
    installPromptEvent ||
    globalDeferredPrompt ||
    (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt)
  );

  return {
    isInstallable,
    isInstalled,
    platform,
    promptInstall,
    dismissInstall,
    nativePromptAvailable: hasPrompt,
  };
}

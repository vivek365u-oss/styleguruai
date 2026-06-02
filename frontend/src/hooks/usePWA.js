import { useState, useEffect } from 'react';
import { logEvent } from '../api/styleApi';

const INSTALLED_KEY = 'sg_pwa_installed';

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // Already installed — never show prompt again
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone || localStorage.getItem(INSTALLED_KEY) === 'true') {
      setIsInstalled(true);
      return;
    }

    // Not installed → show prompt every login session

    // Android / Chrome: native browser install event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem(INSTALLED_KEY, 'true');
      logEvent('pwa_app_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari: show after 5 seconds every login (no native event on iOS)
    let iosTimer = null;
    if (isIOS) {
      iosTimer = setTimeout(() => setIsInstallable(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPromptEvent) {
      return 'manual'; // iOS — caller shows step-by-step guide
    }

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem(INSTALLED_KEY, 'true');
      logEvent('pwa_install_accepted');
      return 'accepted';
    } else {
      // User said "Not now" — will show again next login
      logEvent('pwa_install_rejected');
      return 'rejected';
    }
  };

  // Dismiss just hides modal for this session — shows again next login
  const dismissInstall = () => {
    setIsInstallable(false);
    logEvent('pwa_install_dismissed');
  };

  return {
    isInstallable,
    isInstalled,
    platform,
    promptInstall,
    dismissInstall,
    nativePromptAvailable: !!installPromptEvent,
  };
}

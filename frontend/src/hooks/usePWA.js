import { useState, useEffect } from 'react';
import { logEvent } from '../api/styleApi';

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

    // Already installed as PWA — don't show prompt at all
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return; // Nothing else to do
    }

    // ── Android / Chrome: listen for native browser install prompt ──
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Stop browser's own mini-bar
      setInstallPromptEvent(e);
      setIsInstallable(true); // Show our premium modal
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setIsInstalled(true);
      logEvent('pwa_app_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // ── iOS Safari: beforeinstallprompt never fires — show manual guide
    // after 4s so user has time to settle into the page first ──
    let iosTimer = null;
    if (isIOS) {
      iosTimer = setTimeout(() => {
        setIsInstallable(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  // Called when user taps "Install Now"
  const promptInstall = async () => {
    if (!installPromptEvent) {
      // iOS or browser that doesn't support native prompt
      // Return 'manual' so the modal can show iOS guide instructions
      return 'manual';
    }

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;

    setInstallPromptEvent(null);
    if (outcome === 'accepted') {
      setIsInstallable(false);
      logEvent('pwa_install_accepted');
      return 'accepted';
    } else {
      logEvent('pwa_install_rejected');
      return 'rejected';
    }
  };

  const dismissInstall = () => {
    setIsInstallable(false);
    // Don't show again for 3 days
    localStorage.setItem('sg_install_dismissed', Date.now().toString());
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

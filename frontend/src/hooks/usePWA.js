import { useState, useEffect } from 'react';
import { logEvent } from '../api/styleApi';

const DISMISSED_KEY = 'sg_install_dismissed_until';
const INSTALLED_KEY = 'sg_pwa_installed';
const DISMISS_DAYS = 7; // Show again after 7 days if user dismissed

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

    // ── Check 1: Already installed as PWA ──
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone || localStorage.getItem(INSTALLED_KEY) === 'true') {
      setIsInstalled(true);
      return;
    }

    // ── Check 2: User dismissed recently — respect their choice ──
    const dismissedUntil = parseInt(localStorage.getItem(DISMISSED_KEY) || '0');
    const wasRecentlyDismissed = Date.now() < dismissedUntil;
    if (wasRecentlyDismissed) {
      // Don't show for the remaining dismiss period
      return;
    }

    // ── Android / Chrome: Listen for native browser install prompt ──
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Stop browser's own mini-bar
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem(INSTALLED_KEY, 'true');
      localStorage.removeItem(DISMISSED_KEY);
      logEvent('pwa_app_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // ── iOS Safari: beforeinstallprompt never fires ──
    // Show manual guide after 8 seconds (let user settle into the app first)
    let iosTimer = null;
    if (isIOS) {
      iosTimer = setTimeout(() => {
        setIsInstallable(true);
      }, 8000);
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
      // iOS or unsupported browser — caller shows manual guide
      return 'manual';
    }

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;

    setInstallPromptEvent(null);
    if (outcome === 'accepted') {
      setIsInstallable(false);
      localStorage.setItem(INSTALLED_KEY, 'true');
      localStorage.removeItem(DISMISSED_KEY);
      logEvent('pwa_install_accepted');
      return 'accepted';
    } else {
      // User said "Not now" on native dialog — snooze for 7 days
      const snoozeUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISSED_KEY, snoozeUntil.toString());
      logEvent('pwa_install_rejected');
      return 'rejected';
    }
  };

  // Called when user taps ✕ on our modal (before native prompt)
  const dismissInstall = () => {
    setIsInstallable(false);
    // Snooze for 7 days — don't annoy the user on every visit
    const snoozeUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, snoozeUntil.toString());
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

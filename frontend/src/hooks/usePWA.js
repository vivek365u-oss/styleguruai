import { useState, useEffect } from 'react';
import { logEvent } from '../api/styleApi';

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // 1. Detect Platform
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');

    // 2. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        setIsInstalled(true);
    } else {
        // Aggressive: If not installed, wait 3 seconds and show the prompt modal
        // even if beforeinstallprompt hasn't fired (for manual instruction support)
        const timer = setTimeout(() => {
          setIsInstallable(true);
        }, 3000);
        return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setIsInstalled(true);
      logEvent('pwa_app_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPromptEvent) {
        // If no native event, we let the UI handle manual instructions
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
  };

  return { 
    isInstallable, 
    isInstalled, 
    platform, 
    promptInstall, 
    dismissInstall, 
    nativePromptAvailable: !!installPromptEvent 
  };
}

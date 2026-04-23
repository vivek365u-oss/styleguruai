import { useState, useEffect } from 'react';
import { logEvent } from '../api/styleApi'; // Ensure logEvent is imported correctly

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPromptEvent(e);
      // Always show custom modal if the event is fired
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt so it can be garbage collected
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setIsInstalled(true);
      // Log installation for analytics
      logEvent('pwa_app_installed');
      console.log('PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPromptEvent) return false;
    
    // Show the install modal to the user natively
    installPromptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPromptEvent.userChoice;
    
    // We no longer need the prompt. Clear it up
    setInstallPromptEvent(null);
    setIsInstallable(false);
    
    if (outcome === 'accepted') {
        logEvent('pwa_install_accepted');
        return true;
    } else {
        logEvent('pwa_install_rejected');
        return false;
    }
  };

  const dismissInstall = () => {
      setIsInstallable(false);
  };

  return { isInstallable, isInstalled, promptInstall, dismissInstall };
}

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
      // Update UI to notify the user they can add to home screen
      
      // Check if user has previously dismissed the prompt recently
      const dismissed = localStorage.getItem('sg_pwa_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        // Dismissed within last 7 days, don't show custom modal
        setIsInstallable(false);
      } else {
        setIsInstallable(true);
      }
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
        localStorage.setItem('sg_pwa_dismissed', Date.now().toString());
        return false;
    }
  };

  const dismissInstall = () => {
      setIsInstallable(false);
      // Remind later after 7 days
      localStorage.setItem('sg_pwa_dismissed', Date.now().toString());
  };

  return { isInstallable, isInstalled, promptInstall, dismissInstall };
}

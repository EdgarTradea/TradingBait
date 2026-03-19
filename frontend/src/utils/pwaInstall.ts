// PWA Installation utilities

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Update UI to notify the user they can install the PWA

  });

  // Listen for successful installation
  window.addEventListener('appinstalled', () => {

    deferredPrompt = null;
  });
}

export const isPWAInstallAvailable = (): boolean => {
  return deferredPrompt !== null;
};

export const showPWAInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error showing PWA install prompt:', error);
    return false;
  }
};

export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if running as PWA
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const getPWADisplayMode = (): string => {
  if (typeof window === 'undefined') return 'browser';
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
};
// Mobile device detection utilities

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile patterns
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && isTouchDevice);
};

export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  const isTabletScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  return isTabletUA || isTabletScreen;
};

export const isDesktop = (): boolean => {
  return !isMobile() && !isTablet();
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getScreenSize = (): { width: number; height: number } => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isLandscape = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

export const isPortrait = (): boolean => {
  return !isLandscape();
};
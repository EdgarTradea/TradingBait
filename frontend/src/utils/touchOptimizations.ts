// Touch optimization utilities for mobile devices

export const optimizeForTouch = () => {
  if (typeof document === 'undefined') return;
  
  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Improve touch responsiveness
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('touchmove', () => {}, { passive: true });
};

// Add haptic feedback for supported devices
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
};

// Smooth scrolling for mobile
export const smoothScrollTo = (element: HTMLElement | string, offset = 0) => {
  const target = typeof element === 'string' 
    ? document.querySelector(element) as HTMLElement
    : element;
    
  if (!target) return;
  
  const targetPosition = target.offsetTop - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
};

// Enhanced touch area for small buttons
export const enhanceTouchTarget = (element: HTMLElement, minSize = 44) => {
  const rect = element.getBoundingClientRect();
  if (rect.width < minSize || rect.height < minSize) {
    const padding = Math.max(0, (minSize - Math.min(rect.width, rect.height)) / 2);
    element.style.padding = `${padding}px`;
  }
};

// Prevent overscroll bounce on iOS
export const preventOverscrollBounce = () => {
  if (typeof document === 'undefined') return;
  
  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overscrollBehavior = 'none';
};

// Safe area handling for devices with notches
export const handleSafeArea = () => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // CSS custom properties for safe areas
  root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
  root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
  root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
  root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
};
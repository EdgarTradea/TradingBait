

import ReactGA from 'react-ga4';
import { mode, Mode } from 'app';

// GA4 Configuration - Your TradingBait Measurement ID
const GA_MEASUREMENT_ID = 'G-2F1PF18010';

// Initialize GA4
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      debug: mode === Mode.DEV
    });
    console.log('📊 Google Analytics 4 initialized with ID:', GA_MEASUREMENT_ID);
  } else if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.warn('⚠️ GA4 Measurement ID not configured. Please update GA_MEASUREMENT_ID in analytics.ts');
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      action,
      category,
      label,
      value
    });
  }
};

// Trading-specific event tracking
export const trackTradingEvent = {
  // Journal Events
  journalEntry: (type: 'create' | 'update' | 'delete') => {
    trackEvent(`journal_${type}`, 'trading_journal');
  },
  
  habitCompletion: (habitName: string) => {
    trackEvent('habit_completed', 'habits', habitName);
  },
  
  // Trade Events
  tradeImport: (count: number) => {
    trackEvent('trades_imported', 'trades', undefined, count);
  },
  
  tradeAnalysis: (analysisType: string) => {
    trackEvent('trade_analysis', 'analytics', analysisType);
  },
  
  // AI Coach Events
  aiCoachInteraction: (type: 'question' | 'suggestion' | 'analysis') => {
    trackEvent(`ai_coach_${type}`, 'ai_features');
  },
  
  // Subscription Events
  subscriptionEvent: (action: 'upgrade' | 'downgrade' | 'cancel' | 'trial_start') => {
    trackEvent(`subscription_${action}`, 'monetization');
  },
  
  // Performance Events
  performanceMetric: (metric: string, value: number) => {
    trackEvent('performance_metric', 'trading_performance', metric, value);
  },
  
  // Engagement Events
  featureUsage: (feature: string) => {
    trackEvent('feature_used', 'engagement', feature);
  },
  
  // Onboarding Events
  onboardingStep: (step: string) => {
    trackEvent('onboarding_step', 'user_journey', step);
  }
};

// Track user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    ReactGA.set(properties);
  }
};

// Track timing events (for performance monitoring)
export const trackTiming = (category: string, variable: string, value: number, label?: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.gtag('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
      event_label: label
    });
  }
};

// Track errors
export const trackError = (description: string, fatal: boolean = false) => {
  if (typeof window !== 'undefined') {
    ReactGA.gtag('event', 'exception', {
      description,
      fatal
    });
  }
};

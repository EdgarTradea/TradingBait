// Utility functions for handling referral tracking

/**
 * Extract referral code from URL parameters
 */
export const getReferralCodeFromURL = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  console.log('🔍 getReferralCodeFromURL:', referralCode);
  return referralCode;
};

/**
 * Store referral code in localStorage for later use during signup
 */
export const storeReferralCode = (referralCode: string): void => {
  console.log('💾 Storing referral code:', referralCode);
  localStorage.setItem('tradingbait_referral_code', referralCode);
  // Also store timestamp to handle expiration
  localStorage.setItem('tradingbait_referral_timestamp', Date.now().toString());
  console.log('✅ Referral code stored successfully');
};

/**
 * Get stored referral code from localStorage
 */
export const getStoredReferralCode = (): string | null => {
  const referralCode = localStorage.getItem('tradingbait_referral_code');
  const timestamp = localStorage.getItem('tradingbait_referral_timestamp');
  
  console.log('🔍 Retrieving stored referral code:', referralCode);
  console.log('🔍 Stored timestamp:', timestamp);
  
  // Check if referral code is expired (7 days)
  if (referralCode && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    console.log('⏰ Referral code age (ms):', age);
    console.log('⏰ Max age (ms):', maxAge);
    
    if (age > maxAge) {
      console.log('❌ Referral code expired, clearing');
      clearStoredReferralCode();
      return null;
    }
    
    console.log('✅ Referral code is valid:', referralCode);
    return referralCode;
  }
  
  console.log('❌ No valid referral code found');
  return null;
};

/**
 * Clear stored referral code from localStorage
 */
export const clearStoredReferralCode = (): void => {
  console.log('🗑️ Clearing stored referral code');
  localStorage.removeItem('tradingbait_referral_code');
  localStorage.removeItem('tradingbait_referral_timestamp');
  console.log('✅ Referral code cleared');
};

/**
 * Check if current page load has a referral code and store it
 */
export const handleReferralOnPageLoad = (): void => {
  console.log('🚀 handleReferralOnPageLoad called');
  const referralCode = getReferralCodeFromURL();
  if (referralCode) {
    storeReferralCode(referralCode);
    console.log(`✅ Referral code stored: ${referralCode}`);
  } else {
    console.log('ℹ️ No referral code in URL');
  }
};

/**
 * Get affiliate referral info for display
 */
export const getReferralInfo = (): { hasReferral: boolean; code: string | null } => {
  const code = getStoredReferralCode();
  const result = {
    hasReferral: !!code,
    code
  };
  console.log('ℹ️ getReferralInfo result:', result);
  return result;
};

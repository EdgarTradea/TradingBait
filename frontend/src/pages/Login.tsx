import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { firebaseAuth } from "app";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import brain from "brain";
import { toast } from "sonner";
import { handleReferralOnPageLoad, getStoredReferralCode, clearStoredReferralCode, getReferralInfo } from "utils/referralTracking";

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New loading state
  // Check URL parameter to determine initial mode (default to signin)
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const navigate = useNavigate();
  const referralInfo = getReferralInfo();

  // Handle referral tracking on component mount
  useEffect(() => {
    handleReferralOnPageLoad();
  }, []);

  const trackReferralSignup = async (userId: string, userEmail: string) => {
    console.log('🎯 trackReferralSignup called for:', { userId, userEmail });
    const referralCode = getStoredReferralCode();
    console.log('🔍 Retrieved referral code:', referralCode);
    
    if (referralCode) {
      try {
        console.log('📤 Calling brain.track_referral_signup with:', {
          referred_user_id: userId,
          referred_email: userEmail,
          referral_code: referralCode
        });
        
        const result = await brain.track_referral_signup({
          referred_user_id: userId,
          referred_email: userEmail,
          referral_code: referralCode
        });
        
        console.log('📥 Brain response:', result);
        console.log('📥 Response status:', result.status);
        console.log('📥 Response ok:', result.ok);
        
        if (result.ok) {
          const responseData = await result.json();
          console.log('✅ Referral signup tracked successfully:', responseData);
          clearStoredReferralCode(); // Clear after successful tracking
          console.log('🗑️ Cleared referral code after successful tracking');
        } else {
          const errorData = await result.text();
          console.error('❌ Failed to track referral signup - HTTP error:', result.status, errorData);
        }
      } catch (error) {
        console.error('❌ Exception during referral signup tracking:', error);
        // Don't fail signup if referral tracking fails
      }
    } else {
      console.log('ℹ️ No referral code found, skipping tracking');
    }
  };

  const handleRedirectAfterSignup = async (_userEmail: string) => {
    const redirectTo = searchParams.get('redirect');
    if (redirectTo) {
      navigate(`/${redirectTo}`);
    } else {
      navigate('/dashboard');
    }
  };

  const sendWelcomeEmail = async (userId: string, userEmail: string, signupMethod: string, userName?: string) => {
    try {
      const response = await brain.send_welcome_email({
        email: userEmail,
        user_id: userId,
        signup_method: signupMethod,
        user_name: userName
      });
      
      if (response.ok) {
        console.log('Welcome email sent successfully');
      } else {
        console.log('Welcome email failed but signup succeeded');
      }
    } catch (error) {
      console.error('Welcome email error:', error);
      // Don't fail signup if welcome email fails
    }
  };

  const handleAuthAction = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        // Track referral signup for new users
        await trackReferralSignup(userCredential.user.uid, email);
        // Send welcome email for new signups
        await sendWelcomeEmail(userCredential.user.uid, email, "email");
        
        // New redirection logic
        await handleRedirectAfterSignup(email);

      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        
        // Check for redirect parameter for existing users too
        const redirectTo = searchParams.get('redirect');
        if (redirectTo) {
          navigate(`/${redirectTo}`);
        } else {
          navigate("/dashboard"); // Default for existing users
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      // Only set isSubmitting to false if not redirecting to Stripe
      if (window.location.href.includes('stripe.com') === false) {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError(null);
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const user = userCredential.user;
      const metadata = user.metadata;
      
      const isNewUser = metadata.creationTime === metadata.lastSignInTime;

      if (isNewUser) {
        await trackReferralSignup(user.uid, user.email || '');
        await sendWelcomeEmail(user.uid, user.email || '', "google", user.displayName || undefined);
        await handleRedirectAfterSignup(user.email || '');
      } else {
        const redirectTo = searchParams.get('redirect');
        if (redirectTo) {
          navigate(`/${redirectTo}`);
        } else {
          navigate("/dashboard"); // Existing users go to dashboard
        }
      }
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/50 border border-gray-800 rounded-lg shadow-2xl backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            {isSignUp ? "Join TradingBait" : "Welcome Back"}
          </h1>
          <p className="text-gray-400">
            {isSignUp ? "Start your trading journey" : "Login to your command center"}
          </p>
        </div>
        
        {referralInfo.hasReferral && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-400 text-center">
              🎯 You're joining via referral code: <span className="font-mono font-semibold">{referralInfo.code}</span>
            </p>
          </div>
        )}
        
        <form onSubmit={handleAuthAction} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 text-white bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 text-white bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              placeholder="Enter your password"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700/50"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-400 bg-gray-900/50">Or continue with</span>
          </div>
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
        
        <div className="text-sm text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Join now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

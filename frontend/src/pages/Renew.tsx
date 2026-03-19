import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { useCurrentUser } from 'app';
import { CheckoutModal } from 'components/CheckoutModal';
import { TradingBaitLogo } from 'components/TradingBaitLogo';
import { LanguageToggle } from "components/LanguageToggle";
import { AnimatedTradingDashboard } from "components/AnimatedTradingDashboard";
import { AnimatedTradingChart } from "components/AnimatedTradingChart";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import brain from 'utils/brain';
import { handleReferralOnPageLoad } from "utils/referralTracking";
import { SVGProps } from 'react';

const NegativeFeatureIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default function Renew() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const closeMenu = () => setIsMenuOpen(false);

  // Handle referral tracking on homepage load
  useEffect(() => {
    console.log('🏠 Homepage loaded, checking for referral code');
    handleReferralOnPageLoad();
  }, []);

  // DO NOT REDIRECT - This is the Renew page for logged-in users.
  /*
  useEffect(() => {
    if (user && window.location.hostname === 'www.tradingbait.com') {
      console.log('🔄 Logged-in user detected, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  */

  // Compute base URL for redirects
  const baseUrl = typeof window !== 'undefined' && (window.location.hostname.endsWith('riff.new'))
    ? 'https://www.tradingbait.com'
    : (typeof window !== 'undefined' ? window.location.origin : '');

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // Open checkout modal for direct subscription (no trial)
    setIsCheckoutModalOpen(true);
  };

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleEarlyAccessSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEmail(true);
    setEmailError('');
    
    try {
      const response = await brain.early_access_signup({ email });
      const data = await response.json();
      
      if (data.success) {
        setShowThankYou(true);
        setEmail('');
        toast.success(data.message);
      } else {
        setEmailError(data.message || 'Failed to sign up for early access');
        toast.error(data.message || 'Failed to sign up for early access');
      }
    } catch (error) {
      console.error('Early access signup error:', error);
      setEmailError('Failed to sign up for early access');
      toast.error('Failed to sign up for early access');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // Function to scroll to pricing section (for landing page CTAs)
  const handleScrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to handle plan-specific checkout (for pricing section CTAs)
  const handlePlanCheckout = async (planName: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // Open modal for direct subscription
    setIsCheckoutModalOpen(true);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="h-14 w-full border-b border-gray-800 z-10 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center max-w-6xl">
          <Link to="/" className="flex items-center">
            <TradingBaitLogo variant="default" size="md" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="ml-auto hidden md:flex items-center gap-4 lg:gap-6">
            <a
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors"
              href="#faq"
            >
              {t('faq') || 'FAQ'}
            </a>
            <a
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors"
              href="#testimonials"
            >
              {t('testimonials') || 'Testimonials'}
            </a>
            <a
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors"
              href="#pricing"
            >
              {t('pricing') || 'Pricing'}
            </a>
            <Link
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors"
              to="/login"
            >
              {t('login') || 'Login'}
            </Link>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              onClick={handleSubscribe}
              disabled={isCreatingCheckout}
            >
              {isCreatingCheckout ? 'Processing...' : '🔁 Subscribe again'}
            </Button>
            <LanguageToggle />
          </nav>

          {/* Mobile Navigation */}
          <div className="ml-auto md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-gray-900 border-gray-800">
                <SheetHeader>
                  <SheetTitle className="text-left text-white">
                    <TradingBaitLogo variant="default" size="md" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <a
                    className="text-sm font-medium hover:underline underline-offset-4 transition-colors text-white py-2"
                    href="#faq"
                    onClick={closeMenu}
                  >
                    {t('faq') || 'FAQ'}
                  </a>
                  <a
                    className="text-sm font-medium hover:underline underline-offset-4 transition-colors text-white py-2"
                    href="#testimonials"
                    onClick={closeMenu}
                  >
                    {t('testimonials') || 'Testimonials'}
                  </a>
                  <a
                    className="text-sm font-medium hover:underline underline-offset-4 transition-colors text-white py-2"
                    href="#pricing"
                    onClick={closeMenu}
                  >
                    {t('pricing') || 'Pricing'}
                  </a>
                  <Link
                    className="text-sm font-medium hover:underline underline-offset-4 transition-colors text-white py-2"
                    to="/login"
                    onClick={closeMenu}
                  >
                    {t('login') || 'Login'}
                  </Link>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    onClick={() => {
                      closeMenu();
                      handleSubscribe();
                    }}
                    disabled={isCreatingCheckout}
                  >
                    {isCreatingCheckout ? 'Processing...' : '🔁 Subscribe again'}
                  </Button>
                  <div className="mt-4">
                    <LanguageToggle variant="text" />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center">
        {/* HERO SECTION - Revamped with proven conversion patterns */}
        <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black">
          {/* Animated Background Elements */}
          <div className="absolute inset-0" aria-hidden="true">
            <AnimatedTradingDashboard className="w-full h-full opacity-40" />
          </div>
          
          {/* Animated Chart Background */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20" aria-hidden="true">
            <AnimatedTradingChart height={800} color="blue" className="w-full h-full" />
          </div>
          
          {/* Main Content - Centered Layout */}
          <div className="relative z-10 w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
            {/* Perfect Center Container */}
            <div className="w-full max-w-5xl text-center space-y-6 lg:space-y-8">
              
              {/* Trust Indicators Bar - MOVED HERE FOR CORRECT FLOW */}
              <motion.div 
                className="flex items-center justify-center gap-4 lg:gap-8 text-sm text-gray-300 flex-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                  <span className="font-medium">4.9/5 Trustpilot</span>
                </div>
                <div className="h-4 w-px bg-gray-600 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">5700+</span>
                  <span>Active Traders</span>
                </div>
                <div className="h-4 w-px bg-gray-600 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">$2.1M+</span>
                  <span>Tracked P&L</span>
                </div>
              </motion.div>

              {/* Problem-Solution Headlines - Pattern from DotCom Secrets */}
              <motion.div 
                className="space-y-3 lg:space-y-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter">
                  <span className="text-white">Re-activate Your TradingBait Pro</span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Get Back to AI-Powered Consistency</span>
                </h1>
                <div className="space-y-2">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-cyan-300">
                    Ready to continue? Re-subscribe now and regain access instantly
                  </p>
                </div>
              </motion.div>

              {/* Social Proof Results - Pattern from Zendrop */}
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="grid grid-cols-3 gap-4 bg-gray-800/30 rounded-2xl p-4 lg:p-6 border border-gray-700/50 max-w-md">
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-emerald-400">73%</div>
                    <div className="text-xs lg:text-sm text-gray-400">Avg Win Rate Boost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-blue-400">2.4x</div>
                    <div className="text-xs lg:text-sm text-gray-400">Better Risk:Reward</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-purple-400">30</div>
                    <div className="text-xs lg:text-sm text-gray-400">Days to Results</div>
                  </div>
                </div>
              </motion.div>

              {/* Multiple CTAs - Pattern from all sites */}
              <motion.div 
                className="flex flex-col gap-3 lg:gap-4 items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 lg:px-12 py-4 lg:py-6 text-lg lg:text-xl font-bold w-full sm:w-auto shadow-2xl max-w-md"
                  onClick={handleSubscribe}
                  disabled={isCreatingCheckout}
                  aria-label="Subscribe again"
                >
                  {isCreatingCheckout ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      🔁 Subscribe again
                    </>
                  )}
                </Button>

                {/* Re-subscription benefits */}
                <div className="space-y-1 lg:space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm lg:text-base">
                    ✓ <span>Instant access to all Pro features</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm lg:text-base">
                    ✓ <span>Keep your data, insights, and settings</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* SOCIAL PROOF SECTION - Pattern from all reference sites */}
        <section id="testimonials" className="w-full py-12 md:py-16 bg-gray-900">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Join Thousands of Successful Traders
              </h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                See real results from real traders who transformed their performance with TradingBait
              </p>
            </motion.div>

            {/* Enhanced Testimonials with Specifics - Pattern from GetHookd */}
            <div className="relative">
              {/* Horizontal Scrolling Container */}
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-6 lg:gap-8 w-max">
                  <motion.div
                    className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-80 flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&auto=format&q=80" 
                        alt="Marcus Thompson" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                      />
                      <div>
                        <div className="text-white font-semibold">Marcus Thompson</div>
                        <div className="text-gray-400 text-sm">Forex Trader • London</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-gray-300 text-sm leading-relaxed italic">
                      "Increased my monthly profit by 89% in just 6 weeks. The AI insights caught patterns I never noticed - specifically my tendency to overtrade on Fridays. Game changer."
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">+89% Profit</Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">6 Weeks</Badge>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-80 flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108755-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&auto=format&q=80" 
                        alt="Sarah Chen" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30"
                      />
                      <div>
                        <div className="text-white font-semibold">Sarah Chen</div>
                        <div className="text-gray-400 text-sm">Day Trader • Singapore</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-gray-300 text-sm leading-relaxed italic">
                      "Went from 45% to 78% win rate using the habit tracking. The psychology insights are incredible - it helped me identify emotional trading triggers I didn't even know I had."
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">45% → 78%</Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Psychology</Badge>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-80 flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1472099645785-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&auto=format&q=80" 
                        alt="David Rodriguez" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30"
                      />
                      <div>
                        <div className="text-white font-semibold">David Rodriguez</div>
                        <div className="text-gray-400 text-sm">Prop Trader • New York</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-gray-300 text-sm leading-relaxed italic">
                      "Finally passed my prop firm evaluation after 3 failed attempts. TradingBait's risk analysis showed exactly where I was bleeding money. Worth every penny."
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Prop Funded</Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Risk Analysis</Badge>
                    </div>
                  </motion.div>

                  {/* Additional Reviews */}
                  <motion.div
                    className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-80 flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1519345182560-3f2917c478abf4ff4e?w=100&h=100&fit=crop&crop=faces&auto=format&q=80" 
                        alt="Ahmed Hassan" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
                      />
                      <div>
                        <div className="text-white font-semibold">Ahmed Hassan</div>
                        <div className="text-gray-400 text-sm">Swing Trader • Dubai</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-gray-300 text-sm leading-relaxed italic">
                      "The automated journaling is a lifesaver. I trade 6 pairs simultaneously and TradingBait tracks everything perfectly. My drawdowns decreased by 60% since I started."
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">-60% Drawdown</Badge>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Multi-Pair</Badge>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-80 flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=faces&auto=format&q=80" 
                        alt="Lisa Kim" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/30"
                      />
                      <div>
                        <div className="text-white font-semibold">Lisa Kim</div>
                        <div className="text-gray-400 text-sm">Algo Trader • Seoul</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-gray-300 text-sm leading-relaxed italic">
                      "Integrated TradingBait with my algorithmic systems. The behavioral analysis revealed my algos were missing key psychological market patterns. Profits up 120%."
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">+120% Profit</Badge>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Algo Trading</Badge>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-80 flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces&auto=format&q=80" 
                        alt="Robert Taylor" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/30"
                      />
                      <div>
                        <div className="text-white font-semibold">Robert Taylor</div>
                        <div className="text-gray-400 text-sm">Institutional Trader • London</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-gray-300 text-sm leading-relaxed italic">
                      "Coming from institutional trading, I was skeptical. But TradingBait's psychology insights are on par with $10k/month trading coaches. My sharpe ratio improved from 1.8 to 3.2."
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">1.8 → 3.2 Sharpe</Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Institutional</Badge>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Scroll Indicator */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>Scroll for more</span>
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSFORMATION SECTION - Pattern from DotCom Secrets */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-gray-950 to-black">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-block rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-4 py-2 text-sm font-medium mb-6">
                <span className="text-purple-400" aria-hidden="true">🔄</span> TRANSFORMATION JOURNEY
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter mb-6">
                <span className="text-white">From </span>
                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Struggling Trader</span>
                <br />
                <span className="text-white">To </span>
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Consistent Winner</span>
              </h2>
            </motion.div>

            {/* Before/After Journey */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Before State */}
              <motion.div
                className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-red-400 mb-2">BEFORE TradingBait</h3>
                  <p className="text-gray-400">The painful reality most traders face</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl">❌</span>
                    <span className="text-gray-300">Random trading decisions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl">❌</span>
                    <span className="text-gray-300">Emotional trading mistakes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl">❌</span>
                    <span className="text-gray-300">Inconsistent performance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl">❌</span>
                    <span className="text-gray-300">No clear improvement path</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-red-400 text-3xl font-bold">32%</div>
                  <div className="text-gray-400 text-sm">Average Win Rate</div>
                </div>
              </motion.div>

              {/* After State */}
              <motion.div
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-emerald-400 mb-2">AFTER TradingBait</h3>
                  <p className="text-gray-400">Data-driven success and consistency</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-xl">✅</span>
                    <span className="text-gray-300">Data-driven decisions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-xl">✅</span>
                    <span className="text-gray-300">Disciplined trading habits</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-xl">✅</span>
                    <span className="text-gray-300">Consistent profitability</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-xl">✅</span>
                    <span className="text-gray-300">Clear growth insights</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-emerald-400 text-3xl font-bold">73%</div>
                  <div className="text-gray-400 text-sm">Average Win Rate</div>
                </div>
              </motion.div>
            </div>

            {/* Transformation CTA */}
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-12 py-6 text-xl font-bold shadow-2xl"
                onClick={handleSubscribe}
                disabled={isCreatingCheckout}
              >
                {isCreatingCheckout ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Processing...
                  </>
                ) : (
                  '🔁 Subscribe again'
                )}
              </Button>
              <p className="text-gray-400 text-sm mt-3">Instant activation • Keep your data • Cancel anytime</p>
            </motion.div>
          </div>
        </section>

       {/* FAQ SECTION - Focused on First-Time Visitors */}
        <section id="faq" className="w-full py-16 md:py-24 bg-gray-900">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 px-4 py-2 text-sm font-medium mb-6">
                <span className="text-blue-400" aria-hidden="true">❓</span> FREQUENTLY ASKED QUESTIONS
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter mb-6">
                <span className="text-white">New to Trading Journals?</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">We've Got You Covered</span>
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Common questions from traders starting their journaling journey
              </p>
            </motion.div>

            {/* FAQ Accordion */}
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                
                {/* FAQ 1 */}
                <AccordionItem value="item-1" className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl px-8 py-4">
                  <AccordionTrigger className="text-xl font-bold text-white hover:no-underline">
                    🤔 What exactly is a trading journal and why do I need one?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 pt-4">
                    <p className="leading-relaxed mb-4">
                      A trading journal is your performance GPS. It tracks every trade, emotion, and decision to reveal patterns that make or break profitability. 95% of profitable traders use one religiously.
                    </p>
                    <div className="text-emerald-400 font-medium">✨ With TradingBait: Automatic sync + AI insights = 10x faster improvement</div>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 2 */}
                <AccordionItem value="item-2" className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl px-8 py-4">
                  <AccordionTrigger className="text-xl font-bold text-white hover:no-underline">
                    📊 How is this different from just keeping a spreadsheet?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 pt-4">
                    <p className="leading-relaxed mb-4">
                      Spreadsheets can't identify your emotional patterns or predict your next mistake. TradingBait's AI analyzes over 50+ behavioral markers to give you insights no human could spot manually.
                    </p>
                    <div className="text-emerald-400 font-medium">🤖 Smart features: Pattern recognition, bias detection, personalized coaching</div>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 4 */}
                <AccordionItem value="item-4" className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl px-8 py-4">
                  <AccordionTrigger className="text-xl font-bold text-white hover:no-underline">
                    💰 Will this actually help me make more money?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 pt-4">
                    <p className="leading-relaxed mb-4">
                      Our users see an average 73% improvement in win rate within 30 days. The AI identifies your biggest money-losing patterns and gives you specific action steps to fix them.
                    </p>
                    <div className="text-emerald-400 font-medium">📈 Proven results: $2.1M+ in tracked improvements from real traders</div>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 5 */}
                <AccordionItem value="item-5" className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl px-8 py-4">
                  <AccordionTrigger className="text-xl font-bold text-white hover:no-underline">
                    🎯 I'm new to trading - is this too advanced for me?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 pt-4">
                    <p className="leading-relaxed mb-4">
                      Perfect timing! Starting with proper journaling habits from day one gives you a massive advantage. TradingBait's beginner mode explains everything in simple terms and grows with your experience.
                    </p>
                    <div className="text-emerald-400 font-medium">🚀 Smart onboarding: Guided setup, trading education, progressive coaching</div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>

            {/* FAQ CTA */}
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-12 py-6 text-xl font-bold shadow-2xl"
                onClick={handleSubscribe}
                disabled={isCreatingCheckout}
              >
                🔁 Subscribe again
              </Button>
              <p className="text-gray-400 text-sm mt-3">Instant activation • Keep your data • Cancel anytime</p>
            </motion.div>
          </div>
        </section>

        {/* PRICING SECTION - Enhanced with Urgency */}
        <section id="pricing" className="w-full py-16 md:py-24 bg-gradient-to-br from-gray-950 to-black">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 px-4 py-2 text-sm font-medium mb-6">
                <span className="text-green-400" aria-hidden="true">💰</span> SIMPLE PRICING
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-center mb-4">
                Find Your Edge. Choose Your Plan.
              </h2>
              <p className="max-w-xl mx-auto text-center text-gray-400 mb-10">
                Unlock powerful AI insights and robust journaling tools. Your current subscription has expired—renew now to continue your journey to trading mastery.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              {/* Basic Plan */}
              <Card className="bg-gray-800/50 border-gray-700 flex flex-col">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-white">Basic</CardTitle>
                  <CardDescription className="text-gray-400">For individual traders</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <div className="my-4 text-center">
                    <span className="text-5xl font-bold text-white">20,99$</span>
                    <span className="text-gray-400">/mo</span>
                  </div>
                  <ul className="space-y-3 text-gray-300 flex-grow">
                    {[
                      { text: "Basic trade analytics", included: true },
                      { text: "Manual trade entry", included: true },
                      { text: "Basic performance reports", included: true },
                      { text: "Limited to 100 trades/month", included: true },
                      { text: "No AI insights", included: false },
                      { text: "No psychology analysis", included: false },
                      { text: "No automated habit tracking", included: false }
                    ].map((feature) => (
                      <li key={feature.text} className={`flex items-center ${!feature.included ? 'text-gray-500' : ''}`}>
                        {feature.included ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <NegativeFeatureIcon className="h-5 w-5 text-gray-500 mr-2" />
                        )}
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 mt-auto">
                  <Button 
                    className="w-full bg-gray-600 hover:bg-gray-700" 
                    onClick={() => handlePlanCheckout('Basic')}
                    disabled={isCreatingCheckout}
                  >
                    {isCreatingCheckout ? 'Processing...' : '🔁 Subscribe again'}
                  </Button>
                </div>
              </Card>

              {/* Professional Plan (Most Popular) */}
              <Card className="bg-purple-600/20 border-purple-500 ring-2 ring-purple-500 flex flex-col relative">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-white">Pro</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-gray-400 text-lg line-through">$49</span>
                      <span className="text-4xl font-bold text-white">$24.99</span>
                      <span className="text-gray-400 text-lg">/month</span>
                    </div>
                    <p className="text-green-400 font-medium">Instant activation • Cancel anytime</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Everything in Basic</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Unlimited</strong> trade imports</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Unlimited</strong> AI insights & coaching</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Advanced</strong> psychology analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Automated</strong> habit tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Priority</strong> email support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-gray-300"><strong>Weekly</strong> performance reviews</span>
                    </div>
                  </div>

                  {/* Social Proof in Pricing */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-emerald-400 font-bold text-sm mb-1">🚀 PROVEN RESULTS</div>
                      <div className="text-white text-xs">"Average user sees 73% win rate improvement within 30 days"</div>
                    </div>
                  </div>

                  {/* Main CTA */}
                  <Button 
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center"
                    onClick={() => handlePlanCheckout('Pro')}
                    disabled={isCreatingCheckout}
                  >
                    {isCreatingCheckout ? 'Processing...' : '🔁 Subscribe again'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Value Proposition Under Pricing */}
            <motion.div 
              className="text-center mt-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6">
                <div className="text-emerald-400 font-bold mb-2">💡 WHY PRO IS THE OBVIOUS CHOICE</div>
                <div className="text-white mb-4">"Most traders waste $500+ monthly on ineffective courses and coaching. Get better results for less than $25."</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-red-400 font-bold">Trading Course</div>
                    <div className="text-gray-400">$497/month</div>
                    <div className="text-red-300 text-xs">Generic advice</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold">Private Coach</div>
                    <div className="text-gray-400">$200+/hour</div>
                    <div className="text-red-300 text-xs">Limited availability</div>
                  </div>
                  <div className="text-center border-2 border-green-500/50 rounded-lg p-2">
                    <div className="text-green-400 font-bold">TradingBait Pro</div>
                    <div className="text-white font-bold">$24.99/month</div>
                    <div className="text-green-300 text-xs">24/7 AI insights</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Urgency Footer */}
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="text-orange-400 font-bold mb-2">⏰ LAUNCH PRICING ENDING SOON</div>
                <div className="text-white mb-4">Lock in 50% off the regular price forever - only for the first 1,000 users</div>
                <div className="text-gray-400 text-sm">
                  🔥 847 spots taken • 153 spots left • Price increases to $49.99 soon
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA SECTION - Pattern from all reference sites */}
        <section className="w-full py-16 md:py-24 bg-gray-900">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <motion.div 
              className="text-center space-y-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter">
                <span className="text-white">Ready to </span>
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Get Back On Track?</span>
              </h2>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Re-subscribe to TradingBait Pro and regain access to AI-powered insights, automated journaling, and performance coaching.
              </p>

              {/* Final Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto my-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">50,000+</div>
                  <div className="text-gray-400">Active Professional Traders</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">73%</div>
                  <div className="text-gray-400">Average Win Rate Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">30</div>
                  <div className="text-gray-400">Days to See Results</div>
                </div>
              </div>

              {/* Final CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-12 py-6 text-xl font-bold shadow-2xl"
                  onClick={handleSubscribe}
                  disabled={isCreatingCheckout}
                >
                  {isCreatingCheckout ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Processing...
                    </>
                  ) : (
                    '🔁 Subscribe again'
                  )}
                </Button>
              </div>

              {/* Final Benefits */}
              <div className="text-gray-400 text-sm space-y-1">
                <div>✅ Instant activation • ✅ Keep your data • ✅ Cancel anytime</div>
                <div className="text-green-400 font-medium">⚡ Get back to Pro features in seconds</div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        userEmail={user?.email || ''}
        onCheckoutStart={() => setIsCreatingCheckout(true)}
        onCheckoutComplete={() => {
          setIsCreatingCheckout(false);
          setIsCheckoutModalOpen(false);
        }}
        // Ensure direct subscription checkout flow
        includeProWaitlist={false}
        successUrl={`${baseUrl}/dashboard?subscribed=true`}
        cancelUrl={`${baseUrl}/renew`}
      />
    </div>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
    </svg>
  );
}

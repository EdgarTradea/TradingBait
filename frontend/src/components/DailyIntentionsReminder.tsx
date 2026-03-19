import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, Eye, Minimize2 } from 'lucide-react';
import brain from 'utils/brain';
import { useCurrentUser } from 'app';
import { format } from 'date-fns';

interface Props {
  className?: string;
}

export const DailyIntentionsReminder: React.FC<Props> = ({ className }) => {
  const { user } = useCurrentUser();
  const [dailyIntention, setDailyIntention] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Check if reminder should be shown based on smart timing
  useEffect(() => {
    const checkShouldShow = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayKey = `intentions-reminder-dismissed-${format(now, 'yyyy-MM-dd')}`;
      const isDismissedToday = localStorage.getItem(todayKey) === 'true';
      
      // Don't show if already dismissed today
      if (isDismissedToday) {
        setIsDismissed(true);
        return false;
      }
      
      // Show during trading hours (market typically 9:30 AM - 4 PM ET)
      // Adjusted for general trading times: 8 AM - 6 PM local time
      const isTradingHours = currentHour >= 8 && currentHour <= 18;
      
      // Show mid-day (around 11 AM - 3 PM) or after 30 minutes of inactivity
      const isMidDay = currentHour >= 11 && currentHour <= 15;
      const hasBeenInactive = Date.now() - lastActivityTime > 30 * 60 * 1000; // 30 minutes
      
      return isTradingHours && (isMidDay || hasBeenInactive);
    };

    const interval = setInterval(() => {
      if (!isDismissed && dailyIntention && checkShouldShow()) {
        setIsVisible(true);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Initial check
    if (!isDismissed && dailyIntention && checkShouldShow()) {
      // Delay initial appearance by 2 seconds to not interrupt immediate trading
      setTimeout(() => setIsVisible(true), 2000);
    }

    return () => clearInterval(interval);
  }, [dailyIntention, isDismissed, lastActivityTime]);

  // Track user activity to reset inactivity timer
  useEffect(() => {
    const resetActivityTimer = () => {
      setLastActivityTime(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });
    };
  }, []);

  // Load today's daily intention
  useEffect(() => {
    const loadTodaysIntention = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await brain.get_journal_entry_by_date({ entryDate: today });
        
        if (response.ok) {
          const data = await response.json();
          if (data.entry?.daily_intentions?.trim()) {
            setDailyIntention(data.entry.daily_intentions.trim());
          }
        }
      } catch (error) {
        console.log('No daily intention found for today (this is normal if not set)');
      }
    };

    if (user) {
      loadTodaysIntention();
    }
  }, [user]);

  const handleDismiss = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayKey = `intentions-reminder-dismissed-${today}`;
    localStorage.setItem(todayKey, 'true');
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render if no user, no intention or dismissed
  if (!user || !dailyIntention || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed top-20 right-6 z-50 max-w-sm ${className}`}
        >
          <Card className="glassmorphic-card bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="relative">
                    <Lightbulb className="h-5 w-5 text-blue-400" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm animate-pulse" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-blue-200 flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Today's Intention
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMinimize}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      >
                        <Minimize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {!isMinimized && (
                      <motion.div
                        initial={{ opacity: 1, height: 'auto' }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-sm text-gray-300 leading-relaxed mb-3">
                          {dailyIntention}
                        </p>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismiss}
                            className="h-7 px-3 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                          >
                            Got it
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

DailyIntentionsReminder.displayName = 'DailyIntentionsReminder';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, ChevronDown, ChevronUp, TrendingUp, CheckCircle, Minimize2, Maximize2, X } from 'lucide-react';
import brain from 'utils/brain';
import { WeeklyIntentionsResponse, GetJournalEntryByDateData } from 'types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Props {
  className?: string;
}

export function FloatingIntentionsWidget({ className = '' }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [weeklyIntentions, setWeeklyIntentions] = useState<any>(null);
  const [dailyIntentions, setDailyIntentions] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadIntentions = async () => {
    try {
      setLoading(true);
      
      // Load weekly intentions
      const weeklyResponse = await brain.get_current_weekly_intentions();
      if (weeklyResponse.ok) {
        const weeklyData: WeeklyIntentionsResponse = await weeklyResponse.json();
        setWeeklyIntentions(weeklyData.intentions);
      }
      
      // Load today's daily intentions
      const today = format(new Date(), 'yyyy-MM-dd');
      const dailyResponse = await brain.get_journal_entry_by_date({ entryDate: today });
      if (dailyResponse.ok) {
        const dailyData: GetJournalEntryByDateData = await dailyResponse.json();
        setDailyIntentions(dailyData.entry?.daily_intentions || '');
      }
    } catch (error) {
      console.error('Error loading intentions for widget:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntentions();
    
    // Refresh every 5 minutes to catch updates
    const interval = setInterval(loadIntentions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const hasWeeklyIntentions = weeklyIntentions?.trading_goals || weeklyIntentions?.personal_goals;

  // Don't render if no intentions and not loading
  if (!loading && !dailyIntentions && !hasWeeklyIntentions) {
    return null;
  }

  if (loading) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-40", className)}>
        <div className="bg-gray-900/95 border border-gray-700/50 backdrop-blur-sm shadow-xl rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-xs text-gray-300">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Fully collapsed state
  if (!isExpanded) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-40", className)}>
        <div 
          className="bg-gray-900/95 border border-gray-700/50 backdrop-blur-sm shadow-xl rounded-lg p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Focus</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <div className="bg-gray-900/95 border border-gray-700/50 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden max-w-xs">
        {/* Header with collapse option */}
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800/50 transition-colors border-b border-gray-700/50"
          onClick={() => setIsExpanded(false)}
        >
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-medium text-white">Focus for Today</span>
          </div>
          <X className="h-3 w-3 text-gray-400" />
        </div>

        <div className="p-3 space-y-3">
          {/* Daily Intentions - Main Focus */}
          {dailyIntentions ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-sm text-emerald-200 leading-relaxed font-medium">
                {dailyIntentions}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 italic text-center">
                No daily intentions set for today
              </p>
            </div>
          )}

          {/* Weekly Intentions Toggle */}
          {hasWeeklyIntentions && (
            <>
              <button
                onClick={() => setShowWeekly(!showWeekly)}
                className="w-full flex items-center justify-between p-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded transition-colors"
              >
                <span>{showWeekly ? 'Hide weekly intentions' : 'Show weekly intentions'}</span>
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  showWeekly && "rotate-180"
                )} />
              </button>

              {/* Weekly Intentions Content */}
              <AnimatePresence>
                {showWeekly && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-2"
                  >
                    {/* Weekly Trading Goals */}
                    {weeklyIntentions?.trading_goals && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-blue-400" />
                          <span className="text-xs font-medium text-blue-400">Trading Goals</span>
                        </div>
                        <div className="bg-gray-800/30 rounded p-2 border border-gray-700/30">
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {weeklyIntentions.trading_goals}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Weekly Personal Goals */}
                    {weeklyIntentions?.personal_goals && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-purple-400" />
                          <span className="text-xs font-medium text-purple-400">Personal Goals</span>
                        </div>
                        <div className="bg-gray-800/30 rounded p-2 border border-gray-700/30">
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {weeklyIntentions.personal_goals}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}




import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Trophy,
  Flame,
  AlertTriangle,
  Target,
  CheckCircle,
  TrendingUp,
  XCircle,
  Clock,
  Lightbulb,
  Sparkles,
  ChevronRight,
  Award,
  Heart,
  Pause
} from 'lucide-react'
import brain from 'utils/brain'
import { toast } from 'sonner'
import { useUserGuardContext } from 'app'
import { format, isToday, startOfDay, differenceInDays } from 'date-fns'

interface JournalCoachingPanelProps {
  selectedDate: Date
  habits: any[]
  habitChecked: Record<string, boolean>
  journalEntry: {
    mood?: string
    marketConditions?: string
    preMarketNotes?: string
    postMarketNotes?: string
    lessons?: string
  }
  onHabitToggle: (habitId: string) => void
  journalEntries: any[]
  trades?: any[] // Add trades for performance correlation
}

interface CoachingInsight {
  type: 'celebration' | 'warning' | 'encouragement' | 'tip' | 'pattern'
  title: string
  message: string
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  action?: {
    label: string
    handler: () => void
  }
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalEntries: number
  lastEntryDate?: string
}

interface HabitPattern {
  habitName: string
  currentStreak: number
  completionRate: number
  category: string
}

export const JournalCoachingPanel: React.FC<JournalCoachingPanelProps> = ({
  selectedDate,
  habits,
  habitChecked,
  journalEntry,
  onHabitToggle,
  journalEntries,
  trades
}) => {
  const { user } = useUserGuardContext()
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([])
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [habitPatterns, setHabitPatterns] = useState<HabitPattern[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate journal consistency and streaks
  const journalStreakData = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalEntries: 0 }
    }

    // Filter to only meaningful journal entries (with content or completed habits)
    const meaningfulEntries = journalEntries.filter(entry => {
      const hasMood = entry.mood && entry.mood.trim() !== ''
      const hasNotes = (entry.pre_market_notes && entry.pre_market_notes.trim() !== '') ||
                      (entry.post_market_notes && entry.post_market_notes.trim() !== '') ||
                      (entry.lessons_learned && entry.lessons_learned.trim() !== '')
      const hasCompletedHabits = entry.habits?.some((h: any) => h.completed) || false
      
      return hasMood || hasNotes || hasCompletedHabits
    })

    // Sort entries by date (most recent first)
    const sortedEntries = [...meaningfulEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Calculate current streak (from today backwards)
    const today = startOfDay(new Date())
    let checkDate = today
    
    // Check if there's a meaningful entry for today or selected date
    const hasEntryForToday = sortedEntries.some(entry => 
      differenceInDays(startOfDay(new Date(entry.date)), today) === 0
    )
    
    if (hasEntryForToday || (isToday(selectedDate) && journalEntry && (
      (journalEntry.mood && journalEntry.mood.trim() !== '') ||
      (journalEntry.preMarketNotes && journalEntry.preMarketNotes.trim() !== '') ||
      (journalEntry.postMarketNotes && journalEntry.postMarketNotes.trim() !== '') ||
      (journalEntry.lessons && journalEntry.lessons.trim() !== '') ||
      Object.values(habitChecked).some(checked => checked)
    ))) {
      currentStreak = 1
      
      // Count consecutive days backwards
      for (let i = 1; i < 30; i++) { // Check up to 30 days back
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() - i)
        
        const hasEntry = sortedEntries.some(entry => 
          differenceInDays(startOfDay(new Date(entry.date)), startOfDay(targetDate)) === 0
        )
        
        if (hasEntry) {
          currentStreak++
        } else {
          break
        }
      }
    }
    
    // Calculate longest streak
    let previousDate: Date | null = null
    for (const entry of sortedEntries) {
      const entryDate = startOfDay(new Date(entry.date))
      
      if (!previousDate || differenceInDays(previousDate, entryDate) === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
      
      previousDate = entryDate
    }
    
    return {
      currentStreak,
      longestStreak,
      totalEntries: meaningfulEntries.length,
      lastEntryDate: sortedEntries[0]?.date
    }
  }, [journalEntries, selectedDate, journalEntry, habitChecked])

  // Calculate habit patterns and streaks
  const habitAnalysis = useMemo(() => {
    const patterns: HabitPattern[] = []
    
    habits.forEach(habit => {
      const habitName = habit.label || habit.text
      
      // Calculate completion rate from recent journal entries
      const recentEntries = journalEntries.slice(-14) // Last 14 entries
      const completionCount = recentEntries.filter(entry => 
        entry.habits?.some((h: any) => h.name === habitName && h.completed)
      ).length
      
      const completionRate = recentEntries.length > 0 ? completionCount / recentEntries.length : 0
      
      // Calculate current streak
      let currentStreak = 0
      const sortedEntries = [...journalEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      for (const entry of sortedEntries) {
        const habitInEntry = entry.habits?.find((h: any) => h.name === habitName)
        if (habitInEntry?.completed) {
          currentStreak++
        } else {
          break
        }
      }
      
      patterns.push({
        habitName,
        currentStreak,
        completionRate,
        category: habit.category
      })
    })
    
    return patterns
  }, [habits, journalEntries])

  // Calculate habit-performance correlations
  const habitPerformanceCorrelations = useMemo(() => {
    if (!trades || trades.length === 0 || !journalEntries || journalEntries.length === 0) {
      return [];
    }

    const correlations: any[] = [];
    
    habits.forEach((habit, habitIndex) => {
      const habitName = habit.label || habit.text;
      
      // Group trades by date and check if habit was completed that day
      const tradesByDate = new Map();
      
      trades.forEach(trade => {
        if (!trade.close_time) return;
        
        const tradeDate = new Date(trade.close_time).toISOString().split('T')[0];
        if (!tradesByDate.has(tradeDate)) {
          tradesByDate.set(tradeDate, []);
        }
        tradesByDate.get(tradeDate).push(trade);
      });
      
      // Calculate performance on days with/without habit
      let daysWithHabit = { totalPnl: 0, tradeCount: 0, winRate: 0, wins: 0 };
      let daysWithoutHabit = { totalPnl: 0, tradeCount: 0, winRate: 0, wins: 0 };
      
      let daysWithHabitCount = 0;
      let daysWithoutHabitCount = 0;
      
      tradesByDate.forEach((dayTrades, date) => {
        // Find journal entry for this date
        const journalEntry = journalEntries.find(entry => entry.date === date);
        const habitCompleted = journalEntry?.habits?.some((h: any) => h.name === habitName && h.completed) || false;
        
        // Calculate day's performance
        const dayPnl = dayTrades.reduce((sum: number, trade: any) => {
          const pnl = typeof trade.pnl === 'number' ? trade.pnl : 0;
          const commission = typeof trade.commission === 'number' ? trade.commission : 0;
          const swap = typeof trade.swap === 'number' ? trade.swap : 0;
          return sum + pnl + commission + swap;
        }, 0);
        
        const dayWins = dayTrades.filter((trade: any) => {
          const pnl = typeof trade.pnl === 'number' ? trade.pnl : 0;
          const commission = typeof trade.commission === 'number' ? trade.commission : 0;
          const swap = typeof trade.swap === 'number' ? trade.swap : 0;
          return (pnl + commission + swap) > 0;
        }).length;
        
        if (habitCompleted) {
          daysWithHabit.totalPnl += dayPnl;
          daysWithHabit.tradeCount += dayTrades.length;
          daysWithHabit.wins += dayWins;
          daysWithHabitCount++;
        } else {
          daysWithoutHabit.totalPnl += dayPnl;
          daysWithoutHabit.tradeCount += dayTrades.length;
          daysWithoutHabit.wins += dayWins;
          daysWithoutHabitCount++;
        }
      });
      
      // Calculate metrics
      const avgPnlWithHabit = daysWithHabit.tradeCount > 0 ? daysWithHabit.totalPnl / daysWithHabit.tradeCount : 0;
      const avgPnlWithoutHabit = daysWithoutHabit.tradeCount > 0 ? daysWithoutHabit.totalPnl / daysWithoutHabit.tradeCount : 0;
      
      const winRateWithHabit = daysWithHabit.tradeCount > 0 ? (daysWithHabit.wins / daysWithHabit.tradeCount) * 100 : 0;
      const winRateWithoutHabit = daysWithoutHabit.tradeCount > 0 ? (daysWithoutHabit.wins / daysWithoutHabit.tradeCount) * 100 : 0;
      
      // Only include if we have sufficient data
      if (daysWithHabit.tradeCount >= 3 && daysWithoutHabit.tradeCount >= 3) {
        const performanceImprovement = avgPnlWithoutHabit !== 0 ?
          ((avgPnlWithHabit - avgPnlWithoutHabit) / Math.abs(avgPnlWithoutHabit)) * 100 : 0;
        
        const correlation = {
          habitName,
          performanceImprovement: Math.round(performanceImprovement * 100) / 100,
          winRateImprovement: Math.round((winRateWithHabit - winRateWithoutHabit) * 100) / 100,
          avgPnlWith: Math.round(avgPnlWithHabit * 100) / 100,
          avgPnlWithout: Math.round(avgPnlWithoutHabit * 100) / 100,
          sampleSizeWith: daysWithHabit.tradeCount,
          sampleSizeWithout: daysWithoutHabit.tradeCount
        };
        
        correlations.push(correlation);
      }
    });
    
    const significantCorrelations = correlations.filter(corr => Math.abs(corr.performanceImprovement) > 5);
    return significantCorrelations; // Only show significant correlations
  }, [habits, trades, journalEntries]);

  // Generate contextual coaching insights
  const generateCoachingInsights = useMemo(() => {
    const insights: CoachingInsight[] = [];
    const today = isToday(selectedDate);
    
    // Journal streak celebrations and warnings
    if (journalStreakData.currentStreak >= 7) {
      insights.push({
        type: 'celebration',
        title: `Amazing ${journalStreakData.currentStreak}-day journaling streak! 🔥`,
        message: 'Your consistency is building a strong foundation for trading success. Keep this momentum going!',
        icon: <Award className="h-5 w-5 text-yellow-400" />,
        priority: 'high'
      });
    } else if (journalStreakData.currentStreak === 0 && journalStreakData.longestStreak > 0) {
      insights.push({
        type: 'encouragement',
        title: 'Get back on track with journaling',
        message: `You had a ${journalStreakData.longestStreak}-day streak before. You can do it again! Start today.`,
        icon: <Target className="h-5 w-5 text-blue-400" />,
        priority: 'medium'
      });
    }

    // Habit streak coaching with performance context
    habitAnalysis.forEach(pattern => {
      if (pattern.currentStreak >= 3) {
        // Find correlation data for this habit
        const correlation = habitPerformanceCorrelations.find(corr => corr.habitName === pattern.habitName);
        
        if (correlation && correlation.performanceImprovement > 0) {
          insights.push({
            type: 'celebration',
            title: `${pattern.habitName} streak is paying off!`,
            message: `Your ${pattern.currentStreak}-day streak with "${pattern.habitName}" correlates with ${correlation.performanceImprovement.toFixed(1)}% better performance.`,
            icon: <TrendingUp className="h-5 w-5 text-green-400" />,
            priority: 'high'
          });
        }
      } else if (pattern.completionRate < 50 && pattern.totalDays > 7) {
        const correlation = habitPerformanceCorrelations.find(corr => corr.habitName === pattern.habitName);
        
        if (correlation && correlation.performanceImprovement > 10) {
          insights.push({
            type: 'warning',
            title: `Missing out on a performance booster`,
            message: `"${pattern.habitName}" shows ${correlation.performanceImprovement.toFixed(1)}% performance improvement when completed, but you're only doing it ${pattern.completionRate.toFixed(0)}% of the time.`,
            icon: <AlertTriangle className="h-5 w-5 text-orange-400" />,
            priority: 'high'
          });
        } else {
          insights.push({
            type: 'encouragement',
            title: `Time to recommit to "${pattern.habitName}"`,
            message: `You've been inconsistent with this habit lately (${pattern.completionRate.toFixed(0)}% completion). Small consistent actions create big results.`,
            icon: <Target className="h-5 w-5 text-blue-400" />,
            priority: 'medium'
          });
        }
      }
    });
    
    // Top performance correlations insights (only if we have trades data)
    if (habitPerformanceCorrelations.length > 0) {
      const topCorrelations = habitPerformanceCorrelations
        .sort((a, b) => Math.abs(b.performanceImprovement) - Math.abs(a.performanceImprovement))
        .slice(0, 2);
      
      topCorrelations.forEach(correlation => {
        if (correlation.performanceImprovement > 15) {
          const currentHabit = habitAnalysis.find(h => h.habitName === correlation.habitName);
          
          if (currentHabit && currentHabit.completionRate < 80) {
            insights.push({
              type: 'insight',
              title: `"${correlation.habitName}" is your performance multiplier`,
              message: `This habit correlates with ${correlation.performanceImprovement.toFixed(1)}% better performance. Focus on consistency here for maximum impact.`,
              icon: <Brain className="h-5 w-5 text-purple-400" />,
              priority: 'high'
            });
          }
        }
      });
    }

    // Mood-based insights
    if (journalEntry.mood && today) {
      const moodInsights = {
        'confident': {
          title: 'Harness your confidence wisely',
          message: 'Confidence is great, but remember to stick to your risk management rules. Overconfidence can lead to position sizing errors.',
          icon: <Lightbulb className="h-5 w-5 text-blue-400" />
        },
        'anxious': {
          title: 'Channel your anxiety positively',
          message: 'Anxiety can be a signal to double-check your analysis and risk management. Use it as a reminder to trade smaller.',
          icon: <Heart className="h-5 w-5 text-red-400" />
        },
        'frustrated': {
          title: 'Take a step back',
          message: 'Frustration often leads to revenge trading. Consider taking a break or switching to demo trading until you feel centered.',
          icon: <Pause className="h-5 w-5 text-orange-400" />
        }
      };
      
      const moodInsight = moodInsights[journalEntry.mood];
      if (moodInsight) {
        insights.push({
          type: 'insight',
          title: moodInsight.title,
          message: moodInsight.message,
          icon: moodInsight.icon,
          priority: 'medium'
        });
      }
    }
    
    // Sort by priority and return top insights
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedInsights = insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    return sortedInsights.slice(0, 5); // Show top 5 insights
  }, [journalStreakData, habitAnalysis, habitPerformanceCorrelations, journalEntry.mood, selectedDate]);

  // Update coaching insights when generated insights change
  useEffect(() => {
    const newInsights = generateCoachingInsights;
    setCoachingInsights(newInsights);
  }, [generateCoachingInsights]);

  if (loading) {
    return (
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
            <div>
              <p className="text-purple-300">Analyzing your patterns...</p>
              <p className="text-sm text-purple-400">Generating personalized coaching insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (coachingInsights.length === 0) {
    return (
      <Card className="border-gray-500/20 bg-gray-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-gray-300">Journal Coach</p>
              <p className="text-sm text-gray-400">Keep journaling to unlock personalized insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base text-white">Journal Coach</CardTitle>
              <CardDescription className="text-xs">
                Personalized insights for {format(selectedDate, 'MMM dd')}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} />
          </Button>
        </div>

        {/* Quick Stats */}
        {isExpanded && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-orange-400">
                {journalStreakData.currentStreak}
              </div>
              <div className="text-xs text-gray-400">Day Streak</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-green-400">
                {habits.filter(h => habitChecked[h.id]).length}/{habits.length}
              </div>
              <div className="text-xs text-gray-400">Habits Today</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-blue-400">
                {journalStreakData.totalEntries}
              </div>
              <div className="text-xs text-gray-400">Total Entries</div>
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {coachingInsights.slice(0, 4).map((insight, index) => (
              <Alert 
                key={index} 
                className={`${
                  insight.type === 'celebration' ? 'border-green-500/30 bg-green-500/5' :
                  insight.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                  insight.type === 'encouragement' ? 'border-blue-500/30 bg-blue-500/5' :
                  insight.type === 'tip' ? 'border-purple-500/30 bg-purple-500/5' :
                  'border-gray-500/30 bg-gray-500/5'
                } transition-all hover:bg-opacity-80`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <AlertTitle className="text-sm font-medium text-white mb-1">
                      {insight.title}
                    </AlertTitle>
                    <AlertDescription className="text-xs text-gray-300 leading-relaxed">
                      {insight.message}
                    </AlertDescription>
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 h-7 text-xs"
                        onClick={insight.action.handler}
                      >
                        {insight.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            ))}

            {coachingInsights.length > 4 && (
              <div className="text-center">
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View {coachingInsights.length - 4} more insights
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default JournalCoachingPanel

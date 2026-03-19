import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarDays, TrendingUp, Award, Target, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import brain from "brain";
import {
  StreakResponse,
  StreakInfo,
  Achievement,
  StreakCalendarDay,
  PerformanceCorrelation
} from "types";

interface StreakDashboardProps {
  className?: string;
}

export function StreakDashboard({ className }: StreakDashboardProps) {
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadStreakData();
    loadPerformanceData();
  }, []);

  const loadStreakData = async () => {
    try {
      const response = await brain.get_streak_data({ days: 90 });
      const data = await response.json();
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
      toast.error('Failed to load streak data');
    }
  };

  const loadPerformanceData = async () => {
    try {
      const response = await brain.get_habit_performance_correlation({ days: 30 });
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streakType: string) => {
    switch (streakType) {
      case 'journal_entry': return 'text-blue-500';
      case 'pre-market': return 'text-orange-500';
      case 'during-trading': return 'text-green-500';
      case 'post-market': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'journal_entry': return <CalendarDays className="h-4 w-4" />;
      case 'pre-market': return <TrendingUp className="h-4 w-4" />;
      case 'during-trading': return <Target className="h-4 w-4" />;
      case 'post-market': return <Star className="h-4 w-4" />;
      default: return <Flame className="h-4 w-4" />;
    }
  };

  const getStreakDisplayName = (streakType: string) => {
    switch (streakType) {
      case 'journal_entry': return 'Journal Entries';
      case 'pre-market': return 'Pre-Market Habits';
      case 'during-trading': return 'Trading Discipline';
      case 'post-market': return 'Post-Market Review';
      default: return streakType;
    }
  };

  const getCalendarDayColor = (day: StreakCalendarDay & { isCurrentMonth?: boolean }) => {
    // If this day is from adjacent month, make it muted
    if (day.isCurrentMonth === false) {
      return 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600';
    }
    
    if (!day.has_journal_entry) return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    
    switch (day.streak_status) {
      case 'complete': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'partial': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'missed': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'recovery': return 'bg-blue-500 hover:bg-blue-600 text-white';
      default: return 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100';
    }
  };

  const generateCalendarGrid = () => {
    if (!streakData?.calendar_data) return [];
    
    // Get current month's info
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();
    
    // Create calendar grid (6 weeks x 7 days = 42 cells)
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    // Calculate the first date to show (might be from previous month)
    const firstCalendarDate = new Date(firstDay);
    firstCalendarDate.setDate(firstCalendarDate.getDate() - startingDayOfWeek);
    
    // Generate 42 days (6 weeks) starting from firstCalendarDate
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(firstCalendarDate);
      currentDate.setDate(firstCalendarDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Look for this date in the streak data
      const dayData = streakData.calendar_data.find(d => d.date === dateStr);
      
      // Determine if this day belongs to the current month
      const isCurrentMonth = currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear;
      
      if (dayData) {
        // We have data for this day - add the isCurrentMonth flag
        calendarDays.push({
          ...dayData,
          isCurrentMonth
        });
      } else {
        // No data available, create placeholder
        const placeholder = {
          date: dateStr,
          has_journal_entry: false,
          pre_market_completion_rate: 0,
          during_trading_completion_rate: 0,
          post_market_completion_rate: 0,
          overall_completion_rate: 0,
          streak_status: 'missed',
          isCurrentMonth // Add flag to identify if this day belongs to current month
        };
        calendarDays.push(placeholder);
      }
    }
    
    return calendarDays;
  };

  const getUnlockedAchievements = () => {
    return streakData?.achievements.filter(a => a.unlocked) || [];
  };

  const getProgressAchievements = () => {
    return streakData?.achievements.filter(a => !a.unlocked && a.progress > 0) || [];
  };

  const getUpcomingAchievements = () => {
    return streakData?.achievements.filter(a => !a.unlocked && a.progress === 0) || [];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recovery Mode Alert */}
      {streakData?.recovery_mode_active && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Recovery Mode Active: You have {streakData.recovery_days_remaining} day(s) to maintain your streak
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="streaks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="streaks">Current Streaks</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="insights">Performance</TabsTrigger>
        </TabsList>

        {/* Current Streaks Tab */}
        <TabsContent value="streaks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {streakData?.streaks.map((streak, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${getStreakColor(streak.streak_type)}`}>
                      {getStreakIcon(streak.streak_type)}
                      <CardTitle className="text-sm">{getStreakDisplayName(streak.streak_type)}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{streak.current_streak}</span>
                      <Badge variant="outline" className="text-xs">
                        Best: {streak.longest_streak}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {streak.current_streak === 1 ? 'day' : 'days'} current streak
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Total: {streak.total_completions} completions
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Habit Completion Calendar</CardTitle>
                  <CardDescription>Track your daily habit completion patterns</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  >
                    ←
                  </Button>
                  <span className="text-sm font-medium">
                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Complete (80%+)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Partial (50-80%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Missed (under 50%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-700"></div>
                    <span>No entry</span>
                  </div>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarGrid().map((day, index) => {
                    const dayNumber = new Date(day.date).getDate();
                    const isCurrentMonth = day.isCurrentMonth;
                    
                    return (
                      <div
                        key={day.date}
                        className={`
                          relative p-2 text-center cursor-pointer transition-all duration-200 rounded-md min-h-[40px] flex items-center justify-center
                          ${
                            isCurrentMonth 
                              ? 'hover:bg-accent' 
                              : 'text-muted-foreground/50 hover:bg-muted/30'
                          }
                          ${
                            day.has_journal_entry 
                              ? (isCurrentMonth ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-500/10 border border-green-500/20')
                              : day.overall_completion_rate > 0 
                              ? (isCurrentMonth ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-yellow-500/10 border border-yellow-500/20')
                              : (isCurrentMonth ? 'border border-border' : 'border border-border/30')
                          }
                        `}
                      >
                        <span className={`text-sm font-medium ${
                          isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                        }`}>
                          {dayNumber}
                        </span>
                        
                        {day.has_journal_entry && (
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            isCurrentMonth ? 'bg-green-500' : 'bg-green-500/50'
                          }`} />
                        )}
                        
                        {day.overall_completion_rate > 0 && day.overall_completion_rate < 1 && (
                          <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-full ${
                            isCurrentMonth ? 'bg-yellow-500' : 'bg-yellow-500/50'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Unlocked Achievements */}
          {getUnlockedAchievements().length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Unlocked Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getUnlockedAchievements().map((achievement) => (
                  <Card key={achievement.id} className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{achievement.badge_icon}</span>
                          <div>
                            <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">{achievement.title}</h4>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">{achievement.description}</p>
                          </div>
                        </div>
                        {achievement.unlocked_date && (
                          <p className="text-xs text-muted-foreground">
                            Unlocked: {new Date(achievement.unlocked_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Progress Achievements */}
          {getProgressAchievements().length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                In Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getProgressAchievements().map((achievement) => (
                  <Card key={achievement.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl grayscale">{achievement.badge_icon}</span>
                          <div>
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.threshold}</span>
                          </div>
                          <Progress value={(achievement.progress / achievement.threshold) * 100} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Achievements */}
          {getUpcomingAchievements().length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-500" />
                Upcoming Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getUpcomingAchievements().map((achievement) => (
                  <Card key={achievement.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl grayscale">{achievement.badge_icon}</span>
                          <div>
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Goal: {achievement.threshold} {achievement.category === 'streak' ? 'consecutive days' : 'completions'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Performance Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit-Performance Correlation</CardTitle>
              <CardDescription>
                Understanding how your habits impact your trading performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <div className="space-y-4">
                  {performanceData.map((correlation, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{correlation.habit_name}</h4>
                          <Badge variant={correlation.confidence_level === 'high' ? 'default' : 'secondary'}>
                            {correlation.confidence_level} confidence
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Completion Rate</p>
                            <p className="font-medium">{Math.round(correlation.completion_rate * 100)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Performance Impact</p>
                            <p className="font-medium">
                              {correlation.performance_correlation > 0 ? '+' : ''}
                              {Math.round(correlation.performance_correlation * 100)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sample Size</p>
                            <p className="font-medium">{correlation.sample_size} days</p>
                          </div>
                        </div>
                        <Progress value={correlation.completion_rate * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Not enough data yet to show correlations.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete more habits to see how they impact your performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}










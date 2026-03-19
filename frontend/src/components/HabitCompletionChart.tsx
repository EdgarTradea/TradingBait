import React, { useMemo, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import brain from 'utils/brain';
import { EquityCurveChart } from './EquityCurveChart';
import { useStore } from 'utils/store';

interface Props {
  className?: string;
  showTrend?: boolean;
  isLoading?: boolean;
}

interface DailyHabitData {
  date: string;
  displayDate: string;
  completionPercentage: number;
  totalHabits: number;
  completedHabits: number;
  tradingPnl?: number; // Add trading performance data
  cumulativePnl?: number;
}

type TimeFilter = '30' | '60' | '90' | 'all';
type DisplayMode = 'habits-only' | 'background-equity' | 'separate-charts';

export function HabitCompletionChart({ className, showTrend = true, isLoading = false }: Props) {
  const [habitData, setHabitData] = useState<DailyHabitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('separate-charts');
  const [lastDataUpdate, setLastDataUpdate] = useState<string>('');
  const { trades } = useStore();

  // Fetch habit completion and trading performance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const isAllTime = timeFilter === 'all';
        const days = isAllTime ? 3650 : parseInt(timeFilter); // 10 years for all-time
        const endDate = new Date();
        const startDate = isAllTime ? new Date('2000-01-01') : subDays(endDate, days);
        
        console.log(`🔄 Fetching data for ${isAllTime ? 'all time' : days + ' days'} (filter: ${timeFilter}):`, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          timeFilter
        });
        
        // Clear existing data immediately to show loading state
        setHabitData([]);
        
        // Fetch journal entries (habits) - expand the range significantly
        const journalResponse = await brain.get_journal_entries({
          start_date: isAllTime ? '2000-01-01' : subDays(endDate, days + 30).toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          limit: isAllTime ? 9999 : Math.max(days + 30, 100)
        });
        
        const journalData = await journalResponse.json();
        console.log(`📊 Journal entries found: ${journalData.entries?.length || 0}`);

        // Fetch trading data for the same period
        let tradingData: any[] = [];
        try {
          const tradesResponse = await brain.analyze_trades({
            start_date: isAllTime ? '2000-01-01' : subDays(endDate, days + 30).toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            group_by: 'day'
          });
          const tradesResult = await tradesResponse.json();
          if (tradesResult.success && tradesResult.daily_performance) {
            tradingData = tradesResult.daily_performance;
            console.log(`💹 Trading data points found: ${tradingData.length}`);
          }
        } catch (err) {
          console.log('Trading data not available, continuing with habits only:', err);
        }
        
        if (journalData.success && journalData.entries) {
          // Create a map of trading performance by date
          const tradingMap = new Map();
          let cumulativePnl = 0;
          
          tradingData.forEach((dayData: any) => {
            cumulativePnl += dayData.pnl || 0;
            tradingMap.set(dayData.date, {
              pnl: dayData.pnl || 0,
              cumulativePnl
            });
          });
          
          // Filter journal entries to only include those within our EXACT date range
          const filteredEntries = journalData.entries.filter((entry: any) => {
            const entryDate = new Date(entry.date + 'T00:00:00');
            return entryDate >= startDate && entryDate <= endDate;
          });
          
          console.log(`📅 Filtered entries for ${isAllTime ? 'all time' : days + ' days'}: ${filteredEntries.length}`);
          
          // Convert journal entries to habit completion data with trading info
          const chartData: DailyHabitData[] = filteredEntries
            .filter((entry: any) => entry.habits && entry.habits.length > 0)
            .map((entry: any) => {
              const habits = entry.habits || [];
              const totalHabits = habits.length;
              const completedHabits = habits.filter((habit: any) => habit.completed).length;
              const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
              
              const tradingInfo = tradingMap.get(entry.date);
              
              return {
                date: entry.date,
                displayDate: format(parseISO(entry.date), 'MMM dd'),
                completionPercentage,
                totalHabits,
                completedHabits,
                tradingPnl: tradingInfo?.pnl || 0,
                cumulativePnl: tradingInfo?.cumulativePnl || 0
              };
            })
            .sort((a: DailyHabitData, b: DailyHabitData) => a.date.localeCompare(b.date));
          
          console.log(`✅ Final chart data points for ${isAllTime ? 'all time' : days + ' days'}: ${chartData.length}`);
          setHabitData(chartData);
          setLastDataUpdate(`${new Date().toLocaleTimeString()} - ${isAllTime ? 'All time' : days + ' days'}`);
        } else {
          console.log('No journal entries with habits found');
          setHabitData([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setHabitData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (habitData.length === 0) {
      return {
        averageCompletion: 0,
        trend: 'neutral',
        currentStreak: 0,
        totalDays: 0
      };
    }

    const total = habitData.reduce((sum, day) => sum + day.completionPercentage, 0);
    const averageCompletion = Math.round(total / habitData.length);

    // Calculate trend (compare recent vs earlier)
    const halfPoint = Math.floor(habitData.length / 2);
    const recentAvg = habitData.slice(halfPoint).reduce((sum, day) => sum + day.completionPercentage, 0) / (habitData.length - halfPoint);
    const earlierAvg = habitData.slice(0, halfPoint).reduce((sum, day) => sum + day.completionPercentage, 0) / halfPoint;
    
    let trend = 'neutral';
    if (recentAvg > earlierAvg + 10) trend = 'improving';
    else if (recentAvg < earlierAvg - 10) trend = 'declining';

    // Calculate current streak (consecutive days with >50% completion)
    let currentStreak = 0;
    for (let i = habitData.length - 1; i >= 0; i--) {
      if (habitData[i].completionPercentage >= 50) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      averageCompletion,
      trend,
      currentStreak,
      totalDays: habitData.length
    };
  }, [habitData]);

  if (habitData.length === 0) {
    return (
      <Card className={`glassmorphic-card bg-gray-900/80 border-gray-700/50 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-bold text-gray-100">
              <Activity className="h-5 w-5 text-emerald-400" />
              Habit Completion vs Trading Performance
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                <SelectTrigger className="w-[100px] h-8 bg-gray-800/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          {isLoading || loading ? (
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span className="text-sm text-muted-foreground">Loading data...</span>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-400">No habit tracking data available yet.</p>
              <p className="text-sm text-gray-500 mt-2">Start tracking your habits to see completion trends!</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white">{label}</p>
          <p className="text-emerald-400">
            Habits: {data.completionPercentage}%
          </p>
          <p className="text-gray-300 text-sm">
            {data.completedHabits} of {data.totalHabits} completed
          </p>
          {data.tradingPnl !== undefined && (
            <>
              <p className={`text-sm ${data.tradingPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Daily P&L: ${data.tradingPnl.toFixed(2)}
              </p>
              <p className={`text-sm ${data.cumulativePnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Cumulative: ${data.cumulativePnl.toFixed(2)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Check if we have trading data
  const hasTrading = habitData.some(d => d.tradingPnl !== undefined);

  return (
    <Card className={`glassmorphic-card bg-gray-900/80 border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-bold text-gray-100">
            <Activity className="h-5 w-5 text-emerald-400" />
            {hasTrading ? 'Habit Completion vs Trading Performance' : 'Habit Completion Trend'}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {stats.averageCompletion}% avg
              </Badge>
              {showTrend && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    stats.trend === 'improving' ? 'border-green-500/50 text-green-400' :
                    stats.trend === 'declining' ? 'border-red-500/50 text-red-400' :
                    'border-gray-500/50 text-gray-400'
                  }`}
                >
                  {stats.trend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {stats.trend === 'improving' ? 'Improving' :
                   stats.trend === 'declining' ? 'Declining' : 'Stable'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                <SelectTrigger className="w-[100px] h-8 bg-gray-800/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {stats.currentStreak > 0 && (
          <p className="text-sm text-emerald-400">
            🔥 {stats.currentStreak} day streak with 50%+ completion
          </p>
        )}
        {hasTrading && (
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              Habit Completion
            </span>
          </div>
        )}
        {/* Data status indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing {habitData.length} days of data</span>
          <span>Last updated: {lastDataUpdate || 'Loading...'}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasTrading ? (
              <ComposedChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="habits"
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ 
                    value: 'Completion %', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#9CA3AF', fontSize: '12px' }
                  }}
                />
                <YAxis 
                  yAxisId="trading"
                  orientation="right"
                  stroke="#60A5FA"
                  fontSize={12}
                  tick={{ fill: '#60A5FA' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Trading performance as background area */}
                <Area
                  yAxisId="trading"
                  type="monotone"
                  dataKey="cumulativePnl"
                  stroke="#3B82F6"
                  strokeWidth={1}
                  fill="url(#tradingGradient)"
                  fillOpacity={0.2}
                />
                {/* Habit completion as primary line */}
                <Line
                  yAxisId="habits"
                  type="monotone"
                  dataKey="completionPercentage"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="tradingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            ) : (
              <AreaChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ 
                    value: 'Completion %', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#9CA3AF', fontSize: '12px' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completionPercentage"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorGradient)"
                  fillOpacity={0.3}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Enhanced stats with trading correlation */}
        <div className={`grid ${hasTrading ? 'grid-cols-4' : 'grid-cols-3'} gap-4 mt-4 pt-4 border-t border-gray-700/50`}>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">
              {stats.totalDays}
            </div>
            <div className="text-xs text-gray-400">Days Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {stats.averageCompletion}%
            </div>
            <div className="text-xs text-gray-400">Avg Habits</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {stats.currentStreak}
            </div>
            <div className="text-xs text-gray-400">Current Streak</div>
          </div>
          {hasTrading && (
            <div className="text-center">
              <div className={`text-lg font-bold ${
                habitData[habitData.length - 1]?.cumulativePnl >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                ${habitData[habitData.length - 1]?.cumulativePnl?.toFixed(0) || '0'}
              </div>
              <div className="text-xs text-gray-400">Total P&L</div>
            </div>
          )}
        </div>

      </CardContent>

      {/* Equity Curve - Always visible with time filter sync */}
      {trades && trades.length > 0 && habitData.length > 0 && (
        <div className="mt-4">
          <EquityCurveChart 
            trades={trades} 
            showDates={true}
            height={200}
            dateRange={{
              start: habitData[0].date,
              end: habitData[habitData.length - 1].date
            }}
            showTitle={false}
            showZoomControls={false}
            className="border-t border-gray-700/50"
          />
          <div className="px-6 pb-4 text-center">
            <div className="text-xs text-gray-500">
              Equity curve synchronized with habit data ({habitData.length} days: {habitData[0]?.date} to {habitData[habitData.length - 1]?.date})
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

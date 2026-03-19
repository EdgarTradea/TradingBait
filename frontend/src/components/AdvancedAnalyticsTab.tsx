import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ReferenceLine,
  Cell,
  ComposedChart,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ZoomIn, Download, Activity, TrendingUp, Calendar, PieChart as PieChartIcon, BarChart4 } from "lucide-react";
import { Trade, Evaluation } from "utils/types";
import { calculateNetPnl, isTradeProfit } from "utils/tradingHooks";
import { format, startOfWeek } from "date-fns";

interface Props {
  trades: Trade[];
  evaluations: Evaluation[];
}

interface ChartData {
  [key: string]: any;
}

export function AdvancedAnalyticsTab({ trades = [], evaluations = [] }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("comparative");
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic color functions for profit/loss
  const getBarColor = (value: number) => {
    if (value > 0) return "url(#profitGradient)";
    if (value < 0) return "url(#lossGradient)";
    return "#6B7280";
  };

  const getLineColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return "#10B981";
      case 'down': return "#EF4444";
      default: return "#3B82F6";
    }
  };

  // Filter trades based on selected date range with error handling
  const filteredTrades = trades;

  // 1. Comparative Performance Charts - UPDATED with month names
  const monthlyPerformance = useMemo(() => {
    const monthlyData: { [key: string]: { pnl: number, trades: number } } = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.closeTime);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { pnl: 0, trades: 0 };
      }
      
      // Use total P&L (net P&L) instead of gross P&L
      monthlyData[monthKey].pnl += calculateNetPnl(trade);
      monthlyData[monthKey].trades += 1;
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ 
        month, 
        monthName: format(new Date(month + '-01'), 'MMM yyyy'), // Add readable month name
        ...data 
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTrades]);

  const winRateTrends = useMemo(() => {
    // Group by month and calculate win rate
    const monthlyWinRate: { [key: string]: { wins: number, total: number } } = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.closeTime);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!monthlyWinRate[monthKey]) {
        monthlyWinRate[monthKey] = { wins: 0, total: 0 };
      }
      
      monthlyWinRate[monthKey].total += 1;
      if (isTradeProfit(trade)) monthlyWinRate[monthKey].wins += 1;
    });
    
    return Object.entries(monthlyWinRate)
      .map(([month, data]) => ({
        month,
        monthName: format(new Date(month + '-01'), 'MMM yyyy'), // Add readable month name
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        totalTrades: data.total
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTrades]);

  const rrrTrends = useMemo(() => {
    // Group by month and calculate realized RRR (Avg Win $ / Avg Loss $)
    const monthlyRRR: { [key: string]: { winningTrades: number[], losingTrades: number[] } } = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.closeTime);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!monthlyRRR[monthKey]) {
        monthlyRRR[monthKey] = { winningTrades: [], losingTrades: [] };
      }
      
      const pnl = calculateNetPnl(trade);
      
      // Separate winning and losing trades
      if (pnl > 0) {
        monthlyRRR[monthKey].winningTrades.push(pnl);
      } else if (pnl < 0) {
        monthlyRRR[monthKey].losingTrades.push(Math.abs(pnl)); // Use absolute value for losses
      }
    });
    
    return Object.entries(monthlyRRR)
      .map(([month, data]) => {
        const avgWin = data.winningTrades.length > 0 
          ? data.winningTrades.reduce((sum, val) => sum + val, 0) / data.winningTrades.length 
          : 0;
        
        const avgLoss = data.losingTrades.length > 0 
          ? data.losingTrades.reduce((sum, val) => sum + val, 0) / data.losingTrades.length 
          : 0;
        
        // Calculate realized RRR: Average Win / Average Loss
        const realizedRRR = avgLoss > 0 ? avgWin / avgLoss : 0;
        
        return {
          month,
          monthName: format(new Date(month + '-01'), 'MMM yyyy'),
          avgRRR: realizedRRR,
          totalTrades: data.winningTrades.length + data.losingTrades.length,
          winCount: data.winningTrades.length,
          lossCount: data.losingTrades.length
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTrades]);

  // Win vs Loss Distribution
  const winLossDistribution = useMemo(() => {
    const winningTrades = filteredTrades.filter(t => isTradeProfit(t));
    const losingTrades = filteredTrades.filter(t => calculateNetPnl(t) < 0);
    
    const totalWinAmount = winningTrades.reduce((sum, t) => sum + calculateNetPnl(t), 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + calculateNetPnl(t), 0));
    
    return [
      { name: 'Wins', value: totalWinAmount, count: winningTrades.length, color: '#10B981' },
      { name: 'Losses', value: totalLossAmount, count: losingTrades.length, color: '#EF4444' }
    ];
  }, [filteredTrades]);

  // Symbol Performance Comparison
  const symbolPerformance = useMemo(() => {
    const symbolData: { [key: string]: { pnl: number, trades: number, wins: number } } = {};
    
    filteredTrades.forEach(trade => {
      if (!symbolData[trade.symbol]) {
        symbolData[trade.symbol] = { pnl: 0, trades: 0, wins: 0 };
      }
      
      symbolData[trade.symbol].pnl += calculateNetPnl(trade);
      symbolData[trade.symbol].trades += 1;
      if (isTradeProfit(trade)) symbolData[trade.symbol].wins += 1;
    });
    
    return Object.entries(symbolData)
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        avgPnl: data.trades > 0 ? data.pnl / data.trades : 0
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10); // Top 10 symbols
  }, [filteredTrades]);

  // 2. Time-based Analysis Charts with error handling
  const dayOfWeekPerformance = useMemo(() => {
    try {
      const dayData = Array(7).fill(0).map((_, i) => ({ 
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], 
        pnl: 0, 
        trades: 0 
      }));
      
      if (!filteredTrades || filteredTrades.length === 0) return dayData;
      
      filteredTrades.forEach(trade => {
        try {
          if (!trade?.closeTime) return;
          
          const date = new Date(trade.closeTime);
          if (isNaN(date.getTime())) return;
          
          const dayOfWeek = date.getDay();
          if (dayOfWeek >= 0 && dayOfWeek < 7) {
            dayData[dayOfWeek].pnl += calculateNetPnl(trade); // Use total P&L
            dayData[dayOfWeek].trades += 1;
          }
        } catch (error) {
          console.error('Error processing trade for day of week:', trade, error);
        }
      });
      
      return dayData.map(d => ({ 
        ...d, 
        avgPnl: d.trades > 0 ? d.pnl / d.trades : 0 
      }));
    } catch (error) {
      console.error('Error calculating day of week performance:', error);
      return Array(7).fill(0).map((_, i) => ({ 
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], 
        pnl: 0, 
        trades: 0,
        avgPnl: 0
      }));
    }
  }, [filteredTrades]);

  const hourlyPerformance = useMemo(() => {
    try {
      const hourData = Array(24).fill(0).map((_, i) => ({ 
        hour: i, 
        pnl: 0, 
        trades: 0 
      }));
      
      if (!filteredTrades || filteredTrades.length === 0) return hourData;
      
      filteredTrades.forEach(trade => {
        try {
          if (!trade?.closeTime) return;
          
          const date = new Date(trade.closeTime);
          if (isNaN(date.getTime())) return;
          
          const hour = date.getHours();
          if (hour >= 0 && hour < 24) {
            hourData[hour].pnl += calculateNetPnl(trade); // Use total P&L
            hourData[hour].trades += 1;
          }
        } catch (error) {
          console.error('Error processing trade for hour data:', trade, error);
        }
      });
      
      return hourData.map(d => ({ 
        ...d, 
        avgPnl: d.trades > 0 ? d.pnl / d.trades : 0,
        hourLabel: `${d.hour}:00`
      }));
    } catch (error) {
      console.error('Error calculating hour performance:', error);
      return Array(24).fill(0).map((_, i) => ({ 
        hour: i, 
        pnl: 0, 
        trades: 0,
        avgPnl: 0,
        hourLabel: `${i}:00`
      }));
    }
  }, [filteredTrades]);

  // 3. Trading Frequency vs Performance
  const frequencyVsPerformance = useMemo(() => {
    // Group by week and calculate frequency vs performance
    const weeklyData: { [key: string]: { pnl: number, trades: number } } = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.closeTime);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { pnl: 0, trades: 0 };
      }
      
      weeklyData[weekKey].pnl += calculateNetPnl(trade); // Use total P&L
      weeklyData[weekKey].trades += 1;
    });
    
    return Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        frequency: data.trades,
        performance: data.pnl,
        avgPerTrade: data.trades > 0 ? data.pnl / data.trades : 0
      }))
      .filter(d => d.frequency > 0);
  }, [filteredTrades]);

  // Risk vs Reward data for scatter plot with error handling
  const riskRewardData = useMemo(() => {
    try {
      if (!filteredTrades || filteredTrades.length === 0) {
        return [];
      }
      
      return filteredTrades.map((trade, index) => {
        const risk = Math.abs((trade.openPrice || 0) - (trade.stopLoss || (trade.openPrice || 0) * 0.95));
        const reward = calculateNetPnl(trade);
        return {
          id: index,
          risk: -risk, // Show as negative for loss potential
          reward: reward,
          symbol: trade.symbol,
          referenceReward: risk // 1:1 risk/reward line
        };
      }).filter(item => item.risk !== 0); // Filter out trades with no risk data
    } catch (error) {
      console.error('Error processing risk/reward data:', error);
      return [];
    }
  }, [filteredTrades]);

  const renderComparativeCharts = () => (
    <div className="space-y-8">
      {/* Row 1: Monthly Performance and Win/Loss Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Breakdown - UPDATED */}
        <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                Monthly Performance Breakdown
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Track your Total P&L performance across different months
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="monthName" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                    border: '1px solid rgba(55, 65, 81, 0.5)', 
                    borderRadius: '12px',
                    color: '#F9FAFB',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'pnl' ? `$${value.toFixed(2)}` : value,
                    name === 'pnl' ? 'Total P&L' : 'Trades'
                  ]}
                  labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 0, 0]}
                  className="drop-shadow-lg hover:opacity-80 transition-opacity duration-200"
                >
                  {monthlyPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution Pie Chart */}
        <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-red-500/20">
                  <PieChartIcon className="h-5 w-5 text-green-400" />
                </div>
                Win/Loss Distribution
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Visual breakdown of winning vs losing trade amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={winLossDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, count }) => `${name}: $${value.toFixed(0)} (${count} trades)`}
                >
                  {winLossDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                    border: '1px solid rgba(55, 65, 81, 0.5)', 
                    borderRadius: '12px',
                    color: '#F9FAFB',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Row 2: Symbol Performance and Time-based Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symbol Performance Comparison */}
        <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                  <BarChart4 className="h-5 w-5 text-cyan-400" />
                </div>
                Top Performing Symbols
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Compare performance across your most traded symbols
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={symbolPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="symbolProfitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="symbolLossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="symbol" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                    border: '1px solid rgba(55, 65, 81, 0.5)', 
                    borderRadius: '12px',
                    color: '#F9FAFB',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'pnl' ? `$${value.toFixed(2)}` : 
                    name === 'winRate' ? `${value.toFixed(1)}%` : value,
                    name === 'pnl' ? 'Total P&L' : 
                    name === 'winRate' ? 'Win Rate' : name
                  ]}
                  labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 0, 0]}
                  className="drop-shadow-lg hover:opacity-80 transition-opacity duration-200"
                >
                  {symbolPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? 'url(#symbolProfitGradient)' : 'url(#symbolLossGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Row 2.5: Win Rate and RRR Evolution Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Evolution */}
        <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                Win Rate Evolution
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Monitor your win rate consistency over time with trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={winRateTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="monthName" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                    border: '1px solid rgba(55, 65, 81, 0.5)', 
                    borderRadius: '12px',
                    color: '#F9FAFB',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    'Win Rate'
                  ]}
                  labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fill="url(#winRateGradient)"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5, className: 'drop-shadow-lg' }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#FFFFFF' }}
                  className="drop-shadow-lg"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RRR Evolution */}
        <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                  <Activity className="h-5 w-5 text-amber-400" />
                </div>
                Risk-to-Reward Ratio Evolution
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Track your average risk-to-reward ratio trends over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={rrrTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="rrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="monthName" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                    border: '1px solid rgba(55, 65, 81, 0.5)', 
                    borderRadius: '12px',
                    color: '#F9FAFB',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}`,
                    'Avg RRR'
                  ]}
                  labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                />
                <ReferenceLine y={1} stroke="#6B7280" strokeDasharray="3 3" label={{ value: '1:1', position: 'right', fill: '#9CA3AF' }} />
                <Area
                  type="monotone" 
                  dataKey="avgRRR" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  fill="url(#rrrGradient)"
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5, className: 'drop-shadow-lg' }}
                  activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2, fill: '#FFFFFF' }}
                  className="drop-shadow-lg"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Row 3: Trade Duration vs Risk-Reward Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Trade Duration vs Risk-Reward</CardTitle>
            <CardDescription className="text-gray-400">Chart coming soon — being rebuilt with improved data.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            🚧 This chart is under reconstruction.
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTimeBasedCharts = () => (
    <div className="space-y-6">
      {/* Hourly Performance Heatmap */}
      <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              Hourly Performance Distribution
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 px-2">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Discover your optimal trading hours with performance heatmap visualization
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={hourlyPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="hourlyProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="hourlyLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="hour" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid rgba(55, 65, 81, 0.5)', 
                  borderRadius: '12px',
                  color: '#F9FAFB',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: number, name: string) => [
                  name === 'pnl' ? `$${value.toFixed(2)}` : value,
                  name === 'pnl' ? 'Total P&L' : 'Trades'
                ]}
                labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                labelFormatter={(label) => `${label}:00 - ${Number(label) + 1}:00`}
              />
              <Bar 
                dataKey="pnl" 
                radius={[4, 4, 0, 0]}
                className="drop-shadow-lg hover:opacity-80 transition-opacity duration-200"
              >
                {hourlyPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? 'url(#hourlyProfitGradient)' : 'url(#hourlyLossGradient)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Day of Week Performance */}
      <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20">
                <Calendar className="h-5 w-5 text-orange-400" />
              </div>
              Weekly Performance Patterns
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 px-2">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Identify your most profitable trading days with weekly pattern analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dayOfWeekPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="weeklyProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="weeklyLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid rgba(55, 65, 81, 0.5)', 
                  borderRadius: '12px',
                  color: '#F9FAFB',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: number, name: string) => [
                  name === 'pnl' ? `$${value.toFixed(2)}` : value,
                  name === 'pnl' ? 'Total P&L' : 'Total Trades'
                ]}
                labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="pnl" 
                radius={[4, 4, 0, 0]}
                className="drop-shadow-lg hover:opacity-80 transition-opacity duration-200"
              >
                {dayOfWeekPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? 'url(#weeklyProfitGradient)' : 'url(#weeklyLossGradient)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderCorrelationCharts = () => (
    <div className="space-y-6">
      {/* Trading Frequency vs Performance */}
      <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
              </div>
              Trading Frequency vs Performance
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 px-2">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Analyze the relationship between how often you trade and your results
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={frequencyVsPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="correlationGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                type="number" 
                dataKey="frequency" 
                name="Trades per Week" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ 
                  value: 'Trades per Week', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' }
                }}
              />
              <YAxis 
                type="number" 
                dataKey="performance" 
                name="Weekly P&L" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                label={{ 
                  value: 'Weekly P&L ($)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid rgba(55, 65, 81, 0.5)', 
                  borderRadius: '12px',
                  color: '#F9FAFB',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: number, name: string) => [
                  name === 'performance' ? `$${value.toFixed(2)}` : value,
                  name === 'performance' ? 'Weekly P&L' : 'Trades per Week'
                ]}
                labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                labelFormatter={(label: string) => `Week: ${label}`}
                cursor={{ strokeDasharray: '3 3', stroke: '#6B7280' }}
              />
              <Scatter 
                fill="url(#correlationGradient)" 
                stroke="#06B6D4" 
                strokeWidth={2}
                r={8}
                className="drop-shadow-lg hover:opacity-80 transition-opacity duration-200"
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              <span>Trading Frequency Impact</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRiskRewardAnalysis = () => (
    <div className="space-y-6">
      {/* Risk vs Reward Analysis */}
      <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-blue-500/20">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
              </div>
              Risk vs Reward Matrix
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 px-2">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Analyze the relationship between risk taken and rewards achieved
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              data={riskRewardData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="scatterGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                type="number" 
                dataKey="risk" 
                name="Risk" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${Math.abs(value).toFixed(0)}`}
                label={{ 
                  value: 'Risk (Max Loss)', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' }
                }}
              />
              <YAxis 
                type="number" 
                dataKey="reward" 
                name="Reward" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                label={{ 
                  value: 'Reward (P&L)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid rgba(55, 65, 81, 0.5)', 
                  borderRadius: '12px',
                  color: '#F9FAFB',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === 'risk' ? 'Max Risk' : 'Actual Reward'
                ]}
                labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                cursor={{ strokeDasharray: '3 3', stroke: '#6B7280' }}
              />
              <Scatter 
                fill="url(#scatterGradient)" 
                stroke="#3B82F6" 
                strokeWidth={2}
                r={8}
                className="drop-shadow-lg hover:opacity-80 transition-opacity duration-200"
              />
              {/* Add reference lines */}
              <Line 
                type="linear" 
                dataKey="referenceReward" 
                stroke="#10B981" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                name="1:1 Risk/Reward"
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <span>Trade Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-green-500 border-dashed rounded-full"></div>
              <span>Ideal 1:1 Risk/Reward</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStatisticalInsights = () => (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-gray-900/50 border border-gray-700/50 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Statistical Insights</CardTitle>
          <CardDescription className="text-gray-400">Advanced statistical breakdowns are being rebuilt.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          🚧 This section is under reconstruction.
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Deep dive into your trading patterns and performance metrics
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 backdrop-blur-sm">
          <TabsTrigger value="comparative" className="data-[state=active]:bg-blue-600/50">Comparative</TabsTrigger>
          <TabsTrigger value="time-based" className="data-[state=active]:bg-purple-600/50">Time-based</TabsTrigger>
          <TabsTrigger value="correlation" className="data-[state=active]:bg-cyan-600/50">Correlation</TabsTrigger>
          <TabsTrigger value="statistical" className="data-[state=active]:bg-green-600/50">Statistical</TabsTrigger>
        </TabsList>

        <TabsContent value="comparative" className="space-y-4">
          {renderComparativeCharts()}
        </TabsContent>

        <TabsContent value="time-based" className="space-y-4">
          {renderTimeBasedCharts()}
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {renderCorrelationCharts()}
        </TabsContent>

        <TabsContent value="statistical" className="space-y-4">
          {renderStatisticalInsights()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

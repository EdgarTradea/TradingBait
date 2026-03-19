import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Trade } from 'utils/types';
import { AppApisAnalyticsInsightsTradeData, CalculatedMetrics } from 'types';
import { useUserGuardContext } from 'app';
import brain from 'utils/brain';
import { toast } from 'sonner';

/** Format a single trade for the AI insights API */
function formatTradeForAI(trade: Trade): AppApisAnalyticsInsightsTradeData {
  return {
    symbol: trade.symbol || 'Unknown',
    openTime: trade.openTime || new Date().toISOString(),
    closeTime: trade.closeTime || new Date().toISOString(),
    pnl: typeof trade.pnl === 'number' ? trade.pnl : 0,
    volume: (trade as any).lots || (trade as any).volume || 0,
    direction: (trade as any).direction || trade.type || 'Unknown',
    account: trade.evaluationId || null,
  };
}

/** Calculate aggregate metrics from trade list for AI context */
function calculateMetricsForAI(trades: Trade[]): CalculatedMetrics {
  const totalTrades = trades.length;
  const wins = trades.filter(t => (t.pnl || 0) > 0);
  const losses = trades.filter(t => (t.pnl || 0) < 0);
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalWinAmount = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

  // Win/loss streaks
  let currentWin = 0, maxWin = 0, currentLoss = 0, maxLoss = 0;
  trades.forEach(t => {
    if ((t.pnl || 0) > 0) { currentWin++; currentLoss = 0; maxWin = Math.max(maxWin, currentWin); }
    else if ((t.pnl || 0) < 0) { currentLoss++; currentWin = 0; maxLoss = Math.max(maxLoss, currentLoss); }
  });

  // Best day of week by net PnL
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPnl: Record<string, number> = {};
  trades.forEach(t => {
    const day = days[new Date(t.closeTime).getDay()];
    dayPnl[day] = (dayPnl[day] || 0) + (t.pnl || 0);
  });
  const bestDay = Object.keys(dayPnl).length > 0
    ? Object.keys(dayPnl).reduce((a, b) => dayPnl[a] > dayPnl[b] ? a : b)
    : 'N/A';

  // Best time of day by net PnL
  const hourPnl: Record<number, number> = {};
  trades.forEach(t => {
    const h = new Date(t.closeTime).getHours();
    hourPnl[h] = (hourPnl[h] || 0) + (t.pnl || 0);
  });
  const bestHour = Object.keys(hourPnl).length > 0
    ? Number(Object.keys(hourPnl).reduce((a, b) => hourPnl[Number(a)] > hourPnl[Number(b)] ? a : b))
    : null;
  const bestTimeOfDay = bestHour !== null ? `${bestHour}:00` : 'N/A';

  // Avg trade duration
  const durations = trades
    .filter(t => t.openTime && t.closeTime)
    .map(t => new Date(t.closeTime).getTime() - new Date(t.openTime).getTime())
    .filter(d => d > 0);
  const avgMs = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
  const avgHours = Math.floor(avgMs / 3600000);
  const avgMins = Math.floor((avgMs % 3600000) / 60000);
  const avgTradeDuration = avgMs > 0 ? `${avgHours}h ${avgMins}m` : 'N/A';

  return {
    total_trades: totalTrades,
    total_pnl: totalPnl,
    win_rate: totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0,
    profit_factor: totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99 : 0,
    avg_win: wins.length > 0 ? totalWinAmount / wins.length : 0,
    avg_loss: losses.length > 0 ? totalLossAmount / losses.length : 0,
    biggest_win_streak: maxWin,
    biggest_loss_streak: maxLoss,
    best_day_of_week: bestDay,
    best_time_of_day: bestTimeOfDay,
    avg_trade_duration: avgTradeDuration,
  };
}

interface InsightCard {
  type: 'strength' | 'pattern' | 'recommendation';
  title: string;
  insight: string;
  action: string;
}

interface AIInsightsProps {
  trades: Trade[];
  tab: 'overview' | 'risk' | 'advanced';
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'strength':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'pattern':
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
    case 'recommendation':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'strength':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'pattern':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'recommendation':
      return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
};

export const AIInsights: React.FC<AIInsightsProps> = ({ trades, tab }) => {
  const { user } = useUserGuardContext();
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [canGenerateToday, setCanGenerateToday] = useState(true);
  const [serviceAvailable, setServiceAvailable] = useState(true);

  // Check service availability and status on mount
  useEffect(() => {
    checkInsightsStatus();
  }, [user?.uid]);

  const checkInsightsStatus = async () => {
    if (!user?.uid) return;

    try {
      const response = await brain.get_insights_status({ userId: user.uid });
      const data = await response.json();
      
      setCanGenerateToday(data.can_generate_today);
      setLastUpdated(data.last_generated);
      
      // If has cached insights and can't generate today, load them
      if (!data.can_generate_today && data.has_cached_insights) {
        generateInsights(true); // Load cached
      }
    } catch (error) {
      console.error('Error checking insights status:', error);
      // Check if AI service is completely down
      if (error instanceof Error && error.message.includes('404')) {
        setServiceAvailable(false);
      }
    }
  };

  const generateInsights = async (loadCached = false) => {
    if (!user?.uid || trades.length === 0) return;

    // Show specific error for insufficient data
    if (trades.length < 5) {
      setError('Not enough data for meaningful insights');
      setInsights([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calculatedMetrics = calculateMetricsForAI(trades);
      const formattedTrades = trades.map(formatTradeForAI);

      console.log('🔍 Generating AI insights:', {
        tradesCount: trades.length,
        formattedTradesCount: formattedTrades.length,
        userId: user.uid,
        tab,
        calculatedMetrics
      });

      const response = await brain.generate_analytics_insights({
        trades: formattedTrades,
        calculated_metrics: calculatedMetrics,
        user_id: user.uid
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI insights API error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ AI insights response:', data);
      
      // Get insights for current tab
      let tabInsights: InsightCard[] = [];
      switch (tab) {
        case 'overview':
          tabInsights = data.overview_insights || [];
          break;
        case 'risk':
          tabInsights = data.risk_insights || [];
          break;
        case 'advanced':
          tabInsights = data.advanced_insights || [];
          break;
      }

      setInsights(tabInsights);
      setLastUpdated(data.generated_at);
      
      if (!loadCached) {
        setCanGenerateToday(false);
        toast.success('AI insights generated successfully!');
      }

    } catch (error: any) {
      console.error('❌ Error generating insights:', error);
      
      // Better error handling based on actual error
      if (error?.message?.includes('insufficient') || 
          (error?.message?.includes('API Error: 400') && error?.message?.includes('trades'))) {
        setError('Please filter to include more trades for better insights');
      } else if (error?.message?.includes('API Error: 503') || error?.message?.includes('service')) {
        setError('Contact support regarding AI Service down, please');
      } else if (error?.message?.includes('API Error: 500')) {
        setError('Contact support regarding AI Service down, please');
      } else {
        // For unknown errors, show generic message but log details
        console.error('🚨 Unknown AI insights error:', error);
        setError('Please filter to include more trades for better insights');
      }
      
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if service is unavailable
  if (!serviceAvailable) {
    return null;
  }

  // Don't render if no trades
  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with generate button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
          {lastUpdated && (
            <Badge variant="outline" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {new Date(lastUpdated).toLocaleDateString()}
            </Badge>
          )}
        </div>
        
        <Button
          onClick={() => generateInsights()}
          disabled={loading || !canGenerateToday}
          variant={canGenerateToday ? "default" : "outline"}
          size="sm"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : canGenerateToday ? (
            'Generate Insights'
          ) : (
            'Generated Today'
          )}
        </Button>
      </div>

      {/* Loading state - covers entire area */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights cards */}
      {!loading && !error && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className={`border ${getColorForType(insight.type)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {getIconForType(insight.type)}
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {insight.insight}
                  </p>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      💡 {insight.action}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state after successful generation */}
      {!loading && !error && insights.length === 0 && lastUpdated && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6 text-center">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No insights available for this view</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

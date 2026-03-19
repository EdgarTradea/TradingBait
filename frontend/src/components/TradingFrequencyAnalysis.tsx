import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Trade } from "utils/types";
import { isValid, parseISO, differenceInDays } from "date-fns";
import { format } from "date-fns-tz";

interface Props {
  trades: Trade[];
  timezone?: string;
}

interface TradeMetrics {
  totalTrades: number;
  tradingDays: number;
  avgTradesPerDay: number;
  maxTradesInDay: number;
  tradingFrequency: string;
  lastTradingDay: string | null;
  analysis: string;
  recentActivity?: {
    totalTrades: number;
    tradingDays: number;
    avgTradesPerDay: number;
    maxTradesInDay: number;
    period: string;
  };
}

export function TradingFrequencyAnalysis({ trades, timezone = "UTC" }: Props) {
  const tradeMetrics = useMemo((): TradeMetrics => {
    try {
      if (!trades || trades.length === 0) {
        return {
          totalTrades: 0,
          tradingDays: 0,
          avgTradesPerDay: 0,
          maxTradesInDay: 0,
          tradingFrequency: 'No data',
          lastTradingDay: null,
          analysis: 'No trading data available to analyze frequency patterns.'
        };
      }

      console.log('📊 Analyzing trading frequency for', trades.length, 'trades');

      // Filter recent trades (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTrades = trades.filter(trade => {
        try {
          const closeDate = parseISO(trade.closeTime);
          return isValid(closeDate) && closeDate >= thirtyDaysAgo;
        } catch {
          return false;
        }
      });

      console.log('📊 Found', recentTrades.length, 'recent trades (last 30 days)');

      // Group trades by date
      const tradesByDate = new Map<string, number>();
      let earliestDate: Date | null = null;
      let latestDate: Date | null = null;

      trades.forEach(trade => {
        try {
          const closeDate = parseISO(trade.closeTime);
          if (!isValid(closeDate)) return;
          
          const dateKey = format(closeDate, 'yyyy-MM-dd', { timeZone: timezone });
          tradesByDate.set(dateKey, (tradesByDate.get(dateKey) || 0) + 1);
          
          if (!earliestDate || closeDate < earliestDate) earliestDate = closeDate;
          if (!latestDate || closeDate > latestDate) latestDate = closeDate;
        } catch (error) {
          console.warn('Invalid trade date:', trade.closeTime, error);
        }
      });

      // Calculate metrics
      const tradingDays = tradesByDate.size;
      const totalTrades = trades.length;
      const avgTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
      
      // Find max trades in a single day
      const maxTradesInDay = Math.max(...Array.from(tradesByDate.values()), 0);
      
      // Determine trading frequency category
      let tradingFrequency = 'Unknown';
      if (avgTradesPerDay >= 20) tradingFrequency = 'Very High (>20/day)';
      else if (avgTradesPerDay >= 10) tradingFrequency = 'High (10-20/day)';
      else if (avgTradesPerDay >= 5) tradingFrequency = 'Moderate (5-10/day)';
      else if (avgTradesPerDay >= 2) tradingFrequency = 'Normal (2-5/day)';
      else if (avgTradesPerDay >= 1) tradingFrequency = 'Low (1-2/day)';
      else tradingFrequency = 'Very Low (<1/day)';
      
      // Last trading day
      const lastTradingDay = latestDate ? format(latestDate, 'MMM dd, yyyy', { timeZone: timezone }) : null;
      
      // Generate analysis
      let analysis = '';
      if (avgTradesPerDay > 15) {
        analysis = `Very high trading frequency detected. You're averaging ${avgTradesPerDay.toFixed(1)} trades per day, which may indicate overtrading or scalping strategy.`;
      } else if (avgTradesPerDay > 8) {
        analysis = `High trading frequency. Consider if this aligns with your strategy and risk management plan.`;
      } else if (avgTradesPerDay > 3) {
        analysis = `Moderate trading frequency. This appears to be within normal ranges for active day trading.`;
      } else {
        analysis = `Conservative trading frequency. This suggests a more selective, swing-trading approach.`;
      }

      // Recent activity analysis
      let recentActivity = undefined;
      if (recentTrades.length > 0) {
        const recentTradesByDate = new Map<string, number>();
        recentTrades.forEach(trade => {
          try {
            const closeDate = parseISO(trade.closeTime);
            if (isValid(closeDate)) {
              const dateKey = format(closeDate, 'yyyy-MM-dd', { timeZone: timezone });
              recentTradesByDate.set(dateKey, (recentTradesByDate.get(dateKey) || 0) + 1);
            }
          } catch {
            // Skip invalid dates
          }
        });

        const recentTradingDays = recentTradesByDate.size;
        const recentAvgTradesPerDay = recentTradingDays > 0 ? recentTrades.length / recentTradingDays : 0;
        const recentMaxTradesInDay = Math.max(...Array.from(recentTradesByDate.values()), 0);

        recentActivity = {
          totalTrades: recentTrades.length,
          tradingDays: recentTradingDays,
          avgTradesPerDay: Math.round(recentAvgTradesPerDay * 100) / 100,
          maxTradesInDay: recentMaxTradesInDay,
          period: "last 30 days"
        };
      }

      return {
        totalTrades,
        tradingDays,
        avgTradesPerDay: Math.round(avgTradesPerDay * 100) / 100, // Round to 2 decimal places
        maxTradesInDay,
        tradingFrequency,
        lastTradingDay,
        analysis,
        recentActivity
      };
    } catch (error) {
      console.error('Error calculating trading activity:', error);
      return {
        totalTrades: 0,
        tradingDays: 0,
        avgTradesPerDay: 0,
        maxTradesInDay: 0,
        tradingFrequency: 'unknown',
        lastTradingDay: null,
        analysis: 'Error calculating trading activity: ' + (error.message || error.toString())
      };
    }
  }, [trades, timezone]);

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5" />
          Trading Frequency Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tradeMetrics.totalTrades > 0 ? (
          <div className="space-y-4">
            {/* Overall Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{tradeMetrics.totalTrades}</div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{tradeMetrics.tradingDays}</div>
                <div className="text-sm text-muted-foreground">Trading Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{tradeMetrics.avgTradesPerDay}</div>
                <div className="text-sm text-muted-foreground">Avg Trades/Day</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{tradeMetrics.maxTradesInDay}</div>
                <div className="text-sm text-muted-foreground">Max in One Day</div>
              </div>
            </div>

            {/* Frequency Category */}
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="font-medium text-white">Trading Frequency: {tradeMetrics.tradingFrequency}</div>
              <div className="text-sm text-muted-foreground mt-1">{tradeMetrics.analysis}</div>
            </div>

            {/* Recent Activity & Warnings */}
            {tradeMetrics.recentActivity ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Recent Activity ({tradeMetrics.recentActivity.period})</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-blue-300">{tradeMetrics.recentActivity.totalTrades}</div>
                    <div className="text-xs text-muted-foreground">Recent Trades</div>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-green-300">{tradeMetrics.recentActivity.tradingDays}</div>
                    <div className="text-xs text-muted-foreground">Recent Days</div>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-purple-300">{tradeMetrics.recentActivity.avgTradesPerDay}</div>
                    <div className="text-xs text-muted-foreground">Recent Avg/Day</div>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-orange-300">{tradeMetrics.recentActivity.maxTradesInDay}</div>
                    <div className="text-xs text-muted-foreground">Recent Max/Day</div>
                  </div>
                </div>

                {/* High Frequency Warning for Recent Activity */}
                {tradeMetrics.recentActivity.avgTradesPerDay > 8 && (
                  <Alert className="border-orange-500/50 bg-orange-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>High Recent Trading Frequency</AlertTitle>
                    <AlertDescription>
                      You're averaging {tradeMetrics.recentActivity.avgTradesPerDay.toFixed(1)} trades per day over the last {tradeMetrics.recentActivity.period}.
                      Consider if this frequency aligns with your trading strategy and risk management.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Overtrading Warning */}
                {tradeMetrics.recentActivity.maxTradesInDay > 15 && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Potential Overtrading Detected</AlertTitle>
                    <AlertDescription>
                      You had {tradeMetrics.recentActivity.maxTradesInDay} trades in a single day recently.
                      This might indicate emotional trading or lack of discipline.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              /* Fallback warning logic for lifetime data */
              (() => {
                const estimatedTradingDays = Math.max(1, Math.ceil(tradeMetrics.totalTrades / 3) || 1);
                const avgTradesPerDay = tradeMetrics.totalTrades / estimatedTradingDays;
                return avgTradesPerDay > 10 ? (
                  <Alert className="border-orange-500/50 bg-orange-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>High Historical Trading Frequency</AlertTitle>
                    <AlertDescription>
                      Based on your total trades, you may be averaging {avgTradesPerDay.toFixed(1)} trades per active trading day.
                      Consider analyzing your recent trading patterns more closely.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
                    Your historical trading frequency appears reasonable. Enable recent activity tracking for more detailed insights.
                  </div>
                );
              })()
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No trading frequency data available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

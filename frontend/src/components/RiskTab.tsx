import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Trade, Evaluation } from "utils/types";
import { calculateRiskMetrics } from "utils/riskCalculations";
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Percent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  trades: Trade[];
  evaluations?: Evaluation[];
}

export function RiskTab({ trades, evaluations = [] }: Props) {
  const riskMetrics = useMemo(() => calculateRiskMetrics(trades, evaluations), [trades, evaluations]);

  const getStreakColor = (streakType: string, streak: number) => {
    if (streakType === 'winning') {
      return streak >= 5 ? 'bg-green-500' : 'bg-green-400';
    } else if (streakType === 'losing') {
      return streak >= 3 ? 'bg-red-500' : 'bg-red-400';
    }
    return 'bg-gray-400';
  };

  const getWarningIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return '📊';
      default: return '💡';
    }
  };

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStreakIcon = (streakType: string) => {
    if (streakType === 'winning') return <TrendingUp className="h-4 w-4" />;
    if (streakType === 'losing') return <TrendingDown className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Risk Warnings */}
      {riskMetrics.enhancedWarnings && riskMetrics.enhancedWarnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Alerts
          </h3>
          {riskMetrics.enhancedWarnings.map((warning, index) => (
            <Alert 
              key={warning.id || index} 
              className={`${getWarningColor(warning.level)} border text-white`}
            >
              <AlertTitle className="flex items-center gap-2">
                <span>{getWarningIcon(warning.level)}</span>
                {warning.title}
                <Badge variant="outline" className="ml-auto text-xs">
                  {Math.round(warning.confidence * 100)}% confidence
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-gray-300">{warning.message}</p>
                <p className="text-gray-400 text-sm italic">{warning.recommendation}</p>
                <div className="text-xs text-gray-500">
                  Data: {warning.dataAvailable}/{warning.dataRequired} trades needed
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Risk Dashboard */}
      {riskMetrics.riskDashboard && riskMetrics.riskDashboard.dataPoints > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Avg Risk (Dollars)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${riskMetrics.riskDashboard.avgRiskPerTrade.dollars.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Per trade average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Avg Risk (Percent)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                riskMetrics.riskDashboard.avgRiskPerTrade.percentage > 5 ? 'text-red-400' :
                riskMetrics.riskDashboard.avgRiskPerTrade.percentage > 3 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {riskMetrics.riskDashboard.avgRiskPerTrade.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Of account balance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Risk Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Over 3%:</span>
                  <span className={`font-semibold ${
                    riskMetrics.riskDashboard.riskViolations.over3Percent > 0 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {riskMetrics.riskDashboard.riskViolations.over3Percent}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Over 5%:</span>
                  <span className={`font-semibold ${
                    riskMetrics.riskDashboard.riskViolations.over5Percent > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {riskMetrics.riskDashboard.riskViolations.over5Percent}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Risk Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                riskMetrics.riskDashboard.riskTrend === 'increasing' ? 'text-red-400' :
                riskMetrics.riskDashboard.riskTrend === 'decreasing' ? 'text-green-400' : 'text-gray-400'
              }`}>
                {riskMetrics.riskDashboard.riskTrend === 'increasing' && <TrendingUp className="h-6 w-6" />}
                {riskMetrics.riskDashboard.riskTrend === 'decreasing' && <TrendingDown className="h-6 w-6" />}
                {riskMetrics.riskDashboard.riskTrend === 'stable' && <Target className="h-6 w-6" />}
                {riskMetrics.riskDashboard.riskTrend}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on recent pattern
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Key Risk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {riskMetrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {riskMetrics.sharpeRatio >= 1 ? 'Excellent' : 
               riskMetrics.sharpeRatio >= 0.5 ? 'Good' : 
               riskMetrics.sharpeRatio >= 0 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ${Math.abs(riskMetrics.maxDrawdown).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {riskMetrics.maxDrawdownPercent.toFixed(1)}% of peak
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Recovery Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {riskMetrics.recoveryPeriod}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {riskMetrics.recoveryPeriod === 1 ? 'day' : 'days'} to recover
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Current Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              riskMetrics.currentDrawdown === 0 ? 'text-green-400' : 'text-orange-400'
            }`}>
              ${Math.abs(riskMetrics.currentDrawdown).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {riskMetrics.currentDrawdown === 0 ? 'At peak' : 'From peak'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Streak Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Losing Streak</span>
              <Badge variant="destructive" className="text-white">
                {riskMetrics.maxLosingStreak} trades
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Current Streak</span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`text-white ${
                    getStreakColor(riskMetrics.streakType, riskMetrics.currentStreak)
                  }`}
                >
                  {getStreakIcon(riskMetrics.streakType)}
                  {riskMetrics.currentStreak} {riskMetrics.streakType || 'none'}
                </Badge>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Streak Progress</span>
                <span>{riskMetrics.currentStreak}/{riskMetrics.maxLosingStreak}</span>
              </div>
              <Progress 
                value={riskMetrics.maxLosingStreak > 0 ? 
                  (riskMetrics.currentStreak / riskMetrics.maxLosingStreak) * 100 : 0
                } 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Risk-Adjusted Returns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Risk-Adjusted Return</span>
              <span className="text-2xl font-bold text-white">
                {riskMetrics.riskAdjustedReturn.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profit/Max DD Ratio</span>
              <span className={`text-lg font-semibold ${
                riskMetrics.profitToMaxDrawdownRatio >= 2 ? 'text-green-400' :
                riskMetrics.profitToMaxDrawdownRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {riskMetrics.profitToMaxDrawdownRatio === Infinity ? '∞' : 
                 riskMetrics.profitToMaxDrawdownRatio.toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              {riskMetrics.profitToMaxDrawdownRatio >= 2 ? 
                'Excellent risk management' :
                riskMetrics.profitToMaxDrawdownRatio >= 1 ? 
                'Good risk control' : 
                'Consider improving risk management'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* R-Multiple Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">R-Multiple Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskMetrics.rMultipleDistribution}>
                <XAxis 
                  dataKey="range" 
                  stroke="#888888" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "white",
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'count' ? `${value} trades` : `${value.toFixed(1)}%`,
                    name === 'count' ? 'Trades' : 'Percentage'
                  ]}
                />
                <Bar dataKey="count">
                  {riskMetrics.rMultipleDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.range.includes('-') ? '#ef4444' : '#84cc16'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Win Rate by Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskMetrics.winRateByTimeframe.map((session, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {session.timeframe.split(' ')[0]} {/* Just session name */}
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.totalTrades} trades
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Progress value={session.winRate} className="h-2" />
                    </div>
                    <span className={`text-sm font-semibold min-w-[3rem] ${
                      session.winRate >= 60 ? 'text-green-400' :
                      session.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {session.winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
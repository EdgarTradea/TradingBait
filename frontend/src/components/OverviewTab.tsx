import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Trade, Evaluation } from "utils/types";
import { useBasicTradingStats, useKpis, calculateNetPnl } from "utils/tradingHooks";
import { KpiCard } from "components/KpiCard";
import { EquityCurveChart } from "components/EquityCurveChart";
import { TradingFrequencyAnalysis } from "components/TradingFrequencyAnalysis";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

// Inline replacement for the deleted OpeningTimeChart component
// Shows Net P&L grouped by hour of day, computed from trades
function OpeningTimeChartInline({ trades, timezone = "UTC" }: { trades: Trade[]; timezone?: string }) {
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, pnl: 0, trades: 0 }));
    trades.forEach((trade) => {
      try {
        const date = new Date(trade.openTime);
        if (isNaN(date.getTime())) return;
        const h = date.getHours();
        hours[h].pnl += calculateNetPnl(trade);
        hours[h].trades += 1;
      } catch {}
    });
    return hours.filter((h) => h.trades > 0).map((h) => ({
      label: `${String(h.hour).padStart(2, "0")}:00`,
      pnl: parseFloat(h.pnl.toFixed(2)),
      trades: h.trades,
    }));
  }, [trades]);

  if (!hourlyData.length) {
    return (
      <Card className="bg-card border">
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          No trade data available for time analysis.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-base">Net P&amp;L by Opening Hour</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={hourlyData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <XAxis dataKey="label" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
              formatter={(value: number, _name: string, props: any) => [
                `$${value.toFixed(2)} (${props.payload.trades} trades)`,
                "Net P&L",
              ]}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {hourlyData.map((entry, idx) => (
                <Cell key={idx} fill={entry.pnl >= 0 ? "#84cc16" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface Props {
  trades: Trade[];
  evaluations: Evaluation[];
  selectedEvaluationId?: string | null;
  timezone?: string;
}

export function OverviewTab({ trades, evaluations, selectedEvaluationId, timezone = "UTC" }: Props) {
  const basicStats = useBasicTradingStats(trades);
  const kpis = useKpis(trades, evaluations);
  
  // Calculate current balance based on evaluations with balance data
  const currentBalance = useMemo(() => {
    if (!evaluations.length) return 0;
    
    if (selectedEvaluationId) {
      // For specific evaluation, find the matching evaluation's balance by evaluation ID
      const evaluation = evaluations.find((e) => e.id === selectedEvaluationId && e.status === "active");
      return evaluation?.balance || 0;
    } else {
      // For "all" evaluations, sum up all balances from active evaluations
      return evaluations
        .filter(e => e.status === "active" && e.balance !== undefined)
        .reduce((sum, evaluation) => sum + (evaluation.balance || 0), 0);
    }
  }, [evaluations, selectedEvaluationId]);
  
  // Use unified KPIs from hook
  const extendedKpis = useMemo(() => {
    const expectancy = trades.length > 0 ? kpis.totalPnl / trades.length : 0;
    const totalLots = trades.reduce((sum, trade) => sum + (trade.lots || 0), 0);
    
    // Calculate commission breakdown
    const grossPnl = trades.reduce((sum, trade) => {
      const pnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
      return sum + pnl;
    }, 0);
    
    const totalCommissions = trades.reduce((sum, trade) => {
      const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
      return sum + commission;
    }, 0);
    
    const totalSwaps = trades.reduce((sum, trade) => {
      const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
      return sum + swap;
    }, 0);
    
    const netPnl = kpis.totalPnl; // This is already net from useKpis
    const commissionImpact = grossPnl - netPnl;
    
    return {
      ...kpis,
      expectancy,
      totalLots,
      grossPnl,
      netPnl,
      totalCommissions,
      totalSwaps,
      commissionImpact
    };
  }, [trades, kpis]);

  const pnlBySymbol = useMemo(() => {
    if (!trades.length) return [];
    const symbolMap: { [key: string]: number } = {};
    trades.forEach((trade) => {
      // Defensive programming: handle undefined/null/NaN pnl values
      const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
const netPnl = grossPnl - commission - swap;
      symbolMap[trade.symbol] = (symbolMap[trade.symbol] || 0) + netPnl;
    });
    return Object.entries(symbolMap).map(([symbol, pnl]) => ({
      name: symbol,
      pnl: typeof pnl === 'number' && !isNaN(pnl) ? pnl : 0,
    }));
  }, [trades]);

  const winLossData = useMemo(() => {
    if (!trades.length) return [];
    // Defensive programming: filter trades with valid pnl values
    const validTrades = trades.filter(t => typeof t.pnl === 'number' && !isNaN(t.pnl));
    const wins = validTrades.filter((t) => t.pnl > 0).length;
    const losses = validTrades.length - wins;
    return [
      { name: "Wins", value: wins, color: "#84cc16" },
      { name: "Losses", value: losses, color: "#ef4444" },
    ];
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total P&L" value={`$${extendedKpis.totalPnl.toFixed(2)}`} />
        <KpiCard title="Total Trades" value={extendedKpis.totalTrades.toString()} />
        <KpiCard title="Win Rate" value={`${extendedKpis.winRate.toFixed(2)}%`} />
        <KpiCard title="Profit Factor" value={extendedKpis.profitFactor.toFixed(2)} />
        <KpiCard title="Expectancy" value={`$${extendedKpis.expectancy.toFixed(2)}`} />
        <KpiCard title="Avg. Profit" value={`$${extendedKpis.avgProfit.toFixed(2)}`} />
        <KpiCard title="Avg. Loss" value={`$${extendedKpis.avgLoss.toFixed(2)}`} />
        <KpiCard title="Avg. RRR" value={extendedKpis.avgRRR.toFixed(2)} />
        <KpiCard title="Total Lots" value={extendedKpis.totalLots.toFixed(2)} />
      </div>

      {/* Equity Curve */}
      <EquityCurveChart trades={trades} showDates={true} timezone={timezone} />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="bg-card border text-card-foreground">
          <CardHeader>
            <CardTitle>Net P&L by Symbol</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pnlBySymbol}>
                <XAxis 
                  dataKey="name" 
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
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                  }}
                />
                <Bar dataKey="pnl">
                  {pnlBySymbol.map((entry, index) => {
                    // Defensive check for pnl value
                    const pnlValue = typeof entry.pnl === 'number' && !isNaN(entry.pnl) ? entry.pnl : 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={pnlValue > 0 ? "#84cc16" : "#ef4444"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800 text-white">
          <CardHeader>
            <CardTitle>Win/Loss Ratio</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Correlation Analysis */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold mb-4">Time Correlation Analysis</h3>
        <OpeningTimeChartInline trades={trades} timezone={timezone} />
      </div>

      {/* Trading Frequency Analysis */}
      <div className="mb-6 sm:mb-8">
        <TradingFrequencyAnalysis trades={trades} timezone={timezone} />
      </div>
    </div>
  );
}

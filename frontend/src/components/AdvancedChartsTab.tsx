
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { Trade, Evaluation } from "utils/types";
import { useKpis } from "utils/tradingHooks";
import { Play, RotateCcw, Sparkles } from "lucide-react";

interface Props {
  trades: Trade[];
  evaluations: Evaluation[];
  selectedEvaluationId?: string | null;
}

interface SimulationConfig {
  numSimulations: number;
  tradesPerSimulation: number;
  startingBalance: number;
  riskPerTrade: number; // percentage (1 = 1%)
  testRrr: number; // user can test different RRR scenarios
  testWinRate: number; // user can test different win rate scenarios
}

interface SimulationResult {
  id: number;
  data: { trade: number; balance: number }[];
  finalBalance: number;
  maxDrawdown: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

interface SimulationStats {
  avgPerformance: number;
  maxEquity: number;
  minEquity: number;
  maxLossStreak: number;
  maxWinStreak: number;
  finalBalanceRange: { min: number; max: number };
  confidenceInterval: { lower: number; upper: number };
}

// Monte Carlo simulation engine
function runMonteCarloSimulation(
  config: SimulationConfig,
  winRate: number,
  avgProfit: number,
  avgLoss: number
): SimulationResult[] {
  const results: SimulationResult[] = [];

  for (let sim = 0; sim < config.numSimulations; sim++) {
    const data: { trade: number; balance: number }[] = [];
    let currentBalance = config.startingBalance;
    let maxBalance = currentBalance;
    let maxDrawdown = 0;
    let winStreak = 0;
    let lossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    // Add starting point
    data.push({ trade: 0, balance: currentBalance });

    for (let trade = 1; trade <= config.tradesPerSimulation; trade++) {
      // Stop simulation if balance is too low (but don't require minimum threshold)
      if (currentBalance <= 0) {
        break;
      }

      // Calculate risk amount as percentage of current balance
      const riskAmount = currentBalance * (config.riskPerTrade / 100);
      
      // Determine if this trade is a winner based on win rate
      const isWin = Math.random() < (winRate / 100);
      
      // Calculate trade result using risk-reward ratio
      let tradeResult: number;
      if (isWin) {
        tradeResult = riskAmount * config.testRrr; // Profit = Risk × RRR
      } else {
        tradeResult = -riskAmount; // Loss = Risk × 1
      }
      
      currentBalance += tradeResult;
      
      // Ensure balance doesn't go negative (stop simulation if it would)
      if (currentBalance < 0) {
        currentBalance = 0;
      }
      
      // Track streaks
      if (isWin) {
        winStreak++;
        lossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, winStreak);
      } else {
        lossStreak++;
        winStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, lossStreak);
      }
      
      // Track max balance and drawdown
      maxBalance = Math.max(maxBalance, currentBalance);
      const drawdown = maxBalance > 0 ? ((maxBalance - currentBalance) / maxBalance) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
      
      data.push({ trade, balance: currentBalance });
    }

    results.push({
      id: sim,
      data,
      finalBalance: currentBalance,
      maxDrawdown,
      maxWinStreak,
      maxLossStreak
    });
  }

  return results;
}

// Helper function to calculate confidence intervals
function calculateConfidenceInterval(performances: number[]): { lower: number; upper: number } {
  if (performances.length === 0) {
    return { lower: 0, upper: 0 };
  }
  
  const sortedPerformances = [...performances].sort((a, b) => a - b);
  const lowerIndex = Math.floor(sortedPerformances.length * 0.05);
  const upperIndex = Math.floor(sortedPerformances.length * 0.95);
  
  return {
    lower: sortedPerformances[lowerIndex] || 0,
    upper: sortedPerformances[upperIndex] || 0
  };
}

// Calculate statistics from simulation results
function calculateSimulationStats(
  results: SimulationResult[],
  startingBalance: number
): SimulationStats {
  if (results.length === 0) {
    return {
      avgPerformance: 0,
      maxEquity: 0,
      minEquity: 0,
      maxLossStreak: 0,
      maxWinStreak: 0,
      finalBalanceRange: { min: 0, max: 0 },
      confidenceInterval: { lower: 0, upper: 0 }
    };
  }

  const finalBalances = results.map(r => r.finalBalance);
  const performances = finalBalances.map(balance => 
    ((balance - startingBalance) / startingBalance) * 100
  );
  
  // Calculate max and min equity across all simulations
  const allEquityValues: number[] = [];
  results.forEach(result => {
    result.data.forEach(point => {
      allEquityValues.push(point.balance);
    });
  });
  
  const maxEquity = Math.max(...allEquityValues, startingBalance);
  const minEquity = Math.min(...allEquityValues, startingBalance);
  
  const avgPerformance = performances.reduce((sum, p) => sum + p, 0) / performances.length;
  const maxLossStreak = Math.max(...results.map(r => r.maxLossStreak));
  const maxWinStreak = Math.max(...results.map(r => r.maxWinStreak));
  
  const finalBalanceRange = {
    min: Math.min(...finalBalances),
    max: Math.max(...finalBalances)
  };
  
  const confidenceInterval = calculateConfidenceInterval(performances);
  
  return {
    avgPerformance,
    maxEquity,
    minEquity,
    maxLossStreak,
    maxWinStreak,
    finalBalanceRange,
    confidenceInterval
  };
}

// Generate colors for different simulation lines
function generateSimulationColors(count: number): string[] {
  const colors = [
    '#84cc16', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444',
    '#10b981', '#f97316', '#3b82f6', '#ec4899', '#6366f1'
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

export function AdvancedChartsTab({ trades, evaluations, selectedEvaluationId }: Props) {
  const kpis = useKpis(trades, evaluations);
  
  // Calculate realistic starting balance based on selected evaluation
  const realStartingBalance = useMemo(() => {
    if (selectedEvaluationId) {
      const evaluation = evaluations.find(e => e.id === selectedEvaluationId);
      return evaluation?.initialBalance || evaluation?.balance || 10000;
    } else {
      // For "all" evaluations, use average of initial balances or default
      const activeEvaluations = evaluations.filter(e => e.status === "active");
      if (activeEvaluations.length > 0) {
        const totalBalance = activeEvaluations.reduce((sum, e) => sum + (e.initialBalance || e.balance || 10000), 0);
        return Math.round(totalBalance / activeEvaluations.length);
      }
      return 10000;
    }
  }, [evaluations, selectedEvaluationId]);
  
  const [config, setConfig] = useState<SimulationConfig>({
    numSimulations: 10,
    tradesPerSimulation: 100,
    startingBalance: realStartingBalance,
    riskPerTrade: 1, // 1% default
    testRrr: 1, // Will be updated with user's actual RRR on first load
    testWinRate: 50 // Will be updated with user's actual win rate on first load
  });
  
  // Update config when realStartingBalance changes
  useEffect(() => {
    setConfig(prev => ({ ...prev, startingBalance: realStartingBalance }));
  }, [realStartingBalance]);
  
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Prepare simulation data based on actual trading statistics
  const simulationData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        winRate: 50,
        avgProfit: 100,
        avgLoss: 100,
        avgRrr: 1,
        hasData: false
      };
    }
    
    return {
      winRate: kpis.winRate || 50,
      avgProfit: kpis.avgProfit || 100,
      avgLoss: kpis.avgLoss || 100,
      avgRrr: kpis.avgRRR || 1,
      hasData: true
    };
  }, [trades, kpis]);

  // Update test RRR with user's actual RRR when data loads
  useEffect(() => {
    if (simulationData.hasData && simulationData.avgRrr > 0) {
      setConfig(prev => ({
        ...prev,
        testRrr: simulationData.avgRrr
      }));
    }
  }, [simulationData.hasData, simulationData.avgRrr]);

  // Update test Win Rate with user's actual win rate when data loads
  useEffect(() => {
    if (simulationData.hasData && simulationData.winRate > 0) {
      setConfig(prev => ({
        ...prev,
        testWinRate: simulationData.winRate
      }));
    }
  }, [simulationData.hasData, simulationData.winRate]);
  
  const stats = useMemo(() => {
    return calculateSimulationStats(simulationResults, config.startingBalance);
  }, [simulationResults, config.startingBalance]);
  
  const runSimulation = () => {
    setIsRunning(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      try {
        const results = runMonteCarloSimulation(
          config,
          config.testWinRate,
          simulationData.avgProfit,
          simulationData.avgLoss
        );
        setSimulationResults(results);
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  };
  
  const resetSimulation = () => {
    setSimulationResults([]);
  };
  
  // Prepare chart data by merging all simulation lines
  const chartData = useMemo(() => {
    if (simulationResults.length === 0) return [];
    
    const maxTrades = Math.max(...simulationResults.map(r => r.data?.length || 0));
    const data = [];
    
    for (let tradeNum = 0; tradeNum < maxTrades; tradeNum++) {
      const point: any = { trade: tradeNum };
      
      simulationResults.forEach((result, index) => {
        if (result.data && result.data[tradeNum]) {
          point[`sim${index}`] = result.data[tradeNum].balance;
        }
      });
      
      data.push(point);
    }
    
    return data;
  }, [simulationResults]);
  
  const simulationColors = generateSimulationColors(config.numSimulations);
  
  return (
    <div className="space-y-6">
      {/* Trading Strategy Metrics */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Your Trading Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {simulationData.hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{simulationData.winRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">${simulationData.avgProfit.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Avg Profit</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">${simulationData.avgLoss.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Avg Loss</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{simulationData.avgRrr.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Avg RRR</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                No trading data available. Simulation will use default parameters for demonstration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Panel */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Simulation Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numSimulations" className="text-gray-300">Number of Simulations</Label>
              <Input
                id="numSimulations"
                type="number"
                min="1"
                max="50"
                value={config.numSimulations}
                onChange={(e) => setConfig({...config, numSimulations: parseInt(e.target.value) || 1})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="tradesPerSim" className="text-gray-300">Trades per Simulation</Label>
              <Input
                id="tradesPerSim"
                type="number"
                min="10"
                max="1000"
                value={config.tradesPerSimulation}
                onChange={(e) => setConfig({...config, tradesPerSimulation: parseInt(e.target.value) || 10})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="startingBalance" className="text-gray-300">Starting Balance ($)</Label>
              <Input
                id="startingBalance"
                type="number"
                min="1000"
                value={config.startingBalance}
                onChange={(e) => setConfig({...config, startingBalance: parseInt(e.target.value) || 1000})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="riskPerTrade" className="text-gray-300">Risk per Trade (%)</Label>
              <Input
                id="riskPerTrade"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={config.riskPerTrade}
                onChange={(e) => setConfig({...config, riskPerTrade: parseFloat(e.target.value) || 1})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="testRrr" className="text-gray-300">Test RRR (Risk:Reward)</Label>
              <Input
                id="testRrr"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={config.testRrr}
                onChange={(e) => setConfig({...config, testRrr: parseFloat(e.target.value) || 1})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="testWinRate" className="text-gray-300">Test Win Rate (%)</Label>
              <Input
                id="testWinRate"
                type="number"
                min="0"
                max="100"
                value={config.testWinRate}
                onChange={(e) => setConfig({...config, testWinRate: parseInt(e.target.value) || 50})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <Button 
            onClick={runSimulation}
            disabled={isRunning}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Simulation...' : 'Run Monte Carlo Simulation'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Results */}
      {simulationResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Equity Curves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="trade" 
                        stroke="#9ca3af"
                        label={{ value: 'Trade Number', position: 'insideBottom', offset: -5, style: { fill: '#9ca3af' } }}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                        label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#ffffff'
                        }}
                        formatter={(value: any) => [`$${value?.toFixed(2)}`, 'Balance']}
                        labelFormatter={(label) => `Trade ${label}`}
                      />
                      {simulationResults.map((_, index) => (
                        <Line
                          key={index}
                          type="monotone"
                          dataKey={`sim${index}`}
                          stroke={simulationColors[index]}
                          strokeWidth={1.5}
                          dot={false}
                          strokeOpacity={0.8}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Statistics Panel */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Simulation Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Avg Performance</span>
                    <span className={`font-semibold ${
                      stats.avgPerformance >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stats.avgPerformance > 0 ? '+' : ''}{stats.avgPerformance.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Max Equity</span>
                    <span className="text-green-400 font-semibold">
                      ${stats.maxEquity.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Min Equity</span>
                    <span className="text-red-400 font-semibold">
                      ${stats.minEquity.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Max Loss Streak</span>
                    <span className="text-red-400 font-semibold">
                      {stats.maxLossStreak} trades
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Max Win Streak</span>
                    <span className="text-green-400 font-semibold">
                      {stats.maxWinStreak} trades
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-400 text-sm mb-2">90% Confidence Interval</div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Lower (5%)</span>
                      <span className={`font-semibold text-sm ${
                        stats.confidenceInterval.lower >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stats.confidenceInterval.lower >= 0 ? '+' : ''}{stats.confidenceInterval.lower.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Upper (95%)</span>
                      <span className={`font-semibold text-sm ${
                        stats.confidenceInterval.upper >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stats.confidenceInterval.upper >= 0 ? '+' : ''}{stats.confidenceInterval.upper.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-400 text-sm mb-2">Final Balance Range</div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Min</span>
                      <span className="text-white font-semibold text-sm">
                        ${stats.finalBalanceRange.min.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Max</span>
                      <span className="text-white font-semibold text-sm">
                        ${stats.finalBalanceRange.max.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

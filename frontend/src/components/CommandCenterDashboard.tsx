


import React, { useMemo, useState } from "react";
import { Trade } from "utils/types";
import { useBasicTradingStats, calculateNetPnl } from "utils/tradingHooks";
import { TrendingUp, TrendingDown, Target, Flame, Calendar, Activity, BarChart3, DollarSign, Award } from "lucide-react";
import { TradingCalendar } from "components/TradingCalendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface CommandCenterDashboardProps {
  trades: Trade[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  currentBalance?: number;
  onNavigateToImport: () => void;
  onNavigateToSettings: () => void;
  evaluations?: Evaluation[]; // Add evaluations prop
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  size?: "small" | "medium" | "large";
  chartData?: {
    percentage?: number; // For rates, factors (0-100)
    currentValue?: number; // For streaks, days
    maxValue?: number; // For streaks, days  
    historicalData?: number[]; // For P&L, trades history
    winRateHistory?: number[]; // For win rate over time
    riskRewardHistory?: number[]; // For risk/reward ratio over time
    profitFactor?: number; // For profit factor
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend = "neutral", 
  className = "",
  size = "medium",
  chartData
}) => {
  const sizeClasses = {
    small: "p-3",
    medium: "p-4",
    large: "p-4"
  };

  const trendColors = {
    up: "from-emerald-500/30 via-green-500/20 to-emerald-600/30 border-emerald-500/60 shadow-emerald-500/20",
    down: "from-red-500/30 via-rose-500/20 to-red-600/30 border-red-500/60 shadow-red-500/20",
    neutral: "from-blue-500/30 via-cyan-500/20 to-blue-600/30 border-blue-500/60 shadow-blue-500/20"
  };

  const textColors = {
    up: "text-emerald-300",
    down: "text-red-300", 
    neutral: "text-blue-300"
  };

  const valueColors = {
    up: "text-emerald-100",
    down: "text-red-100",
    neutral: "text-blue-100"
  };

  // Generate different mini chart types based on the title
  const renderMiniChart = () => {
    if (!chartData) return null;

    const chartColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#6b7280";
    const opacity = "0.8";
    const chartWidth = size === "large" ? 80 : 60;
    const chartHeight = size === "large" ? 40 : 32;

    // For Win Rate, prioritize circular chart over line chart
    if (title === "Win Rate" && chartData.percentage !== undefined) {
      const percentage = Math.min(Math.max(chartData.percentage, 0), 100);
      
      const radius = size === "large" ? 18 : 14;
      const strokeWidth = size === "large" ? 4 : 3;
      const circumference = 2 * Math.PI * radius;
      const strokeDasharray = circumference;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;

      // Dynamic colors based on performance
      const getWinRateColors = (winRate: number) => {
        if (winRate >= 60) {
          return {
            stroke: "#10b981", // emerald-500
            glow: "#10b981",
            text: "#d1fae5" // emerald-100
          };
        } else if (winRate >= 50) {
          return {
            stroke: "#3b82f6", // blue-500
            glow: "#3b82f6",
            text: "#dbeafe" // blue-100
          };
        } else if (winRate >= 40) {
          return {
            stroke: "#f59e0b", // amber-500
            glow: "#f59e0b",
            text: "#fef3c7" // amber-100
          };
        } else {
          return {
            stroke: "#ef4444", // red-500
            glow: "#ef4444",
            text: "#fecaca" // red-100
          };
        }
      };

      const colors = getWinRateColors(percentage);

      return (
        <svg width={chartWidth} height={chartHeight} className="opacity-90">
          <defs>
            {/* Gradient for the progress ring */}
            <linearGradient id={`winRateGradient-${percentage}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.7" />
            </linearGradient>
            {/* Glow effect */}
            <filter id={`winRateGlow-${percentage}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${chartWidth/2}, ${chartHeight/2})`}>
            {/* Background circle */}
            <circle
              r={radius}
              fill="none"
              stroke="#374151"
              strokeWidth={strokeWidth}
              opacity={0.3}
            />
            {/* Progress circle with gradient and glow */}
            <circle
              r={radius}
              fill="none"
              stroke={`url(#winRateGradient-${percentage})`}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90)"
              filter={`url(#winRateGlow-${percentage})`}
              opacity={1.0}
            />
            {/* Center text for large cards */}
            {size === "large" && (
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.text}
                className="text-xs font-bold"
                style={{ filter: `drop-shadow(0 0 4px ${colors.glow}40)` }}
              >
                {percentage.toFixed(0)}%
              </text>
            )}
          </g>
        </svg>
      );
    }

    // For Risk/Reward Ratio, use bar chart with target zones
    if (title === "Risk/Reward Ratio" && chartData.currentValue !== undefined) {
      const currentRatio = Math.max(chartData.currentValue, 0);
      const maxValue = chartData.maxValue || 3;
      const barHeight = size === "large" ? 12 : 8;
      const barY = (chartHeight - barHeight) / 2;
      
      // Define target zones
      const zones = [
        { min: 0, max: 1, color: "#ef4444", label: "Poor" },     // Red: 0-1
        { min: 1, max: 1.5, color: "#f59e0b", label: "Fair" },   // Amber: 1-1.5
        { min: 1.5, max: maxValue, color: "#10b981", label: "Good" } // Green: 1.5+
      ];
      
      const getZoneColor = (ratio: number) => {
        if (ratio >= 1.5) return "#10b981"; // Green
        if (ratio >= 1) return "#f59e0b";   // Amber
        return "#ef4444";                   // Red
      };
      
      const currentBarWidth = Math.min((currentRatio / maxValue) * (chartWidth - 8), chartWidth - 8);
      const targetLineX = (1.5 / maxValue) * (chartWidth - 8) + 4; // 1.5 target line
      
      return (
        <svg width={chartWidth} height={chartHeight} className="opacity-90">
          <defs>
            {/* Gradient for the bar */}
            <linearGradient id={`riskRewardGradient-${currentRatio}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getZoneColor(currentRatio)} stopOpacity="0.8" />
              <stop offset="100%" stopColor={getZoneColor(currentRatio)} stopOpacity="1" />
            </linearGradient>
            {/* Glow effect */}
            <filter id={`riskRewardGlow-${currentRatio}`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          
          {/* Background zones */}
          {zones.map((zone, index) => {
            const zoneStartX = (zone.min / maxValue) * (chartWidth - 8) + 4;
            const zoneWidth = ((zone.max - zone.min) / maxValue) * (chartWidth - 8);
            return (
              <rect
                key={index}
                x={zoneStartX}
                y={barY}
                width={zoneWidth}
                height={barHeight}
                fill={zone.color}
                opacity={0.2}
                rx={2}
              />
            );
          })}
          
          {/* Current value bar */}
          <rect
            x={4}
            y={barY}
            width={currentBarWidth}
            height={barHeight}
            fill={`url(#riskRewardGradient-${currentRatio})`}
            filter={`url(#riskRewardGlow-${currentRatio})`}
            rx={2}
          />
          
          {/* Target line at 1.5 */}
          <line
            x1={targetLineX}
            y1={barY - 2}
            x2={targetLineX}
            y2={barY + barHeight + 2}
            stroke="#ffffff"
            strokeWidth="1"
            opacity={0.8}
            strokeDasharray="2,2"
          />
          
          {/* Current ratio text */}
          {size === "large" && currentRatio > 0 && (
            <text
              x={Math.max(currentBarWidth + 8, 20)}
              y={barY + barHeight / 2}
              textAnchor="start"
              dominantBaseline="central"
              fill={getZoneColor(currentRatio)}
              className="text-xs font-bold"
              style={{ filter: `drop-shadow(0 0 2px ${getZoneColor(currentRatio)}40)` }}
            >
              {currentRatio.toFixed(1)}
            </text>
          )}
        </svg>
      );
    }

    // Prioritize historical data for line charts (all other cases)
    const historicalData = chartData.winRateHistory || chartData.riskRewardHistory || chartData.historicalData;
    
    // Line chart for any historical data (P&L, Win Rate history, Risk/Reward history)
    if (historicalData && historicalData.length > 0) {
      const data = historicalData;
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;
      
      const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * (chartWidth - 8) + 4;
        const y = chartHeight - 4 - ((value - min) / range) * (chartHeight - 8);
        return `${x},${y}`;
      }).join(" ");

      return (
        <svg width={chartWidth} height={chartHeight} className="opacity-80">
          <polyline
            fill="none"
            stroke={chartColor}
            strokeWidth={size === "large" ? "2" : "1.5"}
            points={points}
            style={{ opacity }}
          />
          {/* Add small dots for data points if it's a small dataset */}
          {data.length <= 10 && data.map((value, index) => {
            const x = (index / (data.length - 1)) * (chartWidth - 8) + 4;
            const y = chartHeight - 4 - ((value - min) / range) * (chartHeight - 8);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={size === "large" ? "2" : "1.5"}
                fill={chartColor}
                style={{ opacity: opacity }}
              />
            );
          })}
        </svg>
      );
    }

    // Circular gauge for rates and factors (percentage-based) - fallback when no historical data
    if (chartData.percentage !== undefined) {
      const percentage = Math.min(Math.max(chartData.percentage, 0), 100);
      
      const radius = size === "large" ? 18 : 14;
      const strokeWidth = size === "large" ? 4 : 3;
      const circumference = 2 * Math.PI * radius;
      const strokeDasharray = circumference;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;

      return (
        <svg width={chartWidth} height={chartHeight} className="opacity-90">
          <g transform={`translate(${chartWidth/2}, ${chartHeight/2})`}>
            {/* Background circle */}
            <circle
              r={radius}
              fill="none"
              stroke="#374151"
              strokeWidth={strokeWidth}
              style={{ opacity: 0.4 }}
            />
            {/* Progress circle */}
            <circle
              r={radius}
              fill="none"
              stroke={chartColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ 
                opacity: 1,
                transform: "rotate(-90deg)",
                transformOrigin: "center"
              }}
            />
            {/* Center percentage text for large cards */}
            {size === "large" && (
              <text
                x="0"
                y="2"
                textAnchor="middle"
                className="fill-current text-[8px] font-bold"
                style={{ fill: chartColor }}
              >
                {Math.round(percentage)}%
              </text>
            )}
          </g>
        </svg>
      );
    }

    // Bar chart for streaks and counts (current vs max values) - fallback when no historical data
    if (chartData.currentValue !== undefined && chartData.maxValue !== undefined) {
      const current = chartData.currentValue;
      const max = Math.max(chartData.maxValue, 1);
      const bars = size === "large" ? 12 : 8;
      const barWidth = size === "large" ? 5 : 4;
      const barSpacing = 1;
      const maxHeight = size === "large" ? 24 : 20;
      
      return (
        <svg width={chartWidth} height={chartHeight} className="opacity-80">
          <g transform={`translate(${(chartWidth - (bars * (barWidth + barSpacing)))/2}, ${(chartHeight - maxHeight)/2})`}>
            {Array.from({ length: bars }, (_, i) => {
              const threshold = ((i + 1) / bars) * max;
              const height = current >= threshold ? 
                maxHeight * (0.3 + (i / bars) * 0.7) : // Varying heights when active
                maxHeight * 0.15; // Minimal height when inactive
              const isActive = current >= threshold;
              
              return (
                <rect
                  key={i}
                  x={i * (barWidth + barSpacing)}
                  y={maxHeight - height}
                  width={barWidth}
                  height={height}
                  fill={isActive ? chartColor : "#374151"}
                  style={{ opacity: isActive ? opacity : 0.4 }}
                />
              );
            })}
          </g>
        </svg>
      );
    }

    // Profit Factor Bar Chart
    if (chartData.profitFactor !== undefined) {
      const value = chartData.profitFactor === 999 ? 3 : chartData.profitFactor;
      
      // Trading context explanation
      const getExplanation = (val: number) => {
        if (val < 1) return { 
          status: 'LOSING', 
          meaning: 'Losing more than winning',
          color: '#ef4444'
        };
        if (val < 1.2) return { 
          status: 'BARELY PROFITABLE', 
          meaning: `Win $${val.toFixed(2)} per $1 lost`,
          color: '#f59e0b'
        };
        if (val < 1.5) return { 
          status: 'DECENT', 
          meaning: `Win $${val.toFixed(2)} per $1 lost`,
          color: '#84cc16'
        };
        if (val < 2) return { 
          status: 'GOOD', 
          meaning: `Win $${val.toFixed(2)} per $1 lost`,
          color: '#22c55e'
        };
        return { 
          status: 'EXCELLENT', 
          meaning: `Win $${val.toFixed(2)} per $1 lost`,
          color: '#10b981'
        };
      };
      
      const explanation = getExplanation(value);
      
      return (
        <div className="flex flex-col items-end justify-center w-24 h-12 text-right">
          {/* Status */}
          <div 
            className="text-xs font-bold mb-1"
            style={{ color: explanation.color }}
          >
            {explanation.status}
          </div>
          
          {/* Visual bar */}
          <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((value / 2.5) * 100, 100)}%`,
                backgroundColor: explanation.color,
                boxShadow: `0 0 3px ${explanation.color}60`
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-lg shadow-lg overflow-hidden hover:border-gray-600/70 transition-all duration-300 ${sizeClasses[size]} ${className}`}>
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded bg-gray-700/50 ${textColors[trend]}`}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h3 className={`text-2xl font-bold ${valueColors[trend]} tracking-tight leading-none`}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-300 font-medium mt-1">{subtitle}</p>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            {renderMiniChart()}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentTradeRow: React.FC<{ trade: Trade }> = ({ trade }) => {
  const netPnl = useMemo(() => {
    const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
    const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
    const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
    return grossPnl + commission + swap;
  }, [trade]);

  const isProfit = netPnl > 0;
  
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isProfit ? 'bg-green-500' : 'bg-red-500'}`} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{trade.symbol}</span>
          <span className="text-xs text-gray-400">
            {new Date(trade.closeTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}${netPnl.toFixed(2)}
        </div>
        <div className="text-xs text-gray-400">
          {trade.quantity} units
        </div>
      </div>
    </div>
  );
};

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  trades,
  selectedAccountId,
  setSelectedAccountId,
  currentBalance,
  onNavigateToImport,
  onNavigateToSettings,
  evaluations = [] // Add evaluations prop with default
}) => {
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        profitFactor: 0,
        bestDay: 0,
        worstDay: 0,
        currentStreak: 0,
        maxStreak: 0,
        maxLossStreak: 0,
        activeDays: 0,
        avgTrade: 0,
        dailyPnlHistory: [],
        winRateHistory: [],
        riskRewardHistory: [],
        riskRewardRatio: 0,
        cumulativePnlHistory: []
      };
    }

    // Filter out trades with invalid closeTime and sort by close time for chronological analysis
    const validTrades = trades.filter(trade => {
      if (!trade.closeTime) return false;
      const date = new Date(trade.closeTime);
      return !isNaN(date.getTime());
    });
    
    if (validTrades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        profitFactor: 0,
        bestDay: 0,
        worstDay: 0,
        currentStreak: 0,
        maxStreak: 0,
        maxLossStreak: 0,
        activeDays: 0,
        avgTrade: 0,
        dailyPnlHistory: [],
        winRateHistory: [],
        riskRewardHistory: [],
        riskRewardRatio: 0,
        cumulativePnlHistory: []
      };
    }
    
    const sortedTrades = [...validTrades].sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());

    // Calculate cumulative P&L (equity curve) - this should match the main equity chart
    const cumulativePnl: number[] = [];
    let runningTotal = 0;
    sortedTrades.forEach(trade => {
      const tradePnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
      runningTotal += tradePnl;
      cumulativePnl.push(runningTotal);
    });

    // Daily P&L calculation (kept for other uses)
    const dailyPnl = new Map<string, number>();
    sortedTrades.forEach(trade => {
      try {
        const date = new Date(trade.closeTime).toISOString().split('T')[0];
        const tradePnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        dailyPnl.set(date, (dailyPnl.get(date) || 0) + tradePnl);
      } catch (error) {
        console.warn('Invalid date in trade:', trade.closeTime);
      }
    });
    const dailyPnlArray = Array.from(dailyPnl.values());

    // Calculate 15-day prior win rate for comparison
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const tradesLast15Days = sortedTrades.filter(trade => {
      try {
        const tradeDate = new Date(trade.closeTime);
        return tradeDate >= fifteenDaysAgo;
      } catch (error) {
        return false;
      }
    });
    const winRate15DaysAgo = tradesLast15Days.length > 0 ? 
      (tradesLast15Days.filter(trade => {
        const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        return netPnl > 0;
      }).length / tradesLast15Days.length) * 100 : 0;

    // Historical Win Rate calculation (rolling 10-trade windows)
    const winRateHistory: number[] = [];
    for (let i = 9; i < sortedTrades.length; i += Math.max(1, Math.floor(sortedTrades.length / 20))) {
      const window = sortedTrades.slice(Math.max(0, i - 9), i + 1);
      const wins = window.filter(trade => {
        const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        return netPnl > 0;
      }).length;
      winRateHistory.push((wins / window.length) * 100);
    }

    // Historical Risk/Reward Ratio calculation (rolling windows)
    const riskRewardHistory: number[] = [];
    for (let i = 9; i < sortedTrades.length; i += Math.max(1, Math.floor(sortedTrades.length / 20))) {
      const window = sortedTrades.slice(Math.max(0, i - 9), i + 1);
      const wins = window.filter(trade => {
        const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        return netPnl > 0;
      });
      const losses = window.filter(trade => {
        const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        return netPnl < 0;
      });
      
      if (wins.length > 0 && losses.length > 0) {
        const avgWin = wins.reduce((sum, trade) => {
          const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
          return sum + netPnl;
        }, 0) / wins.length;
        const avgLoss = Math.abs(losses.reduce((sum, trade) => {
          const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
          return sum + netPnl;
        }, 0) / losses.length);
        riskRewardHistory.push(avgWin / avgLoss);
      } else {
        riskRewardHistory.push(riskRewardHistory[riskRewardHistory.length - 1] || 0);
      }
    }

    // Current calculations (unchanged)
    let totalPnl = 0;
    let winningTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    let winningPnlSum = 0;
    let losingPnlSum = 0;
    let winCount = 0;
    let lossCount = 0;

    sortedTrades.forEach((trade, index) => {
      const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
      totalPnl += netPnl;
      
      const isWin = netPnl > 0;
      if (isWin) {
        winningTrades++;
        totalProfit += netPnl;
        winningPnlSum += netPnl;
        winCount++;
        
        // Win streak logic
        tempWinStreak++;
        tempLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
      } else {
        totalLoss += Math.abs(netPnl);
        losingPnlSum += Math.abs(netPnl);
        lossCount++;
        
        // Loss streak logic
        tempLossStreak++;
        tempWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
      }
      
      // Set current streaks based on most recent trade
      if (index === sortedTrades.length - 1) {
        currentWinStreak = tempWinStreak;
        currentLossStreak = tempLossStreak;
      }
    });

    const winRate = sortedTrades.length > 0 ? (winningTrades / sortedTrades.length) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? 999 : 0);
    
    // Calculate active days this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const uniqueDaysThisMonth = new Set<string>();
    sortedTrades.forEach(trade => {
      try {
        const tradeDate = new Date(trade.closeTime);
        if (!isNaN(tradeDate.getTime()) && tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear) {
          uniqueDaysThisMonth.add(tradeDate.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.warn('Invalid date in active days calculation:', trade.closeTime);
      }
    });
    const activeDays = uniqueDaysThisMonth.size;

    // Risk/Reward Ratio calculation
    const avgWin = winCount > 0 ? winningPnlSum / winCount : 0;
    const avgLoss = lossCount > 0 ? losingPnlSum / lossCount : 0;
    const riskRewardRatio = avgLoss !== 0 ? avgWin / avgLoss : 0;

    return {
      totalPnl,
      winRate,
      totalTrades: sortedTrades.length,
      winningTrades,
      profitFactor,
      bestDay: dailyPnlArray.length > 0 ? Math.max(...dailyPnlArray) : 0,
      worstDay: dailyPnlArray.length > 0 ? Math.min(...dailyPnlArray) : 0,
      currentStreak: currentWinStreak,
      maxStreak: maxWinStreak,
      maxLossStreak,
      activeDays,
      avgTrade: sortedTrades.length > 0 ? totalPnl / sortedTrades.length : 0,
      dailyPnlHistory: dailyPnlArray,
      winRateHistory,
      riskRewardHistory,
      riskRewardRatio,
      cumulativePnlHistory: cumulativePnl,
      winRate15DaysAgo
    };
  }, [trades]);

  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime())
      .slice(0, 8);
  }, [trades]);

  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const filteredTrades = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    return trades.filter(trade => {
      const tradeDate = new Date(trade.closeTime);
      return tradeDate.getFullYear() === Number(year) && tradeDate.getMonth() === Number(month) - 1;
    });
  }, [selectedMonth, trades]);

  const accounts = useMemo(() => {
    return [
      { id: "all", accountNumber: "All Accounts", name: "All Accounts" },
      { id: "12345", accountNumber: "12345", name: "Account 1" },
      { id: "67890", accountNumber: "67890", name: "Account 2" },
      // Add more accounts as needed
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4 overflow-hidden relative">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
      
      {/* Header Section - Compressed */}
      <div className="mb-4 relative z-10">
        <div className="flex items-center gap-4 mb-2">
          {/* Logo/Icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-500/25">
            <Activity className="text-white" size={20} />
          </div>
          
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent tracking-tight">
              TRADING COMMAND CENTER
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600/30 to-green-600/30 border border-emerald-500/40 backdrop-blur-xl shadow-lg">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-gray-300 font-medium text-sm">Real-time performance analytics</p>
          <span className="text-gray-400 text-sm"> • {new Date().toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Main Performance Grid - Compressed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Hero Metrics - Full Width */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total P&L"
            value={`$${stats.totalPnl.toFixed(2)}`}
            subtitle={stats.totalPnl >= 0 ? "Profit" : "Loss"}
            icon={<DollarSign size={24} />}
            trend={stats.totalPnl >= 0 ? "up" : "down"}
            size="large"
            chartData={{ historicalData: stats.cumulativePnlHistory }}
          />
          
          <MetricCard
            title="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            subtitle={`${stats.winningTrades}/${stats.totalTrades} trades • 15d: ${(stats.winRate15DaysAgo || 0).toFixed(1)}%`}
            icon={<Target size={24} />}
            trend={stats.winRate >= 60 ? "up" : stats.winRate >= 40 ? "neutral" : "down"}
            size="large"
            chartData={{ 
              percentage: stats.winRate
            }}
          />
          
          <MetricCard
            title="Risk/Reward Ratio"
            value={stats.riskRewardRatio > 0 ? stats.riskRewardRatio.toFixed(2) : 'N/A'}
            subtitle="Average Win/Loss"
            icon={<BarChart3 size={24} />}
            trend={stats.riskRewardRatio >= 1.5 ? "up" : stats.riskRewardRatio >= 1 ? "neutral" : "down"}
            size="large"
            chartData={{ 
              currentValue: stats.riskRewardRatio, 
              maxValue: 3,
              riskRewardHistory: stats.riskRewardHistory 
            }}
          />
          
          <MetricCard
            title="Profit Factor"
            value={stats.profitFactor === 999 ? "∞" : stats.profitFactor.toFixed(2)}
            subtitle={stats.profitFactor >= 2 ? "Excellent" : stats.profitFactor >= 1.5 ? "Good" : stats.profitFactor >= 1 ? "Break Even" : "Needs Work"}
            icon={<Activity size={24} />}
            trend={stats.profitFactor >= 1.5 ? "up" : stats.profitFactor >= 1 ? "neutral" : "down"}
            size="large"
            chartData={{ profitFactor: stats.profitFactor }}
          />
        </div>
      </div>

      {/* Bottom Section: Trading Calendar and Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Trading Calendar - 2/3 width on desktop, full width on mobile */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-6 shadow-2xl h-full">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" />
              Trading Calendar
            </h3>
            <TradingCalendar 
              trades={trades} 
              selectedAccountId={selectedAccountId}
              evaluations={evaluations}
            />
          </div>
        </div>

        {/* Right Column - Metrics + Recent Trades - Mobile First */}
        <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
          {/* Secondary Metrics - Mobile Optimized */}
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              <span className="hidden sm:inline">Trading Metrics ({stats.totalTrades} trades)</span>
              <span className="sm:hidden">Metrics ({stats.totalTrades})</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                <span className="text-gray-300 text-sm">Total Trades</span>
                <span className={`font-semibold ${
                  stats.totalTrades > 0 ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  {stats.totalTrades}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                <span className="text-gray-300 text-sm">Avg Trade</span>
                <span className={`font-semibold ${
                  stats.avgTrade >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  ${stats.avgTrade.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                <span className="text-gray-300 text-sm">Win Rate</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    stats.winRate >= 60 ? 'text-emerald-400' : stats.winRate >= 50 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {stats.winRate.toFixed(1)}%
                  </span>
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={stats.winRate >= 60 ? '#10b981' : stats.winRate >= 50 ? '#3b82f6' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${stats.winRate}, 100`}
                      />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-300 text-sm">Win Streak</span>
                <span className={`font-semibold ${
                  stats.currentStreak > 0 ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {stats.currentStreak}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-300 text-sm">Max Streak</span>
                <span className={`font-semibold ${
                  stats.maxStreak > 3 ? 'text-emerald-400' : stats.maxStreak > 0 ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  {stats.maxStreak}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-300 text-sm">Max Loss Streak</span>
                <span className={`font-semibold ${
                  stats.maxLossStreak > 3 ? 'text-red-400' : stats.maxLossStreak > 0 ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {stats.maxLossStreak}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              Recent Trades
            </h3>
            <div className="space-y-3">
              {recentTrades.slice(0, 5).map((trade, index) => {
                const netPnl = calculateNetPnl(trade);
                return (
                  <div key={trade.id || index} className="flex justify-between items-center py-2 border-b border-gray-700/20 last:border-b-0">
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm">{trade.symbol}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(trade.closeTime || trade.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold text-sm ${
                        netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        ${netPnl.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {trade.lots || trade.quantity || 0} {trade.lots ? 'lots' : 'shares'}
                      </div>
                    </div>
                  </div>
                );
              })}
              {trades.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No trades available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useMemo } from 'react';
import { Trade, Evaluation, TradeRiskMetrics, EnhancedRiskWarning, RiskDashboard } from './types';
import { calculateRiskMetrics, calculateTradeRiskMetrics } from './riskCalculations';

/**
 * Hook for comprehensive trading metrics using the proven calculateRiskMetrics function
 * This is the single source of truth for all trading calculations
 */
export function useTradingMetrics(trades: Trade[], evaluations: Evaluation[] = []) {
  return useMemo(() => {
    return calculateRiskMetrics(trades, evaluations);
  }, [trades, evaluations]);
}

/**
 * Hook for risk analysis including warnings and dashboard data
 * Extracts risk-specific data from the comprehensive metrics
 */
export function useRiskAnalysis(trades: Trade[], evaluations: Evaluation[] = []) {
  const metrics = useTradingMetrics(trades, evaluations);
  
  return useMemo(() => {
    return {
      warnings: metrics.enhancedWarnings,
      dashboard: metrics.riskDashboard,
      tradeRiskMetrics: metrics.tradeRiskMetrics,
      sharpeRatio: metrics.sharpeRatio,
      maxDrawdown: metrics.maxDrawdown,
      maxDrawdownPercent: metrics.maxDrawdownPercent,
      currentDrawdown: metrics.currentDrawdown
    };
  }, [metrics]);
}

/**
 * Hook for account balance and progress tracking
 * Provides account-specific metrics from evaluations
 */
export function useAccountMetrics(evaluations: Evaluation[] = []) {
  return useMemo(() => {
    const activeEvaluations = evaluations.filter(e => e.status === 'active');
    
    // Calculate total balance across all active accounts
    const totalBalance = activeEvaluations.reduce((sum, evaluation) => {
      return sum + (evaluation.initialBalance || 0);
    }, 0);
    
    // Calculate total progress
    const totalProgress = activeEvaluations.reduce((sum, evaluation) => {
      return sum + evaluation.progress;
    }, 0);
    
    // Calculate average progress
    const avgProgress = activeEvaluations.length > 0 ? totalProgress / activeEvaluations.length : 0;
    
    return {
      activeEvaluations,
      totalBalance,
      totalProgress,
      avgProgress,
      accountCount: activeEvaluations.length
    };
  }, [evaluations]);
}

/**
 * Hook for basic trading statistics
 * Lightweight version for components that only need basic metrics
 */
export function useBasicTradingStats(trades: Trade[]) {
  return useMemo(() => {
    const winningTrades = trades.filter(trade => {
      const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
      const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
      const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
      const netPnl = grossPnl + commission + swap;
      return netPnl > 0;
    });
    
    const losingTrades = trades.filter(trade => {
      const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
      const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
      const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
      const netPnl = grossPnl + commission + swap;
      return netPnl < 0;
    });
    
    const totalPnl = trades.reduce((sum, trade) => {
      const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
      const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
      const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
      return sum + (grossPnl + commission + swap);
    }, 0);
    
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => {
      const grossPnl = typeof t.pnl === 'number' && !isNaN(t.pnl) ? t.pnl : 0;
      const commission = typeof t.commission === 'number' && !isNaN(t.commission) ? t.commission : 0;
      const swap = typeof t.swap === 'number' && !isNaN(t.swap) ? t.swap : 0;
      return sum + (grossPnl + commission + swap);
    }, 0) / winningTrades.length : 0;
    
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => {
      const grossPnl = typeof t.pnl === 'number' && !isNaN(t.pnl) ? t.pnl : 0;
      const commission = typeof t.commission === 'number' && !isNaN(t.commission) ? t.commission : 0;
      const swap = typeof t.swap === 'number' && !isNaN(t.swap) ? t.swap : 0;
      return sum + (grossPnl + commission + swap);
    }, 0) / losingTrades.length : 0;
    
    const avgTrade = trades.length > 0 ? totalPnl / trades.length : 0;
    
    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalPnl,
      avgWin,
      avgLoss,
      avgTrade
    };
  }, [trades]);
}

/**
 * Hook for streak data and current trading state
 * Provides streak information for gamification features
 */
export function useStreakData(trades: Trade[]) {
  const metrics = useTradingMetrics(trades, []);
  
  return useMemo(() => {
    return {
      currentStreak: metrics.currentStreak,
      streakType: metrics.streakType,
      maxLosingStreak: metrics.maxLosingStreak,
      isOnWinningStreak: metrics.streakType === 'winning',
      isOnLosingStreak: metrics.streakType === 'losing'
    };
  }, [metrics]);
}

/**
 * Hook for performance distribution data
 * Provides R-multiple and timeframe analysis
 */
export function usePerformanceDistribution(trades: Trade[]) {
  const metrics = useTradingMetrics(trades, []);
  
  return useMemo(() => {
    return {
      rMultipleDistribution: metrics.rMultipleDistribution,
      winRateByTimeframe: metrics.winRateByTimeframe,
      riskAdjustedReturn: metrics.riskAdjustedReturn,
      profitToMaxDrawdownRatio: metrics.profitToMaxDrawdownRatio
    };
  }, [metrics]);
}

/**
 * Calculate net P&L for a single trade including commission and swap fees
 */
export function calculateNetPnl(trade: Trade): number {
  const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
  const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
  const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
  return grossPnl + commission + swap;
}

/**
 * Check if a trade is profitable based on net P&L
 */
export function isTradeProfit(trade: Trade): boolean {
  return calculateNetPnl(trade) > 0;
}

/**
 * Hook for unified KPI calculations
 * Provides consistent KPI data across all components
 */
export function useKpis(trades: Trade[], evaluations: Evaluation[] = []) {
  return useMemo(() => {
    const winningTrades = trades.filter(trade => isTradeProfit(trade));
    const losingTrades = trades.filter(trade => calculateNetPnl(trade) < 0);
    const totalPnl = trades.reduce((sum, trade) => sum + calculateNetPnl(trade), 0);
    
    // Calculate average profit and loss using net P&L
    const avgProfit = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + calculateNetPnl(t), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + calculateNetPnl(t), 0) / losingTrades.length)
      : 0;
    
    // Calculate Average RRR (Risk-Reward Ratio) - standard approach
    const avgRRR = avgLoss > 0 ? avgProfit / avgLoss : 0;
    
    // Calculate Profit Factor using net P&L
    const grossProfit = winningTrades.reduce((sum, t) => sum + calculateNetPnl(t), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + calculateNetPnl(t), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    
    return {
      totalPnl,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      avgProfit,
      avgLoss,
      avgRRR,
      profitFactor,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length
    };
  }, [trades]);
}

/**
 * Standalone: calculate win rate (%) from a list of trades
 */
export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter(t => calculateNetPnl(t) > 0).length;
  return (wins / trades.length) * 100;
}

/**
 * Standalone: average net P&L of winning trades
 */
export function calculateAverageWin(trades: Trade[]): number {
  const wins = trades.filter(t => calculateNetPnl(t) > 0);
  if (wins.length === 0) return 0;
  return wins.reduce((sum, t) => sum + calculateNetPnl(t), 0) / wins.length;
}

/**
 * Standalone: average net P&L of losing trades (returns negative value)
 */
export function calculateAverageLoss(trades: Trade[]): number {
  const losses = trades.filter(t => calculateNetPnl(t) < 0);
  if (losses.length === 0) return 0;
  return losses.reduce((sum, t) => sum + calculateNetPnl(t), 0) / losses.length;
}

/**
 * Standalone: gross profit / gross loss
 */
export function calculateProfitFactor(trades: Trade[]): number {
  const grossProfit = trades
    .filter(t => calculateNetPnl(t) > 0)
    .reduce((sum, t) => sum + calculateNetPnl(t), 0);
  const grossLoss = Math.abs(
    trades
      .filter(t => calculateNetPnl(t) < 0)
      .reduce((sum, t) => sum + calculateNetPnl(t), 0)
  );
  return grossLoss > 0 ? grossProfit / grossLoss : 0;
}

/**
 * Standalone: Sharpe ratio — mean return / std dev of returns
 */
export function calculateSharpeRatio(trades: Trade[]): number {
  if (trades.length < 2) return 0;
  const returns = trades.map(t => calculateNetPnl(t));
  const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? avg / stdDev : 0;
}

/**
 * Standalone: maximum peak-to-trough drawdown in currency units
 */
export function calculateMaxDrawdown(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );
  let cumPnl = 0;
  let peak = 0;
  let maxDD = 0;
  for (const t of sorted) {
    cumPnl += calculateNetPnl(t);
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

/**
 * Standalone: Calmar ratio — total net P&L / max drawdown
 */
export function calculateCalmarRatio(trades: Trade[]): number {
  const maxDD = calculateMaxDrawdown(trades);
  if (maxDD === 0) return 0;
  const totalPnl = trades.reduce((sum, t) => sum + calculateNetPnl(t), 0);
  return totalPnl / maxDD;
}

/**
 * Standalone: Sortino ratio — mean return / downside deviation
 */
export function calculateSortino(trades: Trade[]): number {
  if (trades.length < 2) return 0;
  const returns = trades.map(t => calculateNetPnl(t));
  const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
  const negReturns = returns.filter(r => r < 0);
  if (negReturns.length === 0) return 0;
  const downsideVariance = negReturns.reduce((s, r) => s + Math.pow(r, 2), 0) / returns.length;
  const downsideStdDev = Math.sqrt(downsideVariance);
  return downsideStdDev > 0 ? avg / downsideStdDev : 0;
}

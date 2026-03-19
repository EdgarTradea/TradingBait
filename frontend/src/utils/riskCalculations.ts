import { Trade, Evaluation, EnhancedRiskWarning, RiskDashboard, TradeRiskMetrics } from "./types";
import { getAccountBalanceForTrade, calculateDollarRisk, calculatePercentageRisk, calculateRiskRewardRatio, resolveAccountBalance } from "./evaluationUtils";
import { JournalEntryResponse } from '../brain/data-contracts';

/**
 * Risk levels for the warning system
 */
export enum RiskLevel {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red'
}

/**
 * Warning types for different risk patterns
 */
export enum WarningType {
  LOSING_STREAK = 'losing_streak',
  POSITION_SIZE_ESCALATION = 'position_size_escalation',
  TRADING_FREQUENCY_SPIKE = 'trading_frequency_spike',
  EMOTIONAL_RISK = 'emotional_risk',
  OVERTRADING = 'overtrading',
  POOR_DISCIPLINE = 'poor_discipline'
}

/**
 * Warning message interface
 */
export interface RiskWarning {
  id: string;
  type: WarningType;
  level: RiskLevel;
  title: string;
  message: string;
  recommendation: string;
  timestamp: Date;
  isActive: boolean;
}

/**
 * Risk status for display
 */
export interface RiskStatus {
  level: RiskLevel;
  score: number; // 0-100
  activeWarnings: RiskWarning[];
  summary: string;
}

export interface RiskMetrics {
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  recoveryPeriod: number;
  currentDrawdown: number;
  maxLosingStreak: number;
  currentStreak: number;
  streakType: 'winning' | 'losing' | 'none';
  rMultipleDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  winRateByTimeframe: {
    timeframe: string;
    winRate: number;
    totalTrades: number;
  }[];
  riskAdjustedReturn: number;
  profitToMaxDrawdownRatio: number;
  // Enhanced risk metrics
  enhancedWarnings: EnhancedRiskWarning[];
  riskDashboard: RiskDashboard;
  tradeRiskMetrics: TradeRiskMetrics[];
}

export interface DrawdownPeriod {
  start: Date;
  end: Date | null;
  peakValue: number;
  troughValue: number;
  drawdown: number;
  drawdownPercent: number;
  recovered: boolean;
  recoveryDays?: number;
}

/**
 * Calculate comprehensive risk metrics for a set of trades
 */
export function calculateRiskMetrics(trades: Trade[], evaluations: Evaluation[] = []): RiskMetrics {
  if (trades.length === 0) {
    return {
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      recoveryPeriod: 0,
      currentDrawdown: 0,
      maxLosingStreak: 0,
      currentStreak: 0,
      streakType: 'none',
      rMultipleDistribution: [],
      winRateByTimeframe: [],
      riskAdjustedReturn: 0,
      profitToMaxDrawdownRatio: 0,
      enhancedWarnings: [],
      riskDashboard: {
        avgRiskPerTrade: { dollars: 0, percentage: 0 },
        maxRiskPerTrade: { dollars: 0, percentage: 0, date: '' },
        riskTrend: 'stable',
        riskViolations: { over3Percent: 0, over5Percent: 0 },
        confidence: 0,
        dataPoints: 0
      },
      tradeRiskMetrics: []
    };
  }

  // Sort trades by close time
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  // Calculate Sharpe Ratio
  const sharpeRatio = calculateSharpeRatio(sortedTrades);

  // Calculate drawdown metrics
  const drawdownMetrics = calculateDrawdownMetrics(sortedTrades);

  // Calculate streak metrics
  const streakMetrics = calculateStreakMetrics(sortedTrades);

  // Calculate R-Multiple distribution
  const rMultipleDistribution = calculateRMultipleDistribution(sortedTrades);

  // Calculate win rate by timeframe
  const winRateByTimeframe = calculateWinRateByTimeframe(sortedTrades);

  // Calculate risk-adjusted return
  const totalReturn = sortedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const riskAdjustedReturn = drawdownMetrics.maxDrawdown > 0 
    ? totalReturn / Math.abs(drawdownMetrics.maxDrawdown) 
    : totalReturn;

  const profitToMaxDrawdownRatio = drawdownMetrics.maxDrawdown < 0 
    ? totalReturn / Math.abs(drawdownMetrics.maxDrawdown) 
    : totalReturn > 0 ? Infinity : 0;

  // Calculate enhanced risk metrics
  const tradeRiskMetrics = calculateTradeRiskMetrics(trades, evaluations);
  const enhancedWarnings = generateEnhancedRiskWarnings(tradeRiskMetrics, trades);
  const riskDashboard = calculateRiskDashboard(tradeRiskMetrics);

  return {
    sharpeRatio,
    ...drawdownMetrics,
    ...streakMetrics,
    rMultipleDistribution,
    winRateByTimeframe,
    riskAdjustedReturn,
    profitToMaxDrawdownRatio,
    enhancedWarnings,
    riskDashboard,
    tradeRiskMetrics
  };
}

/**
 * Calculate Sharpe Ratio (assuming risk-free rate of 0 for simplicity)
 */
function calculateSharpeRatio(trades: Trade[]): number {
  if (trades.length < 2) return 0;

  const returns = trades.map(trade => trade.pnl);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  // Calculate standard deviation
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? avgReturn / stdDev : 0;
}

/**
 * Calculate drawdown metrics including max drawdown and recovery periods
 */
function calculateDrawdownMetrics(trades: Trade[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
  recoveryPeriod: number;
  currentDrawdown: number;
} {
  if (trades.length === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      recoveryPeriod: 0,
      currentDrawdown: 0,
    };
  }

  let cumulativePnl = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let maxRecoveryDays = 0;
  let currentDrawdownStart: Date | null = null;
  
  const equityCurve: { date: Date; equity: number; peak: number }[] = [];
  
  trades.forEach(trade => {
    cumulativePnl += trade.pnl;
    const tradeDate = new Date(trade.closeTime);
    
    if (cumulativePnl > peak) {
      peak = cumulativePnl;
      // End current drawdown period if recovering
      if (currentDrawdownStart) {
        const recoveryDays = Math.floor(
          (tradeDate.getTime() - currentDrawdownStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        maxRecoveryDays = Math.max(maxRecoveryDays, recoveryDays);
        currentDrawdownStart = null;
      }
    }
    
    const currentDrawdown = peak - cumulativePnl;
    const currentDrawdownPercent = peak > 0 ? (currentDrawdown / peak) * 100 : 0;
    
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
      maxDrawdownPercent = currentDrawdownPercent;
    }
    
    if (currentDrawdown > 0 && !currentDrawdownStart) {
      currentDrawdownStart = tradeDate;
    }
    
    equityCurve.push({ date: tradeDate, equity: cumulativePnl, peak });
  });
  
  // Calculate current drawdown
  const currentEquity = cumulativePnl;
  const currentDrawdown = peak - currentEquity;
  
  return {
    maxDrawdown: -maxDrawdown,
    maxDrawdownPercent,
    recoveryPeriod: maxRecoveryDays,
    currentDrawdown: -currentDrawdown,
  };
}

/**
 * Calculate winning and losing streaks
 */
function calculateStreakMetrics(trades: Trade[]): {
  maxLosingStreak: number;
  currentStreak: number;
  streakType: 'winning' | 'losing' | 'none';
} {
  if (trades.length === 0) {
    return { maxLosingStreak: 0, currentStreak: 0, streakType: 'none' };
  }

  let maxLosingStreak = 0;
  let currentLosingStreak = 0;
  let currentWinningStreak = 0;
  let lastTradeResult: 'win' | 'loss' | null = null;

  trades.forEach(trade => {
    const pnl = trade.pnl;
    const isWin = pnl > 0;
    
    if (isWin) {
      if (lastTradeResult === 'win') {
        currentWinningStreak++;
      } else {
        currentWinningStreak = 1;
        currentLosingStreak = 0;
      }
      lastTradeResult = 'win';
    } else {
      if (lastTradeResult === 'loss') {
        currentLosingStreak++;
      } else {
        currentLosingStreak = 1;
        currentWinningStreak = 0;
      }
      lastTradeResult = 'loss';
      maxLosingStreak = Math.max(maxLosingStreak, currentLosingStreak);
    }
  });

  const currentStreak = lastTradeResult === 'win' ? currentWinningStreak : currentLosingStreak;
  const streakType: 'winning' | 'losing' | 'none' = 
    lastTradeResult === 'win' ? 'winning' : 
    lastTradeResult === 'loss' ? 'losing' : 'none';

  return {
    maxLosingStreak,
    currentStreak,
    streakType,
  };
}

/**
 * Calculate R-Multiple distribution (Risk/Reward ratio distribution)
 */
function calculateRMultipleDistribution(trades: Trade[]): {
  range: string;
  count: number;
  percentage: number;
}[] {
  if (trades.length === 0) return [];

  // For R-Multiple, we need to estimate risk based on trade size or use a fixed risk
  // Since we don't have stop loss data for all trades, we'll use a simplified version
  const pnlRanges = [
    { range: '<-3R', min: -Infinity, max: -300 },
    { range: '-3R to -2R', min: -300, max: -200 },
    { range: '-2R to -1R', min: -200, max: -100 },
    { range: '-1R to 0R', min: -100, max: 0 },
    { range: '0R to 1R', min: 0, max: 100 },
    { range: '1R to 2R', min: 100, max: 200 },
    { range: '2R to 3R', min: 200, max: 300 },
    { range: '>3R', min: 300, max: Infinity },
  ];

  const distribution = pnlRanges.map(range => {
    const count = trades.filter(trade => {
      const pnl = trade.pnl;
      return pnl > range.min && pnl <= range.max;
    }).length;
    
    return {
      range: range.range,
      count,
      percentage: (count / trades.length) * 100,
    };
  });

  return distribution.filter(item => item.count > 0);
}

/**
 * Calculate win rate by different timeframes
 */
function calculateWinRateByTimeframe(trades: Trade[]): {
  timeframe: string;
  winRate: number;
  totalTrades: number;
}[] {
  const timeframes = [
    { name: 'Asian Session (00:00-08:00 UTC)', start: 0, end: 8 },
    { name: 'London Session (08:00-16:00 UTC)', start: 8, end: 16 },
    { name: 'New York Session (13:00-21:00 UTC)', start: 13, end: 21 },
    { name: 'Sydney Session (21:00-05:00 UTC)', start: 21, end: 29 }, // 29 to handle overnight
  ];

  return timeframes.map(tf => {
    const sessionTrades = trades.filter(trade => {
      const hour = new Date(trade.closeTime).getUTCHours();
      if (tf.start > tf.end) {
        // Handle overnight session (Sydney)
        return hour >= tf.start || hour < (tf.end - 24);
      }
      return hour >= tf.start && hour < tf.end;
    });

    const winningTrades = sessionTrades.filter(trade => trade.pnl > 0).length;
    const winRate = sessionTrades.length > 0 ? (winningTrades / sessionTrades.length) * 100 : 0;

    return {
      timeframe: tf.name,
      winRate,
      totalTrades: sessionTrades.length,
    };
  }).filter(item => item.totalTrades > 0);
}

/**
 * Calculate detailed drawdown periods for analysis
 */
export function calculateDrawdownPeriods(trades: Trade[]): DrawdownPeriod[] {
  if (trades.length === 0) return [];

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  let cumulativePnl = 0;
  let peak = 0;
  const drawdownPeriods: DrawdownPeriod[] = [];
  let currentDrawdown: DrawdownPeriod | null = null;

  sortedTrades.forEach(trade => {
    cumulativePnl += trade.pnl;
    const tradeDate = new Date(trade.closeTime);

    if (cumulativePnl > peak) {
      peak = cumulativePnl;
      
      // End current drawdown period if recovering
      if (currentDrawdown && !currentDrawdown.recovered) {
        currentDrawdown.end = tradeDate;
        currentDrawdown.recovered = true;
        currentDrawdown.recoveryDays = Math.floor(
          (tradeDate.getTime() - currentDrawdown.start.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    } else if (cumulativePnl < peak) {
      // In drawdown
      if (!currentDrawdown || currentDrawdown.recovered) {
        // Start new drawdown period
        currentDrawdown = {
          start: tradeDate,
          end: null,
          peakValue: peak,
          troughValue: cumulativePnl,
          drawdown: peak - cumulativePnl,
          drawdownPercent: peak > 0 ? ((peak - cumulativePnl) / peak) * 100 : 0,
          recovered: false,
        };
        drawdownPeriods.push(currentDrawdown);
      } else {
        // Update existing drawdown
        currentDrawdown.troughValue = Math.min(currentDrawdown.troughValue, cumulativePnl);
        currentDrawdown.drawdown = currentDrawdown.peakValue - currentDrawdown.troughValue;
        currentDrawdown.drawdownPercent = currentDrawdown.peakValue > 0 
          ? (currentDrawdown.drawdown / currentDrawdown.peakValue) * 100 
          : 0;
      }
    }
  });

  return drawdownPeriods;
}

// ============ WARNING SYSTEM FUNCTIONS ============

/**
 * Detect consecutive losing streak
 */
export function detectLosingStreak(trades: Trade[], threshold: number = 3): RiskWarning | null {
  if (trades.length < threshold) return null;

  // Sort trades by close time (most recent first)
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
  );

  let consecutiveLosses = 0;
  for (const trade of sortedTrades) {
    const netPnl = trade.pnl;
    if (netPnl < 0) {
      consecutiveLosses++;
    } else {
      break;
    }
  }

  if (consecutiveLosses >= threshold) {
    const level = consecutiveLosses >= 5 ? RiskLevel.RED : RiskLevel.YELLOW;
    return {
      id: `losing_streak_${Date.now()}`,
      type: WarningType.LOSING_STREAK,
      level,
      title: `⚠️ ${consecutiveLosses} Consecutive Losses`,
      message: `You've had ${consecutiveLosses} losing trades in a row. This may indicate emotional decision-making or market condition changes.`,
      recommendation: consecutiveLosses >= 5 
        ? "Consider taking a break from trading to reassess your strategy and emotional state."
        : "Review your recent trades and consider reducing position size until you regain profitability.",
      timestamp: new Date(),
      isActive: true
    };
  }

  return null;
}

/**
 * Detect position size escalation after losses
 */
export function detectPositionSizeEscalation(trades: Trade[]): RiskWarning | null {
  if (trades.length < 2) return null;

  // Sort trades by close time (most recent first)
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
  );

  // Look for pattern: loss followed by increased position size
  for (let i = 0; i < sortedTrades.length - 1; i++) {
    const currentTrade = sortedTrades[i];
    const previousTrade = sortedTrades[i + 1];
    
    const currentPnl = currentTrade.pnl;
    const previousPnl = previousTrade.pnl;
    
    // Use lots for volume comparison, fallback to 1 if not available
    const currentVolume = currentTrade.lots || 1;
    const previousVolume = previousTrade.lots || 1;
    
    // If previous trade was a loss and current position size is significantly larger
    if (previousPnl < 0 && currentVolume > previousVolume * 1.5) {
      return {
        id: `position_escalation_${Date.now()}`,
        type: WarningType.POSITION_SIZE_ESCALATION,
        level: RiskLevel.YELLOW,
        title: "📈 Position Size Increased After Loss",
        message: `You increased position size by ${Math.round(((currentVolume / previousVolume) - 1) * 100)}% after a losing trade.`,
        recommendation: "Avoid revenge trading. Stick to your predefined position sizing rules regardless of previous outcomes.",
        timestamp: new Date(),
        isActive: true
      };
    }
  }

  return null;
}

/**
 * Detect trading frequency spikes
 */
export function detectTradingFrequencySpike(trades: Trade[]): RiskWarning | null {
  if (trades.length < 10) return null;

  const today = new Date();
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentTrades = trades.filter(t => new Date(t.closeTime) >= last7Days);
  const monthlyTrades = trades.filter(t => new Date(t.closeTime) >= last30Days);

  const weeklyAverage = monthlyTrades.length / 4; // rough weekly average
  const currentWeekCount = recentTrades.length;

  if (currentWeekCount > weeklyAverage * 2 && currentWeekCount > 10) {
    return {
      id: `frequency_spike_${Date.now()}`,
      type: WarningType.TRADING_FREQUENCY_SPIKE,
      level: RiskLevel.YELLOW,
      title: "⚡ High Trading Frequency",
      message: `You've made ${currentWeekCount} trades this week, ${Math.round(((currentWeekCount / weeklyAverage) - 1) * 100)}% above your average.`,
      recommendation: "High frequency trading may indicate emotional decision-making. Consider taking a step back and focusing on quality over quantity.",
      timestamp: new Date(),
      isActive: true
    };
  }

  return null;
}

/**
 * Detect emotional risk from journal entries
 */
export function detectEmotionalRisk(journalEntries: JournalEntryResponse[]): RiskWarning | null {
  if (journalEntries.length === 0) return null;

  // Get recent entries (last 3 days)
  const recentEntries = journalEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return entryDate >= threeDaysAgo;
    })
    .slice(0, 3);

  if (recentEntries.length === 0) return null;

  // Risk-associated emotional states
  const riskEmotions = ['frustrated', 'angry', 'overconfident', 'anxious', 'greedy', 'fear', 'fomo'];
  const recentMoods = recentEntries.map(e => e.mood?.toLowerCase() || '').filter(mood => mood);
  
  const riskyMoodCount = recentMoods.filter(mood => 
    riskEmotions.some(riskEmotion => mood.includes(riskEmotion))
  ).length;

  if (riskyMoodCount >= 2) {
    return {
      id: `emotional_risk_${Date.now()}`,
      type: WarningType.EMOTIONAL_RISK,
      level: RiskLevel.YELLOW,
      title: "🧠 Emotional State Warning",
      message: `Your recent journal entries indicate elevated emotional states that may affect trading decisions.`,
      recommendation: "Take time to center yourself before trading. Consider meditation or reviewing your trading plan to maintain objectivity.",
      timestamp: new Date(),
      isActive: true
    };
  }

  return null;
}

/**
 * Calculate overall risk status
 */
export function calculateRiskStatus(
  trades: Trade[], 
  journalEntries: JournalEntryResponse[], 
  evaluations: any[] = []
): RiskStatus {
  const warnings: RiskWarning[] = [];

  // Run all detection functions
  const losingStreakWarning = detectLosingStreak(trades);
  if (losingStreakWarning) warnings.push(losingStreakWarning);

  const positionSizeWarning = detectPositionSizeEscalation(trades, evaluations);
  if (positionSizeWarning) warnings.push(positionSizeWarning);

  const frequencyWarning = detectTradingFrequencySpike(trades);
  if (frequencyWarning) warnings.push(frequencyWarning);

  const emotionalWarning = detectEmotionalRisk(journalEntries);
  if (emotionalWarning) warnings.push(emotionalWarning);

  // Calculate risk level and score
  const redWarnings = warnings.filter(w => w.level === RiskLevel.RED).length;
  const yellowWarnings = warnings.filter(w => w.level === RiskLevel.YELLOW).length;

  let level: RiskLevel;
  let score: number;
  let summary: string;

  if (redWarnings > 0) {
    level = RiskLevel.RED;
    score = 80 + (redWarnings * 5);
    summary = `High risk detected. ${redWarnings} critical warning${redWarnings > 1 ? 's' : ''} require immediate attention.`;
  } else if (yellowWarnings > 0) {
    level = RiskLevel.YELLOW;
    score = 40 + (yellowWarnings * 10);
    summary = `Moderate risk detected. ${yellowWarnings} warning${yellowWarnings > 1 ? 's' : ''} need monitoring.`;
  } else {
    level = RiskLevel.GREEN;
    score = Math.max(0, 30 - (trades.length > 0 ? 10 : 0)); // Lower score if actively trading without issues
    summary = "Trading discipline looks good. No active risk patterns detected.";
  }

  return {
    level,
    score: Math.min(100, score),
    activeWarnings: warnings,
    summary
  };
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.GREEN:
      return 'text-green-500';
    case RiskLevel.YELLOW:
      return 'text-yellow-500';
    case RiskLevel.RED:
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get risk level background color for UI display
 */
export function getRiskLevelBgColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.GREEN:
      return 'bg-green-500/20 border-green-500/30';
    case RiskLevel.YELLOW:
      return 'bg-yellow-500/20 border-yellow-500/30';
    case RiskLevel.RED:
      return 'bg-red-500/20 border-red-500/30';
    default:
      return 'bg-gray-500/20 border-gray-500/30';
  }
}

/**
 * Calculate trade risk metrics with dollar and percentage risk
 * Uses actual average loss instead of stop loss calculations for realistic risk assessment
 */
export function calculateTradeRiskMetrics(trades: Trade[], evaluations: Evaluation[]): TradeRiskMetrics[] {
  console.log('🔍 Trade Risk Analysis:', {
    totalTrades: trades.length,
    totalEvaluations: evaluations.length,
    sampleTradeDetails: trades.slice(0, 2).map(t => ({
      id: t.id,
      symbol: t.symbol,
      lots: t.lots,
      pnl: t.pnl,
      stopLoss: t.stopLoss,
      openPrice: t.openPrice,
      accountId: t.accountId
    }))
  });
  
  // Calculate actual average loss from losing trades
  const losingTrades = trades.filter(trade => trade.pnl < 0);
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length)
    : 0;
  
  console.log('📊 Average Loss Calculation:', {
    totalLosingTrades: losingTrades.length,
    avgLoss: avgLoss.toFixed(2),
    sampleLosses: losingTrades.slice(0, 3).map(t => t.pnl)
  });
  
  return trades.map(trade => {
    // Use improved balance resolution with confidence tracking
    const balanceResult = resolveAccountBalance(trade, evaluations, trades);
    const accountBalance = balanceResult.balance;
    
    // Use average loss as the risk measure instead of stop loss calculation
    const dollarRisk = avgLoss > 0 ? avgLoss : accountBalance * 0.02; // 2% fallback if no losses yet
    const percentageRisk = calculatePercentageRisk(dollarRisk, accountBalance);
    const riskRewardRatio = calculateRiskRewardRatio(trade, dollarRisk);
    
    // Debug individual trade calculations
    if (trade.id && (dollarRisk > 1000 || percentageRisk > 5)) {
      console.warn('🚨 High Risk Trade Detected:', {
        tradeId: trade.id,
        symbol: trade.symbol,
        accountBalance,
        dollarRisk,
        percentageRisk,
        confidence: balanceResult.confidence,
        source: balanceResult.source,
        method: 'average_loss'
      });
    }
    
    return {
      dollarRisk,
      percentageRisk,
      accountBalance,
      riskRewardRatio,
      avgLoss // Store for reference
    };
  });
}

/**
 * Generate enhanced risk warnings based on trading patterns
 */
export function generateEnhancedRiskWarnings(
  tradeRiskMetrics: TradeRiskMetrics[], 
  trades: Trade[]
): EnhancedRiskWarning[] {
  const warnings: EnhancedRiskWarning[] = [];
  const now = new Date();
  
  // Check if we have sufficient data
  if (tradeRiskMetrics.length < 5) {
    warnings.push({
      id: 'insufficient_data',
      type: 'insufficient_data',
      level: 'warning',
      title: 'Building Risk Profile',
      message: `Need ${5 - tradeRiskMetrics.length} more trades to analyze risk patterns`,
      recommendation: 'Continue trading to build your risk profile for better insights',
      confidence: 0.3,
      dataRequired: 5,
      dataAvailable: tradeRiskMetrics.length,
      timestamp: now,
      isActive: true
    });
    return warnings;
  }
  
  // Risk Escalation Detection (minimum 5 trades)
  const riskEscalation = detectRiskEscalation(tradeRiskMetrics, trades);
  if (riskEscalation) {
    warnings.push(riskEscalation);
  }
  
  // Excessive Risk Detection (minimum 10 trades for reliable average)
  if (tradeRiskMetrics.length >= 10) {
    const excessiveRisk = detectExcessiveRisk(tradeRiskMetrics);
    if (excessiveRisk) {
      warnings.push(excessiveRisk);
    }
  }
  
  // Poor Risk-Reward Detection (minimum 10 completed trades)
  if (tradeRiskMetrics.length >= 10) {
    const poorRiskReward = detectPoorRiskReward(tradeRiskMetrics, trades);
    if (poorRiskReward) {
      warnings.push(poorRiskReward);
    }
  }
  
  return warnings;
}

/**
 * Detect risk escalation after losses
 */
function detectRiskEscalation(tradeRiskMetrics: TradeRiskMetrics[], trades: Trade[]): EnhancedRiskWarning | null {
  if (tradeRiskMetrics.length < 10) return null; // Need sufficient data
  
  // Calculate historical average risk (excluding recent 3 trades for pattern detection)
  const historicalMetrics = tradeRiskMetrics.slice(0, -3);
  const avgHistoricalRisk = historicalMetrics.reduce((sum, metrics) => sum + metrics.percentageRisk, 0) / historicalMetrics.length;
  
  // Calculate historical average loss amount for context
  const historicalTrades = trades.slice(0, -3);
  const losingTrades = historicalTrades.filter(trade => trade.pnl < 0);
  const avgHistoricalLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length)
    : 0;
  
  // Analyze recent 3 trades for escalation patterns
  const recentTrades = trades.slice(-3);
  const recentMetrics = tradeRiskMetrics.slice(-3);
  
  for (let i = 0; i < recentTrades.length; i++) {
    const currentTrade = recentTrades[i];
    const currentMetrics = recentMetrics[i];
    
    // Check if this trade's risk is significantly higher than historical average
    // AND if it follows a loss (suggesting emotional revenge trading)
    const riskEscalation = (currentMetrics.percentageRisk - avgHistoricalRisk) / avgHistoricalRisk;
    
    // Look for preceding losses in recent trades
    const hasRecentLoss = i > 0 ? recentTrades[i - 1].pnl < 0 : 
                         trades.length > 3 ? trades[trades.length - 4].pnl < 0 : false;
    
    if (riskEscalation > 0.5 && hasRecentLoss) { // Risk 50%+ higher than average after a loss
      const level = riskEscalation > 1.0 ? 'critical' : 'warning'; // 100%+ = critical
      const riskIncreasePct = (riskEscalation * 100).toFixed(0);
      
      return {
        id: 'risk_escalation',
        type: 'risk_escalation',
        level,
        title: 'Risk Escalation Detected',
        message: `Risk ${riskIncreasePct}% higher than your ${avgHistoricalRisk.toFixed(1)}% average after recent loss. Current trade: ${currentMetrics.percentageRisk.toFixed(1)}%`,
        recommendation: `Your average risk is ${avgHistoricalRisk.toFixed(1)}%. After losses, maintain consistent risk levels to avoid emotional revenge trading.`,
        confidence: 0.85,
        dataRequired: 10,
        dataAvailable: trades.length,
        timestamp: new Date(),
        isActive: true,
        metrics: {
          previousRisk: avgHistoricalRisk,
          currentRisk: currentMetrics.percentageRisk
        }
      };
    }
  }
  
  return null;
}

/**
 * Detect excessive risk per trade
 */
function detectExcessiveRisk(tradeRiskMetrics: TradeRiskMetrics[]): EnhancedRiskWarning | null {
  const recent10Trades = tradeRiskMetrics.slice(-10);
  const avgRisk = recent10Trades.reduce((sum, metrics) => sum + metrics.percentageRisk, 0) / recent10Trades.length;
  
  if (avgRisk > 3) {
    const level = avgRisk > 5 ? 'critical' : 'warning';
    const avgDollarRisk = recent10Trades.reduce((sum, metrics) => sum + metrics.dollarRisk, 0) / recent10Trades.length;
    
    return {
      id: 'excessive_risk',
      type: 'excessive_risk',
      level,
      title: 'High Risk Per Trade',
      message: `Average risk: ${avgRisk.toFixed(1)}% ($${avgDollarRisk.toFixed(2)}) per trade (recommended: 1-2%)`,
      recommendation: 'Professional traders typically risk 1-2% per trade. Consider reducing position sizes.',
      confidence: 0.9,
      dataRequired: 10,
      dataAvailable: recent10Trades.length,
      timestamp: new Date(),
      isActive: true,
      metrics: {
        currentRisk: avgRisk
      }
    };
  }
  
  return null;
}

/**
 * Detect poor risk-reward ratios
 */
function detectPoorRiskReward(tradeRiskMetrics: TradeRiskMetrics[], trades: Trade[]): EnhancedRiskWarning | null {
  if (trades.length < 10) return null;
  
  // Use the same calculation as Overview tab: avgProfit / avgLoss
  const winningTrades = trades.filter(trade => trade.pnl > 0);
  const losingTrades = trades.filter(trade => trade.pnl < 0);
  
  if (winningTrades.length === 0 || losingTrades.length === 0) return null;
  
  const avgProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
  const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length);
  const avgRiskReward = avgLoss > 0 ? avgProfit / avgLoss : 0;
  
  if (avgRiskReward < 1.5) {
    const level = avgRiskReward < 1.0 ? 'critical' : 'warning';
    
    return {
      id: 'poor_risk_reward',
      type: 'poor_risk_reward',
      level,
      title: 'Poor Risk-Reward Ratio',
      message: `Average risk-reward ratio: ${avgRiskReward.toFixed(2)}:1 (aim for 2:1+)`,
      recommendation: 'Focus on trades with better risk-reward ratios. Let winners run longer or set tighter stops.',
      confidence: 0.8,
      dataRequired: 10,
      dataAvailable: trades.length,
      timestamp: new Date(),
      isActive: true,
      metrics: {
        avgRiskReward
      }
    };
  }
  
  return null;
}

/**
 * Calculate risk dashboard metrics
 */
export function calculateRiskDashboard(tradeRiskMetrics: TradeRiskMetrics[]): RiskDashboard {
  console.log('🔍 Risk Dashboard Calculation:', {
    totalTrades: tradeRiskMetrics.length,
    sampleBalances: tradeRiskMetrics.slice(0, 3).map(t => t.accountBalance),
    sampleDollarRisks: tradeRiskMetrics.slice(0, 3).map(t => t.dollarRisk),
    samplePercentRisks: tradeRiskMetrics.slice(0, 3).map(t => t.percentageRisk)
  });
  
  if (tradeRiskMetrics.length === 0) {
    return {
      avgRiskPerTrade: { dollars: 0, percentage: 0 },
      maxRiskPerTrade: { dollars: 0, percentage: 0, date: '' },
      riskTrend: 'stable',
      riskViolations: { over3Percent: 0, over5Percent: 0 },
      confidence: 0,
      dataPoints: 0
    };
  }
  
  // Calculate averages
  const avgDollars = tradeRiskMetrics.reduce((sum, m) => sum + m.dollarRisk, 0) / tradeRiskMetrics.length;
  const avgPercentage = tradeRiskMetrics.reduce((sum, m) => sum + m.percentageRisk, 0) / tradeRiskMetrics.length;
  
  // Find maximum risk
  const maxRiskTrade = tradeRiskMetrics.reduce((max, current) => 
    current.percentageRisk > max.percentageRisk ? current : max
  );
  
  // Calculate violations
  const over3Percent = tradeRiskMetrics.filter(m => m.percentageRisk > 3).length;
  const over5Percent = tradeRiskMetrics.filter(m => m.percentageRisk > 5).length;
  
  // Determine trend (simple: compare first half vs second half)
  const halfPoint = Math.floor(tradeRiskMetrics.length / 2);
  const firstHalfAvg = tradeRiskMetrics.slice(0, halfPoint)
    .reduce((sum, m) => sum + m.percentageRisk, 0) / halfPoint;
  const secondHalfAvg = tradeRiskMetrics.slice(halfPoint)
    .reduce((sum, m) => sum + m.percentageRisk, 0) / (tradeRiskMetrics.length - halfPoint);
  
  let riskTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  const trendDiff = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
  if (trendDiff > 0.2) riskTrend = 'increasing';
  else if (trendDiff < -0.2) riskTrend = 'decreasing';
  
  // Calculate confidence based on data quality
  const confidence = Math.min(tradeRiskMetrics.length / 20, 1); // Full confidence at 20+ trades
  
  return {
    avgRiskPerTrade: { dollars: avgDollars, percentage: avgPercentage },
    maxRiskPerTrade: { 
      dollars: maxRiskTrade.dollarRisk, 
      percentage: maxRiskTrade.percentageRisk, 
      date: new Date().toISOString() // Would need actual trade date
    },
    riskTrend,
    riskViolations: { over3Percent, over5Percent },
    confidence,
    dataPoints: tradeRiskMetrics.length
  };
}
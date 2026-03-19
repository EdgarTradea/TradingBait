





// Extended types for Prop Trading Challenges and Funding Journey
import { Evaluation, Trade } from 'utils/types';

export interface PropFirm {
  id: string;
  name: string;
  logo?: string;
  rules: {
    phases: 1 | 2;
    profitTarget: number; // percentage
    dailyLossLimit: number; // percentage
    totalLossLimit: number; // percentage
    minTradingDays: number;
    maxTradingDays?: number;
    weekendHolding: boolean;
    newsTrading: boolean;
    copyTrading: boolean;
    hedging: boolean;
    ea: boolean;
  };
}

export interface ChallengePhase {
  phaseNumber: 1 | 2;
  profitTarget: number; // dollar amount
  profitTargetPercent: number;
  maxLossLimit: number; // dollar amount
  maxLossLimitPercent: number;
  dailyLossLimit: number; // dollar amount
  dailyLossLimitPercent: number;
  minTradingDays: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ChallengeConfig {
  id: string;
  userId: string;
  accountId?: string; // Account ID for trade filtering
  propFirmId: string;
  propFirmName: string;
  accountSize: number;
  phases: ChallengePhase[];
  currentPhase: 1 | 2;
  challengeType: '1-phase' | '2-phase' | 'instant-funding';
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'passed' | 'failed' | 'abandoned';
}

export interface ChallengeProgress {
  challengeId: string;
  currentPnL: number;
  currentPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  peakBalance: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;
  maxDrawdownHit: number;
  maxDrawdownHitPercent: number;
  tradingDaysUsed: number;
  lastTradeDate?: string;
  isBreached: boolean;
  breachReason?: string;
  breachDate?: string;
  calculatedAt: string;
  actualStartDate: string;
}

export interface ChallengeHistory {
  id: string;
  userId: string;
  challengeId: string;
  propFirmName: string;
  accountSize: number;
  status: 'passed' | 'failed' | 'active' | 'abandoned';
  finalPnL: number;
  finalPnLPercent: number;
  durationDays: number;
  failureReason?: string;
  passedPhases: number;
  totalPhases: number;
  startDate: string;
  endDate?: string;
  lessons: string[];
  tags: string[];
}

export interface ChallengeAlert {
  id: string;
  challengeId: string;
  type: 'drawdown-warning' | 'profit-milestone' | 'time-warning' | 'breach-risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  triggeredAt: string;
  acknowledgedAt?: string;
}

export interface ChallengeInsight {
  type: 'success-pattern' | 'risk-pattern' | 'timing-insight' | 'improvement-suggestion';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionable: boolean;
  suggestedActions?: string[];
  relatedChallenges?: string[];
  dataPoints: {
    metric: string;
    value: number;
    context: string;
  }[];
}

// Default prop firm configurations
export const DEFAULT_PROP_FIRMS: PropFirm[] = [
  {
    id: 'ftmo',
    name: 'FTMO',
    rules: {
      phases: 2,
      profitTarget: 10, // 10% for phase 1, 5% for phase 2
      dailyLossLimit: 5,
      totalLossLimit: 10,
      minTradingDays: 4,
      maxTradingDays: 30,
      weekendHolding: true,
      newsTrading: true,
      copyTrading: false,
      hedging: false,
      ea: true
    }
  },
  {
    id: 'fundingpips',
    name: 'FundingPips',
    rules: {
      phases: 2,
      profitTarget: 8,
      dailyLossLimit: 4,
      totalLossLimit: 8,
      minTradingDays: 5,
      weekendHolding: true,
      newsTrading: false,
      copyTrading: false,
      hedging: true,
      ea: true
    }
  },
  {
    id: 'custom',
    name: 'Custom Firm',
    rules: {
      phases: 2,
      profitTarget: 10,
      dailyLossLimit: 5,
      totalLossLimit: 10,
      minTradingDays: 4,
      weekendHolding: true,
      newsTrading: true,
      copyTrading: false,
      hedging: false,
      ea: true
    }
  }
];

// Helper function to safely create dates and validate them
const safeDateToISOString = (date: Date | string | null | undefined): string => {
  if (!date) {
    return new Date().toISOString();
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date detected, using current date as fallback:', date);
    return new Date().toISOString();
  }
  
  return dateObj.toISOString();
};

// Helper functions
export const calculateChallengeProgress = (
  challenge: ChallengeConfig, 
  allTrades: Trade[]
): ChallengeProgress => {
  console.log('Calculating challenge progress for:', challenge.id);
  console.log('Challenge Account ID:', challenge.accountId);
  console.log('Challenge start date:', challenge.startDate);
  console.log('Total trades available:', allTrades.length);
  
  // Filter trades by Account ID if specified
  let relevantTrades = allTrades;
  if (challenge.accountId) {
    relevantTrades = allTrades.filter(trade => trade.accountId === challenge.accountId);
    console.log('Trades after Account ID filter (' + challenge.accountId + '):', relevantTrades.length);
  }
  
  // Use all relevant trades (like Analytics) instead of applying date filtering
  // This ensures consistency with Analytics/Dashboard calculations
  const challengeTrades = relevantTrades;
  
  console.log('Using all relevant trades for calculation:', challengeTrades.length);

  // Calculate actual start date (first trade date or challenge start date)
  const challengeStartDate = new Date(challenge.startDate);
  let actualStartDate: Date;
  
  if (challengeTrades.length > 0) {
    // Find the earliest valid trade date
    const tradeDates = challengeTrades
      .map(t => {
        const openTime = t.openTime ? new Date(t.openTime) : null;
        const closeTime = t.closeTime ? new Date(t.closeTime) : null;
        
        // Return the earliest valid date or null if both are invalid
        if (openTime && !isNaN(openTime.getTime()) && closeTime && !isNaN(closeTime.getTime())) {
          return Math.min(openTime.getTime(), closeTime.getTime());
        } else if (openTime && !isNaN(openTime.getTime())) {
          return openTime.getTime();
        } else if (closeTime && !isNaN(closeTime.getTime())) {
          return closeTime.getTime();
        }
        return null;
      })
      .filter(date => date !== null) as number[];
    
    if (tradeDates.length > 0) {
      actualStartDate = new Date(Math.min(...tradeDates));
    } else {
      console.warn('No valid trade dates found, using challenge start date');
      actualStartDate = challengeStartDate;
    }
  } else {
    actualStartDate = challengeStartDate;
  }

  // Calculate cumulative P&L using same method as Analytics (including commission + swap)
  const totalPnL = challengeTrades.reduce((sum, trade) => {
    const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
    const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
    const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
    return sum + (grossPnl + commission + swap);
  }, 0);
  const totalPnLPercent = (totalPnL / challenge.accountSize) * 100;
  
  console.log('Total P&L:', totalPnL, 'Percent:', totalPnLPercent);

  // Calculate today's P&L
  const today = new Date();
  const todayTrades = challengeTrades.filter(trade => {
    const tradeDate = new Date(trade.closeTime || trade.openTime);
    return tradeDate.toDateString() === today.toDateString();
  });
  const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const todayPnLPercent = (todayPnL / challenge.accountSize) * 100;

  // Calculate peak balance and drawdown
  let runningBalance = challenge.accountSize;
  let peakBalance = challenge.accountSize;
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  
  // Sort trades by date for proper balance calculation
  const sortedTrades = [...challengeTrades].sort((a, b) => {
    const dateA = new Date(a.closeTime || a.openTime).getTime();
    const dateB = new Date(b.closeTime || b.openTime).getTime();
    return dateA - dateB;
  });
  
  for (const trade of sortedTrades) {
    // Use same P&L calculation as total P&L (including commission + swap)
    const grossPnl = typeof trade.pnl === 'number' && !isNaN(trade.pnl) ? trade.pnl : 0;
    const commission = typeof trade.commission === 'number' && !isNaN(trade.commission) ? trade.commission : 0;
    const swap = typeof trade.swap === 'number' && !isNaN(trade.swap) ? trade.swap : 0;
    const netPnl = grossPnl + commission + swap;
    
    runningBalance += netPnl;
    peakBalance = Math.max(peakBalance, runningBalance);
    
    // Calculate drawdown from peak
    const drawdownFromPeak = peakBalance - runningBalance;
    maxDrawdown = Math.max(maxDrawdown, drawdownFromPeak);
  }
  
  // Current drawdown is from current peak
  currentDrawdown = peakBalance - runningBalance;
  const currentDrawdownPercent = (currentDrawdown / challenge.accountSize) * 100;
  const maxDrawdownPercent = (maxDrawdown / challenge.accountSize) * 100;

  // Calculate trading days used
  const uniqueTradingDays = new Set(
    challengeTrades.map(trade => {
      const tradeDate = new Date(trade.closeTime || trade.openTime);
      return tradeDate.toDateString();
    })
  ).size;

  // Get last trade date
  let lastTradeDate: string | undefined;
  if (challengeTrades.length > 0) {
    const tradeDates = challengeTrades
      .map(t => {
        const openTime = t.openTime ? new Date(t.openTime) : null;
        const closeTime = t.closeTime ? new Date(t.closeTime) : null;
        
        if (closeTime && !isNaN(closeTime.getTime())) {
          return closeTime.getTime();
        } else if (openTime && !isNaN(openTime.getTime())) {
          return openTime.getTime();
        }
        return null;
      })
      .filter(date => date !== null) as number[];
      
    if (tradeDates.length > 0) {
      lastTradeDate = safeDateToISOString(new Date(Math.max(...tradeDates)));
    }
  }

  // Check for breaches
  const currentPhase = challenge.phases[challenge.currentPhase - 1];
  let isBreached = false;
  let breachReason = undefined;
  
  // Check daily loss limit breach
  if (Math.abs(todayPnL) > currentPhase.dailyLossLimit) {
    isBreached = true;
    breachReason = `Daily loss limit exceeded: ${todayPnL.toFixed(2)} > ${currentPhase.dailyLossLimit}`;
  }
  
  // Check total loss limit breach
  if (currentDrawdownPercent > currentPhase.maxLossLimitPercent) {
    isBreached = true;
    breachReason = `Total loss limit exceeded: ${currentDrawdownPercent.toFixed(2)}% > ${currentPhase.maxLossLimitPercent}%`;
  }
  
  console.log('Challenge progress calculated:', {
    totalPnL,
    totalPnLPercent,
    currentDrawdownPercent,
    tradingDaysUsed: uniqueTradingDays,
    isBreached
  });
  
  return {
    challengeId: challenge.id,
    currentPnL: totalPnL,
    currentPnLPercent: totalPnLPercent,
    todayPnL,
    todayPnLPercent,
    peakBalance,
    currentDrawdown,
    currentDrawdownPercent,
    maxDrawdownHit: maxDrawdown,
    maxDrawdownHitPercent: maxDrawdownPercent,
    tradingDaysUsed: uniqueTradingDays,
    lastTradeDate,
    isBreached,
    breachReason,
    calculatedAt: safeDateToISOString(new Date()),
    actualStartDate: safeDateToISOString(actualStartDate)
  };
};

export const createChallengeConfig = (
  userId: string,
  propFirm: PropFirm,
  accountSize: number,
  customRules?: Partial<PropFirm['rules']>
): ChallengeConfig => {
  const rules = { ...propFirm.rules, ...customRules };
  
  const phases: ChallengePhase[] = [];
  
  if (rules.phases === 1) {
    phases.push({
      phaseNumber: 1,
      profitTarget: accountSize * (rules.profitTarget / 100),
      profitTargetPercent: rules.profitTarget,
      maxLossLimit: accountSize * (rules.totalLossLimit / 100),
      maxLossLimitPercent: rules.totalLossLimit,
      dailyLossLimit: accountSize * (rules.dailyLossLimit / 100),
      dailyLossLimitPercent: rules.dailyLossLimit,
      minTradingDays: rules.minTradingDays,
      isCompleted: false
    });
  } else {
    // Phase 1
    phases.push({
      phaseNumber: 1,
      profitTarget: accountSize * (rules.profitTarget / 100),
      profitTargetPercent: rules.profitTarget,
      maxLossLimit: accountSize * (rules.totalLossLimit / 100),
      maxLossLimitPercent: rules.totalLossLimit,
      dailyLossLimit: accountSize * (rules.dailyLossLimit / 100),
      dailyLossLimitPercent: rules.dailyLossLimit,
      minTradingDays: rules.minTradingDays,
      isCompleted: false
    });
    
    // Phase 2 (usually lower profit target)
    phases.push({
      phaseNumber: 2,
      profitTarget: accountSize * ((rules.profitTarget / 2) / 100), // Usually half the target
      profitTargetPercent: rules.profitTarget / 2,
      maxLossLimit: accountSize * (rules.totalLossLimit / 100),
      maxLossLimitPercent: rules.totalLossLimit,
      dailyLossLimit: accountSize * (rules.dailyLossLimit / 100),
      dailyLossLimitPercent: rules.dailyLossLimit,
      minTradingDays: rules.minTradingDays,
      isCompleted: false
    });
  }

  return {
    id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    propFirmId: propFirm.id,
    propFirmName: propFirm.name,
    accountSize,
    phases,
    currentPhase: 1,
    challengeType: rules.phases === 1 ? '1-phase' : '2-phase',
    startDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper function to check if phase target is met and advance phase
export const checkPhaseAdvancement = (
  challenge: ChallengeConfig,
  progress: ChallengeProgress
): { shouldAdvance: boolean; newPhase?: number; reason?: string } => {
  const currentPhase = challenge.phases[challenge.currentPhase - 1];
  
  // Check if current profit target is met
  const targetMet = progress.currentPnL >= currentPhase.profitTarget;
  
  if (!targetMet) {
    return { shouldAdvance: false };
  }

  // Check if this is the last phase
  if (challenge.currentPhase >= challenge.phases.length) {
    return { 
      shouldAdvance: false, 
      reason: 'Challenge completed - all phases passed' 
    };
  }

  // Phase advancement logic
  const nextPhase = challenge.currentPhase + 1;
  
  return {
    shouldAdvance: true,
    newPhase: nextPhase,
    reason: `Phase ${challenge.currentPhase} target of $${currentPhase.profitTarget.toLocaleString()} achieved`
  };
};

// Convert evaluation to challenge format for compatibility
export const convertEvaluationToChallenge = (evaluation: Evaluation): ChallengeConfig => {
  // Add null check to prevent crashes
  if (!evaluation) {
    console.warn('Evaluation is null or undefined, skipping');
    // Return a safe fallback instead of throwing
    return null as any;
  }
  
  // Handle missing or empty ID gracefully with fallback
  const evaluationId = evaluation.id || `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  if (!evaluation.id) {
    console.warn(`Evaluation missing ID, using fallback: ${evaluationId}`, evaluation);
  }
  
  // Use evaluation balance or initialBalance as account size
  const accountSize = evaluation.balance || evaluation.initialBalance || 100000; // Default $100k
  
  // Create phases based on evaluation data
  const phases: ChallengePhase[] = [
    {
      phaseNumber: 1,
      profitTarget: evaluation.target || (accountSize * 0.1), // 10% default
      profitTargetPercent: 10,
      maxLossLimit: evaluation.lossLimits || (accountSize * 0.1), // 10% default
      maxLossLimitPercent: 10,
      dailyLossLimit: evaluation.dailyLossLimit || (accountSize * 0.05), // 5% default
      dailyLossLimitPercent: 5,
      minTradingDays: 4,
      isCompleted: false
    }
  ];

  // Map evaluation status to challenge status format
  let challengeStatus: 'active' | 'passed' | 'failed' | 'abandoned';
  switch (evaluation.status) {
    case 'active':
      challengeStatus = 'active';
      break;
    case 'passed':
    case 'completed':
      challengeStatus = 'passed';
      break;
    case 'failed':
      challengeStatus = 'failed';
      break;
    default:
      challengeStatus = 'active';
  }

  return {
    id: evaluationId,
    userId: evaluation.userId || '',
    accountId: evaluation.accountId, // Include Account ID for filtering
    propFirmId: (evaluation.firm || 'unknown').toLowerCase().replace(/\s+/g, ''),
    propFirmName: evaluation.firm || 'Unknown Firm',
    accountSize,
    phases,
    currentPhase: 1 as 1 | 2,
    challengeType: '1-phase' as '1-phase' | '2-phase' | 'instant-funding',
    startDate: evaluation.createdAt || new Date().toISOString(),
    isActive: evaluation.status === 'active',
    status: challengeStatus,
    createdAt: evaluation.createdAt || new Date().toISOString(),
    updatedAt: evaluation.updatedAt || evaluation.createdAt || new Date().toISOString()
  };
};

import { Evaluation, Trade } from './types';

/**
 * Calculate pip size for different instrument types
 */
export function getPipSize(symbol: string): number {
  if (!symbol) return 0.0001; // Default for major pairs
  
  // Indices use point movements (1.0 pip size)
  if (symbol.includes('US100') || symbol.includes('US30') || symbol.includes('SPX') || 
      symbol.includes('NAS') || symbol.includes('DAX') || symbol.includes('FTSE')) {
    return 1.0;
  }
  
  // Gold/Silver use 0.01 pip size  
  if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('GOLD') || symbol.includes('SILVER')) {
    return 0.01;
  }
  
  // JPY pairs use 2 decimal places (0.01 pip size)
  if (symbol.includes('JPY')) {
    return 0.01;
  }
  
  // Most major pairs use 4 decimal places (0.0001 pip size)
  // EUR/USD, GBP/USD, AUD/USD, etc.
  return 0.0001;
}

/**
 * Calculate pip value for a given symbol and lot size
 * This replaces the hardcoded "$10 per pip" calculation
 */
export function calculatePipValue(symbol: string, lotSize: number, accountBalance: number): number {
  if (!symbol || lotSize <= 0) return 0;
  
  // Indices (US100, US30, etc.): 1 point = $1 per 0.01 lot
  if (symbol.includes('US100') || symbol.includes('US30') || symbol.includes('SPX') || 
      symbol.includes('NAS') || symbol.includes('DAX') || symbol.includes('FTSE')) {
    return lotSize * 10; // $1 per point per 0.1 lot = $10 per point per 1.0 lot
  }
  
  // Gold/Silver: 1 pip = $1 per 0.01 lot
  if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('GOLD') || symbol.includes('SILVER')) {
    return lotSize * 1; // $1 per pip per 0.01 lot = $100 per pip per 1.0 lot  
  }
  
  // Forex pairs: 1 pip = $10 per standard lot (1.0) for USD-based accounts
  // Major pairs: EUR/USD, GBP/USD, AUD/USD, etc.
  // JPY pairs: USD/JPY, EUR/JPY, GBP/JPY, etc.
  const baseValue = 10; // Base value per standard lot for USD account
  
  // Account for different lot sizes
  // Standard lot = 1.0, Mini lot = 0.1, Micro lot = 0.01
  const pipValue = baseValue * lotSize;
  
  return pipValue;
}

/**
 * Improved account balance resolution with better fallback logic
 */
export function resolveAccountBalance(
  trade: Trade,
  evaluations: Evaluation[],
  allTrades: Trade[]
): { balance: number; source: 'evaluation' | 'active_fallback' | 'estimated_fallback'; confidence: number } {
  // First try to find exact evaluation match
  const evaluation = evaluations.find(
    (account) => account.accountId === trade.accountId,
  );
  
  if (evaluation) {
    const balance = getAccountBalanceForTrade(trade, [evaluation], allTrades);
    return { balance, source: 'evaluation', confidence: 0.95 };
  }
  
  // Try to find any active evaluation as fallback
  const activeEvaluation = evaluations.find(e => e.status === 'active');
  if (activeEvaluation) {
    const balance = calculateCurrentBalance(activeEvaluation);
    console.warn(`Using active evaluation balance for trade ${trade.id}: $${balance}`);
    return { balance, source: 'active_fallback', confidence: 0.7 };
  }
  
  // Last resort: estimate based on trade characteristics
  const estimatedBalance = estimateBalanceFromTrade(trade, allTrades);
  console.warn(`Using estimated balance for trade ${trade.id}: $${estimatedBalance}`);
  return { balance: estimatedBalance, source: 'estimated_fallback', confidence: 0.3 };
}

/**
 * Estimate account balance based on trade characteristics and patterns
 */
function estimateBalanceFromTrade(trade: Trade, allTrades: Trade[]): number {
  // Look for similar trades or patterns to estimate reasonable balance
  const similarTrades = allTrades.filter(t => 
    t.symbol === trade.symbol && 
    t.accountId === trade.accountId &&
    Math.abs(new Date(t.closeTime).getTime() - new Date(trade.closeTime).getTime()) < 30 * 24 * 60 * 60 * 1000 // Within 30 days
  );
  
  if (similarTrades.length > 0) {
    // Estimate based on position sizes and risk patterns
    const avgLotSize = similarTrades.reduce((sum, t) => sum + (t.lots || 0), 0) / similarTrades.length;
    
    if (avgLotSize >= 10) {
      return 200000; // Large lot sizes suggest larger account
    } else if (avgLotSize >= 1) {
      return 100000; // Standard lot sizes
    } else if (avgLotSize >= 0.1) {
      return 50000;  // Mini lots
    }
  }
  
  // Final fallback - conservative estimate
  return 50000;
}

/**
 * Calculate current account balance from evaluation data
 */
export function calculateCurrentBalance(evaluation: Evaluation): number {
  let balance = evaluation.initialBalance || 0;
  
  // Add deposits and subtract withdrawals from transactions
  if (evaluation.transactions) {
    evaluation.transactions.forEach(transaction => {
      if (transaction.type === 'deposit') {
        balance += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        balance -= transaction.amount;
      }
    });
  }
  
  // Handle legacy withdrawals array
  if (evaluation.withdrawals) {
    evaluation.withdrawals.forEach(withdrawal => {
      balance -= withdrawal.amount;
    });
  }
  
  return balance;
}

/**
 * Estimate historical account balance at a specific trade date
 */
export function estimateBalanceAtDate(
  evaluation: Evaluation, 
  targetDate: string, 
  trades: Trade[]
): number {
  const currentBalance = calculateCurrentBalance(evaluation);
  
  // Get all trades after the target date for this account
  const tradesAfterDate = trades
    .filter(trade => {
      const tradeDate = new Date(trade.closeTime);
      const target = new Date(targetDate);
      return trade.accountId === evaluation.accountId && tradeDate > target;
    })
    .sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
  
  // Subtract P&L from trades that happened after target date
  let estimatedBalance = currentBalance;
  tradesAfterDate.forEach(trade => {
    estimatedBalance -= trade.pnl;
  });
  
  return Math.max(estimatedBalance, evaluation.initialBalance || 0);
}

/**
 * Get account balance for a specific trade
 */
export function getAccountBalanceForTrade(
  trade: Trade,
  evaluations: Evaluation[],
  allTrades: Trade[]
): number {
  // Find the evaluation for this trade
  const evaluation = evaluations.find(
    (account) => account.accountId === trade.accountId,
  );
  
  if (!evaluation) {
    // Note: Using fallback balance for trades without evaluation records
    // This can happen with imported trades or deleted accounts
    
    // Try to find the closest evaluation by account pattern or user default
    const defaultEvaluation = evaluations.find(e => e.status === 'active');
    if (defaultEvaluation) {
      return calculateCurrentBalance(defaultEvaluation);
    }
    
    // Last resort: use a more reasonable fallback based on typical account sizes
    // but log this for debugging
    console.warn('No evaluation found for trade', trade.id, 'using fallback balance');
    return 50000; // More realistic prop firm evaluation size
  }
  
  // If trade is recent (last 7 days), use current balance
  const tradeDate = new Date(trade.closeTime);
  const now = new Date();
  const daysDiff = (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDiff <= 7) {
    return calculateCurrentBalance(evaluation);
  }
  
  // For older trades, estimate historical balance
  return estimateBalanceAtDate(evaluation, trade.closeTime, allTrades);
}

/**
 * Calculate dollar risk for a trade based on position size and stop loss
 * Properly handles BUY vs SELL trade directions
 */
export function calculateDollarRisk(trade: Trade, accountBalance: number): number {
  // If we have stop loss data, calculate precise risk based on trade direction
  if (trade.stopLoss && trade.openPrice && trade.lots) {
    const lotSize = trade.lots;
    
    // Calculate risk based on trade direction
    let priceDiff: number;
    if (trade.type === 'buy') {
      // BUY: Risk = (Entry Price - Stop Loss) × Position Size
      priceDiff = Math.abs(trade.openPrice - trade.stopLoss);
    } else if (trade.type === 'sell') {
      // SELL: Risk = (Stop Loss - Entry Price) × Position Size  
      priceDiff = Math.abs(trade.stopLoss - trade.openPrice);
    } else {
      // Unknown direction, use absolute difference
      priceDiff = Math.abs(trade.openPrice - trade.stopLoss);
    }
    
    // Improved Forex risk calculation with dynamic pip values
    const pipValue = calculatePipValue(trade.symbol, lotSize, accountBalance);
    const pipSize = getPipSize(trade.symbol);
    const pipsRisk = priceDiff / pipSize;
    
    // Use calculated pip value instead of hardcoded $10 per pip
    const dollarRisk = pipsRisk * pipValue;
    
    return dollarRisk;
  }
  
  // Fallback: estimate intended risk, NOT actual loss
  // Problem: We don't want to use actual P&L as "risk" because:
  // - Risk is what you INTENDED to lose (stop loss)
  // - Actual P&L is what you ACTUALLY lost (could be early exit)
  
  // For trades without stop loss data, estimate reasonable risk based on:
  // 1. Account size (professional standard: 1-2% per trade)
  // 2. Position size if available
  // 3. Market volatility estimates
  
  if (trade.lots && trade.lots > 0) {
    // Estimate risk based on position size and account balance
    // Scale risk estimate based on lot size (larger positions = higher risk)
    const baseRiskPercent = 0.01; // 1% base risk
    const lotMultiplier = Math.min(trade.lots * 0.5, 2.0); // Scale by lot size, cap at 2x
    const estimatedRiskPercent = baseRiskPercent * lotMultiplier;
    return accountBalance * estimatedRiskPercent;
  }
  
  // Final fallback: use 1% of account balance as default risk assumption
  // This is conservative and aligns with professional risk management
  return accountBalance * 0.01;
}

/**
 * Calculate percentage risk for a trade
 */
export function calculatePercentageRisk(dollarRisk: number, accountBalance: number): number {
  if (accountBalance <= 0) return 0;
  return (dollarRisk / accountBalance) * 100;
}

/**
 * Calculate risk-reward ratio for a trade
 */
export function calculateRiskRewardRatio(trade: Trade, dollarRisk: number): number | undefined {
  if (dollarRisk <= 0 || trade.pnl <= 0) return undefined;
  
  return trade.pnl / dollarRisk;
}

/**
 * Filter evaluations by account type
 */
export function filterEvaluationsByType(
  evaluations: Evaluation[], 
  accountType?: 'evaluation' | 'live'
): Evaluation[] {
  if (!accountType) return evaluations;
  return evaluations.filter((account) => account.accountType === accountType);
}

/**
 * Get the most recent evaluation for account balance calculations
 */
export function getMostRecentEvaluation(evaluations: Evaluation[]): Evaluation | null {
  if (evaluations.length === 0) return null;
  
  return evaluations.reduce((latest, current) => {
    const latestDate = new Date(latest.updatedAt || latest.createdAt || 0);
    const currentDate = new Date(current.updatedAt || current.createdAt || 0);
    
    return currentDate > latestDate ? current : latest;
  });
}
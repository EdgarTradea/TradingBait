


// This file will define the types for our data structures

export interface Trade {
  id?: string;
  ticket?: number;
  userId?: string;
  accountId?: string; // Optional for manually added trades for now
  evaluationId?: string; // Links trade to specific evaluation for filtering
  symbol: string;
  type?: "buy" | "sell" | string;
  openTime: string;
  closeTime: string;
  lots?: number;
  pnl: number;
  stopLoss?: number;
  takeProfit?: number;
  commission?: number;
  swap?: number;
  openPrice?: number;
  closePrice?: number;
  tags?: string[];
  notes?: string; // Analysis and notes field
}

export interface Evaluation {
  id: string;
  userId: string;
  accountId: string;
  firm: string;
  status: "active" | "passed" | "failed";
  cost: number;
  target: number;
  progress: number;
  lossLimits: number;
  dailyLossLimit: number;
  accountType?: "evaluation" | "live" | "personal";
  initialBalance?: number;
  balance?: number; // Current account balance from imports
  highPerformanceThreshold?: number; // Optional percentage threshold for high performance days (e.g., 0.3 for 0.3%)
  transactions?: {
    type: "deposit" | "withdrawal" | "refund";
    amount: number;
    date: string;
  }[];
  withdrawals?: {
    amount: number;
    date: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

// New interfaces for enhanced risk management
export interface TradeRiskMetrics {
  dollarRisk: number;
  percentageRisk: number;
  accountBalance: number;
  riskRewardRatio?: number;
  stopLossDistance?: number;
}

export interface RiskDashboard {
  avgRiskPerTrade: { dollars: number; percentage: number };
  maxRiskPerTrade: { dollars: number; percentage: number; date: string };
  riskTrend: 'increasing' | 'decreasing' | 'stable';
  riskViolations: { over3Percent: number; over5Percent: number };
  confidence: number; // 0-1, based on data quality
  dataPoints: number; // Number of trades analyzed
}

export interface EnhancedRiskWarning {
  id: string;
  type: 'risk_escalation' | 'excessive_risk' | 'poor_risk_reward' | 'insufficient_data';
  level: 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  confidence: number; // 0-1
  dataRequired: number; // Minimum trades needed
  dataAvailable: number; // Current trades available
  timestamp: Date;
  isActive: boolean;
  metrics?: {
    previousRisk?: number;
    currentRisk?: number;
    avgRiskReward?: number;
    violationCount?: number;
  };
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  mood: 'excited' | 'confident' | 'neutral' | 'anxious' | 'frustrated';
  marketConditions: 'trending' | 'ranging' | 'volatile' | 'quiet';
  notes: string;
  habits: {
    [habitId: string]: boolean;
  };
  newsEvents?: boolean; // New field for news event tracking
  impactLevel?: 'low' | 'medium' | 'high'; // Impact level of news events
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: 'mental' | 'technical' | 'risk' | 'discipline';
  isActive: boolean;
  streak: number;
  bestStreak: number;
  createdAt: string;
  isCustom?: boolean;
}

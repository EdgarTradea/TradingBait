
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DollarSign,
  Activity,
  Trophy,
  Users,
  TrendingUp,
  Shield,
  Brain,
  Info
} from 'lucide-react';
import { Evaluation, Trade } from 'utils/types';

interface Props {
  totalInvestment: number;
  evaluations: Evaluation[];
  trades: Trade[];
  financialSummary: {
    totalWithdrawals: number;
    totalRefunds: number;
    netBusinessRevenue: number;
    totalCashFlow: number;
  };
}

export const BusinessKPICards: React.FC<Props> = ({
  totalInvestment,
  evaluations,
  trades,
  financialSummary
}) => {
  // Calculate metrics from evaluations data
  const activeChallenges = evaluations.filter(e => e.status === 'active' && e.accountType === 'evaluation');
  const fundedAccounts = evaluations.filter(e => e.accountType === 'funded');
  const passedEvaluations = evaluations.filter(e => e.status === 'passed');
  
  // Calculate floating challenges capital
  const floatingChallenges = activeChallenges.reduce((sum, e) => sum + (e.initialBalance || 0), 0);
  
  // Calculate total funding from funded accounts
  const totalFunding = fundedAccounts.reduce((sum, e) => sum + (e.initialBalance || 0), 0);
  
  // Calculate monthly profit from funded accounts only
  const fundedAccountIds = fundedAccounts.map(e => e.accountId);
  const fundedEvaluationIds = fundedAccounts.map(e => e.id);
  const fundedTrades = trades.filter(trade => {
    // Method 1: Check direct evaluationId field (for manual trades)
    if (fundedEvaluationIds.includes(trade.evaluationId)) {
      return true;
    }
    
    // Method 2: Check accountId field (for imported trades)
    if (fundedAccountIds.includes(trade.accountId)) {
      return true;
    }
    
    return false;
  });
  
  // Get current month trades
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyFundedTrades = fundedTrades.filter(trade => {
    const tradeDate = new Date(trade.openTime);
    return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
  });
  
  const monthlyProfit = monthlyFundedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  const InfoTooltip = ({ content }: { content: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-3 w-3 text-gray-400 hover:text-white transition-colors cursor-pointer ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded">
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs bg-gray-800 text-white border-gray-700 z-50 p-3">
        <p className="text-sm">{content}</p>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {/* Total Investment - cost of evaluation fees */}
      <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30 backdrop-blur-sm hover:from-blue-800/60 hover:to-blue-700/40 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-200 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Total Investment
            <InfoTooltip content="Total amount spent on evaluation fees across all prop trading challenges" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${totalInvestment.toLocaleString()}</div>
          <p className="text-xs text-blue-300 mt-1">Evaluation fees paid</p>
        </CardContent>
      </Card>

      {/* Active Challenges - Current ongoing challenges with potential funding capital shown */}
      <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30 backdrop-blur-sm hover:from-green-800/60 hover:to-green-700/40 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-200 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Active Challenges
            <InfoTooltip content="Number of evaluation challenges currently in progress with their total potential funding capital" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{activeChallenges.length}</div>
          <p className="text-xs text-green-300 mt-1">${floatingChallenges.toLocaleString()} potential capital</p>
        </CardContent>
      </Card>

      {/* Funded Accounts - Number of funded accounts with capital shown */}
      <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border-emerald-500/30 backdrop-blur-sm hover:from-emerald-800/60 hover:to-emerald-700/40 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-200 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Funded Accounts
            <InfoTooltip content="Number of active funded trading accounts with their total available capital for trading" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{fundedAccounts.length}</div>
          <p className="text-xs text-emerald-300 mt-1">${totalFunding.toLocaleString()} total capital</p>
        </CardContent>
      </Card>

      {/* Monthly Profit - Profit from funded account trading this month */}
      <Card className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 border-cyan-500/30 backdrop-blur-sm hover:from-cyan-800/60 hover:to-cyan-700/40 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-200 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Monthly Profit
            <InfoTooltip content="Total profit/loss from trading on funded accounts during the current month" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${monthlyProfit >= 0 ? '+' : ''}${monthlyProfit.toLocaleString()}
          </div>
          <p className="text-xs text-cyan-300 mt-1">From funded accounts</p>
        </CardContent>
      </Card>

      {/* Total Returns - Withdrawal + refunds */}
      <Card className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 border-amber-500/30 backdrop-blur-sm hover:from-amber-800/60 hover:to-amber-700/40 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-amber-200 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Total Returns
            <InfoTooltip content="Total amount received back through profit withdrawals and evaluation fee refunds" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            ${(financialSummary.totalWithdrawals + financialSummary.totalRefunds).toLocaleString()}
          </div>
          <p className="text-xs text-amber-300 mt-1">Withdrawals + Refunds</p>
        </CardContent>
      </Card>

      {/* Net Business Profit - Returns - Investment */}
      <Card className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 border-indigo-500/30 backdrop-blur-sm hover:from-indigo-800/60 hover:to-indigo-700/40 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-indigo-200 flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Net Business Profit
            <InfoTooltip content="Overall business profitability: total returns minus total investment in evaluation fees" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (financialSummary.totalWithdrawals + financialSummary.totalRefunds - totalInvestment) >= 0 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            {(financialSummary.totalWithdrawals + financialSummary.totalRefunds - totalInvestment) >= 0 ? '+' : ''}
            ${(financialSummary.totalWithdrawals + financialSummary.totalRefunds - totalInvestment).toLocaleString()}
          </div>
          <p className="text-xs text-indigo-300 mt-1">Returns - Investment</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessKPICards;

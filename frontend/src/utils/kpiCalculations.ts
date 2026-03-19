import { Trade } from "utils/types";

export const calculateKpis = (trades: Trade[]) => {
  const totalTrades = trades.length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  if (totalTrades === 0) {
    return {
      totalPnl: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgProfit: 0,
      avgLoss: 0,
      avgRRR: 0,
      totalLots: 0,
      expectancy: 0,
    };
  }

  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl < 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = losingTrades.reduce((sum, t) => sum + t.pnl, 0);

  const winRate = (winningTrades.length / totalTrades) * 100;
  const lossRate = 100 - winRate;

  const avgProfit = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

  const profitFactor = grossLoss !== 0 ? Math.abs(grossProfit / grossLoss) : 0;
  
  const avgRRR = avgLoss !== 0 ? Math.abs(avgProfit / avgLoss) : 0;

  const totalLots = trades.reduce((sum, t) => sum + t.lots, 0);

  const expectancy = (winRate / 100 * avgProfit) - (lossRate / 100 * Math.abs(avgLoss));

  return {
    totalPnl,
    totalTrades,
    winRate,
    profitFactor,
    avgProfit,
    avgLoss,
    avgRRR,
    totalLots,
    expectancy,
  };
};

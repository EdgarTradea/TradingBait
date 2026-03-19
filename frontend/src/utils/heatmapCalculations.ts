import { Trade } from "./types";
import { format } from "date-fns-tz";

export interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  count?: number;
  label?: string;
}

export interface TradingSessionData {
  session: string;
  timeRange: string;
  pnl: number;
  winRate: number;
  totalTrades: number;
  avgTrade: number;
}

/**
 * Generate time-of-day heatmap data
 */
export function generateTimeOfDayHeatmap(trades: Trade[], timezone: string = "UTC"): HeatmapData[] {
  const hourlyData: { [hour: number]: { pnl: number; count: number } } = {};
  
  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = { pnl: 0, count: 0 };
  }
  
  trades.forEach(trade => {
    const hour = parseInt(format(new Date(trade.closeTime), 'H', { timeZone: timezone }));
    const pnl = trade.pnl;
    
    hourlyData[hour].pnl += pnl;
    hourlyData[hour].count += 1;
  });
  
  return Object.entries(hourlyData).map(([hour, data]) => ({
    x: parseInt(hour),
    y: 0, // Single row for time of day
    value: data.pnl,
    count: data.count,
    label: `${hour}:00 - ${data.count} trades, $${data.pnl.toFixed(2)}`,
  }));
}

/**
 * Generate day-of-week heatmap data
 */
export function generateDayOfWeekHeatmap(trades: Trade[], timezone: string = "UTC"): HeatmapData[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyData: { [day: number]: { pnl: number; count: number } } = {};
  
  // Initialize all days
  for (let day = 0; day < 7; day++) {
    dailyData[day] = { pnl: 0, count: 0 };
  }
  
  trades.forEach(trade => {
    const isoDay = parseInt(format(new Date(trade.closeTime), 'i', { timeZone: timezone }));
    // Convert ISO day (1-7, Mon-Sun) to 0-6 (Sun-Sat)
    const day = isoDay === 7 ? 0 : isoDay;
    const pnl = trade.pnl;
    
    dailyData[day].pnl += pnl;
    dailyData[day].count += 1;
  });
  
  return Object.entries(dailyData).map(([day, data]) => ({
    x: parseInt(day),
    y: 0, // Single row for day of week
    value: data.pnl,
    count: data.count,
    label: `${dayNames[parseInt(day)]} - ${data.count} trades, $${data.pnl.toFixed(2)}`,
  }));
}

/**
 * Generate trading session performance heatmap
 */
export function generateTradingSessionHeatmap(trades: Trade[]): TradingSessionData[] {
  const sessions = [
    { name: 'Sydney', start: 21, end: 5, utcOffset: 0 },
    { name: 'Tokyo', start: 0, end: 8, utcOffset: 0 },
    { name: 'London', start: 8, end: 16, utcOffset: 0 },
    { name: 'New York', start: 13, end: 21, utcOffset: 0 },
  ];
  
  return sessions.map(session => {
    const sessionTrades = trades.filter(trade => {
      const hour = new Date(trade.closeTime).getUTCHours();
      
      if (session.start > session.end) {
        // Handle overnight session (Sydney)
        return hour >= session.start || hour < session.end;
      }
      return hour >= session.start && hour < session.end;
    });
    
    const totalPnl = sessionTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winningTrades = sessionTrades.filter(trade => trade.pnl > 0).length;
    const winRate = sessionTrades.length > 0 ? (winningTrades / sessionTrades.length) * 100 : 0;
    const avgTrade = sessionTrades.length > 0 ? totalPnl / sessionTrades.length : 0;
    
    return {
      session: session.name,
      timeRange: session.start > session.end 
        ? `${session.start}:00 - ${session.end + 24}:00 UTC`
        : `${session.start}:00 - ${session.end}:00 UTC`,
      pnl: totalPnl,
      winRate,
      totalTrades: sessionTrades.length,
      avgTrade,
    };
  });
}

/**
 * Generate month vs hour heatmap for comprehensive time analysis - only shows periods with actual trades
 */
export function generateMonthHourHeatmap(trades: Trade[], timezone: string = "UTC"): HeatmapData[] {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const heatmapData: { [key: string]: { pnl: number; count: number; month: number; hour: number } } = {};
  
  // Collect data only for periods with trades
  trades.forEach(trade => {
    const date = new Date(trade.closeTime);
    // Month is 1-12 from format, convert to 0-11
    const month = parseInt(format(date, 'M', { timeZone: timezone })) - 1;
    const hour = parseInt(format(date, 'H', { timeZone: timezone }));
    const key = `${month}-${hour}`;
    
    if (!heatmapData[key]) {
      heatmapData[key] = { pnl: 0, count: 0, month, hour };
    }
    
    heatmapData[key].pnl += trade.pnl;
    heatmapData[key].count += 1;
  });
  
  // Only return data for periods that have trades
  return Object.values(heatmapData).map(data => ({
    x: data.hour,
    y: data.month,
    value: data.pnl,
    count: data.count,
    label: `${monthNames[data.month]} ${data.hour}:00 - ${data.count} trades, $${data.pnl.toFixed(2)}`,
  }));
}

/**
 * Generate symbol performance heatmap
 */
export function generateSymbolPerformanceHeatmap(trades: Trade[]): HeatmapData[] {
  const symbolData: { [symbol: string]: { pnl: number; count: number } } = {};
  
  trades.forEach(trade => {
    if (!symbolData[trade.symbol]) {
      symbolData[trade.symbol] = { pnl: 0, count: 0 };
    }
    
    symbolData[trade.symbol].pnl += trade.pnl;
    symbolData[trade.symbol].count += 1;
  });
  
  return Object.entries(symbolData)
    .map(([symbol, data], index) => ({
      x: 0, // Single column
      y: index,
      value: data.pnl,
      count: data.count,
      label: `${symbol} - ${data.count} trades, $${data.pnl.toFixed(2)}`,
    }))
    .sort((a, b) => b.value - a.value); // Sort by performance
}

/**
 * Generate emotional state vs performance heatmap
 */
export function generateEmotionalStateHeatmap(trades: Trade[], journalEntries: any[]): HeatmapData[] {
  // Map of common mood categories to group similar emotions
  const moodCategories: { [key: string]: string[] } = {
    'Confident': ['confident', 'optimistic', 'bullish', 'excited', 'motivated'],
    'Calm': ['calm', 'relaxed', 'focused', 'patient', 'balanced'],
    'Neutral': ['neutral', 'okay', 'fine', 'normal', 'average'],
    'Anxious': ['anxious', 'worried', 'nervous', 'uncertain', 'stressed'],
    'Frustrated': ['frustrated', 'angry', 'annoyed', 'impatient', 'disappointed'],
    'Fearful': ['fearful', 'scared', 'panicked', 'bearish', 'cautious']
  };

  // Create a map of dates to moods from journal entries
  const dateToMood: { [dateStr: string]: string } = {};
  journalEntries.forEach(entry => {
    if (entry.mood && entry.date) {
      const dateStr = new Date(entry.date).toDateString();
      // Categorize the mood
      let category = 'Neutral';
      const moodLower = entry.mood.toLowerCase();
      
      for (const [cat, moods] of Object.entries(moodCategories)) {
        if (moods.some(m => moodLower.includes(m))) {
          category = cat;
          break;
        }
      }
      dateToMood[dateStr] = category;
    }
  });

  // Group trades by emotional state
  const emotionalData: { [mood: string]: { pnl: number; count: number } } = {
    'Confident': { pnl: 0, count: 0 },
    'Calm': { pnl: 0, count: 0 },
    'Neutral': { pnl: 0, count: 0 },
    'Anxious': { pnl: 0, count: 0 },
    'Frustrated': { pnl: 0, count: 0 },
    'Fearful': { pnl: 0, count: 0 }
  };

  trades.forEach(trade => {
    const tradeDateStr = new Date(trade.closeTime).toDateString();
    const mood = dateToMood[tradeDateStr] || 'Neutral';
    const pnl = trade.pnl;
    
    if (emotionalData[mood]) {
      emotionalData[mood].pnl += pnl;
      emotionalData[mood].count += 1;
    }
  });

  // Convert to heatmap format, only including moods with trades
  return Object.entries(emotionalData)
    .filter(([_, data]) => data.count > 0)
    .map(([mood, data]) => ({
      x: mood,
      y: 0,
      value: data.pnl,
      count: data.count,
      label: `${mood} - ${data.count} trades, $${data.pnl.toFixed(2)} P&L`,
    }))
    .sort((a, b) => (b.value / (b.count || 1)) - (a.value / (a.count || 1))); // Sort by average P&L per trade
}
export function calculateHeatmapColor(value: number, minValue: number, maxValue: number): string {
  if (value === 0) return 'rgb(64, 64, 64)'; // Neutral gray for zero
  
  const absMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
  const intensity = Math.abs(value) / absMax;
  
  if (value > 0) {
    // Green for profits
    const green = Math.floor(139 + (255 - 139) * intensity); // From dark green to bright green
    return `rgb(0, ${green}, 0)`;
  } else {
    // Red for losses
    const red = Math.floor(139 + (255 - 139) * intensity); // From dark red to bright red
    return `rgb(${red}, 0, 0)`;
  }
}

/**
 * Get heatmap cell size based on trade count
 */
export function getHeatmapCellSize(count: number, maxCount: number): number {
  const minSize = 20;
  const maxSize = 50;
  const ratio = count / maxCount;
  return minSize + (maxSize - minSize) * ratio;
}

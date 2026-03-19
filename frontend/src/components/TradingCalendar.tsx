

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "utils/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isWeekend,
  parse,
  addMonths,
  subMonths,
  addWeeks,
  subDays,
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calculateNetPnl } from "utils/tradingHooks";

interface Props {
  trades: Trade[];
  selectedAccountId: string | null;
  evaluations?: Evaluation[]; // Add evaluations prop for proper filtering
}

// Memoize TradingCalendar to prevent unnecessary re-renders
export const TradingCalendar = React.memo(({ trades, selectedAccountId, evaluations = [] }: Props) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Memoize filtered trades to prevent recalculation
  const filteredTrades = useMemo(() => {
    if (!selectedAccountId || selectedAccountId === "all") {
      return trades;
    }
    
    return trades.filter((trade) => {
      // Method 1: Check direct evaluationId field (for manual trades)
      if (trade.evaluationId === selectedAccountId) {
        return true;
      }
      
      // Method 2: Check accountId field (for imported trades)
      if (trade.accountId === selectedAccountId) {
        return true;
      }
      
      // Method 3: Find evaluation by matching accountId and check evaluation ID
      const matchingEvaluation = evaluations.find(
        (evaluation) => evaluation.accountId === trade.accountId,
      );
      return matchingEvaluation?.id === selectedAccountId;
    });
  }, [trades, selectedAccountId, evaluations]);

  const availableMonths = useMemo(() => {
    if (filteredTrades.length === 0) {
      return [format(new Date(), "yyyy-MM")];
    }
    const monthSet = new Set<string>();
    filteredTrades
      .filter(trade => trade.closeTime) // Filter out trades without closeTime
      .forEach((trade) => {
        monthSet.add(format(new Date(trade.closeTime), "yyyy-MM"));
      });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [filteredTrades]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const currentDate = useMemo(() => {
    if (selectedMonth) {
      return parse(selectedMonth, "yyyy-MM", new Date());
    }
    return new Date();
  }, [selectedMonth]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const getPnlForDay = (day: Date) => {
    return filteredTrades
      .filter((trade) => trade.closeTime && isSameDay(new Date(trade.closeTime), day))
      .reduce((sum, trade) => sum + calculateNetPnl(trade), 0);
  };

  const getTradeCountForDay = (day: Date) => {
    return filteredTrades.filter((trade) =>
      trade.closeTime && isSameDay(new Date(trade.closeTime), day),
    ).length;
  };

  const weekStarts = useMemo(() => {
    // Create a complete calendar grid for weekdays only (Mon-Fri)
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    
    // Find the first Monday of the calendar view (may be in previous month)
    let calendarStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    
    // Find the last Friday by looking at the end of the month and finding the last weekday
    let calendarEnd = endOfMonth(currentDate);
    while (isWeekend(calendarEnd)) {
      calendarEnd = subDays(calendarEnd, 1);
    }
    
    // Generate all week starts for the complete calendar grid
    const starts: Date[] = [];
    let currentWeekStart = calendarStart;
    
    while (currentWeekStart <= calendarEnd) {
      starts.push(new Date(currentWeekStart));
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    
    return starts;
  }, [currentDate]);

  const getWeekStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekTrades = filteredTrades.filter((trade) => {
      if (!trade.closeTime) return false; // Filter out trades without closeTime
      const closeDate = new Date(trade.closeTime);
      return closeDate >= weekStart && closeDate <= weekEnd;
    });

    const totalPnl = weekTrades.reduce((sum, trade) => sum + calculateNetPnl(trade), 0);
    const totalTrades = weekTrades.length;
    const winRate = totalTrades > 0 ? (weekTrades.filter(trade => calculateNetPnl(trade) > 0).length / totalTrades) * 100 : 0;
    return { totalPnl, totalTrades, winRate };
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Week"];

  return (
    <div className="bg-gray-900/50 border-gray-800 text-white rounded-lg overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h3 className="text-lg sm:text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
          <Select
            value={selectedMonth || ""}
            onValueChange={(value) => setSelectedMonth(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 text-sm">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="p-2 sm:p-4 overflow-x-auto">
        {/* Mobile: Show calendar headers */}
        <div className="grid grid-cols-6 gap-0.5 sm:gap-2 text-center mb-2 min-w-[280px] sm:min-w-[300px]">
          {dayNames.map((day) => (
            <div key={day} className="font-bold text-gray-400 text-xs sm:text-sm p-1 whitespace-nowrap">
              <span className="sm:hidden">{day.substring(0, 3)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-6 gap-0.5 sm:gap-2 text-center min-w-[280px] sm:min-w-[300px]">
          {weekStarts.map((weekStart) => {
            const daysInWeek = eachDayOfInterval({
              start: weekStart,
              end: endOfWeek(weekStart, { weekStartsOn: 1 }),
            }).filter((d) => !isWeekend(d)); // Filter out weekends to show only trading days

            const weekStats = getWeekStats(weekStart);

            return (
              <React.Fragment key={weekStart.toISOString()}>
                {daysInWeek.map((day) => {
                  const isDayInCurrentMonth =
                    day.getMonth() === currentDate.getMonth();

                  if (!isDayInCurrentMonth) {
                    return (
                      <div
                        key={day.toISOString()}
                        className="p-0.5 sm:p-2 rounded-md bg-gray-900/40 h-14 sm:h-16 md:h-20 flex flex-col justify-center"
                      />
                    );
                  }
                  const pnl = getPnlForDay(day);
                  const tradeCount = getTradeCountForDay(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-0.5 sm:p-2 rounded-md h-14 sm:h-16 md:h-20 flex flex-col justify-between ${
                        !isDayInCurrentMonth 
                          ? "bg-gray-900/20 opacity-50" 
                          : isToday 
                          ? "bg-blue-900/50" 
                          : "bg-gray-800/80"
                      }`}
                    >
                      <div className={`text-left text-xs leading-none ${
                        !isDayInCurrentMonth 
                          ? "text-gray-600" 
                          : "text-gray-400"
                      }`}>
                        {format(day, "d")}
                      </div>
                      {isDayInCurrentMonth && (
                        <div className="text-center space-y-0.5">
                          <p
                            className={`font-bold text-xs sm:text-sm leading-none ${
                              pnl > 0
                                ? "text-green-400"
                                : pnl < 0
                                  ? "text-red-400"
                                  : ""
                            }`}
                          >
                            {pnl !== 0 ? `${pnl < 0 ? '-' : ''}$${Math.abs(pnl) >= 1000 ? (Math.abs(pnl)/1000).toFixed(1) + 'k' : Math.abs(pnl).toFixed(0)}` : "-"}
                          </p>
                          {tradeCount > 0 && (
                            <p className="text-xs text-gray-500 leading-none">
                              {tradeCount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Weekly Summary Cell - Mobile Optimized */}
                <div className="p-0.5 sm:p-2 rounded-md h-14 sm:h-16 md:h-20 flex flex-col justify-center bg-gray-700/60 border border-gray-600">
                  <div className="text-center space-y-0.5">
                    <p
                      className={`font-bold text-xs sm:text-sm leading-none ${
                        weekStats.totalPnl > 0
                          ? "text-green-400"
                          : weekStats.totalPnl < 0
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {weekStats.totalPnl !== 0 ? `$${Math.abs(weekStats.totalPnl) >= 1000 ? (weekStats.totalPnl/1000).toFixed(1) + 'k' : weekStats.totalPnl.toFixed(0)}` : "$0"}
                    </p>
                    <p className="text-xs text-gray-400 leading-none">
                      <span className="sm:hidden">{weekStats.totalTrades}</span>
                      <span className="hidden sm:inline">{weekStats.totalTrades} trades</span>
                    </p>
                    {weekStats.totalTrades > 0 && (
                      <p className={`text-xs leading-none ${
                        weekStats.winRate >= 50 ? "text-green-400" : "text-red-400"
                      }`}>
                        <span className="sm:hidden">{weekStats.winRate.toFixed(0)}%</span>
                        <span className="hidden sm:inline">{weekStats.winRate.toFixed(0)}% WR</span>
                      </p>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TradingCalendar.displayName = 'TradingCalendar';

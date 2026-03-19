import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "utils/types";
import { calculateNetPnl } from "utils/tradingHooks";
import { format as formatDateFns, subDays, isWithinInterval } from "date-fns";
import { format } from "date-fns-tz";
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  trades: Trade[];
  showDates?: boolean; // New prop to control X-axis type
  asBackground?: boolean; // New prop for background styling
  height?: number; // Configurable height
  className?: string;
  timeFilterDays?: number; // New prop for time filtering (30, 60, 90 days)
  showTitle?: boolean; // Control whether to show the card title
  showZoomControls?: boolean; // Control whether to show zoom/pan controls
  timezone?: string;
}

export function EquityCurveChart({ 
  trades, 
  showDates = false, 
  asBackground = false, 
  height = 300,
  className,
  timeFilterDays,
  dateRange,
  showTitle = true,
  showZoomControls = true,
  timezone = "UTC"
}: Props) {
  // State for domain-based zoom/pan
  const [zoomState, setZoomState] = useState<{
    startIndex: number;
    endIndex: number;
  } | null>(null);

  const equityData = useMemo(() => {
    if (!trades.length) return [];

    // Filter trades by time period if specified
    let filteredTrades = trades;
    if (dateRange) {
      // Use exact date range (priority over timeFilterDays)
      const startDate = new Date(dateRange.start + 'T00:00:00');
      const endDate = new Date(dateRange.end + 'T23:59:59');
      
      console.log('🎯 Filtering equity curve trades to match habit data:', {
        dateRange,
        totalTrades: trades.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      filteredTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.closeTime);
        const isInRange = isWithinInterval(tradeDate, { start: startDate, end: endDate });
        return isInRange;
      });
      
      console.log('🎯 Filtered trades result:', {
        filteredCount: filteredTrades.length,
        dateRange: {
          first: filteredTrades[0]?.closeTime,
          last: filteredTrades[filteredTrades.length - 1]?.closeTime
        }
      });
    } else if (timeFilterDays) {
      // Fallback to timeFilterDays behavior
      const endDate = new Date();
      const startDate = subDays(endDate, timeFilterDays);
      
      filteredTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.closeTime);
        return isWithinInterval(tradeDate, { start: startDate, end: endDate });
      });
    }

    // Sort trades by close time
    const sortedTrades = [...filteredTrades].sort(
      (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
    );

    let cumulativePnl = 0;
    return sortedTrades.map((trade, index) => {
      cumulativePnl += calculateNetPnl(trade);
      return {
        tradeNumber: index + 1,
        date: new Date(trade.closeTime),
        dateFormatted: format(new Date(trade.closeTime), "MMM dd", { timeZone: timezone }),
        pnl: cumulativePnl,
      };
    });
  }, [trades, timeFilterDays, dateRange, timezone]);

  // Calculate the visible range based on zoom state
  const visibleData = useMemo(() => {
    if (!zoomState || equityData.length === 0) return equityData;
    
    const start = Math.max(0, zoomState.startIndex);
    const end = Math.min(equityData.length, zoomState.endIndex);
    
    return equityData.slice(start, end);
  }, [equityData, zoomState]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (equityData.length === 0) return;
    
    const currentStart = zoomState?.startIndex ?? 0;
    const currentEnd = zoomState?.endIndex ?? equityData.length;
    const currentRange = currentEnd - currentStart;
    
    // Zoom in by 30%
    const newRange = Math.max(5, Math.floor(currentRange * 0.7));
    const center = Math.floor((currentStart + currentEnd) / 2);
    
    const newStart = Math.max(0, center - Math.floor(newRange / 2));
    const newEnd = Math.min(equityData.length, newStart + newRange);
    
    setZoomState({ startIndex: newStart, endIndex: newEnd });
  };

  const handleZoomOut = () => {
    if (equityData.length === 0) return;
    
    const currentStart = zoomState?.startIndex ?? 0;
    const currentEnd = zoomState?.endIndex ?? equityData.length;
    const currentRange = currentEnd - currentStart;
    
    // Zoom out by 30%
    const newRange = Math.min(equityData.length, Math.ceil(currentRange * 1.3));
    const center = Math.floor((currentStart + currentEnd) / 2);
    
    const newStart = Math.max(0, center - Math.floor(newRange / 2));
    const newEnd = Math.min(equityData.length, newStart + newRange);
    
    // If we're showing everything, reset zoom state
    if (newStart === 0 && newEnd === equityData.length) {
      setZoomState(null);
    } else {
      setZoomState({ startIndex: newStart, endIndex: newEnd });
    }
  };

  const handleReset = () => {
    setZoomState(null);
  };

  const handlePan = (direction: 'left' | 'right') => {
    if (equityData.length === 0) return;
    
    const currentStart = zoomState?.startIndex ?? 0;
    const currentEnd = zoomState?.endIndex ?? equityData.length;
    const range = currentEnd - currentStart;
    
    // Pan by 20% of visible range
    const panAmount = Math.floor(range * 0.2);
    
    let newStart = currentStart;
    let newEnd = currentEnd;
    
    if (direction === 'left') {
      newStart = Math.max(0, currentStart - panAmount);
      newEnd = newStart + range;
    } else {
      newEnd = Math.min(equityData.length, currentEnd + panAmount);
      newStart = newEnd - range;
    }
    
    setZoomState({ startIndex: newStart, endIndex: newEnd });
  };

  if (!trades.length) {
    if (asBackground) return null; // Don't show anything for background version
    
    return (
      <Card className={`bg-gray-900/50 border-gray-800 text-white ${className || ''}`}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            No trade data to display.
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={visibleData}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={asBackground ? "#374151" : "#374151"} 
          opacity={asBackground ? 0.3 : 1}
        />
        <XAxis
          dataKey={showDates ? "dateFormatted" : "tradeNumber"}
          stroke={asBackground ? "#6b7280" : "#888888"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={showDates ? undefined : (tick) => `#${tick}`}
          opacity={asBackground ? 0.7 : 1}
        />
        <YAxis
          stroke={asBackground ? "#6b7280" : "#888888"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
          opacity={asBackground ? 0.7 : 1}
        />
        {!asBackground && (
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              borderColor: "#374151",
              fontSize: "14px",
            }}
            labelFormatter={(label) => 
              showDates ? `Date: ${label}` : `Trade #${label}`
            }
            formatter={(value: number, name, props) => [
              `$${value.toFixed(2)}`,
              `Cumulative P&L`
            ]}
          />
        )}
        <ReferenceLine 
          y={0} 
          stroke={asBackground ? "#6b7280" : "#888888"} 
          opacity={asBackground ? 0.5 : 1}
        />
        <defs>
          <linearGradient id={`colorPnl${asBackground ? 'Background' : ''}`} x1="0" y1="0" x2="0" y2="1">
            <stop 
              offset="5%" 
              stopColor={asBackground ? "#10b981" : "#84cc16"} 
              stopOpacity={asBackground ? 0.1 : 0.8}
            />
            <stop 
              offset="95%" 
              stopColor={asBackground ? "#10b981" : "#84cc16"} 
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={asBackground ? "#10b981" : "#84cc16"}
          fill={`url(#colorPnl${asBackground ? 'Background' : ''})`}
          fillOpacity={1}
          strokeOpacity={asBackground ? 0.4 : 1}
          strokeWidth={asBackground ? 1 : 2.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (asBackground) {
    return chartContent;
  }

  return (
    <Card className={`bg-gray-900/50 border-gray-800 text-white ${className || ''}`}>
      {showTitle && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Equity Curve
              {timeFilterDays && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (Last {timeFilterDays} days • {equityData.length} trades)
                </span>
              )}
            </CardTitle>
            {showZoomControls && equityData.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePan('left')}
                  disabled={!zoomState || zoomState.startIndex === 0}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  title="Pan left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePan('right')}
                  disabled={!zoomState || zoomState.endIndex === equityData.length}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  title="Pan right"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-700 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomState !== null && (zoomState.endIndex - zoomState.startIndex) <= 5}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={!zoomState}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!zoomState}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  title="Reset zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-2 sm:p-6">

        {/* Chart - Domain-based zoom (axes stay fixed, content zooms) */}
        <div
          style={{
            width: '100%',
            height: `${height}px`,
            borderRadius: '8px',
            border: '1px solid #374151',
            overflow: 'hidden'
          }}
        >
          {chartContent}
        </div>
      </CardContent>
    </Card>
  );
}

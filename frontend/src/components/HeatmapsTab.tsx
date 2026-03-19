import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trade } from "utils/types";
import {
  generateTimeOfDayHeatmap,
  generateDayOfWeekHeatmap,
  generateTradingSessionHeatmap,
  generateEmotionalStateHeatmap,
  calculateHeatmapColor,
} from "utils/heatmapCalculations";
import { Clock, Calendar, Globe, Heart } from "lucide-react";

/** Trading session definitions used for display in the heatmap */
const TRADING_SESSIONS = [
  { displayName: 'Sydney',   color: '#6366f1', start: 21, end: 6  },
  { displayName: 'Tokyo',    color: '#f59e0b', start: 0,  end: 9  },
  { displayName: 'London',   color: '#10b981', start: 8,  end: 17 },
  { displayName: 'New York', color: '#3b82f6', start: 13, end: 22 },
];

interface Props {
  trades: Trade[];
  journalEntries?: any[]; // Add journal entries for emotional state analysis
  timezone?: string;
}

export function HeatmapsTab({ trades, journalEntries = [], timezone = "UTC" }: Props) {
  const [selectedHeatmap, setSelectedHeatmap] = useState("time-of-day");

  const timeOfDayData = useMemo(() => generateTimeOfDayHeatmap(trades, timezone), [trades, timezone]);
  const dayOfWeekData = useMemo(() => generateDayOfWeekHeatmap(trades, timezone), [trades, timezone]);
  const sessionData = useMemo(() => generateTradingSessionHeatmap(trades), [trades]);
  const emotionalData = useMemo(() => generateEmotionalStateHeatmap(trades, journalEntries), [trades, journalEntries]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const renderTimeOfDayHeatmap = () => {
    const maxPnl = Math.max(...timeOfDayData.map(d => Math.abs(d.value)));
    const minPnl = -maxPnl;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1">
          {timeOfDayData.map((cell) => {
            const intensity = maxPnl > 0 ? Math.abs(cell.value) / maxPnl : 0;
            const opacity = 0.3 + (intensity * 0.7);
            
            return (
              <div
                key={cell.x}
                className="aspect-square relative group cursor-pointer transition-all hover:scale-110"
                style={{
                  backgroundColor: calculateHeatmapColor(cell.value, minPnl, maxPnl),
                  opacity,
                }}
                title={cell.label}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{cell.x}</span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap mb-1">
                  {cell.label}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500"></div>
            <span>Losses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600"></div>
            <span>No Trades</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500"></div>
            <span>Profits</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDayOfWeekHeatmap = () => {
    const maxPnl = Math.max(...dayOfWeekData.map(d => Math.abs(d.value)));
    const minPnl = -maxPnl;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {dayOfWeekData.map((cell) => {
            const intensity = maxPnl > 0 ? Math.abs(cell.value) / maxPnl : 0;
            const opacity = 0.3 + (intensity * 0.7);
            
            return (
              <div
                key={cell.x}
                className="aspect-square relative group cursor-pointer transition-all hover:scale-105 rounded-lg"
                style={{
                  backgroundColor: calculateHeatmapColor(cell.value, minPnl, maxPnl),
                  opacity,
                }}
                title={cell.label}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-white">{dayNames[cell.x as number]}</span>
                  <span className="text-xs text-white/80">${cell.value.toFixed(0)}</span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap mb-1">
                  {cell.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTradingSessionHeatmap = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sessionData.map((session, index) => {
            const sessionInfo = TRADING_SESSIONS.find(s => s.displayName === session.session);
            const color = sessionInfo?.color || '#6B7280';
            
            return (
              <Card key={session.session} className="bg-gray-900/50 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    ></div>
                    {session.session}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-500">{session.timeRange}</div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">P&L</span>
                    <span className={`text-lg font-bold ${
                      session.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${session.pnl >= 0 ? '+' : ''}${session.pnl.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Win Rate</span>
                    <Badge 
                      variant={session.winRate >= 60 ? 'default' : 
                               session.winRate >= 40 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {session.winRate.toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Trades</span>
                    <span className="text-sm text-white">{session.totalTrades}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Avg Trade</span>
                    <span className={`text-sm ${
                      session.avgTrade >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${session.avgTrade >= 0 ? '+' : ''}${session.avgTrade.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEmotionalStateHeatmap = () => {
    if (!journalEntries || journalEntries.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8">
          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No journal entries found</p>
          <p className="text-sm mt-2">Start journaling to see emotional patterns!</p>
        </div>
      );
    }

    if (emotionalData.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8">
          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>Not enough data for emotional analysis</p>
          <p className="text-sm mt-2">Keep trading and journaling to see patterns!</p>
        </div>
      );
    }

    const maxPnl = Math.max(...emotionalData.map(d => Math.abs(d.value)));
    const minPnl = -maxPnl;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {emotionalData.map((cell, index) => {
            const intensity = maxPnl > 0 ? Math.abs(cell.value) / maxPnl : 0;
            const opacity = 0.4 + (intensity * 0.6);
            
            return (
              <div
                key={`${cell.x}-${index}`}
                className="relative group cursor-pointer transition-all hover:scale-105 rounded-lg p-4 border border-gray-700"
                style={{
                  backgroundColor: calculateHeatmapColor(cell.value, minPnl, maxPnl),
                  opacity,
                }}
                title={cell.label}
              >
                <div className="text-center">
                  <div className="text-sm text-white/90 font-medium mb-2">
                    {cell.x}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {cell.count}
                  </div>
                  <div className="text-xs text-white/80 mb-1">
                    trades
                  </div>
                  <div className={`text-sm font-bold ${
                    cell.value >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}>
                    ${cell.value >= 0 ? '+' : ''}${cell.value.toFixed(0)}
                  </div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap mb-2">
                  {cell.label}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 border-t border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Positive Emotions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Negative Emotions</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedHeatmap} onValueChange={setSelectedHeatmap} className="w-full">
        <TabsList className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg overflow-x-auto">
            <TabsTrigger 
              value="time-of-day" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Clock className="w-4 h-4 mr-2" />
              Time of Day
            </TabsTrigger>
            <TabsTrigger 
              value="day-of-week" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Day of Week
            </TabsTrigger>
            <TabsTrigger 
              value="trading-sessions" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Globe className="w-4 h-4 mr-2" />
              Trading Sessions
            </TabsTrigger>
            <TabsTrigger 
              value="emotional-state" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Heart className="w-4 h-4 mr-2" />
              Emotional State
            </TabsTrigger>
          </TabsList>

        <TabsContent value="time-of-day" className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Performance by Time of Day
              </h3>
              {renderTimeOfDayHeatmap()}
            </div>
          </TabsContent>

          <TabsContent value="day-of-week" className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                Performance by Day of Week
              </h3>
              {renderDayOfWeekHeatmap()}
            </div>
          </TabsContent>

          <TabsContent value="trading-sessions" className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-400" />
                Performance by Trading Session
              </h3>
              {renderTradingSessionHeatmap()}
            </div>
          </TabsContent>

          <TabsContent value="emotional-state" className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-blue-400" />
                Emotional State vs Performance
              </h3>
              {renderEmotionalStateHeatmap()}
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Target,
  Users,
  DollarSign,
  Activity,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import brain from "brain";
import { Trade } from "types";
import { useUserGuardContext } from "app";
import { LoadingSpinner } from "components/LoadingFallback";
import { getCardClasses, getTextClasses } from "utils/designSystem";

// Types for trade grouping
interface GroupMetrics {
  group_id: string;
  group_type: string;
  grouping_strategy: string;
  total_trades: number;
  total_pnl: number;
  win_rate: number;
  total_volume: number;
  risk_reward_ratio: number;
  avg_hold_time_minutes?: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  trading_style?: string;
  market_type?: string;
  confidence_score: number;
  metadata: Record<string, any>;
}

interface GroupWithTrades {
  metrics: GroupMetrics;
  trades: Trade[];
}

interface GroupingResponse {
  groups: GroupWithTrades[];
  ungrouped_trades: Trade[];
  summary: {
    total_groups: number;
    total_trades: number;
    grouped_trades: number;
    ungrouped_trades: number;
    grouping_efficiency: number;
    avg_group_size: number;
    total_pnl: number;
    profitable_groups: number;
    avg_group_confidence: number;
  };
  grouping_stats: {
    strategy_distribution: Record<string, any>;
    trading_style_distribution: Record<string, any>;
    market_type_distribution: Record<string, any>;
    performance_metrics: Record<string, any>;
  };
  execution_time_ms: number;
}

interface TradeGroupingProps {
  trades: Trade[];
}

interface GroupCardProps {
  group: GroupWithTrades;
  isExpanded: boolean;
  onToggle: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isExpanded, onToggle }) => {
  const { metrics, trades } = group;
  const isProfitable = metrics.total_pnl > 0;
  
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const getPerformanceGrade = (winRate: number, pnl: number, confidence: number) => {
    const score = (winRate * 40) + (pnl > 0 ? 30 : 0) + (confidence * 30);
    if (score >= 80) return { grade: "A", color: "text-green-400" };
    if (score >= 60) return { grade: "B", color: "text-yellow-400" };
    if (score >= 40) return { grade: "C", color: "text-orange-400" };
    return { grade: "D", color: "text-red-400" };
  };

  const performance = getPerformanceGrade(metrics.win_rate, metrics.total_pnl, metrics.confidence_score);

  return (
    <Card className={getCardClasses(isProfitable ? 'positive' : 'negative', 'md')}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isProfitable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {isProfitable ? 
                    <TrendingUp className="h-5 w-5 text-green-400" /> : 
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  }
                </div>
                <div>
                  <CardTitle className="text-lg">{metrics.group_type}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {metrics.grouping_strategy}
                    </Badge>
                    <span>{metrics.total_trades} trades</span>
                    {metrics.trading_style && (
                      <Badge variant="outline" className="text-xs">
                        {metrics.trading_style}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-lg font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                    ${metrics.total_pnl.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(metrics.win_rate * 100).toFixed(1)}% WR
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${performance.color}`}>
                    {performance.grade}
                  </div>
                  <Progress value={metrics.confidence_score * 100} className="w-16" />
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Group Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Volume
                </div>
                <div className="text-lg font-semibold">{metrics.total_volume.toFixed(2)}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  R:R Ratio
                </div>
                <div className="text-lg font-semibold">
                  {metrics.risk_reward_ratio ? metrics.risk_reward_ratio.toFixed(2) : "N/A"}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Avg Hold
                </div>
                <div className="text-lg font-semibold">
                  {formatDuration(metrics.avg_hold_time_minutes)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  Duration
                </div>
                <div className="text-lg font-semibold">
                  {formatDuration(metrics.duration_minutes)}
                </div>
              </div>
            </div>

            {/* Time Range */}
            {metrics.start_time && metrics.end_time && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Trading Period</div>
                <div className="text-sm">
                  {new Date(metrics.start_time).toLocaleString()} → {new Date(metrics.end_time).toLocaleString()}
                </div>
              </div>
            )}

            {/* Individual Trades Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Exit Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade, index) => {
                    const tradePnl = trade.pnl || 0;
                    return (
                      <TableRow key={trade.id || index}>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                            {trade.type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.quantity || trade.lots || 0}</TableCell>
                        <TableCell className={tradePnl > 0 ? 'text-green-400' : 'text-red-400'}>
                          ${tradePnl.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {trade.openTime ? new Date(trade.openTime).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {trade.closeTime ? new Date(trade.closeTime).toLocaleString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const TradeGrouping: React.FC<TradeGroupingProps> = ({ trades }) => {
  const { user } = useUserGuardContext();
  const [groupingResult, setGroupingResult] = useState<GroupingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(["symbol", "session", "scaling"]);
  const [availableStrategies, setAvailableStrategies] = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'pnl' | 'trades' | 'winrate' | 'confidence'>('pnl');
  const [filterBy, setFilterBy] = useState<'all' | 'profitable' | 'unprofitable'>('all');

  // Fetch available strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await brain.get_available_strategies();
        const data = await response.json();
        setAvailableStrategies(data.available_strategies || {});
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
        toast.error('Failed to load grouping strategies');
      }
    };
    
    fetchStrategies();
  }, []);

  const handleGroupTrades = useCallback(async () => {
    if (!trades.length) {
      toast.error('No trades available for grouping');
      return;
    }

    setLoading(true);
    try {
      // Convert trades to the format expected by the API
      const tradeData = trades.map(trade => ({
        symbol: trade.symbol || '',
        entry_time: trade.openTime || new Date().toISOString(),
        exit_time: trade.closeTime || new Date().toISOString(),
        quantity: trade.quantity || trade.lots || 0,
        entry_price: trade.openPrice || 0,
        exit_price: trade.closePrice || 0,
        pnl: trade.pnl || 0,
        commission: trade.commission || 0,
        platform: trade.platform || 'unknown',
        strategy: trade.strategy || ''
      }));

      const response = await brain.analyze_trades({
        trades: tradeData,
        strategies: selectedStrategies,
        custom_params: {},
        user_id: user?.uid
      });

      const result: GroupingResponse = await response.json();
      setGroupingResult(result);
      toast.success(`Successfully grouped ${result.summary.grouped_trades} trades into ${result.summary.total_groups} groups`);
    } catch (error) {
      console.error('Failed to group trades:', error);
      toast.error('Failed to analyze trade groups');
    } finally {
      setLoading(false);
    }
  }, [trades, selectedStrategies, user]);

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Sort and filter groups
  const processedGroups = useMemo(() => {
    if (!groupingResult) return [];
    
    let filtered = groupingResult.groups;
    
    // Apply filters
    if (filterBy === 'profitable') {
      filtered = filtered.filter(group => group.metrics.total_pnl > 0);
    } else if (filterBy === 'unprofitable') {
      filtered = filtered.filter(group => group.metrics.total_pnl < 0);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return b.metrics.total_pnl - a.metrics.total_pnl;
        case 'trades':
          return b.metrics.total_trades - a.metrics.total_trades;
        case 'winrate':
          return b.metrics.win_rate - a.metrics.win_rate;
        case 'confidence':
          return b.metrics.confidence_score - a.metrics.confidence_score;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [groupingResult, sortBy, filterBy]);

  if (!trades.length) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Trades Available</h3>
        <p className="text-muted-foreground">Import some trades to start analyzing groups</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className={getCardClasses('neutral', 'md')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Trade Grouping Analysis
          </CardTitle>
          <CardDescription>
            Group related trades and analyze patterns using advanced algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Grouping Strategies</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(availableStrategies).map(([key, strategy]) => (
                <Button
                  key={key}
                  variant={selectedStrategies.includes(key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedStrategies(prev => 
                      prev.includes(key) 
                        ? prev.filter(s => s !== key)
                        : [...prev, key]
                    );
                  }}
                >
                  {strategy.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more strategies to group related trades
            </p>
          </div>
          
          <Button 
            onClick={handleGroupTrades} 
            disabled={loading || selectedStrategies.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Analyzing Trades...
              </>
            ) : (
              <>  
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze Trade Groups
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {groupingResult && (
        <>
          {/* Summary */}
          <Card className={getCardClasses('default', 'md')}>
            <CardHeader>
              <CardTitle>Grouping Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{groupingResult.summary.total_groups}</div>
                  <div className="text-sm text-muted-foreground">Groups Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {(groupingResult.summary.grouping_efficiency * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Grouping Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {groupingResult.summary.avg_group_size.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Group Size</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    groupingResult.summary.total_pnl > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${groupingResult.summary.total_pnl.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="profitable">Profitable</SelectItem>
                    <SelectItem value="unprofitable">Unprofitable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pnl">By P&L</SelectItem>
                  <SelectItem value="trades">By Trade Count</SelectItem>
                  <SelectItem value="winrate">By Win Rate</SelectItem>
                  <SelectItem value="confidence">By Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => processedGroups.forEach(group => 
                  setExpandedGroups(prev => new Set([...prev, group.metrics.group_id]))
                )}
              >
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedGroups(new Set())}
              >
                Collapse All
              </Button>
            </div>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {processedGroups.length > 0 ? (
              processedGroups.map((group) => (
                <GroupCard
                  key={group.metrics.group_id}
                  group={group}
                  isExpanded={expandedGroups.has(group.metrics.group_id)}
                  onToggle={() => toggleGroupExpansion(group.metrics.group_id)}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No groups match the current filter</p>
              </div>
            )}
          </div>

          {/* Ungrouped Trades */}
          {groupingResult.ungrouped_trades.length > 0 && (
            <Card className={getCardClasses('neutral', 'md')}>
              <CardHeader>
                <CardTitle>Ungrouped Trades ({groupingResult.ungrouped_trades.length})</CardTitle>
                <CardDescription>
                  These trades didn't fit into any group based on the selected strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Consider adjusting grouping strategies or parameters to capture more trade relationships
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default TradeGrouping;

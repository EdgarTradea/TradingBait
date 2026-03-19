import { useEffect, useMemo, useState } from "react";
import { useUserGuardContext } from "app";
import { Header } from "components/Header";
import { Sidebar } from "components/Sidebar";
import { ProtectedRoute } from "components/ProtectedRoute";
import { useStore } from "utils/store";
import { AnalyticsFilters } from "components/AnalyticsFilters";
import { OverviewTab } from "components/OverviewTab";
import { RiskTab } from "components/RiskTab";
import { HeatmapsTab } from "components/HeatmapsTab";
import { AdvancedChartsTab } from "components/AdvancedChartsTab";
import { AdvancedAnalyticsTab } from "components/AdvancedAnalyticsTab";
import { AIInsights } from "components/AIInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { BarChart3, TrendingUp, Map, AlertTriangle, Sparkles, LineChart } from "lucide-react";
import { KpiCard } from "components/KpiCard";
import { getBackgroundClasses, backgroundEffects, getTextClasses, getCardClasses } from "utils/designSystem";
import { DataQualityTab } from "components/DataQualityTab";


function AnalyticsContent() {
  const { user } = useUserGuardContext();
  const {
    trades,
    evaluations,
    journalEntries,
    fetchTrades,
    fetchEvaluations,
    fetchJournalEntries,
    isSidebarCollapsed,
  } = useStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [advancedSubTab, setAdvancedSubTab] = useState("comparative");

  useEffect(() => {
    if (user) {
      // Force refresh to bypass cache and get latest data
      fetchTrades(user.uid, true);
      fetchEvaluations(user.uid, true);
      fetchJournalEntries(user.uid, true);
      
      // Debug log to check data freshness
      console.log('🔄 Analytics: Forced cache refresh for all data');
    }
  }, [user, fetchTrades, fetchEvaluations, fetchJournalEntries]);



  const [filters, setFilters] = useState<{
    accountId: string | null;
    symbol: string | null;
    dateRange: DateRange | undefined;
    selectedTags: string[];
    timezone: string;
  }>({
    accountId: null,
    symbol: null,
    dateRange: undefined,
    selectedTags: [],
    timezone: "UTC",
  });

  const activeEvaluations = useMemo(() => {
    return evaluations.filter((e) => e.status === "active");
  }, [evaluations]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const { accountId, symbol, dateRange, selectedTags } = filters;
      
      // Account/Evaluation filtering with multiple methods
      if (accountId) {
        // Method 1: Check direct evaluationId field (for manual trades)
        if (trade.evaluationId === accountId) {
          // Continue to other filters
        }
        // Method 2: Check accountId field (for imported trades)
        else if (trade.accountId === accountId) {
          // Continue to other filters
        }
        // Method 3: Find evaluation by matching accountId and check evaluation ID
        else {
          const matchingEvaluation = evaluations.find(
            (evaluation) => evaluation.accountId === trade.accountId,
          );
          if (matchingEvaluation?.id !== accountId) {
            return false;
          }
        }
      }
      
      if (symbol && trade.symbol !== symbol) {
        return false;
      }
      if (dateRange?.from && new Date(trade.closeTime) < dateRange.from) {
        return false;
      }
      if (dateRange?.to && new Date(trade.closeTime) > dateRange.to) {
        return false;
      }
      // Tag filtering - trade must have at least one of the selected tags
      if (selectedTags.length > 0) {
        if (!trade.tags || !Array.isArray(trade.tags) || trade.tags.length === 0) {
          return false;
        }
        const hasMatchingTag = trade.tags.some(tag => 
          selectedTags.includes(tag?.trim())
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      return true;
    });
  }, [trades, filters, evaluations]);

  const totalPnL = useMemo(() => {
    return filteredTrades.reduce((acc, trade) => acc + trade.pnl, 0);
  }, [filteredTrades]);

  const totalTrades = useMemo(() => {
    return filteredTrades.length;
  }, [filteredTrades]);

  const winningTrades = useMemo(() => {
    return filteredTrades.filter((trade) => trade.pnl > 0).length;
  }, [filteredTrades]);

  const losingTrades = useMemo(() => {
    return filteredTrades.filter((trade) => trade.pnl < 0).length;
  }, [filteredTrades]);

  const winRate = useMemo(() => {
    return totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  }, [totalTrades, winningTrades]);

  const avgTrade = useMemo(() => {
    return totalTrades > 0 ? totalPnL / totalTrades : 0;
  }, [totalPnL, totalTrades]);

  return (
    <div className={getBackgroundClasses()}>
      {/* Background effects */}
      <div className={backgroundEffects.radialBlue} />
      <div className={backgroundEffects.radialEmerald} />
      <div className={backgroundEffects.radialPurple} />
      
      <div
        className={`flex min-h-screen w-full flex-col ${
          isSidebarCollapsed ? "lg:pl-14" : "lg:pl-64"
        }`}
      >
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-8 pb-20 sm:pb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Analytics</h1>
            
            {/* Filters */}
            <div className="mb-6 sm:mb-8">
              <AnalyticsFilters
                trades={trades}
                evaluations={activeEvaluations}
                onFiltersChange={setFilters}
                initialTimezone={filters.timezone}
              />
            </div>
            
            {/* Main Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 bg-gray-800 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="risk" className="flex items-center gap-2 text-xs sm:text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Risk</span>
                  <span className="sm:hidden">Risk</span>
                </TabsTrigger>
                <TabsTrigger value="equity-simulator" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Equity Simulator</span>
                  <span className="sm:hidden">Simulator</span>
                </TabsTrigger>
                <TabsTrigger value="advanced-analytics" className="flex items-center gap-2 text-xs sm:text-sm">
                  <LineChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced Analytics</span>
                  <span className="sm:hidden">Advanced</span>
                </TabsTrigger>
                <TabsTrigger value="data-quality" className="flex items-center gap-2 text-xs sm:text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Data Quality</span>
                  <span className="sm:hidden">Quality</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <AIInsights trades={filteredTrades} tab="overview" />
                <OverviewTab 
                  trades={filteredTrades} 
                  evaluations={activeEvaluations} 
                  selectedEvaluationId={filters.accountId} 
                  timezone={filters.timezone}
                />
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <AIInsights trades={filteredTrades} tab="risk" />
                <RiskTab trades={filteredTrades} evaluations={activeEvaluations} />
              </TabsContent>

              <TabsContent value="equity-simulator" className="space-y-4">
                <AdvancedChartsTab trades={filteredTrades} evaluations={activeEvaluations} selectedEvaluationId={filters.accountId} />
              </TabsContent>

              <TabsContent value="advanced-analytics" className="space-y-4">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics</h2>
                    <p className="text-gray-400">Deep dive into your trading patterns and performance correlations</p>
                  </div>
                  
                  {/* Sub-tabs for Advanced Analytics */}
                  <Tabs value={advancedSubTab} onValueChange={setAdvancedSubTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 bg-gray-700 mb-6">
                      <TabsTrigger value="comparative" className="flex items-center gap-2 text-xs sm:text-sm">
                        <LineChart className="h-4 w-4" />
                        <span>Comparative Analysis</span>
                      </TabsTrigger>
                      <TabsTrigger value="heatmaps" className="flex items-center gap-2 text-xs sm:text-sm">
                        <Map className="h-4 w-4" />
                        <span>Heatmaps</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="comparative" className="space-y-4">
                      <AdvancedAnalyticsTab trades={filteredTrades} evaluations={activeEvaluations} />
                    </TabsContent>

                    <TabsContent value="heatmaps" className="space-y-4">
                      <HeatmapsTab 
                        trades={filteredTrades} 
                        journalEntries={journalEntries}
                        timezone={filters.timezone}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="data-quality" className="space-y-4">
                <DataQualityTab trades={filteredTrades} evaluations={activeEvaluations} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}


// Analytics page with simplified authentication
export default function Analytics() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

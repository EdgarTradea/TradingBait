



import React, { useEffect, useMemo, useCallback, useState, Suspense } from "react";
import { UserGuard, useUserGuardContext } from "app";
import { useStore } from "utils/store";
import { CommandCenterDashboard } from "components/CommandCenterDashboard";
import { SubscriptionGuard } from "components/SubscriptionGuard";
import { Sidebar } from "components/Sidebar";
import { TradingBaitLogo } from "components/TradingBaitLogo";
import { LoadingFallback } from "components/LoadingFallback";
import { getBackgroundClasses, backgroundEffects } from "utils/designSystem";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import brain from "brain";
import {
  Menu,
  Plus,
  Settings,
  TrendingUp,
  BarChart3,
  BarChart3 as BarChartIcon,
  TrendingUp as LineChartIcon,
  Calendar,
  BookOpen as BookOpenIcon,
  Settings as SettingsIcon,
  Network as NetworkIcon,
  Trash2,
  AlertTriangle,
  PanelLeft as PanelLeftIcon,
  Home as HomeIcon,
  PenTool as PenToolIcon,
  Brain
} from "lucide-react";
import { TrialStatusBanner } from "components/TrialStatusBanner";

function DashboardContent() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const {
    trades,
    evaluations,
    fetchTrades,
    fetchEvaluations,
    isSidebarCollapsed,
  } = useStore();
  const [selectedAccount, setSelectedAccount] = useState("all");
  
  // Memoize account change handler
  const handleAccountChange = useCallback((value: string) => {
    setSelectedAccount(value);
  }, []);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleFetchTrades = useCallback(() => {
    if (user) {
      // Force refresh to bypass cache and get latest data (same as Analytics page)
      fetchTrades(user.uid, true);
    }
  }, [user, fetchTrades]);

  const handleFetchEvaluations = useCallback(() => {
    if (user) {
      // Force refresh to bypass cache and get latest data (same as Analytics page)
      fetchEvaluations(user.uid, true);
    }
  }, [user, fetchEvaluations]);

  useEffect(() => {
    handleFetchTrades();
    handleFetchEvaluations();
  }, [handleFetchTrades, handleFetchEvaluations]);
  
  const filteredTrades = useMemo(() => {
    if (selectedAccount === "all") {
      return trades;
    }
    return trades.filter((trade) => {
      // Method 1: Check direct evaluationId field (for manual trades)
      if (trade.evaluationId === selectedAccount) {
        return true;
      }
      
      // Method 2: Check accountId field (for imported trades)
      if (trade.accountId === selectedAccount) {
        return true;
      }
      
      // Method 3: Find evaluation by matching accountId and check evaluation ID
      const matchingEvaluation = evaluations.find(
        (evaluation) => evaluation.accountId === trade.accountId,
      );
      return matchingEvaluation?.id === selectedAccount;
    });
  }, [trades, selectedAccount, evaluations]);

  // Calculate current balance based on selected account
  const currentBalance = useMemo(() => {
    if (selectedAccount === "all") {
      // For "all" accounts, sum up all balances from active evaluations
      return evaluations
        .filter((e) => e.status === "active" && e.balance !== undefined)
        .reduce((sum, evaluation) => sum + (evaluation.balance || 0), 0);
    } else {
      // For specific account, find the matching evaluation's balance by evaluation ID
      const evaluation = evaluations.find((e) => e.id === selectedAccount && e.status === "active");
      return evaluation?.balance || 0;
    }
  }, [evaluations, selectedAccount]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className={getBackgroundClasses()}>
        {/* Background effects */}
        <div className={backgroundEffects.radialBlue} />
        <div className={backgroundEffects.radialEmerald} />
        <div className={backgroundEffects.radialPurple} />
        
        {/* Mobile Header with navigation */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Mobile Navigation Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="glassmorphic-card border-gray-700/50 hover:border-emerald-500/50 bg-gray-900/80 text-gray-100 hover:text-emerald-400 transition-all duration-300"
                >
                  <PanelLeftIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[280px] sm:w-[320px] bg-gray-950/95 border-gray-800/50 backdrop-blur-xl"
              >
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <TradingBaitLogo variant="default" size="md" />
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigation menu for TradingBait application
                  </SheetDescription>
                </SheetHeader>
                <nav className="grid gap-4 text-lg font-medium mt-8">
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/dashboard"
                  >
                    <HomeIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Dashboard</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/trades"
                  >
                    <BarChartIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Trades</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/analytics"
                  >
                    <LineChartIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Analytics</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/trading-journal"
                  >
                    <PenToolIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Trading Journal</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-blue-700/50 group relative"
                    to="/my-trading-coach"
                  >
                    <Brain className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                    <span className="font-semibold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300">
                      My Trading Coach
                    </span>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                    </div>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/my-funding-journey"
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">MyFundingJourney</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/strategy"
                  >
                    <NetworkIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Strategy</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/help"
                  >
                    <BookOpenIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Help</span>
                  </NavLink>
                  <NavLink
                    className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
                    to="/settings"
                  >
                    <SettingsIcon className="h-5 w-5" />
                    <span className="font-semibold tracking-wide">Settings</span>
                  </NavLink>
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Mobile App Title */}
            <div className="flex-1 text-center">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-gray-100 via-emerald-400 to-gray-100 bg-clip-text text-transparent">
                TradingBait
              </h1>
            </div>
            
            {/* Mobile Settings/Profile */}
            <Button
              variant="outline"
              size="icon"
              className="glassmorphic-card border-gray-700/50 hover:border-emerald-500/50 bg-gray-900/80 text-gray-100 hover:text-emerald-400"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <Sidebar />
        
        {/* Main Command Center Content */}
        <div className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ml-14" : "lg:ml-64"
        } ${"pt-16 lg:pt-0"}`}>
          {/* Floating Control Panel */}
          <div className="absolute top-20 right-4 lg:top-4 z-50 flex items-center gap-2">
            <Select onValueChange={handleAccountChange} value={selectedAccount}>
              <SelectTrigger className="w-[150px] lg:w-[200px] bg-gray-900/90 border-gray-700/50 text-white backdrop-blur-xl text-sm lg:text-base">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 text-white border-gray-800">
                <SelectItem value="all">All Accounts</SelectItem>
                {useMemo(() => {
                  // Get unique accountIds to prevent duplicate keys
                  const uniqueEvaluations = evaluations
                    .filter((e) => e.status === "active")
                    .reduce((acc, evaluation) => {
                      // Use accountId as key to prevent duplicates
                      if (!acc[evaluation.accountId]) {
                        acc[evaluation.accountId] = evaluation;
                      }
                      return acc;
                    }, {} as Record<string, typeof evaluations[0]>);
                  
                  return Object.values(uniqueEvaluations).map((evaluation) => (
                    <SelectItem
                      key={evaluation.accountId}
                      value={evaluation.id}
                    >
                      {evaluation.firm} - {evaluation.accountId}
                    </SelectItem>
                  ));
                }, [evaluations])}
              </SelectContent>
            </Select>
            
            <Button
              className="bg-blue-600/90 hover:bg-blue-700 backdrop-blur-xl border border-blue-500/30"
              onClick={() => navigate("/Trades")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Import
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="bg-gray-900/90 border-gray-700/50 hover:bg-gray-800 backdrop-blur-xl"
              onClick={() => navigate("/Settings")}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            {/* Trial Status Banner */}
            <div className="p-6 pb-0">
              <TrialStatusBanner onUpgrade={() => navigate('/pricing')} />
            </div>
            
            <div className="p-6">
              {/* Command Center Dashboard */}
              <CommandCenterDashboard
                trades={filteredTrades}
                selectedAccountId={selectedAccount}
                setSelectedAccountId={handleAccountChange}
                currentBalance={currentBalance}
                onNavigateToImport={() => navigate("/Trades")}
                onNavigateToSettings={() => navigate("/Settings")}
                evaluations={evaluations}
              />
            </div>
          </main>
        </div>
      </div>
    </Suspense>
  );
}

// Dashboard with authentication and subscription verification
export default function Dashboard() {
  return (
    <UserGuard>
      <SubscriptionGuard>
        <DashboardContent />
      </SubscriptionGuard>
    </UserGuard>
  );
}

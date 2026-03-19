import React, { useState, useMemo, useCallback, useRef, useEffect, Suspense } from "react";
import { Header } from "components/Header";
import { Sidebar } from "components/Sidebar";
import { ProtectedRoute } from "components/ProtectedRoute";
import { useUserGuardContext } from "app";
import { LoadingFallback, LoadingSpinner } from "components/LoadingFallback";
import { useStore } from "utils/store";
import { Trade, Evaluation } from "utils/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, Trash2, PlusCircle, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, BarChart3, Users, AlertTriangle, Bot, Upload, FileText, CheckCircle, Zap, Edit3, DollarSign, Calendar, Clock, Search, TrendingUp, TrendingDown, AlertCircle, Filter, ExternalLink, Tag, Camera, Eye } from "lucide-react";
import brain from "brain";
import { toast } from "sonner";
import { calculateNetPnl, isTradeProfit } from "utils/tradingHooks";
import { getBackgroundClasses, backgroundEffects, getTextClasses, getCardClasses } from "utils/designSystem";
import { getEvaluations } from "utils/firestore";
import { TagManager } from "components/TagManager";
import { TradeDetailsModal } from 'components/TradeDetailsModal';
import TradeGrouping from "components/TradeGrouping";
import { ManualTradeEntryForm } from "components/ManualTradeEntryForm";

type SortKey = keyof Trade | "netPnl";

function TradesContent() {
  const { user } = useUserGuardContext();
  const { trades, fetchTrades, isSidebarCollapsed, updateTradeTags, updateTradeNotes } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>("closeTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<string>("");
  const [selectedEvaluationFilter, setSelectedEvaluationFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Delete by account state - now using evaluation-based filtering
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>("");
  const [isDeletingByAccount, setIsDeletingByAccount] = useState(false);
  
  // Deletion state for global delete
  const [isDeletingAllTrades, setIsDeletingAllTrades] = useState(false);
  
  // Individual trade deletion state
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [isIndividualDeleteDialogOpen, setIsIndividualDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isAccountDeleteDialogOpen, setIsAccountDeleteDialogOpen] = useState(false);
  const [isGlobalDeleteDialogOpen, setIsGlobalDeleteDialogOpen] = useState(false);
  
  // Add evaluations state for dropdown
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Notes modal state
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Safe fetch with error handling
  const handleFetchTrades = useCallback(async () => {
    if (!user) return;
    
    try {
      setHasError(false);
      await fetchTrades(user.uid);
    } catch (error: any) {
      console.error('Error fetching trades:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Failed to load trades');
    }
  }, [user, fetchTrades]);

  useEffect(() => {
    handleFetchTrades();
  }, [handleFetchTrades]);

  // Error state
  if (hasError) {
    return (
      <div className={getBackgroundClasses()}>
        <div
          className={`flex min-h-screen w-full flex-col ${
            isSidebarCollapsed ? "lg:pl-14" : "lg:pl-64"
          }`}
        >
          <Sidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-8">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Trades</h1>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <Button onClick={handleFetchTrades}>Try Again</Button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Safe trades array with fallback
  const safeTradesArray = trades || [];

  // Trade Details Modal state
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isTradeDetailsModalOpen, setIsTradeDetailsModalOpen] = useState(false);
  
  // Tags editing state
  const [editingTags, setEditingTags] = useState<{[key: string]: string}>({});
  const [deletingTags, setDeletingTags] = useState<Set<string>>(new Set());

  // Handle opening trade details modal
  const handleOpenTradeDetails = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setIsTradeDetailsModalOpen(true);
  }, []);

  // Optimize data processing with pagination
  const { sortedAndFilteredTrades, totalTrades, totalPages } = useMemo(() => {
    const tradesArray = safeTradesArray; // Use safe trades array
    let result: Trade[] = [...tradesArray];

    // Filtering (apply before pagination for accurate counts)
    if (filter) {
      result = result.filter(
        (trade) =>
          trade?.symbol?.toLowerCase()?.includes(filter.toLowerCase()) ||
          trade?.tags?.some((tag) =>
            tag?.toLowerCase()?.includes(filter.toLowerCase())
          )
      );
    }

    // Evaluation-based filtering
    if (selectedEvaluationFilter && selectedEvaluationFilter !== 'all') {
      result = result.filter(
        (trade) => {
          // Method 1: Check direct evaluationId field (for manual trades)
          if (trade.evaluationId === selectedEvaluationFilter) {
            return true;
          }
          
          // Method 2: Find evaluation by matching accountId (for imported trades)
          const matchingEvaluation = evaluations.find(
            (evaluation) => evaluation.accountId === trade.accountId,
          );
          return matchingEvaluation?.id === selectedEvaluationFilter;
        }
      );
    }

    const totalCount = result.length;
    const pages = Math.ceil(totalCount / pageSize);

    // Sorting (only sort what we need to display)
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortKey === "netPnl") {
        aValue = a?.pnl || 0;
        bValue = b?.pnl || 0;
      } else {
        aValue = a?.[sortKey as keyof Trade] || "";
        bValue = b?.[sortKey as keyof Trade] || "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    // Pagination (slice after sorting)
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResult = result.slice(startIndex, endIndex);

    return {
      sortedAndFilteredTrades: paginatedResult,
      totalTrades: totalCount,
      totalPages: pages
    };
  }, [trades, sortKey, sortDirection, filter, selectedEvaluationFilter, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedEvaluationFilter, sortKey, sortDirection]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }, [sortKey, sortDirection]);

  // Deletion handlers
  const handleDeleteAccountTrades = useCallback(async () => {
    if (!selectedEvaluationId || !user) return;
    
    setIsDeletingByAccount(true);
    try {
      const evaluation = evaluations.find(e => e.id === selectedEvaluationId);
      if (!evaluation) {
        toast.error("Selected evaluation not found");
        return;
      }
      
      const response = await brain.delete_trades_by_evaluation({
        evaluationId: selectedEvaluationId
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Refresh trades data
        await fetchTrades(user.uid, true);
        setIsAccountDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete evaluation trades");
      }
    } catch (error) {
      console.error("Error deleting evaluation trades:", error);
      toast.error("Failed to delete evaluation trades");
    } finally {
      setIsDeletingByAccount(false);
    }
  }, [selectedEvaluationId, user, evaluations, fetchTrades]);

  const handleDeleteAllTrades = useCallback(async () => {
    if (!user) return;
    
    setIsDeletingAllTrades(true);
    try {
      const response = await brain.delete_all_trades();
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Refresh trades data
        await fetchTrades(user.uid, true);
        setIsGlobalDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete all trades");
      }
    } catch (error) {
      console.error("Error deleting all trades:", error);
      toast.error("Failed to delete all trades");
    } finally {
      setIsDeletingAllTrades(false);
    }
  }, [user, fetchTrades]);

  // Get unique account IDs for the dropdown
  const accountOptions = useMemo(() => {
    const uniqueAccounts = Array.from(
      new Set(
        trades
          .map((trade) => trade.accountId)
          .filter((id): id is string => {
            // Type guard to ensure we only get valid string values
            return typeof id === 'string' && id.trim().length > 0;
          })
      )
    );
    console.log("Available account options:", uniqueAccounts);
    console.log("Total trades:", trades.length);
    return uniqueAccounts;
  }, [trades]);

  const handleDeleteTradesByAccount = useCallback(async () => {
    if (!selectedEvaluationId) {
      toast.error("Please select an evaluation first.");
      return;
    }
    
    setIsDeletingByAccount(true);
    toast.loading(`Deleting trades for evaluation ${selectedEvaluationId}...`);
    try {
      const response = await brain.delete_trades_by_evaluation({ evaluationId: selectedEvaluationId });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        if (user) {
          fetchTrades(user.uid); // Refresh the trades list
        }
        setSelectedEvaluationId(""); // Reset selection
      } else {
        toast.error(result.message || "An unknown error occurred.");
      }
    } catch (error: any) {
      const errorData = await error.response?.json();
      toast.error(
        errorData?.detail || "An error occurred during the deletion.",
      );
    } finally {
      setIsDeletingByAccount(false);
    }
  }, [selectedEvaluationId, user, fetchTrades]);

  const handleDeleteTradesByAccountWithId = useCallback(async (evaluationId: string) => {
    console.log("=== DELETE FUNCTION CALLED ===");
    console.log("Delete function called with evaluationId:", evaluationId);
    console.log("Type of evaluationId:", typeof evaluationId);
    console.log("EvaluationId length:", evaluationId?.length);
    console.log("EvaluationId JSON:", JSON.stringify(evaluationId));
    console.log("Current selectedEvaluationId state:", selectedEvaluationId);
    
    // Log some sample trades to see their accountId format
    console.log("Sample trades with accountIds:");
    trades.slice(0, 5).forEach((trade, index) => {
      console.log(`Trade ${index}:`, {
        id: trade.id,
        accountId: trade.accountId,
        accountIdType: typeof trade.accountId,
        accountIdJson: JSON.stringify(trade.accountId)
      });
    });
    
    if (!evaluationId) {
      console.log("ERROR: No evaluation ID provided");
      toast.error("No evaluation selected.");
      return;
    }
    
    console.log("About to call API with evaluation_id:", evaluationId);
    setIsDeletingByAccount(true);
    try {
      const response = await brain.delete_trades_by_evaluation({ evaluationId: evaluationId });
      console.log("API response status:", response.status);
      const result = await response.json();
      console.log("API response data:", result);

      if (result.success) {
        toast.success(result.message);
        if (user) {
          fetchTrades(user.uid); // Refresh the trades list
        }
        setSelectedEvaluationId(""); // Reset selection
      } else {
        toast.error(result.message || "An unknown error occurred.");
      }
    } catch (error: any) {
      console.log("API call error:", error);
      const errorData = await error.response?.json();
      console.log("Error response data:", errorData);
      toast.error(
        errorData?.detail || "An error occurred during the deletion.",
      );
    } finally {
      setIsDeletingByAccount(false);
    }
  }, [user, fetchTrades, selectedEvaluationId, trades]);

  // Individual trade deletion function
  const handleDeleteIndividualTrade = useCallback(async () => {
    if (!tradeToDelete?.id || !user) {
      toast.error("Unable to delete trade: missing trade ID or user");
      return;
    }

    setDeletingTradeId(tradeToDelete.id);
    try {
      const response = await brain.delete_trades({
        trade_ids: [tradeToDelete.id],
        reason: "Individual trade deletion by user",
        user_notes: `Deleted trade ${tradeToDelete.symbol} manually`
      });

      if (response.ok) {
        toast.success(`Trade ${tradeToDelete.symbol} deleted successfully`);
        // Refresh the trades list
        if (user) {
          await fetchTrades(user.uid, true);
        }
        setIsIndividualDeleteDialogOpen(false);
        setTradeToDelete(null);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete trade");
      }
    } catch (error) {
      console.error("Error deleting individual trade:", error);
      toast.error("Failed to delete trade");
    } finally {
      setDeletingTradeId(null);
    }
  }, [tradeToDelete, user, fetchTrades]);

  // Load evaluations on mount
  useEffect(() => {
    const loadEvaluations = async () => {
      if (!user) return;
      try {
        const userEvaluations = await getEvaluations(user.uid);
        setEvaluations(userEvaluations);
      } catch (error) {
        console.error("Error loading evaluations:", error);
      }
    };
    loadEvaluations();
  }, [user]);

  const [activeTab, setActiveTab] = useState("individual");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEvaluationForUpload, setSelectedEvaluationForUpload] = useState<string>("");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("UTC");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Manual trade entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isAutomatedOpen, setIsAutomatedOpen] = useState(true);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Add file upload handlers
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress("");
    }
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !selectedEvaluationForUpload || !selectedTimezone || !user) {
      toast.error("Please select an evaluation, timezone, and file before uploading.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Analyzing file structure...");

    try {
      // First, analyze file structure
      const analysisResponse = await brain.analyze_file_structure({ file: selectedFile });
      
      if (!analysisResponse.ok) {
        const error = await analysisResponse.json();
        throw new Error(error.detail || "Failed to analyze file structure")
      }

      const analysisResult = await analysisResponse.json();
      setUploadProgress("Processing trades and saving to evaluation...");

      // Then process the file with the evaluation ID and timezone
      const processResponse = await brain.process_file(
        {
          analysis: JSON.stringify(analysisResult.analysis),
          evaluation_id: selectedEvaluationForUpload,
          broker_timezone: selectedTimezone
        },
        { file: selectedFile }
      );

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.detail || "Failed to process file");
      }

      const processResult = await processResponse.json();
      
      if (processResult.success) {
        const evaluation = evaluations.find(e => e.id === selectedEvaluationForUpload);
        toast.success(
          `Successfully imported ${processResult.trades_processed} trades to ${evaluation?.firm} - ${evaluation?.accountId} (${selectedTimezone} timezone)`
        );
        
        // Refresh trades data
        await fetchTrades(user.uid, true);
        
        // Reset form
        setSelectedFile(null);
        setSelectedEvaluationForUpload("");
        setSelectedTimezone("UTC");
        setUploadProgress("");
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        throw new Error(processResult.message || "File processing failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, selectedEvaluationForUpload, selectedTimezone, user, evaluations, fetchTrades]);

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress("");
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      await Promise.all([
        fetchTrades(user.uid),
        loadEvaluations()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };
  
  useEffect(() => {
    fetchInitialData();
  }, [user]);

  // Tags handlers
  const handleTagsChange = useCallback((tradeId: string, tags: string) => {
    setEditingTags(prev => ({
      ...prev,
      [tradeId]: tags
    }));
  }, []);

  const handleSaveTags = useCallback(async (tradeId: string) => {
    if (!user || editingTags[tradeId] === undefined) return;
    
    setDeletingTags(prev => new Set([...prev, tradeId]));
    try {
      await updateTradeTags(user.uid, tradeId, editingTags[tradeId]);
      toast.success('Tags saved!');
      // Clear editing state
      setEditingTags(prev => {
        const updated = { ...prev };
        delete updated[tradeId];
        return updated;
      });
    } catch (error) {
      toast.error('Failed to save tags');
    } finally {
      setDeletingTags(prev => {
        const updated = new Set(prev);
        updated.delete(tradeId);
        return updated;
      });
    }
  }, [user, editingTags, updateTradeTags]);

  const handleCancelTags = useCallback((tradeId: string) => {
    setEditingTags(prev => {
      const updated = { ...prev };
      delete updated[tradeId];
      return updated;
    });
  }, []);

  // Notes modal handlers
  const handleOpenNotesModal = useCallback((tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId);
    if (trade) {
      setEditingTradeId(tradeId);
      setCurrentNotes(trade.notes || '');
      setIsNotesModalOpen(true);
    }
  }, [trades]);

  const handleSaveNotes = useCallback(async () => {
    if (!editingTradeId || !user) return;
    
    setIsSavingNotes(true);
    try {
      await updateTradeNotes(user.uid, editingTradeId, currentNotes);
      toast.success('Notes saved successfully!');
      setIsNotesModalOpen(false);
      setEditingTradeId(null);
      setCurrentNotes('');
    } catch (error) {
      toast.error('Failed to save notes');
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  }, [editingTradeId, user, currentNotes, updateTradeNotes]);

  const handleCancelNotes = useCallback(() => {
    setIsNotesModalOpen(false);
    setEditingTradeId(null);
    setCurrentNotes('');
  }, []);

  // Load selected evaluation filter from localStorage on mount
  useEffect(() => {
    const savedEvaluationFilter = localStorage.getItem('trades-evaluation-filter');
    if (savedEvaluationFilter) {
      setSelectedEvaluationFilter(savedEvaluationFilter);
    }
  }, []);

  // Save evaluation filter to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('trades-evaluation-filter', selectedEvaluationFilter);
  }, [selectedEvaluationFilter]);

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
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-8">
            <Tabs defaultValue="individual">
              <TabsList>
                <TabsTrigger value="individual">Individual Trades</TabsTrigger>
                <TabsTrigger value="grouped">Grouped Trades</TabsTrigger>
                <TabsTrigger value="import">Import Trades</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="space-y-4">
                <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Input
                    placeholder="Filter by symbol or tag..."
                    value={filter}
                    onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value), [])}
                    className="bg-gray-900 border-gray-800 text-white max-w-sm"
                  />
                  
                  {/* Evaluation Filter Dropdown */}
                  <Select onValueChange={setSelectedEvaluationFilter} value={selectedEvaluationFilter}>
                    <SelectTrigger className="w-[200px] bg-gray-900 border-gray-800 text-white">
                      <SelectValue placeholder="Filter by evaluation" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 text-white border-gray-800">
                      <SelectItem value="all">All Evaluations</SelectItem>
                      {evaluations.map((evaluation) => (
                        <SelectItem key={evaluation.id} value={evaluation.id}>
                          {evaluation.firm} - {evaluation.accountId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {totalTrades}of {trades.length} trades
                    </span>
                  </div>
                  
                  {/* Deletion Controls */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Account-specific deletion */}
                    <div className="flex items-center gap-2">
                      <Select onValueChange={setSelectedEvaluationId} value={selectedEvaluationId}>
                        <SelectTrigger className="w-[200px] bg-gray-900 border-gray-800 text-white">
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 text-white border-gray-800">
                          {evaluations.map((evaluation) => (
                            <SelectItem key={evaluation.id} value={evaluation.id}>
                              {evaluation.firm} - {evaluation.accountId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsAccountDeleteDialogOpen(true)}
                        disabled={!selectedEvaluationId || isDeletingByAccount}
                        className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400"
                      >
                        {isDeletingByAccount ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-400" />
                            Deleting...
                          </div>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Global deletion */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsGlobalDeleteDialogOpen(true)}
                      disabled={isDeletingAllTrades || trades.length === 0}
                      className="bg-red-700/20 hover:bg-red-700/30 border border-red-600/50 text-red-300"
                    >
                      {isDeletingAllTrades ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-red-300" />
                          Deleting...
                        </div>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                          <TableRow>
                            {[
                              { key: "symbol", label: "Symbol" },
                              { key: "netPnl", label: "Net P&L" },
                              { key: "type", label: "Type" },
                              { key: "lots", label: "Lots" },
                              { key: "openTime", label: "Open Time" },
                              { key: "closeTime", label: "Close Time" },
                              { key: "commission", label: "Commission" },
                              { key: "tags", label: "Tags" },
                              { key: "actions", label: "Actions" },
                            ].map(({ key, label }) => (
                              <TableHead key={key} className="text-white">
                                {key === "actions" ? (
                                  <span>{label}</span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    onClick={useCallback(() => handleSort(key as SortKey), [handleSort, key])}
                                  >
                                    {label}
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                  </Button>
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {useMemo(() => 
                            sortedAndFilteredTrades.map((trade, index) => {
                              const netPnl = calculateNetPnl(trade);
                              // Use index as fallback if trade.id is missing
                              const key = trade.id || `trade-${index}`;
                              
                              return (
                                <TableRow key={key} className="hover:bg-gray-800/50">
                                  <TableCell>
                                    <span>{trade.symbol || 'N/A'}</span>
                                  </TableCell>
                                  <TableCell
                                    className={netPnl > 0 ? "text-green-400" : "text-red-400"}
                                  >
                                    {isNaN(netPnl) ? 'N/A' : netPnl.toFixed(2)}
                                  </TableCell>
                                  <TableCell>{trade.type || 'N/A'}</TableCell>
                                  <TableCell>{trade.lots || 0}</TableCell>
                                  <TableCell>
                                    {trade.openTime ? new Date(trade.openTime).toLocaleString() : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {trade.closeTime ? new Date(trade.closeTime).toLocaleString() : 'N/A'}
                                  </TableCell>
                                  <TableCell>{(trade.commission || 0).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <TagManager trade={trade} />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenTradeDetails(trade)}
                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                        disabled={!trade.id}
                                        title="View Trade Details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTradeToDelete(trade);
                                          setIsIndividualDeleteDialogOpen(true);
                                        }}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        disabled={!trade.id}
                                        title="Delete Trade"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            }), [sortedAndFilteredTrades, handleOpenTradeDetails]
                          )}
                        </TableBody>
                    </Table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-1 py-3 border-t">
                        <div className="flex items-center text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Suspense>
              </TabsContent>
              
              <TabsContent value="grouped" className="space-y-4">
                <Suspense fallback={<LoadingSpinner />}>
                  <TradeGrouping trades={trades} />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="import" className="space-y-4">
                {/* Automated Import Section */}
                <Collapsible open={isAutomatedOpen} onOpenChange={setIsAutomatedOpen}>
                  <div className={getCardClasses('default', 'lg')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-1">
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-blue-400" />
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-white">Automated Import</h2>
                            <p className="text-gray-400 text-sm">Upload trading files for AI-powered import</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAutomatedOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="pt-6">
                        <div className="space-y-6">
                          {/* Step 1: Select Evaluation */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                                1
                              </div>
                              <h2 className="text-lg font-semibold text-white">
                                Select Evaluation Account
                              </h2>
                            </div>
                            
                            <Select 
                              onValueChange={setSelectedEvaluationForUpload} 
                              value={selectedEvaluationForUpload}
                              disabled={isUploading}
                            >
                              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                <SelectValue placeholder="Choose which evaluation to import trades to" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 text-white border-gray-800">
                                {evaluations.map((evaluation) => (
                                  <SelectItem key={evaluation.id} value={evaluation.id}>
                                    {`${evaluation.firm} - ${evaluation.accountId} (${evaluation.status})`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {evaluations.length === 0 && (
                              <div className="text-yellow-400 text-sm bg-yellow-900/20 p-3 rounded-lg border border-yellow-700/30">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>No evaluations found. Create an evaluation account first in Settings.</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Step 2: Select Timezone */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                                selectedEvaluationForUpload ? 'bg-blue-500' : 'bg-gray-600'
                              }`}>
                                2
                              </div>
                              <h3 className={`text-lg font-semibold ${
                                selectedEvaluationForUpload ? 'text-white' : 'text-gray-500'
                              }`}>Select Broker Timezone</h3>
                            </div>
                            
                            <div className="space-y-2">
                              <Select 
                                onValueChange={setSelectedTimezone} 
                                value={selectedTimezone}
                                disabled={!selectedEvaluationForUpload || isUploading}
                              >
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                  <SelectValue placeholder="Choose your broker's timezone" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 text-white border-gray-800">
                                  <SelectItem value="UTC">UTC (Universal Coordinated Time)</SelectItem>
                                  <SelectItem value="Etc/GMT-3">GMT+3 (MT5 / Moscow Standard Time)</SelectItem>
                                  <SelectItem value="America/New_York">EST/EDT (New York) - Most US Brokers</SelectItem>
                                  <SelectItem value="America/Chicago">CST/CDT (Chicago)</SelectItem>
                                  <SelectItem value="America/Los_Angeles">PST/PDT (Los Angeles)</SelectItem>
                                  <SelectItem value="Europe/London">GMT/BST (London)</SelectItem>
                                  <SelectItem value="Europe/Frankfurt">CET/CEST (Frankfurt)</SelectItem>
                                  <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                                  <SelectItem value="Asia/Singapore">SGT (Singapore)</SelectItem>
                                  <SelectItem value="Australia/Sydney">AEST/AEDT (Sydney)</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div className="text-sm text-gray-400 bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-blue-400 mb-1">Why timezone matters:</p>
                                    <p>Your trade times will be converted to UTC to align with chart data. Select your broker's timezone for accurate trade marker positioning.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Step 3: Select File */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                                selectedEvaluationForUpload && selectedTimezone ? 'bg-blue-500' : 'bg-gray-600'
                              }`}>
                                3
                              </div>
                              <h3 className={`text-lg font-semibold ${
                                selectedEvaluationForUpload && selectedTimezone ? 'text-white' : 'text-gray-500'
                              }`}>Select Trading File</h3>
                            </div>
                            
                            <div className="relative">
                              <input
                                id="file-upload"
                                type="file"
                                accept=".csv,.xlsx,.xls,.html,.pdf,.txt"
                                onChange={handleFileSelect}
                                disabled={!selectedEvaluationForUpload || isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                !selectedEvaluationForUpload || isUploading
                                  ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                                  : 'border-gray-600 hover:border-blue-500 bg-gray-800/30 cursor-pointer'
                              }`}>
                                {selectedFile ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <FileText className="w-6 h-6 text-green-400" />
                                      <span className="text-white font-medium">{selectedFile.name}</span>
                                      <button
                                        onClick={removeSelectedFile}
                                        disabled={isUploading}
                                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Upload className={`w-8 h-8 mx-auto ${
                                      selectedEvaluationForUpload ? 'text-blue-400' : 'text-gray-600'
                                    }`} />
                                    <p className={`text-sm ${
                                      selectedEvaluationForUpload ? 'text-gray-300' : 'text-gray-500'
                                    }`}>
                                      {selectedEvaluationForUpload 
                                        ? 'Click to select a trading file or drag and drop'
                                        : 'Select an evaluation first to enable file upload'
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Supported: CSV, Excel, HTML, PDF, TXT
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Step 4: Upload */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                                selectedFile && selectedEvaluationForUpload ? 'bg-blue-500' : 'bg-gray-600'
                              } `}>
                                4
                              </div>
                              <h3 className={`text-lg font-semibold ${
                                selectedFile && selectedEvaluationForUpload ? 'text-white' : 'text-gray-500'
                              }`}>Process & Import</h3>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <Button
                                onClick={handleFileUpload}
                                disabled={!selectedFile || !selectedEvaluationForUpload || !selectedTimezone || isUploading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500"
                              >
                                {isUploading ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                                    Processing...
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4" />
                                    Import with AI
                                  </div>
                                )}
                              </Button>
                              
                              {uploadProgress && (
                                <div className="flex items-center gap-2 text-blue-400">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-400" />
                                  <span className="text-sm">{uploadProgress}</span>
                                </div>
                              )}
                            </div>
                            
                            {isUploading && (
                              <div className="text-sm text-gray-400 bg-blue-F00/20 p-3 rounded-lg border border-blue-700/30">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-4 h-4 text-blue-400" />
                                  <span>AI is analyzing your trading data and importing trades...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Help Text */}
                          <div className="text-sm text-gray-400 bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                            <h4 className="font-medium text-white mb-2">How automated import works:</h4>
                            <ul className="space-y-1 list-disc list-inside">
                              <li>Select the evaluation account where you want to import trades</li>
                              <li>Upload your trading file (MT4/MT5 HTML, CSV, Excel, etc.)</li>
                              <li>Our AI will intelligently parse and import your trades</li>
                              <li>Trades will be automatically organized in your selected evaluation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                
                {/* Manual Import Section */}
                <Collapsible open={isManualOpen} onOpenChange={setIsManualOpen}>
                  <div className={getCardClasses('default', 'lg')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-1">
                        <div className="flex items-center gap-3">
                          <Edit3 className="w-6 h-6 text-purple-400" />
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-white">Manual Import</h2>
                            <p className="text-gray-400 text-sm">Enter trades manually with rich metadata and notes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isManualOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="pt-6">
                        {showManualEntry ? (
                          <ManualTradeEntryForm
                            evaluations={evaluations}
                            onSuccess={() => {
                              setShowManualEntry(false);
                              setIsManualOpen(true);
                            }}
                            onCancel={() => setShowManualEntry(false)}
                          />
                        ) : (
                          <div className="text-center py-12">
                            <div className="space-y-4">
                              <Edit3 className="w-16 h-16 mx-auto text-purple-400" />
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Manual Trade Entry</h3>
                                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                  Enter trades manually with detailed notes, custom tags, chart screenshots, and rich metadata for comprehensive trade journaling.
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-1 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-400" />
                                  </div>
                                  <h4 className="font-semibold text-white mb-1">Rich Notes</h4>
                                  <p className="text-sm text-gray-400">Add detailed analysis and observations</p>
                                </div>
                                
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-3 bg-green-600/20 rounded-lg flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-green-400" />
                                  </div>
                                  <h4 className="font-semibold text-white mb-1">Chart Screenshots</h4>
                                  <p className="text-sm text-gray-400">Upload chart images for context</p>
                                </div>
                                
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-1 bg-orange-600/80 rounded-lg flex items-center justify-center">
                                    <Edit3 className="w-6 h-6 text-orange-400" />
                                  </div>
                                  <h4 className="font-semibold text-white mb-1">Custom Tags</h4>
                                  <p className="text-sm text-gray-400">Organize with personalized tags</p>
                                </div>
                              </div>
                              
                              {evaluations.length > 0 ? (
                                <Button
                                  onClick={() => {
                                    setShowManualEntry(true);
                                    setIsManualOpen(true);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                                >
                                  <Edit3 className="w-5 h-5 mr-2" />
                                  Start Manual Entry
                                </Button>
                              ) : (
                                <div className="text-yellow-400 bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/30 max-w-md mx-auto">
                                  <div className="flex items-center gap-2 justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Create an evaluation account first in Settings to enable manual trade entry.</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      
      {/* Account Deletion Confirmation Dialog */}
      <AlertDialog open={isAccountDeleteDialogOpen} onOpenChange={setIsAccountDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Account Trades
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {selectedEvaluationId && evaluations.find(e => e.id === selectedEvaluationId) ? (
                <>
                  You are about to delete <strong>ALL TRADES</strong> from account{" "}
                  <strong className="text-red-400">
                    {evaluations.find(e => e.id === selectedEvaluationId)?.firm} - {evaluations.find(e => e.id === selectedEvaluationId)?.accountId}
                  </strong>.
                  <br /><br />
                  This action <strong className="text-red-400">CANNOT BE UNDONE</strong>. All trading data for this specific account will be permanently removed.
                </>
              ) : (
                "Please select an account first."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccountTrades}
              disabled={isDeletingByAccount || !selectedEvaluationId}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingByAccount ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                  Deleting...
                </div>
              ) : (
                "Yes, Delete Account Trades"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Global Deletion Confirmation Dialog */}
      <AlertDialog open={isGlobalDeleteDialogOpen} onOpenChange={setIsGlobalDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete ALL Trades
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You are about to delete <strong className="text-red-400">ALL {trades.length} TRADES</strong> from{" "}
              <strong className="text-red-400">ALL ACCOUNTS</strong>.
              <br /><br />
              This action <strong className="text-red-400">CANNOT BE UNDONE</strong>. Your entire trading history will be permanently removed.
              <br /><br />
              <span className="text-yellow-400">⚠️ This will delete everything. Are you absolutely sure?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllTrades}
              disabled={isDeletingAllTrades}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {isDeletingAllTrades ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                  Deleting...
                </div>
              ) : (
                "Yes, Delete ALL Trades"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Individual Trade Deletion Confirmation Dialog */}
      <AlertDialog open={isIndividualDeleteDialogOpen} onOpenChange={setIsIndividualDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Trade
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {tradeToDelete ? (
                <>
                  You are about to delete <strong>{tradeToDelete.symbol}</strong> from account{" "}
                  <strong className="text-red-400">
                    {tradeToDelete.firm} - {tradeToDelete.accountId}
                  </strong>.
                  <br /><br />
                  This action <strong className="text-red-400">CANNOT BE UNDONE</strong>. The trade will be permanently removed.
                </>
              ) : (
                "Please select a trade first."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIndividualTrade}
              disabled={deletingTradeId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingTradeId !== null ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                  Deleting...
                </div>
              ) : (
                "Yes, Delete Trade"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Trade Details Modal */}
      <TradeDetailsModal
        trade={selectedTrade}
        isOpen={isTradeDetailsModalOpen}
        onClose={() => {
          setIsTradeDetailsModalOpen(false);
          setSelectedTrade(null);
        }}
        onUpdate={() => {
          // Refresh trades after update
          handleFetchTrades();
        }}
        onDelete={async (tradeId: string) => {
          // Delete trade
          setTradeToDelete(selectedTrade);
          setIsIndividualDeleteDialogOpen(true);
          setIsTradeDetailsModalOpen(false);
          setSelectedTrade(null);
        }}
      />
      
      {/* Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Edit Trade Notes
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {editingTradeId && trades.find(t => t.id === editingTradeId) ? (
                <>Edit notes for trade <strong>{trades.find(t => t.id === editingTradeId)?.symbol}</strong></>
              ) : (
                "Loading trade information..."
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-300 mb-2">
                Analysis & Notes
              </label>
              <Textarea
                id="notes-textarea"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                placeholder="Add your analysis and notes about this trade..."
                className="min-h-[200px] bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                disabled={isSavingNotes}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelNotes}
              disabled={isSavingNotes}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSavingNotes ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </div>
              ) : (
                'Save Notes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Trades page with authentication
// Trades page with simplified authentication.
export default function Trades() {
  return (
    <ProtectedRoute>
      <TradesContent />
    </ProtectedRoute>
  );
}

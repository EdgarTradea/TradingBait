import { useState, useEffect, useMemo } from "react";
import { useUserGuardContext } from "app";
import brain from "brain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, Edit, FileSearch, Plus } from "lucide-react";
import { TradeEditor } from "components/TradeEditor";
import { ConflictResolver } from "components/ConflictResolver";
import { ManualTradeEntry } from "components/ManualTradeEntry";
import { DataQualityMetrics } from "components/DataQualityMetrics";
import { AuditTrail } from "components/AuditTrail";
import { getCardClasses, getTextClasses } from "utils/designSystem";

interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  pnl: number;
  accountId?: string;
}

interface DataQualityTabProps {
  trades: Trade[];
  evaluations: any[];
}

interface QualityAssessment {
  overallScore: number;
  totalTrades: number;
  validTrades: number;
  missingData: number;
  conflicts: number;
  duplicates: number;
  issues: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    affectedTrades: number;
    suggestedAction: string;
  }>;
  recommendations: string[];
}

interface ConflictData {
  id: string;
  tradeId: string;
  field: string;
  brokerValue: any;
  parsedValue: any;
  suggestedResolution: string;
}

export function DataQualityTab({ trades, evaluations }: DataQualityTabProps) {
  const { user } = useUserGuardContext();
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [qualityData, setQualityData] = useState<QualityAssessment | null>(null);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeEditor, setShowTradeEditor] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Fetch data quality assessment
  useEffect(() => {
    const fetchQualityData = async () => {
      if (!user || trades.length === 0) return;
      
      setLoading(true);
      try {
        const response = await brain.assess_data_quality();
        if (response.ok) {
          const data = await response.json();
          setQualityData(data);
        }
      } catch (error) {
        console.error('Failed to fetch quality data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();
  }, [user, trades]);

  // Mock conflicts for now - would come from API in real implementation
  useEffect(() => {
    if (qualityData?.conflicts && qualityData.conflicts > 0) {
      setConflicts([
        {
          id: "conf-1",
          tradeId: "trade-123",
          field: "closePrice",
          brokerValue: 1.2350,
          parsedValue: 1.2351,
          suggestedResolution: "use_broker"
        },
        {
          id: "conf-2", 
          tradeId: "trade-124",
          field: "quantity",
          brokerValue: 10000,
          parsedValue: 100000,
          suggestedResolution: "use_broker"
        }
      ]);
    }
  }, [qualityData]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: "bg-red-500",
      warning: "bg-yellow-500", 
      info: "bg-blue-500"
    };
    return variants[severity as keyof typeof variants] || "bg-gray-500";
  };

  const handleEditTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeEditor(true);
  };

  const handleTradeUpdated = () => {
    setShowTradeEditor(false);
    setSelectedTrade(null);
    // Refresh quality data
    window.location.reload();
  };

  const issuesByType = useMemo(() => {
    if (!qualityData?.issues) return {};
    return qualityData.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [qualityData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">Analyzing data quality...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className={getTextClasses('primary', 'title')}>Data Quality Management</h2>
        <p className="text-gray-400 mt-2">Resolve conflicts, handle edge cases, and improve data accuracy</p>
      </div>

      {/* Quality Overview Cards */}
      {qualityData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={getCardClasses('default')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(qualityData.overallScore)}`}>
                {qualityData.overallScore}%
              </div>
              <p className="text-xs text-gray-500">Data quality rating</p>
            </CardContent>
          </Card>

          <Card className={getCardClasses('default')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Issues Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {qualityData.issues.length}
              </div>
              <p className="text-xs text-gray-500">Requiring attention</p>
            </CardContent>
          </Card>

          <Card className={getCardClasses('default')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Valid Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {qualityData.validTrades}
              </div>
              <p className="text-xs text-gray-500">Out of {qualityData.totalTrades}</p>
            </CardContent>
          </Card>

          <Card className={getCardClasses('default')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Conflicts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {qualityData.conflicts}
              </div>
              <p className="text-xs text-gray-500">Need resolution</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Interface */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Conflicts</span>
          </TabsTrigger>
          <TabsTrigger value="edit-trades" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Trades</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DataQualityMetrics 
            qualityData={qualityData} 
            issuesByType={issuesByType}
            trades={trades}
          />
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <ConflictResolver 
            conflicts={conflicts}
            onConflictResolved={() => {
              // Refresh conflicts list
              setConflicts(prev => prev.filter(c => c.id !== conflicts[0]?.id));
            }}
          />
        </TabsContent>

        <TabsContent value="edit-trades" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Trade Management</h3>
              <Button 
                onClick={() => setShowManualEntry(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Missing Trade
              </Button>
            </div>
            
            {/* Trade List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trades.slice(0, 10).map((trade) => (
                <Card key={trade.id} className={getCardClasses('default')}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-white">{trade.symbol}</span>
                        <span className="text-gray-400">{trade.quantity} units</span>
                        <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${trade.pnl.toFixed(2)}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditTrade(trade)}
                        className="border-gray-600 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditTrail />
        </TabsContent>
      </Tabs>

      {/* Trade Editor Modal */}
      {showTradeEditor && selectedTrade && (
        <TradeEditor
          trade={selectedTrade}
          isOpen={showTradeEditor}
          onClose={() => setShowTradeEditor(false)}
          onTradeUpdated={handleTradeUpdated}
        />
      )}

      {/* Manual Trade Entry Modal */}
      {showManualEntry && (
        <ManualTradeEntry
          evaluations={evaluations}
          isOpen={showManualEntry}
          onClose={() => setShowManualEntry(false)}
          onTradeAdded={handleTradeUpdated}
        />
      )}
    </div>
  );
}

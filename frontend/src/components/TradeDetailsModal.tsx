import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  FileText, 
  Tag, 
  Edit3, 
  Camera, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Trash2
} from 'lucide-react';
import { Trade } from 'utils/types';
import { TagManager } from 'components/TagManager';
import { calculateNetPnl } from 'utils/tradingHooks';
import { getCardClasses } from 'utils/designSystem';
import { useUserGuardContext } from 'app';
import { toast } from 'sonner';
import brain from 'utils/brain';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TradeDetailsModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (trade: Trade) => void;
  onUpdate?: () => void;
}

interface ScreenshotData {
  id: string;
  url: string;
  timestamp: string;
  filename: string;
}

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  trade,
  isOpen,
  onClose,
  onDelete,
  onUpdate
}) => {
  const { user } = useUserGuardContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  
  // Metadata editing state
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    strategy: '',
    marketConditions: '',
    emotionsBefore: '',
    emotionsAfter: '',
    riskLevel: '',
    duration: ''
  });
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Calculate trade metrics - using optional chaining to handle null trade
  const netPnl = trade ? calculateNetPnl(trade) : 0;
  const isProfit = netPnl > 0;

  // Calculate trade duration
  const tradeDuration = useMemo(() => {
    if (!trade?.openTime || !trade?.closeTime) return 'N/A';
    const duration = new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime();
    const minutes = Math.round(duration / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  }, [trade?.openTime, trade?.closeTime]);

  // Load screenshots when chart tab is opened
  const loadScreenshots = useCallback(async () => {
    if (!trade?.id || !user) return;
    
    setLoadingScreenshots(true);
    try {
      const response = await brain.list_trade_screenshots({ tradeId: trade.id });
      if (response.ok) {
        const data = await response.json();
        setScreenshots(data.screenshots || []);
      }
    } catch (error) {
      console.error('Error loading screenshots:', error);
      toast.error('Failed to load screenshots');
    } finally {
      setLoadingScreenshots(false);
    }
  }, [trade?.id, user]);

  // Handle notes editing
  const handleEditNotes = useCallback(() => {
    setEditedNotes(trade?.notes || '');
    setIsEditingNotes(true);
  }, [trade?.notes]);

  // Notes editing handlers
  const handleSaveNotes = useCallback(async () => {
    if (!trade?.id || !user) return;
    
    setIsSavingNotes(true);
    try {
      const response = await brain.edit_trade({
        trade_id: trade.id,
        field_updates: { notes: editedNotes },
        reason: "Updated trade notes via trade details modal",
        user_notes: "Notes updated by user"
      });
      
      if (response.ok) {
        toast.success('Notes saved successfully');
        setIsEditingNotes(false);
        onUpdate?.();
      } else {
        toast.error('Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  }, [trade?.id, user, editedNotes, onUpdate]);

  const handleCancelNotes = useCallback(() => {
    setEditedNotes(trade?.notes || '');
    setIsEditingNotes(false);
  }, [trade?.notes]);

  const handleDeleteTrade = useCallback(() => {
    if (onDelete && trade) {
      onDelete(trade);
      onClose();
    }
  }, [onDelete, trade, onClose]);

  // Load screenshots when screenshots tab is accessed
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === 'screenshots' && screenshots.length === 0) {
      loadScreenshots();
    }
  }, [screenshots.length, loadScreenshots]);
  
  // Metadata editing handlers
  const handleEditMetadata = useCallback(() => {
    setMetadataForm({
      strategy: trade?.strategy || '',
      marketConditions: trade?.marketConditions || '',
      emotionsBefore: trade?.emotionsBefore || '',
      emotionsAfter: trade?.emotionsAfter || '',
      riskLevel: trade?.riskLevel || '',
      duration: trade?.duration || ''
    });
    setIsEditingMetadata(true);
  }, [trade]);
  
  const handleSaveMetadata = useCallback(async () => {
    if (!trade?.id || !user) return;
    
    setIsSavingMetadata(true);
    try {
      const response = await brain.edit_trade({
        trade_id: trade.id,
        field_updates: {
          strategy: metadataForm.strategy,
          marketCondition: metadataForm.marketCondition,
          emotionBefore: metadataForm.emotionBefore,
          emotionAfter: metadataForm.emotionAfter,
          riskLevel: metadataForm.riskLevel,
          duration: metadataForm.duration
        },
        reason: "Updated trade metadata via trade details modal",
        user_notes: "Metadata updated by user"
      });
      
      if (response.ok) {
        toast.success('Metadata saved successfully');
        setIsEditingMetadata(false);
        onUpdate?.();
      } else {
        toast.error('Failed to save metadata');
      }
    } catch (error) {
      console.error('Error saving metadata:', error);
      toast.error('Failed to save metadata');
    } finally {
      setIsSavingMetadata(false);
    }
  }, [trade?.id, user, metadataForm, onUpdate]);
  
  const handleCancelMetadata = useCallback(() => {
    setIsEditingMetadata(false);
    setMetadataForm({
      strategy: '',
      marketConditions: '',
      emotionsBefore: '',
      emotionsAfter: '',
      riskLevel: '',
      duration: ''
    });
  }, []);

  // Early return after all hooks
  if (!trade) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-gray-900 border-gray-800">
        <DialogHeader className="pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                isProfit ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {isProfit ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {trade.symbol}
                </DialogTitle>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                    {trade.type?.toUpperCase() || 'N/A'}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {trade.lots || trade.quantity || 0} lots
                  </span>
                  <span className="text-sm text-gray-400">
                    {tradeDuration}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  isProfit ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${netPnl.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">
                  Net P&L
                </div>
              </div>
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteTrade}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="metadata" className="data-[state=active]:bg-purple-600">
                <Clock className="w-4 h-4 mr-2" />
                Metadata
              </TabsTrigger>
              <TabsTrigger value="tags" className="data-[state=active]:bg-amber-600">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-green-600">
                <Edit3 className="w-4 h-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="screenshots" className="data-[state=active]:bg-cyan-600">
                <Camera className="w-4 h-4 mr-2" />
                Screenshots
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="overview" className="h-full mt-0">
                <div className="space-y-6 h-full">
                  {/* Trade Information & Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trade Details */}
                    <div className={getCardClasses('default')}>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          Trade Details
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Entry Price</div>
                              <div className="text-lg font-mono text-white">
                                ${trade.entryPrice?.toFixed(5) || trade.openPrice?.toFixed(5) || 'N/A'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Exit Price</div>
                              <div className="text-lg font-mono text-white">
                                ${trade.exitPrice?.toFixed(5) || trade.closePrice?.toFixed(5) || 'N/A'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Volume</div>
                              <div className="text-lg font-mono text-white">
                                {trade.lots || trade.quantity || 0} lots
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Duration</div>
                              <div className="text-lg font-mono text-white">
                                {tradeDuration}
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-700 pt-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Gross P&L</div>
                                <div className={`text-xl font-bold ${
                                  (trade.pnl || 0) > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  ${(trade.pnl || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Commission</div>
                                <div className="text-xl font-bold text-red-400">
                                  ${(trade.commission || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Net P&L</div>
                                <div className={`text-xl font-bold ${
                                  netPnl > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  ${netPnl.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Notes & Tags */}
                    <div className={getCardClasses('default')}>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          Quick Notes
                        </h3>
                        
                        {/* Tags Section */}
                        <div className="mb-4">
                          <div className="text-sm text-gray-400 mb-2">Tags</div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(trade.tags || []).slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-900/30 text-blue-300">
                                {tag}
                              </Badge>
                            ))}
                            {(trade.tags || []).length > 3 && (
                              <Badge variant="outline" className="text-gray-400">
                                +{(trade.tags || []).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3">
                          {isEditingNotes ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editedNotes}
                                onChange={(e) => setEditedNotes(e.target.value)}
                                placeholder="Add your trade notes and analysis..."
                                className="min-h-[120px] bg-gray-800/50 border-gray-700 text-white resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveNotes}
                                  disabled={isSavingNotes}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isSavingNotes ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelNotes}
                                  disabled={isSavingNotes}
                                  className="border-gray-600"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="min-h-[120px] p-3 bg-gray-800/30 rounded-lg border border-gray-600/50">
                                {trade.notes ? (
                                  <div className="text-gray-300 whitespace-pre-wrap">{trade.notes}</div>
                                ) : (
                                  <div className="text-gray-500 italic">Click to add notes...</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={handleEditNotes}
                                variant="outline"
                                className="w-full border-gray-600 hover:bg-gray-800"
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                {trade.notes ? 'Edit Notes' : 'Add Notes'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="mt-0">
                <Card className={getCardClasses('default', 'lg')}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-400" />
                      Trade Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingMetadata ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Strategy</label>
                            <Input
                              value={metadataForm.strategy}
                              onChange={(e) => setMetadataForm({...metadataForm, strategy: e.target.value})}
                              placeholder="Enter trading strategy..."
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Market Conditions</label>
                            <Input
                              value={metadataForm.marketConditions}
                              onChange={(e) => setMetadataForm({...metadataForm, marketConditions: e.target.value})}
                              placeholder="Market conditions during trade..."
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Emotions Before</label>
                            <Input
                              value={metadataForm.emotionsBefore}
                              onChange={(e) => setMetadataForm({...metadataForm, emotionsBefore: e.target.value})}
                              placeholder="How did you feel before the trade?"
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Emotions After</label>
                            <Input
                              value={metadataForm.emotionsAfter}
                              onChange={(e) => setMetadataForm({...metadataForm, emotionsAfter: e.target.value})}
                              placeholder="How did you feel after the trade?"
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Risk Level</label>
                            <Select
                              value={metadataForm.riskLevel}
                              onValueChange={(value) => setMetadataForm({...metadataForm, riskLevel: value})}
                            >
                              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                <SelectValue placeholder="Select risk level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low Risk</SelectItem>
                                <SelectItem value="Medium">Medium Risk</SelectItem>
                                <SelectItem value="High">High Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Duration</label>
                            <Input
                              value={metadataForm.duration}
                              onChange={(e) => setMetadataForm({...metadataForm, duration: e.target.value})}
                              placeholder="Trade duration or timeframe"
                              className="bg-gray-800/50 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveMetadata}
                            disabled={isSavingMetadata}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {isSavingMetadata ? 'Saving...' : 'Save Metadata'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelMetadata}
                            disabled={isSavingMetadata}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Strategy</label>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50 text-gray-300">
                              {trade?.strategy || 'Not specified'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Market Conditions</label>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50 text-gray-300">
                              {trade?.marketConditions || 'Not specified'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Emotions Before</label>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50 text-gray-300">
                              {trade?.emotionsBefore || 'Not specified'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Emotions After</label>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50 text-gray-300">
                              {trade?.emotionsAfter || 'Not specified'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Risk Level</label>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50 text-gray-300">
                              {trade?.riskLevel || 'Not specified'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Duration</label>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50 text-gray-300">
                              {trade?.duration || tradeDuration}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleEditMetadata}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Metadata
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tags" className="mt-0">
                <Card className={getCardClasses('default', 'lg')}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-amber-400" />
                      Trade Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TagManager trade={trade} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <Card className={getCardClasses('default', 'lg')}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-green-400" />
                      Analysis & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingNotes ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          placeholder="Add your trade analysis and notes..."
                          className="min-h-[200px] bg-gray-800/50 border-gray-700 text-white"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isSavingNotes ? 'Saving...' : 'Save Notes'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelNotes}
                            disabled={isSavingNotes}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {trade.notes ? (
                          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 min-h-[200px] whitespace-pre-wrap">
                            {trade.notes}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/50 min-h-[200px] flex items-center justify-center text-gray-500">
                            No notes added yet
                          </div>
                        )}
                        <Button
                          onClick={handleEditNotes}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          {trade.notes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="screenshots" className="mt-0">
                <Card className={getCardClasses('default', 'lg')}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" />
                      Chart Screenshots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingScreenshots ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-3 text-cyan-400">Loading screenshots...</span>
                      </div>
                    ) : screenshots.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {screenshots.map((screenshot) => (
                          <div key={screenshot.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <img
                              src={screenshot.url}
                              alt={screenshot.filename}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                            <div className="text-sm text-gray-400">{screenshot.filename}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(screenshot.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Camera className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-400">No screenshots available for this trade</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

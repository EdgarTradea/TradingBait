


import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import brain from "utils/brain";
import { toast } from "sonner";

interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  pnl: number;
  commission?: number;
  swap?: number;
  tradeType?: string;
  accountId?: string;
}

interface Props {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdated: () => void;
}

interface EditForm {
  symbol: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  commission: number;
  swap: number;
  reason: string;
  notes: string;
  brokerTimezone: SupportedTimezone;
}

export function TradeEditor({ trade, isOpen, onClose, onTradeUpdated }: Props) {
  const [formData, setFormData] = useState<EditForm>({
    symbol: trade.symbol,
    quantity: trade.quantity,
    openPrice: trade.openPrice,
    closePrice: trade.closePrice,
    openTime: trade.openTime,
    closeTime: trade.closeTime,
    commission: trade.commission || 0,
    swap: trade.swap || 0,
    reason: '',
    notes: '',
    brokerTimezone: 'UTC'
  });
  
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when trade changes
  useEffect(() => {
    setFormData({
      symbol: trade.symbol,
      quantity: trade.quantity,
      openPrice: trade.openPrice,
      closePrice: trade.closePrice,
      openTime: trade.openTime,
      closeTime: trade.closeTime,
      commission: trade.commission || 0,
      swap: trade.swap || 0,
      reason: '',
      notes: '',
      brokerTimezone: 'UTC'
    });
    setHasChanges(false);
  }, [trade]);

  // Check for changes
  useEffect(() => {
    const changed = (
      formData.symbol !== trade.symbol ||
      formData.quantity !== trade.quantity ||
      formData.openPrice !== trade.openPrice ||
      formData.closePrice !== trade.closePrice ||
      formData.openTime !== trade.openTime ||
      formData.closeTime !== trade.closeTime ||
      formData.commission !== (trade.commission || 0) ||
      formData.swap !== (trade.swap || 0)
    );
    setHasChanges(changed);
  }, [formData, trade]);

  const validateForm = (): boolean => {
    const newWarnings: string[] = [];
    
    if (!formData.symbol.trim()) newWarnings.push('Symbol is required');
    if (formData.quantity <= 0) newWarnings.push('Quantity must be positive');
    if (formData.openPrice <= 0) newWarnings.push('Open price must be positive');
    if (formData.closePrice <= 0) newWarnings.push('Close price must be positive');
    if (!formData.openTime) newWarnings.push('Open time is required');
    if (!formData.closeTime) newWarnings.push('Close time is required');
    if (!formData.reason.trim() && hasChanges) newWarnings.push('Reason for changes is required');
    
    if (formData.openTime && formData.closeTime) {
      if (new Date(formData.closeTime) <= new Date(formData.openTime)) {
        newWarnings.push('Close time must be after open time');
      }
    }
    
    // Price change warnings
    const priceChange = Math.abs(formData.openPrice - trade.openPrice) / trade.openPrice;
    if (priceChange > 0.1) {
      newWarnings.push('Large price change detected (>10%)');
    }
    
    const qtyChange = Math.abs(formData.quantity - trade.quantity) / trade.quantity;
    if (qtyChange > 0.5) {
      newWarnings.push('Large quantity change detected (>50%)');
    }
    
    setWarnings(newWarnings);
    return newWarnings.length === 0 || newWarnings.every(w => w.includes('Large'));
  };

  const calculateNewPnL = () => {
    const { quantity, openPrice, closePrice, commission, swap } = formData;
    const tradeType = trade.tradeType || 'buy';
    
    let grossPnL = 0;
    if (tradeType.toLowerCase() === 'buy') {
      grossPnL = (closePrice - openPrice) * quantity;
    } else {
      grossPnL = (openPrice - closePrice) * quantity;
    }
    
    return grossPnL - commission - swap;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    
    setLoading(true);
    try {
      // Build field updates object
      const fieldUpdates: Record<string, any> = {};
      
      if (formData.symbol !== trade.symbol) fieldUpdates.symbol = formData.symbol;
      if (formData.quantity !== trade.quantity) fieldUpdates.quantity = formData.quantity;
      if (formData.openPrice !== trade.openPrice) fieldUpdates.openPrice = formData.openPrice;
      if (formData.closePrice !== trade.closePrice) fieldUpdates.closePrice = formData.closePrice;
      if (formData.openTime !== trade.openTime) fieldUpdates.openTime = formData.openTime;
      if (formData.closeTime !== trade.closeTime) fieldUpdates.closeTime = formData.closeTime;
      if (formData.commission !== (trade.commission || 0)) fieldUpdates.commission = formData.commission;
      if (formData.swap !== (trade.swap || 0)) fieldUpdates.swap = formData.swap;
      
      const response = await brain.edit_trade({
        trade_id: trade.id,
        field_updates: fieldUpdates,
        reason: formData.reason,
        user_notes: formData.notes
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Trade updated successfully! New P&L: $${result.recalculated_metrics?.recalculated_pnl || 'calculated'}`);
        onTradeUpdated();
        onClose();
      } else {
        throw new Error('Failed to update trade');
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      toast.error('Failed to update trade');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setWarnings([]); // Clear warnings when user starts typing
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    // Convert to local datetime-local format
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Trade: {trade.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Trade Info */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Current Trade</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">P&L:</span>
                <span className={`ml-2 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${trade.pnl.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Qty:</span>
                <span className="ml-2 text-white">{trade.quantity}</span>
              </div>
              <div>
                <span className="text-gray-400">Entry:</span>
                <span className="ml-2 text-white">{trade.openPrice}</span>
              </div>
              <div>
                <span className="text-gray-400">Exit:</span>
                <span className="ml-2 text-white">{trade.closePrice}</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-400">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="edit" className="data-[state=active]:bg-gray-700 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Edit Trade
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Symbol */}
                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-gray-300">Symbol</Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-gray-300">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity || ''}
                      onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Open Price */}
                  <div className="space-y-2">
                    <Label htmlFor="openPrice" className="text-gray-300">Open Price</Label>
                    <Input
                      id="openPrice"
                      type="number"
                      step="0.00001"
                      value={formData.openPrice || ''}
                      onChange={(e) => handleInputChange('openPrice', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Close Price */}
                  <div className="space-y-2">
                    <Label htmlFor="closePrice" className="text-gray-300">Close Price</Label>
                    <Input
                      id="closePrice"
                      type="number"
                      step="0.00001"
                      value={formData.closePrice || ''}
                      onChange={(e) => handleInputChange('closePrice', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Open Time */}
                  <div className="space-y-2">
                    <Label htmlFor="openTime" className="text-gray-300">Open Time</Label>
                    <Input
                      id="openTime"
                      type="datetime-local"
                      value={formatDateTime(formData.openTime)}
                      onChange={(e) => handleInputChange('openTime', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Close Time */}
                  <div className="space-y-2">
                    <Label htmlFor="closeTime" className="text-gray-300">Close Time</Label>
                    <Input
                      id="closeTime"
                      type="datetime-local"
                      value={formatDateTime(formData.closeTime)}
                      onChange={(e) => handleInputChange('closeTime', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Commission */}
                  <div className="space-y-2">
                    <Label htmlFor="commission" className="text-gray-300">Commission</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      value={formData.commission || ''}
                      onChange={(e) => handleInputChange('commission', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Swap */}
                  <div className="space-y-2">
                    <Label htmlFor="swap" className="text-gray-300">Swap</Label>
                    <Input
                      id="swap"
                      type="number"
                      step="0.01"
                      value={formData.swap || ''}
                      onChange={(e) => handleInputChange('swap', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {/* Broker Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="brokerTimezone" className="text-gray-300">Broker Timezone</Label>
                    <Select
                      value={formData.brokerTimezone}
                      onValueChange={(value) => handleInputChange('brokerTimezone', value as SupportedTimezone)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 text-white border-gray-800">
                        <SelectItem value="UTC">UTC (Universal Coordinated Time)</SelectItem>
                        <SelectItem value="America/New_York">EST/EDT (New York)</SelectItem>
                        <SelectItem value="America/Chicago">CST/CDT (Chicago)</SelectItem>
                        <SelectItem value="America/Los_Angeles">PST/PDT (Los Angeles)</SelectItem>
                        <SelectItem value="Europe/London">GMT/BST (London)</SelectItem>
                        <SelectItem value="Europe/Frankfurt">CET/CEST (Frankfurt)</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                        <SelectItem value="Asia/Singapore">SGT (Singapore)</SelectItem>
                        <SelectItem value="Australia/Sydney">AEST/AEDT (Sydney)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400">Timezone used for trade times - affects chart marker positioning</p>
                  </div>
                </div>

                {/* Reason (required if changes) */}
                {hasChanges && (
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-gray-300">Reason for Changes *</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="e.g., Correcting broker data error"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Optional additional details..."
                    className="bg-gray-800 border-gray-600 text-white"
                    rows={3}
                  />
                </div>

                {/* P&L Preview */}
                {hasChanges && (
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-300">Original P&L:</span>
                        <span className={`ml-2 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${trade.pnl.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300">New P&L:</span>
                        <span className={`ml-2 font-semibold ${calculateNewPnL() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${calculateNewPnL().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !hasChanges} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

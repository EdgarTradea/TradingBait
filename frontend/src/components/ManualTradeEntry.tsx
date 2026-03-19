


import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays, Clock, DollarSign, TrendingUp } from "lucide-react";
import brain from "utils/brain";
import { toast } from "sonner";

interface Props {
  evaluations: any[];
  isOpen?: boolean;
  onClose?: () => void;
  onTradeAdded: () => void;
}

interface TradeForm {
  symbol: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  tradeType: 'buy' | 'sell';
  commission: number;
  swap: number;
  accountId: string;
  comment: string;
}

export function ManualTradeEntry({ evaluations, isOpen, onClose, onTradeAdded }: Props) {
  const [formData, setFormData] = useState<TradeForm>({
    symbol: '',
    quantity: 0,
    openPrice: 0,
    closePrice: 0,
    openTime: '',
    closeTime: '',
    tradeType: 'buy',
    commission: 0,
    swap: 0,
    accountId: '',
    comment: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.symbol.trim()) newErrors.push('Symbol is required');
    if (formData.quantity <= 0) newErrors.push('Quantity must be positive');
    if (formData.openPrice <= 0) newErrors.push('Open price must be positive');
    if (formData.closePrice <= 0) newErrors.push('Close price must be positive');
    if (!formData.openTime) newErrors.push('Open time is required');
    if (!formData.closeTime) newErrors.push('Close time is required');
    if (!formData.accountId) newErrors.push('Account is required');
    
    if (formData.openTime && formData.closeTime) {
      if (new Date(formData.closeTime) <= new Date(formData.openTime)) {
        newErrors.push('Close time must be after open time');
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculatePnL = () => {
    const { quantity, openPrice, closePrice, tradeType, commission, swap } = formData;
    
    let grossPnL = 0;
    if (tradeType === 'buy') {
      grossPnL = (closePrice - openPrice) * quantity;
    } else {
      grossPnL = (openPrice - closePrice) * quantity;
    }
    
    return grossPnL - commission - swap;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await brain.add_manual_trade({
        symbol: formData.symbol.toUpperCase(),
        quantity: formData.quantity,
        open_price: formData.openPrice,
        close_price: formData.closePrice,
        open_time: formData.openTime,
        close_time: formData.closeTime,
        trade_type: formData.tradeType,
        commission: formData.commission,
        swap: formData.swap,
        account_id: formData.accountId,
        comment: formData.comment
      });
      
      if (response.ok) {
        // Use response.data instead of response.json() to avoid ReadableStream lock
        const result = response.data;
        toast.success(`Trade added successfully! P&L: $${result.calculated_pnl}`);
        onTradeAdded();
        if (onClose) onClose();
        
        // Reset form
        setFormData({
          symbol: '',
          quantity: 0,
          openPrice: 0,
          closePrice: 0,
          openTime: '',
          closeTime: '',
          tradeType: 'buy',
          commission: 0,
          swap: 0,
          accountId: '',
          comment: ''
        });
      } else {
        // Use response.error instead of trying to read the response again
        const errorMessage = response.error?.detail || 'Failed to add trade';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding trade:', error);
      // Handle network errors or other exceptions
      toast.error('Failed to add trade - please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TradeForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]); // Clear errors when user starts typing
  };

  // Format datetime for input
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const content = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Add Manual Trade</h2>
        <p className="text-gray-400">Enter trade details manually</p>
      </div>

      {errors.length > 0 && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-red-400">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Symbol */}
          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-gray-300">Symbol</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value)}
              placeholder="e.g., EURUSD"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account" className="text-gray-300">Account</Label>
            <Select value={formData.accountId} onValueChange={(value) => handleInputChange('accountId', value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {evaluations.map((evaluation) => (
                  <SelectItem key={evaluation.id} value={evaluation.id}>
                    {evaluation.firm} - {evaluation.accountId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trade Type */}
          <div className="space-y-2">
            <Label htmlFor="tradeType" className="text-gray-300">Trade Type</Label>
            <Select value={formData.tradeType} onValueChange={(value) => handleInputChange('tradeType', value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
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
              placeholder="Trade size"
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
              placeholder="Entry price"
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
              placeholder="Exit price"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Open Time */}
          <div className="space-y-2">
            <Label htmlFor="openTime" className="text-gray-300">Open Time</Label>
            <Input
              id="openTime"
              type="datetime-local"
              value={formData.openTime}
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
              value={formData.closeTime}
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
              placeholder="0.00"
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
              placeholder="0.00"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* P&L Preview */}
        {formData.quantity > 0 && formData.openPrice > 0 && formData.closePrice > 0 && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Calculated P&L:</span>
              <span className={`font-semibold ${calculatePnL() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${calculatePnL().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Adding Trade...' : 'Add Trade'}
          </Button>
        </div>
      </form>
    </div>
  );

  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Manual Trade Entry</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}

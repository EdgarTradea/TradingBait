import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Target, Shield, Calendar, DollarSign } from 'lucide-react';
import { 
  PropFirm, 
  ChallengeConfig, 
  DEFAULT_PROP_FIRMS, 
  createChallengeConfig 
} from 'utils/challengeTypes';
import { cn } from 'utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateChallenge: (challenge: ChallengeConfig) => void;
  userId: string;
}

interface CustomRules {
  profitTarget: number;
  dailyLossLimit: number;
  totalLossLimit: number;
  minTradingDays: number;
  phases: 1 | 2;
  weekendHolding: boolean;
  newsTrading: boolean;
}

const ACCOUNT_SIZES = [
  10000, 25000, 50000, 100000, 200000, 300000, 400000, 500000
];

export const ChallengeConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreateChallenge,
  userId
}) => {
  console.log('ChallengeConfigModal rendered with isOpen:', isOpen);
  
  const [selectedFirm, setSelectedFirm] = useState<PropFirm | null>(null);
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [customRules, setCustomRules] = useState<CustomRules>({
    profitTarget: 10,
    dailyLossLimit: 5,
    totalLossLimit: 10,
    minTradingDays: 4,
    phases: 2,
    weekendHolding: true,
    newsTrading: true
  });
  const [isCustomFirm, setIsCustomFirm] = useState(false);
  const [customFirmName, setCustomFirmName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleFirmSelect = (firmId: string) => {
    const firm = DEFAULT_PROP_FIRMS.find(f => f.id === firmId);
    if (firm) {
      setSelectedFirm(firm);
      setIsCustomFirm(firmId === 'custom');
      
      // Update custom rules with firm defaults
      setCustomRules({
        profitTarget: firm.rules.profitTarget,
        dailyLossLimit: firm.rules.dailyLossLimit,
        totalLossLimit: firm.rules.totalLossLimit,
        minTradingDays: firm.rules.minTradingDays,
        phases: firm.rules.phases,
        weekendHolding: firm.rules.weekendHolding,
        newsTrading: firm.rules.newsTrading
      });
    }
  };

  const handleCreateChallenge = async () => {
    console.log('Modal handleCreateChallenge called');
    if (!selectedFirm) {
      console.log('No firm selected, returning');
      return;
    }
    
    console.log('Creating challenge with firm:', selectedFirm.name);
    setIsCreating(true);
    try {
      let firmToUse = selectedFirm;
      
      if (isCustomFirm && customFirmName) {
        firmToUse = {
          ...selectedFirm,
          name: customFirmName,
          rules: {
            ...selectedFirm.rules,
            profitTarget: customRules.profitTarget,
            dailyLossLimit: customRules.dailyLossLimit,
            totalLossLimit: customRules.totalLossLimit,
            minTradingDays: customRules.minTradingDays,
            phases: customRules.phases,
            weekendHolding: customRules.weekendHolding,
            newsTrading: customRules.newsTrading
          }
        };
      }
      
      const challenge = createChallengeConfig(
        userId,
        firmToUse,
        accountSize,
        isCustomFirm ? customRules : undefined
      );
      
      onCreateChallenge(challenge);
      onClose();
      
      // Reset form
      setSelectedFirm(null);
      setIsCustomFirm(false);
      setCustomFirmName('');
      setAccountSize(100000);
    } catch (error) {
      console.error('Failed to create challenge:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const calculateTargets = () => {
    if (!selectedFirm) return null;
    
    const rules = isCustomFirm ? customRules : selectedFirm.rules;
    const profitTarget = accountSize * (rules.profitTarget / 100);
    const maxLoss = accountSize * (rules.totalLossLimit / 100);
    const dailyLoss = accountSize * (rules.dailyLossLimit / 100);
    
    return { profitTarget, maxLoss, dailyLoss };
  };

  const targets = calculateTargets();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create New Challenge
          </DialogTitle>
          <DialogDescription>
            Configure your prop firm challenge parameters and start tracking your funding journey.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Prop Firm Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Prop Firm</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_PROP_FIRMS.map((firm) => (
                <Card 
                  key={firm.id}
                  className={cn(
                    "cursor-pointer transition-all border-2 bg-gray-900/50",
                    selectedFirm?.id === firm.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                  onClick={() => handleFirmSelect(firm.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {firm.name}
                      {selectedFirm?.id === firm.id && (
                        <Badge className="bg-blue-500 text-white">Selected</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {firm.rules.phases}-Phase • {firm.rules.profitTarget}% Target
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Daily Loss: {firm.rules.dailyLossLimit}%</div>
                      <div>Max Loss: {firm.rules.totalLossLimit}%</div>
                      <div>Min Days: {firm.rules.minTradingDays}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Firm Name */}
          {isCustomFirm && (
            <div className="space-y-2">
              <Label htmlFor="firmName">Custom Firm Name</Label>
              <Input
                id="firmName"
                value={customFirmName}
                onChange={(e) => setCustomFirmName(e.target.value)}
                placeholder="Enter your prop firm name"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          )}

          {/* Account Size */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Account Size</Label>
            <Select value={accountSize.toString()} onValueChange={(value) => setAccountSize(Number(value))}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    ${size.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Rules for Custom Firm */}
          {isCustomFirm && selectedFirm && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Custom Rules</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profitTarget">Profit Target (%)</Label>
                  <Input
                    id="profitTarget"
                    type="number"
                    value={customRules.profitTarget}
                    onChange={(e) => setCustomRules({...customRules, profitTarget: Number(e.target.value)})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyLoss">Daily Loss Limit (%)</Label>
                  <Input
                    id="dailyLoss"
                    type="number"
                    value={customRules.dailyLossLimit}
                    onChange={(e) => setCustomRules({...customRules, dailyLossLimit: Number(e.target.value)})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalLoss">Total Loss Limit (%)</Label>
                  <Input
                    id="totalLoss"
                    type="number"
                    value={customRules.totalLossLimit}
                    onChange={(e) => setCustomRules({...customRules, totalLossLimit: Number(e.target.value)})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minDays">Minimum Trading Days</Label>
                  <Input
                    id="minDays"
                    type="number"
                    value={customRules.minTradingDays}
                    onChange={(e) => setCustomRules({...customRules, minTradingDays: Number(e.target.value)})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Challenge Type</Label>
                <Select 
                  value={customRules.phases.toString()} 
                  onValueChange={(value) => setCustomRules({...customRules, phases: Number(value) as 1 | 2})}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1-Phase Challenge</SelectItem>
                    <SelectItem value="2">2-Phase Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekendHolding"
                    checked={customRules.weekendHolding}
                    onCheckedChange={(checked) => setCustomRules({...customRules, weekendHolding: checked as boolean})}
                  />
                  <Label htmlFor="weekendHolding" className="text-sm">Weekend Holding Allowed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsTrading"
                    checked={customRules.newsTrading}
                    onCheckedChange={(checked) => setCustomRules({...customRules, newsTrading: checked as boolean})}
                  />
                  <Label htmlFor="newsTrading" className="text-sm">News Trading Allowed</Label>
                </div>
              </div>
            </div>
          )}

          {/* Challenge Summary */}
          {selectedFirm && targets && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Challenge Summary
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">Profit Target</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${targets.profitTarget.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(isCustomFirm ? customRules : selectedFirm.rules).profitTarget}% of account
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-medium">Max Loss</span>
                      </div>
                      <div className="text-2xl font-bold text-red-400">
                        ${targets.maxLoss.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(isCustomFirm ? customRules : selectedFirm.rules).totalLossLimit}% limit
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium">Daily Limit</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        ${targets.dailyLoss.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(isCustomFirm ? customRules : selectedFirm.rules).dailyLossLimit}% daily
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-400 mb-1">Important Notes:</p>
                    <ul className="text-yellow-300 space-y-1 text-xs">
                      <li>• Challenge will start tracking from your next trade</li>
                      <li>• All existing trades will be excluded from challenge calculations</li>
                      <li>• You can pause or modify the challenge settings anytime</li>
                      <li>• Progress updates in real-time based on your trading activity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateChallenge} 
            disabled={!selectedFirm || (isCustomFirm && !customFirmName) || isCreating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isCreating ? 'Creating...' : 'Create Challenge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

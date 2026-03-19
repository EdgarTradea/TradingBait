import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  History,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserGuardContext } from 'app';
import { useStore } from "utils/store";
import { calculateCurrentBalance } from "utils/calculations";
import { useBasicTradingStats } from "utils/tradingHooks";
import brain from "utils/brain";
import { Evaluation } from "utils/types";

interface WithdrawalRequest {
  evaluationId: string;
  amount: number;
  reason?: string;
  description?: string;
}

interface RefundRequest {
  evaluationId: string;
  amount: number;
  reason: string;
  description?: string;
}

interface Transaction {
  id: string;
  evaluationId: string;
  type: string;
  amount: number;
  reason?: string;
  description?: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  userId: string;
  accountId: string;
  evaluationType: string;
  firmName: string;
}

interface Props {
  evaluations: Evaluation[];
  onTransactionComplete?: () => void;
}

export const WithdrawalsRefunds: React.FC<Props> = ({ 
  evaluations, 
  onTransactionComplete 
}) => {
  const { user } = useUserGuardContext();
  const { trades } = useStore(); // Add trades from store
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
    type: 'withdrawal' | 'refund' | null;
  }>({ isOpen: false, transaction: null, type: null });
  
  // Withdrawal form state
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalRequest>({    
    evaluationId: '',
    amount: 0,
    reason: '',
    description: ''
  });
  
  // Add date state for withdrawal
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Refund form state
  const [refundForm, setRefundForm] = useState<RefundRequest>({
    evaluationId: '',
    amount: 0,
    reason: 'Evaluation passed',
    description: ''
  });
  
  // Add date state for refund
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split('T')[0]);

  // Pre-calculate balances for all evaluations to avoid conditional hook usage
  const evaluationBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    evaluations.forEach(evaluation => {
      const accountTrades = trades.filter(trade => {
        // Method 1: Check direct evaluationId field (for manual trades)
        if (trade.evaluationId === evaluation.id) {
          return true;
        }
        
        // Method 2: Check accountId field (for imported trades)
        if (trade.accountId === evaluation.accountId) {
          return true;
        }
        
        return false;
      });
      
      // Calculate total P&L manually without using hooks
      const totalPnl = accountTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
      balances[evaluation.id] = calculateCurrentBalance(evaluation, totalPnl);
    });
    return balances;
  }, [evaluations, trades]);

  // Helper function to get current balance for an evaluation
  const getCurrentBalance = (evaluation: Evaluation): number => {
    return evaluationBalances[evaluation.id] || 0;
  };

  // Get funded evaluations for withdrawals
  const fundedEvaluations = evaluations.filter(
    (evaluation) =>
      evaluation.accountType === 'funded' || 
    (evaluation.status === 'passed' && evaluation.accountType !== 'evaluation')
  );

  // Get evaluation evaluations for refunds
  const evaluationAccounts = evaluations.filter(
    (evaluation) => evaluation.accountType === 'evaluation'
  );

  const loadTransactionHistory = async () => {
    try {
      setIsLoading(true);
      const response = await brain.get_transaction_history();
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalForm.evaluationId || withdrawalForm.amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await brain.create_withdrawal({
        evaluationId: withdrawalForm.evaluationId,
        amount: withdrawalForm.amount,
        reason: withdrawalForm.reason,
        description: withdrawalForm.description,
        date: withdrawalDate
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Withdrawal of $${withdrawalForm.amount.toLocaleString()} recorded successfully`);
        setShowWithdrawalDialog(false);
        setWithdrawalForm({
          evaluationId: '',
          amount: 0,
          reason: '',
          description: ''
        });
        setWithdrawalDate(new Date().toISOString().split('T')[0]);
        onTransactionComplete?.();
        loadTransactionHistory();
      } else {
        toast.error('Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      const errorMessage = error.detail || 'Failed to process withdrawal';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundForm.evaluationId || refundForm.amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await brain.create_refund({
        evaluationId: refundForm.evaluationId,
        amount: refundForm.amount,
        reason: refundForm.reason,
        description: refundForm.description,
        date: refundDate
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refund of $${refundForm.amount.toLocaleString()} recorded successfully`);
        setShowRefundDialog(false);
        setRefundForm({
          evaluationId: '',
          amount: 0,
          reason: 'Evaluation passed',
          description: ''
        });
        setRefundDate(new Date().toISOString().split('T')[0]);
        onTransactionComplete?.();
        loadTransactionHistory();
      } else {
        toast.error('Refund failed');
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      const errorMessage = error.detail || 'Failed to process refund';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to check if transaction can be deleted (within 48 hours)
  const canDeleteTransaction = (transaction: Transaction): boolean => {
    const requestedTime = new Date(transaction.requestedAt);
    const now = new Date();
    const timeDiff = now.getTime() - requestedTime.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff <= 48;
  };

  // Delete transaction handler
  const handleDeleteTransaction = async () => {
    if (!deleteConfirmation.transaction || !deleteConfirmation.type) return;
    
    try {
      setIsLoading(true);
      
      let response;
      if (deleteConfirmation.type === 'withdrawal') {
        response = await brain.delete_withdrawal({ 
          transactionId: deleteConfirmation.transaction.id 
        });
      } else {
        response = await brain.delete_refund({ 
          transactionId: deleteConfirmation.transaction.id 
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        
        // Optimistically update the transactions list
        setTransactions(prev => 
          prev.filter(t => t.id !== deleteConfirmation.transaction?.id)
        );
        
        // Refresh data
        loadTransactionHistory();
        onTransactionComplete?.();
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      let errorMessage = 'Failed to delete transaction';
      
      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setDeleteConfirmation({ isOpen: false, transaction: null, type: null });
    }
  };

  // Open delete confirmation dialog
  const openDeleteConfirmation = (transaction: Transaction) => {
    const type = transaction.type === 'withdrawal' ? 'withdrawal' : 'refund';
    setDeleteConfirmation({
      isOpen: true,
      transaction,
      type
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'requested':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Withdrawals Card */}
        <Card className="bg-gray-900/50 border-gray-700 glassmorphic-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <ArrowDownLeft className="h-5 w-5 text-red-400" />
              Record Withdrawal
            </CardTitle>
            <p className="text-sm text-gray-400">
              Track withdrawals you've made from your funded trading accounts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {fundedEvaluations.length > 0 ? (
              <>
                <div className="text-sm text-gray-300">
                  Available funded accounts: {fundedEvaluations.length}
                </div>
                <Button 
                  onClick={() => setShowWithdrawalDialog(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Record New Withdrawal
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <ArrowDownLeft className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No funded accounts available
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Create a funded account to track withdrawals
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refunds Card */}
        <Card className="bg-gray-900/50 border-gray-700 glassmorphic-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <ArrowUpRight className="h-5 w-5 text-green-400" />
              Record Refund
            </CardTitle>
            <p className="text-sm text-gray-400">
              Track refunds you've received from prop firms (challenge fees, etc.)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluationAccounts.length > 0 ? (
              <>
                <div className="text-sm text-gray-300">
                  Available evaluations: {evaluationAccounts.length}
                </div>
                <Button 
                  onClick={() => setShowRefundDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Record New Refund
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <ArrowUpRight className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No evaluations available
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Create an evaluation to track refunds
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <p className="font-medium capitalize text-white">
                        {transaction.type} - {transaction.firmName}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(transaction.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-white">
                      ${transaction.amount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(transaction.status)}
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {transaction.status}
                      </Badge>
                    </div>
                    {/* Delete button - only show for recent transactions */}
                    {(transaction.type === 'withdrawal' || transaction.type === 'refund') && 
                     canDeleteTransaction(transaction) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteConfirmation(transaction)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Withdrawal</DialogTitle>
            <DialogDescription>
              Record a withdrawal you've made from your funded trading account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawal-evaluation">Funded Account</Label>
              <Select 
                value={withdrawalForm.evaluationId} 
                onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, evaluationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funded account" />
                </SelectTrigger>
                <SelectContent>
                  {fundedEvaluations.map((evaluation) => (
                    <SelectItem key={evaluation.id} value={evaluation.id}>
                      {evaluation.firm} - {evaluation.accountId} (${getCurrentBalance(evaluation).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="withdrawal-amount">Amount ($)</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                value={withdrawalForm.amount || ''}
                onChange={(e) => setWithdrawalForm(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Enter withdrawal amount"
              />
            </div>
            
            <div>
              <Label htmlFor="withdrawal-date">Date</Label>
              <Input
                id="withdrawal-date"
                type="date"
                value={withdrawalDate}
                onChange={(e) => setWithdrawalDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="withdrawal-reason">Reason (Optional)</Label>
              <Input
                id="withdrawal-reason"
                value={withdrawalForm.reason}
                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Profit withdrawal, Living expenses"
              />
            </div>
            
            <div>
              <Label htmlFor="withdrawal-description">Description (Optional)</Label>
              <Textarea
                id="withdrawal-description"
                value={withdrawalForm.description}
                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawalDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleWithdrawal}
              disabled={isLoading || !withdrawalForm.evaluationId || withdrawalForm.amount <= 0}
            >
              {isLoading ? 'Processing...' : `Withdraw $${withdrawalForm.amount.toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Refund</DialogTitle>
            <DialogDescription>
              Record a refund you've received from a prop firm (evaluation fees, etc.).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-evaluation">Evaluation</Label>
              <Select 
                value={refundForm.evaluationId} 
                onValueChange={(value) => setRefundForm(prev => ({ ...prev, evaluationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation" />
                </SelectTrigger>
                <SelectContent>
                  {evaluationAccounts.map((evaluation) => (
                    <SelectItem key={evaluation.id} value={evaluation.id}>
                      {evaluation.firm} - {evaluation.accountId} (Cost: ${evaluation.cost?.toLocaleString() || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="refund-amount">Refund Amount ($)</Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundForm.amount || ''}
                onChange={(e) => setRefundForm(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Enter refund amount"
              />
            </div>
            
            <div>
              <Label htmlFor="refund-date">Date</Label>
              <Input
                id="refund-date"
                type="date"
                value={refundDate}
                onChange={(e) => setRefundDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="refund-description">Description (Optional)</Label>
              <Textarea
                id="refund-description"
                value={refundForm.description}
                onChange={(e) => setRefundForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this refund..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRefundDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRefund}
              disabled={isLoading || !refundForm.evaluationId || refundForm.amount <= 0}
            >
              {isLoading ? 'Processing...' : `Record $${refundForm.amount.toLocaleString()} Refund`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showTransactionHistory} onOpenChange={setShowTransactionHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Complete audit trail of all withdrawals, refunds, and deposits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <h4 className="font-medium capitalize">
                            {transaction.type} - {transaction.firmName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Account: {transaction.accountId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-mono font-bold text-lg">
                            ${transaction.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 justify-end">
                            {getStatusIcon(transaction.status)}
                            <Badge variant="outline" className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                        {/* Delete button for transaction history */}
                        {(transaction.type === 'withdrawal' || transaction.type === 'refund') && 
                         canDeleteTransaction(transaction) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteConfirmation(transaction)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {transaction.reason && (
                      <p className="text-sm mt-2">
                        <strong>Reason:</strong> {transaction.reason}
                      </p>
                    )}
                    {transaction.description && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation({ isOpen: false, transaction: null, type: null });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirmation.type === 'withdrawal' ? 'Withdrawal' : 'Refund'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation.type === 'withdrawal' ? (
                <>
                  This will delete the withdrawal of <strong>${deleteConfirmation.transaction?.amount.toLocaleString()}</strong> and 
                  restore the amount back to your evaluation balance. This action cannot be undone.
                </>
              ) : (
                <>
                  This will delete the refund of <strong>${deleteConfirmation.transaction?.amount.toLocaleString()}</strong> and 
                  remove it from your transaction history. This action cannot be undone.
                </>
              )}
              {deleteConfirmation.transaction && (
                <div className="mt-2 text-sm">
                  <p><strong>Transaction:</strong> {deleteConfirmation.transaction.firmName}</p>
                  <p><strong>Date:</strong> {formatDate(deleteConfirmation.transaction.requestedAt)}</p>
                  {deleteConfirmation.transaction.reason && (
                    <p><strong>Reason:</strong> {deleteConfirmation.transaction.reason}</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransaction}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Deleting...' : `Delete ${deleteConfirmation.type === 'withdrawal' ? 'Withdrawal' : 'Refund'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

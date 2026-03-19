

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useStore } from "utils/store";
import { useBasicTradingStats } from "utils/tradingHooks";
import { calculateCurrentBalance } from "utils/calculations";
import { ManageBalanceModal } from "./ManageBalanceModal";
import { Evaluation } from "utils/types";

interface EvaluationCardProps {
  evaluation: Evaluation;
  onDelete: (evaluationId: string) => void;
  onTransaction: (
    accountId: string,
    amount: number,
    date: string,
    type: "deposit" | "withdrawal",
  ) => void;
  onRefresh?: () => void;
}

export function EvaluationCard({
  evaluation,
  onDelete,
  onTransaction,
  onRefresh,
}: EvaluationCardProps) {
  const { trades } = useStore();
  
  // Filter trades by accountId to get trades specific to this evaluation account
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
  const basicStats = useBasicTradingStats(accountTrades);
  const totalNetPnl = basicStats.totalPnl;
  const currentBalance = calculateCurrentBalance(evaluation, totalNetPnl);
  
  // Calculate progress percentage based on profit target, not balance target
  // Only calculate for evaluation accounts
  const isEvaluationAccount = evaluation.accountType === "evaluation";
  const isPersonalAccount = evaluation.accountType === "personal";
  const progressPercentage = isEvaluationAccount && evaluation.target > 0 ? (totalNetPnl / evaluation.target) * 100 : 0;
  const isTargetExceeded = progressPercentage > 100;
  // Cap the visual progress bar at 100%
  const displayProgress = Math.min(progressPercentage, 100);

  return (
    <Card className="bg-gray-900/50 border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{evaluation.firm} - {evaluation.accountId}</span>
            {isPersonalAccount && (
              <Badge variant="secondary" className="bg-blue-600 text-white">
                Personal
              </Badge>
            )}
            {evaluation.accountType === "evaluation" && (
              <Badge variant="secondary" className="bg-orange-600 text-white">
                Challenge
              </Badge>
            )}
            {evaluation.accountType === "live" && (
              <Badge variant="secondary" className="bg-green-600 text-white">
                Funded
              </Badge>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this {isPersonalAccount ? 'personal account' : 'evaluation'} and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(evaluation.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-2">
          <span>Current Balance</span>
          <span>${currentBalance.toFixed(2)}</span>
        </div>
        {isEvaluationAccount && (
          <div className="flex justify-between mb-2">
            <span>Profit Target</span>
            <span>${(evaluation.target || 0).toFixed(2)}</span>
          </div>
        )}
        {!isPersonalAccount && (
          <div className="flex justify-between mb-2">
            <span>Total P&L</span>
            <span className={totalNetPnl >= 0 ? "text-green-400" : "text-red-400"}>
              ${totalNetPnl >= 0 ? "+" : ""}${totalNetPnl.toFixed(2)}
            </span>
          </div>
        )}
        {isPersonalAccount && (
          <>
            <div className="flex justify-between mb-2">
              <span>Total P&L</span>
              <span className={totalNetPnl >= 0 ? "text-green-400" : "text-red-400"}>
                ${totalNetPnl >= 0 ? "+" : ""}${totalNetPnl.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-400 mb-2">
              Personal trading account - no profit targets or loss limits
            </div>
          </>
        )}
        {isEvaluationAccount && (
          <>
            <div className="flex justify-between mb-2">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={displayProgress} className="mb-2" />
            {isTargetExceeded && (
              <div className="text-green-400 text-sm mb-2">
                🎉 Target exceeded! ({progressPercentage.toFixed(1)}%)
              </div>
            )}
          </>
        )}
        {!isPersonalAccount && (
          <>
            <div className="flex justify-between mb-2">
              <span>Max Loss</span>
              <span>${(evaluation.lossLimits || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Max Daily Loss</span>
              <span>${(evaluation.dailyLossLimit || 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <ManageBalanceModal
          accountId={evaluation.id}
          accountType={evaluation.accountType}
          initialBalance={evaluation.initialBalance}
          transactions={evaluation.transactions || []}
          onTransaction={onTransaction}
          onRefresh={onRefresh}
        />
      </CardFooter>
    </Card>
  );
}

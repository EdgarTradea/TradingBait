import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useStore } from "utils/store";
import { useUserGuardContext } from "app";
import { Evaluation } from "utils/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddEvaluationForm({ isOpen, onClose }: Props) {
  const { user } = useUserGuardContext();
  const { addEvaluation } = useStore();

  const [firm, setFirm] = useState("");
  const [status, setStatus] = useState<"active" | "passed" | "failed">(
    "active",
  );
  const [cost, setCost] = useState(0);
  const [target, setTarget] = useState(0);
  const [lossLimits, setLossLimits] = useState(0);
  const [dailyLossLimit, setDailyLossLimit] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [accountId, setAccountId] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (user) {
      const newEvaluation: Omit<Evaluation, "id" | "userId" | "progress"> = {
        firm,
        status,
        cost,
        target,
        lossLimits,
        dailyLossLimit,
        accountId,
        initialBalance,
        accountType: "evaluation",
      };
      // @ts-ignore
      addEvaluation(user.uid, newEvaluation);
      onClose();
      setIsConfirmOpen(false);
      // Reset form
      setFirm("");
      setStatus("active");
      setCost(0);
      setTarget(0);
      setLossLimits(0);
      setDailyLossLimit(0);
      setInitialBalance(0);
      setAccountId("");
    }
  };

  return (
    <>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Add New Evaluation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <TooltipProvider>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firm" className="text-right">
                Firm
              </Label>
              <Input
                id="firm"
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
                className="col-span-3 bg-gray-800 border-gray-700"
                placeholder="e.g., FTMO, Fundingpips, MyForexFunds"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountId" className="text-right">
                Account ID
              </Label>
              <Input
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="col-span-3 bg-gray-800 border-gray-700"
                placeholder="Must match your trade imports (e.g., 4101125)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "active" | "passed" | "failed")
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Cost ($)
              </Label>
              <Input
                id="cost"
                type="number"
                value={cost === 0 ? "" : cost}
                onChange={(e) => {
                  const value = e.target.value;
                  setCost(value === "" ? 0 : Number(value));
                }}
                className="col-span-3 bg-gray-800 border-gray-700"
                placeholder="Amount paid for evaluation (e.g., 299)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">
                Profit Target ($)
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="target"
                  type="number"
                  value={target === 0 ? "" : target}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTarget(value === "" ? 0 : Number(value));
                  }}
                  className="flex-1 bg-gray-800 border-gray-700"
                  placeholder="Profit needed to pass (e.g., 8000)"
                />
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-800 text-white border-gray-700">
                    <p><strong>Enter PROFIT target, not balance target</strong></p>
                    <p>Example: If you need to make $8,000 profit to pass, enter 8000</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lossLimits" className="text-right">
                Max Loss Limit ($)
              </Label>
              <Input
                id="lossLimits"
                type="number"
                value={lossLimits === 0 ? "" : lossLimits}
                onChange={(e) => {
                  const value = e.target.value;
                  setLossLimits(value === "" ? 0 : Number(value));
                }}
                className="col-span-3 bg-gray-800 border-gray-700"
                placeholder="Max total loss before account closure (e.g., 10000)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dailyLossLimit" className="text-right">
                Daily Loss Limit ($)
              </Label>
              <Input
                id="dailyLossLimit"
                type="number"
                value={dailyLossLimit === 0 ? "" : dailyLossLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  setDailyLossLimit(value === "" ? 0 : Number(value));
                }}
                className="col-span-3 bg-gray-800 border-gray-700"
                placeholder="Max loss per day (e.g., 5000)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initialBalance" className="text-right">
                Starting Balance ($)
              </Label>
              <Input
                id="initialBalance"
                type="number"
                value={initialBalance === 0 ? "" : initialBalance}
                onChange={(e) => {
                  const value = e.target.value;
                  setInitialBalance(value === "" ? 0 : Number(value));
                }}
                className="col-span-3 bg-gray-800 border-gray-700"
                placeholder="Account starting balance (e.g., 100000)"
              />
            </div>
          </TooltipProvider>
        </div>
        <Button onClick={handleSave} type="submit">
          Save Evaluation
        </Button>
      </DialogContent>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-gray-900 text-white border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Evaluation Details</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the details before saving.
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Firm:</strong> {firm}</p>
                <p><strong>Account ID:</strong> {accountId}</p>
                <p><strong>Status:</strong> {status}</p>
                <p><strong>Cost:</strong> ${cost}</p>
                <p><strong>Initial Balance:</strong> ${initialBalance}</p>
                <p><strong>Profit Target:</strong> ${target}</p>
                <p><strong>Loss Limits:</strong> ${lossLimits}</p>
                <p><strong>Daily Loss Limit:</strong> ${dailyLossLimit}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "utils/store";
import { useUserGuardContext } from "app";
import { Evaluation } from "utils/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLiveAccountForm({ isOpen, onClose }: Props) {
  const { user } = useUserGuardContext();
  const { addEvaluation } = useStore();

  const [firm, setFirm] = useState("");
  const [accountId, setAccountId] = useState("");
  const [initialBalance, setInitialBalance] = useState<number | "">("");
  const [lossLimits, setLossLimits] = useState<number | "">("");
  const [dailyLossLimit, setDailyLossLimit] = useState<number | "">("");

  const handleSave = () => {
    if (user && initialBalance !== "" && lossLimits !== "" && dailyLossLimit !== "") {
      const newLiveAccount: Partial<Evaluation> = {
        firm,
        accountId,
        accountType: "live",
        status: "active", // Default status for a live account
        cost: 0,
        target: 0,
        initialBalance: Number(initialBalance),
        lossLimits: Number(lossLimits),
        dailyLossLimit: Number(dailyLossLimit),
      };
      // @ts-ignore
      addEvaluation(user.uid, newLiveAccount);
      onClose();
      // Reset form
      setFirm("");
      setAccountId("");
      setInitialBalance("");
      setLossLimits("");
      setDailyLossLimit("");
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
      <DialogHeader>
        <DialogTitle>Add New Live Account</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="firm" className="text-right">
            Firm
          </Label>
          <Input
            id="firm"
            value={firm}
            onChange={(e) => setFirm(e.target.value)}
            className="col-span-3 bg-gray-800 border-gray-700"
            placeholder="e.g., FTMO, The Funded Trader"
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
            placeholder="e.g., 5012345"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="initialBalance" className="text-right">
            Initial Balance
          </Label>
          <Input
            id="initialBalance"
            type="number"
            value={initialBalance}
            onChange={(e) => setInitialBalance(Number(e.target.value))}
            className="col-span-3 bg-gray-800 border-gray-700"
            placeholder="e.g., 100000"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lossLimits" className="text-right">
            Max Loss
          </Label>
          <Input
            id="lossLimits"
            type="number"
            value={lossLimits}
            onChange={(e) => setLossLimits(Number(e.target.value))}
            className="col-span-3 bg-gray-800 border-gray-700"
            placeholder="e.g., 10000"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dailyLossLimit" className="text-right">
            Max Daily Loss
          </Label>
          <Input
            id="dailyLossLimit"
            type="number"
            value={dailyLossLimit}
            onChange={(e) => setDailyLossLimit(Number(e.target.value))}
            className="col-span-3 bg-gray-800 border-gray-700"
            placeholder="e.g., 5000"
          />
        </div>
      </div>
      <Button onClick={handleSave} type="submit">
        Save Account
      </Button>
    </DialogContent>
  );
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "utils/store";
import { useUserGuardContext } from "app";
import { Evaluation } from "utils/types";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPersonalAccountForm({ isOpen, onClose }: Props) {
  const { user } = useUserGuardContext();
  const { addEvaluation } = useStore();

  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [initialBalance, setInitialBalance] = useState<number | "">("");
  const [broker, setBroker] = useState("");

  const handleSave = async () => {
    if (user && accountName && initialBalance !== "") {
      try {
        const newPersonalAccount: Partial<Evaluation> = {
          firm: broker || "Personal Account", // Use broker name or default
          accountId: accountId || `personal-${Date.now()}`, // Generate ID if not provided
          accountType: "personal",
          status: "active", // Personal accounts are always active
          cost: 0, // No cost for personal accounts
          target: 0, // No profit targets for personal accounts
          progress: 0,
          lossLimits: 0, // No loss limits for personal accounts
          dailyLossLimit: 0, // No daily loss limits for personal accounts
          initialBalance: Number(initialBalance),
        };
        
        await addEvaluation(user.uid, newPersonalAccount);
        
        toast.success("Personal account added successfully!");
        
        // Reset form and close
        setAccountName("");
        setAccountId("");
        setInitialBalance("");
        setBroker("");
        onClose();
      } catch (error) {
        console.error("Error adding personal account:", error);
        toast.error("Failed to add personal account. Please try again.");
      }
    } else {
      toast.error("Please fill in the required fields: Account Name and Starting Balance");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Add Personal Trading Account</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountName" className="text-right">
              Account Name *
            </Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="col-span-3 bg-gray-800 border-gray-700"
              placeholder="e.g., Personal Trading, Main Account"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="broker" className="text-right">
              Broker
            </Label>
            <Input
              id="broker"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="col-span-3 bg-gray-800 border-gray-700"
              placeholder="e.g., Interactive Brokers, TD Ameritrade"
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
              placeholder="e.g., U1234567 (optional)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="initialBalance" className="text-right">
              Starting Balance *
            </Label>
            <Input
              id="initialBalance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className="col-span-3 bg-gray-800 border-gray-700"
              placeholder="e.g., 50000"
            />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            * Required fields
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Personal Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

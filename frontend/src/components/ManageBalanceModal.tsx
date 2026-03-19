
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserGuardContext } from "app";
import { Evaluation } from "utils/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import brain from "brain";

interface Props {
  accountId: string;
  accountType?: "evaluation" | "live" | "personal";
  initialBalance?: number;
  transactions?: Evaluation["transactions"];
  onTransaction?: (accountId: string, amount: number, date: string, type: "deposit" | "withdrawal") => void;
  onRefresh?: () => void;
}

// This modal allows users to manage their account balance by adding deposits or withdrawals.
export function ManageBalanceModal({
  accountId,
  accountType = "evaluation",
  initialBalance,
  transactions,
  onTransaction,
  onRefresh,
}: Props) {
  const { user } = useUserGuardContext();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  // Set default transaction type based on account type
  // Evaluations support refunds only, Live accounts support withdrawals only
  const defaultType = accountType === "evaluation" ? "refund" : "withdrawal";
  const [type, setType] = useState<"withdrawal" | "refund">(defaultType);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSave = async () => {
    if (user && accountId && amount > 0) {
      toast.promise(
        async () => {
          const response = await brain.add_evaluation_transaction({
            evaluationId: accountId,
            transaction: {
              type,
              amount: Number(amount),
              date,
            },
          });
          const result = await response.json();

          if (!result.success) {
            throw new Error(result.message || "An unknown error occurred.");
          }

          setIsOpen(false);
          setAmount("");
          setDate(new Date().toISOString().split("T")[0]);
          
          // Call refresh callbacks if provided
          if (onTransaction) {
            onTransaction(accountId, Number(amount), date, type === "refund" ? "withdrawal" : type);
          }
          if (onRefresh) {
            onRefresh();
          }
        },
        {
          loading: "Saving transaction...",
          success: "Transaction saved successfully!",
          error: (err) => err.message,
        },
      );
    } else {
      toast.error("Please enter a valid amount.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Balance</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Manage Balance</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select onValueChange={(value) => setType(value as any)} value={type}>
              <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {accountType === "live" ? (
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                ) : (
                  <>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="col-span-3 bg-gray-800 border-gray-700"
              placeholder="e.g., 1000"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3 bg-gray-800 border-gray-700"
            />
          </div>
        </div>
        <Button onClick={handleSave} type="submit">
          Save Transaction
        </Button>
        <div className="mt-6">
          <h3 className="font-bold mb-2">History</h3>
          <div className="text-sm">
            Initial Balance: ${initialBalance?.toFixed(2) || "0.00"}
          </div>
          <ul className="space-y-2 mt-2">
            {transactions?.map((t, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {t.type.charAt(0).toUpperCase() + t.type.slice(1)} -{" "}
                  {new Date(t.date).toLocaleDateString()}
                </span>
                <span
                  className={
                    t.type === "deposit" ? "text-green-400" : "text-red-400"
                  }
                >
                  {t.type === "deposit" ? "+" : "-"}${t.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

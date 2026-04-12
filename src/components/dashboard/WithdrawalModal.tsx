import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Landmark, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import API_BASE_URL from "@/Contexts/baseUrl";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const WithdrawalModal = ({ isOpen, onClose, balance, onSuccess }: WithdrawalModalProps) => {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      toast.error("Please fill in all bank details");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/withdraw`,
        {
          amount: numAmount,
          bank_details: {
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
          },
        },
        { withCredentials: true, headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="relative overflow-hidden border-none shadow-2xl bg-white rounded-[2rem]">
            {/* Header */}
            <div className="bg-primary p-6 text-white text-center relative">
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-3 shadow-inner">
                <Landmark className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Withdraw Funds</h2>
              <p className="text-white/70 text-sm mt-1">Submit your payout request</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Balance Summary */}
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Banknote className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Available</span>
                </div>
                <span className="font-black text-primary text-xl tracking-tight">
                  ₦{balance.toLocaleString()}
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Amount to Payout</Label>
                  <button 
                    type="button"
                    onClick={() => setAmount(balance.toString())}
                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                  >
                    Use Max
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary opacity-60">₦</span>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pl-8 pr-4 font-black text-lg rounded-xl border-2 border-primary/10 focus:border-primary transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Target Bank Name</Label>
                  <Input 
                    placeholder="e.g. GTBank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-11 rounded-xl shadow-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Account Number</Label>
                    <Input 
                      placeholder="10 digits"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      maxLength={10}
                      className="h-11 rounded-xl shadow-sm font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Account Name</Label>
                    <Input 
                      placeholder="Full Name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="h-11 rounded-xl shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 leading-tight">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Withdrawals are processed within 24-48 hours after manual verification for security.</p>
              </div>

              {/* Action Button */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    Request Withdrawal
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

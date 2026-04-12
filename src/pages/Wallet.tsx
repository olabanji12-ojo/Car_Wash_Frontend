import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/Contexts/AuthContext";
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Loader2, 
  ShieldCheck, 
  Landmark, 
  Clock 
} from "lucide-react";
import axios from "axios";
import API_BASE_URL from "@/Contexts/baseUrl";
import { motion, AnimatePresence } from "framer-motion";
import { WithdrawalModal } from "@/components/dashboard/WithdrawalModal";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const WalletPage = () => {
  const { user } = useAuth();
  const [fundAmount, setFundAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Fetch Wallet
  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/wallet`, {
        withCredentials: true,
        headers: getAuthHeaders(),
      });
      return res.data.data;
    },
    enabled: !!user,
  });

  // Fund Wallet Mutation
  const fundMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(fundAmount);
      if (!amount || amount < 100) throw new Error("Minimum deposit is ₦100");

      const res = await axios.post(
        `${API_BASE_URL}/wallet/fund`,
        { amount, email: user?.email },
        { withCredentials: true, headers: getAuthHeaders() }
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      // Redirect in same tab so Paystack can navigate back via callback_url
      if (data?.authorization_url) {
        toast.info("Redirecting to secure Paystack checkout...");
        window.location.href = data.authorization_url;
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Failed to initialize payment");
    },
  });

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit": return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "payout": return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "escrow_hold": return <Clock className="h-4 w-4 text-orange-500" />;
      case "escrow_release": return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default: return <WalletIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-100 text-green-800 border-none text-[10px]">Success</Badge>;
      case "pending": return <Badge className="bg-orange-100 text-orange-800 border-none text-[10px]">Pending</Badge>;
      case "failed": return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Fund your wallet to pay for bookings instantly
          </p>
        </div>

        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary to-blue-700 text-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/70 uppercase tracking-widest">
                    Available Balance
                  </p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mt-2" />
                  ) : (
                    <p className="text-5xl font-black tracking-tight">
                      ₦{(walletData?.balance || 0).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-white/60 font-medium">
                    {walletData?.currency || "NGN"} · {walletData?.status || "Active"}
                  </p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <WalletIcon className="h-8 w-8 text-white" />
                </div>
              </div>

              <Separator className="my-6 bg-white/20" />

              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-white text-primary hover:bg-white/90 font-black rounded-xl shadow-lg"
                  onClick={() => setIsDialogOpen(!isDialogOpen)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Fund Wallet
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                  onClick={() => setIsWithdrawModalOpen(true)}
                >
                  <Landmark className="h-5 w-5 mr-2" />
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fund Wallet Form */}
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Secure Deposit via Paystack
                </CardTitle>
                <CardDescription>
                  You'll be redirected to a secure Paystack checkout page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Quick Amount Buttons */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Quick Select
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        variant={fundAmount === String(amt) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full font-bold"
                        onClick={() => setFundAmount(String(amt))}
                      >
                        ₦{amt.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund-amount">Or enter custom amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      ₦
                    </span>
                    <Input
                      id="fund-amount"
                      type="number"
                      min={100}
                      placeholder="Enter amount"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="pl-7 font-bold text-lg h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum deposit: ₦100</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 font-black"
                    disabled={!fundAmount || parseFloat(fundAmount) < 100 || fundMutation.isPending}
                    onClick={() => fundMutation.mutate()}
                  >
                    {fundMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Pay ₦{parseFloat(fundAmount || "0").toLocaleString()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
          <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-sm">How does this work?</p>
            <p className="text-xs opacity-80 mt-0.5">
              When you book a service, funds are held in escrow until the job is marked complete. 
              Once done, the merchant receives their payment automatically (minus a small platform fee).
            </p>
          </div>
        </div>

        {/* Withdrawal Modal */}
        <WithdrawalModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          balance={walletData?.balance || 0}
          onSuccess={() => refetch()}
        />
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;

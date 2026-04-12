import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import API_BASE_URL from "@/Contexts/baseUrl";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const WalletCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  useEffect(() => {
    // Paystack appends ?reference=xxx or ?trxref=xxx to the callback URL
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setStatus("failed");
      return;
    }

    const verify = async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/wallet/verify`,
          { reference },
          { withCredentials: true, headers: getAuthHeaders() }
        );
        setStatus("success");
        toast.success("Wallet funded successfully! 🎉");
        // Redirect to wallet after a short delay so they can see the success state
        setTimeout(() => navigate("/wallet"), 2500);
      } catch (err: any) {
        console.error("Verification failed:", err);
        setStatus("failed");
        toast.error("Payment verification failed. Please contact support.");
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm w-full">
        {status === "verifying" && (
          <>
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-primary/10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black">Verifying Payment...</h1>
              <p className="text-muted-foreground text-sm">
                Please wait while we confirm your transaction with Paystack
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-green-700">Payment Successful!</h1>
              <p className="text-muted-foreground text-sm">
                Your wallet has been funded. Redirecting you back...
              </p>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-red-700">Verification Failed</h1>
              <p className="text-muted-foreground text-sm">
                We couldn't verify your payment. If money was deducted, please contact support.
              </p>
            </div>
            <Button onClick={() => navigate("/wallet")} className="w-full">
              Back to Wallet
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletCallback;

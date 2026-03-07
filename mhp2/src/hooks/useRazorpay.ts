import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  planName: string;
  amountInPaise: number;
  description?: string;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const useRazorpay = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const initiatePayment = async ({ planName, amountInPaise, description }: PaymentOptions) => {
    setLoading(planName);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}_${planName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}`,
          notes: { plan: planName },
        },
      });

      if (error || !data?.order_id) {
        toast.error("Could not create payment order. Please try again.");
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "My Health Passport",
        description: description || planName,
        order_id: data.order_id,
        handler: () => {
          toast.success(`Payment successful for ${planName}! Our team will reach out shortly.`);
        },
        prefill: {},
        theme: { color: "#0066FF" },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return { initiatePayment, loading };
};

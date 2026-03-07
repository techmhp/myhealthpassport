'use client';

import { useState } from "react";
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
    if (typeof window !== 'undefined' && window.Razorpay) {
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

      // TODO: Replace with actual API call to backend for creating Razorpay order
      console.log("Razorpay payment initiated:", { planName, amountInPaise, description });
      toast.info("Payment integration coming soon. Please contact us directly.");
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return { initiatePayment, loading };
};

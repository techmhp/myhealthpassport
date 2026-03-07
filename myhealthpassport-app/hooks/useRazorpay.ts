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
  onSuccess?: (paymentId: string) => void;
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

  const initiatePayment = async ({ planName, amountInPaise, description, onSuccess }: PaymentOptions) => {
    setLoading(planName);
    try {
      // Step 1: Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please check your connection and try again.");
        return;
      }

      // Step 2: Create Razorpay order via Next.js API route
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amountInPaise / 100), // convert paise to rupees
          currency: 'INR',
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        toast.error(errData?.error || "Failed to create payment order. Please try again.");
        return;
      }

      const order = await orderRes.json();

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "My Health Passport",
        description: description || planName,
        order_id: order.id,
        image: "/icon.png",
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Step 4: Verify payment signature on backend
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const result = await verifyRes.json();
          if (result.success) {
            toast.success(`Payment successful! Thank you for choosing ${planName}.`);
            onSuccess?.(response.razorpay_payment_id);
          } else {
            toast.error("Payment verification failed. Please contact support with your payment ID: " + response.razorpay_payment_id);
          }
        },
        prefill: {},
        notes: {
          plan: planName,
        },
        theme: {
          color: "#3b7cf7",
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
            setLoading(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}. Please try again.`);
        setLoading(null);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error("Something went wrong with the payment. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return { initiatePayment, loading };
};

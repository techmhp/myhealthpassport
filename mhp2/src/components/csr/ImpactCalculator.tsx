import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Users, Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const COST_PER_CHILD = 400;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ImpactCalculator = () => {
  const [donationAmount, setDonationAmount] = useState<string>("50000");
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const donation = parseFloat(donationAmount) || 0;
    const count = Math.floor(donation / COST_PER_CHILD);
    
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setChildrenCount(count);
      setTimeout(() => setIsAnimating(false), 500);
    }, 100);

    return () => clearTimeout(timer);
  }, [donationAmount]);

  const handleDonationChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setDonationAmount(numericValue);
  };

  const handleContributeNow = async () => {
    const amount = parseFloat(donationAmount);
    
    if (!amount || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          notes: {
            purpose: 'CSR Donation',
            children_helped: childrenCount,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create order');
      }

      if (!data?.order_id) {
        throw new Error('No order ID received');
      }

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'MHP CSR Initiative',
        description: `Contribution for ${childrenCount} children's health check-ups`,
        order_id: data.order_id,
        handler: function (response: any) {
          toast({
            title: "🎉 Thank You!",
            description: `Your contribution of ₹${amount.toLocaleString('en-IN')} will help ${childrenCount} children receive preventive health check-ups.`,
          });
          console.log('Payment successful:', response);
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        notes: {
          children_helped: childrenCount.toString(),
        },
        theme: {
          color: '#7AC4A0',
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      });
      razorpay.open();
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Error",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-brand/5 via-mint/5 to-lavender/5 border-y border-brand/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Impact Calculator
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              See Your <span className="text-gradient-hero">CSR Impact</span>
            </h3>
          </div>

          {/* Calculator Card */}
          <div className="bg-white rounded-3xl shadow-card border border-brand/10 overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left - Input Section */}
              <div className="p-8 md:p-10 bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="space-y-6">
                  {/* Donation Input */}
                  <div className="space-y-3">
                    <Label htmlFor="donation" className="text-base font-semibold text-foreground">
                      Enter Your Contribution
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-brand">₹</span>
                      <Input
                        id="donation"
                        type="text"
                        inputMode="numeric"
                        value={donationAmount}
                        onChange={(e) => handleDonationChange(e.target.value)}
                        className="pl-10 text-2xl font-bold h-16 border-2 border-brand/20 focus:border-brand rounded-xl bg-white"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  {/* Fixed Cost Display */}
                  <div className="p-4 bg-white/80 rounded-xl border border-brand/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cost per child</span>
                      <span className="text-lg font-bold text-brand">₹{COST_PER_CHILD}</span>
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[25000, 50000, 100000, 250000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDonationAmount(amount.toString())}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                          donationAmount === amount.toString()
                            ? "bg-brand text-white shadow-md"
                            : "bg-white border border-brand/20 text-brand hover:bg-brand/5"
                        )}
                      >
                        ₹{(amount / 1000)}K
                      </button>
                    ))}
                  </div>

                  {/* Contribute Now Button */}
                  <Button
                    onClick={handleContributeNow}
                    disabled={isProcessing || !donationAmount || parseFloat(donationAmount) < 1}
                    className="w-full h-14 text-lg font-bold bg-brand hover:bg-brand/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Contribute Now
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">*₹400 per child excludes lab & biomarker tests</p>
                </div>
              </div>

              {/* Right - Result Section */}
              <div className="p-8 md:p-10 bg-gradient-to-br from-brand via-brand to-brand/90 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-24 h-24 border-4 border-white rounded-full" />
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-4 border-white rounded-full" />
                </div>

                <div className="relative z-10">
                  <div className={cn(
                    "w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300",
                    isAnimating && "scale-110"
                  )}>
                    <Users className={cn(
                      "w-10 h-10 transition-transform duration-300",
                      isAnimating && "scale-110"
                    )} />
                  </div>

                  <p className="text-sm font-medium opacity-80 mb-2">Your contribution helps</p>
                  
                  <div 
                    className={cn(
                      "text-6xl sm:text-7xl font-extrabold mb-2 transition-all duration-300",
                      isAnimating && "scale-105 animate-pulse"
                    )}
                  >
                    {childrenCount.toLocaleString('en-IN')}
                  </div>
                  
                  <p className="text-lg font-semibold mb-4">
                    Children
                  </p>

                  <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">Preventive Health Check-ups</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Message */}
          {childrenCount > 0 && (
            <div className={cn(
              "mt-8 text-center transition-all duration-500",
              isAnimating ? "opacity-100" : "opacity-90"
            )}>
              <p className="text-lg font-semibold text-gradient-hero">
                ✨ {childrenCount.toLocaleString('en-IN')} young lives transformed through early health screening ✨
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImpactCalculator;

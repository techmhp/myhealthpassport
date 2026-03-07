import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Phone } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, { message: 'Please enter a valid 10-digit phone number' })
    .max(10, { message: 'Please enter a valid 10-digit phone number' })
    .regex(/^[0-9]+$/, { message: 'Phone number must contain only digits' }),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

const ParentOTPLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /** Send OTP via Supabase Auth → triggers Send SMS Hook → WhatsApp */
  const handleSendOTP = async (values: PhoneFormValues) => {
    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${values.phone}`,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to send OTP',
        });
        return;
      }

      setPhoneNumber(values.phone);
      setStep('otp');
      startResendTimer();

      toast({
        title: 'OTP Sent!',
        description: `A verification code has been sent to your WhatsApp (+91 ${values.phone})`,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send OTP',
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  /** Verify OTP via Supabase Auth — session is auto-picked by AuthContext */
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid OTP',
        description: 'Please enter the complete 6-digit OTP.',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phoneNumber}`,
        token: otp,
        type: 'sms',
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: error.message || 'Invalid OTP. Please try again.',
        });
        return;
      }

      // Session is automatically picked up by AuthContext.onAuthStateChange
      toast({
        title: 'Verified!',
        description: 'Login successful. Redirecting...',
      });

      navigate('/parent-dashboard');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  /** Resend OTP — same as signInWithOtp, Supabase generates a fresh code */
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phoneNumber}`,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to resend OTP',
        });
        return;
      }

      setOtp('');
      startResendTimer();

      toast({
        title: 'OTP Resent!',
        description: `A new verification code has been sent to your WhatsApp (+91 ${phoneNumber})`,
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to resend OTP',
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <img src={logo} alt="My Health Passport" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground">
            Hi, Welcome to My Health Passport!
          </h1>
        </div>

        {step === 'phone' ? (
          /* Step 1: Phone Number Input */
          <div className="space-y-6">
            <p className="text-center text-muted-foreground text-sm">
              Enter your phone number to receive OTP on WhatsApp
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSendOTP)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            +91
                          </span>
                          <Input
                            type="tel"
                            placeholder="Enter 10-digit Phone Number"
                            className="pl-[4.5rem] h-12 text-base"
                            maxLength={10}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-brand hover:bg-brand/90 text-white"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Get OTP on WhatsApp'
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to all portals
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Enter the 6-digit OTP sent to your WhatsApp
              </p>
              <p className="font-medium text-foreground mt-1">+91 {phoneNumber}</p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              className="w-full h-12 text-base bg-brand hover:bg-brand/90 text-white"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <div className="text-center space-y-2">
              <button
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || isSending}
                className="text-sm text-brand hover:underline disabled:text-muted-foreground disabled:no-underline transition-colors"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>

              <div>
                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Change phone number
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentOTPLoginPage;

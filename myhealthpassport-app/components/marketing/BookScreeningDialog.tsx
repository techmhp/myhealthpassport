'use client';
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { toast } from "sonner";
import { CalendarDays, Clock, ShieldCheck, Heart, Stethoscope, CheckCircle2, X } from "lucide-react";
const logoImg = "/marketing-assets/logo.png";

interface BookScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingSuccess?: () => void;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM",
  "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM",
];

const BookScreeningDialog = ({ open, onOpenChange, onBookingSuccess }: BookScreeningDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedData, setConfirmedData] = useState<{ child_name: string; preferred_date: string; preferred_time: string } | null>(null);
  const [form, setForm] = useState({
    parent_name: "",
    child_name: "",
    child_dob: "",
    gender: "",
    phone: "",
    preferred_date: "",
    preferred_time: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parent_name || !form.child_name || !form.child_dob || !form.phone || !form.gender) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      // TODO: Integrate with backend API to submit booking
      // Previously used Supabase: supabase.from("parent_bookings").insert(...)
      console.log("Booking form submitted:", form);
      setConfirmedData({
        child_name: form.child_name,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
      });
      setShowConfirmation(true);
      setForm({ parent_name: "", child_name: "", child_dob: "", gender: "", phone: "", preferred_date: "", preferred_time: "" });
    } catch (err) {
      console.error("Booking submission error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setConfirmedData(null);
    onOpenChange(false);
  };

  const handleDone = () => {
    if (onBookingSuccess) {
      onBookingSuccess();
    }
    handleClose();
  };

  if (showConfirmation && confirmedData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl gap-0">
          <DialogTitle className="sr-only">Booking Confirmed</DialogTitle>
          <div className="relative bg-gradient-to-br from-[hsl(var(--mint))]/20 via-background to-[hsl(var(--brand))]/10 p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--mint))]/20 ring-4 ring-[hsl(var(--mint))]/30">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--mint))]" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Booking Confirmed! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              We've received the screening request for <span className="font-semibold text-foreground">{confirmedData.child_name}</span>.
            </p>
            {(confirmedData.preferred_date || confirmedData.preferred_time) && (
              <div className="bg-background/80 backdrop-blur rounded-xl p-4 mb-6 border border-border/50 inline-flex flex-col sm:flex-row gap-4 items-center justify-center">
                {confirmedData.preferred_date && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[hsl(var(--brand))]" />
                    <span className="font-medium">
                      {new Date(confirmedData.preferred_date + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {confirmedData.preferred_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[hsl(var(--coral))]" />
                    <span className="font-medium">{confirmedData.preferred_time}</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              Our team will reach out shortly to confirm your slot. Keep an eye on your phone & email!
            </p>
            <Button onClick={handleDone} className="w-full py-5 text-base">
              {onBookingSuccess ? "Proceed to Payment →" : "Done"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl gap-0">
        <DialogTitle className="sr-only">Book Passport Screening</DialogTitle>
        <div className="grid md:grid-cols-2">
          {/* Left Panel */}
            <div className="hidden md:flex flex-col justify-between bg-white p-8 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-[hsl(var(--mint))]/10 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-[hsl(var(--coral))]/10 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold mb-2 leading-tight">Your Child's<br />Wellness Journey<br />Starts Here ✨</h3>
              <p className="text-sm text-muted-foreground mb-8">
                A calm, child-friendly screening that covers physical, nutritional, and emotional health — all in one visit.
              </p>
            </div>
            <div className="relative z-10 flex justify-center">
              <img src={logoImg} alt="My Health Passport" className="h-28 w-auto object-contain" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--mint))]/20 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-[hsl(var(--mint))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Integrated Health Review</p>
                  <p className="text-xs text-muted-foreground">Physical, nutrition & emotional — all covered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--coral))]/20 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[hsl(var(--coral))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Child-First Approach</p>
                  <p className="text-xs text-muted-foreground">Gentle, no labels — just clarity for parents</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--brand))]/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">100% Confidential</p>
                  <p className="text-xs text-muted-foreground">Your child's data stays private & secure</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold mb-2">Book Passport Screening</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fill in the details and we'll confirm your slot.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <Label htmlFor="bp-child">Child's Name *</Label>
                   <Input id="bp-child" value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} className="mt-1 bg-muted/50" />
                 </div>
                 <div>
                   <Label htmlFor="bp-dob">Date of Birth *</Label>
                   <Input id="bp-dob" type="date" value={form.child_dob} onChange={(e) => setForm({ ...form, child_dob: e.target.value })} className="mt-1 bg-muted/50" />
                 </div>
              </div>
              <div>
                <Label htmlFor="bp-gender">Gender *</Label>
                <Select value={form.gender} onValueChange={(val) => setForm({ ...form, gender: val })}>
                  <SelectTrigger className="mt-1 bg-muted/50">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bp-parent">Parent's Name *</Label>
                <Input id="bp-parent" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label htmlFor="bp-phone">Phone Number *</Label>
                <Input id="bp-phone" type="tel" maxLength={10} value={form.phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, phone: val }); }} className="mt-1 bg-muted/50" placeholder="10-digit number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bp-date">Preferred Date</Label>
                  <Input id="bp-date" type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className="mt-1 bg-muted/50" />
                </div>
                <div>
                  <Label htmlFor="bp-time">Preferred Time</Label>
                  <Select value={form.preferred_time} onValueChange={(val) => setForm({ ...form, preferred_time: val })}>
                    <SelectTrigger className="mt-1 bg-muted/50">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full text-base py-5" disabled={loading}>
                {loading ? "Submitting..." : "Book Screening"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookScreeningDialog;

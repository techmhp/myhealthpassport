'use client';
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle, Heart, ShieldCheck } from "lucide-react";
const logoImg = "/marketing-assets/logo.png";

interface TalkToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const concernOptions = [
  { value: "mhp_screening", label: "MHP Comprehensive Screening" },
  { value: "emotional_developmental", label: "Emotional Wellbeing or Developmental Milestones" },
  { value: "growth_nutrition", label: "Growth and Nutritional Challenges" },
];

const TalkToTeamDialog = ({ open, onOpenChange }: TalkToTeamDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedName, setConfirmedName] = useState("");
  const [form, setForm] = useState({
    child_name: "",
    parent_name: "",
    phone: "",
    concern_area: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.child_name || !form.parent_name || !form.phone || !form.concern_area) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      // TODO: Integrate with backend API to submit parent inquiry
      // Previously used Supabase: supabase.from("parent_bookings").insert(...)
      console.log("Talk to team form submitted:", form);
      setConfirmedName(form.child_name);
      setShowConfirmation(true);
      setForm({ child_name: "", parent_name: "", phone: "", concern_area: "" });
    } catch (err) {
      console.error("Talk to team submission error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setConfirmedName("");
    onOpenChange(false);
  };

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl gap-0">
          <DialogTitle className="sr-only">Request Submitted</DialogTitle>
          <div className="relative bg-gradient-to-br from-[hsl(var(--mint))]/20 via-background to-[hsl(var(--brand))]/10 p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--mint))]/20 ring-4 ring-[hsl(var(--mint))]/30">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--mint))]" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">We've Got Your Request! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Our team will reach out soon regarding <span className="font-semibold text-foreground">{confirmedName}</span>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Keep an eye on your phone — we'll connect with you shortly.
            </p>
            <Button onClick={handleClose} className="w-full py-5 text-base">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl gap-0">
        <DialogTitle className="sr-only">Talk to Our Team</DialogTitle>
        <div className="grid md:grid-cols-2">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between bg-white p-8 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-[hsl(var(--lavender))]/10 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-[hsl(var(--mint))]/10 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold mb-2 leading-tight">Already Know<br />What Your Child<br />Needs? 💬</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Skip the screening — speak directly with our experts about your child's specific concern.
              </p>
            </div>
            <div className="relative z-10 flex justify-center">
              <img src={logoImg} alt="My Health Passport" className="h-28 w-auto object-contain" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--lavender))]/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-[hsl(var(--lavender))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Direct Expert Connect</p>
                  <p className="text-xs text-muted-foreground">Talk to the right specialist for your concern</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--coral))]/20 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[hsl(var(--coral))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">No Judgement</p>
                  <p className="text-xs text-muted-foreground">A safe, supportive conversation — always</p>
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
            <h2 className="text-2xl font-extrabold mb-2">Talk to Our Team</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tell us about your child and we'll connect you with the right expert.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tt-child">Child's Name *</Label>
                <Input id="tt-child" value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label htmlFor="tt-parent">Parent's Name *</Label>
                <Input id="tt-parent" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label htmlFor="tt-phone">Contact Number *</Label>
                <Input id="tt-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label htmlFor="tt-concern">Area of Concern *</Label>
                <Select value={form.concern_area} onValueChange={(val) => setForm({ ...form, concern_area: val })}>
                  <SelectTrigger className="mt-1 bg-muted/50">
                    <SelectValue placeholder="Select a concern area" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {concernOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full text-base py-5" disabled={loading}>
                {loading ? "Submitting..." : "Connect with Our Team"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TalkToTeamDialog;

'use client';
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { toast } from "sonner";
import { CheckCircle2, Building2, Heart, Shield } from "lucide-react";
const logoImg = "/marketing-assets/logo.png";

interface CSRPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const partnershipOptions = [
  { value: "school_adoption", label: "School Adoption (₹2.5L+/year)" },
  { value: "custom_program", label: "Custom Program (Tailored)" },
  { value: "not_sure", label: "Not sure yet — help me decide" },
];

const CSRPartnerDialog = ({ open, onOpenChange }: CSRPartnerDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedName, setConfirmedName] = useState("");
  const [form, setForm] = useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    partnership_type: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.organization || !form.phone || !form.partnership_type) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      // TODO: Integrate with backend API to submit CSR partnership inquiry
      // Previously used Supabase: supabase.from("school_leads").insert(...)
      console.log("CSR partner form submitted:", form);
      setConfirmedName(form.name);
      setShowConfirmation(true);
      setForm({ name: "", organization: "", email: "", phone: "", partnership_type: "", message: "" });
    } catch (err) {
      console.error("CSR partner unexpected error:", err);
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
            <h2 className="text-2xl font-extrabold mb-2">Thank You for Your Interest! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Hi <span className="font-semibold text-foreground">{confirmedName}</span>, our CSR partnerships team will reach out within 24 hours.
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
        <DialogTitle className="sr-only">Partner With Us</DialogTitle>
        <div className="grid md:grid-cols-2">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between bg-white p-8 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-[hsl(var(--lavender))]/10 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-[hsl(var(--mint))]/10 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold mb-2 leading-tight">Transform Children's<br />Health Through<br />Your CSR 💚</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Partner with MHP to bring preventive health screening to underserved schools.
              </p>
            </div>
            <div className="relative z-10 flex justify-center">
              <img src={logoImg} alt="My Health Passport" className="h-28 w-auto object-contain" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--brand))]/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Measurable Impact</p>
                  <p className="text-xs text-muted-foreground">Track every child screened with real-time dashboards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--coral))]/20 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[hsl(var(--coral))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Section 135 Aligned</p>
                  <p className="text-xs text-muted-foreground">Qualifies under CSR health & education categories</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--mint))]/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-[hsl(var(--mint))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">End-to-End Execution</p>
                  <p className="text-xs text-muted-foreground">We handle everything — you get the impact report</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold mb-2">Partner With Us</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tell us about your CSR goals and we'll design the right program for you.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="csr-name">Your Name *</Label>
                <Input id="csr-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-muted/50" placeholder="Full name" />
              </div>
              <div>
                <Label htmlFor="csr-org">Organization / Company *</Label>
                <Input id="csr-org" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="mt-1 bg-muted/50" placeholder="Company name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="csr-email">Email</Label>
                  <Input id="csr-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 bg-muted/50" placeholder="you@company.com" />
                </div>
                <div>
                  <Label htmlFor="csr-phone">Phone *</Label>
                  <Input id="csr-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-muted/50" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div>
                <Label htmlFor="csr-type">Partnership Interest *</Label>
                <Select value={form.partnership_type} onValueChange={(val) => setForm({ ...form, partnership_type: val })}>
                  <SelectTrigger className="mt-1 bg-muted/50">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {partnershipOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="csr-message">Message (optional)</Label>
                <Textarea id="csr-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 bg-muted/50 resize-none" rows={3} placeholder="Tell us about your CSR vision..." />
              </div>
              <Button type="submit" className="w-full text-base py-5" disabled={loading}>
                {loading ? "Submitting..." : "Start the Conversation"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSRPartnerDialog;

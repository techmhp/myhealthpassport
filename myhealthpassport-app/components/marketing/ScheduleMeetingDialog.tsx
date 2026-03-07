'use client';
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { toast } from "sonner";
import { CheckCircle2, School, ShieldCheck, Handshake } from "lucide-react";
const logoImg = "/marketing-assets/logo.png";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const programOptions = [
  "Awareness & Screening Program",
  "Compact Health Buddy Centre",
  "MHP Health Buddy Centre",
  "Not Sure — Help Me Choose",
];

const ScheduleMeetingDialog = ({ open, onOpenChange }: ScheduleMeetingDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedSchool, setConfirmedSchool] = useState("");
  const [form, setForm] = useState({
    school_name: "",
    phone: "",
    program_interest: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.school_name || !form.phone || !form.program_interest) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      // TODO: Integrate with backend API to submit school lead
      // Previously used Supabase: supabase.from("school_leads").insert(...)
      console.log("Schedule meeting form submitted:", form);
      setConfirmedSchool(form.school_name);
      setShowConfirmation(true);
      setForm({ school_name: "", phone: "", program_interest: "" });
    } catch (err) {
      console.error("Schedule meeting unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setConfirmedSchool("");
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
              Our team will reach out soon regarding <span className="font-semibold text-foreground">{confirmedSchool}</span>.
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
        <DialogTitle className="sr-only">Partner With MHP</DialogTitle>
        <div className="grid md:grid-cols-2">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between bg-white p-8 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-[hsl(var(--brand))]/10 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-[hsl(var(--mint))]/10 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold mb-2 leading-tight">
                Ready to Bring<br />Preventive Health<br />to Your School? 🏫
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                Partner with MHP and give every child access to structured health support.
              </p>
            </div>
            <div className="relative z-10 flex justify-center">
              <img src={logoImg} alt="My Health Passport" className="h-28 w-auto object-contain" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--brand))]/20 flex items-center justify-center">
                  <School className="h-4 w-4 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Flexible Models</p>
                  <p className="text-xs text-muted-foreground">Choose the model that fits your school best</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--mint))]/20 flex items-center justify-center">
                  <Handshake className="h-4 w-4 text-[hsl(var(--mint))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Zero Medical Burden</p>
                  <p className="text-xs text-muted-foreground">MHP handles all health delivery end-to-end</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[hsl(var(--lavender))]/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--lavender))]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">100% Confidential</p>
                  <p className="text-xs text-muted-foreground">Student data stays private & secure</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold mb-2">Partner With MHP</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tell us about your school and we'll reach out to get started.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sm-school">School Name *</Label>
                <Input
                  id="sm-school"
                  value={form.school_name}
                  onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                  className="mt-1 bg-muted/50"
                />
              </div>
              <div>
                <Label htmlFor="sm-phone">Mobile Number *</Label>
                <Input
                  id="sm-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 bg-muted/50"
                />
              </div>
              <div>
                <Label>Program of Interest *</Label>
                <Select
                  value={form.program_interest}
                  onValueChange={(val) => setForm({ ...form, program_interest: val })}
                >
                  <SelectTrigger className="mt-1 bg-muted/50">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {programOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full text-base py-5" disabled={loading}>
                {loading ? "Submitting..." : "Get Started"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;

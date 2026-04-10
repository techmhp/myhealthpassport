'use client';
import { Search, TrendingUp, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import { useRazorpay } from "@/hooks/useRazorpay";
import BookScreeningDialog from "@/components/marketing/BookScreeningDialog";

const programs = [
  {
    id: "insight",
    icon: Search,
    title: "INSIGHT",
    tagline: "Clarity Before Care",
    description: "A one-time screening to understand your child's physical, nutritional, emotional, and developmental health — before any labels or interventions.",
    color: "brand",
    highlights: [
      "Growth, nutrition & developmental assessment",
      "Emotional & learning milestone review",
      "Comprehensive health report",
      "One-on-one walkthrough with clear next steps",
    ],
    details: [
      "Vision, dental & lab insights included",
      "Child-friendly, calm screening environment",
      "Digital Health Passport for long-term tracking",
      "Honest recommendations — only if needed",
    ],
    outcome: "Clear understanding. Confident decisions. No guesswork.",
    pricingTabs: [
      { id: "screening", label: "Screening", price: "2,499", paise: 249900, period: "one-time screening" },
    ],
  },
  {
    id: "flourish",
    icon: TrendingUp,
    title: "FLOURISH",
    tagline: "Track. Support. Progress.",
    description: "A structured, ongoing wellness program with continuous assessment, guided expert support, and measurable progress.",
    color: "mint",
    highlights: [
      "Psychological & nutritional evaluation",
      "Weekly symptom tracking & smart-scale analysis",
      "Regular psychologist & nutritionist sessions",
      "Monthly progress reports with course correction",
    ],
    details: [
      "Two lab assessments: start and end of program",
      "Add-on: Speech Therapist, Special Educator",
      "End-of-program comparative report",
      "Progress review & challenge resolution",
    ],
    outcome: "Clear tracking. Consistent guidance. Visible progress.",
    pricingTabs: [
      { id: "monthly", label: "Monthly", price: "4,999", paise: 499900, period: "per month · 3-month plan" },
      { id: "upfront", label: "Pay Upfront", price: "12,999", paise: 1299900, period: "one-time · Save ₹2,000" },
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string; solid: string }> = {
  brand: { bg: "bg-brand/10", text: "text-brand", border: "border-brand/20", gradient: "from-brand/10 via-brand/5 to-lavender/5", solid: "bg-primary" },
  mint: { bg: "bg-mint/10", text: "text-mint", border: "border-mint/20", gradient: "from-mint/10 via-mint/5 to-brand/5", solid: "bg-mint" },
};

const ProgramCard = ({ program }: { program: typeof programs[0] }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const c = colorMap[program.color];
  const { initiatePayment, loading } = useRazorpay();

  const activeOption = program.pricingTabs[activeTab];

  const handlePay = () => {
    if (program.id === "insight") {
      setBookingOpen(true);
    } else {
      initiatePayment({
        planName: `${program.title} — ${activeOption.label}`,
        amountInPaise: activeOption.paise,
        description: `MHP ${program.title} Programme`,
      });
    }
  };

  const handleBookingSuccess = () => {
    initiatePayment({
      planName: `${program.title} — ${activeOption.label}`,
      amountInPaise: activeOption.paise,
      description: `MHP ${program.title} Programme`,
    });
  };

  return (
    <div className={`rounded-3xl border ${c.border} bg-background overflow-hidden hover:shadow-xl transition-all duration-300`}>
      <div className={`bg-gradient-to-br ${c.gradient} p-6 lg:p-8`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center shrink-0`}>
            <program.icon className={`w-7 h-7 ${c.text}`} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold">{program.title}</h3>
            <p className={`text-sm font-semibold ${c.text}`}>{program.tagline}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
      </div>

      <div className="p-6 lg:p-8">
        <ul className="space-y-3 mb-5">
          {program.highlights.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 ${c.bg} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                <Check className={`w-3 h-3 ${c.text}`} />
              </div>
              <span className="text-sm font-medium">{item}</span>
            </li>
          ))}
        </ul>

        <p className={`text-sm font-bold ${c.text} mb-5`}>{program.outcome}</p>

        {/* Pricing Block */}
        <div className={`rounded-2xl border ${c.border} overflow-hidden mb-5`}>
          {/* Tabs (only if more than 1 option) */}
          {program.pricingTabs.length > 1 && (
            <div className={`flex border-b ${c.border}`}>
              {program.pricingTabs.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors ${
                    activeTab === i
                      ? `${c.bg} ${c.text}`
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Active Price */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs text-muted-foreground">₹</span>
                <span className="text-3xl font-extrabold tracking-tight">{activeOption.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{activeOption.period}</p>
            </div>
            <Button
              size="sm"
              className={`${c.solid} text-primary-foreground rounded-xl px-5 shadow-md`}
              disabled={loading === `${program.title} — ${activeOption.label}`}
              onClick={handlePay}
            >
              {loading === `${program.title} — ${activeOption.label}` ? "Processing…" : "Pay Now"}
            </Button>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border ${c.border} text-sm font-semibold ${c.text} transition-all duration-200`}
        >
          {expanded ? "Show Less" : "More Details"}
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div className={`grid transition-all duration-500 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <ul className="space-y-2.5">
              {program.details.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`w-4 h-4 ${c.bg} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                    <Check className={`w-2.5 h-2.5 ${c.text}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {program.id === "insight" && (
        <BookScreeningDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

const CareProgramsSection = () => (
  <section id="programs" className="py-20 lg:py-28 bg-gradient-soft relative overflow-hidden">
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl -translate-y-1/2" />
    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mint/5 rounded-full blur-3xl translate-y-1/2" />

    <div className="container mx-auto px-4 relative z-10">
      <AnimatedSection animation="fade-up">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-4 py-2 rounded-full text-sm font-semibold mb-5">
            Beyond Screening
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
            Our Care <span className="text-gradient-hero">Programmes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Two structured pathways — one for clarity, one for continuous growth.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={150}>
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default CareProgramsSection;

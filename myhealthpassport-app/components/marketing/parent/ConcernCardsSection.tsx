'use client';
import { Brain, Apple, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import { useRazorpay } from "@/hooks/useRazorpay";

const services = [
  {
    id: "emotional",
    icon: Brain,
    title: "Emotional & Learning",
    tagline: "Support for the Mind",
    description: "Guided support for children facing emotional, behavioural, or learning challenges — with expert psychologists and therapists.",
    color: "lavender",
    highlights: [
      "Anxiety, mood changes & emotional regulation",
      "Focus, attention & learning difficulties",
      "Behavioural concerns & social skills",
      "Speech, motor & developmental support",
    ],
    details: [
      "Adolescent exam stress management",
      "Sensory processing support",
      "Special educator sessions available",
      "Parent guidance & home strategies",
    ],
    outcome: "Understand. Support. Progress — at your child's pace.",
    pricingTabs: [
      { id: "assessment", label: "Assessment", price: "1,999", paise: 199900, period: "per session" },
      { id: "counselling", label: "Counselling", price: "1,499", paise: 149900, period: "per session" },
    ],
    bundle: { label: "Monthly Pack · 4 sessions", price: "4,999", paise: 499900 },
  },
  {
    id: "nutrition",
    icon: Apple,
    title: "Nutrition & Lifestyle",
    tagline: "Fuel for Growth",
    description: "Personalised nutrition plans and lifestyle guidance to address energy, immunity, growth, and eating habit concerns.",
    color: "mint",
    highlights: [
      "Low energy, fatigue & poor stamina",
      "Weight concerns & unhealthy eating patterns",
      "Gut health & digestive issues",
      "Micronutrient deficiencies & weak immunity",
    ],
    details: [
      "Exam-time nutrition planning",
      "Hydration & screen-time snacking habits",
      "Growth tracking & body composition",
      "Family meal planning guidance",
    ],
    outcome: "Better fuel. Stronger growth. Healthier habits.",
    pricingTabs: [
      { id: "monthly", label: "Monthly", price: "2,999", paise: 299900, period: "per month" },
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string; iconBg: string; payBg: string }> = {
  lavender: { bg: "bg-lavender/10", text: "text-lavender", border: "border-lavender/20", gradient: "from-lavender/10 via-lavender/5 to-brand/5", iconBg: "bg-lavender", payBg: "bg-lavender" },
  mint: { bg: "bg-mint/10", text: "text-mint", border: "border-mint/20", gradient: "from-mint/10 via-mint/5 to-brand/5", iconBg: "bg-mint", payBg: "bg-mint" },
};

const ServiceCard = ({ service }: { service: typeof services[0] }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const c = colorMap[service.color];
  const { initiatePayment, loading } = useRazorpay();

  const activeOption = service.pricingTabs[activeTab];

  const handlePay = (paise: number, planLabel: string) => {
    initiatePayment({
      planName: `${service.title} — ${planLabel}`,
      amountInPaise: paise,
      description: `MHP ${service.title}`,
    });
  };

  return (
    <div className={`rounded-3xl border ${c.border} bg-background overflow-hidden hover:shadow-xl transition-all duration-300`}>
      <div className={`bg-gradient-to-br ${c.gradient} p-6 lg:p-8`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 ${c.iconBg} rounded-2xl flex items-center justify-center shrink-0 shadow-md`}>
            <service.icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold">{service.title}</h3>
            <p className={`text-sm font-semibold ${c.text}`}>{service.tagline}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
      </div>

      <div className="p-6 lg:p-8">
        <ul className="space-y-3 mb-5">
          {service.highlights.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 ${c.bg} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                <Check className={`w-3 h-3 ${c.text}`} />
              </div>
              <span className="text-sm font-medium">{item}</span>
            </li>
          ))}
        </ul>

        <p className={`text-sm font-bold ${c.text} mb-5`}>{service.outcome}</p>

        {/* Pricing Block */}
        <div className={`rounded-2xl border ${c.border} overflow-hidden mb-5`}>
          {/* Tabs (only if more than 1 option) */}
          {service.pricingTabs.length > 1 && (
            <div className={`flex border-b ${c.border}`}>
              {service.pricingTabs.map((tab, i) => (
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
              {service.pricingTabs.length === 1 && activeOption.label && (
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">{activeOption.label}</p>
              )}
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs text-muted-foreground">₹</span>
                <span className="text-3xl font-extrabold tracking-tight">{activeOption.price}</span>
              </div>
              <p className="text-xs text-muted-foreground">{activeOption.period}</p>
            </div>
            <Button
              size="sm"
              className={`${c.payBg} text-primary-foreground rounded-xl px-5 shadow-md`}
              disabled={loading === `${service.title} — ${activeOption.label}`}
              onClick={() => handlePay(activeOption.paise, activeOption.label)}
            >
              {loading === `${service.title} — ${activeOption.label}` ? "Processing…" : "Pay Now"}
            </Button>
          </div>

          {/* Bundle offer */}
          {service.bundle && (
            <div className={`${c.bg} px-4 py-3 flex items-center justify-between border-t ${c.border}`}>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">{service.bundle.label}</p>
                <span className="text-sm font-bold">₹{service.bundle.price}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className={`rounded-xl border-2 ${c.border} ${c.text} text-xs px-4`}
                disabled={loading === `${service.title} — Monthly Pack`}
                onClick={() => handlePay(service.bundle!.paise, "Monthly Pack")}
              >
                Buy Pack
              </Button>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border ${c.border} text-sm font-semibold ${c.text} transition-all duration-200 hover:shadow-sm`}
        >
          {expanded ? "Show Less" : "More Details"}
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div className={`grid transition-all duration-500 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <ul className="space-y-2.5">
              {service.details.map((item, i) => (
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
    </div>
  );
};

const ConcernCardsSection = ({ onTalkToTeam }: { onTalkToTeam: () => void }) => (
  <section className="py-20 lg:py-28 bg-card relative overflow-hidden">
    <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-lavender/5 rounded-full blur-3xl -translate-y-1/2" />
    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-mint/5 rounded-full blur-3xl translate-y-1/2" />

    <div className="container mx-auto px-4 relative z-10">
      <AnimatedSection animation="fade-up">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-lavender/10 text-lavender px-4 py-2 rounded-full text-sm font-semibold mb-5">
            Already Know the Concern?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
            Skip Screening. <span className="text-gradient-hero">Get Direct Support.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            If your child already has a diagnosis or known concern, connect directly with the right expert.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={150}>
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </AnimatedSection>

    </div>
  </section>
);

export default ConcernCardsSection;

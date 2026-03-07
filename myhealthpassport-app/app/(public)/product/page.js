'use client';

import { useState } from "react";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import FlagshipModel from "@/components/marketing/product/FlagshipModel";
import HumanLensModel from "@/components/marketing/product/HumanLensModel";
import {
  Building2,
  Heart,
  ArrowRight,
  Brain,
  Eye,
  Stethoscope,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Target,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";

/* Shared */
const Tag = ({ children, className = "" }) => (
  <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${className}`}>
    {children}
  </span>
);

/* "For Whom" callout */
const ForWhomBadge = ({ text, iconColor }) => (
  <div className="flex items-start gap-3 mt-4 rounded-xl bg-muted/60 border border-border px-4 py-3">
    <Target className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
    <p className="text-sm text-foreground/70 leading-snug">{text}</p>
  </div>
);

/* MODEL 2 — Compact Centre */
const CompactModel = () => (
  <div className="space-y-6">
    <div className="grid sm:grid-cols-2 gap-3">
      {[
        { icon: Brain, label: "Psychologist", sub: "5 days a week", emoji: "🧠" },
        { icon: Stethoscope, label: "Nutritionist", sub: "5 days a week", emoji: "🥗" },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-emerald-50 border border-mint/10">
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-sm font-bold text-foreground">{item.label}</span>
          <Tag className="bg-mint/10 text-mint">{item.sub}</Tag>
        </div>
      ))}
    </div>

    {/* What we deliver */}
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">What We Deliver</p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {[
          "Detailed counselling & psychology assessments",
          "Comprehensive nutrition evaluations",
          "Complete My Health Passport for every child",
          "CBSE-mandated counsellor role fulfilled",
          "Parent feedback & discussion sessions",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50/60 border border-mint/10">
            <CheckCircle2 className="w-4 h-4 text-mint shrink-0 mt-0.5" />
            <span className="text-sm text-foreground/80">{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Curriculum & Training */}
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Curriculum & Training Included</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Student Curriculum */}
        <div className="rounded-2xl border border-mint/20 bg-emerald-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mint/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-mint" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Student Curriculum</h4>
          </div>
          <div className="space-y-2">
            {[
              "Age-wise emotional wellbeing sessions",
              "Nutrition awareness & healthy habits",
              "Behavioural & social skills modules",
              "Mindfulness & self-regulation exercises",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0 mt-0.5" />
                <span className="text-[13px] text-foreground/75">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Training */}
        <div className="rounded-2xl border border-mint/20 bg-emerald-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mint/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-mint" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Teacher Training</h4>
          </div>
          <div className="space-y-2">
            {[
              "Monthly workshops on child psychology",
              "Red-flag identification & referral guidance",
              "Classroom wellbeing strategies",
              "Nutrition impact on learning & behaviour",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0 mt-0.5" />
                <span className="text-[13px] text-foreground/75">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* MODEL 3 — Camp Model */
const AwarenessScreeningModel = () => (
  <div className="space-y-6">
    {/* Flow */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-0">
      {[
        { label: "Awareness Talk", emoji: "🎤" },
        { label: "Teachers Identify", emoji: "👀" },
        { label: "Eye & Dental Screening", emoji: "🔬" },
        { label: "Refer to MHP", emoji: "📋" },
      ].map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center text-center gap-1.5 px-4 py-3 rounded-xl bg-violet-50 border border-lavender/10 min-w-[120px]">
            <span className="text-xl">{step.emoji}</span>
            <span className="text-xs font-bold text-foreground">{step.label}</span>
          </div>
          {i < 3 && <ArrowRight className="w-4 h-4 text-lavender/30 hidden sm:block mx-1 shrink-0" />}
        </div>
      ))}
    </div>

    {/* The Human Lens — Awareness Talk */}
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">The Human Lens — Our Awareness Talk</p>
      <div className="rounded-2xl border border-lavender/20 bg-violet-50/50 p-5 space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">
          Children rarely say <em>&quot;I&apos;m struggling.&quot;</em> Stress shows up through <strong>mind, body & behaviour</strong> together. Our talk helps teachers and parents spot these signs early — before they snowball.
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { emoji: "🔍", title: "Spot the Signs", desc: "Age-wise red flags across emotions, energy, eating & learning" },
            { emoji: "🧑‍🏫", title: "Teacher Tools", desc: "Structured observation frameworks & classroom wellbeing strategies" },
            { emoji: "👨‍👩‍👧", title: "Parent Clarity", desc: "Help parents recognise early cues without panic or labelling" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-lavender/10 bg-white/60 p-4 text-center space-y-2">
              <span className="text-2xl">{item.emoji}</span>
              <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
              <p className="text-[13px] text-foreground/70 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {["Not diagnosis", "Not labelling", "Not mandatory"].map((item, i) => (
            <span key={i} className="text-[11px] font-medium text-muted-foreground bg-violet-50 border border-lavender/15 rounded-full px-3 py-1">
              ✕ {item}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Screening highlights */}
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="rounded-2xl border border-lavender/20 bg-violet-50/50 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-lavender/10 flex items-center justify-center">
            <Eye className="w-6 h-6 text-lavender" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Eye Screening</h4>
            <span className="text-[11px] text-muted-foreground">For all students</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {["Visual acuity assessment", "Early detection of refractive errors", "Colour vision screening", "Referral for corrective action"].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-lavender shrink-0 mt-0.5" />
              <span className="text-[13px] text-foreground/75">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-lavender/20 bg-violet-50/50 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-lavender/10 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-lavender" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Dental Screening</h4>
            <span className="text-[11px] text-muted-foreground">For all students</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {["Oral hygiene assessment", "Cavity & decay identification", "Gum health evaluation", "Referral for dental treatment"].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-lavender shrink-0 mt-0.5" />
              <span className="text-[13px] text-foreground/75">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* What we deliver */}
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">What We Deliver</p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {[
          "Teacher sessions on child psychology & emotional regulation",
          "Nutrition awareness & its impact on behaviour",
          "Understanding behaviour as communication",
          "Age-appropriate red flag identification (no diagnosis)",
          "Eye screening for all students",
          "Dental screening for all students",
          "Parent awareness workshops",
          "Referral pathway to MHP for identified children",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-violet-50/60 border border-lavender/10">
            <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
            <span className="text-sm text-foreground/80">{item}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-xl bg-violet-50/40 border border-lavender/10 p-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Key outcome:</strong> Schools gain health awareness plus actionable eye & dental screening — creating a natural pipeline that opens doors to deeper partnerships with MHP.
      </p>
    </div>
  </div>
);

/* Model config */
const models = [
  {
    id: "flagship",
    number: "01",
    tag: "Most Comprehensive",
    tagClass: "bg-brand text-primary-foreground",
    title: "Health Buddy Centre",
    oneLiner: "A complete preventive health ecosystem — inside the school, all year round.",
    forWhom: "For premium or progressive schools that want a complete in-school health and wellbeing ecosystem.",
    icon: Building2,
    iconBg: "bg-brand-light",
    iconColor: "text-brand",
    borderColor: "border-brand/20",
    decorBg: "bg-brand/5",
    content: <FlagshipModel />,
  },
  {
    id: "compact",
    number: "02",
    tag: "Space-Efficient",
    tagClass: "bg-mint text-primary-foreground",
    title: "Compact Health Buddy Centre",
    oneLiner: "Year-round psychologist & nutritionist — minimal space, maximum impact.",
    forWhom: "For mid-tier schools that need a psychologist for CBSE compliance but have limited space or budget.",
    icon: Heart,
    iconBg: "bg-emerald-50",
    iconColor: "text-mint",
    borderColor: "border-mint/20",
    decorBg: "bg-mint/5",
    content: <CompactModel />,
  },
  {
    id: "awareness",
    number: "03",
    tag: "Entry Point",
    tagClass: "bg-lavender text-primary-foreground",
    title: "Awareness & Screening Program",
    oneLiner: "Health awareness talks combined with eye & dental screening — the ideal school entry point.",
    forWhom: "For schools that want to start with awareness and basic screenings before committing to a deeper program.",
    icon: Eye,
    iconBg: "bg-violet-50",
    iconColor: "text-lavender",
    borderColor: "border-lavender/20",
    decorBg: "bg-lavender/5",
    content: <AwarenessScreeningModel />,
  },
  {
    id: "humanlens",
    number: "04",
    tag: "Deep Dive",
    tagClass: "bg-amber-500 text-primary-foreground",
    title: "The Human Lens Program",
    oneLiner: "A comprehensive awareness-to-action system — educate, equip, identify, and support ethically.",
    forWhom: "For schools that want a deep, structured understanding of what this awareness program really delivers and why it matters.",
    icon: Megaphone,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-amber-300/30",
    decorBg: "bg-amber-500/5",
    content: <HumanLensModel />,
  },
];

/* PAGE */
const ProductPage = () => {
  const [activeModel, setActiveModel] = useState("flagship");

  return (
    <div className="min-h-screen bg-background font-body">
      <Header />

      {/* HERO */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-32 w-64 h-64 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute top-40 -right-32 w-64 h-64 rounded-full bg-mint/5 blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <AnimatedSection animation="fade-up">
            <Tag className="bg-brand/10 text-brand mb-5">How It Works</Tag>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold font-display text-foreground leading-[1.15] mb-5">
              Preventive Health,{" "}
              <span className="bg-gradient-to-r from-brand via-mint to-coral bg-clip-text text-transparent">
                Delivered to Schools
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Four flexible models — from awareness talks to a full on-campus health centre. Every school finds its fit.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* PROGRESSION STRIP */}
      <AnimatedSection animation="fade-up" delay={100}>
        <section className="pb-14">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-center justify-between rounded-2xl bg-card border border-border p-5 shadow-sm gap-1">
              {[
                { label: "Awareness", icon: Eye, color: "text-lavender" },
                { label: "Human Lens", icon: Megaphone, color: "text-amber-600" },
                { label: "Compact", icon: Heart, color: "text-mint" },
                { label: "Full Centre", icon: Building2, color: "text-brand" },
              ].map((s, i) => {
                const StepIcon = s.icon;
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5 text-center min-w-[55px] sm:min-w-[80px]">
                      <StepIcon className={`w-5 h-5 ${s.color}`} />
                      <span className="text-[10px] sm:text-xs font-bold text-foreground">{s.label}</span>
                    </div>
                    {i < 3 && <ArrowRight className="w-4 h-4 text-border shrink-0" />}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[11px] text-muted-foreground mt-2.5">
              Schools naturally progress deeper over time →
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* MODEL TABS + CONTENT */}
      <section className="pb-20 lg:pb-28">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {models.map((m) => {
              const isActive = activeModel === m.id;
              const TabIcon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModel(m.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200
                    ${isActive
                      ? `${m.tagClass} border-transparent shadow-lg scale-[1.03]`
                      : `bg-card border-border text-muted-foreground hover:border-muted-foreground/20 hover:text-foreground hover:shadow-sm`
                    }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{m.title}</span>
                  <span className="sm:hidden">{m.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active model content */}
          {models.map((model) => {
            if (model.id !== activeModel) return null;
            const ModelIcon = model.icon;
            return (
              <AnimatedSection key={model.id} animation="fade-up">
                <div className={`relative rounded-3xl border-2 ${model.borderColor} bg-card overflow-hidden`}>
                  {/* Decorative corner blob */}
                  <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full ${model.decorBg} blur-3xl pointer-events-none`} />

                  {/* Model header */}
                  <div className="relative p-8 sm:p-10 pb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      <div className={`w-20 h-20 rounded-2xl ${model.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                        <ModelIcon className={`w-10 h-10 ${model.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <span className={`text-5xl font-extrabold ${model.iconColor} opacity-15 leading-none`}>{model.number}</span>
                          <Tag className={model.tagClass}>{model.tag}</Tag>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">{model.title}</h2>
                        <p className="text-muted-foreground mt-1.5 text-[15px]">{model.oneLiner}</p>
                        <ForWhomBadge text={model.forWhom} iconColor={model.iconColor} />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-8 sm:mx-10 h-px bg-border" />

                  {/* Content */}
                  <div className="relative p-8 sm:p-10 pt-8">
                    {model.content}
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 border-t border-border bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.02]" />
        <div className="container mx-auto px-4 text-center max-w-xl relative z-10">
          <AnimatedSection animation="scale">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">
              Every School Is Different
            </h2>
            <p className="text-muted-foreground mb-8">
              We adapt to your space, time, and readiness — and grow with you.
            </p>
            <Button size="lg" className="rounded-full px-8 bg-brand hover:bg-brand-dark text-primary-foreground font-semibold shadow-md">
              Schedule a Meeting
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductPage;

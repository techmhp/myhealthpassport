import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Brain, 
  Eye, 
  Users, 
  Ban,
  CheckCircle,
  CheckCircle2,
  GraduationCap,
  Heart,
  ClipboardList,
  MessageCircle,
  Building2,
  Shield,
  ArrowRight,
  Lightbulb,
  FileCheck,
  BadgeCheck,
  Wallet,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Target,
  TrendingUp,
  Megaphone,
  ShieldCheck,
  MessageSquare,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

/* ─── Shared helpers (from HumanLensModel) ─── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{children}</p>
);

const HealthTalksPage = () => {
  const [expandedComponent, setExpandedComponent] = useState<number | null>(null);

  /* ── Human Lens: The Problem data ── */
  const schoolProblems = [
    { emoji: "😤", text: "Increasing behavioural concerns in classrooms" },
    { emoji: "😢", text: "Emotional instability & outbursts in students" },
    { emoji: "😴", text: "Nutrition-linked fatigue and focus issues" },
    { emoji: "🔥", text: "Teacher burnout from handling complex needs" },
    { emoji: "😰", text: "Parents either overreacting or completely in denial" },
    { emoji: "🚫", text: "No structured referral pathway exists" },
  ];

  const stakeholderPains = [
    {
      role: "Teachers", emoji: "👩‍🏫", color: "text-brand", bg: "bg-brand-light/50", border: "border-brand/15",
      pain: "Notice changes in students daily. But they don't have a structured framework to act on what they see.",
      quote: "\"I can see something is wrong. But what do I do about it?\"",
    },
    {
      role: "Parents", emoji: "👨‍👩‍👧", color: "text-coral", bg: "bg-orange-50/50", border: "border-coral/15",
      pain: "Sense something is off at home. But they can't tell what's normal development vs a real concern.",
      quote: "\"Is this just a phase? Or should I be worried?\"",
    },
    {
      role: "Schools", emoji: "🏫", color: "text-lavender", bg: "bg-violet-50/50", border: "border-lavender/15",
      pain: "Want to invest in student wellbeing. But they don't want diagnosis camps or fear-based programs.",
      quote: "\"We care about our students. But we don't want to create panic.\"",
    },
  ];

  const whatWeSolve = [
    "Lack of structured early identification",
    "No common language between teachers and parents",
    "Escalation happening too late — problems snowball",
    "Random referrals without a proper system",
    "Classroom disruption due to unmanaged wellbeing issues",
  ];

  /* ── Human Lens: Program Components data ── */
  const components = [
    {
      number: "01", icon: Megaphone, title: "The Human Lens Awareness Talk",
      subtitle: "Delivered by Psychologist + Nutritionist", color: "text-brand",
      bg: "bg-brand-light/30", border: "border-brand/15",
      focusAreas: [
        "Behaviour is communication — decoding what children can't say",
        "Stress shows up through mind + body + behaviour together",
        "Age-wise red flags from 3 to 16 years",
        "The nutrition–emotion connection most people miss",
        "Board year burnout patterns & prevention",
        "What is observation vs. what is diagnosis",
      ],
    },
    {
      number: "02", icon: ClipboardList, title: "Teacher Identification Framework",
      subtitle: "Structured tools, not guesswork", color: "text-mint",
      bg: "bg-emerald-50/30", border: "border-mint/15",
      focusAreas: [
        "Structured observation checklist for daily use",
        "Age-wise red flag guide (3–16 years)",
        "Clear escalation framework with defined steps",
        "Classroom wellbeing strategies they can use immediately",
      ],
      principle: "Observation ≠ Diagnosis. Teachers learn to see, not to label.",
    },
    {
      number: "03", icon: Users, title: "Parent Awareness + Action Pathway",
      subtitle: "From clarity to next steps", color: "text-coral",
      bg: "bg-orange-50/30", border: "border-coral/15",
      focusAreas: [
        "QR-based questionnaire after the session",
        "Screening interest form for willing parents",
        "Community group (School + MHP) for ongoing support",
        "Structured follow-up communication",
      ],
      leadsTo: ["INSIGHT — 1-time comprehensive screening", "FLOURISH — 100-day transformation program"],
    },
    {
      number: "04", icon: MessageSquare, title: "1:1 Case Discussions",
      subtitle: "Where observation becomes action", color: "text-lavender",
      bg: "bg-violet-50/30", border: "border-lavender/15",
      focusAreas: [
        "Step A: Sit with teachers to discuss flagged students",
        "Step B: PTM-style meeting with parents — no panic",
        "Structured conversation framework",
        "Documented recommendations for each child",
      ],
    },
    {
      number: "05", icon: ShieldCheck, title: "Ethical Care Pathway",
      subtitle: "Consent-based. No force. No labelling.", color: "text-brand",
      bg: "bg-brand-light/30", border: "border-brand/15",
      isEthical: true,
      focusAreas: [],
      parentChoices: [
        { emoji: "🚪", label: "Exit", desc: "Choose not to proceed — fully respected" },
        { emoji: "💡", label: "Seek Clarity", desc: "Ask questions and understand better" },
        { emoji: "🔬", label: "Choose Screening", desc: "Opt into INSIGHT assessment" },
        { emoji: "🚀", label: "Move to Care", desc: "Join FLOURISH intervention program" },
      ],
    },
  ];

  /* ── Human Lens: School Gains data ── */
  const schoolGains = [
    { emoji: "📉", title: "Reduced Classroom Stress", desc: "Issues are caught and managed before they disrupt learning" },
    { emoji: "🤝", title: "Stronger Parent Trust", desc: "Parents see the school as proactive, not reactive or labelling" },
    { emoji: "📋", title: "Clear Escalation System", desc: "Every concern follows a structured, documented pathway" },
    { emoji: "🏥", title: "Health Partner Credibility", desc: "School is seen as a wellbeing-first institution" },
    { emoji: "🗺️", title: "Long-Term Wellbeing Roadmap", desc: "Opens doors to annual programs, compact centre, or flagship model" },
    { emoji: "🎓", title: "Teacher Empowerment", desc: "Staff feel supported and equipped — not burdened" },
  ];

  /* ── Section nav ── */
  const sections = [
    { id: "ht-problem", label: "The Problem", emoji: "🚨" },
    { id: "ht-components", label: "Program Components", emoji: "🔧" },
    { id: "ht-screening", label: "Eye & Dental", emoji: "🔬" },
    { id: "ht-gains", label: "School Gains", emoji: "🏫" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/schools" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Schools
          </Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-lavender/5 to-mint/5" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-brand/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-lavender/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
            <AnimatedSection animation="fade-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand/20 to-lavender/20 backdrop-blur-sm text-brand-dark px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-brand/20">
                <Sparkles className="w-4 h-4 text-brand" />
                School Wellbeing Partnership
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Supporting Teachers. Guiding Parents.{" "}
                <span className="text-gradient-hero">Helping Children Early.</span>
              </h1>
            </AnimatedSection>
            
            <AnimatedSection animation="fade-up" delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                A structured wellbeing partnership for schools focused on awareness, early observation, and support.
              </p>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={300}>
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow">
                👉 Plan a Health Talk
              </Button>
            </AnimatedSection>
          </div>
        </section>

        {/* SECTION NAV */}
        <div className="sticky top-[57px] z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold border border-brand/20 bg-brand/5 hover:bg-brand/10 text-foreground/80 hover:text-foreground transition-all"
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ THE PROBLEM (from Human Lens) ═══ */}
        <section id="ht-problem" className="py-16 lg:py-24 scroll-mt-28">
          <div className="container mx-auto px-4 max-w-5xl space-y-8">
            <AnimatedSection animation="fade-up">
              <SectionLabel>The Real Crisis in Schools Today</SectionLabel>
              <div className="rounded-2xl border border-amber-200/40 bg-amber-50/40 p-6 space-y-5">
                <p className="text-lg font-semibold text-foreground leading-relaxed">
                  Most schools operate in <span className="text-coral font-bold">reaction mode</span>, not early-identification mode. 
                  By the time a problem is visible, it has already been building for months.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {schoolProblems.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-4 rounded-xl bg-card/80 border border-amber-200/20">
                      <span className="text-xl shrink-0">{p.emoji}</span>
                      <span className="text-base text-foreground/80">{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Stakeholder Pain */}
            <AnimatedSection animation="fade-up" delay={100}>
              <SectionLabel>Everyone Sees It — No One Knows What to Do</SectionLabel>
              <div className="grid sm:grid-cols-3 gap-4">
                {stakeholderPains.map((s, i) => (
                  <div key={i} className={`rounded-2xl border ${s.border} ${s.bg} p-6 space-y-4`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{s.emoji}</span>
                      <span className={`text-base font-bold ${s.color}`}>{s.role}</span>
                    </div>
                    <p className="text-sm text-foreground/75 leading-relaxed">{s.pain}</p>
                    <div className="rounded-xl bg-card/60 border border-border/30 px-4 py-3">
                      <p className="text-sm italic text-muted-foreground">{s.quote}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* What This Program Solves */}
            <AnimatedSection animation="fade-up" delay={200}>
              <div className="rounded-2xl border border-mint/20 bg-emerald-50/30 p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-mint" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">This Program Creates a Bridge Between Observation and Action</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {whatWeSolve.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 rounded-xl bg-card/60 border border-mint/10">
                      <CheckCircle2 className="w-5 h-5 text-mint shrink-0 mt-0.5" />
                      <span className="text-base text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══ PROGRAM COMPONENTS (from Human Lens) ═══ */}
        <section id="ht-components" className="py-16 lg:py-24 bg-card scroll-mt-28">
          <div className="container mx-auto px-4 max-w-5xl space-y-6">
            <AnimatedSection animation="fade-up">
              <SectionLabel>Exact Program Components</SectionLabel>
              <p className="text-base text-muted-foreground mb-6">
                Five connected components — each building on the previous one.
              </p>

              <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
                {components.map((c, i) => {
                  const isOpen = expandedComponent === i;
                  return (
                    <div key={i} className={`${isOpen ? c.bg : "bg-card"} transition-colors`}>
                      <button
                        onClick={() => setExpandedComponent(isOpen ? null : i)}
                        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-muted/30 transition-colors"
                      >
                        <span className={`text-xl font-extrabold ${c.color} opacity-30 w-8 shrink-0`}>{c.number}</span>
                        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                          <c.icon className={`w-5 h-5 ${c.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-foreground truncate">{c.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{c.subtitle}</p>
                        </div>
                        <ArrowRight className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          {c.isEthical ? (
                            <div>
                              <p className="text-sm text-foreground/75 mb-4">Parents can choose any path — every option is respected:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {c.parentChoices?.map((choice, j) => (
                                  <div key={j} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-card/70 border border-border/30">
                                    <span className="text-2xl">{choice.emoji}</span>
                                    <span className="text-sm font-bold text-foreground">{choice.label}</span>
                                    <span className="text-xs text-muted-foreground leading-snug">{choice.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid sm:grid-cols-2 gap-2">
                                {c.focusAreas.map((item, j) => (
                                  <div key={j} className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-card/60 border border-border/20">
                                    <CheckCircle2 className={`w-4 h-4 ${c.color} opacity-50 shrink-0 mt-0.5`} />
                                    <span className="text-sm text-foreground/75">{item}</span>
                                  </div>
                                ))}
                              </div>
                              {c.principle && (
                                <p className="text-sm text-muted-foreground italic px-3 pt-1">
                                  <Lightbulb className="w-4 h-4 text-amber-500 inline mr-1.5 -mt-0.5" />
                                  {c.principle}
                                </p>
                              )}
                              {c.leadsTo && (
                                <div className="flex flex-wrap gap-2.5 px-3 pt-2">
                                  {c.leadsTo.map((item, j) => (
                                    <span key={j} className={`text-xs font-medium ${c.bg} border ${c.border} rounded-full px-4 py-1.5 text-foreground/70`}>
                                      → {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>

            {/* Program Flow Visualization */}
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="rounded-2xl border border-border bg-muted/20 p-6">
                <SectionLabel>The Complete Flow</SectionLabel>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-0">
                  {[
                    { label: "Awareness Talk", emoji: "🎤", sub: "Educate" },
                    { label: "Teacher Framework", emoji: "📋", sub: "Equip" },
                    { label: "Parent Pathway", emoji: "👨‍👩‍👧", sub: "Engage" },
                    { label: "Case Discussions", emoji: "💬", sub: "Identify" },
                    { label: "Ethical Care", emoji: "🛡️", sub: "Support" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center text-center gap-2 px-4 py-4 rounded-xl bg-card border border-border min-w-[110px]">
                        <span className="text-2xl">{step.emoji}</span>
                        <span className="text-sm font-bold text-foreground leading-tight">{step.label}</span>
                        <span className="text-xs text-muted-foreground">{step.sub}</span>
                      </div>
                      {i < 4 && <ArrowRight className="w-4 h-4 text-border hidden sm:block mx-1 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══ EYE & DENTAL SCREENING ═══ */}
        <section id="ht-screening" className="py-16 lg:py-24 scroll-mt-28">
          <div className="container mx-auto px-4 max-w-5xl space-y-6">
            <AnimatedSection animation="fade-up">
              <SectionLabel>Also Available: Eye & Dental Screening</SectionLabel>
              <p className="text-base text-muted-foreground mb-6">
                Alongside the Human Lens program, schools can also opt for structured Eye & Dental screening camps for all students.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-lavender/20 bg-violet-50/50 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-lavender/10 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-lavender" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground">Eye Screening</h4>
                      <span className="text-sm text-muted-foreground">For all students</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Visual acuity assessment", "Early detection of refractive errors", "Colour vision screening", "Referral for corrective action"].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/75">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-lavender/20 bg-violet-50/50 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-lavender/10 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-lavender" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground">Dental Screening</h4>
                      <span className="text-sm text-muted-foreground">For all students</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Oral hygiene assessment", "Cavity & decay identification", "Gum health evaluation", "Referral for dental treatment"].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/75">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100}>
              <div className="rounded-xl bg-violet-50/40 border border-lavender/10 p-4">
                <p className="text-base text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Note:</strong> Eye & Dental screening is part of MHP's Awareness & Screening Program and can be added to the Health Workshop engagement. Schools gain actionable health data alongside the wellbeing framework.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══ SCHOOL GAINS (from Human Lens) ═══ */}
        <section id="ht-gains" className="py-16 lg:py-24 bg-card scroll-mt-28">
          <div className="container mx-auto px-4 max-w-5xl">
            <AnimatedSection animation="fade-up">
              <SectionLabel>What Your School Walks Away With</SectionLabel>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schoolGains.map((g, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                    <span className="text-3xl">{g.emoji}</span>
                    <h4 className="text-base font-bold text-foreground">{g.title}</h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>


        {/* CTA */}
        <section className="py-20 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-lavender/5 to-mint/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lavender/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <AnimatedSection animation="fade-up">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                  Ready to Start With Health Talks?
                </h2>
                <p className="text-lg text-muted-foreground mb-10">
                  Preventive. Ethical. Supportive.<br />
                  School leaders feel safe, protected, and confident.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow">
                    👉 Plan a Health Talk for Your School
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl">
                    Discuss Options
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-8 italic">
                  Complete clarity on roles, boundaries, and outcomes.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HealthTalksPage;

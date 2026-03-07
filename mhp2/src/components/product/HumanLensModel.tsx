import { useState, useRef } from "react";
import {
  Brain,
  Stethoscope,
  CheckCircle2,
  GraduationCap,
  Users,
  Heart,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Target,
  TrendingUp,
  XCircle,
  Lightbulb,
  ClipboardList,
  UserCheck,
  HandHeart,
  Megaphone,
  ScanSearch,
} from "lucide-react";

/* ─── Shared helpers ─── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{children}</p>
);

const StatCard = ({ emoji, value, label }: { emoji: string; value: string; label: string }) => (
  <div className="flex flex-col items-center text-center gap-1.5 p-5 rounded-2xl bg-amber-50/80 border border-amber-200/30">
    <span className="text-2xl">{emoji}</span>
    <span className="text-xl font-extrabold text-foreground">{value}</span>
    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
  </div>
);

const HumanLensModel = () => {
  const [expandedComponent, setExpandedComponent] = useState<number | null>(null);
  /* ── Section 1: The Problem ── */
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
      role: "Teachers",
      emoji: "👩‍🏫",
      color: "text-brand",
      bg: "bg-brand-light/50",
      border: "border-brand/15",
      pain: "Notice changes in students daily. But they don't have a structured framework to act on what they see.",
      quote: "\"I can see something is wrong. But what do I do about it?\"",
    },
    {
      role: "Parents",
      emoji: "👨‍👩‍👧",
      color: "text-coral",
      bg: "bg-orange-50/50",
      border: "border-coral/15",
      pain: "Sense something is off at home. But they can't tell what's normal development vs a real concern.",
      quote: "\"Is this just a phase? Or should I be worried?\"",
    },
    {
      role: "Schools",
      emoji: "🏫",
      color: "text-lavender",
      bg: "bg-violet-50/50",
      border: "border-lavender/15",
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

  /* ── Section 2: Outcomes ── */
  const outcomes = [
    {
      emoji: "🎯",
      title: "Clarity for Teachers",
      color: "text-brand",
      bg: "bg-brand-light/40",
      border: "border-brand/15",
      points: ["What to observe in each age group", "What is a genuine red flag", "What is normal development", "When and how to escalate"],
    },
    {
      emoji: "📉",
      title: "Reduced Classroom Disruption",
      color: "text-mint",
      bg: "bg-emerald-50/40",
      border: "border-mint/15",
      points: ["Prevent emotional overload before it peaks", "Catch academic dips at their source", "Stop behaviour escalation early", "Early indicators — not diagnosis"],
    },
    {
      emoji: "🔗",
      title: "Structured Referral Pathway",
      color: "text-coral",
      bg: "bg-orange-50/40",
      border: "border-coral/15",
      points: ["Health Talk → Identification → Screening → Care", "Organised, ethical, professional process", "No random counselling suggestions", "Every step is documented"],
    },
    {
      emoji: "🤝",
      title: "Stronger Parent Trust",
      color: "text-lavender",
      bg: "bg-violet-50/40",
      border: "border-lavender/15",
      points: ["Parents feel: \"I understand my child better\"", "Not: \"The school is labelling my child\"", "Collaborative approach to child wellbeing", "Transparent & consent-driven process"],
    },
  ];

  /* ── Section 3: Program Components ── */
  const components = [
    {
      number: "01",
      icon: Megaphone,
      title: "The Human Lens Awareness Talk",
      subtitle: "Delivered by Psychologist + Nutritionist",
      color: "text-brand",
      bg: "bg-brand-light/30",
      border: "border-brand/15",
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
      number: "02",
      icon: ClipboardList,
      title: "Teacher Identification Framework",
      subtitle: "Structured tools, not guesswork",
      color: "text-mint",
      bg: "bg-emerald-50/30",
      border: "border-mint/15",
      focusAreas: [
        "Structured observation checklist for daily use",
        "Age-wise red flag guide (3–16 years)",
        "Clear escalation framework with defined steps",
        "Classroom wellbeing strategies they can use immediately",
      ],
      principle: "Observation ≠ Diagnosis. Teachers learn to see, not to label.",
    },
    {
      number: "03",
      icon: Users,
      title: "Parent Awareness + Action Pathway",
      subtitle: "From clarity to next steps",
      color: "text-coral",
      bg: "bg-orange-50/30",
      border: "border-coral/15",
      focusAreas: [
        "QR-based questionnaire after the session",
        "Screening interest form for willing parents",
        "Community group (School + MHP) for ongoing support",
        "Structured follow-up communication",
      ],
      leadsTo: ["INSIGHT — 1-time comprehensive screening", "FLOURISH — 100-day transformation program"],
    },
    {
      number: "04",
      icon: MessageSquare,
      title: "1:1 Case Discussions",
      subtitle: "Where observation becomes action",
      color: "text-lavender",
      bg: "bg-violet-50/30",
      border: "border-lavender/15",
      focusAreas: [
        "Step A: Sit with teachers to discuss flagged students",
        "Step B: PTM-style meeting with parents — no panic",
        "Structured conversation framework",
        "Documented recommendations for each child",
      ],
    },
    {
      number: "05",
      icon: ShieldCheck,
      title: "Ethical Care Pathway",
      subtitle: "Consent-based. No force. No labelling.",
      color: "text-brand",
      bg: "bg-brand-light/30",
      border: "border-brand/15",
      isEthical: true,
      parentChoices: [
        { emoji: "🚪", label: "Exit", desc: "Choose not to proceed — fully respected" },
        { emoji: "💡", label: "Seek Clarity", desc: "Ask questions and understand better" },
        { emoji: "🔬", label: "Choose Screening", desc: "Opt into INSIGHT assessment" },
        { emoji: "🚀", label: "Move to Care", desc: "Join FLOURISH intervention program" },
      ],
    },
  ];

  /* ── Section 4: What School Gains ── */
  const schoolGains = [
    { emoji: "📉", title: "Reduced Classroom Stress", desc: "Issues are caught and managed before they disrupt learning" },
    { emoji: "🤝", title: "Stronger Parent Trust", desc: "Parents see the school as proactive, not reactive or labelling" },
    { emoji: "📋", title: "Clear Escalation System", desc: "Every concern follows a structured, documented pathway" },
    { emoji: "🏥", title: "Health Partner Credibility", desc: "School is seen as a wellbeing-first institution" },
    { emoji: "🗺️", title: "Long-Term Wellbeing Roadmap", desc: "Opens doors to annual programs, compact centre, or flagship model" },
    { emoji: "🎓", title: "Teacher Empowerment", desc: "Staff feel supported and equipped — not burdened" },
  ];


  const sections = [
    { id: "hl-problem", label: "The Problem", emoji: "🚨" },
    { id: "hl-outcomes", label: "Outcomes", emoji: "🎯" },
    { id: "hl-components", label: "Program Components", emoji: "🔧" },
    { id: "hl-gains", label: "School Gains", emoji: "🏫" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-10">
      {/* ═══ SECTION NAV ═══ */}
      <div className="sticky top-0 z-20 -mx-8 sm:-mx-10 px-8 sm:px-10 py-3 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex flex-wrap gap-2 justify-center">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold border border-amber-200/40 bg-amber-50/60 hover:bg-amber-100/80 text-foreground/80 hover:text-foreground transition-all"
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 1: THE PROBLEM ═══ */}
      <div id="hl-problem" className="scroll-mt-20">
        <SectionLabel>The Real Crisis in Schools Today</SectionLabel>
        <div className="rounded-2xl border border-amber-200/40 bg-amber-50/40 p-6 space-y-5">
          <p className="text-base font-semibold text-foreground leading-relaxed">
            Most schools operate in <span className="text-coral font-bold">reaction mode</span>, not early-identification mode. 
            By the time a problem is visible, it has already been building for months.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-2.5">
            {schoolProblems.map((p, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-card/80 border border-amber-200/20">
                <span className="text-lg shrink-0">{p.emoji}</span>
                <span className="text-sm text-foreground/80">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stakeholder Pain */}
      <div>
        <SectionLabel>Everyone Sees It — No One Knows What to Do</SectionLabel>
        <div className="grid sm:grid-cols-3 gap-4">
          {stakeholderPains.map((s, i) => (
            <div key={i} className={`rounded-2xl border ${s.border} ${s.bg} p-5 space-y-3`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{s.emoji}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.role}</span>
              </div>
              <p className="text-[13px] text-foreground/75 leading-relaxed">{s.pain}</p>
              <div className="rounded-xl bg-card/60 border border-border/30 px-4 py-3">
                <p className="text-[13px] italic text-muted-foreground">{s.quote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What This Program Solves */}
      <div className="rounded-2xl border border-mint/20 bg-emerald-50/30 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-mint" />
          </div>
          <h3 className="text-base font-bold text-foreground">This Program Creates a Bridge Between Observation and Action</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {whatWeSolve.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-card/60 border border-mint/10">
              <CheckCircle2 className="w-4 h-4 text-mint shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 2: OUTCOMES ═══ */}
      <div id="hl-outcomes" className="pt-4 border-t border-border/50 scroll-mt-20">
        <SectionLabel>What Your School Should Expect After This Program</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          {outcomes.map((o, i) => (
            <div key={i} className={`rounded-2xl border ${o.border} ${o.bg} p-5 space-y-3`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{o.emoji}</span>
                <h4 className={`text-sm font-bold ${o.color}`}>{o.title}</h4>
              </div>
              <ul className="space-y-2">
                {o.points.map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${o.color} opacity-40 shrink-0 mt-0.5`} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Long-term gateway */}
        <div className="mt-4 rounded-2xl border border-brand/15 bg-brand-light/30 p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Long-Term Health Partnership Entry</h4>
              <p className="text-[13px] text-foreground/70 leading-relaxed mb-3">
                This program is the gateway that opens a lasting relationship — not just a one-time event.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Annual screening programs", "Teacher wellbeing programs", "Compact Health Centre", "Flagship Health Buddy Centre"].map((item, i) => (
                  <span key={i} className="text-[11px] font-medium bg-card/70 border border-brand/10 rounded-full px-3 py-1 text-foreground/70">
                    → {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: PROGRAM COMPONENTS ═══ */}
      <div id="hl-components" className="pt-4 border-t border-border/50 scroll-mt-20">
        <SectionLabel>Exact Program Components</SectionLabel>
        <p className="text-sm text-muted-foreground mb-5">
          Five connected components — each building on the previous one.
        </p>

        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {components.map((c, i) => {
            const isOpen = expandedComponent === i;
            return (
              <div key={i} className={`${isOpen ? c.bg : "bg-card"} transition-colors`}>
                {/* Compact header row */}
                <button
                  onClick={() => setExpandedComponent(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className={`text-lg font-extrabold ${c.color} opacity-30 w-7 shrink-0`}>{c.number}</span>
                  <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{c.title}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{c.subtitle}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                </button>

                {/* Expandable detail */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {c.isEthical ? (
                      <div>
                        <p className="text-[13px] text-foreground/75 mb-3">Parents can choose any path — every option is respected:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {c.parentChoices?.map((choice, j) => (
                            <div key={j} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-card/70 border border-border/30">
                              <span className="text-xl">{choice.emoji}</span>
                              <span className="text-[12px] font-bold text-foreground">{choice.label}</span>
                              <span className="text-[10px] text-muted-foreground leading-snug">{choice.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {c.focusAreas.map((item, j) => (
                            <div key={j} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-card/60 border border-border/20">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${c.color} opacity-50 shrink-0 mt-0.5`} />
                              <span className="text-[12px] text-foreground/75">{item}</span>
                            </div>
                          ))}
                        </div>
                        {c.principle && (
                          <p className="text-[12px] text-muted-foreground italic px-3 pt-1">
                            <Lightbulb className="w-3 h-3 text-amber-500 inline mr-1 -mt-0.5" />
                            {c.principle}
                          </p>
                        )}
                        {c.leadsTo && (
                          <div className="flex flex-wrap gap-2 px-3 pt-1">
                            {c.leadsTo.map((item, j) => (
                              <span key={j} className={`text-[11px] font-medium ${c.bg} border ${c.border} rounded-full px-3 py-1 text-foreground/70`}>
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
      </div>

      {/* ── Program Flow Visualization ── */}
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
              <div className="flex flex-col items-center text-center gap-1.5 px-3 py-3 rounded-xl bg-card border border-border min-w-[100px]">
                <span className="text-xl">{step.emoji}</span>
                <span className="text-[11px] font-bold text-foreground leading-tight">{step.label}</span>
                <span className="text-[10px] text-muted-foreground">{step.sub}</span>
              </div>
              {i < 4 && <ArrowRight className="w-4 h-4 text-border hidden sm:block mx-1 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 4: WHAT SCHOOL GAINS ═══ */}
      <div id="hl-gains" className="pt-4 border-t border-border/50 scroll-mt-20">
        <SectionLabel>What Your School Walks Away With</SectionLabel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {schoolGains.map((g, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <span className="text-2xl">{g.emoji}</span>
              <h4 className="text-sm font-bold text-foreground">{g.title}</h4>
              <p className="text-[13px] text-foreground/70 leading-snug">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HumanLensModel;

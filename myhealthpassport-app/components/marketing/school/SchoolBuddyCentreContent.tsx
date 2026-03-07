'use client';
import { useState } from "react";
import {
  Brain,
  Eye,
  Stethoscope,
  Shield,
  CheckCircle2,
  GraduationCap,
  Users,
  Heart,
  BookOpen,
  MessageSquare,
  Building,
  Clock,
  CalendarDays,
  BarChart3,
  IndianRupee,
  ArrowRight,
  ChevronDown,
  Activity,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";

const SchoolBuddyCentreContent = () => {
  const [openStage, setOpenStage] = useState<number | null>(null);

  const pillars = [
    { icon: Brain, label: "Psychology", desc: "Emotional & behavioural", color: "text-brand", bg: "bg-brand-light" },
    { icon: Stethoscope, label: "Nutrition", desc: "Growth & dietary", color: "text-mint", bg: "bg-emerald-50" },
    { icon: Activity, label: "Physical", desc: "Physical screening", color: "text-coral", bg: "bg-orange-50" },
    { icon: Eye, label: "Vision", desc: "Eye screening", color: "text-lavender", bg: "bg-violet-50" },
    { icon: Shield, label: "Dental", desc: "Oral health", color: "text-foreground/70", bg: "bg-muted/50" },
  ];

  const studentStages = [
    {
      stage: "Nursery – UKG",
      ages: "Ages 3–5",
      color: "text-brand",
      border: "border-brand/15",
      bg: "bg-brand-light/30",
      psychology: ["Excessive crying or separation anxiety", "Freezing, silence or fear responses", "Hitting, biting during emotional overload", "Limited communication or play engagement"],
      nutrition: ["Poor or very selective eating patterns", "Low energy or frequent tiredness", "Digestive discomfort (reflux, constipation)", "Sensory aversion to food textures"],
      keyMessage: "Behaviour is communication. Sensory sensitivity affects both eating and emotions.",
    },
    {
      stage: "Class 1–5",
      ages: "Ages 6–10",
      color: "text-mint",
      border: "border-mint/15",
      bg: "bg-emerald-50/40",
      psychology: ["School-related anxiety & fear of mistakes", "Task avoidance despite clear ability", "Restlessness, impulsivity or mood shifts", "Reduced concentration & mental fatigue"],
      nutrition: ["Skipped meals or poor breakfast habits", "Energy crashes during school hours", "Headaches, stomach aches & low stamina", "High reliance on sugary or packaged foods"],
      keyMessage: "Inconsistent nutrition often affects focus and emotional tolerance at this age.",
    },
    {
      stage: "Class 6–8",
      ages: "Ages 11–13",
      color: "text-coral",
      border: "border-coral/15",
      bg: "bg-orange-50/40",
      psychology: ["Mood swings & sensitivity to criticism", "Withdrawal, defiance or risk-taking", "Reduced interest in studies or hobbies", "Excessive screen use & peer pressure"],
      nutrition: ["Skipping meals or avoiding family meals", "Increased junk food & sugary drinks", "Fatigue despite adequate sleep", "Frequent headaches or low stamina"],
      keyMessage: "Growth, hormones, and nutrition strongly influence emotions during pre-teen years.",
    },
    {
      stage: "Class 9–12",
      ages: "Ages 14–16+",
      color: "text-lavender",
      border: "border-lavender/15",
      bg: "bg-violet-50/40",
      psychology: ["Chronic stress, anxiety or emotional shutdown", "Perfectionism or complete disengagement", "Social withdrawal & fear of failure", "Exam avoidance & burnout signs"],
      nutrition: ["Skipped meals due to study pressure", "Excess caffeine, sugar & packaged foods", "Rigid eating rules or loss-of-control snacking", "Sleep disruption & digestive issues"],
      keyMessage: "Studying longer cannot replace proper fueling. Under-fueling increases burnout.",
    },
  ];

  const teacherCurriculum = [
    {
      icon: BookOpen,
      title: "Classroom & Student Support",
      color: "text-brand",
      bg: "bg-brand-light/40",
      border: "border-brand/10",
      modules: [
        { name: "Behaviour as Communication", desc: "Recognising early signs of emotional distress & de-escalation tools" },
        { name: "Emotional Regulation", desc: "Helping students calm their nervous system & building emotional vocabulary" },
        { name: "Attention & Learning", desc: "Supporting slow processors, enhancing task engagement & reducing distractions" },
        { name: "Supporting At-Risk Students", desc: "Anxiety, perfectionism, withdrawal & spotting academic stress early" },
      ],
    },
    {
      icon: GraduationCap,
      title: "Professional Teaching Skills",
      color: "text-mint",
      bg: "bg-emerald-50/40",
      border: "border-mint/10",
      modules: [
        { name: "Effective Classroom Routines", desc: "Predictable structures, energy-based scheduling & smooth transitions" },
        { name: "Parent Communication", desc: "Sharing concerns without blame & building collaborative action plans" },
        { name: "Diverse Learners", desc: "Neurodiversity basics, adapting tasks & gentle scaffolding for struggling students" },
        { name: "Inclusion Practices", desc: "Creating belonging, reducing bias & adapting environments for every student" },
      ],
    },
    {
      icon: Heart,
      title: "Teacher Wellbeing & Health",
      color: "text-coral",
      bg: "bg-orange-50/40",
      border: "border-coral/10",
      modules: [
        { name: "Energy & Stress Management", desc: "Quick regulation tools, avoiding energy crashes & healthy routines" },
        { name: "Burnout Prevention", desc: "Identifying early signs, emotional boundaries & recovery micro-practices" },
        { name: "The Food–Mind Connection", desc: "Blood sugar stability, mood chemicals & the brain-gut axis for teachers" },
        { name: "Recovery & Circadian Rhythm", desc: "Sleep-supportive nutrition & the work-to-home bridge routine" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Screening Domains */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Screening Domains</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {pillars.map((p, i) => (
            <div key={i} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${p.bg} border border-border/50 text-center`}>
              <div className="w-11 h-11 rounded-xl bg-card shadow-sm flex items-center justify-center">
                <p.icon className={`w-5 h-5 ${p.color}`} />
              </div>
              <span className="text-sm font-bold text-foreground">{p.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Student Curriculum — Collapsible */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Student Curriculum</p>
        <p className="text-sm text-muted-foreground mb-5">
          Age-appropriate awareness connecting emotional, behavioural & nutritional red flags — helping teachers and parents identify early.
        </p>

        <div className="space-y-3">
          {studentStages.map((stage, i) => {
            const isOpen = openStage === i;
            return (
              <Collapsible key={i} open={isOpen} onOpenChange={() => setOpenStage(isOpen ? null : i)}>
                <CollapsibleTrigger className="w-full">
                  <div className={`flex items-center justify-between rounded-2xl border ${stage.border} ${stage.bg} px-5 py-4 cursor-pointer transition-all hover:shadow-sm`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold ${stage.color}`}>{stage.stage}</span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-background/60 rounded-full px-2.5 py-0.5">{stage.ages}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={`rounded-b-2xl border border-t-0 ${stage.border} overflow-hidden -mt-2`}>
                    {/* Two-column: Psychology + Nutrition */}
                    <div className="grid sm:grid-cols-2 gap-px bg-border/30">
                      <div className="bg-card/60 px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-4 h-4 text-brand" />
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Psychology Signs</span>
                        </div>
                        <ul className="space-y-2">
                          {stage.psychology.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand/40 shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-card/60 px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Stethoscope className="w-4 h-4 text-mint" />
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Nutrition Signs</span>
                        </div>
                        <ul className="space-y-2">
                          {stage.nutrition.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                              <CheckCircle2 className="w-3.5 h-3.5 text-mint/40 shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {/* Key message */}
                    <div className="px-5 py-3 bg-background/40 border-t border-border/20">
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Key insight:</strong> {stage.keyMessage}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Teacher Curriculum */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Teacher Curriculum</p>
        <p className="text-sm text-muted-foreground mb-5">
          Integrated psychology & nutrition training — equipping teachers with classroom tools, professional skills, and personal wellbeing support.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {teacherCurriculum.map((block, i) => (
            <div key={i} className={`rounded-2xl border ${block.border} ${block.bg} p-5 space-y-4`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-card shadow-sm flex items-center justify-center">
                  <block.icon className={`w-5 h-5 ${block.color}`} />
                </div>
                <span className="text-sm font-bold text-foreground">{block.title}</span>
              </div>
              <div className="space-y-3">
                {block.modules.map((mod, j) => (
                  <div key={j} className="rounded-xl bg-card/70 border border-border/30 px-4 py-3">
                    <p className="text-[13px] font-semibold text-foreground mb-0.5">{mod.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{mod.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Curriculum */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Parent Curriculum</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Brain, title: "Psychology Workshops", points: ["Reading emotional cues at home", "Supporting without labelling or over-reacting", "Building resilience through routine & connection"], color: "text-lavender", bg: "bg-violet-50/40", border: "border-lavender/10" },
            { icon: Stethoscope, title: "Nutrition Workshops", points: ["Balanced lunchbox planning & meal routines", "Label reading, portion control & reducing junk food", "Cooking with children & consistent meal habits"], color: "text-mint", bg: "bg-emerald-50/40", border: "border-mint/10" },
          ].map((block, i) => (
            <div key={i} className={`rounded-2xl border ${block.border} ${block.bg} p-5 space-y-3`}>
              <div className="flex items-center gap-2.5">
                <block.icon className={`w-5 h-5 ${block.color}`} />
                <span className="text-sm font-bold text-foreground">{block.title}</span>
              </div>
              <ul className="space-y-2">
                {block.points.map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${block.color} opacity-40 shrink-0 mt-0.5`} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Program Operations */}
      <div className="pt-4 border-t border-border/50">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Program Operations</p>
        <p className="text-sm text-muted-foreground mb-6">
          Everything a school needs to know — from daily schedules to annual timelines.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-brand/10 bg-brand-light/30 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-card shadow-sm flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand" />
              </div>
              <span className="text-sm font-bold text-foreground">Specialist Presence</span>
            </div>
            <div className="space-y-2.5">
              {[
                { role: "Psychologist", detail: "5 days/week · Full school hours" },
                { role: "Nutritionist", detail: "5 days/week · Full school hours" },
                { role: "Eye Screening", detail: "Annual camp · Full-day" },
                { role: "Dental Screening", detail: "Annual camp · Full-day" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-card/70 border border-border/30 px-4 py-2.5">
                  <span className="text-[13px] font-semibold text-foreground">{r.role}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{r.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-mint/10 bg-emerald-50/40 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-card shadow-sm flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-mint" />
              </div>
              <span className="text-sm font-bold text-foreground">Assessment Structure</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Frequency", value: "Once per year (all students)" },
                { label: "Batch Size", value: "5 students per batch" },
                { label: "Duration", value: "30–45 min per assessment" },
                { label: "Daily Capacity", value: "~25 students per day" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-card/70 border border-border/30 px-4 py-2.5">
                  <span className="text-[13px] font-semibold text-foreground">{r.label}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions & Engagement */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-lavender/10 bg-violet-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-lavender" />
              <span className="text-sm font-bold text-foreground">Student Sessions</span>
            </div>
            <ul className="space-y-2">
              {["3 sessions per day", "~20 sessions per month", "1–2 classes covered monthly", "Age-appropriate curriculum"].map((p, j) => (
                <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lavender/40 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-coral/10 bg-orange-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-coral" />
              <span className="text-sm font-bold text-foreground">Teacher Training</span>
            </div>
            <ul className="space-y-2">
              {["Once a month (offline)", "Auditorium-based sessions", "Psychology + Nutrition modules", "Red-flag identification tools"].map((p, j) => (
                <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                  <CheckCircle2 className="w-3.5 h-3.5 text-coral/40 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-brand/10 bg-brand-light/30 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-brand" />
              <span className="text-sm font-bold text-foreground">Parent Engagement</span>
            </div>
            <ul className="space-y-2">
              {["2 workshops per year (offline)", "Pre-assessment: consent & orientation", "Post-assessment: report walkthrough", "Consultations included; therapy extra"].map((p, j) => (
                <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand/40 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* School Requirements */}
        <div className="rounded-2xl border border-border bg-muted/30 p-5 mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-card shadow-sm flex items-center justify-center">
              <Building className="w-5 h-5 text-foreground/70" />
            </div>
            <span className="text-sm font-bold text-foreground">What the School Provides</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Space", detail: "Minimum 700 sq ft room" },
              { label: "Setup", detail: "MHP designs & furnishes the Buddy Centre" },
              { label: "Coordination", detail: "School assigns a coordinator to liaise with MHP" },
            ].map((r, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/40 px-4 py-3 text-center">
                <p className="text-[13px] font-semibold text-foreground mb-0.5">{r.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reports & Pricing */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-mint/10 bg-emerald-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-mint" />
              <span className="text-sm font-bold text-foreground">Reports & Communication</span>
            </div>
            <ul className="space-y-2">
              {[
                "Individual child health report (My Health Passport)",
                "Delivered via WhatsApp & online MHP Dashboard",
                "Progress report at final parent-teacher meeting",
                "School-level summary with improvement metrics",
              ].map((p, j) => (
                <li key={j} className="flex items-start gap-2 text-[13px] text-foreground/75">
                  <CheckCircle2 className="w-3.5 h-3.5 text-mint/40 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-lavender/10 bg-violet-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <IndianRupee className="w-5 h-5 text-lavender" />
              <span className="text-sm font-bold text-foreground">Investment</span>
            </div>
            <div className="rounded-xl bg-card/70 border border-border/30 px-4 py-3 mb-3">
              <p className="text-[13px] text-foreground/80 leading-relaxed">
                <strong className="text-foreground">₹1,350 – ₹1,800</strong> per student (cost) · Sale price <strong className="text-foreground">₹2,000 – ₹3,000</strong> per student/year.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Includes all assessments, screenings, curriculum sessions, parent workshops & full My Health Passport. Therapy plans billed separately.
            </p>
          </div>
        </div>

        {/* Annual Program Timeline */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Annual Program Timeline</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-0">
            {[
              { step: "1", label: "Onboard School", emoji: "🏫" },
              { step: "2", label: "Teacher Training", emoji: "👩‍🏫" },
              { step: "3", label: "Parent Consent", emoji: "✅" },
              { step: "4", label: "Assessments", emoji: "📋" },
              { step: "5", label: "Report Delivery", emoji: "📊" },
              { step: "6", label: "Parent Meeting", emoji: "👨‍👩‍👧" },
            ].map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center text-center gap-1.5 px-3 py-3 rounded-xl bg-brand-light/40 border border-brand/10 min-w-[100px]">
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-[10px] font-bold text-brand">Step {s.step}</span>
                  <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
                </div>
                {i < 5 && <ArrowRight className="w-4 h-4 text-brand/20 hidden sm:block mx-1 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What we deliver */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">What We Deliver</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Year-round specialist presence on campus",
            "Integrated health reports for every child",
            "Parent discussions & walkthrough of findings",
            "In-school consultations for flagged concerns",
            "Student curriculum — nutrition & psychology",
            "Teacher curriculum & classroom handling training",
            "Allied specialists available on-demand",
            "Escalation pathway to flagship centre",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-brand-light/50 border border-brand/10">
              <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolBuddyCentreContent;

'use client';

import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  AlertTriangle, Brain, Apple, Users, GraduationCap, HeartPulse,
  TrendingDown, Eye, ShieldAlert, Lightbulb, CheckCircle2,
  ArrowRight, Frown, BatteryLow, Angry, CircleOff, HelpCircle,
  UserX, BookOpen, Utensils, Scale, Flame, Clock
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import Link from "next/link";

const SchoolPitchPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* HERO — The Wake-Up Call */}
        <section className="relative pt-24 pb-20 overflow-hidden bg-foreground text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-coral rounded-full blur-[120px]" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <AnimatedSection animation="fade-up">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-destructive/20 text-destructive-foreground px-5 py-2 rounded-full mb-8 border border-destructive/30">
                  <AlertTriangle className="w-5 h-5 text-coral" />
                  <span className="font-display font-bold text-sm tracking-wide uppercase">The Silent Crisis in Your School</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-extrabold leading-tight mb-8">
                  Your Students Are
                  <span className="block text-coral mt-2">Struggling Right Now.</span>
                </h1>
                <p className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-6">
                  1 in 5 children face mental health challenges. 1 in 3 have nutritional gaps.
                  Most go <span className="text-white font-bold">unnoticed until it&apos;s too late.</span>
                </p>
                <p className="text-lg text-white/50 max-w-2xl mx-auto">
                  Teachers see the symptoms. Parents don&apos;t know the cause.
                  Children can&apos;t articulate what&apos;s wrong.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* SECTION 1 — What's Happening in Your Classrooms */}
        <section className="py-20 sm:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-6">
                  What&apos;s Really Happening <br />
                  <span className="text-coral">Inside Your Classrooms?</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  These aren&apos;t bad kids. These aren&apos;t lazy students. They&apos;re children whose bodies and minds are crying for help.
                </p>
              </div>
            </AnimatedSection>

            {/* Student struggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {studentStruggles.map((item, i) => (
                <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                  <div className="group relative bg-card rounded-2xl p-6 border border-border hover:border-coral/40 transition-all duration-300 hover:shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center mb-4 group-hover:bg-coral/20 transition-colors">
                      <item.icon className="w-6 h-6 text-coral" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            {/* Bold stat bar */}
            <AnimatedSection animation="scale">
              <div className="bg-foreground rounded-2xl p-8 sm:p-10 text-white text-center">
                <p className="text-2xl sm:text-3xl font-display font-extrabold mb-3">
                  &quot;These children sit in <span className="text-coral">your classrooms every day</span> — and nobody is connecting the dots.&quot;
                </p>
                <p className="text-white/60 text-lg">Until now.</p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* SECTION 2 — Teachers Are Overwhelmed */}
        <section className="py-20 sm:py-28 bg-secondary/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection animation="slide-left">
                <div>
                  <div className="inline-flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full mb-6">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary uppercase tracking-wide">The Teacher&apos;s Dilemma</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground mb-6">
                    Your Teachers <span className="text-primary">See It Every Day.</span><br />
                    But They&apos;re Not Trained to Fix It.
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Teachers notice the child who can&apos;t focus, the one who cries at lunch, the aggressive one, the silent one.
                    But they&apos;re <span className="font-bold text-foreground">educators, not therapists.</span> They shouldn&apos;t have to guess what&apos;s wrong.
                  </p>
                  <div className="space-y-4">
                    {teacherPains.map((pain, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CircleOff className="w-4 h-4 text-destructive" />
                        </div>
                        <p className="text-foreground font-medium">{pain}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="slide-right">
                <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
                  <h3 className="font-display font-bold text-xl text-foreground mb-6 flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    What Teachers Tell Us
                  </h3>
                  <div className="space-y-5">
                    {teacherQuotes.map((quote, i) => (
                      <div key={i} className="border-l-4 border-primary/30 pl-4 py-1">
                        <p className="text-muted-foreground italic text-sm">&quot;{quote}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Parents Are Unaware */}
        <section className="py-20 sm:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-sunshine/20 px-4 py-2 rounded-full mb-6">
                  <Users className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-bold text-foreground uppercase tracking-wide">The Parenting Blind Spot</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-6">
                  Parents Love Their Kids. <br />
                  <span className="text-coral">But Love Isn&apos;t Enough.</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Most parents attribute behavioral and health issues to &quot;just a phase.&quot; By the time they act,
                  the damage is already compounding.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {parentBlindSpots.map((item, i) => (
                <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                  <div className="bg-card rounded-2xl p-6 border border-border text-center hover:shadow-lg transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-sunshine/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-foreground" />
                    </div>
                    <h3 className="font-display font-bold text-foreground mb-2">{item.myth}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.reality}</p>
                    <div className="text-xs font-bold text-coral bg-coral/10 rounded-full px-3 py-1 inline-block">
                      {item.impact}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — The Two Pillars: Psychology & Nutrition */}
        <section className="py-20 sm:py-28 bg-foreground text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-6">
                  Two Pillars That <span className="text-accent">Change Everything</span>
                </h2>
                <p className="text-xl text-white/60">
                  Our experts don&apos;t just assess — they <span className="text-white font-bold">intervene, train, and transform.</span>
                </p>
              </div>
            </AnimatedSection>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Psychology Pillar */}
              <AnimatedSection animation="slide-left">
                <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-lavender/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-lavender" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-2xl">Psychology</h3>
                      <p className="text-white/50 text-sm">Mind, Emotions & Behavior</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {psychologyPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">{point.title}</p>
                          <p className="text-white/50 text-sm">{point.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <p className="text-sm font-bold text-lavender uppercase tracking-wide mb-3">What We Cover</p>
                    <div className="flex flex-wrap gap-2">
                      {psychologyTags.map((tag, i) => (
                        <span key={i} className="bg-lavender/10 text-lavender border border-lavender/20 px-3 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Nutrition Pillar */}
              <AnimatedSection animation="slide-right">
                <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                      <Apple className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-2xl">Nutrition</h3>
                      <p className="text-white/50 text-sm">Growth, Diet & Physical Health</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {nutritionPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">{point.title}</p>
                          <p className="text-white/50 text-sm">{point.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <p className="text-sm font-bold text-accent uppercase tracking-wide mb-3">What We Cover</p>
                    <div className="flex flex-wrap gap-2">
                      {nutritionTags.map((tag, i) => (
                        <span key={i} className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* SECTION 5 — How We Work Together (Step-by-Step) */}
        <section className="py-20 sm:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full mb-6">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-wide">The Partnership</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-6">
                  Here&apos;s Exactly How <span className="text-primary">We Work Together</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  A clear, structured process — zero disruption, maximum impact.
                </p>
              </div>
            </AnimatedSection>

            <div className="max-w-5xl mx-auto space-y-6">
              {partnershipSteps.map((step, i) => (
                <AnimatedSection key={i} animation="fade-up" delay={i * 120}>
                  <div className={`relative rounded-2xl border overflow-hidden ${step.highlight ? 'border-primary/30 bg-primary/[0.03]' : 'border-border bg-card'}`}>
                    {/* Step number badge */}
                    <div className="absolute top-0 left-0">
                      <div className={`w-12 h-12 rounded-br-2xl flex items-center justify-center font-display font-extrabold text-lg ${step.highlight ? 'bg-primary text-primary-foreground' : 'bg-foreground text-white'}`}>
                        {i + 1}
                      </div>
                    </div>

                    <div className="pl-16 sm:pl-20 pr-6 py-6 sm:py-8">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
                        {/* What we do */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                            <h3 className="font-display font-extrabold text-lg sm:text-xl text-foreground">{step.title}</h3>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>

                        {/* What school gets — benefit badge */}
                        <div className={`lg:w-72 flex-shrink-0 rounded-xl p-4 ${step.benefitBg}`}>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: step.benefitAccent }}>
                            {step.benefitLabel}
                          </p>
                          <p className="text-sm font-semibold text-foreground">{step.benefit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — What the School Gets (Summary) */}
        <section className="py-20 sm:py-28 bg-foreground text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-4">
                  What Your School <span className="text-accent">Walks Away With</span>
                </h2>
                <p className="text-xl text-white/60">
                  It&apos;s not just a service — it&apos;s a <span className="text-white font-bold">transformation your school can showcase.</span>
                </p>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {schoolBenefits.map((item, i) => (
                <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                  <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-6 hover:border-accent/40 transition-all h-full">
                    <div className="text-3xl mb-4">{item.emoji}</div>
                    <h3 className="font-display font-bold text-lg text-white mb-2">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7 — Bold CTA */}
        <section className="py-20 sm:py-28 bg-gradient-hero text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="scale">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-6">
                  Your Students Deserve This. <br />Your School Deserves the Credit.
                </h2>
                <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
                  One conversation is all it takes. We handle everything — you get the outcomes.
                </p>
                <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
                  Schools that act first, lead first.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 py-6 rounded-xl">
                    <Link href="/schools">
                      Schedule a Free Call
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 font-bold text-lg px-10 py-6 rounded-xl">
                    <Link href="/schools/health-buddy-centre">
                      See Our Models
                    </Link>
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

// --- DATA ---

const studentStruggles = [
  { icon: Frown, title: "Anxiety & Withdrawal", description: "Children silently battling anxiety — refusing to participate, avoiding peers, breaking down before exams." },
  { icon: Angry, title: "Aggression & Outbursts", description: "Sudden anger, hitting, screaming — not bad behavior, but unprocessed emotional pain spilling out." },
  { icon: BatteryLow, title: "Fatigue & Low Energy", description: "Constantly tired, can't concentrate, falling asleep in class. Iron deficiency? Poor sleep? Nobody's checking." },
  { icon: TrendingDown, title: "Falling Grades", description: "Intelligent children scoring poorly — not because they can't learn, but because their bodies and minds aren't fueled to." },
  { icon: Eye, title: "Screen Addiction", description: "Dopamine-hijacked brains can't focus on a whiteboard. The attention span crisis is real and growing." },
  { icon: Utensils, title: "Terrible Eating Habits", description: "Skipping breakfast, junk-only diets, hidden hunger. Malnutrition doesn't always look like starvation." },
];

const teacherPains = [
  "No training to identify early signs of anxiety, ADHD, or emotional dysregulation",
  "Expected to handle behavioral crises with zero psychological support",
  "Can't address nutritional gaps that directly impact classroom performance",
  "Burnout from managing 40+ students with complex unmet needs",
];

const teacherQuotes = [
  "I know something is wrong with Aryan, but I don't know what to do about it.",
  "Parents think their child is fine because grades were okay last year. But I see the change every day.",
  "I spend more time managing meltdowns than teaching. I'm exhausted.",
  "One child eats only chips for lunch. Every single day. I've told the parents, but nothing changes.",
];

const parentBlindSpots = [
  { icon: Clock, myth: "\"It's just a phase\"", reality: "Behavioral patterns before age 10 often become lifelong. Early intervention is everything.", impact: "3x harder to treat after age 12" },
  { icon: Scale, myth: "\"My child eats enough\"", reality: "Eating enough is not eating right. Hidden hunger affects cognition, immunity, and growth.", impact: "40% of Indian children are malnourished" },
  { icon: ShieldAlert, myth: "\"They'll grow out of it\"", reality: "Anxiety, ADHD, and emotional issues don't disappear. They evolve into bigger problems.", impact: "75% of mental illness starts before 18" },
  { icon: Flame, myth: "\"School should handle it\"", reality: "Schools aren't equipped. Parents aren't aware. The child falls through the cracks.", impact: "Only 1 in 10 gets help" },
];

const psychologyPoints = [
  { title: "1-on-1 Student Assessments", desc: "Certified psychologists screen every child for emotional, behavioral, and developmental markers." },
  { title: "Teacher Training Workshops", desc: "Equip teachers to spot early signs and respond with evidence-based strategies." },
  { title: "Parent Awareness Sessions", desc: "Help parents understand what their child is going through and what to do about it." },
  { title: "Ongoing Counseling Support", desc: "Not a one-time visit — continuous support through the academic year." },
];

const psychologyTags = [
  "Anxiety", "ADHD", "Emotional Regulation", "Bullying", "Self-Esteem",
  "Social Skills", "Exam Stress", "Screen Addiction", "Behavioral Issues", "Learning Disabilities"
];

const nutritionPoints = [
  { title: "Individual Growth Assessments", desc: "BMI, diet recall, micronutrient screening — a complete picture of every child's nutritional status." },
  { title: "Lunchbox & Diet Makeovers", desc: "Personalized meal plans and guidance for parents based on actual deficiencies found." },
  { title: "Canteen & Menu Consulting", desc: "Transform your school canteen from junk food haven to a nutrition-conscious space." },
  { title: "Classroom Nutrition Education", desc: "Fun, age-appropriate sessions that teach children to make better food choices for life." },
];

const nutritionTags = [
  "Iron Deficiency", "Obesity", "Picky Eating", "Hidden Hunger", "Growth Delay",
  "Calcium Gaps", "Junk Food Habits", "Protein Deficiency", "Vitamin D", "Gut Health"
];

const partnershipSteps = [
  {
    icon: Users,
    iconColor: "text-primary",
    title: "We Sit With Your Teachers",
    description: "Our experts meet every class teacher 1-on-1 to understand which children show behavioral, emotional, or health red flags. Teachers know their students best — we listen first.",
    benefitLabel: "Why This Matters",
    benefit: "Teachers finally feel heard. Their observations become actionable data.",
    benefitBg: "bg-brand/5",
    benefitAccent: "hsl(var(--primary))",
    highlight: false,
  },
  {
    icon: Eye,
    iconColor: "text-coral",
    title: "We Independently Assess Every Child",
    description: "Our certified Psychologists & Nutritionists conduct structured screenings for every student — catching the cases that even the best teachers miss. Silent sufferers get identified.",
    benefitLabel: "Hidden Cases Found",
    benefit: "On average, 30-40% of flagged cases were previously unidentified by anyone.",
    benefitBg: "bg-coral/5",
    benefitAccent: "hsl(var(--coral))",
    highlight: true,
  },
  {
    icon: HeartPulse,
    iconColor: "text-accent",
    title: "Flagged Children Get Expert Consultation",
    description: "Children identified with concerns receive 1-on-1 sessions with our experts. We then speak directly to parents, explain the findings clearly, and recommend next steps.",
    benefitLabel: "Parent Pays for Follow-ups",
    benefit: "School bears zero cost for individual consultations — parents pay directly.",
    benefitBg: "bg-accent/5",
    benefitAccent: "hsl(var(--accent))",
    highlight: false,
  },
  {
    icon: GraduationCap,
    iconColor: "text-primary",
    title: "Teachers Get Trained — For Free",
    description: "As part of our partnership, we run professional development workshops for your teaching staff: how to spot early signs of anxiety, ADHD, nutritional issues, and how to respond effectively.",
    benefitLabel: "School Gets This Free",
    benefit: "Upskilled teachers, better classroom management, fewer escalations.",
    benefitBg: "bg-sunshine/10",
    benefitAccent: "hsl(var(--foreground))",
    highlight: true,
  },
  {
    icon: ShieldAlert,
    iconColor: "text-lavender",
    title: "Every Child Gets a Health Passport",
    description: "We create a comprehensive Health Passport for every student — covering Psychology, Nutrition, Dental, Vision, and Growth parameters. A living document that travels with the child.",
    benefitLabel: "School Branding Asset",
    benefit: "Position your school as a health-first institution. Parents see you care beyond academics.",
    benefitBg: "bg-lavender/5",
    benefitAccent: "hsl(var(--lavender))",
    highlight: false,
  },
];

const schoolBenefits = [
  { emoji: "📊", title: "School-Wide Health Report", desc: "Aggregated insights across all students — trends, risk areas, and benchmarks to show your board and parents." },
  { emoji: "🏅", title: "Health-First School Branding", desc: "Market your school as one that genuinely invests in children's wellbeing — a massive differentiator for admissions." },
  { emoji: "👩‍🏫", title: "Upskilled Teaching Staff", desc: "Teachers trained in early identification, emotional first-aid, and classroom strategies for challenging behaviors." },
  { emoji: "📋", title: "Individual Health Passports", desc: "Every child gets a professional health document — parents see tangible value and the school's commitment." },
  { emoji: "💰", title: "Zero Cost for Consultations", desc: "Parent-funded follow-ups mean the school gets premium health services without the premium price tag." },
  { emoji: "🤝", title: "Year-Round Expert Support", desc: "Not a one-time visit. Ongoing check-ins, follow-ups for flagged children, and seasonal workshops throughout the year." },
];

export default SchoolPitchPage;

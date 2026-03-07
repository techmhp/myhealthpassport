'use client';
import { Activity, Apple, Brain, Heart, SmilePlus, Eye } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
// Row 1 - Foundational Health Checks
const foundationalPillars = [
  {
    icon: Activity,
    title: "Physical Health",
    description: "Height, weight, body composition",
    color: "from-brand to-blue-400",
  },
  {
    icon: SmilePlus,
    title: "Dental Health",
    description: "Cavity detection, gum health, hygiene",
    color: "from-sunshine to-amber-400",
  },
  {
    icon: Eye,
    title: "Vision",
    description: "Visual acuity, colour vision, depth perception",
    color: "from-brand to-indigo-400",
  },
];

// Row 2 - Core Growth & Wellbeing Drivers
const corePillars = [
  {
    icon: Apple,
    title: "Nutrition & Lifestyle",
    ageTag: null,
    subtitle: "How food habits and daily routines influence energy, focus, immunity, and mood.",
    bullets: [
      "Dietary quality & habits",
      "Meal timing & lifestyle patterns",
      "Micronutrient risk indicators",
    ],
    color: "from-mint to-emerald-400",
    tagColor: "bg-mint/10 text-mint",
  },
  {
    icon: Brain,
    title: "Developmental Milestones",
    ageTag: "Ages 2–8",
    subtitle: "Understanding how children grow, learn, and coordinate at the right pace for their age.",
    bullets: [
      "Motor skills & coordination",
      "Cognitive readiness",
      "Early learning foundations",
    ],
    color: "from-lavender to-purple-400",
    tagColor: "bg-lavender/10 text-lavender",
  },
  {
    icon: Heart,
    title: "Emotional & Mental Wellbeing",
    ageTag: "Ages 8+",
    subtitle: "Supporting how children feel, cope, and relate inside and outside the classroom.",
    bullets: [
      "Anxiety & stress signals",
      "Emotional regulation",
      "Social reciprocity & confidence",
    ],
    color: "from-coral to-orange-400",
    tagColor: "bg-coral/10 text-coral",
  },
];

const PillarsSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-mint/10 text-mint px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            Comprehensive Care
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6">
            The 6 Pillars of{" "}
            <span className="text-gradient-hero">Comprehensive Screening</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2 mb-4">
            Proactive. Preventive. Personalized.
          </p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground px-2">
            Where Most Learning, Behaviour & Confidence Challenges Begin
          </h3>
        </AnimatedSection>

        {/* Row 1 - Foundational Health Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {foundationalPillars.map((pillar, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <div className="group relative bg-background p-5 sm:p-6 rounded-2xl border border-border hover:border-transparent transition-all duration-300 hover:shadow-lg h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                    <pillar.icon className="w-6 h-6 sm:w-7 sm:h-7 text-brand group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 group-hover:text-white transition-colors">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-white/80 transition-colors">{pillar.description}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Row 2 - Core Growth & Wellbeing Drivers */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {corePillars.map((pillar, index) => (
            <AnimatedSection key={index} delay={index * 150}>
              <div className="group relative bg-background p-6 sm:p-8 rounded-2xl border-2 border-brand/20 hover:border-transparent transition-all duration-300 hover:shadow-xl h-full flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                      <pillar.icon className="w-7 h-7 sm:w-8 sm:h-8 text-brand group-hover:text-white transition-colors" />
                    </div>
                    {pillar.ageTag && (
                      <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full ${pillar.tagColor} group-hover:bg-white/20 group-hover:text-white transition-colors`}>
                        {pillar.ageTag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-white transition-colors leading-tight">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-white/80 transition-colors mb-4 sm:mb-5 leading-relaxed flex-grow">{pillar.subtitle}</p>
                  <ul className="space-y-2 sm:space-y-2.5 pt-3 border-t border-border/50 group-hover:border-white/20">
                    {pillar.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="text-xs sm:text-sm text-muted-foreground group-hover:text-white/80 transition-colors flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-brand group-hover:bg-white rounded-full flex-shrink-0 mt-1.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Closing Line */}
        <AnimatedSection className="text-center max-w-3xl mx-auto px-4">
          <p className="text-base sm:text-lg text-muted-foreground italic">
            These three pillars often shape how all others show up —
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-brand font-semibold not-italic">which is why MHP looks beyond routine checks.</span>
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default PillarsSection;

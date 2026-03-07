import { BookOpen, Frown, Zap, Smartphone } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
const outcomeCards = [
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Learning Feels Harder Than It Should",
    description: "Focus drops, progress slows, exam pressure builds",
    color: "bg-brand",
  },
  {
    icon: Frown,
    emoji: "😔",
    title: "Emotions Feel Bigger",
    description: "Worry, anger, withdrawal, frequent meltdowns",
    color: "bg-coral",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Energy Levels Don't Match the Day",
    description: "Constant tiredness, low stamina, frequent sickness",
    color: "bg-sunshine",
  },
  {
    icon: Smartphone,
    emoji: "📱",
    title: "Modern Routines Take a Toll",
    description: "Screens, sleep disruption, stress overload",
    color: "bg-lavender",
  },
];

const ChildrenStruggleSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6">
            When Children Struggle, It Rarely Looks Like a{" "}
            <span className="text-gradient-hero">"Health Issue"</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Parents and teachers usually notice changes long before a diagnosis is ever considered.
          </p>
        </AnimatedSection>

        {/* Outcome Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {outcomeCards.map((card, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <div className="group relative bg-card p-5 sm:p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card text-center h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                
                {/* Emoji */}
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{card.emoji}</div>
                
                <h3 className="text-sm sm:text-lg font-bold mb-2 sm:mb-3">{card.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{card.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Closing Line */}
        <AnimatedSection className="text-center px-4">
          <p className="text-base sm:text-lg font-medium text-foreground/80">
            Understanding these early helps children{" "}
            <span className="text-brand font-bold">before problems grow.</span>
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ChildrenStruggleSection;

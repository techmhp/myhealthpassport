import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Layers,
  Stethoscope,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const flowStages = [
  {
    icon: Search,
    title: "Screen",
    color: "brand",
    points: [
      "Physical, nutrition, psychological, vision & dental",
      "Conducted safely within school settings",
    ],
  },
  {
    icon: Layers,
    title: "Stratify",
    color: "mint",
    points: [
      "Low / Moderate / High risk classification",
      "Age, issue-type & severity-based grouping",
    ],
  },
  {
    icon: Stethoscope,
    title: "Intervene",
    color: "coral",
    points: [
      "Hospital referrals for vision & dental care",
      "Parent-led nutrition counselling",
      "Group-based psychological support",
    ],
  },
  {
    icon: TrendingUp,
    title: "Improve",
    color: "lavender",
    points: [
      "Better learning outcomes",
      "Reduced absenteeism",
      "Improved emotional resilience",
      "Healthier growth trajectories",
    ],
  },
];

const csrValues = [
  "High reach, low cost per child",
  "Evidence-based & ethically designed",
  "Strong ESG & child wellbeing alignment",
  "Repeatable across schools and regions",
];

const ImpactFlowSection = () => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "brand":
        return { bg: "bg-brand/10", text: "text-brand", border: "border-brand/30" };
      case "mint":
        return { bg: "bg-mint/10", text: "text-mint", border: "border-mint/30" };
      case "coral":
        return { bg: "bg-coral/10", text: "text-coral", border: "border-coral/30" };
      case "lavender":
        return { bg: "bg-lavender/10", text: "text-lavender", border: "border-lavender/30" };
      default:
        return { bg: "bg-brand/10", text: "text-brand", border: "border-brand/30" };
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Measurable Impact
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            From Screening to{" "}
            <span className="text-gradient-hero">Sustainable Child Wellbeing</span>
          </h2>
        </AnimatedSection>

        {/* Flow Diagram */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {flowStages.map((stage, index) => {
            const Icon = stage.icon;
            const colors = getColorClasses(stage.color);
            return (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="relative">
                  <Card className={`h-full border-2 ${colors.border}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <h3 className={`text-lg font-bold ${colors.text}`}>
                          {stage.title}
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {stage.points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle
                              className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`}
                            />
                            <span className="text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  {/* Arrow connector */}
                  {index < flowStages.length - 1 && (
                    <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* CSR Value Box */}
        <AnimatedSection delay={400}>
          <Card className="max-w-3xl mx-auto border-2 border-brand bg-gradient-to-br from-brand/5 to-mint/5">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-center mb-6 text-brand">
                CSR Value Delivered
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {csrValues.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-background rounded-lg p-3"
                  >
                    <CheckCircle className="w-5 h-5 text-brand flex-shrink-0" />
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Closing Statement */}
        <AnimatedSection delay={500} className="mt-8">
          <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto">
            This program transforms CSR funding into{" "}
            <span className="font-semibold text-brand">early action</span>,{" "}
            <span className="font-semibold text-mint">real outcomes</span>, and{" "}
            <span className="font-semibold text-coral">long-term societal value</span>.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ImpactFlowSection;

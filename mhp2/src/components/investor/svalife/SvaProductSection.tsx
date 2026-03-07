import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Apple, 
  Activity, 
  Heart,
  Target,
  Sparkles,
  CheckCircle2
} from "lucide-react";

const SvaProductSection = () => {
  const pillars = [
    {
      icon: Apple,
      title: "Nutrition",
      subtitle: "What you eat decides how you feel",
      color: "emerald",
      points: [
        "Smooth, steady energy—no crashes",
        "Balanced blood sugar for calm & focus",
        "Happier gut for better sleep & clarity"
      ]
    },
    {
      icon: Brain,
      title: "Emotional Wellbeing",
      subtitle: "How you respond shapes your day",
      color: "cyan",
      points: [
        "Reset stress before burnout",
        "Stay focused under pressure",
        "Learn to truly switch off & recover"
      ]
    }
  ];

  const transformationPath = [
    {
      step: "01",
      title: "Decode",
      description: "Identify exactly what's draining you using questionnaires, lab insights, and body scans",
      outcome: "Clear answers with zero guesswork"
    },
    {
      step: "02",
      title: "Realign",
      description: "Stabilize energy, improve stress response, rebuild your foundation with personalized plans",
      outcome: "Better focus, fewer crashes"
    },
    {
      step: "03",
      title: "Master",
      description: "Operate calmly under pressure with clear mind, steady energy, and full control",
      outcome: "Sustainable long-term resilience"
    }
  ];

  const programs = [
    {
      icon: Target,
      title: "5-Week Discovery",
      subtitle: "Bio-Baseline Reset",
      description: "Stop guessing, start understanding",
      features: ["Lab tests & body scans", "Stress assessments", "Personalized foundation report"],
      color: "slate"
    },
    {
      icon: Sparkles,
      title: "100-Day Deep Dive",
      subtitle: "Elite Transformation",
      description: "We build the system, you build the habit",
      features: ["Advanced diagnostics", "Weekly mindset sessions", "Continuous optimization"],
      color: "cyan",
      popular: true
    }
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-500/20" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-700", border: "border-slate-500/20" },
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Heart className="w-4 h-4" />
            Product & USP
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-800">
            The SVA <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">Transformation Path</span>
          </h2>
          <p className="text-lg text-slate-600">
            From Burnout → Balance → Mastery
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Two Pillars */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {pillars.map((pillar, index) => {
              const colors = colorClasses[pillar.color];
              return (
                <Card key={index} className={`border-2 ${colors.border} hover:shadow-xl transition-all`}>
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-6`}>
                      <pillar.icon className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{pillar.title}</h3>
                    <p className="text-slate-600 mb-6">{pillar.subtitle}</p>
                    <ul className="space-y-3">
                      {pillar.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className={`w-5 h-5 ${colors.text} shrink-0 mt-0.5`} />
                          <span className="text-slate-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Transformation Path */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-8">The Transformation Journey</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {transformationPath.map((step, index) => (
                <Card key={index} className="border-slate-200 bg-white hover:shadow-lg transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-slate-500" />
                  <CardContent className="p-6 pl-8">
                    <span className="text-4xl font-extrabold text-cyan-600/20">{step.step}</span>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h4>
                    <p className="text-sm text-slate-600 mb-4">{step.description}</p>
                    <div className="bg-cyan-50 rounded-lg px-4 py-2">
                      <p className="text-sm font-semibold text-cyan-700">{step.outcome}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-8">Our Programs</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {programs.map((program, index) => {
                const colors = colorClasses[program.color];
                return (
                  <Card key={index} className={`border-2 ${colors.border} hover:shadow-xl transition-all relative`}>
                    {program.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-slate-800 to-cyan-700 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-4`}>
                        <program.icon className={`w-7 h-7 ${colors.text}`} />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-1">{program.title}</h4>
                      <p className={`text-sm font-semibold ${colors.text} mb-2`}>{program.subtitle}</p>
                      <p className="text-slate-600 mb-4">{program.description}</p>
                      <ul className="space-y-2">
                        {program.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Activity className={`w-4 h-4 ${colors.text}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SvaProductSection;

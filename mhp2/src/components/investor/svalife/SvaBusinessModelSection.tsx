import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  User, 
  ClipboardCheck,
  Heart,
  Users,
  ArrowRight,
  CircleDollarSign,
  Repeat,
  CheckCircle2,
  Calendar,
  Briefcase
} from "lucide-react";

const SvaBusinessModelSection = () => {
  const operationModes = [
    { icon: User, label: "Individual Consultations", sublabel: "1:1 sessions" },
    { icon: Building2, label: "Corporate Programs", sublabel: "Team wellness" },
    { icon: Calendar, label: "Discovery Programs", sublabel: "5-week assessment" },
  ];

  const revenueStreams = [
    {
      number: "01",
      title: "Individual Paid Plans",
      badge: "B2C Revenue",
      badgeColor: "cyan",
      icon: User,
      points: [
        "5-Week Discovery Program (Bio-Baseline Reset)",
        "100-Day Deep Dive (Elite Transformation)",
        "Lab tests, body scans & psychological assessments",
        "1:1 nutrition & mindset consultations"
      ],
      footer: "High-value direct clients"
    },
    {
      number: "02",
      title: "Corporate Wellness Programs",
      badge: "B2B Revenue",
      badgeColor: "slate",
      icon: Briefcase,
      points: [
        "High-impact workshops on stress & energy",
        "Industry-specific performance strategies",
        "Team nutrition sessions & focus tools",
        "Ongoing corporate retainer contracts"
      ],
      footer: "Scalable enterprise revenue"
    }
  ];

  const flywheelSteps = [
    { label: "Assessment", icon: ClipboardCheck, color: "cyan" },
    { label: "Consultations", icon: Heart, color: "slate" },
    { label: "Transformation", icon: Users, color: "emerald" },
    { label: "Retention", icon: Repeat, color: "amber" },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-500/20", gradient: "from-cyan-500/20 to-cyan-500/5" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-700", border: "border-slate-500/20", gradient: "from-slate-500/20 to-slate-500/5" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/20", gradient: "from-emerald-500/20 to-emerald-500/5" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/20", gradient: "from-amber-500/20 to-amber-500/5" },
  };

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <CircleDollarSign className="w-4 h-4" />
            Business Model
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 text-slate-800">
            How SVA Life <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">Generates Revenue</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            A premium wellness model combining individual consultations with scalable corporate programs
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Operation Modes - Compact */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px bg-slate-200 flex-1 max-w-16" />
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">How We Operate</span>
              <div className="h-px bg-slate-200 flex-1 max-w-16" />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {operationModes.map((mode, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-xl flex items-center justify-center">
                    <mode.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{mode.label}</p>
                    <p className="text-xs text-slate-500">{mode.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              Every engagement starts with <span className="font-semibold text-slate-700">personalized assessment</span>
            </p>
          </div>

          {/* Revenue Streams */}
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {revenueStreams.map((stream, index) => {
              const colors = colorClasses[stream.badgeColor];
              return (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white`}
                >
                  {/* Top gradient accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />
                  
                  <CardContent className="p-6 pt-7">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${colors.bg} rounded-2xl flex items-center justify-center`}>
                          <stream.icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <span className={`text-3xl font-extrabold ${colors.text} opacity-30`}>{stream.number}</span>
                      </div>
                      <span className={`text-xs font-bold ${colors.text} ${colors.bg} px-3 py-1.5 rounded-full`}>
                        {stream.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-4 text-slate-800">{stream.title}</h3>

                    {/* Points */}
                    <ul className="space-y-2.5 mb-5">
                      {stream.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <CheckCircle2 className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer */}
                    <div className={`pt-4 border-t ${colors.border}`}>
                      <p className={`text-sm font-semibold ${colors.text}`}>
                        {stream.footer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Revenue Flywheel */}
          <Card className="border-2 border-dashed border-slate-300 bg-gradient-to-br from-cyan-50/50 via-white to-slate-50/50">
            <CardContent className="p-8 lg:p-10">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Revenue Flywheel
                </span>
              </div>
              
              {/* Flywheel Visual */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
                {flywheelSteps.map((step, index) => {
                  const colors = colorClasses[step.color];
                  return (
                    <div key={index} className="flex items-center">
                      <div className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl ${colors.bg} border-2 ${colors.border} min-w-[120px]`}>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <step.icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <span className="font-bold text-sm text-slate-700">{step.label}</span>
                      </div>
                      {index < flywheelSteps.length - 1 && (
                        <div className="hidden sm:flex items-center px-2">
                          <ArrowRight className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-slate-600 mt-8 text-sm max-w-md mx-auto">
                Premium consultations build trust, enabling organic renewals and corporate referrals
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SvaBusinessModelSection;

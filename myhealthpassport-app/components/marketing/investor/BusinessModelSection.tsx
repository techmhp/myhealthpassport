'use client';
import { Card, CardContent } from "@/components/shadcn/card";
import { 
  Building2, 
  Tent, 
  MapPin,
  ClipboardCheck,
  Heart,
  Apple,
  Users,
  ArrowRight,
  CircleDollarSign,
  Repeat,
  CheckCircle2
} from "lucide-react";

const BusinessModelSection = () => {
  const operationLocations = [
    { icon: Building2, label: "Health Buddy Centres", sublabel: "Inside schools" },
    { icon: Tent, label: "Health Camps", sublabel: "On-campus events" },
    { icon: MapPin, label: "MHP Centres", sublabel: "Parent visits" },
  ];

  const revenueStreams = [
    {
      number: "01",
      title: "Preventive Health Screenings",
      badge: "Primary Revenue",
      badgeColor: "brand",
      icon: ClipboardCheck,
      points: [
        "6 standardised health parameters",
        "Delivered via Buddy Centres, Camps, or MHP Centres",
        "Each child receives a My Health Passport",
        "Schools or parents pay screening fee"
      ],
      footer: "Entry point to the ecosystem"
    },
    {
      number: "02",
      title: "Paid Plans & Therapies",
      badge: "B2B2C",
      badgeColor: "lavender",
      icon: Heart,
      points: [
        "Deeper assessments only when concerns arise",
        "Focus: Emotional Health & Nutrition",
        "Parents opt for care plans voluntarily",
        "No forced escalation — parent-controlled"
      ],
      footer: "Trust-based conversion"
    },
    {
      number: "03",
      title: "School Retainers",
      badge: "Recurring Revenue",
      badgeColor: "mint",
      icon: Users,
      points: [
        "Psychologists & Nutritionists placed in schools",
        "Handle screenings & parent coordination",
        "Monthly retainer model",
        "Two departments per school"
      ],
      footer: "Predictable, long-term revenue"
    }
  ];

  const flywheelSteps = [
    { label: "Screening", icon: ClipboardCheck, color: "brand" },
    { label: "Assessment", icon: Heart, color: "lavender" },
    { label: "Paid Plans", icon: CircleDollarSign, color: "coral" },
    { label: "Retainers", icon: Repeat, color: "mint" },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    brand: { bg: "bg-brand/10", text: "text-brand", border: "border-brand/20", gradient: "from-brand/20 to-brand/5" },
    mint: { bg: "bg-mint/10", text: "text-mint", border: "border-mint/20", gradient: "from-mint/20 to-mint/5" },
    lavender: { bg: "bg-lavender/10", text: "text-lavender", border: "border-lavender/20", gradient: "from-lavender/20 to-lavender/5" },
    coral: { bg: "bg-coral/10", text: "text-coral", border: "border-coral/20", gradient: "from-coral/20 to-coral/5" },
  };

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-5 py-2.5 rounded-full text-sm font-semibold mb-6 border border-brand/20">
            <CircleDollarSign className="w-4 h-4" />
            Business Model
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5">
            How My Health Passport <span className="text-gradient-hero">Makes Money</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A preventive-first, trust-based, and scalable revenue model built around child wellness
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Where We Operate - Compact */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px bg-border flex-1 max-w-16" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Where We Operate</span>
              <div className="h-px bg-border flex-1 max-w-16" />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {operationLocations.map((loc, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                    <loc.icon className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{loc.label}</p>
                    <p className="text-xs text-muted-foreground">{loc.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              All engagement starts with <span className="font-semibold text-foreground">preventive screening</span>
            </p>
          </div>

          {/* Revenue Streams */}
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {revenueStreams.map((stream, index) => {
              const colors = colorClasses[stream.badgeColor];
              return (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
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
                    <h3 className="text-lg font-bold mb-4">{stream.title}</h3>

                    {/* Points */}
                    <ul className="space-y-2.5 mb-5">
                      {stream.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
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
          <Card className="border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-brand/5 via-transparent to-mint/5">
            <CardContent className="p-8 lg:p-10">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-coral bg-coral/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
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
                        <div className={`w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm`}>
                          <step.icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <span className="font-bold text-sm">{step.label}</span>
                      </div>
                      {index < flywheelSteps.length - 1 && (
                        <div className="hidden sm:flex items-center px-2">
                          <ArrowRight className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-muted-foreground mt-8 text-sm max-w-md mx-auto">
                Preventive-first approach builds trust, enabling organic conversion to premium services and long-term partnerships
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BusinessModelSection;

import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Smartphone, 
  Brain, 
  Activity,
  Users,
  LineChart,
  Lock,
  Zap
} from "lucide-react";

const SvaTechSection = () => {
  const techFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Personalized recommendations based on biological & behavioral data"
    },
    {
      icon: Activity,
      title: "Real-Time Tracking",
      description: "Continuous monitoring of energy, stress, and wellness metrics"
    },
    {
      icon: Shield,
      title: "HIPAA Aligned",
      description: "Enterprise-grade security for sensitive health data"
    },
    {
      icon: Smartphone,
      title: "Multi-Platform",
      description: "Web dashboard, mobile app, and wearable integrations"
    },
  ];

  const portals = [
    { name: "Clients", icon: Users, color: "cyan" },
    { name: "Experts", icon: Brain, color: "slate" },
    { name: "Corporate", icon: LineChart, color: "emerald" },
    { name: "Admin", icon: Lock, color: "amber" },
  ];

  const portalColors: Record<string, { bg: string; border: string; text: string }> = {
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-600" },
    slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-600" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600" },
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" />
            Technology
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-800">
            Built for <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">Scale & Security</span>
          </h2>
          <p className="text-lg text-slate-600">
            Enterprise-ready wellness platform with advanced analytics and secure data handling
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Main Grid - Tech Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {techFeatures.map((feature, index) => (
              <Card key={index} className="border-slate-200 hover:border-cyan-300 transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-slate-800">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role-Based Portals */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50/30">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Role-Based Access Portals</h3>
                <p className="text-sm text-slate-600">Secure, dedicated dashboards for every stakeholder</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {portals.map((portal, index) => {
                  const colors = portalColors[portal.color];
                  return (
                    <div 
                      key={index} 
                      className={`flex flex-col items-center gap-3 px-8 py-5 rounded-2xl border-2 ${colors.border} ${colors.bg} transition-all hover:scale-105 cursor-default`}
                    >
                      <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm ${colors.border} border`}>
                        <portal.icon className={`w-7 h-7 ${colors.text}`} />
                      </div>
                      <span className={`font-semibold text-sm ${colors.text}`}>{portal.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SvaTechSection;

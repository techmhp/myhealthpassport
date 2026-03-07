'use client';
import { School, UserCheck, FlaskConical, FileSearch, LayoutDashboard, Video } from "lucide-react";

const steps = [
  {
    icon: School,
    title: "School Onboarding",
    description: "Tailored setup and teacher training with minimal disruption.",
    color: "bg-brand",
  },
  {
    icon: UserCheck,
    title: "Parent Profile & Consent",
    description: "Secure digital profiles and informed parent consent.",
    color: "bg-mint",
  },
  {
    icon: FlaskConical,
    title: "Lab Coordination",
    description: "Data-rich start with questionnaires and lab tests.",
    color: "bg-coral",
  },
  {
    icon: FileSearch,
    title: "Report Generation",
    description: "Insights flagged by certified pediatric experts.",
    color: "bg-lavender",
  },
  {
    icon: LayoutDashboard,
    title: "Parental Access",
    description: "Secure access to the dynamic Health Passport dashboard.",
    color: "bg-sunshine",
  },
  {
    icon: Video,
    title: "Consultations & Support",
    description: "Virtual consults and re-screenings to keep health on track.",
    color: "bg-brand",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-gradient-soft relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
            From Campus to Care –{" "}
            <span className="text-gradient-hero">How It Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Six simple steps to a lifetime of healthier outcomes.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                      <step.icon className="w-7 h-7" />
                    </div>
                    <span className="text-4xl font-extrabold text-brand/20">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

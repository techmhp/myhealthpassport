import { Button } from "@/components/ui/button";
import { Building2, MapPin, GraduationCap, ArrowRight } from "lucide-react";

const offerings = [
  {
    icon: Building2,
    title: "The Buddy Centre",
    subtitle: "The On-Campus Health Hub",
    description: "A vibrant, safe, and dedicated health sanctuary physically located within school premises. Immediate access for early intervention.",
    features: ["Acts as primary triage point", "Short-term support on-campus", "Identifies need for deeper referral"],
    color: "bg-brand",
    buttonText: "Explore Buddy Centre",
  },
  {
    icon: MapPin,
    title: "The MHP Center",
    subtitle: "The Specialized MHP Office",
    description: "A clinical-grade, state-of-the-art facility designed for deep-dive diagnostics and comprehensive care.",
    features: ["Advanced screening capabilities", "Specialized expertise in all 5 domains", "Full suite of clinical resources"],
    color: "bg-mint",
    buttonText: "Visit MHP Centre",
  },
  {
    icon: GraduationCap,
    title: "School-Based Camps",
    subtitle: "Efficient Screening Sessions",
    description: "Tech-enabled health check-ups with zero disruption to academics. Interactive health talks and early detection.",
    features: ["30-40 min interactive sessions", "Smart scales & questionnaires", "Clear referral pathway"],
    color: "bg-coral",
    buttonText: "Book Screening",
  },
];

const ApproachSection = () => {
  return (
    <section id="approach" className="py-20 lg:py-32 bg-gradient-soft relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Our Approach
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
            The Wellness{" "}
            <span className="text-gradient-hero">Ecosystem</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Bringing Schools, Families, and Health Experts Together through three primary delivery models.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {offerings.map((offering, index) => (
            <div
              key={index}
              className="group bg-card rounded-3xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className={`${offering.color} p-6`}>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <offering.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{offering.title}</h3>
                <p className="text-white/80 text-sm">{offering.subtitle}</p>
              </div>
              
              <div className="p-6">
                <p className="text-muted-foreground mb-6">{offering.description}</p>
                <ul className="space-y-3 mb-6">
                  {offering.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 ${offering.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {offering.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;

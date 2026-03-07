import { Shield, Lock, Eye, UserCheck } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
const features = [
  {
    icon: Lock,
    title: "End-To-End Encryption",
    description: "Data protected during transmission and storage.",
  },
  {
    icon: Shield,
    title: "Regulatory Compliance",
    description: "Following Indian healthcare privacy standards.",
  },
  {
    icon: UserCheck,
    title: "Parent Controlled Sharing",
    description: "You decide what is shared and for how long.",
  },
];

const SecuritySection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-gradient-hero relative overflow-hidden">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Your Privacy Matters
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6">
            Data Privacy & Security You Can Trust
          </h2>
          <p className="text-base sm:text-lg text-white/80 px-2">
            We take the protection of your child's health data seriously.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 150}>
              <div className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-white/80">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
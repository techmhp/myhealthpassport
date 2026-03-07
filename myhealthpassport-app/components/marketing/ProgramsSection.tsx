'use client';
import { Button } from "@/components/shadcn/button";
import { Search, TrendingUp, Check } from "lucide-react";

const programs = [
  {
    icon: Search,
    title: "INSIGHT",
    tagline: "Know your child's health today",
    description: "A detailed health review to give you a baseline of where your child stands.",
    features: [
      "Growth Tracking: Height, weight, and BMI monitoring",
      "Nutrition Check-up: Diet analysis for missing vitamins",
      "Milestone Check: Developmental stage verification",
      "Mental & Emotional Scan: Mood and behavior check",
      "Vision & Dental Screening: Professional assessments",
      "Lab Work: Essential blood tests",
      "The Clarity Session: 1-on-1 report explanation",
    ],
    color: "brand",
    gradient: "from-brand to-blue-400",
  },
  {
    icon: TrendingUp,
    title: "FLOURISH",
    tagline: "Growing stronger, one step daily",
    description: "A continuous support system that stays with your child to ensure they succeed.",
    features: [
      "Active Therapy & Care: Hands-on sessions",
      "In-School Support: Experts work within school",
      "Habit Coaching: Better eating and mindfulness",
      "Regular Progress Tracking: Monthly check-ins",
      "School-Family Sync: Aligned care plans",
      "Priority Clinic Access: Skip the lines",
      "Long-Term Mentorship: Adaptive guidance",
    ],
    color: "mint",
    gradient: "from-mint to-emerald-400",
  },
];

const ProgramsSection = () => {
  return (
    <section id="programs" className="py-20 lg:py-32 bg-card relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mint/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Care Programs
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
            Our Care{" "}
            <span className="text-gradient-hero">Programmes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive programs designed for discovery, intervention, and continuous growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {programs.map((program, index) => (
            <div
              key={index}
              className="relative bg-background rounded-3xl border border-border overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${program.gradient}`} />
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 bg-${program.color}/10 rounded-2xl flex items-center justify-center`}>
                    <program.icon className={`w-8 h-8 text-${program.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold">{program.title}</h3>
                    <p className="text-muted-foreground">{program.tagline}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">{program.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {program.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 bg-${program.color}/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className={`w-3 h-3 text-${program.color}`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className={`w-full bg-${program.color} hover:bg-${program.color}/90`}>
                  Learn More About {program.title}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;

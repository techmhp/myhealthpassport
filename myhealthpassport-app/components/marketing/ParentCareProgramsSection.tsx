'use client';
import { Button } from "@/components/shadcn/button";
import { TrendingUp, Utensils, Brain, Check } from "lucide-react";

const programs = [
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
  {
    icon: Utensils,
    title: "Nutrition Support",
    tagline: "Fuel your child's growth",
    description: "Expert nutritional guidance to optimize your child's physical health and development.",
    features: [
      "Personalized Diet Plans: Tailored to your child",
      "Deficiency Assessment: Identify missing nutrients",
      "Healthy Eating Habits: Sustainable lifestyle changes",
      "Growth Optimization: Support physical development",
      "Allergy & Intolerance Guidance: Safe food choices",
      "Regular Follow-ups: Track progress monthly",
    ],
    color: "coral",
    gradient: "from-coral to-orange-400",
  },
  {
    icon: Brain,
    title: "Psychology Support",
    tagline: "Nurturing emotional wellbeing",
    description: "Compassionate psychological support to help your child thrive emotionally and socially.",
    features: [
      "Emotional Regulation: Managing feelings effectively",
      "Behavioural Support: Positive behaviour strategies",
      "Social Skills Development: Building connections",
      "Anxiety & Stress Management: Coping techniques",
      "Parent Guidance Sessions: Tools for home support",
      "School Coordination: Aligned support approach",
    ],
    color: "lavender",
    gradient: "from-lavender to-purple-400",
  },
];

const ParentCareProgramsSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-card relative overflow-hidden">
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

        <div className="grid lg:grid-cols-3 gap-6">
          {programs.map((program, index) => (
            <div
              key={index}
              className="relative bg-background rounded-3xl border border-border overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${program.gradient}`} />
              
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-${program.color}/10 rounded-2xl flex items-center justify-center shrink-0`}>
                    <program.icon className={`w-7 h-7 text-${program.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{program.title}</h3>
                    <p className="text-sm text-muted-foreground">{program.tagline}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">{program.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {program.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className={`w-4 h-4 bg-${program.color}/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className={`w-2.5 h-2.5 text-${program.color}`} />
                      </div>
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className={`w-full bg-${program.color} hover:bg-${program.color}/90`} size="sm">
                  Learn More
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ParentCareProgramsSection;

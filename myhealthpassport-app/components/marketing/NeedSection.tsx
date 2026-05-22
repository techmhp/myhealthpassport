'use client';
import { AlertTriangle, Activity, Utensils, Brain, Eye, SmilePlus, FlaskConical } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const stats = [
  { 
    value: "1 in 3", 
    label: "Nearly 1 in 3 Indian children are overweight, obese, physically inactive, or require proper child growth monitoring to support healthy development and lifestyle habits.",
    title: "Physical Screening",
    icon: Activity 
  },
  { 
    value: "60–70%", 
    label: "Children may experience nutrition gaps including poor diet quality, micronutrient deficiencies, or irregular eating habits that affect energy, immunity, concentration, and academic performance.",
    title: "Nutrition",
    icon: Utensils 
  },
  {
    value: "20–25%", 
    label: "Many children experience emotional or behavioural challenges such as anxiety, low confidence, attention difficulties, or exam stress that may require early child mental health assessment and wellness support.",
    title: "Emotional Development",
    icon: Brain 
  },
  { 
    value: "1 in 4", 
    label: "School-age children may experience vision concerns that affect reading, board work, focus, and classroom participation, highlighting the importance of regular vision and dental screening for children.",
    title: "Vision Screening",
    icon: Eye 
  },
  { 
    value: "45–55%", 
    label: "Many children show early signs of cavities, gum issues, oral discomfort, or hygiene concerns that can impact confidence, eating habits, and overall wellbeing.",
    title: "Dental Screening",
    icon: SmilePlus 
  },
  { 
    value: "30–40%", 
    label: "Routine pediatric diagnostic tests may identify abnormalities in iron, vitamin D, B12, and other nutritional markers that influence growth, immunity, focus, and daily energy levels.",
    title: "Lab Reports",
    icon: FlaskConical 
  },
];

const NeedSection = () => {
  return (
    <section id="need" className="py-16 sm:py-20 lg:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            The Urgent Need
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6">
            Why Early Health Screening{" "}
            <span className="text-gradient-hero">Matters</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Early detection through regular <strong>child health checkup</strong> programs improves learning outcomes, emotional wellbeing, and long-term development for school-age children.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="group relative bg-background p-6 sm:p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card h-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">{stat.title}</h3>
                  </div>
                  
                  <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand mb-2 sm:mb-3">
                    {stat.value}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{stat.label}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8 px-4">
          Designed for schools and parents seeking reliable <strong>school health programs in Hyderabad</strong> and preventive child healthcare solutions for long-term student wellbeing.
        </p>
      </div>
    </section>
  );
};

export default NeedSection;

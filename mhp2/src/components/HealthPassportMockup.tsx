import { Activity, Apple, Smile, Eye, FlaskConical, CheckCircle, AlertCircle, Baby, type LucideIcon } from "lucide-react";
import passportChild from "@/assets/passport-child.svg";

type HealthCategory = {
  name: string;
  icon?: LucideIcon;
  customIcon?: "tooth";
  status: "good" | "attention";
};

const healthCategories: HealthCategory[] = [
  { name: "Physical Screening", icon: Activity, status: "attention" },
  { name: "Nutrition", icon: Apple, status: "attention" },
  { name: "Emotional Wellbeing", icon: Smile, status: "attention" },
  { name: "Developmental Milestone", icon: Baby, status: "good" },
  { name: "Vision Screening", icon: Eye, status: "good" },
  { name: "Dental Screening", customIcon: "tooth", status: "good" },
  { name: "Lab Reports", icon: FlaskConical, status: "attention" },
];

const HealthPassportMockup = () => {
  return (
    <div className="relative w-full mt-2">
      {/* Pulsing Glow Effect */}
      <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-brand/30 via-mint/20 to-brand/30 rounded-2xl blur-lg animate-pulse-soft" />
      <div className="absolute inset-0 bg-brand/20 rounded-xl blur-xl transform translate-x-1 translate-y-1" />
      
      {/* Main Card */}
      <div className="relative bg-card rounded-xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 p-2.5 sm:p-3 lg:p-4 text-center">
          <div className="text-[10px] sm:text-xs lg:text-sm font-semibold text-brand mb-1.5 sm:mb-2">Live Health Dashboard</div>
          
          {/* Avatar */}
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-card shadow-lg overflow-hidden mb-1.5 sm:mb-2">
            <img 
              src={passportChild} 
              alt="Child profile" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="font-bold text-foreground text-xs sm:text-sm lg:text-base">Devansh Sharma</h3>
          
          {/* Info Pills */}
          <div className="flex justify-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
            <span className="bg-card px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground shadow-sm">Male</span>
            <span className="bg-card px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground shadow-sm">AB+</span>
            <span className="bg-card px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground shadow-sm">Age: 8</span>
          </div>
        </div>

        {/* Health Categories */}
        <div className="p-2 sm:p-2.5 lg:p-3 space-y-1 sm:space-y-1.5">
          {healthCategories.map((category, index) => {
            const Icon = category.icon;
            const isGood = category.status === "good";
            
            return (
              <div
                key={category.name}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center ${
                    isGood ? "bg-mint/20" : "bg-coral/20"
                  }`}>
                    {category.customIcon === "tooth" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rotate-180 ${isGood ? "text-mint" : "text-coral"}`}>
                        <path d="M12 2C9.5 2 7 4 7 7c0 2-.5 4-1.5 6-.7 1.4-1 3-.5 4.5.5 1.5 2 2.5 3 2.5s2-1 3-3c1 2 2 3 3 3s2.5-1 3-2.5c.5-1.5.2-3.1-.5-4.5C15.5 11 15 9 15 7c0-3-2.5-5-3-5z" />
                      </svg>
                    ) : Icon ? (
                      <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isGood ? "text-mint" : "text-coral"}`} />
                    ) : null}
                  </div>
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-foreground">{category.name}</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {isGood ? (
                    <>
                      <div className="h-1 w-6 sm:w-8 lg:w-10 rounded-full bg-mint" />
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-mint" />
                    </>
                  ) : (
                    <>
                      <div className="h-1 w-6 sm:w-8 lg:w-10 rounded-full bg-coral" />
                      <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-coral" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-2 sm:px-3 pb-2 sm:pb-3 flex justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-mint" />
            <span className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground">All Good</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-coral" />
            <span className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground">Needs Attention</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthPassportMockup;

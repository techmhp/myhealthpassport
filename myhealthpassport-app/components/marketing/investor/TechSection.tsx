'use client';
import { useState } from "react";
import { Card, CardContent } from "@/components/shadcn/card";
import { 
  Smartphone, 
  Cloud, 
  Database, 
  Lock,
  User,
  GraduationCap,
  Stethoscope,
  Shield,
  X
} from "lucide-react";
import HealthPassportMockup from "@/components/marketing/HealthPassportMockup";
const portalParentImg = "/marketing-assets/portal-parent.jpg";
const portalSchoolImg = "/marketing-assets/portal-school.jpg";
const portalExpertImg = "/marketing-assets/portal-expert.jpg";
const portalAdminImg = "/marketing-assets/portal-admin.jpg";

const TechSection = () => {
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const techStack = [
    {
      icon: Smartphone,
      title: "Mobile-First Platform",
      description: "Progressive Web App accessible on any device — no app store downloads required.",
      color: "brand"
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Scalable cloud architecture designed to handle millions of concurrent users.",
      color: "lavender"
    },
    {
      icon: Database,
      title: "Secure Data Storage",
      description: "Encrypted health records with role-based access for parents, schools, and experts.",
      color: "coral"
    },
    {
      icon: Lock,
      title: "Privacy by Design",
      description: "Data minimization principles with parent-controlled consent mechanisms.",
      color: "brand"
    }
  ];

  const loginPortals = [
    { icon: User, label: "Parents", color: "brand", image: portalParentImg },
    { icon: GraduationCap, label: "School", color: "lavender", image: portalSchoolImg },
    { icon: Shield, label: "Admin & Staff", color: "mint", image: portalAdminImg },
    { icon: Stethoscope, label: "Experts", color: "coral", image: portalExpertImg }
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    brand: { bg: "bg-brand/10", text: "text-brand" },
    mint: { bg: "bg-mint/10", text: "text-mint" },
    lavender: { bg: "bg-lavender/10", text: "text-lavender" },
    coral: { bg: "bg-coral/10", text: "text-coral" },
    sunshine: { bg: "bg-sunshine/10", text: "text-sunshine" }
  };

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-lavender/20 text-lavender px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Cloud className="w-4 h-4" />
            Technology
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Built for Scale & Security
          </h2>
          <p className="text-lg text-muted-foreground">
            Our technology platform is designed to deliver preventive health insights at scale while maintaining the highest standards of data privacy.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto items-center">
          {/* Tech Cards - Left Side */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-5">
            {techStack.map((item, index) => {
              const colors = colorClasses[item.color];
              return (
                <Card key={index} className="h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <item.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Health Passport Mockup - Right Side */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm">
              <HealthPassportMockup />
            </div>
          </div>
        </div>

        {/* Login Portals Row */}
        <div className="mt-10 max-w-7xl mx-auto">
          <p className="text-sm text-muted-foreground text-center mb-4">Role-Based Access Portals</p>
          <div className="flex flex-wrap justify-center gap-3">
            {loginPortals.map((portal, index) => {
              const colors = colorClasses[portal.color];
              const isSelected = selectedPortal === portal.label;
              return (
                <button
                  key={index}
                  onClick={() => portal.image && setSelectedPortal(isSelected ? null : portal.label)}
                  className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full ${colors.bg} border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isSelected ? "ring-2 ring-offset-2 ring-brand border-transparent" : "border-border hover:border-transparent"
                  } ${portal.image ? "cursor-pointer" : "cursor-default"}`}
                  style={{ 
                    transitionDelay: `${index * 50}ms`
                  }}
                >
                  <portal.icon className={`w-5 h-5 ${colors.text} transition-transform duration-300`} />
                  <span className="text-base font-medium text-foreground">{portal.label}</span>
                </button>
              );
            })}
          </div>

          {/* Portal Screenshot Display */}
          {selectedPortal && (
            <div className="mt-8 animate-fade-in">
              <Card className="overflow-hidden border-2 border-brand/20 shadow-xl max-w-4xl mx-auto relative">
                <button
                  onClick={() => setSelectedPortal(null)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                  aria-label="Close screenshot"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
                <CardContent className="p-0">
                  <img 
                    src={loginPortals.find(p => p.label === selectedPortal)?.image || ""} 
                    alt={`${selectedPortal} Portal Screenshot`}
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
              <p className="text-center text-sm text-muted-foreground mt-3">
                {selectedPortal} Portal Dashboard
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TechSection;

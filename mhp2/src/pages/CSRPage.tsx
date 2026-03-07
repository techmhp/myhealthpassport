import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  ArrowRight,
  Mail,
  Activity,
  Utensils,
  Brain,
  Eye,
  SmilePlus,
  FlaskConical,
  Users,
  School,
  Target,
  CheckCircle,
  Sparkles,
  Shield,
  TrendingUp,
  Building2,
  FileText
} from "lucide-react";
import logo from "@/assets/logo.png";
import AnimatedSection from "@/components/AnimatedSection";
import TwoPhaseModelSection from "@/components/csr/TwoPhaseModelSection";
import HealthPassportMockup from "@/components/HealthPassportMockup";
import ImpactCalculator from "@/components/csr/ImpactCalculator";
import CSRPartnerDialog from "@/components/csr/CSRPartnerDialog";

const screeningPillars = [
  {
    icon: Activity,
    title: "Physical Screening",
    stat: "1 in 3",
    description: "children are overweight, obese, or physically inactive",
    impact: "Early detection prevents lifestyle diseases, improves academic performance, and builds healthy habits for life.",
    color: "brand"
  },
  {
    icon: Utensils,
    title: "Nutrition Assessment",
    stat: "60-70%",
    description: "children have nutrition gaps affecting energy and focus",
    impact: "Identifies deficiencies in iron, vitamin D, B12 and other critical nutrients before they impact development.",
    color: "mint"
  },
  {
    icon: Brain,
    title: "Emotional & Developmental",
    stat: "20-25%",
    description: "children experience mental wellbeing challenges",
    impact: "Spots early signs of anxiety, attention difficulties, or confidence issues when intervention is most effective.",
    color: "lavender"
  },
  {
    icon: Eye,
    title: "Vision Screening",
    stat: "1 in 4",
    description: "school-age children have undetected vision issues",
    impact: "Prevents learning difficulties caused by vision problems that often go unnoticed in classroom settings.",
    color: "coral"
  },
  {
    icon: SmilePlus,
    title: "Dental Screening",
    stat: "45-55%",
    description: "children show signs of dental problems",
    impact: "Early dental care prevents pain, infection, and the cascade of health issues from poor oral health.",
    color: "brand"
  },
  {
    icon: FlaskConical,
    title: "Lab & Biomarkers",
    stat: "30-40%",
    description: "children show abnormalities in routine lab markers",
    impact: "Catches nutritional deficiencies and health markers before they manifest as visible symptoms.",
    color: "mint"
  }
];

const csrBenefits = [
  {
    icon: Users,
    title: "Direct Child Impact",
    description: "Every rupee directly funds screenings for underprivileged children who would otherwise have no access to preventive healthcare."
  },
  {
    icon: School,
    title: "School Partnerships",
    description: "Partner with government and low-income private schools to bring comprehensive health screenings to underserved communities."
  },
  {
    icon: Target,
    title: "Measurable Outcomes",
    description: "Detailed reporting with number of children screened, issues identified, and interventions recommended—full transparency for your CSR reports."
  },
  {
    icon: FileText,
    title: "Section 135 Compliant",
    description: "All programs are structured to meet CSR compliance requirements under the Companies Act, 2013."
  }
];

const CSRPage = () => {
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const scrollToContact = () => {
    document.getElementById('csr-contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-soft">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="mb-8">
            <img src={logo} alt="My Health Passport" className="h-20 md:h-24 mx-auto mix-blend-multiply" />
          </div>
          <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Heart className="w-4 h-4" />
            Corporate Social Responsibility
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Invest in{" "}
            <span className="text-gradient-hero">Children's Health</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6">
            Partner with My Health Passport to bring preventive health screenings to underprivileged children. 
            Early detection. Lasting impact. Measurable outcomes.
          </p>
          
          {/* Highlighted Tagline */}
          <div className="inline-block bg-gradient-to-r from-brand/10 via-mint/10 to-brand/10 border border-brand/30 rounded-2xl px-6 py-4 mb-8">
            <p className="text-xl sm:text-2xl font-extrabold text-gradient-hero">
              ✨ A Healthier Child is a Happier One ✨
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-glow" onClick={() => setPartnerDialogOpen(true)}>
              Partner With Us
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>


      {/* Impact Calculator */}
      <ImpactCalculator />
      {/* The 6 Pillars of Screening */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Comprehensive Screening
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              6 Pillars of{" "}
              <span className="text-gradient-hero">Child Health Screening</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our evidence-based framework covers every critical aspect of a child's health and development.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screeningPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <AnimatedSection key={index} delay={index * 100}>
                  <Card className="h-full border-border hover:border-brand/30 transition-all duration-300 hover:shadow-card group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                          <Icon className="w-6 h-6 text-brand" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">{pillar.title}</h3>
                          <div className="text-2xl font-extrabold text-brand">{pillar.stat}</div>
                          <p className="text-sm text-muted-foreground">{pillar.description}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-foreground leading-relaxed">
                          <span className="font-semibold text-brand">Impact:</span> {pillar.impact}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why CSR in Child Health */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 bg-mint/10 text-mint px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Shield className="w-4 h-4" />
                Why Child Health?
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
                Prevention Today,{" "}
                <span className="text-gradient-hero">Healthy Tomorrow</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Investing in preventive child health is the most cost-effective intervention for long-term societal impact. 
                Early detection of health issues leads to:
              </p>
              <ul className="space-y-4">
                {[
                  "Better academic performance and school attendance",
                  "Reduced healthcare costs in adolescence and adulthood",
                  "Improved mental health and emotional resilience",
                  "Breaking the cycle of poverty through better health outcomes"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="max-w-sm mx-auto lg:max-w-md">
                <HealthPassportMockup />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Two-Phase Model */}
      <TwoPhaseModelSection />

      {/* Partnership Models */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-lavender/10 text-lavender px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Building2 className="w-4 h-4" />
              Partnership Models
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Flexible{" "}
              <span className="text-gradient-hero">CSR Partnerships</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose a partnership model that aligns with your CSR goals and budget.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <AnimatedSection>
              <Card className="h-full border-2 border-brand shadow-glow relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <School className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">School Adoption</h3>
                  <p className="text-3xl font-extrabold text-brand mb-2">₹2.5L+</p>
                  <p className="text-sm text-muted-foreground mb-6">per school / year</p>
                  <ul className="text-left space-y-3 mb-6">
                    {[
                      "Full 6-pillar screening for all students",
                      "Individual Health Passport for each child",
                      "Parent counseling sessions",
                      "Quarterly progress reports",
                      "Dedicated program coordinator"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => setPartnerDialogOpen(true)}>Partner With Us</Button>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <Card className="h-full border-2 border-border hover:border-brand/30 transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Custom Program</h3>
                  <p className="text-3xl font-extrabold text-brand mb-2">Tailored</p>
                  <p className="text-sm text-muted-foreground mb-6">designed around your CSR vision</p>
                  <ul className="text-left space-y-3 mb-6">
                    {[
                      "Flexible scope, schools & budget",
                      "Choose specific health focus areas",
                      "Co-branded impact campaigns",
                      "Employee volunteering opportunities",
                      "Dedicated CSR impact dashboard"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => setPartnerDialogOpen(true)}>Partner With Us</Button>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="csr-contact" className="py-16 lg:py-24 bg-gradient-to-br from-brand/10 to-lavender/10">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-brand/20">
            <CardContent className="p-8 lg:p-12 text-center">
              <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's discuss how your CSR investment can transform children's health outcomes.
              </p>
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-glow" onClick={() => setPartnerDialogOpen(true)}>
                Partner With Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            All CSR programs are compliant with Section 135 of the Companies Act, 2013.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} My Health Passport. All rights reserved.
          </p>
        </div>
      </footer>
      <CSRPartnerDialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen} />
    </div>
  );
};

export default CSRPage;

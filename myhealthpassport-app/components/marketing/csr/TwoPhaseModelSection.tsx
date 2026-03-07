'use client';
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Utensils,
  Brain,
  Eye,
  SmilePlus,
  FileText,
  Building2,
  Users,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import AnimatedSection from "@/components/marketing/AnimatedSection";

const screeningPillars = [
  {
    icon: Utensils,
    title: "Nutrition Screening",
    description: "Growth, BMI-for-age, deficiency risk",
  },
  {
    icon: Brain,
    title: "Psychological Screening",
    description: "Emotional, behavioural & developmental indicators",
  },
  {
    icon: Eye,
    title: "Vision Screening",
    description: "AR-based early vision risk detection",
  },
  {
    icon: SmilePlus,
    title: "Dental Screening",
    description: "Oral health & cavity identification",
  },
  {
    icon: FileText,
    title: "Integrated Health Report",
    description: "Risk stratification & next-step guidance",
  },
];

const interventionPathways = [
  {
    icon: Eye,
    title: "Vision Referrals",
    description: "Partner eye hospitals",
  },
  {
    icon: SmilePlus,
    title: "Dental Care",
    description: "Partnered dental institutions",
  },
  {
    icon: Utensils,
    title: "Nutrition Counselling",
    description: "Low-cost, practical parent guidance",
  },
  {
    icon: Users,
    title: "Psychological Support",
    description: "Group-based intervention for children & parents",
  },
];

const TwoPhaseModelSection = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <HeartHandshake className="w-4 h-4" />
            Implementation Framework
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            CSR Child Health Program:{" "}
            <span className="text-gradient-hero">Two-Phase Model</span>
          </h2>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* PART 1: Screening */}
          <AnimatedSection>
            <Card className="h-full border-2 border-brand/20 bg-brand/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-brand">
                    Comprehensive Health Screening
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6 ml-13">
                  Identification, Risk Mapping & Baseline Creation
                </p>

                <div className="space-y-4">
                  {screeningPillars.map((pillar, index) => {
                    const Icon = pillar.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-background rounded-lg p-3"
                      >
                        <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{pillar.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {pillar.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-brand/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Objective:</span>{" "}
                    Early, non-invasive, evidence-based screening to uncover hidden
                    health risks and create a measurable baseline.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* PART 2: Intervention */}
          <AnimatedSection delay={200}>
            <Card className="h-full border-2 border-mint/20 bg-mint/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-mint">
                    Structured Intervention & Referral
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6 ml-13">
                  Action, Support & Outcome Improvement
                </p>

                <div className="space-y-4">
                  {interventionPathways.map((pathway, index) => {
                    const Icon = pathway.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-background rounded-lg p-3"
                      >
                        <div className="w-9 h-9 bg-mint/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-mint" />
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-mint flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-sm">{pathway.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {pathway.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-mint/20">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <span className="text-brand">Early Detection</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-mint">Timely Care</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-coral">Measurable Impact</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lavender">Scalable CSR</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default TwoPhaseModelSection;

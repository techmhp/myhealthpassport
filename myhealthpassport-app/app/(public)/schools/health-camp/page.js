'use client';

import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  BookOpen,
  Building2,
  Users,
  ClipboardList,
  Handshake,
  CheckCircle,
  Ban,
  Search
} from "lucide-react";

const HealthCampPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/schools" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Schools
          </Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-mint/10 text-mint px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Search className="w-4 h-4" />
              Health Camp Model
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Short-Term, On-Campus{" "}
              <span className="text-gradient-hero">Screening Camps</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              A structured, time-bound school health screening initiative designed to quickly identify risks and guide families toward the right next steps.
            </p>
          </div>
        </section>

        {/* SECTION 1 — CORE INTENT */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Rapid Health Visibility for the School Community
            </h2>
            <p className="text-lg text-muted-foreground">
              The Health Camp Model enables schools to screen a large number of students within a short timeframe — helping identify concerns early while keeping academic disruption minimal.
            </p>
          </div>
        </section>

        {/* SECTION 2 — VALUE PROPOSITION */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="bg-mint/5 border-mint/20 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-mint/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-mint" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Fast, Comprehensive Screening</h3>
                  <p className="text-muted-foreground">Quick visibility across key child health domains</p>
                </CardContent>
              </Card>

              <Card className="bg-brand/5 border-brand/20 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Minimal Academic Disruption</h3>
                  <p className="text-muted-foreground">Designed to fit smoothly into school schedules</p>
                </CardContent>
              </Card>

              <Card className="bg-lavender/5 border-lavender/20 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-lavender/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-lavender" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ideal for First-Time or Annual Engagements</h3>
                  <p className="text-muted-foreground">Suitable for new partnerships or yearly health audits</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 3 — WHAT MAKES THIS MODEL DIFFERENT */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                What Makes This Model Different
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-coral" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Entire Team On Campus</h3>
                  <p className="text-muted-foreground">Multidisciplinary specialists deployed together</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-mint" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Standardised Protocols</h3>
                  <p className="text-muted-foreground">Consistent, school-safe screening approach</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Handshake className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Flexible Engagement Model</h3>
                  <p className="text-muted-foreground">Can be relationship-led or pricing-based</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 4 — WHAT THE CAMP INCLUDES */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                What the Camp Includes
              </h2>
            </div>

            <Card className="max-w-3xl mx-auto">
              <CardContent className="p-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-mint rounded-full shrink-0" />
                    On-campus screening using smart tools
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-mint rounded-full shrink-0" />
                    Nutrition, psychology, dental & vision checks
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-mint rounded-full shrink-0" />
                    Integrated review by the MHP team
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-mint rounded-full shrink-0" />
                    Clear, parent-friendly screening reports
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground sm:col-span-2">
                    <div className="w-2 h-2 bg-mint rounded-full shrink-0" />
                    Guided referrals to MHP flagship centre (if required)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 5 — EXPERIENCE PROMISE */}
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Quick. Non-Invasive. Reassuring.
            </h2>
            <p className="text-lg text-muted-foreground">
              Children and parents experience the camp as calm and supportive — with clear communication and well-defined next steps.
            </p>
          </div>
        </section>

        {/* SECTION 6 — WHAT THIS IS / IS NOT */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-mint/5 border-mint/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 text-mint">This Is</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-mint shrink-0" />
                      A structured, time-bound screening initiative
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-mint shrink-0" />
                      A fast way to identify risks and guide families
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-coral/5 border-coral/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 text-coral">This Is Not</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Ban className="w-5 h-5 text-coral shrink-0" />
                      Ongoing on-campus care
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Ban className="w-5 h-5 text-coral shrink-0" />
                      Treatment or therapy
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 7 — CTA */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-mint/10 to-brand/10 border-mint/20">
              <CardContent className="p-8 lg:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
                  Ready to Screen Your Students?
                </h2>
                <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow mb-4">
                  Plan a Health Camp for Your School
                </Button>
                <p className="text-muted-foreground">
                  <Button variant="link" className="text-muted-foreground">
                    Discuss Camp Options
                  </Button>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HealthCampPage;

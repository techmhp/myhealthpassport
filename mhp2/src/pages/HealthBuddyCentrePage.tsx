import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Building2, 
  Brain, 
  Users, 
  BarChart3,
  RefreshCw,
  Puzzle,
  TrendingUp,
  Apple,
  Target,
  Handshake,
  CheckCircle,
  Ban
} from "lucide-react";

const HealthBuddyCentrePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/schools" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Schools
          </Link>
        </div>
      </header>

      <main>
        {/* SECTION 1 — HERO */}
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-coral/10 text-coral px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Building2 className="w-4 h-4" />
              MHP Health Buddy Centre
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              A Year-Long Preventive Health Presence{" "}
              <span className="text-gradient-hero">Inside Your School</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              The MHP Health Buddy Centre embeds a familiar, multidisciplinary health team on campus — enabling early identification, monitoring, and calm next steps without disrupting academics or burdening parents.
            </p>
          </div>
        </section>

        {/* SECTION 2 — WHAT IS THE HEALTH BUDDY CENTRE */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
              {/* Left - Text */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
                  What Is the MHP Health Buddy Centre?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  A structured, year-long, on-campus preventive health unit that supports students, parents, and teachers through early identification and continuous monitoring — not referrals or alarms.
                </p>
                
                <div>
                  <h3 className="text-xl font-bold mb-4">Key Principles</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-brand rounded-full shrink-0" />
                      Preventive, not reactive
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-brand rounded-full shrink-0" />
                      Child-first and non-alarming
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-brand rounded-full shrink-0" />
                      Parent consent–driven
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-brand rounded-full shrink-0" />
                      School-safe and non-clinical
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right - Icon Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-brand/5 border-brand/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-7 h-7 text-brand" />
                    </div>
                    <p className="font-semibold">Year-long on-campus presence</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-lavender/5 border-lavender/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-lavender/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-7 h-7 text-lavender" />
                    </div>
                    <p className="font-semibold">Early identification & monitoring</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-mint/5 border-mint/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-mint/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-7 h-7 text-mint" />
                    </div>
                    <p className="font-semibold">Parent coordination handled by MHP</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-coral/5 border-coral/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-coral/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-7 h-7 text-coral" />
                    </div>
                    <p className="font-semibold">Structured health insights (not diagnosis)</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — CHOOSE YOUR MODEL */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Two Health Buddy Centre Models
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose based on your school's depth, footprint, and vision.
              </p>
            </div>

            <div className="space-y-16 max-w-6xl mx-auto">
              {/* MODEL 1A — EXTENSIVE */}
              <div className="space-y-8">
                <div className="text-center">
                  <span className="inline-block bg-coral/10 text-coral px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    Year-long | Multidisciplinary
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold">Extensive Health Buddy Centre</h3>
                  <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    A comprehensive, multidisciplinary preventive health system embedded within the school for the entire academic year.
                  </p>
                </div>

                {/* Value - 2 Column */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-brand/5 border-brand/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-brand">For Schools</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Year-long preventive health partner
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Reduced learning disruption due to unmanaged health issues
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Strong parent trust and differentiation
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Structured health reporting & continuity
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-lavender/5 border-lavender/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-lavender">For Parents</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                          One trusted, coordinated health touchpoint
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                          Early identification before escalation
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                          Seamless transition to MHP flagship centre if required
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* What Makes This Unique - Cards */}
                <div>
                  <h4 className="text-lg font-bold mb-4 text-center">What Makes This Unique</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <RefreshCw className="w-6 h-6 text-coral mx-auto mb-2" />
                        <p className="text-sm font-medium">Continuous presence (not episodic camps)</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Puzzle className="w-6 h-6 text-coral mx-auto mb-2" />
                        <p className="text-sm font-medium">Multidisciplinary screening in one system</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <TrendingUp className="w-6 h-6 text-coral mx-auto mb-2" />
                        <p className="text-sm font-medium">Longitudinal tracking over the year</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <div className="flex justify-center gap-1 mb-2">
                          <Apple className="w-5 h-5 text-coral" />
                          <Brain className="w-5 h-5 text-coral" />
                        </div>
                        <p className="text-sm font-medium">Nutrition + psychology lead integration</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Included in This Model */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-bold mb-4">Included in This Model</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-coral rounded-full" />
                        On-campus presence throughout the academic year
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-coral rounded-full" />
                        Nutrition, psychology, dental & vision screening
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-coral rounded-full" />
                        Allied specialists available on-demand
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-coral rounded-full" />
                        Integrated reporting & parent discussions
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-coral rounded-full" />
                        In-school consultations for identified concerns
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-coral rounded-full" />
                        Escalation to flagship centre when required
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What This Is / Is Not */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-mint/5 border-mint/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-mint">This Is</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-mint shrink-0" />
                          A full-time preventive health unit
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-mint shrink-0" />
                          Child-first, data-driven, non-alarming
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-coral/5 border-coral/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-coral">This Is Not</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <Ban className="w-5 h-5 text-coral shrink-0" />
                          Emergency or hospital care
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <Ban className="w-5 h-5 text-coral shrink-0" />
                          Mass diagnosis
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <Ban className="w-5 h-5 text-coral shrink-0" />
                          A one-day event
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* MODEL 1B — COMPACT */}
              <div className="space-y-8">
                <div className="text-center">
                  <span className="inline-block bg-mint/10 text-mint px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    Year-long | Focused
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold">Compact Health Buddy Centre</h3>
                  <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    A focused, lightweight on-campus model addressing the most common and high-impact child health concerns — nutrition, emotional wellbeing, and development.
                  </p>
                </div>

                {/* Value - 2 Column */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-brand/5 border-brand/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-brand">For Schools</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Maximum impact with minimal footprint
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Cost-efficient and scalable
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          Strong early-identification capability
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-lavender/5 border-lavender/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-lavender">For Parents</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                          Familiar, trusted on-campus team
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                          Clarity without fear
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                          Calm guidance, not escalation
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* What Makes This Unique - Cards */}
                <div>
                  <h4 className="text-lg font-bold mb-4 text-center">What Makes This Unique</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Target className="w-6 h-6 text-mint mx-auto mb-2" />
                        <p className="text-sm font-medium">Focused, not diluted</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <div className="flex justify-center gap-1 mb-2">
                          <Apple className="w-5 h-5 text-mint" />
                          <Brain className="w-5 h-5 text-mint" />
                        </div>
                        <p className="text-sm font-medium">Nutrition & psychology integrated from day one</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Handshake className="w-6 h-6 text-mint mx-auto mb-2" />
                        <p className="text-sm font-medium">Trust builds through familiarity</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <BarChart3 className="w-6 h-6 text-mint mx-auto mb-2" />
                        <p className="text-sm font-medium">Clear insights without overload</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Included in This Model */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-bold mb-4">Included in This Model</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-mint rounded-full" />
                        Year-long on-campus presence
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-mint rounded-full" />
                        Smart scale nutrition screening
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-mint rounded-full" />
                        Developmental & emotional wellbeing screening
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-mint rounded-full" />
                        Integrated nutrition–psychology reports
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-mint rounded-full" />
                        In-school or flagship consultations (if required)
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What This Is / Is Not */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-mint/5 border-mint/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-mint">This Is</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-mint shrink-0" />
                          A preventive nutrition & mental wellbeing unit
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-mint shrink-0" />
                          Continuous, school-aligned support
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-coral/5 border-coral/20">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-coral">This Is Not</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <Ban className="w-5 h-5 text-coral shrink-0" />
                          Therapy
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground">
                          <Ban className="w-5 h-5 text-coral shrink-0" />
                          Academic counselling
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — EXPERIENCE PROMISE */}
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              A Calm, Reassuring Experience for Families
            </h2>
            <p className="text-lg text-muted-foreground">
              Parents and children feel safe, supported, and reassured — knowing health concerns are identified early and handled calmly by a familiar team, without pressure or labels.
            </p>
          </div>
        </section>

        {/* SECTION 5 — FINAL CTA */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-coral/10 to-brand/10 border-coral/20">
              <CardContent className="p-8 lg:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
                  Ready to Bring Health Buddy Centre to Your School?
                </h2>
                <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow mb-4">
                  👉 Discuss Health Buddy Centre for Your School
                </Button>
                <p className="text-muted-foreground mb-2">
                  <Button variant="link" className="text-muted-foreground">
                    Request a School Discovery Call
                  </Button>
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Preventive. Structured. Child-first.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HealthBuddyCentrePage;

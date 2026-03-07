import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  Handshake,
} from "lucide-react";
import WellnessJourneySection from "@/components/WellnessJourneySection";
import SchoolProgramsGrid from "@/components/school/SchoolProgramsGrid";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";

const SchoolPage = () => {
  const [meetingOpen, setMeetingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main>
        {/* SECTION 1 — SCHOOL HERO */}
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="text-xl">🏫</span>
              For Schools
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              A Preventive Health Framework{" "}
              <span className="text-gradient-hero">for Schools</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              My Health Passport partners with schools to enable early identification, awareness, and structured health support.
            </p>
            <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" onClick={() => setMeetingOpen(true)}>
              👉 Partner With MHP
            </Button>
          </div>
        </section>

        {/* SECTION 2 — PROGRAMS BENTO GRID */}
        <SchoolProgramsGrid />

        {/* SECTION 5 — EMPOWERING TEACHERS */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                Supporting Teachers Without Medical Burden
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">👀 What to Observe</h3>
                  <p className="text-muted-foreground">Age-appropriate vs concerning patterns</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-lavender/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-lavender" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">🧠 Teacher Wellbeing</h3>
                  <p className="text-muted-foreground">Stress, burnout, emotional load (with Buddy Centre)</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Handshake className="w-8 h-8 text-mint" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">🤝 Clear Escalation Path</h3>
                  <p className="text-muted-foreground">When and how concerns move to MHP</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 7 — WELLNESS JOURNEY */}
        <WellnessJourneySection variant="school" />

        {/* SECTION 8 — FINAL SCHOOL CTA */}
        <section className="sticky bottom-0 bg-card/95 backdrop-blur-lg border-t border-border py-3 sm:py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Preventive. Structured. Child-first.
              </p>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <a href="https://wa.me/917793925151" target="_blank" rel="noopener noreferrer">
                  <Button variant="link" className="text-muted-foreground text-xs sm:text-sm hidden sm:inline-flex">
                    Request a School Discovery Call
                  </Button>
                </a>
                <Button size="lg" className="rounded-xl shadow-glow w-full sm:w-auto text-sm sm:text-base" onClick={() => setMeetingOpen(true)}>
                  👉 Partner With MHP
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ScheduleMeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} />
    </div>
  );
};

export default SchoolPage;

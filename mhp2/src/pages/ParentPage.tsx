import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, School, UserCheck, FlaskConical, FileSearch, LayoutDashboard, Video } from "lucide-react";
import { useState } from "react";
import TalkToTeamDialog from "@/components/TalkToTeamDialog";
import BookScreeningDialog from "@/components/BookScreeningDialog";
import AnimatedSection from "@/components/AnimatedSection";
import CareProgramsSection from "@/components/parent/CareProgramsSection";
import ConcernCardsSection from "@/components/parent/ConcernCardsSection";

const howItWorksSteps = [
  {
    icon: School,
    title: "Book Appointment",
    description: "Choose a convenient slot to visit the MHP Centre.",
    color: "bg-brand",
  },
  {
    icon: UserCheck,
    title: "Profile Creation & Consent",
    description: "Create your child's secure health profile with informed parent consent.",
    color: "bg-mint",
  },
  {
    icon: FlaskConical,
    title: "Lab Coordination (if required)",
    description: "Lab tests are coordinated only when needed, with clear guidance.",
    color: "bg-coral",
  },
  {
    icon: FileSearch,
    title: "Centre Visit & Screening",
    description: "Your child goes through a calm, child-friendly screening experience.",
    color: "bg-lavender",
  },
  {
    icon: LayoutDashboard,
    title: "Report Generation",
    description: "All findings are combined into one clear, parent-friendly health summary.",
    color: "bg-sunshine",
  },
  {
    icon: Video,
    title: "Consultations & Support",
    description: "Discuss results, get guidance, and plan next steps only if required.",
    color: "bg-brand",
  },
];



const ParentPage = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);

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
        {/* SECTION 1 — HERO */}
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Understand Your Child's Health —{" "}
              <span className="text-gradient-hero">Calmly and Clearly</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              A comprehensive health screening at the MHP Centre to help parents gain clarity before choosing any support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" asChild>
                <a href="#programs">
                  📋 Explore Our Programs
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl" onClick={() => setTalkOpen(true)}>
                👉 Talk to Our Team
              </Button>
            </div>
          </div>
        </section>



        {/* SECTION — CARE PROGRAMS */}
        <CareProgramsSection />

        {/* SECTION 7 — FINAL CTA */}
        {/* SECTION — DIRECT SUPPORT */}
        <ConcernCardsSection onTalkToTeam={() => setTalkOpen(true)} />
        <TalkToTeamDialog open={talkOpen} onOpenChange={setTalkOpen} />

        {/* SECTION 7 — FINAL CTA */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" onClick={() => setBookingOpen(true)}>
                👉 Book Passport Screening
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl" onClick={() => setTalkOpen(true)}>
                👉 Talk to Our Team
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Screening first. Decisions next. Support only if needed.
            </p>
          </div>
        </section>
        <BookScreeningDialog open={bookingOpen} onOpenChange={setBookingOpen} />
      </main>
    </div>
  );
};

export default ParentPage;

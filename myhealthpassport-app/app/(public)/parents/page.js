'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { ArrowLeft, School, UserCheck, FlaskConical, FileSearch, LayoutDashboard, Video } from 'lucide-react';
import TalkToTeamDialog from '@/components/marketing/TalkToTeamDialog';
import BookScreeningDialog from '@/components/marketing/BookScreeningDialog';
import AnimatedSection from '@/components/marketing/AnimatedSection';
import CareProgramsSection from '@/components/marketing/parent/CareProgramsSection';
import ConcernCardsSection from '@/components/marketing/parent/ConcernCardsSection';

export default function ParentPage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main>
        <section className="py-16 lg:py-24 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Understand Your Child&apos;s Health —{" "}
              <span className="text-gradient-hero">Calmly and Clearly</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              A comprehensive health screening at the MHP Centre to help parents gain clarity before choosing any support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" asChild>
                <a href="#programs">
                  Explore Our Programs
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl" onClick={() => setTalkOpen(true)}>
                Talk to Our Team
              </Button>
            </div>
          </div>
        </section>

        <CareProgramsSection />
        <ConcernCardsSection onTalkToTeam={() => setTalkOpen(true)} />
        <TalkToTeamDialog open={talkOpen} onOpenChange={setTalkOpen} />

        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" onClick={() => setBookingOpen(true)}>
                Book Passport Screening
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl" onClick={() => setTalkOpen(true)}>
                Talk to Our Team
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
}

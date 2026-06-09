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
              Understand Your Child&apos;s Health Clearly with{" "}
              <span className="text-gradient-hero">Pediatric Health Screening</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              A comprehensive pediatric health screening at the MHP Centre to help parents gain clarity before choosing the right support for their child&apos;s physical, emotional, nutritional, and developmental wellbeing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" asChild>
                <a href="#programs">
                  Explore Our Programs
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-colors" onClick={() => setTalkOpen(true)}>
                Talk to Our Team
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Helping families make informed decisions through compassionate preventive healthcare for children and early wellness support.
            </p>
          </div>
        </section>

        <CareProgramsSection />
        <ConcernCardsSection onTalkToTeam={() => setTalkOpen(true)} />

        {/* FAQ Section */}
        <section className="py-16 lg:py-20 bg-gradient-soft">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "What is included in pediatric health screening?",
                  a: "A complete pediatric health screening may include physical assessments, developmental evaluations, emotional wellbeing reviews, nutrition analysis, vision and dental screening, and health reporting.",
                },
                {
                  q: "How does a child wellness program help children?",
                  a: "A structured child wellness program helps track growth, emotional health, nutrition, learning development, and overall wellbeing through continuous monitoring and expert guidance.",
                },
                {
                  q: "Why is developmental screening important for children?",
                  a: "Developmental screening for children helps identify delays in learning, communication, motor skills, and behaviour early so that timely support and intervention can be provided.",
                },
                {
                  q: "What is a digital health passport for kids?",
                  a: "A digital health passport for kids securely stores child health records, screening reports, wellness tracking, and progress updates for parents and healthcare professionals.",
                },
                {
                  q: "Where can parents find pediatric services in Hyderabad?",
                  a: "Parents looking for trusted pediatric services in Hyderabad can access child health screening, emotional wellness support, nutrition guidance, and developmental care programs through MHP.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-bold text-base mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Designed for families seeking trusted pediatric services in Hyderabad and holistic child wellness support under one care system.
            </p>
          </div>
        </section>

        <TalkToTeamDialog open={talkOpen} onOpenChange={setTalkOpen} />

        <section className="pt-24 pb-16 lg:pt-32 lg:pb-20 bg-gradient-soft">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" onClick={() => setBookingOpen(true)}>
                👉 Book Passport Screening
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-colors" onClick={() => setTalkOpen(true)}>
                👉 Talk to Our Team
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" style={{ marginTop: '2rem' }}>
              Screening first. Decisions next. Support only if needed.
            </p>
          </div>
        </section>
        <BookScreeningDialog open={bookingOpen} onOpenChange={setBookingOpen} />
      </main>
    </div>
  );
}

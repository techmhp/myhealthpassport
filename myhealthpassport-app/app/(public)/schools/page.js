'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import { ArrowLeft, Eye, Heart, Handshake } from 'lucide-react';
import WellnessJourneySection from '@/components/marketing/WellnessJourneySection';
import SchoolProgramsGrid from '@/components/marketing/school/SchoolProgramsGrid';
import ScheduleMeetingDialog from '@/components/marketing/ScheduleMeetingDialog';

export default function SchoolPage() {
  const [meetingOpen, setMeetingOpen] = useState(false);

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
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
              For Schools
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              A Preventive{" "}
              <span className="text-gradient-hero">School Health Checkup Services</span>{" "}
              Framework for Schools
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              My Health Passport partners with schools to enable early identification, awareness, structured wellness systems, and preventive health screening for school children.
            </p>
            <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-glow" onClick={() => setMeetingOpen(true)}>
              Partner With MHP
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              Designed to help institutions implement structured health programs for schools with long-term student wellbeing support.
            </p>
          </div>
        </section>

        <SchoolProgramsGrid />

        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                Supporting Teachers Without Medical Burden
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Helping teachers identify early concerns through structured observation systems without creating pressure, fear, or unnecessary medical labelling.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">What to Observe</h3>
                  <p className="text-muted-foreground">Understanding age-appropriate versus concerning emotional, behavioural, social, and learning-related patterns in students.</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-lavender/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-lavender" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Teacher Wellbeing</h3>
                  <p className="text-muted-foreground">Supporting educators with practical wellbeing strategies, emotional awareness tools, and stress-management support within the school environment.</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Handshake className="w-8 h-8 text-mint" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Clear Escalation Path</h3>
                  <p className="text-muted-foreground">Structured pathways explaining when and how student concerns move from classroom observation to professional MHP guidance and support systems.</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Helping schools strengthen health programs for schools through ethical escalation systems and early intervention support.
            </p>
          </div>
        </section>

        <WellnessJourneySection variant="school" />

        {/* FAQ Section */}
        <section className="py-16 lg:py-20 bg-gradient-soft">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "What are school health checkup services?",
                  a: "School health checkup services include student wellness assessments, emotional wellbeing support, nutrition awareness, eye and dental screening, and preventive healthcare initiatives.",
                },
                {
                  q: "Why is preventive health screening important for school children?",
                  a: "Preventive health screening for school children helps identify physical, emotional, nutritional, and developmental concerns early before they affect learning and wellbeing.",
                },
                {
                  q: "What is included in a school medical checkup?",
                  a: "A school medical checkup may include vision screening, dental assessment, emotional wellbeing observation, nutrition review, and student wellness evaluations.",
                },
                {
                  q: "How do student mental health programs help schools?",
                  a: "Student mental health programs support emotional wellbeing, behavioural awareness, stress management, and early intervention for children facing learning or emotional challenges.",
                },
                {
                  q: "Are school health camps available in Hyderabad?",
                  a: "Yes. Schools looking for structured school health camps and student wellness programs in Hyderabad can partner with MHP for preventive healthcare support.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-bold text-base mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Supporting schools across Hyderabad and India through structured school health camps, emotional wellbeing systems, and preventive student care initiatives.
            </p>
          </div>
        </section>

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
                  Partner With MHP
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ScheduleMeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} />
    </div>
  );
}

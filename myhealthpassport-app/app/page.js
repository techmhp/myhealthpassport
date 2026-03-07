'use client';

import Header from '@/components/marketing/Header';
import Hero from '@/components/marketing/Hero';
import NeedSection from '@/components/marketing/NeedSection';
import PillarsSection from '@/components/marketing/PillarsSection';
import ChildrenStruggleSection from '@/components/marketing/ChildrenStruggleSection';
import SecuritySection from '@/components/marketing/SecuritySection';
import Footer from '@/components/marketing/Footer';
import WhatsAppButton from '@/components/marketing/WhatsAppButton';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <PillarsSection />
        <NeedSection />
        <ChildrenStruggleSection />
        <SecuritySection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

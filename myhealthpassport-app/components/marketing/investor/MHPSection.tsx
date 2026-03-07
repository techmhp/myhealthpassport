'use client';
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { 
  TrendingUp, 
  ArrowRight,
  Mail
} from "lucide-react";
const logo = "/marketing-assets/logo.png";
import TechSection from "@/components/marketing/investor/TechSection";
import BusinessModelSection from "@/components/marketing/investor/BusinessModelSection";
import PitchDeckSection from "@/components/marketing/investor/PitchDeckSection";
import FinancialsSection from "@/components/marketing/investor/FinancialsSection";
import ProductSection from "@/components/marketing/investor/ProductSection";
import VideoSection from "@/components/marketing/investor/VideoSection";

const MHPSection = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-soft">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="mb-8">
            <img src={logo} alt="My Health Passport" className="h-20 md:h-24 mx-auto mix-blend-multiply" />
          </div>
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <TrendingUp className="w-4 h-4" />
            Investor Information
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Building the Future of{" "}
            <span className="text-gradient-hero">Preventive Child Health</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8">
            My Health Passport is creating a scalable, preventive health framework for schools and families — addressing a massive, underserved market.
          </p>
        </div>
      </section>

      {/* Tech Section */}
      <TechSection />

      {/* Business Model Section */}
      <BusinessModelSection />

      {/* Pitch Deck / Market Section */}
      <PitchDeckSection />

      {/* Financial Projections */}
      <FinancialsSection />

      {/* Product & USP */}
      <ProductSection />

      {/* Video Presentation */}
      <VideoSection />

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-brand/10 to-lavender/10">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-brand/20">
            <CardContent className="p-8 lg:p-12 text-center">
              <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
                Download Our Pitch Deck
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get our detailed investor deck and financial projections.
              </p>
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-glow" asChild>
                <a href="/downloads/pitch-deck.pdf" download="My-Health-Passport-Pitch-Deck.pdf">
                  Download Pitch Deck
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            This page is for investor information only and is not part of the public website.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} My Health Passport. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MHPSection;

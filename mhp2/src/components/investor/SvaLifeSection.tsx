import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  ArrowRight,
  Mail
} from "lucide-react";
import svaLogo from "@/assets/sva-life-logo.jpg";
import SvaTechSection from "@/components/investor/svalife/SvaTechSection";
import SvaBusinessModelSection from "@/components/investor/svalife/SvaBusinessModelSection";
import SvaPitchDeckSection from "@/components/investor/svalife/SvaPitchDeckSection";
import SvaFinancialsSection from "@/components/investor/svalife/SvaFinancialsSection";
import SvaProductSection from "@/components/investor/svalife/SvaProductSection";
import SvaVideoSection from "@/components/investor/svalife/SvaVideoSection";

const SvaLifeSection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-200/50 via-cyan-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="mb-6">
            <img 
              src={svaLogo} 
              alt="SVA Life" 
              className="h-20 md:h-24 mx-auto object-contain rounded-xl"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <TrendingUp className="w-4 h-4" />
            Investor Information
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-slate-800">
            Holistic Wellness for{" "}
            <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">
              Modern Life
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            SVA Life delivers comprehensive wellness solutions for adults, combining preventive health, mental wellness, and lifestyle optimization.
          </p>
        </div>
      </section>

      {/* Tech Section */}
      <SvaTechSection />

      {/* Business Model Section */}
      <SvaBusinessModelSection />

      {/* Market & Pitch Deck Section */}
      <SvaPitchDeckSection />

      {/* Financial Projections */}
      <SvaFinancialsSection />

      {/* Product & USP */}
      <SvaProductSection />

      {/* Video Presentation */}
      <SvaVideoSection />

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-cyan-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-slate-800 to-cyan-800 border-0 shadow-xl">
            <CardContent className="p-8 lg:p-12 text-center">
              <div className="w-16 h-16 bg-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-white">
                Partner with SVA Life
              </h2>
              <p className="text-lg text-cyan-100 mb-8">
                Explore investment and partnership opportunities in the adult wellness space.
              </p>
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl bg-white hover:bg-cyan-50 text-slate-800">
                Request Investor Deck
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-cyan-200 bg-cyan-50/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            This page is for investor information only and is not part of the public website.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            © {new Date().getFullYear()} SVA Life. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SvaLifeSection;

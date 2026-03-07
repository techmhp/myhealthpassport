import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import svaLogo from "@/assets/sva-life-logo.jpg";
import MHPSection from "@/components/investor/MHPSection";
import SvaLifeSection from "@/components/investor/SvaLifeSection";

type ActiveSection = "mhp" | "sva";

const InvestorPage = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection | null>(null);

  // Landing page with two choices
  if (!activeSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Investor Portal
            </h1>
            <p className="text-lg text-slate-300">
              Select a venture to explore investment opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* My Health Passport Card */}
            <button
              onClick={() => setActiveSection("mhp")}
              className={cn(
                "group relative overflow-hidden rounded-3xl p-8 lg:p-12 transition-all duration-500",
                "bg-gradient-to-br from-brand/20 via-mint/10 to-lavender/20",
                "border-2 border-brand/30 hover:border-brand/60",
                "hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand/20"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <img src={logo} alt="My Health Passport" className="h-20 object-contain" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">
                  My Health Passport
                </h2>
                <p className="text-slate-300 mb-6">
                  Preventive child health platform for schools and families
                </p>
                <span className="inline-flex items-center gap-2 text-brand font-semibold">
                  Explore →
                </span>
              </div>
            </button>

            {/* SVA Life Card */}
            <button
              onClick={() => setActiveSection("sva")}
              className={cn(
                "group relative overflow-hidden rounded-3xl p-8 lg:p-12 transition-all duration-500",
                "bg-gradient-to-br from-slate-700/40 via-slate-600/30 to-cyan-700/30",
                "border-2 border-cyan-500/30 hover:border-cyan-400/60",
                "hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg overflow-hidden">
                  <img src={svaLogo} alt="SVA Life" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">
                  SVA Life
                </h2>
                <p className="text-slate-300 mb-6">
                  Holistic wellness solutions for adults and corporates
                </p>
                <span className="inline-flex items-center gap-2 text-cyan-400 font-semibold">
                  Explore →
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show selected section with back button
  return (
    <div>
      {/* Fixed Back Button */}
      <button
        onClick={() => setActiveSection(null)}
        className={cn(
          "fixed top-4 left-4 z-50 px-4 py-2 rounded-full font-medium transition-all",
          "backdrop-blur-sm shadow-lg",
          activeSection === "mhp" 
            ? "bg-white/90 text-brand hover:bg-white" 
            : "bg-white/90 text-cyan-700 hover:bg-white border border-cyan-200"
        )}
      >
        ← Back to Portal
      </button>

      {activeSection === "mhp" ? <MHPSection /> : <SvaLifeSection />}
    </div>
  );
};

export default InvestorPage;

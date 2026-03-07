'use client';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { 
  TrendingUp, 
  Target, 
  Award,
  Building2,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

const SvaPitchDeckSection = () => {
  const [currency, setCurrency] = useState<"usd" | "inr">("usd");

  const marketData = {
    usd: {
      tam: { value: "$5.6T", label: "Global Wellness" },
      sam: { value: "$100B", label: "Corporate Wellness" },
      som: { value: "$500M", label: "India Target" },
    },
    inr: {
      tam: { value: "₹467T", label: "Global Wellness" },
      sam: { value: "₹8.3T", label: "Corporate Wellness" },
      som: { value: "₹42B", label: "India Target" },
    },
  };

  const data = marketData[currency];

  const marketDrivers = [
    { icon: Building2, text: "Rising corporate burnout & productivity loss" },
    { icon: Heart, text: "Growing mental health awareness post-COVID" },
    { icon: TrendingUp, text: "15% annual growth in India wellness market" },
    { icon: Award, text: "Shift from reactive to preventive health" },
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-cyan-50/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Target className="w-4 h-4" />
            Market Opportunity
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-800">
            Massive & <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">Growing Market</span>
          </h2>
          <p className="text-lg text-slate-600">
            The corporate wellness industry is projected to reach $100B globally by 2030
          </p>
        </div>

        {/* Market Size */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Market Size</h3>
            <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setCurrency("usd")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                  currency === "usd" 
                    ? "bg-gradient-to-r from-slate-800 to-cyan-700 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency("inr")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                  currency === "inr" 
                    ? "bg-gradient-to-r from-slate-800 to-cyan-700 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                INR
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center border-cyan-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="text-5xl font-extrabold text-cyan-700 mb-2">{data.tam.value}</div>
                <p className="text-sm text-slate-600 font-medium">Total Addressable Market (TAM)</p>
                <p className="text-xs text-slate-500 mt-2">{data.tam.label}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="text-5xl font-extrabold text-slate-700 mb-2">{data.sam.value}</div>
                <p className="text-sm text-slate-600 font-medium">Serviceable Addressable Market (SAM)</p>
                <p className="text-xs text-slate-500 mt-2">{data.sam.label}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-emerald-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="text-5xl font-extrabold text-emerald-600 mb-2">{data.som.value}</div>
                <p className="text-sm text-slate-600 font-medium">Serviceable Obtainable Market (SOM)</p>
                <p className="text-xs text-slate-500 mt-2">{data.som.label}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Drivers */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-center text-slate-800">Key Market Drivers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid sm:grid-cols-2 gap-4">
                {marketDrivers.map((driver, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-lg flex items-center justify-center shrink-0">
                      <driver.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{driver.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SvaPitchDeckSection;

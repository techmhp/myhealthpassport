import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Target, 
  MapPin,
  GraduationCap,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

const PitchDeckSection = () => {
  const [currency, setCurrency] = useState<"usd" | "inr">("usd");

  const marketData = {
    usd: {
      tam: { value: "$103B", label: "103 Billion" },
      sam: { value: "$33B", label: "33 Billion" },
      som: { value: "$410M", label: "410 Million" },
    },
    inr: {
      tam: { value: "₹9.4L Cr", label: "9.4 Lakh Crore" },
      sam: { value: "₹3.1L Cr", label: "3.1 Lakh Crore" },
      som: { value: "₹3,800 Cr", label: "3,800 Crore" },
    },
  };

  const data = marketData[currency];

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-brand/20 text-brand px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Target className="w-4 h-4" />
            Pitch Deck
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Market Opportunity & Growth
          </h2>
        </div>

        {/* Market Size */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <h3 className="text-2xl font-bold">Market Size</h3>
            <div className="inline-flex items-center bg-muted rounded-full p-1">
              <button
                onClick={() => setCurrency("usd")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                  currency === "usd" 
                    ? "bg-brand text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency("inr")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                  currency === "inr" 
                    ? "bg-brand text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                INR
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center border-brand/20">
              <CardContent className="p-8">
                <div className="text-5xl font-extrabold text-brand mb-2">{data.tam.value}</div>
                <p className="text-sm text-muted-foreground font-medium">Total Addressable Market (TAM)</p>
                <p className="text-xs text-muted-foreground mt-2">Indian preventive healthcare for children</p>
              </CardContent>
            </Card>
            <Card className="text-center border-mint/20">
              <CardContent className="p-8">
                <div className="text-5xl font-extrabold text-mint mb-2">{data.sam.value}</div>
                <p className="text-sm text-muted-foreground font-medium">Serviceable Addressable Market (SAM)</p>
                <p className="text-xs text-muted-foreground mt-2">School-based health programs</p>
              </CardContent>
            </Card>
            <Card className="text-center border-coral/20">
              <CardContent className="p-8">
                <div className="text-5xl font-extrabold text-coral mb-2">{data.som.value}</div>
                <p className="text-sm text-muted-foreground font-medium">Serviceable Obtainable Market (SOM)</p>
                <p className="text-xs text-muted-foreground mt-2">5-year target in Tier 1-2 cities</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Growth Potential */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Growth Potential</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-brand mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-foreground mb-1">35%</div>
                <p className="text-xs text-muted-foreground">Annual Growth Rate (Projected)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <GraduationCap className="w-8 h-8 text-mint mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-foreground mb-1">1.5M+</div>
                <p className="text-xs text-muted-foreground">Schools in India</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-lavender mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-foreground mb-1">250M+</div>
                <p className="text-xs text-muted-foreground">School-Age Children</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Building className="w-8 h-8 text-coral mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-foreground mb-1">85%</div>
                <p className="text-xs text-muted-foreground">Schools Without Health Programs</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Target Segment */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Target Segments</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-brand" />
                  </div>
                  Primary Target: Private Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full mt-2 shrink-0" />
                    <span>CBSE, ICSE, and State Board affiliated schools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full mt-2 shrink-0" />
                    <span>Annual fee range: ₹50,000 - ₹3,00,000</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full mt-2 shrink-0" />
                    <span>Student strength: 500-3,000 per school</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full mt-2 shrink-0" />
                    <span>Parents with high health awareness</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-mint/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-mint" />
                  </div>
                  Geographic Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-mint rounded-full mt-2 shrink-0" />
                    <span><strong>Phase 1:</strong> Mumbai, Pune, Bengaluru, Hyderabad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-mint rounded-full mt-2 shrink-0" />
                    <span><strong>Phase 2:</strong> Delhi NCR, Chennai, Kolkata</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-mint rounded-full mt-2 shrink-0" />
                    <span><strong>Phase 3:</strong> Tier 2 cities across India</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-mint rounded-full mt-2 shrink-0" />
                    <span><strong>Phase 4:</strong> Southeast Asia expansion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PitchDeckSection;

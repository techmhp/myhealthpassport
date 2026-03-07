import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, IndianRupee, Target } from "lucide-react";

const SvaFinancialsSection = () => {
  const metrics = [
    {
      icon: IndianRupee,
      label: "Average Revenue Per Client",
      value: "₹75,000",
      sublabel: "Per program",
      color: "cyan"
    },
    {
      icon: Target,
      label: "Average Revenue Per User",
      value: "₹8,000",
      sublabel: "ARPU per client",
      color: "slate"
    },
    {
      icon: Users,
      label: "LTV:CAC Ratio",
      value: "9.4x",
      sublabel: "Industry best: 3x",
      color: "emerald"
    },
    {
      icon: TrendingUp,
      label: "Gross Margin",
      value: "72%",
      sublabel: "Target margin",
      color: "amber"
    }
  ];

  const projections = [
    { year: "Year 1", revenue: "₹1.2Cr", clients: "160", ebitda: "-15%" },
    { year: "Year 2", revenue: "₹4.5Cr", clients: "600", ebitda: "8%" },
    { year: "Year 3", revenue: "₹12Cr", clients: "1,600", ebitda: "22%" },
    { year: "Year 4", revenue: "₹28Cr", clients: "3,700", ebitda: "32%" },
    { year: "Year 5", revenue: "₹55Cr", clients: "7,300", ebitda: "38%" },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-500/20" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-700", border: "border-slate-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/20" },
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-cyan-50/50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            Financial Projections
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-800">
            Strong Unit <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">Economics</span>
          </h2>
          <p className="text-lg text-slate-600">
            Premium positioning with high margins and strong retention
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {metrics.map((metric, index) => {
              const colors = colorClasses[metric.color];
              return (
                <Card key={index} className={`border-2 ${colors.border} hover:shadow-lg transition-all hover:-translate-y-1`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <metric.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{metric.label}</p>
                    <p className={`text-3xl font-extrabold ${colors.text} mb-1`}>{metric.value}</p>
                    <p className="text-xs text-slate-500">{metric.sublabel}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 5-Year Projections Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-cyan-700 text-white">
              <CardTitle className="text-xl font-bold text-center">5-Year Financial Projections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Year</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Revenue</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">Clients</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">EBITDA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projections.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">{row.year}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-cyan-700">{row.revenue}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">{row.clients}</td>
                        <td className={`px-6 py-4 text-center text-sm font-semibold ${row.ebitda.startsWith('-') ? 'text-red-500' : 'text-emerald-600'}`}>
                          {row.ebitda}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SvaFinancialsSection;

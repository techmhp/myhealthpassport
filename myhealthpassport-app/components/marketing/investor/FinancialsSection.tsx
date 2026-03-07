'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { 
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3
} from "lucide-react";

const FinancialsSection = () => {
  const metrics = [
    { label: "Average Revenue Per User (ARPU)", value: "₹2,500", detail: "Per student", trend: "Growing with premium adoption" },
    { label: "Lifetime Value (LTV)", value: "₹6,00,000", detail: "Minimum per School in a year", trend: "30:1 LTV:CAC ratio" },
    { label: "Customer Acquisition Cost (CAC)", value: "₹300", detail: "Per Student", trend: "Industry-leading efficiency" },
    { label: "Gross Margin", value: "72%", detail: "After direct costs", trend: "Target 80%+ at scale" },
  ];

  const projections = [
    { year: "Year 1", revenue: "₹6,50,00,000", schools: "50", students: "25,000" },
    { year: "Year 2", revenue: "₹26,00,00,000", schools: "200", students: "1,00,000" },
    { year: "Year 3", revenue: "₹65,00,00,000", schools: "500", students: "2,50,000" },
    { year: "Year 4", revenue: "₹1,30,00,00,000", schools: "1,000", students: "5,00,000" },
    { year: "Year 5", revenue: "₹2,60,00,00,000", schools: "2,000", students: "10,00,000" },
  ];

  const revenueStreams = [
    { stream: "Comprehensive Health Screening", percentage: 45, description: "Annual licensing for screening programs" },
    { stream: "Parent Premium Subscriptions", percentage: 40, description: "Psychology and Nutrition consultations, Detailed reports, tracking" },
    { stream: "School Partnership Fees", percentage: 15, description: "Annual licensing for School In House Centre" },
  ];

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-coral/20 text-coral px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <BarChart3 className="w-4 h-4" />
            Financial Projections
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Unit Economics & Projections
          </h2>
          <p className="text-lg text-muted-foreground">
            Strong unit economics with a clear path to profitability
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Key Financial Metrics</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {metric.label}
                    </span>
                    <TrendingUp className="w-4 h-4 text-mint" />
                  </div>
                  <div className="text-3xl font-extrabold text-foreground mb-1">
                    {metric.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{metric.detail}</p>
                  <p className="text-xs text-mint mt-2">{metric.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Revenue Projections Table */}
        <div className="max-w-5xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">5-Year Revenue Projections</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Period</TableHead>
                    <TableHead className="font-bold text-right">Revenue</TableHead>
                    <TableHead className="font-bold text-right">Schools</TableHead>
                    <TableHead className="font-bold text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projections.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right font-bold text-brand">{row.revenue}</TableCell>
                      <TableCell className="text-right">{row.schools}</TableCell>
                      <TableCell className="text-right">{row.students}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Streams */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Revenue Streams</h3>
          <div className="space-y-4">
            {revenueStreams.map((stream, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{stream.stream}</span>
                    <span className="text-lg font-extrabold text-brand">{stream.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div 
                      className="bg-brand h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stream.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{stream.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinancialsSection;
